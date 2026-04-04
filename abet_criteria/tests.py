from pathlib import Path
from io import BytesIO
from datetime import timedelta
from unittest.mock import patch
from urllib import error as urllib_error
import zipfile
import zlib

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from django.utils import timezone

from .serializers import Criterion1StudentsSerializer
from .textbox_ai import SECTION_REGISTRY, _build_background_program_history_llm_text, _build_gemini_background_file_parts, _extract_text_from_docx_bytes, _extract_text_from_pdf_bytes, _run_background_textbox_gemini, _run_gemini_json_prompt, _run_textbox_gemini, extract_ai_section, extract_structured_section, extract_textbox_section, _run_ollama_command
from .views import _validate_background_review_date


def _xlsx_col_letter(index):
    result = ''
    current = index
    while current > 0:
        current, remainder = divmod(current - 1, 26)
        result = chr(65 + remainder) + result
    return result


def _build_test_xlsx_bytes(sheet_map):
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        workbook_entries = []
        rel_entries = []
        for sheet_index, (sheet_name, rows) in enumerate(sheet_map.items(), start=1):
            workbook_entries.append(
                f'<sheet name="{sheet_name}" sheetId="{sheet_index}" r:id="rId{sheet_index}"/>'
            )
            rel_entries.append(
                f'<Relationship Id="rId{sheet_index}" '
                f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                f'Target="worksheets/sheet{sheet_index}.xml"/>'
            )
            row_xml = []
            for row_index, row in enumerate(rows, start=1):
                cells_xml = []
                for column_index, value in enumerate(row, start=1):
                    if value in (None, ''):
                        continue
                    cell_ref = f'{_xlsx_col_letter(column_index)}{row_index}'
                    escaped = (
                        f'{value}'
                        .replace('&', '&amp;')
                        .replace('<', '&lt;')
                        .replace('>', '&gt;')
                    )
                    cells_xml.append(
                        f'<c r="{cell_ref}" t="inlineStr"><is><t>{escaped}</t></is></c>'
                    )
                row_xml.append(f'<row r="{row_index}">{"".join(cells_xml)}</row>')
            archive.writestr(
                f'xl/worksheets/sheet{sheet_index}.xml',
                (
                    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                    f'<sheetData>{"".join(row_xml)}</sheetData>'
                    '</worksheet>'
                )
            )

        archive.writestr(
            'xl/workbook.xml',
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                f'<sheets>{"".join(workbook_entries)}</sheets>'
                '</workbook>'
            )
        )
        archive.writestr(
            'xl/_rels/workbook.xml.rels',
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                f'{"".join(rel_entries)}'
                '</Relationships>'
            )
        )
    return buffer.getvalue()


def _build_test_xlsx_bytes_with_absolute_targets(sheet_map):
    workbook_bytes = _build_test_xlsx_bytes(sheet_map)
    source = BytesIO(workbook_bytes)
    output = BytesIO()
    with zipfile.ZipFile(source, 'r') as source_archive, zipfile.ZipFile(output, 'w') as output_archive:
        for info in source_archive.infolist():
            data = source_archive.read(info.filename)
            if info.filename == 'xl/_rels/workbook.xml.rels':
                text = data.decode('utf-8')
                text = text.replace('Target="worksheets/', 'Target="/xl/worksheets/')
                data = text.encode('utf-8')
            output_archive.writestr(info, data)
    return output.getvalue()


class AiExtractionSafetyTests(SimpleTestCase):
    def test_gemini_http_error_redacts_api_key_from_returned_message(self):
        error_body = (
            b'{"error":{"message":"Permission denied: Consumer '
            b'\'api_key:AIzaSyAMj-XtjAQDSEAivkEODJbbpJacIVGrtj0\' has been suspended."}}'
        )
        http_error = urllib_error.HTTPError(
            url='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyAMj-XtjAQDSEAivkEODJbbpJacIVGrtj0',
            code=403,
            msg='Forbidden',
            hdrs=None,
            fp=BytesIO(error_body),
        )

        with patch.dict('os.environ', {'GEMINI_API_KEY': 'AIzaSyAMj-XtjAQDSEAivkEODJbbpJacIVGrtj0'}):
            with patch('abet_criteria.textbox_ai.urllib_request.urlopen', side_effect=http_error):
                parsed, error = _run_gemini_json_prompt('test prompt')

        self.assertIsNone(parsed)
        self.assertIn('[REDACTED_API_KEY]', error)
        self.assertNotIn('AIzaSyAMj-XtjAQDSEAivkEODJbbpJacIVGrtj0', error)

    def test_docx_text_extraction_preserves_contact_fields(self):
        buffer = BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive:
            archive.writestr(
                'word/document.xml',
                '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:body>
                    <w:p><w:r><w:t>Program Contact Information - American University of Beirut (AUB)</w:t></w:r></w:p>
                    <w:p>
                      <w:r><w:t>Program Contact Name: </w:t></w:r>
                      <w:r><w:t>Dr. Karim Haddad</w:t></w:r>
                    </w:p>
                    <w:p>
                      <w:r><w:t>Position / Title: </w:t></w:r>
                      <w:r><w:t>Program Coordinator</w:t></w:r>
                    </w:p>
                    <w:p><w:r><w:t>Office Location: Engineering Building, Room 301</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Phone Number: +9611123456</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Email Address: coordinator@aub.edu.lb</w:t></w:r></w:p>
                  </w:body>
                </w:document>'''
            )
            archive.writestr(
                'word/styles.xml',
                '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"/></w:styles>'
            )

        extracted = _extract_text_from_docx_bytes(buffer.getvalue())

        self.assertIn('Program Contact Name: Dr. Karim Haddad', extracted)
        self.assertIn('Position / Title: Program Coordinator', extracted)
        self.assertIn('Office Location: Engineering Building, Room 301', extracted)
        self.assertIn('Phone Number: +9611123456', extracted)
        self.assertIn('Email Address: coordinator@aub.edu.lb', extracted)
        self.assertNotIn('styleId', extracted)

    def test_pdf_text_extraction_preserves_contact_fields(self):
        content_stream = (
            b'BT\n'
            b'/F1 12 Tf\n'
            b'72 720 Td\n'
            b'(Program Contact Name: Dr. Karim Haddad) Tj\n'
            b'0 -14 Td\n'
            b'(Position / Title: Program Coordinator) Tj\n'
            b'0 -14 Td\n'
            b'(Office Location: Engineering Building, Room 301) Tj\n'
            b'0 -14 Td\n'
            b'(Phone Number: +9611123456) Tj\n'
            b'0 -14 Td\n'
            b'(Email Address: coordinator@aub.edu.lb) Tj\n'
            b'ET'
        )
        compressed_stream = zlib.compress(content_stream)
        pdf_bytes = (
            b'%PDF-1.4\n'
            b'1 0 obj\n'
            b'<< /Length ' + str(len(compressed_stream)).encode('ascii') + b' /Filter /FlateDecode >>\n'
            b'stream\n' + compressed_stream + b'\nendstream\n'
            b'endobj\n'
        )

        extracted = _extract_text_from_pdf_bytes(pdf_bytes)

        self.assertIn('Program Contact Name: Dr. Karim Haddad', extracted)
        self.assertIn('Position / Title: Program Coordinator', extracted)
        self.assertIn('Office Location: Engineering Building, Room 301', extracted)
        self.assertIn('Phone Number: +9611123456', extracted)
        self.assertIn('Email Address: coordinator@aub.edu.lb', extracted)

    def test_gemini_background_file_parts_include_pdf_inline_data(self):
        upload = SimpleUploadedFile(
            'program_history.pdf',
            b'%PDF-1.4 sample pdf bytes',
            content_type='application/pdf',
        )

        parts = _build_gemini_background_file_parts([upload])

        self.assertEqual(len(parts), 1)
        self.assertEqual(parts[0]['inline_data']['mime_type'], 'application/pdf')
        self.assertTrue(parts[0]['inline_data']['data'])

    def test_run_ollama_command_uses_utf8_with_safe_fallback(self):
        with patch('abet_criteria.textbox_ai.subprocess.run') as mock_run:
            _run_ollama_command('prompt body', timeout=123, model_name='llama3.1:8b')

        _, kwargs = mock_run.call_args
        self.assertEqual(kwargs['encoding'], 'utf-8')
        self.assertEqual(kwargs['errors'], 'replace')
        self.assertTrue(kwargs['text'])
        self.assertTrue(kwargs['capture_output'])
        self.assertEqual(kwargs['timeout'], 123)

    def test_all_ollama_call_sites_use_shared_helper(self):
        repo_root = Path(__file__).resolve().parent.parent
        textbox_ai_source = (repo_root / 'abet_criteria' / 'textbox_ai.py').read_text(encoding='utf-8')
        views_source = (repo_root / 'abet_criteria' / 'views.py').read_text(encoding='utf-8')

        self.assertEqual(textbox_ai_source.count('subprocess.run('), 1)
        self.assertNotIn('subprocess.run(', views_source)
        self.assertNotIn('_run_criterion1_student_admissions_llama', textbox_ai_source)
        self.assertNotIn('timeout=TEXTBOX_LLAMA_TIMEOUT_SECONDS', textbox_ai_source)
        self.assertIn('_run_ollama_command(prompt, timeout=STRUCTURED_LLAMA_TIMEOUT_SECONDS)', textbox_ai_source)
        self.assertIn('_run_ollama_command(prompt, timeout=90, model_name=model_name)', views_source)

    def test_textbox_section_skips_gemini_when_fields_are_already_filled(self):
        current_fields = {
            'admission_requirements': 'Existing requirements',
            'admission_process_summary': 'Existing process',
            'transfer_pathways': 'Existing transfer pathways',
        }
        upload = SimpleUploadedFile('admissions.txt', b'Admission requirements and process details.')

        with patch('abet_criteria.textbox_ai._run_textbox_gemini') as mock_gemini:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                current_fields,
                [upload],
            )

        self.assertIsNone(error)
        self.assertFalse(mock_gemini.called)
        self.assertEqual(result['appliedFields'], [])
        self.assertEqual(set(result['preservedFields']), set(current_fields))
        self.assertIn('already filled', result['confidenceNotes'])

    def test_textbox_section_uses_gemini_when_available(self):
        evidence = (
            b'Admission requirements include a secondary school certificate, strong mathematics grades, '
            b'and a program entrance exam. Applicants must submit transcripts and complete the official form.\n\n'
            b'The admission process begins with an online application, document review by the admissions office, '
            b'faculty evaluation, and a final decision notice sent to applicants.\n\n'
            b'Transfer pathways allow students from partner colleges to transfer approved credits after syllabus review, '
            b'academic advising, and department approval.'
        )
        upload = SimpleUploadedFile('admissions.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=({
                'admission_requirements': 'Secondary school certificate, strong mathematics grades, entrance exam, and transcript submission.',
                'admission_process_summary': 'The process includes an online application, admissions office review, faculty evaluation, and a final decision notice.',
                'transfer_pathways': 'Partner-college transfers may receive approved credits after syllabus review and academic advising.',
                'confidenceNotes': 'Gemini separated the admissions evidence across all three fields.',
            }, '')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(set(result['appliedFields']), {
            'admission_requirements',
            'admission_process_summary',
            'transfer_pathways',
        })
        self.assertIn('Gemini', result['confidenceNotes'])

    def test_criterion1_admissions_fast_path_handles_partial_short_evidence_without_gemini(self):
        evidence = (
            b'Admission requirements: secondary school certificate, math preparation, and transcript submission.\n'
            b'Admission process: online application, faculty review, and final admission decision.\n'
        )
        upload = SimpleUploadedFile('admissions-short.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertIn('admission_requirements', result['appliedFields'])
        self.assertIn('admission_process_summary', result['appliedFields'])
        self.assertEqual(result['mergedFields']['transfer_pathways'], '')
        self.assertIn('Gemini was not used', result['confidenceNotes'])
        self.assertNotIn('Local LLaMA was not used', result['confidenceNotes'])

    def test_criterion1_admissions_mixed_content_is_split_by_field_when_gemini_fails(self):
        evidence = (
            b'Mixed Academic Narrative - AUB Engineering Program '
            b'The process of admission often includes application review, academic evaluation, and in some cases interviews or standardized testing. '
            b'Admission into the engineering program generally requires strong performance in mathematics and science subjects, along with demonstrated analytical thinking. '
            b'Students transferring from other institutions may follow structured transfer pathways if course equivalencies are satisfied.'
        )
        upload = SimpleUploadedFile('abet_mixed_short.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ) as mock_gemini:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertIn('mathematics and science subjects', result['mergedFields']['admission_requirements'])
        self.assertIn('application review', result['mergedFields']['admission_process_summary'])
        self.assertIn('transfer pathways', result['mergedFields']['transfer_pathways'])
        self.assertNotEqual(result['mergedFields']['admission_requirements'], result['mergedFields']['admission_process_summary'])
        self.assertNotIn('File:', result['mergedFields']['admission_requirements'])
        self.assertNotIn('Mixed Academic Narrative', result['mergedFields']['admission_requirements'])

    def test_criterion1_admissions_collects_multiple_relevant_points_per_field_when_gemini_fails(self):
        evidence = (
            b'Mixed Narrative on Student Admissions (Test Document)\n'
            b'Admission into the engineering program generally requires strong performance in mathematics and science subjects.\n'
            b'The admission process typically involves application review and academic evaluation.\n'
            b'Course equivalencies must be evaluated before transfer admission is granted.\n'
            b'Holistic evaluation may consider extracurricular activities and personal statements.\n'
            b'Students transferring from other institutions may follow structured transfer pathways.\n'
            b'A solid academic background in physics and calculus is often considered essential.\n'
            b'Transfer applicants are assessed based on prior coursework and academic standing.\n'
            b'Some programs include interviews or standardized testing as part of the selection process.\n'
            b'Applicants are expected to demonstrate analytical thinking and problem-solving skills.\n'
        )
        upload = SimpleUploadedFile('admissions-rich.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ) as mock_gemini:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertIn('mathematics and science subjects', result['mergedFields']['admission_requirements'])
        self.assertIn('physics and calculus', result['mergedFields']['admission_requirements'])
        self.assertIn('analytical thinking', result['mergedFields']['admission_requirements'])
        self.assertIn('application review', result['mergedFields']['admission_process_summary'])
        self.assertIn('Holistic evaluation', result['mergedFields']['admission_process_summary'])
        self.assertIn('interviews or standardized testing', result['mergedFields']['admission_process_summary'])
        self.assertIn('structured transfer pathways', result['mergedFields']['transfer_pathways'])
        self.assertIn('Course equivalencies', result['mergedFields']['transfer_pathways'])
        self.assertIn('prior coursework and academic standing', result['mergedFields']['transfer_pathways'])

    def test_criterion1_transcripts_prompt_rejects_irrelevant_mixed_text(self):
        prompts = []

        def fake_gemini(prompt, model_name='gemini-2.5-flash', timeout=30, extra_parts=None):
            prompts.append(prompt)
            return ({
                'transcript_format_explanation': '',
                'program_name_on_transcript': '',
                'confidenceNotes': 'No transcript-specific evidence was found.',
            }, '')

        mixed_text = (
            'Mixed Academic Narrative - Criteria 1 Test '
            'C. Transfer Students and Transfer Courses: Transfer policies allow students to join from other institutions. '
            'Transfer credits are evaluated through detailed course equivalency checks. '
            'B. Evaluating Student Performance: Student progress is tracked through continuous assessment, exams, and coursework. '
            'Prerequisites are verified using official transcripts and academic records. '
            'A. Student Admissions: The program admits students based on strong academic performance in mathematics and science.'
        )

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', side_effect=fake_gemini):
            result, error = _run_textbox_gemini(
                'criterion1',
                'G. Transcripts of Recent Graduates',
                SECTION_REGISTRY['criterion1']['G. Transcripts of Recent Graduates'],
                mixed_text,
                {},
            )

        self.assertEqual(error, '')
        self.assertEqual(result['transcript_format_explanation'], '')
        self.assertEqual(result['program_name_on_transcript'], '')
        self.assertIn('No strong section-specific evidence was found', prompts[0])
        self.assertNotIn('Extracted document text:', prompts[0])

    def test_criterion1_transcripts_fallback_ignores_irrelevant_mixed_text(self):
        mixed_text = (
            b'Mixed Academic Narrative - Criteria 1 Test '
            b'C. Transfer Students and Transfer Courses: Transfer policies allow students to join from other institutions. '
            b'Transfer credits are evaluated through detailed course equivalency checks. '
            b'B. Evaluating Student Performance: Student progress is tracked through continuous assessment, exams, and coursework. '
            b'Prerequisites are verified using official transcripts and academic records. '
            b'A. Student Admissions: The program admits students based on strong academic performance in mathematics and science.'
        )
        upload = SimpleUploadedFile('criterion1g-mixed.txt', mixed_text)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ):
            result, error = extract_textbox_section(
                'criterion1',
                'G. Transcripts of Recent Graduates',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(result['mergedFields']['transcript_format_explanation'], '')
        self.assertEqual(result['mergedFields']['program_name_on_transcript'], '')
        self.assertEqual(result['appliedFields'], [])
        self.assertIn('Fields without clear evidence were left blank.', result['confidenceNotes'])

    def test_criterion1_transcripts_fallback_uses_explicit_transcript_evidence(self):
        transcript_text = (
            b'Official transcripts for recent graduates are issued by the Registrar and show each semester, '
            b'course titles, grades, credit hours, and cumulative GPA. '
            b'The degree appears on the transcript as Bachelor of Engineering in Mechanical Engineering.'
        )
        upload = SimpleUploadedFile('criterion1g-transcript.txt', transcript_text)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ):
            result, error = extract_textbox_section(
                'criterion1',
                'G. Transcripts of Recent Graduates',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertIn('issued by the Registrar', result['mergedFields']['transcript_format_explanation'])
        self.assertIn('course titles', result['mergedFields']['transcript_format_explanation'])
        self.assertIn('Bachelor of Engineering', result['mergedFields']['program_name_on_transcript'])
        self.assertEqual(set(result['appliedFields']), {'transcript_format_explanation', 'program_name_on_transcript'})

    def test_generic_narrative_section_leaves_fields_blank_when_gemini_is_unavailable(self):
        upload = SimpleUploadedFile(
            'criterion2-alignment.txt',
            b'The PEOs align with the institutional mission by supporting lifelong learning, leadership, and service.'
        )

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ):
            result, error = extract_textbox_section(
                'criterion2',
                'C. Consistency of PEOs with Institutional Mission',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(result['mergedFields']['peos_mission_alignment_explanation'], '')
        self.assertEqual(result['appliedFields'], [])
        self.assertIn('safe rule-based fallback is disabled', result['confidenceNotes'])

    def test_criterion7_maintenance_textbox_section_uses_gemini_when_available(self):
        upload = SimpleUploadedFile(
            'criterion7-maintenance.txt',
            b'Facilities are reviewed each semester, preventive maintenance is scheduled annually, and high-use equipment is replaced on a planned cycle.'
        )

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=({
                'maintenance_policy_description': 'Facilities are reviewed each semester, preventive maintenance is scheduled annually, and high-use equipment is replaced on a planned cycle.',
                'confidenceNotes': 'Gemini extracted the maintenance policy narrative from the uploaded evidence.',
            }, '')
        ):
            result, error = extract_textbox_section(
                'criterion7',
                'D. Maintenance and Upgrading',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(result['appliedFields'], ['maintenance_policy_description'])
        self.assertIn('preventive maintenance', result['mergedFields']['maintenance_policy_description'])

    def test_criterion1_serializer_rejects_non_numeric_gpa(self):
        serializer = Criterion1StudentsSerializer(
            data={'required_gpa_or_standing': 'good standing'},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('required_gpa_or_standing', serializer.errors)

    def test_criterion1_serializer_accepts_decimal_gpa(self):
        serializer = Criterion1StudentsSerializer(
            data={'required_gpa_or_standing': '2.0'},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['required_gpa_or_standing'], '2.0')

    def test_background_section_uses_gemini_when_available(self):
        upload = SimpleUploadedFile('history.txt', b'The program was implemented in 2018 and reviewed on 2024-03-10.')

        with patch(
            'abet_criteria.textbox_ai._run_background_textbox_gemini',
            return_value=({
                'yearImplemented': '2018',
                'lastReviewDate': '2024-03-10',
                'majorChanges': 'The curriculum and facilities were updated after the last review.',
                'confidenceNotes': 'Gemini separated the background history fields from the uploaded evidence.',
            }, '')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'background',
                'B. Program History',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(set(result['appliedFields']), {'yearImplemented', 'lastReviewDate', 'majorChanges'})
        self.assertIn('Gemini', result['confidenceNotes'])

    def test_background_section_never_falls_back_to_ollama_when_gemini_fails(self):
        upload = SimpleUploadedFile(
            'history.txt',
            b'The program was implemented in 2018. The last general review occurred on 2024-03-10. Since the last review, laboratory facilities were upgraded and digital learning platforms were integrated.'
        )

        with patch(
            'abet_criteria.textbox_ai._run_background_textbox_gemini',
            return_value=(None, 'Gemini API key is not configured.')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'background',
                'B. Program History',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertIn('Gemini was not used', result['confidenceNotes'])
        self.assertNotIn('Local LLaMA was not used', result['confidenceNotes'])

    def test_background_program_history_gemini_prompt_requests_long_major_changes_paragraph(self):
        prompts = []
        file_parts = []

        def fake_gemini(prompt, model_name='gemini-2.5-flash', timeout=30, extra_parts=None):
            prompts.append(prompt)
            file_parts.append(extra_parts or [])
            return ({
                'yearImplemented': '2018',
                'lastReviewDate': '2024-03-10',
                'majorChanges': 'Since the last review, the program updated the curriculum, expanded laboratory infrastructure, introduced new assessment workflows, strengthened industry engagement, and revised advising and review practices to support continuous improvement.',
                'confidenceNotes': 'Gemini extracted the program history fields from the uploaded evidence.',
            }, '')

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', side_effect=fake_gemini):
            result, error = _run_background_textbox_gemini(
                SECTION_REGISTRY['background']['B. Program History'],
                'The program was implemented in 2018. The last general review occurred on 2024-03-10. Since the last review, the curriculum was revised, new laboratories were added, advising was strengthened, and assessment workflows were updated.',
                {},
            )

        self.assertEqual(error, '')
        self.assertEqual(result['yearImplemented'], '2018')
        self.assertEqual(result['lastReviewDate'], '2024-03-10')
        self.assertIn('substantial paragraph', prompts[0])
        self.assertIn('Evidence excerpt:', prompts[0])
        self.assertIn('Include multiple relevant changes when they exist', prompts[0])
        self.assertEqual(file_parts[0], [])

    def test_background_program_history_evidence_excerpt_focuses_on_real_changes(self):
        text = (
            'The engineering program was officially implemented in 1995, marking the beginning of its formal academic structure. '
            'The cafeteria offers a variety of international cuisines catering to diverse student preferences. '
            'A major general review of the program was conducted on March 28, 2026, focusing on curriculum alignment and accreditation standards. '
            'Laboratory facilities have been upgraded with new equipment to support advanced experimentation and research. '
            'Digital learning platforms have been integrated into the program to support hybrid and remote learning environments. '
            'Faculty recruitment has expanded, bringing in professionals with both academic and industry experience. '
            'Weather conditions throughout the year range from mild winters to warm summers.'
        )

        excerpt = _build_background_program_history_llm_text(text)

        self.assertIn('Implementation evidence:', excerpt)
        self.assertIn('Review-date evidence:', excerpt)
        self.assertIn('Major-changes evidence:', excerpt)
        self.assertIn('officially implemented in 1995', excerpt)
        self.assertIn('March 28, 2026', excerpt)
        self.assertIn('Laboratory facilities have been upgraded', excerpt)
        self.assertIn('Digital learning platforms have been integrated', excerpt)
        self.assertIn('Faculty recruitment has expanded', excerpt)
        self.assertNotIn('international cuisines', excerpt)
        self.assertNotIn('Weather conditions', excerpt)

    def test_background_contact_info_gemini_requires_direct_values(self):
        upload = SimpleUploadedFile(
            'contact.txt',
            b'Program Contact Name: Dr. Karim Haddad\nPosition / Title: Program Coordinator\nOffice Location: Engineering Building, Room 301\nPhone Number: +9611123456\nEmail Address: coordinator@aub.edu.lb'
        )

        with patch(
            'abet_criteria.textbox_ai._run_background_textbox_gemini',
            return_value=({
                'contactName': 'Dr. Karim Haddad',
                'positionTitle': 'Program Coordinator',
                'officeLocation': 'Engineering Building, Room 301',
                'phoneNumber': '+9611123456',
                'emailAddress': 'coordinator@aub.edu.lb',
                'confidenceNotes': 'Gemini extracted the direct contact fields from the uploaded evidence.',
            }, '')
        ) as mock_gemini:
            result, error = extract_textbox_section(
                'background',
                'A. Contact Information',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertEqual(set(result['appliedFields']), {'contactName', 'positionTitle', 'officeLocation', 'phoneNumber', 'emailAddress'})
        self.assertEqual(result['mergedFields']['contactName'], 'Dr. Karim Haddad')
        self.assertEqual(result['mergedFields']['positionTitle'], 'Program Coordinator')

    def test_structured_fields_only_section_skips_gemini_when_fields_are_already_filled(self):
        current_state = {
            'fields': {
                'total_number_of_offices': '12',
                'average_workspace_size': '18.5',
                'student_availability_details': 'Faculty office hours are posted weekly.',
            },
            'rows': [],
        }
        upload = SimpleUploadedFile('offices.txt', b'Office information.')

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt') as mock_run:
            result, error = extract_structured_section(
                'criterion7',
                'A. Offices',
                current_state,
                [upload],
            )

        self.assertIsNone(error)
        self.assertFalse(mock_run.called)
        self.assertEqual(result['rows'], [])
        self.assertEqual(result['extractedFields'], current_state['fields'])
        self.assertIn('already filled', result['confidenceNotes'])

    def test_criterion7_structured_rows_use_gemini_without_ollama_and_skip_existing_duplicates(self):
        current_state = {
            'fields': {},
            'rows': [
                {
                    'classroom_room': 'ENG 203',
                    'classroom_capacity': '',
                    'classroom_multimedia': '',
                    'classroom_internet_access': '',
                    'classroom_typical_use': '',
                    'classroom_adequacy_comments': '',
                }
            ],
        }
        workbook_bytes = _build_test_xlsx_bytes({
            'Classrooms': [
                ['Room', 'Capacity', 'Multimedia', 'Internet Access', 'Typical Use', 'Adequacy Comments'],
                ['ENG 203', '45', 'Projector', 'Wi-Fi', 'Core lectures', 'Adequate'],
                ['ENG 205', '32', 'Projector', 'Wi-Fi', 'Tutorials', 'Recently upgraded'],
            ]
        })
        upload = SimpleUploadedFile(
            'classrooms.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

        gemini_payload = {
            'fields': {},
            'rows': [
                {
                    'classroom_room': 'ENG 203',
                    'classroom_capacity': '45',
                    'classroom_multimedia': 'Projector',
                    'classroom_internet_access': 'Wi-Fi',
                    'classroom_typical_use': 'Core lectures',
                    'classroom_adequacy_comments': 'Adequate',
                },
                {
                    'classroom_room': 'ENG 205',
                    'classroom_capacity': '32',
                    'classroom_multimedia': 'Projector',
                    'classroom_internet_access': 'Wi-Fi',
                    'classroom_typical_use': 'Tutorials',
                    'classroom_adequacy_comments': 'Recently upgraded',
                },
            ],
            'confidenceNotes': 'Gemini extracted distinct classroom rows from the uploaded evidence.',
        }

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', return_value=(gemini_payload, '')) as mock_gemini:
            with patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
                result, error = extract_structured_section(
                    'criterion7',
                    'A. Classrooms',
                    current_state,
                    [upload],
                )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(len(result['rows']), 1)
        self.assertEqual(result['rows'][0]['classroom_room'], 'ENG 205')
        self.assertEqual(result['rows'][0]['classroom_capacity'], '32')

    def test_criterion7_structured_partial_laboratory_row_is_preserved_when_name_is_missing(self):
        current_state = {'fields': {}, 'rows': []}
        workbook_bytes = _build_test_xlsx_bytes({
            'Labs': [
                ['Room', 'Category', 'Hardware', 'Courses'],
                ['ENG-L1', 'Electronics', 'Oscilloscopes, power supplies', 'EECE 210'],
            ]
        })
        upload = SimpleUploadedFile(
            'labs.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

        gemini_payload = {
            'fields': {},
            'rows': [
                {
                    'lab_name': '',
                    'lab_room': 'ENG-L1',
                    'lab_category': 'Electronics',
                    'lab_hardware_list': 'Oscilloscopes, power supplies',
                    'lab_software_list': '',
                    'lab_open_hours': '',
                    'lab_courses_using_lab': 'EECE 210',
                }
            ],
            'confidenceNotes': 'Gemini extracted a partial lab row from the uploaded evidence.',
        }

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', return_value=(gemini_payload, '')):
            result, error = extract_structured_section(
                'criterion7',
                'A. Laboratories',
                current_state,
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(len(result['rows']), 1)
        self.assertEqual(result['rows'][0]['lab_room'], 'ENG-L1')
        self.assertEqual(result['rows'][0]['lab_category'], 'Electronics')
        self.assertEqual(result['rows'][0]['lab_courses_using_lab'], 'EECE 210')

    def test_criterion7_structured_sections_do_not_fall_back_to_ollama_when_gemini_fails(self):
        current_state = {'fields': {}, 'rows': []}
        workbook_bytes = _build_test_xlsx_bytes({
            'Labs': [
                ['Laboratory', 'Room'],
                ['Signals Lab', 'ENG-L3'],
            ]
        })
        upload = SimpleUploadedFile(
            'labs.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', return_value=(None, 'quota exceeded')) as mock_gemini:
            with patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
                result, error = extract_structured_section(
                    'criterion7',
                    'A. Laboratories',
                    current_state,
                    [upload],
                )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(len(result['rows']), 1)
        self.assertEqual(result['rows'][0]['lab_name'], 'Signals Lab')
        self.assertIn('Gemini was not used', result['confidenceNotes'])

    def test_criterion7_laboratories_excel_prompt_includes_multiple_rows(self):
        current_state = {'fields': {}, 'rows': []}
        workbook_bytes = _build_test_xlsx_bytes({
            'Labs': [
                ['Laboratory', 'Room', 'Category', 'Hardware', 'Software', 'Hours', 'Courses'],
                ['Circuits Lab', 'ENG-L1', 'Electronics', 'Oscilloscopes', 'Multisim', '08:00-18:00', 'EECE 210'],
                ['Networks Lab', 'ENG-L2', 'Communications', 'Routers', 'Wireshark', '09:00-17:00', 'EECE 330'],
            ]
        })
        upload = SimpleUploadedFile(
            'labs.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        captured_prompt = {}

        def fake_gemini(prompt, model_name='gemini-2.5-flash', timeout=30, extra_parts=None):
            captured_prompt['value'] = prompt
            return ({
                'fields': {},
                'rows': [
                    {
                        'lab_name': 'Circuits Lab',
                        'lab_room': 'ENG-L1',
                        'lab_category': 'Electronics',
                        'lab_hardware_list': 'Oscilloscopes',
                        'lab_software_list': 'Multisim',
                        'lab_open_hours': '08:00-18:00',
                        'lab_courses_using_lab': 'EECE 210',
                    },
                    {
                        'lab_name': 'Networks Lab',
                        'lab_room': 'ENG-L2',
                        'lab_category': 'Communications',
                        'lab_hardware_list': 'Routers',
                        'lab_software_list': 'Wireshark',
                        'lab_open_hours': '09:00-17:00',
                        'lab_courses_using_lab': 'EECE 330',
                    },
                ],
                'confidenceNotes': 'Gemini extracted two laboratory rows from the spreadsheet evidence.',
            }, '')

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', side_effect=fake_gemini):
            result, error = extract_structured_section(
                'criterion7',
                'A. Laboratories',
                current_state,
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(len(result['rows']), 2)
        self.assertIn('Circuits Lab', captured_prompt['value'])
        self.assertIn('Networks Lab', captured_prompt['value'])
        self.assertIn('Detected headers', captured_prompt['value'])

    def test_criterion7_structured_sections_require_excel_files(self):
        current_state = {'fields': {}, 'rows': []}
        upload = SimpleUploadedFile('facilities.docx', b'not excel')

        result, error = extract_structured_section(
            'criterion7',
            'D. Maintenance and Upgrading',
            current_state,
            [upload],
        )

        self.assertIsNone(result)
        self.assertEqual(error, 'This table extractor currently supports Excel files only (.xlsx or .xlsm).')

    def test_extract_ai_section_prefers_structured_path_for_criterion7_maintenance_table_payload(self):
        current_state = {'fields': {'maintenance_policy_description': ''}, 'rows': []}
        workbook_bytes = _build_test_xlsx_bytes({
            'Maintenance': [
                ['Facility / Lab', 'Last Upgrade', 'Next Scheduled', 'Responsible Staff', 'Notes'],
                ['Signals Lab', '2026-01-10', '2026-08-01', 'Facilities Team', 'Cable replacement'],
            ]
        })
        upload = SimpleUploadedFile(
            'maintenance.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

        result, error = extract_ai_section(
            'criterion7',
            'D. Maintenance and Upgrading',
            current_state,
            [upload],
        )

        self.assertIsNone(error)
        self.assertEqual(result['mode'], 'structured')
        self.assertEqual(len(result['rows']), 1)
        self.assertEqual(result['rows'][0]['facility_name'], 'Signals Lab')

    def test_criterion8_staffing_uses_gemini_path_without_ollama(self):
        current_state = {'fields': {'additional_narrative_on_staffing': ''}, 'rows': []}
        workbook_bytes = _build_test_xlsx_bytes({
            'Staffing': [
                ['Category', 'Number', 'Primary Role', 'Training / Retention Practices'],
                ['Technical', '4', 'Lab support', 'Safety training and mentoring'],
                ['Administrative', '2', 'Scheduling', 'Annual development workshops'],
            ]
        })
        upload = SimpleUploadedFile(
            'staffing.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        gemini_payload = {
            'fields': {'additional_narrative_on_staffing': 'Staffing support is adequate for current program operations.'},
            'rows': [
                {
                    'category': 'Technical',
                    'number_of_staff': '4',
                    'primary_role': 'Lab support',
                    'training_retention_practices': 'Safety training and mentoring',
                },
                {
                    'category': 'Administrative',
                    'number_of_staff': '2',
                    'primary_role': 'Scheduling',
                    'training_retention_practices': 'Annual development workshops',
                },
            ],
            'confidenceNotes': 'Gemini extracted staffing rows from the spreadsheet evidence.',
        }

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', return_value=(gemini_payload, '')) as mock_gemini:
            with patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
                result, error = extract_structured_section(
                    'criterion8',
                    'C. Staffing',
                    current_state,
                    [upload],
                )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(len(result['rows']), 2)
        self.assertEqual(result['rows'][0]['category'], 'Technical')

    def test_criterion8_staffing_accepts_workbook_relationships_with_absolute_sheet_targets(self):
        current_state = {'fields': {'additional_narrative_on_staffing': ''}, 'rows': []}
        workbook_bytes = _build_test_xlsx_bytes_with_absolute_targets({
            'Staffing': [
                ['Category', 'Number', 'Primary Role', 'Training / Retention Practices'],
                ['Technical', '4', 'System Maintenance', 'Regular training'],
                ['Administrative', '3', 'Office Management', 'Retention bonuses'],
            ]
        })
        upload = SimpleUploadedFile(
            'staffing.xlsx',
            workbook_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        gemini_payload = {
            'fields': {'additional_narrative_on_staffing': 'Staffing remains adequate.'},
            'rows': [
                {
                    'category': 'Technical',
                    'number_of_staff': '4',
                    'primary_role': 'System Maintenance',
                    'training_retention_practices': 'Regular training',
                },
                {
                    'category': 'Administrative',
                    'number_of_staff': '3',
                    'primary_role': 'Office Management',
                    'training_retention_practices': 'Retention bonuses',
                },
            ],
            'confidenceNotes': 'Gemini extracted staffing rows from the spreadsheet evidence.',
        }

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', return_value=(gemini_payload, '')) as mock_gemini:
            result, error = extract_structured_section(
                'criterion8',
                'C. Staffing',
                current_state,
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertEqual(len(result['rows']), 2)
        self.assertEqual(result['rows'][0]['category'], 'Technical')

    def test_appendixc_inventory_requires_excel_files(self):
        current_state = {'fields': {}, 'rows': []}
        upload = SimpleUploadedFile('inventory.pdf', b'not excel')

        result, error = extract_structured_section(
            'appendixc',
            'Inventory Sheet',
            current_state,
            [upload],
        )

        self.assertIsNone(result)
        self.assertEqual(error, 'This table extractor currently supports Excel files only (.xlsx or .xlsm).')

    def test_background_review_date_allows_today(self):
        today = timezone.localdate()

        parsed, error = _validate_background_review_date(today.isoformat())

        self.assertIsNone(error)
        self.assertEqual(parsed, today)

    def test_background_review_date_allows_blank(self):
        parsed, error = _validate_background_review_date('')

        self.assertIsNone(parsed)
        self.assertIsNone(error)

    def test_background_review_date_rejects_future_dates(self):
        future_date = timezone.localdate() + timedelta(days=1)

        parsed, error = _validate_background_review_date(future_date.isoformat())

        self.assertIsNone(parsed)
        self.assertEqual(error, 'Date of Last General Review cannot be in the future.')
