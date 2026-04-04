import base64
import csv
import hashlib
import html
import json
import os
import re
import subprocess
import zipfile
import zlib
from datetime import datetime, timedelta
from io import BytesIO, StringIO
from urllib import error as urllib_error
from urllib import request as urllib_request
import xml.etree.ElementTree as ET


DEFAULT_OLLAMA_MODEL = 'llama3.1:8b'
STRUCTURED_LLAMA_TIMEOUT_SECONDS = 150
BACKGROUND_GEMINI_MODEL = 'gemini-2.5-flash'
BACKGROUND_GEMINI_TIMEOUT_SECONDS = 30
MAX_PROMPT_EVIDENCE_CHARS = 8000
MAX_EXTRACTION_CACHE_ENTRIES = 64
_TEXT_EXTRACTION_CACHE = {}


def _run_ollama_command(prompt, timeout, model_name=DEFAULT_OLLAMA_MODEL):
    return subprocess.run(
        ['ollama', 'run', model_name],
        input=prompt,
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace',
        timeout=timeout,
        check=False,
    )


def _clean_text(value):
    return re.sub(r'\s+', ' ', f'{value or ""}').strip()


def _redact_sensitive_error_text(value):
    cleaned = _clean_text(value)
    if not cleaned:
        return ''
    redacted = re.sub(r'AIza[0-9A-Za-z_-]{20,}', '[REDACTED_API_KEY]', cleaned)
    redacted = re.sub(r'([?&](?:key|api_key)=)[^&\s]+', r'\1[REDACTED_API_KEY]', redacted, flags=re.IGNORECASE)
    redacted = re.sub(r'((?:api[_-]?key|key)\s*[:=]\s*)([^\s,;\'"]+)', r'\1[REDACTED_API_KEY]', redacted, flags=re.IGNORECASE)
    return redacted


def _count_words(value):
    return len(re.findall(r'\b\w+\b', f'{value or ""}'))


def _normalize_line(value):
    return re.sub(r'\s+', ' ', f'{value or ""}').strip()


def _remember_text_extraction(cache_key, text):
    if cache_key in _TEXT_EXTRACTION_CACHE:
        return _TEXT_EXTRACTION_CACHE[cache_key]
    if len(_TEXT_EXTRACTION_CACHE) >= MAX_EXTRACTION_CACHE_ENTRIES:
        oldest_key = next(iter(_TEXT_EXTRACTION_CACHE))
        _TEXT_EXTRACTION_CACHE.pop(oldest_key, None)
    _TEXT_EXTRACTION_CACHE[cache_key] = text
    return text


def _normalize_extracted_chunk(value):
    return _clean_text(html.unescape(value))


def _looks_like_meaningful_text_chunk(value):
    cleaned = _normalize_extracted_chunk(value)
    if len(cleaned) < 12:
        return False
    if cleaned.startswith('PK'):
        return False
    alpha_count = sum(1 for char in cleaned if char.isalpha())
    digit_count = sum(1 for char in cleaned if char.isdigit())
    token_count = len(re.findall(r'[A-Za-z0-9@][A-Za-z0-9@._:/+\-]*', cleaned))
    short_token_count = sum(1 for token in cleaned.split() if len(token) == 1)
    if alpha_count == 0 and '@' not in cleaned and digit_count < 4:
        return False
    if alpha_count and (alpha_count / max(len(cleaned), 1)) < 0.2 and '@' not in cleaned:
        return False
    if token_count < 3 and '@' not in cleaned and 'http' not in cleaned.lower():
        return False
    if short_token_count > max(8, int(len(cleaned.split()) * 0.6)):
        return False
    return True


def _dedupe_and_limit_chunks(chunks, max_chunks=40, max_total_chars=12000):
    selected = []
    seen = set()
    total_chars = 0
    for chunk in chunks:
        cleaned = _normalize_extracted_chunk(chunk)
        if not _looks_like_meaningful_text_chunk(cleaned):
            continue
        key = re.sub(r'\d+', '0', cleaned.lower())[:220]
        if key in seen:
            continue
        remaining = max_total_chars - total_chars
        if remaining <= 0:
            break
        snippet = cleaned[:min(900, remaining)].strip()
        if not snippet:
            continue
        seen.add(key)
        selected.append(snippet)
        total_chars += len(snippet)
        if len(selected) >= max_chunks:
            break
    return '\n'.join(selected)


def _clean_contact_value(value):
    value = _normalize_line(value)
    value = re.sub(r'^(name|title|position|office|location|email|phone|telephone|tel)\s*[:\-]\s*', '', value, flags=re.IGNORECASE)
    return value.strip(' -,:;')


def _extract_email(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', f'{text or ""}', flags=re.IGNORECASE)
    return _clean_text(match.group(0) if match else '')


def _extract_phone(text):
    match = re.search(r'(\+?\d[\d\s\-\(\)]{6,}\d)', f'{text or ""}')
    return _clean_text(match.group(1) if match else '')


def _looks_like_name(text):
    value = _clean_contact_value(text)
    if not value or '@' in value or re.search(r'\d', value) or len(value) > 80:
        return False
    if any(token in value.lower() for token in ('department', 'program', 'office', 'building', 'room', 'email', 'phone', 'tel', 'fax')):
        return False
    if re.search(r'(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+[A-Za-z]', value, flags=re.IGNORECASE):
        return True
    words = [part for part in re.split(r'\s+', value) if part]
    if len(words) < 2 or len(words) > 5:
        return False
    return sum(1 for word in words if re.fullmatch(r"[A-Z][A-Za-z'`\-]+\.?", word)) >= 2


def _looks_like_title(text):
    value = _clean_contact_value(text).lower()
    keywords = (
        'coordinator', 'chair', 'director', 'dean', 'head', 'manager', 'officer',
        'professor', 'assistant professor', 'associate professor', 'lecturer',
        'department', 'program', 'self-study', 'accreditation', 'contact', 'president', 'provost', 'rector'
    )
    return any(keyword in value for keyword in keywords)


def _looks_like_location(text):
    value = _clean_contact_value(text).lower()
    keywords = ('office', 'room', 'building', 'floor', 'campus', 'hall', 'department of', 'school of', 'faculty of')
    return any(keyword in value for keyword in keywords)


def _score_contact_line(line):
    lower_line = line.lower()
    score = 0
    if any(keyword in lower_line for keyword in ('abet', 'self-study', 'program contact', 'submitted by', 'prepared by')):
        score += 8
    if any(keyword in lower_line for keyword in ('program coordinator', 'program chair', 'department chair', 'program director')):
        score += 7
    if any(keyword in lower_line for keyword in ('coordinator', 'chair', 'director', 'head')):
        score += 4
    if any(keyword in lower_line for keyword in ('dean', 'professor', 'lecturer', 'president', 'provost')):
        score += 1
    if '@' in line:
        score += 2
    if _extract_phone(line):
        score += 2
    if _looks_like_name(line):
        score += 2
    if _looks_like_title(line):
        score += 3
    if any(keyword in lower_line for keyword in ('directory', 'faculty list', 'all faculty', 'committee members', 'roster')):
        score -= 6
    return score


def _pick_field_value(candidates, validator, minimum_score):
    valid = [candidate for candidate in candidates if validator(candidate.get('value'))]
    if not valid:
        return '', False
    valid.sort(key=lambda candidate: candidate.get('score', 0), reverse=True)
    top = valid[0]
    runner_up = valid[1] if len(valid) > 1 else None
    if top.get('score', 0) < minimum_score:
        return '', False
    if runner_up and (top.get('score', 0) - runner_up.get('score', 0)) < 2:
        return '', True
    return _clean_text(top.get('value')), False


def _extract_text_from_docx_bytes(file_bytes):
    paragraph_parts = []
    namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

    def read_wordprocessing_part(xml_bytes):
        try:
            root = ET.fromstring(xml_bytes)
        except ET.ParseError:
            return []

        paragraphs = []
        for paragraph in root.findall('.//w:p', namespace):
            segments = []
            for node in paragraph.iter():
                tag = node.tag.rsplit('}', 1)[-1] if '}' in node.tag else node.tag
                if tag == 't':
                    segments.append(node.text or '')
                elif tag == 'tab':
                    segments.append(' ')
                elif tag in ('br', 'cr'):
                    segments.append(' ')
            text = html.unescape(''.join(segments))
            text = re.sub(r'\s+', ' ', text).strip()
            if text:
                paragraphs.append(text)
        return paragraphs

    try:
        with zipfile.ZipFile(BytesIO(file_bytes)) as archive:
            candidate_names = []
            for preferred_name in ('word/document.xml',):
                if preferred_name in archive.namelist():
                    candidate_names.append(preferred_name)
            candidate_names.extend(
                sorted(
                    name for name in archive.namelist()
                    if re.fullmatch(r'word/(?:header|footer)\d+\.xml', name)
                )
            )

            for name in candidate_names:
                paragraph_parts.extend(read_wordprocessing_part(archive.read(name)))
    except Exception:
        return ''

    if not paragraph_parts:
        return ''
    return _dedupe_and_limit_chunks(paragraph_parts, max_chunks=80, max_total_chars=16000)


def _decode_pdf_text_bytes(raw_bytes):
    if not raw_bytes:
        return ''
    candidate = bytes(raw_bytes)
    if candidate.startswith(b'\xfe\xff') or candidate.startswith(b'\xff\xfe'):
        for encoding in ('utf-16', 'utf-16-be', 'utf-16-le'):
            try:
                return _clean_text(candidate.decode(encoding))
            except UnicodeDecodeError:
                continue
    if candidate.count(b'\x00') > max(1, len(candidate) // 8):
        for encoding in ('utf-16-be', 'utf-16-le'):
            try:
                return _clean_text(candidate.decode(encoding))
            except UnicodeDecodeError:
                continue
    for encoding in ('utf-8', 'latin-1'):
        try:
            return _clean_text(candidate.decode(encoding))
        except UnicodeDecodeError:
            continue
    return ''


def _decode_pdf_literal_string(raw_bytes):
    decoded = bytearray()
    index = 0
    escape_map = {
        ord('n'): b'\n',
        ord('r'): b'\r',
        ord('t'): b'\t',
        ord('b'): b'\b',
        ord('f'): b'\f',
        ord('('): b'(',
        ord(')'): b')',
        ord('\\'): b'\\',
    }

    while index < len(raw_bytes):
        byte = raw_bytes[index]
        if byte != 92:  # backslash
            decoded.append(byte)
            index += 1
            continue

        index += 1
        if index >= len(raw_bytes):
            break
        escaped = raw_bytes[index]

        if escaped in escape_map:
            decoded.extend(escape_map[escaped])
            index += 1
            continue

        if escaped in (10, 13):
            if escaped == 13 and index + 1 < len(raw_bytes) and raw_bytes[index + 1] == 10:
                index += 1
            index += 1
            continue

        if 48 <= escaped <= 55:
            octal_digits = bytes([escaped])
            extra_index = index + 1
            while extra_index < len(raw_bytes) and len(octal_digits) < 3 and 48 <= raw_bytes[extra_index] <= 55:
                octal_digits += bytes([raw_bytes[extra_index]])
                extra_index += 1
            decoded.append(int(octal_digits, 8))
            index = extra_index
            continue

        decoded.append(escaped)
        index += 1

    return _decode_pdf_text_bytes(bytes(decoded))


def _decode_pdf_hex_string(raw_bytes):
    hex_text = re.sub(rb'[^0-9A-Fa-f]', b'', raw_bytes or b'')
    if not hex_text:
        return ''
    if len(hex_text) % 2 == 1:
        hex_text += b'0'
    try:
        decoded = bytes.fromhex(hex_text.decode('ascii'))
    except ValueError:
        return ''
    return _decode_pdf_text_bytes(decoded)


def _extract_pdf_text_chunks_from_stream(stream_bytes):
    chunks = []
    stream_candidates = []
    seen_candidates = set()

    for candidate in (stream_bytes,):
        if candidate not in seen_candidates:
            seen_candidates.add(candidate)
            stream_candidates.append(candidate)
        for wbits in (zlib.MAX_WBITS, -zlib.MAX_WBITS):
            try:
                inflated = zlib.decompress(candidate, wbits)
            except Exception:
                continue
            if inflated not in seen_candidates:
                seen_candidates.add(inflated)
                stream_candidates.append(inflated)

    for candidate in stream_candidates:
        for text_block in re.findall(rb'BT(.*?)ET', candidate, flags=re.DOTALL):
            for array_match in re.finditer(rb'\[(.*?)\]\s*TJ', text_block, flags=re.DOTALL):
                array_text = array_match.group(1)
                for literal in re.finditer(rb'\((.*?)(?<!\\)\)', array_text, flags=re.DOTALL):
                    decoded = _decode_pdf_literal_string(literal.group(1))
                    if decoded:
                        chunks.append(decoded)
                for hex_match in re.finditer(rb'<([0-9A-Fa-f\s]+)>', array_text):
                    decoded = _decode_pdf_hex_string(hex_match.group(1))
                    if decoded:
                        chunks.append(decoded)

            for literal in re.finditer(rb'\((.*?)(?<!\\)\)\s*(?:Tj|\'|")', text_block, flags=re.DOTALL):
                decoded = _decode_pdf_literal_string(literal.group(1))
                if decoded:
                    chunks.append(decoded)
            for hex_match in re.finditer(rb'<([0-9A-Fa-f\s]+)>\s*Tj', text_block, flags=re.DOTALL):
                decoded = _decode_pdf_hex_string(hex_match.group(1))
                if decoded:
                    chunks.append(decoded)

    return chunks


def _extract_text_from_pdf_bytes(file_bytes):
    chunks = []
    for stream_bytes in re.findall(rb'stream\s*(.*?)\s*endstream', file_bytes, flags=re.DOTALL):
        chunks.extend(_extract_pdf_text_chunks_from_stream(stream_bytes))

    if not chunks:
        for match in re.findall(rb'\((.*?)(?<!\\)\)', file_bytes, flags=re.DOTALL):
            decoded = _decode_pdf_literal_string(match)
            if decoded:
                chunks.append(decoded)

    return _dedupe_and_limit_chunks(chunks, max_chunks=80, max_total_chars=16000)


def _extract_text_from_csv_bytes(file_bytes):
    decoded = ''
    for encoding in ('utf-8-sig', 'utf-8', 'latin-1'):
        try:
            decoded = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if not decoded.strip():
        return ''

    sample = decoded[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
    except csv.Error:
        dialect = csv.excel

    try:
        rows = list(csv.reader(StringIO(decoded), dialect))
    except csv.Error:
        return decoded

    cleaned_rows = []
    for row in rows:
        cleaned = [_clean_text(cell) for cell in row]
        if any(cleaned):
            cleaned_rows.append(cleaned)
    if not cleaned_rows:
        return ''

    headers = cleaned_rows[0]
    has_header = (
        len(cleaned_rows) > 1 and
        any(header and not re.fullmatch(r'\d+(?:\.\d+)?', header) for header in headers)
    )

    lines = []
    if has_header:
        lines.append(f'CSV Headers: {" | ".join(header or f"Column {index + 1}" for index, header in enumerate(headers))}')

    for index, row in enumerate(cleaned_rows[1:] if has_header else cleaned_rows, start=1):
        if has_header:
            pairs = []
            for cell_index, cell in enumerate(row):
                if not cell:
                    continue
                header = headers[cell_index] if cell_index < len(headers) and headers[cell_index] else f'Column {cell_index + 1}'
                pairs.append(f'{header}: {cell}')
            if pairs:
                lines.append(f'Row {index}: ' + '; '.join(pairs))
        else:
            lines.append(f'Row {index}: ' + ' | '.join(cell for cell in row if cell))
        if len(lines) >= 180:
            break

    return '\n'.join(lines)


def _xlsx_column_letters(cell_reference):
    match = re.match(r'([A-Z]+)', f'{cell_reference or ""}')
    return match.group(1) if match else ''


def _xlsx_column_index(cell_reference):
    letters = _xlsx_column_letters(cell_reference)
    if not letters:
        return 0
    index = 0
    for char in letters:
        index = (index * 26) + (ord(char.upper()) - ord('A') + 1)
    return index


def _excel_serial_to_iso(value, date_1904=False):
    cleaned = _clean_text(value)
    if not cleaned:
        return ''
    try:
        serial = float(cleaned)
    except ValueError:
        return ''
    base = datetime(1904, 1, 1) if date_1904 else datetime(1899, 12, 30)
    try:
        converted = base + timedelta(days=serial)
    except Exception:
        return ''
    return converted.strftime('%Y-%m-%d')


def _looks_like_excel_date_format(format_code):
    cleaned = f'{format_code or ""}'.lower()
    if not cleaned:
        return False
    return any(token in cleaned for token in ('yy', 'dd', 'mm', 'm/', '/m', 'h:', 'ss'))


def _extract_xlsx_workbook_data(file_bytes, max_rows_per_sheet=180, max_sheets=10, max_columns=40):
    try:
        archive = zipfile.ZipFile(BytesIO(file_bytes))
    except Exception:
        return []

    namespace = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    relationship_ns = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'

    shared_strings = []
    try:
        shared_root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
        for string_item in shared_root.findall('main:si', namespace):
            parts = [
                ''.join(text.itertext()).strip()
                for text in string_item.findall('.//main:t', namespace)
            ]
            shared_strings.append(_clean_text(' '.join(part for part in parts if part)))
    except Exception:
        shared_strings = []

    date_1904 = False
    try:
        workbook_root = ET.fromstring(archive.read('xl/workbook.xml'))
        workbook_props = workbook_root.find('main:workbookPr', namespace)
        date_1904 = (workbook_props is not None and workbook_props.attrib.get('date1904') == '1')
    except Exception:
        workbook_root = None

    custom_num_formats = {}
    style_date_indexes = set()
    try:
        styles_root = ET.fromstring(archive.read('xl/styles.xml'))
        for num_fmt in styles_root.findall('main:numFmts/main:numFmt', namespace):
            num_fmt_id = num_fmt.attrib.get('numFmtId')
            format_code = num_fmt.attrib.get('formatCode')
            if num_fmt_id and format_code:
                custom_num_formats[num_fmt_id] = format_code
        cell_xfs = styles_root.findall('main:cellXfs/main:xf', namespace)
        builtin_date_ids = {'14', '15', '16', '17', '18', '19', '20', '21', '22', '45', '46', '47'}
        for index, xf in enumerate(cell_xfs):
            num_fmt_id = xf.attrib.get('numFmtId')
            format_code = custom_num_formats.get(num_fmt_id, '')
            if (num_fmt_id in builtin_date_ids) or _looks_like_excel_date_format(format_code):
                style_date_indexes.add(index)
    except Exception:
        style_date_indexes = set()

    sheet_targets = []
    try:
        rels_root = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        relationships = {}
        for relation in rels_root:
            relation_id = relation.attrib.get('Id')
            target = relation.attrib.get('Target')
            if relation_id and target:
                normalized_target = target.replace('\\', '/').lstrip('/')
                if not normalized_target.startswith('xl/'):
                    normalized_target = f'xl/{normalized_target.lstrip("/")}'
                relationships[relation_id] = normalized_target
        if workbook_root is not None:
            for sheet in workbook_root.findall('main:sheets/main:sheet', namespace):
                sheet_name = sheet.attrib.get('name') or 'Sheet'
                relation_id = sheet.attrib.get(relationship_ns)
                target = relationships.get(relation_id)
                if target:
                    sheet_targets.append((sheet_name, target))
    except Exception:
        sheet_targets = []

    if not sheet_targets:
        sheet_targets = [
            (name.rsplit('/', 1)[-1], name)
            for name in archive.namelist()
            if name.startswith('xl/worksheets/') and name.endswith('.xml')
        ]

    def cell_text(cell):
        cell_type = cell.attrib.get('t')
        style_index = None
        try:
            style_index = int(cell.attrib.get('s')) if cell.attrib.get('s') is not None else None
        except Exception:
            style_index = None
        if cell_type == 'inlineStr':
            return _clean_text(' '.join(cell.itertext()))
        value_node = cell.find('main:v', namespace)
        raw_value = _clean_text(value_node.text if value_node is not None else '')
        if not raw_value:
            return ''
        if cell_type == 's':
            try:
                return _clean_text(shared_strings[int(raw_value)])
            except Exception:
                return ''
        if cell_type == 'b':
            return 'TRUE' if raw_value == '1' else 'FALSE'
        if style_index is not None and style_index in style_date_indexes:
            converted = _excel_serial_to_iso(raw_value, date_1904=date_1904)
            if converted:
                return converted
        return raw_value

    workbook_data = []
    for sheet_name, target in sheet_targets[:max_sheets]:
        try:
            sheet_root = ET.fromstring(archive.read(target))
        except Exception:
            continue
        sheet_rows = sheet_root.findall('.//main:sheetData/main:row', namespace)
        if not sheet_rows:
            continue

        parsed_rows = []
        max_seen_column = 0
        for row in sheet_rows:
            row_values = {}
            for cell in row.findall('main:c', namespace):
                column_index = _xlsx_column_index(cell.attrib.get('r'))
                if column_index <= 0 or column_index > max_columns:
                    continue
                text = cell_text(cell)
                if text:
                    row_values[column_index] = text
                    max_seen_column = max(max_seen_column, column_index)
            if row_values:
                parsed_rows.append(row_values)
            if len(parsed_rows) >= max_rows_per_sheet:
                break

        if not parsed_rows or max_seen_column == 0:
            continue

        rows = []
        for row_values in parsed_rows:
            row = [row_values.get(column_index, '') for column_index in range(1, max_seen_column + 1)]
            while row and not _clean_text(row[-1]):
                row.pop()
            if any(_clean_text(cell) for cell in row):
                rows.append(row)

        if rows:
            workbook_data.append({'sheet_name': sheet_name, 'rows': rows})

    return workbook_data


def _extract_text_from_xlsx_bytes(file_bytes):
    workbook_data = _extract_xlsx_workbook_data(file_bytes, max_rows_per_sheet=120)
    if not workbook_data:
        return ''

    lines = []
    total_rows = 0
    for sheet in workbook_data:
        rows = sheet.get('rows') or []
        if not rows:
            continue
        lines.append(f'Sheet: {sheet.get("sheet_name") or "Sheet"}')
        headers = rows[0]
        has_header = (
            len(rows) > 1 and
            any(header and not re.fullmatch(r'\d+(?:\.\d+)?', header) for header in headers)
        )
        if has_header:
            lines.append('Headers: ' + ' | '.join(header or f'Column {index + 1}' for index, header in enumerate(headers)))

        data_rows = rows[1:] if has_header else rows
        for row_index, row in enumerate(data_rows, start=1):
            pairs = []
            for cell_index, cell in enumerate(row):
                value = _clean_text(cell)
                if not value:
                    continue
                header = headers[cell_index] if has_header and cell_index < len(headers) and headers[cell_index] else f'Column {cell_index + 1}'
                pairs.append(f'{header}: {value}')
            if pairs:
                lines.append(f'Row {row_index}: ' + '; '.join(pairs))
                total_rows += 1
            if total_rows >= 180:
                break
        if total_rows >= 180:
            break
    return '\n'.join(lines)


def _extract_text_from_uploaded_file(uploaded_file):
    name = f'{uploaded_file.name or ""}'.lower()
    file_bytes = uploaded_file.read()
    uploaded_file.seek(0)
    if not file_bytes:
        return ''
    cache_key = f'{name}:{hashlib.sha1(file_bytes).hexdigest()}'
    cached_text = _TEXT_EXTRACTION_CACHE.get(cache_key)
    if cached_text is not None:
        return cached_text
    if name.endswith('.csv'):
        return _remember_text_extraction(cache_key, _extract_text_from_csv_bytes(file_bytes))
    if name.endswith(('.xlsx', '.xlsm')):
        return _remember_text_extraction(cache_key, _extract_text_from_xlsx_bytes(file_bytes))
    if name.endswith(('.txt', '.md', '.json', '.yaml', '.yml', '.html', '.xml', '.tsv')):
        return _remember_text_extraction(cache_key, file_bytes.decode('utf-8', errors='ignore'))
    if name.endswith('.docx'):
        return _remember_text_extraction(cache_key, _extract_text_from_docx_bytes(file_bytes))
    if name.endswith('.pdf'):
        return _remember_text_extraction(cache_key, _extract_text_from_pdf_bytes(file_bytes))
    decoded = file_bytes.decode('utf-8', errors='ignore').strip()
    return _remember_text_extraction(cache_key, decoded or file_bytes.decode('latin-1', errors='ignore'))


def _extract_json_object(text):
    raw = f'{text or ""}'.strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', raw, flags=re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _extract_gemini_text(response_payload):
    for candidate in response_payload.get('candidates') or []:
        content = candidate.get('content') or {}
        for part in content.get('parts') or []:
            text = part.get('text') if isinstance(part, dict) else ''
            if text:
                return text
    return ''


def _run_gemini_json_prompt(prompt, model_name=BACKGROUND_GEMINI_MODEL, timeout=BACKGROUND_GEMINI_TIMEOUT_SECONDS, extra_parts=None):
    api_key = f'{os.getenv("GEMINI_API_KEY") or ""}'.strip()
    if not api_key:
        return None, 'Gemini API key is not configured.'

    parts = [{'text': prompt}]
    for part in extra_parts or []:
        if isinstance(part, dict):
            parts.append(part)

    payload = {
        'contents': [
            {
                'role': 'user',
                'parts': parts,
            }
        ],
        'generationConfig': {
            'temperature': 0.2,
            'responseMimeType': 'application/json',
        },
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}'
    request = urllib_request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib_request.urlopen(request, timeout=timeout) as response:
            response_payload = json.loads(response.read().decode('utf-8'))
    except urllib_error.HTTPError as exc:
        error_body = exc.read().decode('utf-8', errors='ignore')
        parsed_error = _extract_json_object(error_body) if error_body else None
        message = ''
        if isinstance(parsed_error, dict):
            message = _clean_text(((parsed_error.get('error') or {}).get('message')))
        return None, _redact_sensitive_error_text(message or f'Gemini request failed with HTTP {exc.code}.')
    except Exception as exc:
        return None, _redact_sensitive_error_text(f'Unable to reach the Gemini API: {exc}')

    text = _extract_gemini_text(response_payload)
    if not text:
        return None, 'Gemini returned an empty response.'

    parsed = _extract_json_object(text)
    if not isinstance(parsed, dict):
        return None, 'Gemini returned an invalid JSON response.'
    return parsed, ''


def _build_gemini_background_file_parts(files):
    parts = []
    total_bytes = 0
    max_total_bytes = 10 * 1024 * 1024

    for uploaded_file in files or []:
        content_type = f'{getattr(uploaded_file, "content_type", "") or ""}'.strip().lower()
        filename = f'{getattr(uploaded_file, "name", "") or ""}'.strip().lower()
        is_pdf = content_type == 'application/pdf' or filename.endswith('.pdf')
        if not is_pdf:
            continue

        try:
            uploaded_file.seek(0)
        except Exception:
            pass
        file_bytes = uploaded_file.read()
        try:
            uploaded_file.seek(0)
        except Exception:
            pass

        if not file_bytes:
            continue
        if total_bytes + len(file_bytes) > max_total_bytes:
            break

        parts.append({
            'inline_data': {
                'mime_type': 'application/pdf',
                'data': base64.b64encode(file_bytes).decode('ascii'),
            }
        })
        total_bytes += len(file_bytes)

    return parts


def _has_pdf_uploads(files):
    for uploaded_file in files or []:
        content_type = f'{getattr(uploaded_file, "content_type", "") or ""}'.strip().lower()
        filename = f'{getattr(uploaded_file, "name", "") or ""}'.strip().lower()
        if content_type == 'application/pdf' or filename.endswith('.pdf'):
            return True
    return False


def _build_blocks(text):
    paragraphs = [part.strip() for part in re.split(r'\n\s*\n+', f'{text or ""}') if part.strip()]
    lines = [_normalize_line(line) for line in f'{text or ""}'.splitlines() if _normalize_line(line)]
    windows = [' '.join(lines[index:index + 3]).strip() for index in range(len(lines))]
    blocks = []
    seen = set()
    for block in paragraphs + windows:
        normalized = _normalize_line(block)
        if not normalized or normalized.lower() in seen:
            continue
        seen.add(normalized.lower())
        blocks.append(normalized)
    return blocks


def _score_block(block, keywords):
    lower_block = block.lower()
    score = 0
    for keyword in keywords:
        key = f'{keyword or ""}'.strip().lower()
        if not key:
            continue
        if key in lower_block:
            score += 3 if ' ' in key else 1
    if re.search(r'https?://|www\.', block, flags=re.IGNORECASE):
        score += 1
    return score


def _select_top_blocks(blocks, keywords, limit=3, min_score=2):
    scored = [(_score_block(block, keywords), block) for block in blocks]
    scored = [item for item in scored if item[0] >= min_score]
    scored.sort(key=lambda item: item[0], reverse=True)
    selected = []
    seen = set()
    for _score, block in scored:
        if block.lower() in seen:
            continue
        seen.add(block.lower())
        selected.append(block)
        if len(selected) >= limit:
            break
    return selected


def _narrative_from_blocks(blocks, min_sentences=2, max_chars=900):
    if not blocks:
        return ''
    text = re.sub(r'\s+', ' ', ' '.join(blocks)).strip()
    if len(text) > max_chars:
        text = text[:max_chars].rsplit(' ', 1)[0].strip()
    if min_sentences > 1:
        sentences = [sentence for sentence in re.split(r'(?<=[.!?])\s+', text) if sentence.strip()]
        if len(sentences) < min_sentences:
            clause_count = len([part for part in re.split(r'\s*[;:•]\s*', text) if part.strip()])
            if clause_count < min_sentences and _count_words(text) < (min_sentences * 16):
                return ''
    return text


def _extract_name_from_blocks(blocks, keywords):
    candidates = []
    for block in _select_top_blocks(blocks, keywords, limit=6, min_score=1):
        for line in re.split(r'[|;\n]', block):
            if _looks_like_name(line):
                candidates.append({'value': _clean_contact_value(line), 'score': _score_contact_line(line)})
    value, _ambiguous = _pick_field_value(candidates, _looks_like_name, 3)
    return value


def _extract_title_from_blocks(blocks, keywords):
    candidates = []
    for block in _select_top_blocks(blocks, keywords, limit=6, min_score=1):
        for line in re.split(r'[|;\n]', block):
            if _looks_like_title(line):
                candidates.append({'value': _clean_contact_value(line), 'score': _score_contact_line(line)})
    value, _ambiguous = _pick_field_value(candidates, _looks_like_title, 2)
    return value


def _extract_location_from_blocks(blocks, keywords):
    candidates = []
    for block in _select_top_blocks(blocks, keywords, limit=6, min_score=1):
        for line in re.split(r'[|;\n]', block):
            if _looks_like_location(line):
                candidates.append({'value': _clean_contact_value(line), 'score': _score_contact_line(line)})
    value, _ambiguous = _pick_field_value(candidates, _looks_like_location, 1)
    return value


def _extract_generic_value(field, blocks, section_keywords):
    keywords = list(section_keywords or []) + list(field.get('keywords') or []) + [field.get('label') or '']
    kind = field.get('kind')
    if kind == 'name':
        return _extract_name_from_blocks(blocks, keywords)
    if kind == 'title':
        return _extract_title_from_blocks(blocks, keywords)
    if kind == 'location':
        return _extract_location_from_blocks(blocks, keywords)
    if kind == 'email':
        for block in _select_top_blocks(blocks, keywords, limit=6, min_score=1):
            value = _extract_email(block)
            if value:
                return value
        return ''
    if kind == 'phone':
        for block in _select_top_blocks(blocks, keywords, limit=6, min_score=1):
            value = _extract_phone(block)
            if value:
                return value
        return ''
    if kind == 'year':
        for block in _select_top_blocks(blocks, keywords, limit=5, min_score=1):
            match = re.search(r'\b(19|20)\d{2}\b', block)
            if match:
                return match.group(0)
        return ''
    if kind == 'date':
        patterns = [
            r'\b\d{4}-\d{2}-\d{2}\b',
            r'\b\d{4}/\d{2}/\d{2}\b',
            r'\b\d{2}/\d{2}/\d{4}\b',
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b',
        ]
        for block in _select_top_blocks(blocks, keywords, limit=5, min_score=1):
            for pattern in patterns:
                match = re.search(pattern, block, flags=re.IGNORECASE)
                if match:
                    return match.group(0)
        return ''
    if kind == 'integer':
        for block in _select_top_blocks(blocks, keywords, limit=5, min_score=1):
            match = re.search(r'\b\d+\b', block)
            if match:
                return match.group(0)
        return ''
    if kind == 'decimal':
        for block in _select_top_blocks(blocks, keywords, limit=5, min_score=1):
            match = re.search(r'\b\d+(?:\.\d+)?\b', block)
            if match:
                return match.group(0)
        return ''
    if kind == 'url_or_doc':
        selected = _select_top_blocks(blocks, keywords, limit=3, min_score=1)
        for block in selected:
            match = re.search(r'https?://\S+|www\.\S+', block, flags=re.IGNORECASE)
            if match:
                return match.group(0).rstrip('.,);')
        return selected[0][:240] if selected else ''
    if kind == 'short_text':
        selected = _select_top_blocks(blocks, keywords, limit=1, min_score=1)
        return selected[0][:180] if selected else ''
    selected_blocks = _select_top_blocks(blocks, keywords, limit=3, min_score=2)
    if not selected_blocks:
        selected_blocks = _select_top_blocks(blocks, keywords, limit=4, min_score=1)
    return _narrative_from_blocks(selected_blocks, min_sentences=field.get('min_sentences', 2))


def _field_keywords(field, section_keywords):
    return list(section_keywords or []) + list(field.get('keywords') or []) + [field.get('label') or '', field.get('name') or '']


def _criterion1_admissions_field_specs():
    return {
        'admission_requirements': {
            'keywords': [
                'admission requirement', 'requirements', 'eligibility', 'eligible', 'applicant must',
                'minimum grade', 'minimum gpa', 'entrance exam', 'test score', 'secondary school',
                'high school', 'transcript', 'certificate', 'toefl', 'ielts', 'sat', 'documents required',
                'strong performance', 'mathematics', 'science subjects', 'analytical thinking',
                'problem-solving', 'physics', 'calculus', 'academic background', 'essential',
            ],
            'shared_keywords': ['admission into', 'selection into the program', 'preparedness', 'merit'],
            'avoid_keywords': ['transfer', 'equivalenc', 'articulation', 'bridge', 'community college'],
            'concepts': [
                {'id': 'math_science', 'patterns': ['strong performance', 'mathematics', 'science subjects']},
                {'id': 'physics_calculus', 'patterns': ['physics', 'calculus', 'academic background']},
                {'id': 'thinking_skills', 'patterns': ['analytical thinking', 'problem-solving']},
            ],
            'max_chars': 700,
            'min_words': 8,
        },
        'admission_process_summary': {
            'keywords': [
                'admission process', 'application process', 'application', 'submit application',
                'review', 'decision', 'interview', 'evaluation', 'selection', 'committee',
                'admissions office', 'screening', 'final decision', 'acceptance',
                'holistic evaluation', 'extracurricular', 'personal statements', 'standardized testing',
            ],
            'shared_keywords': ['process of admission', 'selection into the program'],
            'avoid_keywords': ['transfer', 'equivalenc', 'articulation', 'bridge'],
            'concepts': [
                {'id': 'core_process', 'patterns': ['application review', 'academic evaluation', 'admission process', 'selection process']},
                {'id': 'holistic_review', 'patterns': ['holistic evaluation', 'extracurricular', 'personal statements']},
                {'id': 'interviews_testing', 'patterns': ['interview', 'standardized testing']},
            ],
            'max_chars': 700,
            'min_words': 8,
        },
        'transfer_pathways': {
            'keywords': [
                'transfer', 'transfer credit', 'transfer student', 'articulation', 'pathway',
                'equivalency', 'equivalent', 'bridge', 'community college', 'external credits',
                'course-by-course', 'partner institution',
                'prior coursework', 'academic standing', 'transfer admission',
            ],
            'shared_keywords': ['students transferring', 'transferring from other institutions'],
            'avoid_keywords': ['interview', 'application review', 'standardized testing'],
            'concepts': [
                {'id': 'structured_pathways', 'patterns': ['structured transfer pathways', 'transferring from other institutions', 'transfer pathways']},
                {'id': 'equivalency_review', 'patterns': ['course equivalencies', 'equivalencies must be evaluated', 'equivalent']},
                {'id': 'transfer_assessment', 'patterns': ['prior coursework', 'academic standing', 'transfer applicants are assessed']},
            ],
            'max_chars': 520,
            'min_words': 6,
        },
    }


def _split_candidate_sentences(text):
    normalized_text = f'{text or ""}'.replace('\r\n', '\n').replace('\r', '\n')
    raw_parts = []
    for line in normalized_text.split('\n'):
        cleaned_line = _clean_text(line)
        if not cleaned_line:
            continue
        lower_line = cleaned_line.lower()
        if (
            _count_words(cleaned_line) <= 8 and
            not re.search(r'[.!?]', cleaned_line) and
            not any(keyword in lower_line for keyword in ('admission', 'transfer', 'applicant', 'requirement', 'review', 'pathway'))
        ):
            continue
        raw_parts.extend(re.split(r'(?<=[.!?])\s+|(?<=:)\s+(?=[A-Z])', cleaned_line))
    sentences = []
    seen = set()
    for part in raw_parts:
        cleaned = _clean_text(part)
        if not cleaned:
            continue
        if cleaned.lower().startswith('file:'):
            continue
        cleaned = re.sub(
            r'^.*?mixed academic narrative\s*-\s*.*?(?=(the process of admission|admission into|students transferring|admission requirements|admission process|transfer pathways))',
            '',
            cleaned,
            flags=re.IGNORECASE,
        ).strip()
        cleaned = re.sub(r'^[^A-Za-z]*(?:mixed academic narrative\s*-\s*)?', '', cleaned, flags=re.IGNORECASE).strip()
        if _count_words(cleaned) < 4:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        sentences.append(cleaned)
    return sentences


def _score_background_program_history_sentence(sentence, bucket):
    lower_sentence = f'{sentence or ""}'.lower()
    score = 0

    if bucket == 'year':
        keywords = [
            'implemented', 'officially implemented', 'established', 'launched',
            'founded', 'began', 'formal academic structure', 'started'
        ]
        if re.search(r'\b(19|20)\d{2}\b', lower_sentence):
            score += 3
    elif bucket == 'review':
        keywords = [
            'last review', 'general review', 'review', 'site visit',
            'conducted on', 'accreditation standards', 'curriculum alignment'
        ]
        if (
            re.search(r'\b(19|20)\d{2}[-/]\d{2}[-/]\d{2}\b', lower_sentence) or
            re.search(r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},\s+\d{4}\b', lower_sentence)
        ):
            score += 4
    else:
        keywords = [
            'since the last review', 'updated', 'upgraded', 'new partnerships',
            'partnerships', 'industry leaders', 'internship', 'employment opportunities',
            'assessment strategies', 'refined', 'abet accreditation outcomes',
            'continuous improvement', 'digital learning platforms', 'hybrid', 'remote learning',
            'faculty recruitment', 'expanded', 'laboratory facilities', 'new equipment',
            'interdisciplinary subjects', 'modern engineering tools', 'curriculum', 'revised',
            'introduced', 'strengthened', 'improved'
        ]
        if lower_sentence.startswith('since the last review'):
            score += 4
        if 'new ' in lower_sentence or 'have been' in lower_sentence or 'has been' in lower_sentence:
            score += 1

    for keyword in keywords:
        if keyword in lower_sentence:
            score += 4 if ' ' in keyword else 2

    if bucket == 'changes':
        if any(noise in lower_sentence for noise in (
            'weather conditions', 'cafeteria', 'scenic views', 'student life',
            'sports', 'music', 'community service', 'cultural festivals',
            'international cuisines', 'library remains open late'
        )):
            score -= 6

    return score


def _select_background_program_history_sentences(text, bucket, limit):
    sentences = _split_candidate_sentences(text)
    scored = []
    seen = set()
    for sentence in sentences:
        key = _normalize_sentence_key(sentence)
        if not key or key in seen:
            continue
        seen.add(key)
        score = _score_background_program_history_sentence(sentence, bucket)
        if score <= 0:
            continue
        scored.append((score, len(sentence), sentence))
    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [sentence for _score, _length, sentence in scored[:limit]]


def _build_background_program_history_llm_text(text, max_chars=9000):
    year_sentences = _select_background_program_history_sentences(text, 'year', limit=3)
    review_sentences = _select_background_program_history_sentences(text, 'review', limit=4)
    change_sentences = _select_background_program_history_sentences(text, 'changes', limit=10)

    lines = []
    if year_sentences:
        lines.append('Implementation evidence:')
        lines.extend(f'- {sentence}' for sentence in year_sentences)
    if review_sentences:
        lines.append('Review-date evidence:')
        lines.extend(f'- {sentence}' for sentence in review_sentences)
    if change_sentences:
        lines.append('Major-changes evidence:')
        lines.extend(f'- {sentence}' for sentence in change_sentences)

    excerpt = '\n'.join(lines).strip()
    if len(excerpt) > max_chars:
        excerpt = excerpt[:max_chars].rsplit('\n', 1)[0].strip()
    return excerpt or text[:max_chars]


def _score_criterion1_admissions_sentence(sentence, spec):
    lower_sentence = sentence.lower()
    score = 0
    for keyword in spec.get('keywords') or []:
        if keyword and keyword.lower() in lower_sentence:
            score += 4 if ' ' in keyword else 2
    for concept in spec.get('concepts') or []:
        if any(pattern.lower() in lower_sentence for pattern in (concept.get('patterns') or [])):
            score += 5
    for keyword in spec.get('shared_keywords') or []:
        if keyword and keyword.lower() in lower_sentence:
            score += 2
    for keyword in spec.get('avoid_keywords') or []:
        if keyword and keyword.lower() in lower_sentence:
            score -= 3
    return score


def _normalize_sentence_key(sentence):
    return re.sub(r'[^a-z0-9]+', ' ', f'{sentence or ""}'.lower()).strip()


def _select_concept_aware_sentences(sentences, spec, max_sentences=4):
    selected = []
    seen = set()
    concepts = spec.get('concepts') or []

    for concept in concepts:
        concept_patterns = concept.get('patterns') or []
        concept_candidates = [
            sentence for sentence in sentences
            if any(pattern.lower() in sentence.lower() for pattern in concept_patterns)
        ]
        concept_candidates.sort(
            key=lambda sentence: (_score_criterion1_admissions_sentence(sentence, spec), len(sentence)),
            reverse=True,
        )
        for sentence in concept_candidates:
            key = _normalize_sentence_key(sentence)
            if key in seen:
                continue
            seen.add(key)
            selected.append(sentence)
            break

    remaining = sorted(
        sentences,
        key=lambda sentence: (_score_criterion1_admissions_sentence(sentence, spec), len(sentence)),
        reverse=True,
    )
    for sentence in remaining:
        if len(selected) >= max_sentences:
            break
        key = _normalize_sentence_key(sentence)
        if key in seen:
            continue
        seen.add(key)
        selected.append(sentence)

    return selected


def _assemble_sentences(sentences, max_chars, min_words):
    if not sentences:
        return ''
    pieces = []
    total_chars = 0
    for sentence in sentences:
        remaining = max_chars - total_chars
        if remaining <= 0:
            break
        snippet = sentence[:remaining].strip()
        if not snippet:
            continue
        pieces.append(snippet)
        total_chars += len(snippet) + 1
    text = _clean_text(' '.join(pieces))
    return text if _count_words(text) >= min_words else ''


def _extract_criterion1_student_admissions(text, blocks):
    specs = _criterion1_admissions_field_specs()
    sentences = _split_candidate_sentences(text)
    assigned = {field_name: [] for field_name in specs}

    for sentence in sentences:
        scored = [
            (field_name, _score_criterion1_admissions_sentence(sentence, spec))
            for field_name, spec in specs.items()
        ]
        best_field, best_score = max(scored, key=lambda item: item[1])
        if best_score >= 3:
            assigned[best_field].append(sentence)

    extracted = {
        field_name: _assemble_sentences(
            _select_concept_aware_sentences(assigned.get(field_name) or [], spec),
            max_chars=spec['max_chars'],
            min_words=spec['min_words'],
        )
        for field_name, spec in specs.items()
    }

    for field_name, spec in specs.items():
        if extracted.get(field_name):
            continue
        fallback_blocks = _select_top_blocks(blocks, spec.get('keywords') or [], limit=2, min_score=1)
        extracted[field_name] = _narrative_from_blocks(
            fallback_blocks,
            min_sentences=1,
            max_chars=spec['max_chars'],
        )
        if _count_words(extracted[field_name]) < spec['min_words']:
            extracted[field_name] = ''
    return extracted


def _criterion1_transcript_field_specs():
    return {
        'transcript_format_explanation': {
            'keywords': [
                'transcript format', 'official transcript', 'issued by the registrar', 'registrar',
                'transcript includes', 'transcript shows', 'course titles', 'grades',
                'credit hours', 'semester', 'cumulative gpa', 'legend', 'record of courses',
            ],
            'avoid_keywords': [
                'prerequisite', 'admission', 'application', 'interview', 'transfer',
                'equivalenc', 'articulation', 'bridging courses',
            ],
            'max_chars': 700,
            'min_words': 10,
        },
        'program_name_on_transcript': {
            'keywords': [
                'appears on transcript', 'listed on transcript', 'major listed as',
                'degree title', 'program title', 'option listed', 'concentration listed',
                'specialization listed', 'degree awarded', 'bachelor of', 'master of',
            ],
            'avoid_keywords': [
                'prerequisite', 'admission', 'application', 'interview', 'transfer',
                'equivalenc', 'articulation', 'bridging courses',
            ],
            'max_chars': 520,
            'min_words': 6,
        },
    }


def _score_criterion1_transcript_sentence(sentence, spec):
    lower_sentence = sentence.lower()
    score = 0
    for keyword in spec.get('keywords') or []:
        if keyword and keyword.lower() in lower_sentence:
            score += 4 if ' ' in keyword else 2
    for keyword in spec.get('avoid_keywords') or []:
        if keyword and keyword.lower() in lower_sentence:
            score -= 5
    return score


def _extract_criterion1_transcript_fields(text):
    specs = _criterion1_transcript_field_specs()
    sentences = _split_candidate_sentences(text)
    extracted = {}

    for field_name, spec in specs.items():
        ranked = [
            sentence for sentence in sorted(
                sentences,
                key=lambda sentence: (_score_criterion1_transcript_sentence(sentence, spec), len(sentence)),
                reverse=True,
            )
            if _score_criterion1_transcript_sentence(sentence, spec) >= 4
        ]
        deduped = []
        seen = set()
        for sentence in ranked:
            key = _normalize_sentence_key(sentence)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(sentence)
        extracted[field_name] = _assemble_sentences(
            deduped[:3],
            max_chars=spec['max_chars'],
            min_words=spec['min_words'],
        )

    return extracted


def _run_background_textbox_gemini(config, combined_text, current_fields, files=None):
    section_title = ''
    for page_title, page_config in (SECTION_REGISTRY.get('background') or {}).items():
        if page_config is config:
            section_title = page_title
            break
    extra_parts = _build_gemini_background_file_parts(files)

    if section_title == 'A. Contact Information':
        prompt = (
            'You are filling ABET Background section A: Contact Information.\n'
            'Read the entire document text and map the best direct value for each contact field.\n'
            'If PDF files are attached, read them directly in addition to any extracted text snippet.\n'
            'Use only the provided document text, but do not require the labels to match word-for-word if the value is still clearly the program contact information.\n'
            'Return direct field values only, not explanations, evidence notes, or full sentences.\n'
            'For example:\n'
            '- contactName should be just a person name like "Dr. Karim Haddad"\n'
            '- positionTitle should be just a title like "Program Coordinator"\n'
            '- officeLocation should be just the location\n'
            '- phoneNumber should be just the phone number\n'
            '- emailAddress should be just the email address\n'
            'If a field is missing, use an empty string.\n'
            'Do not say things like "No email address is provided" or "The document states..."\n'
            'If the document clearly describes a single primary program contact, use that person even if the text is written narratively.\n'
            'Return only valid JSON with keys contactName, positionTitle, officeLocation, phoneNumber, emailAddress, confidenceNotes.\n\n'
            f'Current field values:\n{json.dumps(current_fields or {}, ensure_ascii=True)}\n\n'
            f'Document text:\n{combined_text[:12000]}'
        )
    elif section_title == 'B. Program History':
        history_text = _build_background_program_history_llm_text(combined_text)
        prompt = (
            'You are filling ABET Background section B: Program History.\n'
            'Read the provided evidence excerpt and any attached PDF files, then extract three things only: yearImplemented, lastReviewDate, and majorChanges.\n'
            'Use only the provided evidence. Never invent facts.\n'
            'For yearImplemented, return only an explicit 4-digit year if the program implementation year is clearly stated.\n'
            'For lastReviewDate, return only an explicit date if clearly stated.\n'
            'For majorChanges, gather all distinct relevant changes, updates, improvements, revisions, additions, and developments mentioned since the last review.\n'
            'majorChanges should be a substantial paragraph, not a short line. Combine all relevant points into one well-written paragraph with concrete details from the evidence.\n'
            'Include multiple relevant changes when they exist, such as curriculum revisions, laboratory upgrades, new partnerships, digital learning improvements, assessment changes, and faculty recruitment.\n'
            'Ignore unrelated campus-description details that are not actual program changes.\n'
            'Do not repeat the same idea. Do not output bullet points. Do not include explanations about uncertainty.\n'
            'If a field has no clear evidence, use an empty string.\n'
            'Return only valid JSON with keys yearImplemented, lastReviewDate, majorChanges, confidenceNotes.\n\n'
            f'Current field values:\n{json.dumps(current_fields or {}, ensure_ascii=True)}\n\n'
            f'Evidence excerpt:\n{history_text}'
        )
    else:
        prompt = (
            'You are filling one Background section of an ABET accreditation self-study website.\n'
            f'Section purpose: {config.get("purpose", "")}\n'
            'If PDF files are attached, read them directly in addition to any extracted text snippet.\n'
            'Use only the provided document text. Never invent facts.\n'
            'Collect all distinct relevant details for each field, but keep the final text concise and field-specific.\n'
            'If a field has no clear evidence, return an empty string.\n'
            'Return only valid JSON with string values for the allowed field keys and confidenceNotes.\n'
            f'Allowed fields: {", ".join(field["name"] for field in (config.get("fields") or []))}\n'
            'Section rules:\n' + '\n'.join(f'- {rule}' for rule in (config.get('rules') or [])) + '\n\n'
            f'Current field values:\n{json.dumps(current_fields or {}, ensure_ascii=True)}\n\n'
            f'Document text:\n{combined_text[:14000]}'
        )

    parsed, error = _run_gemini_json_prompt(prompt, extra_parts=extra_parts)
    if error:
        return None, error

    cleaned = {
        'confidenceNotes': _clean_text(parsed.get('confidenceNotes')),
    }
    for field in config.get('fields') or []:
        field_name = field['name']
        raw_value = _clean_text(parsed.get(field_name))
        if section_title == 'A. Contact Information':
            lower_value = raw_value.lower()
            if any(phrase in lower_value for phrase in (
                'no ', 'not provided', 'document states', 'document text', 'indicating', 'the document',
                'is provided', 'is explicitly', 'reflects a typical',
            )):
                raw_value = ''
        value = _sanitize_structured_value(raw_value, field.get('kind'))
        cleaned[field_name] = value if _is_valid_value(value, field.get('kind')) else ''
    return cleaned, ''


TEXTBOX_GEMINI_PAGE_LABELS = {
    'background': 'Background',
    'criterion1': 'Criterion 1',
    'criterion2': 'Criterion 2',
    'criterion7': 'Criterion 7',
    'criterion8': 'Criterion 8',
    'appendixd': 'Appendix D',
}

_TEXTBOX_EXPLANATION_PHRASES = (
    'the document', 'document states', 'document text', 'provided text', 'provided evidence',
    'evidence excerpt', 'based on the evidence', 'based on the document', 'not provided',
    'not present', 'not explicitly stated', 'appears to', 'it appears', 'inferred',
    'indicating', 'reflects a typical', 'is explicitly', 'is provided',
)

_SAFE_TEXTBOX_RULE_FALLBACK_KINDS = {
    'name',
    'title',
    'location',
    'email',
    'phone',
    'year',
    'integer',
    'decimal',
    'date',
    'url_or_doc',
    'short_text',
}


def _textbox_field_output_instruction(field):
    kind = field.get('kind')
    min_sentences = max(1, int(field.get('min_sentences') or 1))

    if kind == 'name':
        return 'Return only the person name, with no title, explanation, or extra text.'
    if kind == 'title':
        return 'Return only the role/title, with no person name or explanation.'
    if kind == 'location':
        return 'Return only the location text, with no explanation.'
    if kind == 'email':
        return 'Return only the email address.'
    if kind == 'phone':
        return 'Return only the phone number.'
    if kind == 'year':
        return 'Return only the explicit 4-digit year.'
    if kind == 'date':
        return 'Return only the explicit date. Prefer YYYY-MM-DD when the evidence allows.'
    if kind == 'integer':
        return 'Return only the integer number.'
    if kind == 'decimal':
        return 'Return only the numeric value.'
    if kind == 'url_or_doc':
        return 'Return only the URL or document/source name, not a paragraph.'
    if kind == 'short_text':
        return 'Return a short direct value or phrase, not a paragraph.'
    if kind == 'narrative':
        if min_sentences >= 3:
            return 'Write a substantial field-specific paragraph that combines all distinct relevant points from the evidence.'
        if min_sentences == 2:
            return 'Write 2-3 concise field-specific sentences with the relevant details only.'
        return 'Write a concise sentence or short paragraph focused only on this field.'
    return 'Return only the field value supported by the evidence.'


def _looks_like_explanation_response(value):
    lower_value = _clean_text(value).lower()
    if not lower_value:
        return False
    return any(phrase in lower_value for phrase in _TEXTBOX_EXPLANATION_PHRASES)


def _clean_textbox_gemini_value(field, raw_value):
    kind = field.get('kind')
    cleaned = _clean_text(raw_value)
    if not cleaned:
        return ''

    if kind != 'narrative' and _looks_like_explanation_response(cleaned):
        return ''

    if kind == 'name':
        cleaned = re.sub(r'\s*\([^)]*\)\s*$', '', cleaned).strip()
        if ',' in cleaned:
            first_part = cleaned.split(',', 1)[0].strip()
            if _looks_like_name(first_part):
                cleaned = first_part
    elif kind == 'title':
        matched = re.search(r'\(([^()]*)\)\s*$', cleaned)
        if matched and _looks_like_title(matched.group(1)):
            cleaned = matched.group(1).strip()
        elif ',' in cleaned:
            trailing = cleaned.split(',', 1)[1].strip()
            if _looks_like_title(trailing):
                cleaned = trailing

    value = _sanitize_structured_value(cleaned, kind)
    return value if _is_valid_value(value, kind) else ''


def _field_allows_textbox_rule_fallback(field, config):
    explicit_flag = field.get('allow_rule_fallback')
    if explicit_flag is not None:
        return bool(explicit_flag)
    if field.get('kind') in _SAFE_TEXTBOX_RULE_FALLBACK_KINDS:
        return True
    return bool(config.get('allow_narrative_rule_fallback'))


def _run_textbox_gemini(page_key, section_title, config, combined_text, current_fields, files=None, heuristic=None):
    normalized_page_key = f'{page_key or ""}'.strip().lower()
    if normalized_page_key == 'background':
        return _run_background_textbox_gemini(config, combined_text, current_fields, files=files)

    extra_parts = _build_gemini_background_file_parts(files)
    strict_evidence = bool(config.get('strict_evidence'))
    page_label = TEXTBOX_GEMINI_PAGE_LABELS.get(normalized_page_key, f'{page_key or ""}'.strip() or 'section')
    blocks = _build_blocks(combined_text) if combined_text else []
    evidence_excerpt = _build_section_evidence_excerpt(
        blocks,
        config,
        current_fields=current_fields,
        max_chars=MAX_PROMPT_EVIDENCE_CHARS + 2000,
    ) if blocks else ''
    field_instructions = '\n'.join(
        f'- {field["name"]} ({field.get("label") or field["name"]}): {_textbox_field_output_instruction(field)}'
        for field in (config.get('fields') or [])
    )
    allowed_fields = ', '.join(field['name'] for field in (config.get('fields') or []))
    prompt_parts = [
        f'You are filling ABET {page_label} section "{section_title}".',
        'Use the uploaded evidence to fill only the requested fields.',
        'If PDF files are attached, read them directly in addition to any extracted text snippet.',
        'Use only the evidence. Never invent facts.',
        'If documents conflict, prefer the clearest explicit evidence and briefly explain the conflict in confidenceNotes.',
        'If the evidence is weak, conflicting, or missing for a field, return an empty string for that field.',
        'Do not repeat the same idea across multiple fields unless the evidence clearly belongs in both places.',
        f'Section purpose: {config.get("purpose", "")}',
        'Section rules:\n' + '\n'.join(f'- {rule}' for rule in (config.get('rules') or [])),
        'Field instructions:\n' + field_instructions,
        f'Allowed fields: {allowed_fields}',
        f'Current field values:\n{json.dumps(current_fields or {}, ensure_ascii=True)}',
    ]
    if heuristic:
        prompt_parts.append(
            'Conservative fallback draft (use only when the evidence supports it, and do not copy unsupported guesses):\n'
            + json.dumps(heuristic, ensure_ascii=True)
        )
    if evidence_excerpt:
        prompt_parts.append(f'Relevant evidence excerpt:\n{evidence_excerpt}')
    elif combined_text and not strict_evidence:
        prompt_parts.append(f'Extracted document text:\n{combined_text[:12000]}')
    else:
        prompt_parts.append('No strong section-specific evidence was found in the local text extraction. Leave fields blank unless the attached PDF files clearly contain the needed details.')
    prompt_parts.append(f'Return only valid JSON with string values for: {allowed_fields}, confidenceNotes.')

    parsed, error = _run_gemini_json_prompt('\n\n'.join(part for part in prompt_parts if part), extra_parts=extra_parts)
    if error:
        return None, error

    cleaned = {
        'confidenceNotes': _clean_text(parsed.get('confidenceNotes')),
    }
    for field in config.get('fields') or []:
        field_name = field['name']
        cleaned[field_name] = _clean_textbox_gemini_value(field, parsed.get(field_name))
    return cleaned, ''


def _is_strong_heuristic_value(field, value):
    cleaned = _clean_text(value)
    if not cleaned:
        return False
    kind = field.get('kind')
    if kind == 'narrative':
        minimum_words = max(18, (field.get('min_sentences', 2) or 1) * 12)
        return _count_words(cleaned) >= minimum_words
    return _is_valid_value(cleaned, kind)


def _build_section_evidence_excerpt(blocks, config, current_fields=None, max_chars=MAX_PROMPT_EVIDENCE_CHARS):
    selected = []
    seen = set()
    strict_evidence = bool(config.get('strict_evidence'))
    evidence_avoid_keywords = [f'{keyword or ""}'.strip().lower() for keyword in (config.get('evidence_avoid_keywords') or []) if f'{keyword or ""}'.strip()]
    current_fields = current_fields or {}
    fields = config.get('fields') or []
    missing_field_names = [
        field['name']
        for field in fields
        if not _clean_text(current_fields.get(field['name']))
    ]

    for field in fields:
        if missing_field_names and field['name'] not in missing_field_names:
            continue
        for block in _select_top_blocks(blocks, _field_keywords(field, config.get('section_keywords') or []), limit=3, min_score=1):
            lower_block = block.lower()
            if evidence_avoid_keywords and any(keyword in lower_block for keyword in evidence_avoid_keywords):
                continue
            key = block.lower()
            if key in seen:
                continue
            seen.add(key)
            selected.append(block)

    if not selected:
        for block in _select_top_blocks(blocks, config.get('section_keywords') or [], limit=8, min_score=1):
            lower_block = block.lower()
            if evidence_avoid_keywords and any(keyword in lower_block for keyword in evidence_avoid_keywords):
                continue
            key = block.lower()
            if key in seen:
                continue
            seen.add(key)
            selected.append(block)

    if not selected and not strict_evidence:
        selected = blocks[:8]

    excerpt_lines = []
    total_chars = 0
    for index, block in enumerate(selected, start=1):
        snippet = _clean_text(block)
        if not snippet:
            continue
        remaining = max_chars - total_chars
        if remaining <= 0:
            break
        snippet = snippet[:min(1000, remaining)].strip()
        if not snippet:
            continue
        excerpt_lines.append(f'Evidence {index}: {snippet}')
        total_chars += len(snippet)
    return '\n'.join(excerpt_lines)


def _is_valid_value(value, kind):
    cleaned = _clean_text(value)
    if not cleaned:
        return True
    if kind == 'email':
        return bool(_extract_email(cleaned))
    if kind == 'phone':
        return bool(_extract_phone(cleaned))
    if kind == 'year':
        return bool(re.fullmatch(r'(19|20)\d{2}', cleaned))
    if kind == 'integer':
        return bool(re.fullmatch(r'\d+', cleaned))
    if kind == 'decimal':
        return bool(re.fullmatch(r'\d+(?:\.\d+)?', cleaned))
    if kind == 'date':
        return bool(_normalize_iso_date(cleaned))
    if kind == 'name':
        return _looks_like_name(cleaned)
    if kind == 'title':
        return _looks_like_title(cleaned)
    if kind == 'location':
        return _looks_like_location(cleaned)
    return True


def _normalize_iso_date(value):
    cleaned = _clean_text(value)
    if not cleaned:
        return ''
    formats = (
        '%Y-%m-%d',
        '%Y/%m/%d',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%B %d, %Y',
        '%b %d, %Y',
        '%d %B %Y',
        '%d %b %Y',
    )
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    match = re.search(r'\b(20\d{2}|19\d{2})-(\d{2})-(\d{2})\b', cleaned)
    if match:
        return match.group(0)
    return ''


def _sanitize_structured_value(value, kind):
    cleaned = _clean_text(value)
    if not cleaned:
        return ''
    if kind == 'integer':
        match = re.search(r'\d+', cleaned)
        return match.group(0) if match else ''
    if kind == 'decimal':
        match = re.search(r'\d+(?:\.\d+)?', cleaned)
        return match.group(0) if match else ''
    if kind == 'date':
        return _normalize_iso_date(cleaned)
    if kind == 'email':
        return _extract_email(cleaned)
    if kind == 'phone':
        return _extract_phone(cleaned)
    return cleaned


SECTION_REGISTRY = {
    'background': {
        'A. Contact Information': {
            'purpose': 'Identify the main program contact for ABET self-study work and capture only explicit contact details.',
            'rules': ['Prefer the program-level ABET/self-study contact over generic university contacts.', 'If multiple people appear and none is clearly dominant, leave uncertain fields empty.', 'Do not mix one person\'s details with another person\'s details.'],
            'section_keywords': ['ABET', 'self-study', 'program contact', 'coordinator', 'chair', 'director', 'submitted by', 'prepared by'],
            'fields': [
                {'name': 'contactName', 'label': 'Program Contact Name', 'kind': 'name', 'keywords': ['contact', 'submitted by', 'prepared by', 'coordinator', 'chair', 'director']},
                {'name': 'positionTitle', 'label': 'Position / Title', 'kind': 'title', 'keywords': ['title', 'position', 'program coordinator', 'chair', 'director', 'dean']},
                {'name': 'officeLocation', 'label': 'Office Location', 'kind': 'location', 'keywords': ['office', 'room', 'building', 'location']},
                {'name': 'phoneNumber', 'label': 'Phone Number', 'kind': 'phone', 'keywords': ['phone', 'telephone', 'tel', 'contact']},
                {'name': 'emailAddress', 'label': 'Email Address', 'kind': 'email', 'keywords': ['email', 'e-mail', 'contact']},
            ],
        },
        'B. Program History': {
            'purpose': 'Summarize program history, implementation timing, last review date, and major changes in ABET-ready prose.',
            'rules': ['Use only explicit dates/years for yearImplemented and lastReviewDate.', 'Leave date fields empty if uncertain.'],
            'section_keywords': ['program history', 'implemented', 'review', 'curriculum changes', 'accreditation'],
            'fields': [
                {'name': 'yearImplemented', 'label': 'Year Implemented', 'kind': 'year', 'keywords': ['implemented', 'established', 'launched', 'started', 'founded']},
                {'name': 'lastReviewDate', 'label': 'Date of Last General Review', 'kind': 'date', 'keywords': ['last review', 'general review', 'review date', 'site visit']},
                {'name': 'majorChanges', 'label': 'Summary of Major Changes Since Last Review', 'kind': 'narrative', 'keywords': ['major changes', 'curriculum', 'faculty', 'facilities', 'updated', 'since last review'], 'min_sentences': 3},
            ],
        },
    },
    'criterion1': {
        'A. Student Admissions': {'purpose': 'Explain admissions requirements, admissions process, and transfer pathways for the program.', 'rules': ['Keep each field specific to admissions.'], 'section_keywords': ['admission', 'applicant', 'entry', 'acceptance', 'transfer'], 'allow_narrative_rule_fallback': True, 'fields': [{'name': 'admission_requirements', 'label': 'Admission Requirements', 'kind': 'narrative', 'keywords': ['requirements', 'eligibility', 'admission criteria', 'minimum grade', 'test score'], 'min_sentences': 3}, {'name': 'admission_process_summary', 'label': 'Admission Process Summary', 'kind': 'narrative', 'keywords': ['process', 'application', 'interview', 'decision', 'review'], 'min_sentences': 3}, {'name': 'transfer_pathways', 'label': 'Transfer Pathways', 'kind': 'narrative', 'keywords': ['transfer', 'pathway', 'articulation', 'bridge'], 'min_sentences': 2}]},
        'B. Evaluating Student Performance': {'purpose': 'Describe how academic performance is evaluated, how prerequisites are checked, and what happens when they are not met.', 'rules': ['Keep prerequisite verification and prerequisite-not-met action separate.'], 'section_keywords': ['performance', 'prerequisite', 'academic standing', 'evaluation'], 'fields': [{'name': 'pperformance_evaluation_process', 'label': 'Process for evaluating academic performance', 'kind': 'narrative', 'keywords': ['evaluate', 'performance', 'academic standing', 'warning', 'probation'], 'min_sentences': 3}, {'name': 'prerequisite_verification_method', 'label': 'How prerequisites are verified', 'kind': 'narrative', 'keywords': ['prerequisite', 'registration system', 'verified', 'checked'], 'min_sentences': 2}, {'name': 'prerequisite_not_met_action', 'label': 'What happens when prerequisites are not met', 'kind': 'narrative', 'keywords': ['not met', 'denied registration', 'override', 'exception'], 'min_sentences': 2}]},
        'C. Transfer Students and Transfer Courses': {'purpose': 'Describe transfer policy, transfer-credit evaluation, and articulation agreements.', 'rules': ['Only include transfer-specific policies and agreements.'], 'section_keywords': ['transfer', 'credit', 'articulation', 'equivalency'], 'fields': [{'name': 'transfer_policy_summary', 'label': 'Transfer policy summary', 'kind': 'narrative', 'keywords': ['transfer policy', 'transfer student', 'accepted credits'], 'min_sentences': 3}, {'name': 'transfer_credit_evaluation_process', 'label': 'Evaluation process for transfer credits', 'kind': 'narrative', 'keywords': ['evaluation process', 'syllabus review', 'equivalency'], 'min_sentences': 3}, {'name': 'articulation_agreements', 'label': 'State or institutional articulation agreements', 'kind': 'narrative', 'keywords': ['articulation agreement', 'partner institution', 'transfer pathway'], 'min_sentences': 2}]},
        'D. Advising and Career Guidance': {'purpose': 'Describe advising providers, frequency, and career guidance services.', 'rules': ['Distinguish advising providers, frequency, and career services.'], 'section_keywords': ['advising', 'advisor', 'career guidance', 'mentoring'], 'fields': [{'name': 'advising_providers', 'label': 'Who provides advising', 'kind': 'narrative', 'keywords': ['advisor', 'faculty adviser', 'department adviser', 'career office'], 'min_sentences': 2}, {'name': 'advising_frequency', 'label': 'How often advising sessions occur', 'kind': 'narrative', 'keywords': ['each semester', 'annually', 'before registration', 'regular meetings'], 'min_sentences': 2}, {'name': 'career_guidance_description', 'label': 'Description of career guidance services', 'kind': 'narrative', 'keywords': ['career guidance', 'internship', 'career center', 'industry talks', 'placement'], 'min_sentences': 3}]},
        'E. Work in Lieu of Courses': {'purpose': 'Explain policies for prior learning, work experience, advanced placement, or substitutions.', 'rules': ['Only include policies that replace or substitute coursework.'], 'section_keywords': ['credit by exam', 'prior learning', 'work experience', 'advanced placement'], 'fields': [{'name': 'work_in_lieu_policies', 'label': 'Work experience policies', 'kind': 'narrative', 'keywords': ['advanced placement', 'test out', 'prior learning', 'work experience', 'dual enrollment'], 'min_sentences': 3}, {'name': 'work_in_lieu_approval_process', 'label': 'Approval process and documentation', 'kind': 'narrative', 'keywords': ['approval', 'documentation', 'committee', 'petition'], 'min_sentences': 2}]},
        'F. Graduation Requirements': {'purpose': 'Capture minimum credits, GPA requirements, essential course categories, and degree name.', 'rules': ['Only fill minimum_required_credits if an explicit number is present.', 'Only fill required_gpa_or_standing with a numeric value such as 2.0 or 3.00.', 'Keep degree_name short and explicit.'], 'section_keywords': ['graduation', 'degree requirements', 'credit hours', 'GPA', 'degree'], 'fields': [{'name': 'minimum_required_credits', 'label': 'Minimum required credits', 'kind': 'integer', 'keywords': ['minimum credits', 'credit hours required', 'graduation requires']}, {'name': 'required_gpa_or_standing', 'label': 'Required GPA or standing', 'kind': 'decimal', 'keywords': ['minimum gpa', 'required gpa', 'gpa', 'minimum average']}, {'name': 'essential_courses_categories', 'label': 'List of essential courses / categories', 'kind': 'narrative', 'keywords': ['required courses', 'core courses', 'categories', 'general education', 'major requirements'], 'min_sentences': 2}, {'name': 'degree_name', 'label': 'Degree name', 'kind': 'short_text', 'keywords': ['degree awarded', 'degree name', 'bachelor of', 'master of']}]},
        'G. Transcripts of Recent Graduates': {'purpose': 'Describe transcript format and how the degree/program name appears.', 'rules': ['Focus only on graduate transcript wording and display details, not general graduation policy.', 'Ignore transcript mentions that are only about admissions, transfer-credit review, or prerequisite checking.', 'If the document does not clearly describe the graduate transcript itself, leave the fields blank.'], 'section_keywords': ['transcript format', 'official transcript', 'appears on transcript', 'listed on transcript', 'degree title', 'program title', 'major listed as'], 'strict_evidence': True, 'allow_narrative_rule_fallback': True, 'evidence_avoid_keywords': ['prerequisite', 'admission', 'application', 'interview', 'transfer', 'equivalenc', 'articulation', 'bridging courses'], 'fields': [{'name': 'transcript_format_explanation', 'label': 'Explanation of transcript format', 'kind': 'narrative', 'keywords': ['transcript format', 'official transcript', 'issued by the registrar', 'transcript includes', 'transcript shows', 'course titles', 'grades', 'credit hours'], 'min_sentences': 2}, {'name': 'program_name_on_transcript', 'label': 'Statement of how degree/program name appears', 'kind': 'narrative', 'keywords': ['appears on transcript', 'listed on transcript', 'degree title', 'program title', 'major listed as', 'degree awarded'], 'min_sentences': 2}]},
    },
    'criterion2': {
        'A. Mission Statement': {'purpose': 'Capture institutional mission, program mission, and where the mission is published.', 'rules': ['Preserve official wording as much as possible when a clear mission statement exists.'], 'section_keywords': ['mission statement', 'institutional mission', 'program mission', 'published', 'catalog'], 'fields': [{'name': 'institutional_mission_statement', 'label': 'Institutional Mission Statement', 'kind': 'narrative', 'keywords': ['institutional mission', 'university mission', 'mission statement'], 'min_sentences': 2}, {'name': 'program_mission_statement', 'label': 'Program Mission Statement', 'kind': 'narrative', 'keywords': ['program mission', 'department mission', 'mission statement'], 'min_sentences': 2}, {'name': 'mission_source_link', 'label': 'Source or link', 'kind': 'url_or_doc', 'keywords': ['http', 'www', 'catalog', 'website', 'handbook', 'brochure']}]},
        'C. Consistency of PEOs with Institutional Mission': {'purpose': 'Explain how the PEOs align with the institutional mission.', 'rules': ['Write specifically about alignment between PEOs and mission.'], 'section_keywords': ['alignment', 'consistent with mission', 'PEOs', 'institutional mission'], 'fields': [{'name': 'peos_mission_alignment_explanation', 'label': 'Mission alignment explanation', 'kind': 'narrative', 'keywords': ['align', 'support mission', 'PEOs', 'institutional mission'], 'min_sentences': 4}]},
        'D. Program Constituencies': {'purpose': 'Identify program constituencies and describe their role in developing or reviewing PEOs.', 'rules': ['List constituencies separately from their contributions.'], 'section_keywords': ['constituencies', 'alumni', 'employers', 'faculty', 'students', 'advisory board'], 'fields': [{'name': 'constituencies_list', 'label': 'List of constituencies', 'kind': 'narrative', 'keywords': ['students', 'alumni', 'employers', 'faculty', 'advisory board'], 'min_sentences': 2}, {'name': 'constituencies_contribution_description', 'label': 'Contribution description', 'kind': 'narrative', 'keywords': ['contribute', 'review', 'feedback', 'survey', 'input'], 'min_sentences': 3}]},
        'E. Process for Review of PEOs': {'purpose': 'Describe review frequency, participants, decision process, and changes since last review.', 'rules': ['Keep frequency, participants, process, and changes distinct.'], 'section_keywords': ['review process', 'PEO review', 'frequency', 'participants', 'feedback', 'changes'], 'fields': [{'name': 'peo_review_frequency', 'label': 'Frequency of review', 'kind': 'narrative', 'keywords': ['every year', 'every 3 years', 'periodic review', 'frequency'], 'min_sentences': 1}, {'name': 'peo_review_participants', 'label': 'Who is involved', 'kind': 'narrative', 'keywords': ['faculty', 'alumni', 'employers', 'advisory board', 'participants'], 'min_sentences': 2}, {'name': 'feedback_collection_and_decision_process', 'label': 'Feedback collection and decision process', 'kind': 'narrative', 'keywords': ['survey', 'meeting', 'feedback', 'decision', 'approval'], 'min_sentences': 3}, {'name': 'changes_since_last_peo_review', 'label': 'Changes made since last review', 'kind': 'narrative', 'keywords': ['changes', 'revised', 'updated', 'since last review'], 'min_sentences': 2}]},
    },
    'criterion7': {
        'C. Guidance': {'purpose': 'Describe guidance, orientation, and the faculty member responsible for it.', 'rules': ['Only fill responsible_faculty_name if a specific person is explicitly identified.'], 'section_keywords': ['guidance', 'orientation', 'support', 'facilities use', 'lab safety'], 'fields': [{'name': 'guidance_description', 'label': 'Guidance description', 'kind': 'narrative', 'keywords': ['orientation', 'guidance', 'training', 'safety', 'support'], 'min_sentences': 3}, {'name': 'responsible_faculty_name', 'label': 'Responsible Faculty Name', 'kind': 'name', 'keywords': ['responsible faculty', 'coordinator', 'faculty lead', 'director']}]},
        'D. Maintenance and Upgrading': {'purpose': 'Describe how maintenance and upgrades are planned, scheduled, and tracked for facilities and labs.', 'rules': ['Fill only the narrative maintenance policy textbox for this section.', 'Focus on planning, review cycles, replacement schedules, maintenance practices, and tracking methods.'], 'section_keywords': ['maintenance policy', 'planned upgrades', 'review cycle', 'replacement plan', 'maintenance schedule', 'preventive maintenance'], 'fields': [{'name': 'maintenance_policy_description', 'label': 'Maintenance Policy Description', 'kind': 'narrative', 'keywords': ['maintenance policy', 'planned upgrades', 'review cycle', 'replacement plan', 'preventive maintenance', 'maintenance schedule'], 'min_sentences': 2}]},
        'E. Library Services': {'purpose': 'Summarize technical collections, e-resources, book requests, and access hours/systems.', 'rules': ['Keep each field focused on its specific library support topic.'], 'section_keywords': ['library', 'database', 'journal', 'request', 'catalog', 'VPN', 'access'], 'fields': [{'name': 'technical_collections_and_journals', 'label': 'Technical collections and journals', 'kind': 'narrative', 'keywords': ['journals', 'technical collections', 'IEEE', 'books', 'references'], 'min_sentences': 2}, {'name': 'electronic_databases_and_eresources', 'label': 'Electronic databases and e-resources', 'kind': 'narrative', 'keywords': ['database', 'e-resource', 'digital library', 'Scopus', 'ScienceDirect', 'ACM'], 'min_sentences': 2}, {'name': 'faculty_book_request_process', 'label': 'Process for faculty book requests', 'kind': 'narrative', 'keywords': ['book request', 'procurement', 'acquisition', 'faculty request'], 'min_sentences': 2}, {'name': 'library_access_hours_and_systems', 'label': 'Access hours and systems', 'kind': 'narrative', 'keywords': ['hours', 'e-catalog', 'VPN', 'access', 'library systems'], 'min_sentences': 2}]},
        'F. Overall Comments': {'purpose': 'Describe how facilities support outcomes, safety/inspection, and compliance with university policy.', 'rules': ['Summarize high-level adequacy and compliance only.'], 'section_keywords': ['student outcomes', 'safety', 'inspection', 'compliance', 'policy'], 'fields': [{'name': 'facilities_support_student_outcomes', 'label': 'Facilities support student outcomes', 'kind': 'narrative', 'keywords': ['support student outcomes', 'hands-on', 'design', 'labs', 'projects'], 'min_sentences': 3}, {'name': 'safety_and_inspection_processes', 'label': 'Safety and inspection processes', 'kind': 'narrative', 'keywords': ['safety', 'inspection', 'audit', 'protocol', 'maintenance'], 'min_sentences': 3}, {'name': 'compliance_with_university_policy', 'label': 'Compliance with university policy', 'kind': 'narrative', 'keywords': ['university policy', 'compliance', 'accessibility', 'procurement'], 'min_sentences': 2}]},
    },
    'criterion8': {
        'A. Leadership': {'purpose': 'Describe leadership structure, adequacy, and participation in decisions affecting the program.', 'rules': ['Keep structure, adequacy, and participation as distinct ideas.'], 'section_keywords': ['leadership', 'chair', 'head', 'dean', 'decision making', 'quality assurance'], 'fields': [{'name': 'leadership_structure_description', 'label': 'Leadership structure', 'kind': 'narrative', 'keywords': ['structure', 'chair', 'head', 'dean', 'provost', 'reporting line'], 'min_sentences': 3}, {'name': 'leadership_adequacy_description', 'label': 'Leadership adequacy', 'kind': 'narrative', 'keywords': ['adequacy', 'quality', 'continuity', 'support', 'oversight'], 'min_sentences': 3}, {'name': 'leadership_participation_description', 'label': 'Leadership participation', 'kind': 'narrative', 'keywords': ['participate', 'curriculum', 'faculty decisions', 'committee', 'approval'], 'min_sentences': 3}]},
        'B. Program Budget and Financial Support': {'purpose': 'Describe budget continuity, teaching support, infrastructure funding, and resource adequacy.', 'rules': ['Keep the four subtopics separate.'], 'section_keywords': ['budget', 'financial support', 'teaching support', 'funding', 'resources'], 'fields': [{'name': 'budget_process_continuity', 'label': 'Budget process and continuity', 'kind': 'narrative', 'keywords': ['budget process', 'approved', 'annual budget', 'recurring funds', 'continuity'], 'min_sentences': 3}, {'name': 'teaching_support_description', 'label': 'Teaching support', 'kind': 'narrative', 'keywords': ['TA', 'grader', 'teaching support', 'equipment support', 'workshop'], 'min_sentences': 3}, {'name': 'infrastructure_funding_description', 'label': 'Infrastructure funding', 'kind': 'narrative', 'keywords': ['infrastructure', 'facilities funding', 'maintenance budget', 'upgrade budget'], 'min_sentences': 3}, {'name': 'resource_adequacy_description', 'label': 'Adequacy of resources', 'kind': 'narrative', 'keywords': ['adequacy', 'resources', 'student outcomes', 'sufficient', 'supports'], 'min_sentences': 3}]},
        'D. Faculty Hiring and Retention': {'purpose': 'Describe hiring processes and retention strategies for faculty.', 'rules': ['Separate hiring procedures from retention strategies.'], 'section_keywords': ['hiring', 'retention', 'recruitment', 'promotion', 'mentoring'], 'fields': [{'name': 'hiring_process_description', 'label': 'Hiring process', 'kind': 'narrative', 'keywords': ['advertising', 'search committee', 'approval', 'recruitment', 'interview'], 'min_sentences': 3}, {'name': 'retention_strategies_description', 'label': 'Retention strategies', 'kind': 'narrative', 'keywords': ['retention', 'promotion', 'salary review', 'recognition', 'mentoring'], 'min_sentences': 3}]},
        'E. Support of Faculty Professional Development': {'purpose': 'Describe development support types, request/approval process, and funding activity details.', 'rules': ['Keep support types, request process, and funding details distinct.'], 'section_keywords': ['professional development', 'sabbatical', 'travel funds', 'workshops', 'support'], 'fields': [{'name': 'professional_development_support_types', 'label': 'Support types', 'kind': 'narrative', 'keywords': ['sabbatical', 'travel funds', 'seminar', 'workshop', 'conference support'], 'min_sentences': 3}, {'name': 'professional_development_request_process', 'label': 'Request process', 'kind': 'narrative', 'keywords': ['request process', 'approval', 'application', 'committee', 'workflow'], 'min_sentences': 2}, {'name': 'professional_development_funding_details', 'label': 'Funding details', 'kind': 'narrative', 'keywords': ['funding', 'amount', 'participants', 'per year', 'support awarded'], 'min_sentences': 2}]},
    },
    'appendixd': {
        'Institution': {'purpose': 'Capture institutional identity, leadership, submitter, and accreditation history.', 'rules': ['Name fields should contain names only when possible; titles belong in title fields.', 'Leave title fields empty if not explicit.'], 'section_keywords': ['institution', 'president', 'provost', 'self-study', 'accreditation', 'evaluation dates'], 'fields': [{'name': 'institutionName', 'label': 'Institution Name and address', 'kind': 'narrative', 'keywords': ['name and address', 'institution', 'campus', 'address'], 'min_sentences': 2}, {'name': 'chiefExecutiveName', 'label': 'Chief executive officer name', 'kind': 'name', 'keywords': ['president', 'chief executive officer', 'CEO', 'rector']}, {'name': 'chiefExecutiveTitle', 'label': 'Chief executive officer title', 'kind': 'title', 'keywords': ['president', 'chief executive officer', 'CEO', 'rector']}, {'name': 'selfStudySubmitterName', 'label': 'Self-Study submitter name', 'kind': 'name', 'keywords': ['self-study', 'submitted by', 'prepared by', 'contact person']}, {'name': 'selfStudySubmitterTitle', 'label': 'Self-Study submitter title', 'kind': 'title', 'keywords': ['coordinator', 'chair', 'director', 'title', 'position']}, {'name': 'institutionalAccreditations', 'label': 'Institutional accreditations', 'kind': 'narrative', 'keywords': ['accreditation', 'accredited by', 'institutional accreditation'], 'min_sentences': 1}, {'name': 'accreditationEvaluationDates', 'label': 'Accreditation evaluation dates', 'kind': 'narrative', 'keywords': ['evaluation date', 'site visit', 'review date', 'accreditation period'], 'min_sentences': 1}]},
        'Type of Control': {'purpose': 'Describe the managerial control of the institution.', 'rules': ['State the control type clearly and briefly.'], 'section_keywords': ['private', 'public', 'non-profit', 'denominational', 'control'], 'fields': [{'name': 'controlTypeDescription', 'label': 'Type of Control', 'kind': 'narrative', 'keywords': ['type of control', 'private', 'public', 'non-profit', 'denominational'], 'min_sentences': 2}]},
        'Organization Chart': {'purpose': 'Describe the administrative chain of responsibility for the educational unit.', 'rules': ['Summarize reporting relationships only if explicit in the uploaded document.'], 'section_keywords': ['organization chart', 'administrative chain', 'reports to', 'dean', 'provost', 'chair'], 'fields': [{'name': 'administrativeChainDescription', 'label': 'Administrative chain description', 'kind': 'narrative', 'keywords': ['reports to', 'organizational structure', 'administrative chain', 'dean', 'provost', 'president'], 'min_sentences': 3}]},
    },
}


def extract_textbox_section(page_key, section_title, current_fields, files):
    page = SECTION_REGISTRY.get(f'{page_key or ""}'.strip().lower())
    config = page.get(f'{section_title or ""}'.strip()) if page else None
    if not config:
        return None, 'This section is not enabled for AI extraction.'

    text_parts = []
    file_names = []
    for uploaded_file in files:
        file_names.append(uploaded_file.name or 'document')
        extracted_text = _extract_text_from_uploaded_file(uploaded_file)
        if extracted_text.strip():
            text_parts.append(extracted_text)
    combined_text = '\n\n'.join(text_parts).strip()
    if not combined_text and not _has_pdf_uploads(files):
        return None, 'The selected files did not contain readable text for extraction.'

    blocks = _build_blocks(combined_text) if combined_text else []
    fields = config.get('fields') or []
    merged = {}
    applied = []
    preserved = []
    missing_fields = []
    for field in fields:
        name = field['name']
        existing = _clean_text((current_fields or {}).get(name))
        merged[name] = existing
        if existing:
            preserved.append(name)
        else:
            missing_fields.append(field)

    if not missing_fields:
        notes = ['All fields in this section were already filled, so the AI extraction step was skipped.']
        if file_names:
            notes.append(f'Source files: {", ".join(file_names[:4])}.')
        return {
            'mergedFields': merged,
            'appliedFields': applied,
            'preservedFields': preserved,
            'confidenceNotes': ' '.join(notes).strip(),
        }, None

    is_criterion1_admissions = (
        f'{page_key or ""}'.strip().lower() == 'criterion1' and
        f'{section_title or ""}'.strip() == 'A. Student Admissions'
    )
    is_criterion1_transcripts = (
        f'{page_key or ""}'.strip().lower() == 'criterion1' and
        f'{section_title or ""}'.strip() == 'G. Transcripts of Recent Graduates'
    )

    heuristic = {}
    if is_criterion1_admissions:
        heuristic.update(_extract_criterion1_student_admissions(combined_text, blocks))
    elif is_criterion1_transcripts:
        heuristic.update(_extract_criterion1_transcript_fields(combined_text))
    for field in fields:
        if field['name'] not in heuristic:
            heuristic[field['name']] = _clean_text(_extract_generic_value(field, blocks, config.get('section_keywords') or []))

    rule_fallback_allowed_fields = [
        field for field in missing_fields
        if _field_allows_textbox_rule_fallback(field, config)
    ]
    rule_fallback_blocked_fields = [
        field for field in missing_fields
        if field not in rule_fallback_allowed_fields
    ]

    gemini_fields, gemini_error = _run_textbox_gemini(
        page_key,
        section_title,
        config,
        combined_text,
        current_fields or {},
        files=files,
        heuristic=heuristic,
    )
    if isinstance(gemini_fields, dict):
        applied_gemini = []
        for field in missing_fields:
            value = _clean_text(gemini_fields.get(field['name']))
            if value:
                merged[field['name']] = value
                applied_gemini.append(field['name'])
        if applied_gemini:
            notes = [
                gemini_fields.get('confidenceNotes')
                or 'Gemini separated the uploaded evidence by field and left uncertain values blank.'
            ]
            if len(applied_gemini) < len(missing_fields):
                notes.append('Fields without clear evidence were left blank.')
            if file_names:
                notes.append(f'Source files: {", ".join(file_names[:4])}.')
            return {
                'mergedFields': merged,
                'appliedFields': applied_gemini,
                'preservedFields': preserved,
                'confidenceNotes': ' '.join(note for note in notes if note).strip(),
            }, None

    if (
        missing_fields and
        len(rule_fallback_allowed_fields) == len(missing_fields) and
        all(_is_strong_heuristic_value(field, heuristic.get(field['name'])) for field in rule_fallback_allowed_fields)
    ):
        for field in rule_fallback_allowed_fields:
            value = heuristic.get(field['name']) or ''
            merged[field['name']] = value
            if value:
                applied.append(field['name'])
        notes = ['High-confidence rule-based extraction completed after Gemini returned no confident field values for this section.']
        if gemini_error:
            notes.append(f'Gemini was not used: {gemini_error} A rule-based fallback was applied instead.')
        if file_names:
            notes.append(f'Source files: {", ".join(file_names[:4])}.')
        return {
            'mergedFields': merged,
            'appliedFields': applied,
            'preservedFields': preserved,
            'confidenceNotes': ' '.join(notes).strip(),
        }, None

    for field in rule_fallback_allowed_fields:
        name = field['name']
        extracted = heuristic.get(name) or ''
        if not merged.get(name):
            merged[name] = extracted
            if extracted:
                applied.append(name)

    notes = ['Section-specific extraction rules were applied conservatively, and uncertain fields were left empty.']
    if gemini_error:
        notes.append(f'Gemini was not used: {gemini_error} A rule-based fallback was applied instead.')
    else:
        notes.append('Gemini did not return confident field values for this section, so a rule-based fallback was applied instead.')
    if rule_fallback_blocked_fields:
        notes.append('Some narrative fields were left blank instead of being guessed because safe rule-based fallback is disabled for that section.')
    if len(applied) < len(missing_fields):
        notes.append('Fields without clear evidence were left blank.')
    if file_names:
        notes.append(f'Source files: {", ".join(file_names[:4])}.')

    return {'mergedFields': merged, 'appliedFields': applied, 'preservedFields': preserved, 'confidenceNotes': ' '.join(notes).strip()}, None


STRUCTURED_SECTION_REGISTRY = {
    'criterion7': {
        'A. Offices': {
            'mode': 'fields',
            'purpose': 'Extract concise office-count information and student availability details for Criterion 7 facilities.',
            'sheet_hint': 'Offices',
            'rules': [
                'Use explicit numeric evidence only for counts and average size values.',
                'Keep student availability details concise and factual.',
                'Leave any uncertain field empty instead of guessing.',
            ],
            'section_keywords': ['office', 'workspace', 'faculty offices', 'TA offices', 'availability', 'office hours'],
            'fields': [
                {'name': 'total_number_of_offices', 'label': 'Total Number of Offices', 'kind': 'integer', 'keywords': ['total offices', 'number of offices', 'offices']},
                {'name': 'average_workspace_size', 'label': 'Average Workspace Size', 'kind': 'decimal', 'keywords': ['average workspace size', 'square meters', 'm2', 'm^2', 'office size']},
                {'name': 'student_availability_details', 'label': 'Student Availability Details', 'kind': 'short_text', 'keywords': ['office hours', 'availability', 'student access', 'posted hours']},
            ],
        },
        'A. Classrooms': {
            'mode': 'rows',
            'purpose': 'Extract one complete classroom row for each explicitly described classroom used by the program.',
            'sheet_hint': 'Classrooms',
            'rules': [
                'Return one row per classroom when the classroom identity is clear, even if some secondary columns are missing.',
                'If a classroom room name is missing but at least two other classroom-specific values are explicit, return a partial row and leave the room blank.',
                'Use short cell-ready values, not long sentences.',
                'It is acceptable to leave secondary columns blank when the document does not state them explicitly.',
            ],
            'section_keywords': ['classroom', 'lecture room', 'capacity', 'projector', 'internet', 'typical use'],
            'row_label': 'classroom rows',
            'required_row_fields': ['classroom_room'],
            'allow_partial_rows': True,
            'min_row_non_empty_fields': 2,
            'row_anchor_fields': ['classroom_room', 'classroom_capacity', 'classroom_multimedia', 'classroom_typical_use', 'classroom_adequacy_comments'],
            'dedupe_keys': ['classroom_room'],
            'row_fields': [
                {'name': 'classroom_room', 'label': 'Room', 'kind': 'short_text', 'keywords': ['room', 'classroom', 'hall']},
                {'name': 'classroom_capacity', 'label': 'Capacity', 'kind': 'integer', 'keywords': ['capacity', 'seats', 'students']},
                {'name': 'classroom_multimedia', 'label': 'Multimedia', 'kind': 'short_text', 'keywords': ['multimedia', 'projector', 'display', 'audio', 'smart board']},
                {'name': 'classroom_internet_access', 'label': 'Internet Access', 'kind': 'short_text', 'keywords': ['internet', 'wi-fi', 'wifi', 'LAN', 'network']},
                {'name': 'classroom_typical_use', 'label': 'Typical Use', 'kind': 'short_text', 'keywords': ['typical use', 'used for', 'lecture', 'tutorial']},
                {'name': 'classroom_adequacy_comments', 'label': 'Adequacy Comments', 'kind': 'short_text', 'keywords': ['adequacy', 'comments', 'condition', 'sufficient', 'upgrade']},
            ],
        },
        'A. Laboratories': {
            'mode': 'rows',
            'purpose': 'Extract one complete laboratory row for each program laboratory explicitly described in the uploaded evidence.',
            'sheet_hint': 'Laboratories',
            'rules': [
                'Return laboratory rows whenever the lab identity is clear, even if some secondary columns are blank.',
                'If a lab name is missing but at least two other lab-specific values are explicit, return a partial row and leave the missing cells blank.',
                'Hardware, software, open hours, and course-use fields should stay concise.',
                'It is acceptable to leave secondary columns blank when they are not explicit.',
            ],
            'section_keywords': ['laboratory', 'lab room', 'hardware', 'software', 'open hours', 'courses using lab'],
            'row_label': 'laboratory rows',
            'required_row_fields': ['lab_name'],
            'allow_partial_rows': True,
            'min_row_non_empty_fields': 2,
            'row_anchor_fields': ['lab_name', 'lab_room', 'lab_category', 'lab_hardware_list', 'lab_software_list', 'lab_courses_using_lab'],
            'dedupe_keys': ['lab_name', 'lab_room'],
            'row_fields': [
                {'name': 'lab_name', 'label': 'Lab Name', 'kind': 'short_text', 'keywords': ['lab name', 'laboratory']},
                {'name': 'lab_room', 'label': 'Room', 'kind': 'short_text', 'keywords': ['room', 'location']},
                {'name': 'lab_category', 'label': 'Category', 'kind': 'short_text', 'keywords': ['category', 'discipline', 'type']},
                {'name': 'lab_hardware_list', 'label': 'Hardware List', 'kind': 'short_text', 'keywords': ['hardware', 'equipment', 'kits', 'instruments']},
                {'name': 'lab_software_list', 'label': 'Software List', 'kind': 'short_text', 'keywords': ['software', 'platforms', 'tools', 'licenses']},
                {'name': 'lab_open_hours', 'label': 'Open Hours', 'kind': 'short_text', 'keywords': ['hours', 'open', 'availability']},
                {'name': 'lab_courses_using_lab', 'label': 'Courses Using Lab', 'kind': 'short_text', 'keywords': ['courses using lab', 'used by', 'courses served']},
            ],
        },
        'B. Computing Resources': {
            'mode': 'rows',
            'purpose': 'Extract concise computing-resource rows for shared resources available to students.',
            'sheet_hint': 'Computing Resources',
            'rules': [
                'Return computing resources whenever the resource identity is clear, even if some descriptive columns are blank.',
                'If a formal resource name is missing but at least two other computing-resource values are explicit, return a partial row and leave the missing cells blank.',
                'Keep each value concise and table-ready.',
                'Omit only clearly uncertain resource identities.',
            ],
            'section_keywords': ['computing resource', 'server', 'cluster', 'VPN', 'access', 'hours available'],
            'row_label': 'computing resource rows',
            'required_row_fields': ['computing_resource_name'],
            'allow_partial_rows': True,
            'min_row_non_empty_fields': 2,
            'row_anchor_fields': ['computing_resource_name', 'computing_resource_location', 'computing_access_type', 'computing_hours_available', 'computing_adequacy_notes'],
            'dedupe_keys': ['computing_resource_name', 'computing_resource_location'],
            'row_fields': [
                {'name': 'computing_resource_name', 'label': 'Resource', 'kind': 'short_text', 'keywords': ['resource', 'cluster', 'lab', 'server', 'platform']},
                {'name': 'computing_resource_location', 'label': 'Location', 'kind': 'short_text', 'keywords': ['location', 'building', 'room', 'virtual']},
                {'name': 'computing_access_type', 'label': 'Access Type', 'kind': 'short_text', 'keywords': ['access', 'VPN', 'on-campus', 'remote']},
                {'name': 'computing_hours_available', 'label': 'Hours Available', 'kind': 'short_text', 'keywords': ['hours', '24/7', 'available']},
                {'name': 'computing_adequacy_notes', 'label': 'Adequacy Notes', 'kind': 'short_text', 'keywords': ['adequacy', 'capacity', 'notes', 'sufficient']},
            ],
        },
        'D. Maintenance and Upgrading': {
            'mode': 'mixed',
            'purpose': 'Extract a short maintenance-policy summary plus complete maintenance/upgrading rows for facilities and labs.',
            'sheet_hint': 'Maintenance',
            'rules': [
                'Use a short narrative for the maintenance policy only when the evidence is explicit.',
                'Return maintenance rows with normalized ISO dates when dates are explicit.',
                'If a facility name is missing but at least two other maintenance-specific values are explicit, return a partial row and leave the missing cells blank.',
            ],
            'section_keywords': ['maintenance', 'upgrade', 'replacement', 'facility review', 'equipment plan'],
            'fields': [
                {'name': 'maintenance_policy_description', 'label': 'Maintenance Policy Description', 'kind': 'narrative', 'keywords': ['maintenance policy', 'planned upgrades', 'review cycle', 'replacement plan'], 'min_sentences': 2},
            ],
            'row_label': 'maintenance rows',
            'required_row_fields': [
                'facility_name',
                'last_upgrade_date',
                'next_scheduled_upgrade',
                'responsible_staff',
                'maintenance_notes',
            ],
            'allow_partial_rows': True,
            'min_row_non_empty_fields': 2,
            'row_anchor_fields': ['facility_name', 'last_upgrade_date', 'next_scheduled_upgrade', 'responsible_staff', 'maintenance_notes'],
            'dedupe_keys': ['facility_name'],
            'row_fields': [
                {'name': 'facility_name', 'label': 'Facility / Lab', 'kind': 'short_text', 'keywords': ['facility', 'lab', 'room', 'space']},
                {'name': 'last_upgrade_date', 'label': 'Last Upgrade', 'kind': 'date', 'keywords': ['last upgrade', 'upgraded', 'installed', 'replaced']},
                {'name': 'next_scheduled_upgrade', 'label': 'Next Scheduled', 'kind': 'date', 'keywords': ['next scheduled', 'planned upgrade', 'replacement date']},
                {'name': 'responsible_staff', 'label': 'Responsible Staff', 'kind': 'short_text', 'keywords': ['responsible staff', 'support team', 'technician', 'engineer']},
                {'name': 'maintenance_notes', 'label': 'Notes', 'kind': 'short_text', 'keywords': ['notes', 'maintenance notes', 'status', 'completed']},
            ],
        },
    },
    'criterion8': {
        'C. Staffing': {
            'mode': 'mixed',
            'purpose': 'Extract staffing rows and a short narrative on staffing adequacy for Criterion 8 institutional support.',
            'sheet_hint': 'Staffing',
            'rules': [
                'Return one row per staffing category and primary role combination.',
                'Use integers only for staff counts.',
                'It is acceptable to leave secondary staffing details blank when they are not explicit.',
            ],
            'section_keywords': ['staffing', 'administrative staff', 'technical staff', 'assistants', 'retention', 'training'],
            'fields': [
                {'name': 'additional_narrative_on_staffing', 'label': 'Additional Narrative On Staffing', 'kind': 'narrative', 'keywords': ['staffing adequacy', 'support staff', 'administrative support', 'technical support'], 'min_sentences': 2},
            ],
            'row_label': 'staffing rows',
            'required_row_fields': ['category'],
            'dedupe_keys': ['category', 'primary_role'],
            'row_fields': [
                {'name': 'category', 'label': 'Category', 'kind': 'short_text', 'keywords': ['category', 'administrative', 'technical', 'assistants']},
                {'name': 'number_of_staff', 'label': 'Number', 'kind': 'integer', 'keywords': ['number', 'count', 'staff']},
                {'name': 'primary_role', 'label': 'Primary Role', 'kind': 'short_text', 'keywords': ['role', 'responsibility', 'supports']},
                {'name': 'training_retention_practices', 'label': 'Training / Retention Practices', 'kind': 'short_text', 'keywords': ['training', 'retention', 'mentoring', 'development']},
            ],
        },
    },
    'appendixc': {
        'Inventory Sheet': {
            'mode': 'rows',
            'purpose': 'Extract equipment inventory rows for Appendix C using short table-ready values.',
            'sheet_hint': 'Inventory',
            'rules': [
                'Return only rows with explicit equipment name, manufacturer/model, quantity, location, instructional use/course use, and service date.',
                'Normalize dates to YYYY-MM-DD.',
                'Leave optional fields blank if they are not explicit, but omit the row if any required field is missing.',
            ],
            'section_keywords': ['equipment', 'inventory', 'model', 'quantity', 'location', 'course use', 'service', 'maintenance'],
            'row_label': 'equipment rows',
            'required_row_fields': ['name', 'cat', 'qty', 'loc', 'use', 'service'],
            'dedupe_keys': ['name', 'loc'],
            'row_fields': [
                {'name': 'name', 'label': 'Equipment Name/Description', 'kind': 'short_text', 'keywords': ['equipment', 'instrument', 'device', 'name']},
                {'name': 'cat', 'label': 'Manufacturer / Model', 'kind': 'short_text', 'keywords': ['manufacturer', 'model', 'vendor']},
                {'name': 'qty', 'label': 'Quantity', 'kind': 'integer', 'keywords': ['quantity', 'units', 'count']},
                {'name': 'loc', 'label': 'Location', 'kind': 'short_text', 'keywords': ['location', 'building', 'room', 'lab']},
                {'name': 'use', 'label': 'Course(s) / Instructional Use', 'kind': 'short_text', 'keywords': ['course', 'instructional use', 'used in', 'supports']},
                {'name': 'outcomes', 'label': 'Outcomes Supported', 'kind': 'short_text', 'keywords': ['outcomes', 'student outcomes']},
                {'name': 'condition', 'label': 'Condition', 'kind': 'short_text', 'keywords': ['condition', 'operational', 'status']},
                {'name': 'service', 'label': 'Last Calibration / Service Date', 'kind': 'date', 'keywords': ['service date', 'calibration', 'inspection', 'last serviced']},
                {'name': 'maintenance_notes', 'label': 'Maintenance / Safety Notes', 'kind': 'short_text', 'keywords': ['maintenance notes', 'safety notes', 'notes']},
            ],
        },
    },
}

CRITERION7_EXCEL_ONLY_STRUCTURED_SECTIONS = {
    'A. Classrooms',
    'A. Laboratories',
    'B. Computing Resources',
    'D. Maintenance and Upgrading',
}

CRITERION8_EXCEL_ONLY_STRUCTURED_SECTIONS = {
    'C. Staffing',
}

APPENDIXC_EXCEL_ONLY_STRUCTURED_SECTIONS = {
    'Inventory Sheet',
}


def _dedupe_row_key(row, key_fields):
    parts = [_clean_text(row.get(field)).lower() for field in (key_fields or [])]
    parts = [part for part in parts if part]
    if parts:
        return '||'.join(parts)
    fallback_parts = []
    for field_name in sorted((row or {}).keys()):
        value = _clean_text((row or {}).get(field_name)).lower()
        if value:
            fallback_parts.append(f'{field_name}:{value}')
    return '||'.join(fallback_parts)


def _sanitize_structured_row(config, row):
    if not isinstance(row, dict):
        return None
    sanitized = {}
    for field in config.get('row_fields') or []:
        value = _sanitize_structured_value(row.get(field['name']), field.get('kind'))
        if value and _is_valid_value(value, field.get('kind')):
            sanitized[field['name']] = value
        else:
            sanitized[field['name']] = ''
    non_empty_count = sum(1 for value in sanitized.values() if _clean_text(value))
    if non_empty_count == 0:
        return None
    required = config.get('required_row_fields') or []
    allow_partial_rows = bool(config.get('allow_partial_rows'))
    if required and any(not sanitized.get(field_name) for field_name in required):
        if not allow_partial_rows:
            return None
    if allow_partial_rows:
        min_non_empty_fields = int(config.get('min_row_non_empty_fields') or 0)
        anchor_fields = [field_name for field_name in (config.get('row_anchor_fields') or []) if field_name]
        if min_non_empty_fields and non_empty_count < min_non_empty_fields:
            return None
        if anchor_fields and not any(_clean_text(sanitized.get(field_name)) for field_name in anchor_fields):
            return None
    return sanitized


def _extract_structured_field_values(config, blocks):
    extracted = {}
    for field in config.get('fields') or []:
        extracted[field['name']] = _clean_text(_extract_generic_value(field, blocks, config.get('section_keywords') or []))
    return extracted


def _structured_row_has_any_content(config, row):
    if not isinstance(row, dict):
        return False
    field_names = [field.get('name') for field in (config.get('row_fields') or []) if field.get('name')]
    return any(_clean_text(row.get(field_name)) for field_name in field_names)


def _structured_existing_row_keys(config, current_state):
    if not isinstance(current_state, dict):
        return set()
    rows = current_state.get('rows')
    if not isinstance(rows, list):
        return set()
    key_fields = config.get('dedupe_keys') or []
    if not key_fields:
        return set()
    keys = set()
    for row in rows:
        if not _structured_row_has_any_content(config, row):
            continue
        key = _dedupe_row_key(row, key_fields)
        if key:
            keys.add(key)
    return keys


def _run_structured_gemini(page_key, section_title, config, combined_text, current_state, files=None, heuristic_fields=None):
    extra_parts = _build_gemini_background_file_parts(files)
    field_defs = config.get('fields') or []
    row_fields = config.get('row_fields') or []
    field_names = [field.get('name') for field in field_defs if field.get('name')]
    current_fields = (current_state or {}).get('fields') if isinstance(current_state, dict) else {}
    current_rows = (current_state or {}).get('rows') if isinstance(current_state, dict) else []
    heuristic_rows = []
    if _is_excel_only_structured_section(f'{page_key or ""}'.strip().lower(), section_title):
        _, heuristic_rows = _extract_excel_structured_draft(files, config)

    prompt_parts = [
        f'You are filling ABET {TEXTBOX_GEMINI_PAGE_LABELS.get(f"{page_key or ""}".strip().lower(), page_key)} section "{section_title}".',
        f'Section purpose: {config.get("purpose", "")}',
        'Read the entire provided evidence carefully. Combine consistent facts across multiple uploaded documents.',
        'If PDF files are attached, read them directly in addition to the extracted text snippets.',
        'Use only the provided evidence. Never invent facts or infer precise values that are not supported.',
        'Return only valid JSON with this exact shape: {"fields": {...}, "rows": [...], "confidenceNotes": "short note"}.',
    ]

    rules = config.get('rules') or []
    if rules:
        prompt_parts.append('Section rules:\n' + '\n'.join(f'- {rule}' for rule in rules))

    if field_defs:
        prompt_parts.append(
            'Allowed scalar fields:\n' + '\n'.join(
                f'- {field["name"]}: {field.get("label", field["name"])} ({field.get("kind", "text")})'
                for field in field_defs
            )
        )

    if row_fields:
        prompt_parts.append(
            'Allowed row fields:\n' + '\n'.join(
                f'- {field["name"]}: {field.get("label", field["name"])} ({field.get("kind", "text")})'
                for field in row_fields
            )
        )
        prompt_parts.extend([
            f'Row identity / dedupe keys: {", ".join(config.get("dedupe_keys") or []) or "none"}',
            f'Required fields for each returned row: {", ".join(config.get("required_row_fields") or []) or "none"}',
            'Return one row per distinct real-world item. Do not combine different classrooms, labs, computing resources, or facilities into one row.',
            'Return only new rows that should be inserted into empty placeholders or appended. Do not repeat or replace any existing non-empty row from the current saved state.',
            'Keep all row values short, cell-ready, and specific. Do not write full paragraphs inside row cells.',
            'Use YYYY-MM-DD for explicit dates and digits only for numeric fields.',
        ])
        if _is_excel_only_structured_section(f'{page_key or ""}'.strip().lower(), section_title):
            prompt_parts.extend([
                'The uploaded spreadsheet is already structured. Treat each listed source spreadsheet row as a candidate ABET row.',
                'If the spreadsheet clearly contains 5 distinct relevant rows, you should usually return 5 ABET rows unless one is blank, irrelevant, or already exists in the current saved state.',
                'Do not drop a source spreadsheet row just because some secondary cells are blank. Map the clear values you do have and leave uncertain cells empty.',
                'Use the detected spreadsheet headers semantically. Similar headers such as "Courses Using", "Access Type", "Notes", or "Facility / Lab" should be mapped to the matching ABET row fields.',
            ])

    if config.get('mode') == 'fields':
        prompt_parts.append('If a scalar field is already filled in the current saved state, keep it unchanged unless the evidence clearly shows a better direct value. Prefer leaving uncertain fields empty.')
        if _is_excel_only_structured_section(f'{page_key or ""}'.strip().lower(), section_title):
            prompt_parts.append('This section does not need output rows. Read key-value style spreadsheet content carefully and fill only the scalar fields from explicit spreadsheet evidence.')
    else:
        prompt_parts.append('Any existing row with content is protected. Do not try to complete, edit, or rewrite it in the response.')

    prompt_parts.append(
        f'Current saved scalar fields:\n{json.dumps({name: _clean_text((current_fields or {}).get(name)) for name in field_names}, ensure_ascii=True)}'
    )
    prompt_parts.append(
        f'Current saved rows:\n{json.dumps(current_rows if isinstance(current_rows, list) else [], ensure_ascii=True)}'
    )
    if isinstance(heuristic_fields, dict) and heuristic_fields:
        prompt_parts.append(f'High-confidence heuristic hints:\n{json.dumps(heuristic_fields, ensure_ascii=True)}')
    if heuristic_rows:
        prompt_parts.append(
            'High-confidence spreadsheet row draft (already interpreted from the workbook headers; preserve these rows unless they are clearly duplicates of existing saved rows):\n'
            + json.dumps(heuristic_rows, ensure_ascii=True)
        )
    prompt_parts.append(f'Relevant evidence excerpt:\n{combined_text}')
    prompt_parts.append(
        'confidenceNotes should briefly mention conflicts or limitations when relevant. '
        'If the evidence is weak, return fewer rows or empty fields rather than guessing.'
    )

    return _run_gemini_json_prompt('\n\n'.join(part for part in prompt_parts if part), extra_parts=extra_parts)


def _is_excel_upload_name(file_name):
    return f'{file_name or ""}'.strip().lower().endswith(('.xlsx', '.xlsm'))


def _build_excel_workbook_prompt_text(uploaded_file, config):
    file_name = uploaded_file.name or 'workbook.xlsx'
    uploaded_file.seek(0)
    workbook_data = _extract_xlsx_workbook_data(uploaded_file.read(), max_rows_per_sheet=220)
    uploaded_file.seek(0)
    if not workbook_data:
        return '', 0

    section_title = _clean_text(config.get('sheet_hint') or '')
    section_keywords = [f'{keyword or ""}'.strip().lower() for keyword in (config.get('section_keywords') or []) if f'{keyword or ""}'.strip()]

    def sheet_score(sheet):
        sheet_name = _clean_text(sheet.get('sheet_name')).lower()
        preview_rows = sheet.get('rows') or []
        preview_text = ' '.join(' '.join(_clean_text(cell) for cell in row[:8] if _clean_text(cell)) for row in preview_rows[:5]).lower()
        score = 0
        if section_title and section_title.lower() in sheet_name:
            score += 6
        if section_title and section_title.lower() in preview_text:
            score += 4
        for keyword in section_keywords:
            if keyword and keyword in sheet_name:
                score += 3
            if keyword and keyword in preview_text:
                score += 1
        return score

    ranked_sheets = sorted(workbook_data, key=sheet_score, reverse=True)
    if ranked_sheets and sheet_score(ranked_sheets[0]) > 0:
        workbook_data = [ranked_sheets[0]]
    else:
        workbook_data = ranked_sheets[:1]

    lines = [f'Workbook: {file_name}']
    total_rows = 0
    total_row_limit = 260

    for sheet in workbook_data:
        rows = sheet.get('rows') or []
        if not rows:
            continue
        sheet_name = sheet.get('sheet_name') or 'Sheet'
        header_index = _detect_xlsx_header_index(rows)
        headers = rows[header_index]
        has_header = (
            len(rows) > header_index + 1 and
            sum(1 for header in headers if _clean_text(header)) >= 2 and
            any(header and not re.fullmatch(r'\d+(?:\.\d+)?', header) for header in headers)
        )
        lines.append(f'Sheet: {sheet_name}')
        if has_header:
            lines.append('Detected headers: ' + ' | '.join(header or f'Column {index + 1}' for index, header in enumerate(headers)))
            lines.append('Header hints: interpret similar spreadsheet headers semantically, even when they do not exactly match the ABET field names.')
        if header_index > 0:
            title_lines = [' | '.join(_clean_text(cell) for cell in row if _clean_text(cell)) for row in rows[:header_index]]
            title_lines = [line for line in title_lines if line]
            if title_lines:
                lines.append('Sheet context: ' + ' || '.join(title_lines))

        data_rows = rows[header_index + 1:] if has_header else rows
        for row_index, row in enumerate(data_rows, start=1):
            pairs = []
            for cell_index, cell in enumerate(row):
                value = _clean_text(cell)
                if not value:
                    continue
                header = headers[cell_index] if has_header and cell_index < len(headers) and headers[cell_index] else f'Column {cell_index + 1}'
                pairs.append(f'{header}: {value}')
            if not pairs:
                continue
            lines.append(f'Row {row_index}: ' + '; '.join(pairs))
            total_rows += 1
            if total_rows >= total_row_limit:
                break
        if total_rows >= total_row_limit:
            break

    if total_rows == 0:
        return '', 0

    lines.append(f'Detected candidate spreadsheet rows for this section: {total_rows}')
    lines.append(
        f'For section "{config.get("row_label") or "rows"}", interpret spreadsheet column meanings flexibly. '
        'A sheet may use different header names or column order, but you should still understand which values belong in the ABET rows.'
    )
    return '\n'.join(lines), total_rows


def _score_workbook_sheet_for_section(sheet, config):
    sheet_name = _clean_text((sheet or {}).get('sheet_name')).lower()
    preview_rows = (sheet or {}).get('rows') or []
    preview_text = ' '.join(
        ' '.join(_clean_text(cell) for cell in row[:8] if _clean_text(cell))
        for row in preview_rows[:5]
    ).lower()
    section_title = _clean_text(config.get('sheet_hint') or '').lower()
    section_keywords = [
        f'{keyword or ""}'.strip().lower()
        for keyword in (config.get('section_keywords') or [])
        if f'{keyword or ""}'.strip()
    ]
    score = 0
    if section_title and section_title in sheet_name:
        score += 6
    if section_title and section_title in preview_text:
        score += 4
    for keyword in section_keywords:
        if keyword and keyword in sheet_name:
            score += 3
        if keyword and keyword in preview_text:
            score += 1
    return score


def _select_relevant_workbook_sheets(workbook_data, config, max_sheets=1):
    ranked_sheets = sorted(workbook_data or [], key=lambda sheet: _score_workbook_sheet_for_section(sheet, config), reverse=True)
    if ranked_sheets and _score_workbook_sheet_for_section(ranked_sheets[0], config) > 0:
        return [sheet for sheet in ranked_sheets if _score_workbook_sheet_for_section(sheet, config) > 0][:max_sheets]
    return ranked_sheets[:max_sheets]


def _detect_xlsx_header_index(rows):
    max_scan = min(len(rows), 4)
    best_index = 0
    best_score = -1
    for index in range(max_scan):
        row = rows[index]
        non_empty = [cell for cell in row if _clean_text(cell)]
        if not non_empty:
            continue
        score = 0
        if len(non_empty) >= 2:
            score += 3
        if len(non_empty) >= 4:
            score += 2
        if any(not re.fullmatch(r'\d+(?:\.\d+)?', _clean_text(cell)) for cell in non_empty):
            score += 2
        if score > best_score:
            best_score = score
            best_index = index
    return best_index


def _normalize_header_token(value):
    return re.sub(r'[^a-z0-9]+', ' ', _clean_text(value).lower()).strip()


def _header_tokens_for_field(field):
    candidates = {
        _normalize_header_token(field.get('name')),
        _normalize_header_token(field.get('label')),
    }
    for keyword in field.get('keywords') or []:
        candidates.add(_normalize_header_token(keyword))
    return {candidate for candidate in candidates if candidate}


def _match_header_to_field(header_value, fields):
    normalized_header = _normalize_header_token(header_value)
    if not normalized_header:
        return None
    best_field = None
    best_score = 0
    for field in fields or []:
        for candidate in _header_tokens_for_field(field):
            score = 0
            if normalized_header == candidate:
                score = 10
            elif normalized_header in candidate or candidate in normalized_header:
                score = 7
            else:
                header_parts = set(normalized_header.split())
                candidate_parts = set(candidate.split())
                overlap = len(header_parts & candidate_parts)
                if overlap:
                    score = overlap
            if score > best_score:
                best_score = score
                best_field = field
    return best_field if best_score >= 2 else None


def _extract_criterion7_spreadsheet_draft(files, config):
    draft_fields = {}
    draft_rows = []
    for uploaded_file in files or []:
        if not _is_excel_upload_name(uploaded_file.name):
            continue
        uploaded_file.seek(0)
        workbook_data = _extract_xlsx_workbook_data(uploaded_file.read(), max_rows_per_sheet=220)
        uploaded_file.seek(0)
        for sheet in _select_relevant_workbook_sheets(workbook_data, config, max_sheets=1):
            rows = sheet.get('rows') or []
            if not rows:
                continue
            header_index = _detect_xlsx_header_index(rows)
            headers = rows[header_index] if header_index < len(rows) else []
            has_header = (
                len(rows) > header_index + 1 and
                sum(1 for header in headers if _clean_text(header)) >= 2 and
                any(header and not re.fullmatch(r'\d+(?:\.\d+)?', header) for header in headers)
            )

            if config.get('mode') == 'fields':
                for row in rows[header_index + 1:] if has_header else rows:
                    if len(row) < 2:
                        continue
                    key = _clean_text(row[0])
                    value = _clean_text(row[1])
                    if not key or not value:
                        continue
                    matched_field = _match_header_to_field(key, config.get('fields') or [])
                    if not matched_field:
                        continue
                    sanitized = _sanitize_structured_value(value, matched_field.get('kind'))
                    if sanitized and _is_valid_value(sanitized, matched_field.get('kind')) and not draft_fields.get(matched_field['name']):
                        draft_fields[matched_field['name']] = sanitized
                continue

            if config.get('mode') == 'mixed':
                context_lines = [
                    ' '.join(_clean_text(cell) for cell in row if _clean_text(cell))
                    for row in rows[:header_index]
                ]
                context_lines = [line for line in context_lines if line]
                if context_lines:
                    narrative_field = next((field for field in (config.get('fields') or []) if field.get('kind') == 'narrative'), None)
                    if narrative_field and not draft_fields.get(narrative_field['name']):
                        narrative = ' '.join(context_lines[1:] if len(context_lines) > 1 else context_lines)
                        narrative = _clean_text(narrative)
                        if narrative:
                            draft_fields[narrative_field['name']] = narrative

            if not has_header:
                continue
            header_map = {}
            for column_index, header in enumerate(headers):
                matched_field = _match_header_to_field(header, config.get('row_fields') or [])
                if matched_field and matched_field['name'] not in header_map.values():
                    header_map[column_index] = matched_field['name']
            if not header_map:
                continue

            for row in rows[header_index + 1:]:
                row_payload = {}
                for column_index, field_name in header_map.items():
                    if column_index >= len(row):
                        continue
                    field_config = next((field for field in (config.get('row_fields') or []) if field.get('name') == field_name), None)
                    if not field_config:
                        continue
                    sanitized = _sanitize_structured_value(row[column_index], field_config.get('kind'))
                    if sanitized and _is_valid_value(sanitized, field_config.get('kind')):
                        row_payload[field_name] = sanitized
                sanitized_row = _sanitize_structured_row(config, row_payload)
                if sanitized_row:
                    draft_rows.append(sanitized_row)

    deduped_rows = []
    seen_keys = set()
    for row in draft_rows:
        key = _dedupe_row_key(row, config.get('dedupe_keys') or [])
        if key and key in seen_keys:
            continue
        if key:
            seen_keys.add(key)
        deduped_rows.append(row)
    return draft_fields, deduped_rows


def _is_excel_only_structured_section(page_key_clean, section_title):
    section_title_clean = f'{section_title or ""}'.strip()
    if page_key_clean == 'criterion7':
        return section_title_clean in CRITERION7_EXCEL_ONLY_STRUCTURED_SECTIONS
    if page_key_clean == 'criterion8':
        return section_title_clean in CRITERION8_EXCEL_ONLY_STRUCTURED_SECTIONS
    if page_key_clean == 'appendixc':
        return section_title_clean in APPENDIXC_EXCEL_ONLY_STRUCTURED_SECTIONS
    return False


def _extract_excel_structured_draft(files, config):
    draft_fields = {}
    draft_rows = []
    for uploaded_file in files or []:
        if not _is_excel_upload_name(uploaded_file.name):
            continue
        uploaded_file.seek(0)
        workbook_data = _extract_xlsx_workbook_data(uploaded_file.read(), max_rows_per_sheet=220)
        uploaded_file.seek(0)
        for sheet in _select_relevant_workbook_sheets(workbook_data, config, max_sheets=1):
            rows = sheet.get('rows') or []
            if not rows:
                continue
            header_index = _detect_xlsx_header_index(rows)
            headers = rows[header_index] if header_index < len(rows) else []
            has_header = (
                len(rows) > header_index + 1 and
                sum(1 for header in headers if _clean_text(header)) >= 2 and
                any(header and not re.fullmatch(r'\d+(?:\.\d+)?', header) for header in headers)
            )

            if config.get('mode') == 'fields':
                for row in rows[header_index + 1:] if has_header else rows:
                    if len(row) < 2:
                        continue
                    key = _clean_text(row[0])
                    value = _clean_text(row[1])
                    if not key or not value:
                        continue
                    matched_field = _match_header_to_field(key, config.get('fields') or [])
                    if not matched_field:
                        continue
                    sanitized = _sanitize_structured_value(value, matched_field.get('kind'))
                    if sanitized and _is_valid_value(sanitized, matched_field.get('kind')) and not draft_fields.get(matched_field['name']):
                        draft_fields[matched_field['name']] = sanitized
                continue

            if config.get('mode') == 'mixed':
                context_lines = [
                    ' '.join(_clean_text(cell) for cell in row if _clean_text(cell))
                    for row in rows[:header_index]
                ]
                context_lines = [line for line in context_lines if line]
                if context_lines:
                    narrative_field = next((field for field in (config.get('fields') or []) if field.get('kind') == 'narrative'), None)
                    if narrative_field and not draft_fields.get(narrative_field['name']):
                        narrative = ' '.join(context_lines[1:] if len(context_lines) > 1 else context_lines)
                        narrative = _clean_text(narrative)
                        if narrative:
                            draft_fields[narrative_field['name']] = narrative

            if not has_header:
                continue
            header_map = {}
            for column_index, header in enumerate(headers):
                matched_field = _match_header_to_field(header, config.get('row_fields') or [])
                if matched_field and matched_field['name'] not in header_map.values():
                    header_map[column_index] = matched_field['name']
            if not header_map:
                continue

            for row in rows[header_index + 1:]:
                row_payload = {}
                for column_index, field_name in header_map.items():
                    if column_index >= len(row):
                        continue
                    field_config = next((field for field in (config.get('row_fields') or []) if field.get('name') == field_name), None)
                    if not field_config:
                        continue
                    sanitized = _sanitize_structured_value(row[column_index], field_config.get('kind'))
                    if sanitized and _is_valid_value(sanitized, field_config.get('kind')):
                        row_payload[field_name] = sanitized
                sanitized_row = _sanitize_structured_row(config, row_payload)
                if sanitized_row:
                    draft_rows.append(sanitized_row)

    deduped_rows = []
    seen_keys = set()
    for row in draft_rows:
        key = _dedupe_row_key(row, config.get('dedupe_keys') or [])
        if key and key in seen_keys:
            continue
        if key:
            seen_keys.add(key)
        deduped_rows.append(row)
    return draft_fields, deduped_rows


def _run_structured_llama(config, combined_text, heuristic_fields, current_state):
    row_fields = config.get('row_fields') or []
    prompt_parts = [
        'You are filling a structured section of an ABET accreditation self-study website from uploaded evidence documents.',
        f'Section purpose: {config.get("purpose", "")}',
        'Use only the provided extracted text. Never invent facts.',
        'If the evidence is weak or conflicting, return fewer rows or empty fields rather than guessing.',
        'Keep table values short and cell-ready, not essay-like.',
        'Do not repeat rows that already exist in the current saved state.',
        'Omit any extracted row that is missing required columns.',
    ]
    if row_fields:
        prompt_parts.append(
            'Normalize all date values to YYYY-MM-DD when explicit, and use digits only for numeric values.'
        )
    rules = config.get('rules') or []
    if rules:
        prompt_parts.append('Section rules:\n' + '\n'.join(f'- {rule}' for rule in rules))
    if config.get('fields'):
        prompt_parts.append(
            'Allowed scalar field keys:\n' + '\n'.join(
                f'- {field["name"]}: {field.get("label", field["name"])}'
                for field in config.get('fields') or []
            )
        )
    if row_fields:
        prompt_parts.append(
            'Allowed row fields:\n' + '\n'.join(
                f'- {field["name"]}: {field.get("label", field["name"])}'
                for field in row_fields
            )
        )
        prompt_parts.append(
            f'Required fields for each row: {", ".join(config.get("required_row_fields") or [])}'
        )
    prompt_parts.append(
        'Return only valid JSON in this shape:\n'
        '{\n'
        '  "fields": { ...string values only... },\n'
        '  "rows": [ ...objects with string values only... ],\n'
        '  "confidenceNotes": "short explanation"\n'
        '}'
    )
    prompt_parts.append(f'Current saved state (avoid duplicates):\n{json.dumps(current_state or {}, ensure_ascii=True)}')
    prompt_parts.append(f'Heuristic field draft:\n{json.dumps(heuristic_fields, ensure_ascii=True)}')
    prompt_parts.append(f'Relevant evidence excerpts:\n{combined_text}')
    prompt = '\n\n'.join(prompt_parts)

    try:
        result = _run_ollama_command(prompt, timeout=STRUCTURED_LLAMA_TIMEOUT_SECONDS)
    except FileNotFoundError:
        return None, 'Ollama is not installed on this machine yet.'
    except Exception as exc:
        return None, f'Unable to start the local LLaMA runtime: {exc}'

    if result.returncode != 0:
        return None, _clean_text(result.stderr) or 'The local LLaMA model did not complete successfully.'

    parsed = _extract_json_object(result.stdout)
    if not isinstance(parsed, dict):
        return None, 'The local LLaMA model returned an invalid JSON response.'
    return parsed, ''


def extract_structured_section(page_key, section_title, current_state, files):
    page_key_clean = f'{page_key or ""}'.strip().lower()
    page = STRUCTURED_SECTION_REGISTRY.get(page_key_clean)
    config = page.get(f'{section_title or ""}'.strip()) if page else None
    if not config:
        return None, 'This structured section is not enabled for AI extraction.'

    text_parts = []
    file_names = []
    excel_row_count = 0
    if _is_excel_only_structured_section(page_key_clean, section_title):
        non_excel_files = [
            uploaded_file.name or 'document'
            for uploaded_file in (files or [])
            if not _is_excel_upload_name(uploaded_file.name)
        ]
        if non_excel_files:
            return None, 'This table extractor currently supports Excel files only (.xlsx or .xlsm).'

        for uploaded_file in files:
            workbook_text, workbook_rows = _build_excel_workbook_prompt_text(uploaded_file, config)
            if workbook_text.strip():
                text_parts.append(workbook_text)
                file_names.append(uploaded_file.name or 'workbook.xlsx')
                excel_row_count += workbook_rows
    else:
        for uploaded_file in files:
            extracted_text = _extract_text_from_uploaded_file(uploaded_file)
            if extracted_text.strip():
                text_parts.append(extracted_text)
                file_names.append(uploaded_file.name or 'document')
    combined_text = '\n\n'.join(text_parts).strip()
    if not combined_text:
        if _is_excel_only_structured_section(page_key_clean, section_title):
            return None, 'The selected Excel files did not contain readable spreadsheet content for extraction.'
        return None, 'The selected files did not contain readable text for extraction.'

    blocks = _build_blocks(combined_text)
    heuristic_fields = _extract_structured_field_values(config, blocks)
    spreadsheet_draft_fields = {}
    spreadsheet_draft_rows = []
    if _is_excel_only_structured_section(page_key_clean, section_title):
        spreadsheet_draft_fields, spreadsheet_draft_rows = _extract_excel_structured_draft(files, config)
        for field in config.get('fields') or []:
            field_name = field['name']
            if spreadsheet_draft_fields.get(field_name):
                heuristic_fields[field_name] = spreadsheet_draft_fields.get(field_name)
    current_fields = (current_state or {}).get('fields') if isinstance(current_state, dict) else {}
    if (config.get('mode') == 'fields') and all(
        _clean_text((current_fields or {}).get(field['name']))
        for field in (config.get('fields') or [])
    ):
        notes = ['All fields in this structured section were already filled, so the AI step was skipped.']
        if file_names:
            notes.append(f'Source files: {", ".join(file_names[:4])}.')
        return {
            'mode': 'structured',
            'extractedFields': {field['name']: _clean_text((current_fields or {}).get(field['name'])) for field in (config.get('fields') or [])},
            'rows': [],
            'confidenceNotes': ' '.join(notes).strip(),
        }, None

    evidence_excerpt = _build_section_evidence_excerpt(blocks, config, current_fields=current_fields, max_chars=MAX_PROMPT_EVIDENCE_CHARS + 2000)
    structured_result = None
    structured_error = ''
    if page_key_clean in {'criterion7', 'criterion8', 'appendixc'}:
        structured_result, structured_error = _run_structured_gemini(
            page_key_clean,
            section_title,
            config,
            evidence_excerpt or combined_text,
            current_state or {},
            files=files,
            heuristic_fields=heuristic_fields,
        )
    else:
        structured_result, structured_error = _run_structured_llama(config, evidence_excerpt, heuristic_fields, current_state or {})

    extracted_fields = {}
    for field in config.get('fields') or []:
        field_name = field['name']
        raw_value = ''
        if isinstance(structured_result, dict):
            raw_fields = structured_result.get('fields')
            if isinstance(raw_fields, dict):
                raw_value = raw_fields.get(field_name)
            elif field_name in structured_result:
                raw_value = structured_result.get(field_name)
        fallback_value = heuristic_fields.get(field_name) if (page_key_clean != 'criterion7' and field.get('kind') in {'integer', 'decimal', 'date'}) else ''
        sanitized = _sanitize_structured_value(raw_value or fallback_value, field.get('kind'))
        extracted_fields[field_name] = sanitized if _is_valid_value(sanitized, field.get('kind')) else ''

    extracted_rows = []
    seen_keys = set()
    existing_row_keys = _structured_existing_row_keys(config, current_state)
    raw_rows = []
    if isinstance(structured_result, dict) and isinstance(structured_result.get('rows'), list):
        raw_rows = structured_result.get('rows') or []
    combined_raw_rows = []
    if spreadsheet_draft_rows:
        combined_raw_rows.extend(spreadsheet_draft_rows)
    combined_raw_rows.extend(raw_rows)
    for row in combined_raw_rows:
        sanitized_row = _sanitize_structured_row(config, row)
        if not sanitized_row:
            continue
        dedupe_key = _dedupe_row_key(sanitized_row, config.get('dedupe_keys') or [])
        if dedupe_key and (dedupe_key in seen_keys or dedupe_key in existing_row_keys):
            continue
        if dedupe_key:
            seen_keys.add(dedupe_key)
        extracted_rows.append(sanitized_row)

    notes = []
    confidence_notes = _clean_text((structured_result or {}).get('confidenceNotes')) if isinstance(structured_result, dict) else ''
    notes.append(confidence_notes or 'Section-specific structured extraction rules were applied conservatively, and uncertain values were omitted.')
    if _is_excel_only_structured_section(page_key_clean, section_title) and excel_row_count:
        notes.append(f'Spreadsheet evidence from {excel_row_count} row{"" if excel_row_count == 1 else "s"} was analyzed with Gemini for this table section.')
    if structured_error:
        if page_key_clean in {'criterion7', 'criterion8', 'appendixc'}:
            notes.append(f'Gemini was not used: {structured_error} Fields or rows without clear evidence were left blank.')
        else:
            notes.append(f'Local LLaMA was not used: {structured_error} Structured rule-based fallback is limited, so only high-confidence scalar values were considered.')
    elif page_key_clean in {'criterion7', 'criterion8', 'appendixc'} and not extracted_rows and not any(extracted_fields.values()):
        notes.append('Gemini did not return confident table values for this section, so no existing rows were changed and uncertain values were left blank.')
    if file_names:
        notes.append(f'Source files: {", ".join(file_names[:4])}.')

    return {
        'mode': 'structured',
        'extractedFields': extracted_fields,
        'rows': extracted_rows,
        'confidenceNotes': ' '.join(note for note in notes if note).strip(),
    }, None


def extract_ai_section(page_key, section_title, current_payload, files):
    page_key_clean = f'{page_key or ""}'.strip().lower()
    section_title_clean = f'{section_title or ""}'.strip()
    is_structured_payload = isinstance(current_payload, dict) and (
        'rows' in current_payload or 'fields' in current_payload
    )
    if (
        is_structured_payload and
        page_key_clean in STRUCTURED_SECTION_REGISTRY and
        section_title_clean in STRUCTURED_SECTION_REGISTRY.get(page_key_clean, {})
    ):
        return extract_structured_section(page_key, section_title, current_payload, files)
    if page_key_clean in SECTION_REGISTRY and section_title_clean in SECTION_REGISTRY.get(page_key_clean, {}):
        result, error = extract_textbox_section(page_key, section_title, current_payload, files)
        if result:
            result['mode'] = 'textbox'
        return result, error
    if page_key_clean in STRUCTURED_SECTION_REGISTRY and section_title_clean in STRUCTURED_SECTION_REGISTRY.get(page_key_clean, {}):
        return extract_structured_section(page_key, section_title, current_payload, files)
    return None, 'This section is not enabled for AI extraction.'
