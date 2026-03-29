from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from django.db import IntegrityError
from django.db import connection
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.http import HttpResponse
from datetime import date, datetime
import json
import html
import re
import zipfile
import zlib
import jwt
from datetime import timedelta
from io import BytesIO
from .textbox_ai import extract_ai_section, _run_ollama_command
from .models import (
    Criterion1Students,
    Criterion4,
    Criterion5Curriculum,
    BackgroundInfo,
    AppendixCEquipment,
    EquipmentItem,
    Criterion7Facilities,
    Classrooms,
    Laboratories,
    ComputingResources,
    UpgradingFacilities,
    Criterion8InstitutionalSupport,
    StaffingRow,
    EvidenceFile,
    AccreditationCycle,
    ChecklistItem,
    FacultyMember,
    Program,
    CycleChecklist,
    Criterion2Peos,
    Criterion3SoPeo,
    StudentOutcome,
    Peo,
    Clo,
    Role,
    User,
    Qualification,
    Certification,
    ProfessionalMembership,
    ProfessionalDevelopment,
    IndustryExperience,
    HonorAward,
    ServiceActivity,
    Publication,
    Criterion6Faculty,
    FacultyQualificationRow,
    FacultyWorkloadRow,
    AppendixDInstitution,
    AcademicSupportUnit,
    NonacademicSupportUnit,
    EnrollmentRecord,
    PersonnelRecord,
)


BACKGROUND_EMPTY_REVIEW_DATE = date(1900, 1, 1)
from .serializers import (
    Criterion1StudentsSerializer,
    Criterion2PeosSerializer,
    Criterion5CurriculumSerializer,
    Criterion6FacultySerializer,
    AppendixCEquipmentSerializer,
    EquipmentItemSerializer,
    Criterion7FacilitiesSerializer,
    ClassroomsSerializer,
    LaboratoriesSerializer,
    ComputingResourcesSerializer,
    UpgradingFacilitiesSerializer,
    Criterion8InstitutionalSupportSerializer,
    StaffingRowSerializer,
    EvidenceFileSerializer,
    AccreditationCycleSerializer,
    ChecklistItemSerializer,
    FacultyMemberSerializer,
)


# ============================================================================
# CYCLE-BASED COMPATIBILITY ENDPOINTS (Checklist + Criteria 1/2)
# ============================================================================

CRITERION_ITEMS = {
    0: 'Background Information',
    1: 'Criterion 1 - Students',
    2: 'Criterion 2 - Program Educational Objectives',
    3: 'Criterion 3 - Student Outcomes',
    4: 'Criterion 4 - Continuous Improvement',
    5: 'Criterion 5 - Curriculum',
    6: 'Criterion 6 - Faculty',
    7: 'Criterion 7 - Facilities',
    8: 'Criterion 8 - Institutional Support',
    9: 'Appendices',
}

FRAMEWORK_ITEMS = [
    {'id': 'abet', 'name': 'ABET', 'category': 'Engineering Accreditation', 'icon': 'award', 'status': 'available'},
    {'id': 'ceeaa', 'name': 'CEEAA', 'category': 'Regional Accreditation', 'icon': 'clipboard', 'status': 'coming-soon'},
    {'id': 'ncaaa', 'name': 'NCAAA', 'category': 'National Accreditation', 'icon': 'globe', 'status': 'coming-soon'},
]


def _normalize_role(role_name):
    return (role_name or '').strip().lower().replace(' ', '_').replace('-', '_')


def _issue_tokens(user):
    now = timezone.now()
    role_name = getattr(user.role, 'role_name', '') if user.role_id else ''
    base_payload = {
        'sub': user.user_id,
        'email': user.email,
        'role': _normalize_role(role_name),
    }
    access_payload = {
        **base_payload,
        'type': 'access',
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=8)).timestamp()),
    }
    refresh_payload = {
        **base_payload,
        'type': 'refresh',
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(days=7)).timestamp()),
    }
    return {
        'access': jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256'),
        'refresh': jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256'),
    }


@api_view(['POST'])
def auth_register(request):
    email = (request.data.get('email') or '').strip().lower()
    password = (request.data.get('password') or '').strip()
    requested_role = _normalize_role(request.data.get('role') or 'professor')

    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not password:
        return Response({'detail': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email__iexact=email).exists():
        return Response({'detail': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    role = None
    for candidate in Role.objects.all():
        if _normalize_role(candidate.role_name) == requested_role:
            role = candidate
            break
    if role is None:
        role = Role.objects.create(role_name=requested_role.replace('_', ' ').title())

    user = User.objects.create(
        email=email,
        password_hash=make_password(password),
        role=role,
    )
    return Response(
        {
            'id': user.user_id,
            'email': user.email,
            'role': _normalize_role(user.role.role_name),
            'message': 'Account created successfully.',
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
def auth_login(request):
    email = (request.data.get('email') or '').strip().lower()
    password = (request.data.get('password') or '').strip()

    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).select_related('role').first()
    if not user:
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    stored_password = user.password_hash or ''
    password_ok = check_password(password, stored_password) or stored_password == password
    if not password_ok:
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Migrate legacy plaintext passwords to hashed format on successful login.
    if stored_password == password:
        user.password_hash = make_password(password)
        user.save(update_fields=['password_hash'])

    if _normalize_role(user.role.role_name) != 'faculty_admin':
        return Response({'detail': 'Only faculty_admin accounts are allowed to log in.'}, status=status.HTTP_403_FORBIDDEN)

    return Response(_issue_tokens(user), status=status.HTTP_200_OK)


def _ensure_cycle(cycle_id):
    try:
        return AccreditationCycle.objects.get(pk=cycle_id)
    except AccreditationCycle.DoesNotExist:
        return None


def _get_request_user(request):
    auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION') or ''
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=['HS256'],
            options={'verify_sub': False},
        )
    except jwt.PyJWTError:
        return None

    user_id = payload.get('sub')
    if not user_id:
        return None
    return User.objects.filter(user_id=user_id).first()


def _ensure_checklist_items(cycle):
    existing_numbers = set()
    items = ChecklistItem.objects.filter(checklist=cycle.checklist).order_by('item_id')
    for item in items:
        existing_numbers.add(_criterion_number_from_name(item.item_name))

    for criterion_number, default_name in CRITERION_ITEMS.items():
        if criterion_number in existing_numbers:
            continue

        ChecklistItem.objects.create(
            checklist=cycle.checklist,
            item_name=default_name,
            status=0,
            completion_percentage=0,
        )


def _criterion_number_from_name(name):
    if not name:
        return 999

    lowered = name.lower()
    if 'background' in lowered:
        return 0
    if 'append' in lowered:
        return 9

    for num in range(1, 9):
        if f'criterion {num}' in lowered:
            return num
    return 999


def _default_cycle_dependencies():
    checklist = CycleChecklist.objects.create(title='Program Checklist', status=0)
    criterion2 = Criterion2Peos.objects.create(
        institutional_mission_statement='',
        program_mission_statement='',
        mission_source_link='',
        peos_list='',
        peos_short_descriptions='',
        peos_publication_location='',
        peos_mission_alignment_explanation='',
        constituencies_list='',
        constituencies_contribution_description='',
        peo_review_frequency='',
        peo_review_participants='',
        feedback_collection_and_decision_process='',
        changes_since_last_peo_review='',
    )
    criterion3 = Criterion3SoPeo.objects.create()

    return checklist, criterion2, criterion3


def _cycle_status(progress_value):
    try:
        progress = float(progress_value or 0)
    except (TypeError, ValueError):
        progress = 0
    return 'completed' if progress >= 100 else 'in-progress'


def _cycle_label(cycle):
    return f"ABET {cycle.start_year}-{cycle.end_year}"


def _calculate_cycle_progress(cycle):
    if not cycle or not cycle.checklist:
        return float(cycle.overall_progress_percentage or 0) if cycle else 0.0

    items = ChecklistItem.objects.filter(checklist=cycle.checklist).order_by('item_id')
    target_criteria = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
    criterion_progress = {}
    for item in items:
        criterion_number = _criterion_number_from_name(item.item_name)
        if criterion_number not in target_criteria:
            continue
        current_value = float(item.completion_percentage or 0)
        previous_value = criterion_progress.get(criterion_number, -1)
        if current_value > previous_value:
            criterion_progress[criterion_number] = current_value

    total_percentage = 0.0
    for criterion_number in target_criteria:
        total_percentage += float(criterion_progress.get(criterion_number, 0))

    return round(total_percentage / len(target_criteria))


def _program_icon(program):
    lowered = (program.program_name or '').lower()
    if 'mechan' in lowered or 'chem' in lowered:
        return 'cog'
    if 'civil' in lowered or 'lab' in lowered:
        return 'flask'
    return 'cpu'


@api_view(['GET'])
def cycle_checklist(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    _ensure_checklist_items(cycle)

    items = ChecklistItem.objects.filter(checklist=cycle.checklist).order_by('item_id')
    payload = []
    for item in items:
        payload.append({
            'item_id': item.item_id,
            'item_name': item.item_name,
            'status': item.status,
            'completion_percentage': float(item.completion_percentage or 0),
            'criterion_number': _criterion_number_from_name(item.item_name),
        })

    return Response({
        'cycle_id': cycle.cycle_id,
        'program_name': cycle.program.program_name if cycle.program_id else '',
        'cycle_label': _cycle_label(cycle),
        'start_year': cycle.start_year,
        'end_year': cycle.end_year,
        'overall_progress_percentage': float(_calculate_cycle_progress(cycle)),
        'items': payload,
    })


@api_view(['GET'])
def frameworks_list(request):
    return Response({'items': FRAMEWORK_ITEMS})


@api_view(['GET', 'POST'])
def programs_list(request):
    if request.method == 'GET':
        items = []
        for program in Program.objects.order_by('program_name'):
            cycles = AccreditationCycle.objects.filter(program=program).order_by('-cycle_id')
            cycle_payload = []
            for cycle in cycles:
                progress_value = _calculate_cycle_progress(cycle)
                cycle_payload.append({
                    'id': cycle.cycle_id,
                    'label': _cycle_label(cycle),
                    'status': _cycle_status(progress_value),
                    'progress': float(progress_value),
                })
            items.append({
                'id': program.program_id,
                'name': program.program_name,
                'level': program.program_level,
                'department': 'Engineering',
                'icon': _program_icon(program),
                'cycles': cycle_payload,
            })
        return Response({'items': items})

    name = (request.data.get('name') or '').strip()
    level = (request.data.get('level') or 'Undergraduate').strip()
    if not name:
        return Response({'detail': 'Program name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if Program.objects.filter(program_name__iexact=name).exists():
        return Response({'detail': 'Program already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        program = Program.objects.create(program_name=name, program_level=level)
    except IntegrityError:
        return Response({'detail': 'Program already exists.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({
        'id': program.program_id,
        'name': program.program_name,
        'level': program.program_level,
        'department': request.data.get('department') or 'Engineering',
        'icon': request.data.get('icon') or _program_icon(program),
        'cycles': [],
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def program_cycles_create(request, program_id):
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    start_year_raw = request.data.get('start_year')
    end_year_raw = request.data.get('end_year')

    if start_year_raw is not None and end_year_raw is not None:
        try:
            start_year = int(start_year_raw)
            end_year = int(end_year_raw)
        except (TypeError, ValueError):
            return Response({'detail': 'start_year and end_year must be valid years.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        label = (request.data.get('label') or '').strip()
        years = re.findall(r'\d{4}', label)
        current_year = timezone.now().year
        start_year = int(years[0]) if len(years) >= 1 else current_year
        end_year = int(years[1]) if len(years) >= 2 else (start_year + 2)

    if not (1000 <= start_year <= 9999 and 1000 <= end_year <= 9999):
        return Response({'detail': 'start_year and end_year must be 4-digit years.'}, status=status.HTTP_400_BAD_REQUEST)
    if end_year <= start_year:
        return Response({'detail': 'End year must be greater than start year.'}, status=status.HTTP_400_BAD_REQUEST)

    existing_cycles = AccreditationCycle.objects.filter(program=program)
    if existing_cycles.filter(start_year=start_year, end_year=end_year).exists():
        return Response({'detail': 'This cycle already exists for the selected program.'}, status=status.HTTP_400_BAD_REQUEST)

    max_existing_end = existing_cycles.aggregate(max_end=Max('end_year')).get('max_end')
    if max_existing_end is not None and start_year < int(max_existing_end):
        return Response(
            {'detail': f'Start year must be {int(max_existing_end)} or greater for this program.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    checklist, criterion2, criterion3 = _default_cycle_dependencies()
    cycle = AccreditationCycle.objects.create(
        start_year=start_year,
        end_year=end_year,
        overall_progress_percentage=0,
        program=program,
        checklist=checklist,
        criterion2=criterion2,
        criterion3=criterion3,
    )
    return Response({
        'id': cycle.cycle_id,
        'label': _cycle_label(cycle),
        'status': _cycle_status(cycle.overall_progress_percentage),
        'progress': float(cycle.overall_progress_percentage or 0),
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def program_cycles_delete(request, program_id, cycle_id):
    try:
        cycle = AccreditationCycle.objects.get(pk=cycle_id, program_id=program_id)
    except AccreditationCycle.DoesNotExist:
        return Response({'detail': 'Cycle not found for this program.'}, status=status.HTTP_404_NOT_FOUND)

    checklist = cycle.checklist
    criterion2 = cycle.criterion2
    criterion3 = cycle.criterion3

    cycle.delete()

    if checklist and not AccreditationCycle.objects.filter(checklist=checklist).exists():
        checklist.delete()
    if criterion2 and not AccreditationCycle.objects.filter(criterion2=criterion2).exists():
        criterion2.delete()
    if criterion3 and not AccreditationCycle.objects.filter(criterion3=criterion3).exists():
        criterion3.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def cycle_detail(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': cycle.cycle_id,
        'program_name': cycle.program.program_name if cycle.program_id else '',
        'cycle_label': _cycle_label(cycle),
        'start_year': cycle.start_year,
        'end_year': cycle.end_year,
        'progress': float(cycle.overall_progress_percentage or 0),
        'status': _cycle_status(cycle.overall_progress_percentage),
    })


def _get_or_create_criterion1(cycle):
    item = ChecklistItem.objects.filter(
        checklist=cycle.checklist,
        item_name__icontains='Criterion 1'
    ).order_by('-item_id').first()
    if not item:
        item = ChecklistItem.objects.create(
            checklist=cycle.checklist,
            item_name=CRITERION_ITEMS[1],
            status=0,
            completion_percentage=0,
        )

    obj = Criterion1Students.objects.filter(cycle=cycle).order_by('-criterion1_id').first()
    if obj:
        return obj, item

    max_id = Criterion1Students.objects.aggregate(max_id=Max('criterion1_id')).get('max_id') or 0
    obj = Criterion1Students.objects.create(
        criterion1_id=max_id + 1,
        cycle=cycle,
        item=item,
        admission_requirements='',
        admission_process_summary='',
        transfer_pathways='',
        pperformance_evaluation_process='',
        prerequisite_verification_method='',
        prerequisite_not_met_action='',
        transfer_policy_summary='',
        transfer_credit_evaluation_process='',
        articulation_agreements='',
        advising_providers='',
        advising_frequency='',
        career_guidance_description='',
        work_in_lieu_policies='',
        work_in_lieu_approval_process='',
        minimum_required_credits=0,
        required_gpa_or_standing='',
        essential_courses_categories='',
        degree_name='',
        transcript_format_explanation='',
        program_name_on_transcript='',
    )
    return obj, item


def _validate_background_year(value):
    text = f'{value or ""}'.strip()
    if not text:
        return 0, None
    if not re.fullmatch(r'\d{4}', text):
        return None, 'Year Implemented must be a 4-digit number.'
    year = int(text)
    current_year = timezone.now().year
    if year > current_year:
        return None, 'Year Implemented cannot be in the future.'
    return year, None


def _validate_background_phone(value):
    text = f'{value or ""}'.strip()
    if not text:
        return '', None
    normalized = re.sub(r'[\s\-\(\)]', '', text)
    if not re.fullmatch(r'\+?\d+', normalized):
        return None, 'Phone Number must contain only numbers.'
    return normalized, None


def _validate_background_review_date(raw_value):
    text = f'{raw_value or ""}'.strip()
    if not text:
        return None, None

    parsed_date = None
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%m/%d/%Y'):
        try:
            parsed_date = datetime.strptime(text, fmt).date()
            break
        except ValueError:
            continue

    if parsed_date is None:
        return None, 'Date of Last General Review must be a valid date (YYYY-MM-DD, YYYY/MM/DD, or MM/DD/YYYY).'

    today = timezone.localdate()
    if parsed_date > today:
        return None, 'Date of Last General Review cannot be in the future.'
    return parsed_date, None


def _background_review_date_to_storage(value):
    return value if value is not None else BACKGROUND_EMPTY_REVIEW_DATE


def _background_review_date_to_display(value):
    if value in (None, BACKGROUND_EMPTY_REVIEW_DATE):
        return ''
    return str(value)


def _background_completion_percentage(background):
    fields = [
        background.program_contact_name,
        background.contact_title,
        background.office_location,
        background.phone_number,
        background.email_address,
        background.year_implemented,
        None if background.last_general_review_date == BACKGROUND_EMPTY_REVIEW_DATE else background.last_general_review_date,
        background.summary_of_major_changes,
    ]

    completed = 0
    for value in fields:
        if isinstance(value, str):
            if value.strip():
                completed += 1
        elif isinstance(value, (int, float)):
            if value > 0:
                completed += 1
        elif value is not None:
            completed += 1

    return round((completed / len(fields)) * 100)


def _ensure_background(cycle):
    _ensure_checklist_items(cycle)

    item = ChecklistItem.objects.filter(
        checklist=cycle.checklist,
        item_name__icontains='background'
    ).order_by('-item_id').first()
    if not item:
        item = ChecklistItem.objects.create(
            checklist=cycle.checklist,
            item_name=CRITERION_ITEMS[0],
            status=0,
            completion_percentage=0,
        )

    obj = BackgroundInfo.objects.filter(cycle=cycle).order_by('-background_id').first()
    if obj:
        return obj, item

    max_id = BackgroundInfo.objects.aggregate(max_id=Max('background_id')).get('max_id') or 0
    obj = BackgroundInfo.objects.create(
        background_id=int(max_id) + 1,
        program_contact_name='',
        contact_title='',
        office_location='',
        phone_number='',
        email_address='',
        year_implemented=0,
        last_general_review_date=BACKGROUND_EMPTY_REVIEW_DATE,
        summary_of_major_changes='',
        cycle=cycle,
        item=item,
    )
    return obj, item


def _serialize_background_payload(background):
    return {
        'background_id': background.background_id,
        'contactName': background.program_contact_name or '',
        'positionTitle': background.contact_title or '',
        'officeLocation': background.office_location or '',
        'phoneNumber': background.phone_number or '',
        'emailAddress': background.email_address or '',
        'yearImplemented': str(background.year_implemented or ''),
        'lastReviewDate': _background_review_date_to_display(background.last_general_review_date),
        'majorChanges': background.summary_of_major_changes or '',
    }


def _save_background_completion(background, item):
    completion_percentage = _background_completion_percentage(background)
    item.status = 1 if completion_percentage >= 100 else 0
    item.completion_percentage = completion_percentage
    item.save(update_fields=['status', 'completion_percentage'])


def _clean_ai_text(value):
    return f'{value or ""}'.strip()


def _truncate_for_llm(text, limit=16000):
    cleaned = re.sub(r'\s+', ' ', f'{text or ""}').strip()
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[:limit]


def _extract_text_from_docx_bytes(file_bytes):
    parts = []
    try:
        with zipfile.ZipFile(BytesIO(file_bytes)) as archive:
            for name in archive.namelist():
                if not name.startswith('word/') or not name.endswith('.xml'):
                    continue
                xml_text = archive.read(name).decode('utf-8', errors='ignore')
                text = html.unescape(re.sub(r'<[^>]+>', ' ', xml_text))
                text = re.sub(r'\s+', ' ', text).strip()
                if text:
                    parts.append(text)
    except Exception:
        return ''
    return '\n'.join(parts)


def _extract_text_from_pdf_bytes(file_bytes):
    # Lightweight PDF fallback: this is intentionally simple and conservative.
    # It works best for text-based PDFs and gracefully returns partial text when
    # the file uses standard embedded strings.
    chunks = []
    for match in re.findall(rb'\((.*?)(?<!\\)\)', file_bytes, flags=re.DOTALL):
        text = match
        for src, dst in (
            (rb'\\n', b' '),
            (rb'\\r', b' '),
            (rb'\\t', b' '),
            (rb'\\(', b'('),
            (rb'\\)', b')'),
            (rb'\\\\', b'\\'),
        ):
            text = text.replace(src, dst)
        decoded = text.decode('latin-1', errors='ignore').strip()
        if decoded:
            chunks.append(decoded)

    for stream_bytes in re.findall(rb'stream\s*(.*?)\s*endstream', file_bytes, flags=re.DOTALL):
        for candidate in (stream_bytes,):
            try:
                inflated = zlib.decompress(candidate)
            except Exception:
                continue
            text = re.sub(rb'[^A-Za-z0-9@\.\-\+\(\)/,:;#\s]', b' ', inflated)
            decoded = text.decode('latin-1', errors='ignore')
            decoded = re.sub(r'\s+', ' ', decoded).strip()
            if decoded:
                chunks.append(decoded)

    return '\n'.join(chunks[:80])


def _extract_text_from_uploaded_file(uploaded_file):
    name = f'{uploaded_file.name or ""}'.lower()
    file_bytes = uploaded_file.read()
    uploaded_file.seek(0)
    if not file_bytes:
        return ''

    if name.endswith(('.txt', '.md', '.csv', '.json', '.yaml', '.yml', '.html', '.xml')):
        return file_bytes.decode('utf-8', errors='ignore')
    if name.endswith('.docx'):
        return _extract_text_from_docx_bytes(file_bytes)
    if name.endswith('.pdf'):
        return _extract_text_from_pdf_bytes(file_bytes)

    decoded_utf8 = file_bytes.decode('utf-8', errors='ignore').strip()
    if decoded_utf8:
        return decoded_utf8
    return file_bytes.decode('latin-1', errors='ignore')


def _extract_json_object(text):
    raw_text = f'{text or ""}'.strip()
    if not raw_text:
        return None
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'\{.*\}', raw_text, flags=re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _normalize_contact_line(text):
    return re.sub(r'\s+', ' ', f'{text or ""}').strip()


def _clean_contact_candidate_value(text):
    value = _normalize_contact_line(text)
    value = re.sub(r'^(name|title|position|office|location|email|phone|telephone|tel)\s*[:\-]\s*', '', value, flags=re.IGNORECASE)
    return value.strip(' -,:;')


def _extract_email_from_text(text):
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', f'{text or ""}', flags=re.IGNORECASE)
    return _clean_ai_text(match.group(0) if match else '')


def _extract_phone_from_text(text):
    match = re.search(r'(\+?\d[\d\s\-\(\)]{6,}\d)', f'{text or ""}')
    if not match:
        return ''
    return _clean_ai_text(match.group(1))


def _looks_like_name(text):
    value = _clean_contact_candidate_value(text)
    if not value:
        return False
    if '@' in value or re.search(r'\d', value):
        return False
    if len(value) > 80:
        return False
    if any(token in value.lower() for token in ('department', 'program', 'office', 'building', 'room', 'email', 'phone', 'tel', 'fax')):
        return False
    if re.search(r'(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+[A-Za-z]', value, flags=re.IGNORECASE):
        return True
    words = [part for part in re.split(r'\s+', value) if part]
    if len(words) < 2 or len(words) > 5:
        return False
    capitalized = sum(1 for word in words if re.fullmatch(r"[A-Z][A-Za-z'`\-]+\.?", word))
    return capitalized >= 2


def _looks_like_title(text):
    value = _clean_contact_candidate_value(text).lower()
    title_keywords = (
        'coordinator', 'chair', 'director', 'dean', 'head', 'manager', 'officer',
        'professor', 'assistant professor', 'associate professor', 'lecturer',
        'department', 'program', 'self-study', 'accreditation', 'contact'
    )
    return any(keyword in value for keyword in title_keywords)


def _looks_like_location(text):
    value = _clean_contact_candidate_value(text).lower()
    location_keywords = ('office', 'room', 'building', 'floor', 'campus', 'hall', 'department of', 'school of', 'faculty of')
    return any(keyword in value for keyword in location_keywords)


def _score_contact_line(line):
    lower_line = line.lower()
    score = 0
    if any(keyword in lower_line for keyword in ('abet', 'self-study', 'program contact', 'submitted by', 'prepared by')):
        score += 8
    if any(keyword in lower_line for keyword in ('program coordinator', 'program chair', 'department chair', 'program director')):
        score += 7
    if any(keyword in lower_line for keyword in ('coordinator', 'chair', 'director', 'head')):
        score += 4
    if any(keyword in lower_line for keyword in ('dean', 'professor', 'lecturer')):
        score += 1
    if '@' in line:
        score += 2
    if re.search(r'(\+?\d[\d\s\-\(\)]{6,}\d)', line):
        score += 2
    if _looks_like_name(line):
        score += 2
    if _looks_like_title(line):
        score += 3
    if any(keyword in lower_line for keyword in ('directory', 'faculty list', 'all faculty', 'committee members', 'roster')):
        score -= 6
    return score


def _pick_field_value(candidates, validator, minimum_score):
    valid_candidates = [candidate for candidate in candidates if validator(candidate.get('value'))]
    if not valid_candidates:
        return '', False
    valid_candidates.sort(key=lambda candidate: candidate.get('score', 0), reverse=True)
    top = valid_candidates[0]
    runner_up = valid_candidates[1] if len(valid_candidates) > 1 else None
    if top.get('score', 0) < minimum_score:
        return '', False
    if runner_up and (top.get('score', 0) - runner_up.get('score', 0)) < 2:
        return '', True
    return _clean_ai_text(top.get('value')), False


def _heuristic_background_contact_extraction(text):
    normalized_text = f'{text or ""}'
    lines = [_normalize_contact_line(line) for line in normalized_text.splitlines()]
    lines = [line for line in lines if line]
    field_candidates = {
        'contactName': [],
        'positionTitle': [],
        'officeLocation': [],
        'phoneNumber': [],
        'emailAddress': [],
    }

    for idx, line in enumerate(lines):
        score = _score_contact_line(line)
        window = lines[max(0, idx - 2): min(len(lines), idx + 3)]
        combined_window = ' | '.join(window)

        email_value = _extract_email_from_text(combined_window)
        if email_value:
            field_candidates['emailAddress'].append({'value': email_value, 'score': score + 3, 'context': combined_window})

        phone_value = _extract_phone_from_text(combined_window)
        if phone_value:
            field_candidates['phoneNumber'].append({'value': phone_value, 'score': score + 2, 'context': combined_window})

        if _looks_like_name(line):
            field_candidates['contactName'].append({'value': _clean_contact_candidate_value(line), 'score': score + 3, 'context': combined_window})
        else:
            for candidate_line in window:
                if _looks_like_name(candidate_line):
                    field_candidates['contactName'].append({'value': _clean_contact_candidate_value(candidate_line), 'score': score + 1, 'context': combined_window})

        if _looks_like_title(line):
            field_candidates['positionTitle'].append({'value': _clean_contact_candidate_value(line), 'score': score + 3, 'context': combined_window})
        else:
            for candidate_line in window:
                if _looks_like_title(candidate_line):
                    field_candidates['positionTitle'].append({'value': _clean_contact_candidate_value(candidate_line), 'score': score + 1, 'context': combined_window})

        if _looks_like_location(line):
            field_candidates['officeLocation'].append({'value': _clean_contact_candidate_value(line), 'score': score + 2, 'context': combined_window})
        else:
            for candidate_line in window:
                if _looks_like_location(candidate_line):
                    field_candidates['officeLocation'].append({'value': _clean_contact_candidate_value(candidate_line), 'score': score, 'context': combined_window})

    email_value, email_ambiguous = _pick_field_value(field_candidates['emailAddress'], lambda value: bool(_extract_email_from_text(value)), 3)
    phone_value, phone_ambiguous = _pick_field_value(field_candidates['phoneNumber'], lambda value: bool(_extract_phone_from_text(value)), 2)
    title_value, title_ambiguous = _pick_field_value(field_candidates['positionTitle'], _looks_like_title, 4)
    location_value, location_ambiguous = _pick_field_value(field_candidates['officeLocation'], _looks_like_location, 2)
    name_value, name_ambiguous = _pick_field_value(field_candidates['contactName'], _looks_like_name, 4)

    if not name_value and email_value:
        email_prefix = email_value.split('@', 1)[0]
        inferred_name = re.sub(r'[\._\-]+', ' ', email_prefix).strip()
        inferred_name = ' '.join(part.capitalize() for part in inferred_name.split())
        if _looks_like_name(inferred_name):
            name_value = inferred_name

    confidence_notes = []
    if title_value:
        confidence_notes.append('A high-scoring program/accreditation title line was found.')
    if email_value:
        confidence_notes.append('A matching email candidate was detected near the likely contact context.')
    if phone_value:
        confidence_notes.append('A matching phone candidate was detected near the likely contact context.')
    if location_value:
        confidence_notes.append('An office/location candidate was found close to the likely contact lines.')
    ambiguity_flags = [
        ('name', name_ambiguous),
        ('title', title_ambiguous),
        ('office location', location_ambiguous),
        ('phone', phone_ambiguous),
        ('email', email_ambiguous),
    ]
    ambiguous_fields = [label for label, is_ambiguous in ambiguity_flags if is_ambiguous]
    if ambiguous_fields:
        confidence_notes.append(f'Conflicting candidates were found for: {", ".join(ambiguous_fields)}; those fields were left blank.')
    if not confidence_notes:
        confidence_notes.append('Only limited structured contact evidence was found in the uploaded files, so uncertain fields were left blank.')

    return {
        'contactName': _clean_ai_text(name_value),
        'positionTitle': _clean_ai_text(title_value),
        'officeLocation': _clean_ai_text(location_value),
        'phoneNumber': _clean_ai_text(phone_value),
        'emailAddress': _clean_ai_text(email_value),
        'confidenceNotes': ' '.join(confidence_notes),
    }


def _run_ollama_background_contact_extraction(text, heuristic_result):
    model_name = 'llama3.1:8b'
    prompt = (
        'You are filling ABET accreditation Background section A: Contact Information.\n'
        'Use only the provided extracted document text.\n'
        'Prefer the current program-level ABET/self-study contact, program coordinator, chair, or equivalent.\n'
        'Apply these rules strictly:\n'
        '- Only fill fields when the evidence is explicit enough.\n'
        '- If multiple people appear and the best candidate is not clearly stronger, leave the uncertain fields empty.\n'
        '- Prefer lines containing terms such as Program Coordinator, Program Chair, Program Director, ABET, self-study, submitted by, or prepared by.\n'
        '- Do not combine one person\'s name with another person\'s title, phone, email, or office.\n'
        '- Ignore generic directories, long faculty rosters, committee lists, and unrelated institutional contacts unless they are explicitly marked as the program contact.\n'
        '- Returning an empty string is better than making a weak guess.\n'
        'Return only JSON with keys: '
        'contactName, positionTitle, officeLocation, phoneNumber, emailAddress, confidenceNotes.\n'
        'If a value is unknown, use an empty string.\n'
        'confidenceNotes should be 2-4 concise sentences and mention any ambiguity or why fields were left empty.\n\n'
        f'Heuristic hints:\n{json.dumps(heuristic_result, ensure_ascii=True)}\n\n'
        f'Extracted text:\n{_truncate_for_llm(text, limit=6000)}\n'
    )

    try:
        result = _run_ollama_command(prompt, timeout=90, model_name=model_name)
    except FileNotFoundError:
        return None, 'Ollama is not installed on this machine yet.'
    except Exception as exc:
        return None, f'Unable to start the local LLaMA runtime: {exc}'

    if result.returncode != 0:
        stderr = f'{result.stderr or ""}'.strip()
        return None, stderr or 'The local LLaMA model did not complete successfully.'

    parsed = _extract_json_object(result.stdout)
    if not isinstance(parsed, dict):
        return None, 'The local LLaMA model returned an invalid JSON response.'

    result = {
        'contactName': _clean_ai_text(parsed.get('contactName')),
        'positionTitle': _clean_ai_text(parsed.get('positionTitle')),
        'officeLocation': _clean_ai_text(parsed.get('officeLocation')),
        'phoneNumber': _clean_ai_text(parsed.get('phoneNumber')),
        'emailAddress': _clean_ai_text(parsed.get('emailAddress')),
        'confidenceNotes': _clean_ai_text(parsed.get('confidenceNotes')),
    }

    if result['contactName'] and not _looks_like_name(result['contactName']):
        result['contactName'] = ''
    if result['positionTitle'] and not _looks_like_title(result['positionTitle']):
        result['positionTitle'] = ''
    if result['officeLocation'] and not _looks_like_location(result['officeLocation']):
        result['officeLocation'] = ''
    if result['emailAddress'] and not _extract_email_from_text(result['emailAddress']):
        result['emailAddress'] = ''
    if result['phoneNumber'] and not _extract_phone_from_text(result['phoneNumber']):
        result['phoneNumber'] = ''

    return result, None


def _extract_background_section_a_from_files(files):
    text_parts = []
    file_summaries = []
    for uploaded_file in files:
        extracted_text = _extract_text_from_uploaded_file(uploaded_file)
        if extracted_text.strip():
            text_parts.append(f'File: {uploaded_file.name}\n{extracted_text}')
            file_summaries.append(uploaded_file.name or 'document')

    combined_text = '\n\n'.join(text_parts).strip()
    if not combined_text:
        return None, 'The selected files did not contain readable text for extraction.'

    heuristic_result = _heuristic_background_contact_extraction(combined_text)
    llama_result, llama_error = _run_ollama_background_contact_extraction(combined_text, heuristic_result)
    if llama_result:
        confidence_notes = llama_result.get('confidenceNotes') or ''
        if file_summaries:
            confidence_notes = f'{confidence_notes} Source files: {", ".join(file_summaries[:4])}.'.strip()
        llama_result['confidenceNotes'] = confidence_notes.strip()
        return llama_result, None

    heuristic_result['confidenceNotes'] = (
        f'{heuristic_result.get("confidenceNotes", "")} '
        f'Local LLaMA was not used: {llama_error} '
        'A rule-based extraction fallback was applied instead.'
    ).strip()
    return heuristic_result, None


@api_view(['GET', 'PUT'])
def cycle_background(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    background, item = _ensure_background(cycle)

    if request.method == 'GET':
        return Response(_serialize_background_payload(background))

    contact_name = f'{request.data.get("contactName", request.data.get("program_contact_name", ""))}'.strip()
    position_title = f'{request.data.get("positionTitle", request.data.get("contact_title", ""))}'.strip()
    office_location = f'{request.data.get("officeLocation", request.data.get("office_location", ""))}'.strip()
    phone_number = f'{request.data.get("phoneNumber", request.data.get("phone_number", ""))}'.strip()
    email_address = f'{request.data.get("emailAddress", request.data.get("email_address", ""))}'.strip()
    year_implemented_raw = request.data.get('yearImplemented', request.data.get('year_implemented'))
    last_review_raw = request.data.get('lastReviewDate', request.data.get('last_general_review_date'))
    major_changes = f'{request.data.get("majorChanges", request.data.get("summary_of_major_changes", ""))}'.strip()

    year_implemented, year_error = _validate_background_year(year_implemented_raw)
    phone_number_validated, phone_error = _validate_background_phone(phone_number)
    last_review_date, review_date_error = _validate_background_review_date(last_review_raw)
    validation_errors = {}
    if year_error:
        validation_errors['yearImplemented'] = [year_error]
    if phone_error:
        validation_errors['phoneNumber'] = [phone_error]
    if review_date_error:
        validation_errors['lastReviewDate'] = [review_date_error]
    if (
        not year_error and
        not review_date_error and
        year_implemented is not None and
        last_review_date is not None and
        year_implemented > int(last_review_date.year)
    ):
        validation_errors['yearImplemented'] = ['Year Implemented cannot be after Date of Last General Review.']
    if validation_errors:
        return Response(validation_errors, status=status.HTTP_400_BAD_REQUEST)

    background.program_contact_name = contact_name
    background.contact_title = position_title
    background.office_location = office_location
    background.phone_number = phone_number_validated
    background.email_address = email_address
    background.year_implemented = year_implemented
    background.last_general_review_date = _background_review_date_to_storage(last_review_date)
    background.summary_of_major_changes = major_changes
    background.cycle = cycle
    background.item = item
    background.save()

    _save_background_completion(background, item)

    return Response(_serialize_background_payload(background))


@api_view(['POST'])
def cycle_textbox_ai_extract(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    page_key = f'{request.data.get("pageKey", "")}'.strip()
    section_title = f'{request.data.get("sectionTitle", "")}'.strip()
    files = request.FILES.getlist('files')
    if not files:
        return Response({'detail': 'Please upload at least one document first.'}, status=status.HTTP_400_BAD_REQUEST)

    current_fields_raw = request.data.get('currentState', request.data.get('currentFields', '{}'))
    try:
        current_fields = json.loads(current_fields_raw) if current_fields_raw else {}
    except json.JSONDecodeError:
        current_fields = {}

    extracted, extraction_error = extract_ai_section(page_key, section_title, current_fields, files)
    if extraction_error:
        return Response({'detail': extraction_error}, status=status.HTTP_400_BAD_REQUEST)
    if extracted.get('mode') == 'structured':
        return Response({
            'pageKey': page_key,
            'sectionTitle': section_title,
            'mode': 'structured',
            'extractedFields': extracted.get('extractedFields', {}),
            'rows': extracted.get('rows', []),
            'confidenceNotes': extracted.get('confidenceNotes', ''),
            'message': 'Local AI extraction completed.',
        })
    return Response({
        'pageKey': page_key,
        'sectionTitle': section_title,
        'mode': 'textbox',
        'mergedFields': extracted.get('mergedFields', {}),
        'appliedFields': extracted.get('appliedFields', []),
        'preservedFields': extracted.get('preservedFields', []),
        'confidenceNotes': extracted.get('confidenceNotes', ''),
        'message': 'Local AI extraction completed.',
    })


@api_view(['POST'])
def cycle_background_llama_extract(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    background, item = _ensure_background(cycle)
    section_title = f'{request.data.get("sectionTitle", "")}'.strip()
    if section_title != 'A. Contact Information':
        return Response(
            {'detail': 'Local AI extraction is currently available only for Background section A.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    files = request.FILES.getlist('files')
    if not files:
        return Response({'detail': 'Please upload at least one document first.'}, status=status.HTTP_400_BAD_REQUEST)

    current_fields_raw = request.data.get('currentFields', '{}')
    try:
        current_fields = json.loads(current_fields_raw) if current_fields_raw else {}
    except json.JSONDecodeError:
        current_fields = {}

    extracted, extraction_error = _extract_background_section_a_from_files(files)
    if extraction_error:
        return Response({'detail': extraction_error}, status=status.HTTP_400_BAD_REQUEST)

    existing_values = {
        'contactName': _clean_ai_text(current_fields.get('contactName')) or (background.program_contact_name or '').strip(),
        'positionTitle': _clean_ai_text(current_fields.get('positionTitle')) or (background.contact_title or '').strip(),
        'officeLocation': _clean_ai_text(current_fields.get('officeLocation')) or (background.office_location or '').strip(),
        'phoneNumber': _clean_ai_text(current_fields.get('phoneNumber')) or (background.phone_number or '').strip(),
        'emailAddress': _clean_ai_text(current_fields.get('emailAddress')) or (background.email_address or '').strip(),
    }

    merged = {}
    applied_fields = []
    preserved_fields = []
    for field_name in ('contactName', 'positionTitle', 'officeLocation', 'phoneNumber', 'emailAddress'):
        existing_value = existing_values[field_name]
        extracted_value = _clean_ai_text(extracted.get(field_name))
        if existing_value:
            merged[field_name] = existing_value
            preserved_fields.append(field_name)
        else:
            merged[field_name] = extracted_value
            if extracted_value:
                applied_fields.append(field_name)

    phone_number_validated, phone_error = _validate_background_phone(merged['phoneNumber'])
    if phone_error:
        return Response({'phoneNumber': [phone_error]}, status=status.HTTP_400_BAD_REQUEST)
    merged['phoneNumber'] = phone_number_validated

    background.program_contact_name = merged['contactName']
    background.contact_title = merged['positionTitle']
    background.office_location = merged['officeLocation']
    background.phone_number = merged['phoneNumber']
    background.email_address = merged['emailAddress']
    background.save(update_fields=[
        'program_contact_name',
        'contact_title',
        'office_location',
        'phone_number',
        'email_address',
    ])
    _save_background_completion(background, item)

    return Response({
        'sectionTitle': section_title,
        'mergedFields': merged,
        'appliedFields': applied_fields,
        'preservedFields': preserved_fields,
        'confidenceNotes': _clean_ai_text(extracted.get('confidenceNotes')),
        'message': 'Local AI extraction completed for Background section A.',
    })


@api_view(['GET', 'PUT'])
def cycle_criterion1(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    criterion1, item = _get_or_create_criterion1(cycle)

    if request.method == 'GET':
        return Response(Criterion1StudentsSerializer(criterion1).data)

    serializer = Criterion1StudentsSerializer(criterion1, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(cycle=cycle, item=item)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
def cycle_criterion2(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    criterion2 = cycle.criterion2

    if request.method == 'GET':
        return Response(Criterion2PeosSerializer(criterion2).data)

    serializer = Criterion2PeosSerializer(criterion2, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


def _get_or_create_criterion4(cycle):
    item = ChecklistItem.objects.filter(
        checklist=cycle.checklist,
        item_name__icontains='Criterion 4'
    ).order_by('-item_id').first()
    if not item:
        item = ChecklistItem.objects.create(
            checklist=cycle.checklist,
            item_name=CRITERION_ITEMS[4],
            status=0,
            completion_percentage=0,
        )

    criterion4 = Criterion4.objects.filter(cycle=cycle).order_by('-criterion4_id').first()
    if not criterion4:
        next_criterion4_id = (Criterion4.objects.aggregate(max_id=Max('criterion4_id')).get('max_id') or 0) + 1
        criterion4 = Criterion4.objects.create(
            criterion4_id=next_criterion4_id,
            assessment_processes_description='',
            assessment_frequency_description='',
            documentation_storage_description='',
            ci_process_description='',
            recent_changes_description='',
            future_improvement_plans_description='',
            assessment_instruments_available='',
            meeting_minutes_available='',
            advisory_board_recommendations_available='',
            disaggregated_data_available='',
            onsite_review_notes='',
            cycle=cycle,
            item=item,
        )

    if criterion4.item_id != item.item_id:
        criterion4.item = item
        criterion4.save(update_fields=['item'])

    return criterion4, item


def _parse_criterion4_state(raw_value):
    text = f'{raw_value or ""}'.strip()
    if not text:
        return {}
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except (TypeError, ValueError):
        return {}


def _criterion4_course_rows(program_id, cycle_id):
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT Course_ID, Course_Code, Credits, Contact_Hours, Course_Type
            FROM COURSE
            WHERE Cycle_ID = %s
            ORDER BY Course_Code, Course_ID
            ''',
            [cycle_id]
        )
        rows = cursor.fetchall()

    return [_serialize_course_row(row) for row in rows]


def _resolve_criterion4_program_id(cycle, request):
    raw_program_id = request.query_params.get('program_id') or request.data.get('program_id')
    if raw_program_id not in (None, ''):
        try:
            parsed_program_id = int(raw_program_id)
        except (TypeError, ValueError):
            return None, Response({'detail': 'program_id must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        if not Program.objects.filter(program_id=parsed_program_id).exists():
            return None, Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)
        return parsed_program_id, None
    return cycle.program_id, None


def _default_criterion4_state(cycle, program_id):
    so_rows = [_serialize_so(row) for row in _program_so_rows(program_id)]
    course_rows = _criterion4_course_rows(cycle.program_id, cycle.cycle_id)
    sos = [
        {
            'id': row.get('display_code') or row.get('so_code') or f'SO{index + 1}',
            'so_id': row.get('so_id'),
            'label': row.get('so_discription') or '',
            'narrative': '',
        }
        for index, row in enumerate(so_rows)
    ]
    courses = [
        {
            'id': row.get('id'),
            'course_id': row.get('course_id'),
            'code': row.get('code') or '',
            'name': row.get('name') or '',
        }
        for row in course_rows
    ]
    return {
        'programNarrative': '',
        'recordsMaintenance': '',
        'programNarrativeStatus': 'not_started',
        'recordsMaintenanceStatus': 'not_started',
        'sos': sos,
        'courses': courses,
        'pis': [],
        'results': [],
        'mapping': {},
        'loops': [],
        'meetings': [],
        'instruments': [],
        'instrumentOptions': [],
        'frequencyOptions': [],
    }


def _serialize_criterion4_payload(cycle, criterion4, item, program_id):
    payload = _default_criterion4_state(cycle, program_id)
    stored_state = _parse_criterion4_state(criterion4.assessment_processes_description)
    if stored_state:
        saved_sos = stored_state.get('sos') if isinstance(stored_state.get('sos'), list) else []
        saved_sos_by_id = {
            f'{row.get("id") or ""}': row
            for row in saved_sos
            if isinstance(row, dict)
        }
        payload['sos'] = [
            {
                **so,
                'narrative': f'{saved_sos_by_id.get(f"{so.get('id')}", {}).get("narrative", so.get("narrative", ""))}',
            }
            for so in payload['sos']
        ]
        payload.update({
            'programNarrative': stored_state.get('programNarrative') if isinstance(stored_state.get('programNarrative'), str) else payload['programNarrative'],
            'recordsMaintenance': stored_state.get('recordsMaintenance') if isinstance(stored_state.get('recordsMaintenance'), str) else payload['recordsMaintenance'],
            'programNarrativeStatus': stored_state.get('programNarrativeStatus') if isinstance(stored_state.get('programNarrativeStatus'), str) else payload['programNarrativeStatus'],
            'recordsMaintenanceStatus': stored_state.get('recordsMaintenanceStatus') if isinstance(stored_state.get('recordsMaintenanceStatus'), str) else payload['recordsMaintenanceStatus'],
            'pis': stored_state.get('pis') if isinstance(stored_state.get('pis'), list) else payload['pis'],
            'results': stored_state.get('results') if isinstance(stored_state.get('results'), list) else payload['results'],
            'mapping': stored_state.get('mapping') if isinstance(stored_state.get('mapping'), dict) else payload['mapping'],
            'loops': stored_state.get('loops') if isinstance(stored_state.get('loops'), list) else payload['loops'],
            'meetings': stored_state.get('meetings') if isinstance(stored_state.get('meetings'), list) else payload['meetings'],
            'instruments': stored_state.get('instruments') if isinstance(stored_state.get('instruments'), list) else payload['instruments'],
            'instrumentOptions': stored_state.get('instrumentOptions') if isinstance(stored_state.get('instrumentOptions'), list) else payload['instrumentOptions'],
            'frequencyOptions': stored_state.get('frequencyOptions') if isinstance(stored_state.get('frequencyOptions'), list) else payload['frequencyOptions'],
        })
    payload.update({
        'criterion4_id': criterion4.criterion4_id,
        'item': item.item_id,
        'cycle': cycle.cycle_id,
    })
    return payload


@api_view(['GET', 'PUT'])
def cycle_criterion4(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    program_id, program_error = _resolve_criterion4_program_id(cycle, request)
    if program_error:
        return program_error

    criterion4, item = _get_or_create_criterion4(cycle)

    if request.method == 'GET':
        return Response(_serialize_criterion4_payload(cycle, criterion4, item, program_id))

    payload = {
        'programNarrative': request.data.get('programNarrative', ''),
        'recordsMaintenance': request.data.get('recordsMaintenance', ''),
        'programNarrativeStatus': request.data.get('programNarrativeStatus', 'not_started'),
        'recordsMaintenanceStatus': request.data.get('recordsMaintenanceStatus', 'not_started'),
        'sos': request.data.get('sos', []),
        'courses': request.data.get('courses', []),
        'pis': request.data.get('pis', []),
        'results': request.data.get('results', []),
        'mapping': request.data.get('mapping', {}),
        'loops': request.data.get('loops', []),
        'meetings': request.data.get('meetings', []),
        'instruments': request.data.get('instruments', []),
        'instrumentOptions': request.data.get('instrumentOptions', []),
        'frequencyOptions': request.data.get('frequencyOptions', []),
    }

    if not isinstance(payload['programNarrative'], str):
        return Response({'detail': 'programNarrative must be a string.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(payload['recordsMaintenance'], str):
        return Response({'detail': 'recordsMaintenance must be a string.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(payload['programNarrativeStatus'], str):
        return Response({'detail': 'programNarrativeStatus must be a string.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(payload['recordsMaintenanceStatus'], str):
        return Response({'detail': 'recordsMaintenanceStatus must be a string.'}, status=status.HTTP_400_BAD_REQUEST)

    list_fields = ['sos', 'courses', 'pis', 'results', 'loops', 'meetings', 'instruments', 'instrumentOptions', 'frequencyOptions']
    for field in list_fields:
        if not isinstance(payload[field], list):
            return Response({'detail': f'{field} must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(payload['mapping'], dict):
        return Response({'detail': 'mapping must be an object.'}, status=status.HTTP_400_BAD_REQUEST)

    criterion4.assessment_processes_description = json.dumps(payload)
    criterion4.assessment_frequency_description = ''
    criterion4.documentation_storage_description = ''
    criterion4.ci_process_description = ''
    criterion4.recent_changes_description = ''
    criterion4.future_improvement_plans_description = ''
    criterion4.assessment_instruments_available = ''
    criterion4.meeting_minutes_available = ''
    criterion4.advisory_board_recommendations_available = ''
    criterion4.disaggregated_data_available = ''
    criterion4.onsite_review_notes = ''
    criterion4.cycle = cycle
    criterion4.item = item
    criterion4.save()

    return Response(_serialize_criterion4_payload(cycle, criterion4, item, program_id))


def _get_or_create_criterion5(cycle):
    item = ChecklistItem.objects.filter(
        checklist=cycle.checklist,
        item_name__icontains='Criterion 5'
    ).order_by('-item_id').first()
    if not item:
        item = ChecklistItem.objects.create(
            checklist=cycle.checklist,
            item_name=CRITERION_ITEMS[5],
            status=0,
            completion_percentage=0,
        )

    criterion5 = cycle.criterion5
    if not criterion5:
        criterion5 = Criterion5Curriculum.objects.create(
            academic_calender_type='Semester',
            plan_of_study_description='',
            curriculum_alignment_description='',
            prerequisites_support_description='',
            prerequisite_flowchart_description='',
            hours_depth_by_subject_area_description='',
            broad_education_component_description='',
            cooperative_education_description='',
            materials_available_description='',
            culminating_design_experience='',
            curricular_paths='',
            table_5_1_rows=[],
            design_project_rows=[],
        )
        cycle.criterion5 = criterion5
        cycle.save(update_fields=['criterion5'])

    if item.criterion5_id != criterion5.criterion5_id:
        item.criterion5 = criterion5
        item.save(update_fields=['criterion5'])

    if cycle.criterion5_id != criterion5.criterion5_id:
        cycle.criterion5 = criterion5
        cycle.save(update_fields=['criterion5'])

    return criterion5, item


@api_view(['GET', 'PUT'])
def cycle_criterion5(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    criterion5, item = _get_or_create_criterion5(cycle)

    if request.method == 'GET':
        payload = Criterion5CurriculumSerializer(criterion5).data
        payload['checklist_item_id'] = item.item_id
        return Response(payload)

    serializer = Criterion5CurriculumSerializer(criterion5, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    saved = serializer.save()

    if cycle.criterion5_id != saved.criterion5_id:
        cycle.criterion5 = saved
        cycle.save(update_fields=['criterion5'])
    if item.criterion5_id != saved.criterion5_id:
        item.criterion5 = saved
        item.save(update_fields=['criterion5'])

    payload = serializer.data
    payload['checklist_item_id'] = item.item_id
    return Response(payload)


def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _criterion6_faculty_options(program_id):
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT f.Faculty_ID, COALESCE(f.Full_Name, ''), COALESCE(f.Academic_Rank, ''), COALESCE(f.Appointment_Type, '')
            FROM FACULTY_MEMBER f
            INNER JOIN ASSIGNED_TO a ON a.Faculty_ID = f.Faculty_ID
            WHERE a.program_id = %s
            ORDER BY f.Full_Name, f.Faculty_ID
            ''',
            [program_id]
        )
        rows = cursor.fetchall()

    return [
        {
            'faculty_id': int(row[0]),
            'full_name': row[1] or '',
            'academic_rank': row[2] or '',
            'appointment_type': row[3] or '',
        }
        for row in rows
    ]


def _ensure_program_faculty_assignment(program_id, faculty_id):
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT 1 FROM ASSIGNED_TO WHERE program_id = %s AND Faculty_ID = %s',
            [program_id, faculty_id]
        )
        if cursor.fetchone():
            return
        cursor.execute(
            'INSERT INTO ASSIGNED_TO (program_id, Faculty_ID) VALUES (%s, %s)',
            [program_id, faculty_id]
        )


def _resolve_or_create_criterion6_faculty(cycle, row, row_label):
    provided_faculty_id = _safe_int(row.get('faculty_id'), 0)
    if provided_faculty_id > 0:
        if not FacultyMember.objects.filter(faculty_id=provided_faculty_id).exists():
            return None, Response({'detail': f'{row_label}: faculty member not found.'}, status=status.HTTP_400_BAD_REQUEST)
        _ensure_program_faculty_assignment(cycle.program_id, provided_faculty_id)
        return provided_faculty_id, None

    faculty_name = f'{row.get("faculty_name", "")}'.strip()
    if not faculty_name:
        return None, Response(
            {'detail': f'{row_label}: faculty name or faculty_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    matched = FacultyMember.objects.filter(full_name__iexact=faculty_name).order_by('faculty_id').first()
    if matched:
        _ensure_program_faculty_assignment(cycle.program_id, int(matched.faculty_id))
        return int(matched.faculty_id), None

    next_faculty_id = int(FacultyMember.objects.aggregate(max_id=Max('faculty_id')).get('max_id') or 0) + 1
    academic_rank = f'{row.get("academic_rank", "")}'.strip()
    appointment_type = f'{row.get("academic_appointment", "")}'.strip()
    slug = re.sub(r'[^a-z0-9]+', '', faculty_name.lower()) or 'faculty'
    email = f'{slug}-{next_faculty_id}@criterion6.local'
    suffix = 1
    while FacultyMember.objects.filter(email__iexact=email).exists():
        email = f'{slug}-{next_faculty_id}-{suffix}@criterion6.local'
        suffix += 1

    created = FacultyMember.objects.create(
        faculty_id=next_faculty_id,
        full_name=faculty_name,
        academic_rank=academic_rank,
        appointment_type=appointment_type,
        email=email,
        office_hours='',
    )
    _ensure_program_faculty_assignment(cycle.program_id, int(created.faculty_id))
    return int(created.faculty_id), None


def _get_or_create_criterion6(cycle):
    item = ChecklistItem.objects.filter(
        checklist=cycle.checklist,
        item_name__icontains='Criterion 6'
    ).order_by('-item_id').first()
    if not item:
        item = ChecklistItem.objects.create(
            checklist=cycle.checklist,
            item_name=CRITERION_ITEMS[6],
            status=0,
            completion_percentage=0,
        )

    criterion6 = Criterion6Faculty.objects.filter(cycle=cycle).order_by('-criterion6_id').first()
    if not criterion6:
        criterion6 = _ensure_criterion6_for_cycle(cycle.cycle_id)

    if item.criterion6_id != criterion6.criterion6_id:
        item.criterion6 = criterion6
        item.save(update_fields=['criterion6'])

    return criterion6, item


def _criterion6_default_course_id(cycle_id):
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT Course_ID FROM COURSE WHERE Cycle_ID = %s ORDER BY Course_ID LIMIT 1',
            [cycle_id]
        )
        row = cursor.fetchone()
        if row and row[0] is not None:
            return int(row[0])

        cursor.execute('SELECT Course_ID FROM COURSE ORDER BY Course_ID LIMIT 1')
        row = cursor.fetchone()
        if row and row[0] is not None:
            return int(row[0])

    return 0


def _serialize_criterion6_payload(cycle, criterion6, item):
    faculty_options = _criterion6_faculty_options(cycle.program_id)
    faculty_name_lookup = {int(row['faculty_id']): row.get('full_name', '') for row in faculty_options}

    qualification_rows = []
    for row in (
        FacultyQualificationRow.objects
        .filter(criterion6_id=criterion6.criterion6_id)
        .select_related('faculty')
        .order_by('faculty_qualification_row_id')
    ):
        faculty_id = _safe_int(getattr(row, 'faculty_id', None), 0)
        qualification_rows.append({
            'faculty_qualification_row_id': row.faculty_qualification_row_id,
            'faculty_id': faculty_id,
            'faculty_name': getattr(row.faculty, 'full_name', '') if getattr(row, 'faculty_id', None) else '',
            'highest_degree_field': row.highest_degree_field or '',
            'highest_degree_year': row.highest_degree_year,
            'academic_rank': row.academic_rank or '',
            'academic_appointment': row.academic_appointment or '',
            'full_time_or_part_time': row.full_time_or_part_time or '',
            'years_gov_industry': row.years_gov_industry,
            'years_teaching': row.years_teaching,
            'years_at_institution': row.years_at_institution,
            'professional_registration': row.professional_registration or '',
        })

    workload_rows = []
    for row in (
        FacultyWorkloadRow.objects
        .filter(criterion6_id=criterion6.criterion6_id)
        .select_related('faculty')
        .order_by('faculty_workload_row_id')
    ):
        faculty_id = _safe_int(getattr(row, 'faculty_id', None), 0)
        workload_rows.append({
            'faculty_workload_row_id': row.faculty_workload_row_id,
            'faculty_id': faculty_id,
            'faculty_name': getattr(row.faculty, 'full_name', '') if getattr(row, 'faculty_id', None) else '',
            'fill_tie_or_part_time': row.fill_tie_or_part_time or '',
            'classes_taught_description': row.classes_taught_description or '',
            'term': row.term or '',
            'year': row.year,
            'course_id': getattr(row, 'course_id', None),
        })

    pd_map = {}
    for row in (
        ProfessionalDevelopment.objects
        .filter(criterion6_id=criterion6.criterion6_id)
        .select_related('faculty')
        .order_by('faculty_id', 'development_id')
    ):
        faculty_id = _safe_int(getattr(row, 'faculty_id', None), 0)
        if faculty_id <= 0:
            continue
        if faculty_id not in pd_map:
            pd_map[faculty_id] = {
                'faculty_id': faculty_id,
                'faculty_name': getattr(row.faculty, 'full_name', '') if getattr(row, 'faculty_id', None) else '',
                'activities': []
            }
        activity_text = (row.activity_description or '').strip()
        if activity_text:
            pd_map[faculty_id]['activities'].append(activity_text)

    for option in faculty_options:
        option_faculty_id = int(option['faculty_id'])
        if option_faculty_id not in pd_map:
            pd_map[option_faculty_id] = {
                'faculty_id': option_faculty_id,
                'faculty_name': option.get('full_name', ''),
                'activities': []
            }
        elif not pd_map[option_faculty_id].get('faculty_name'):
            pd_map[option_faculty_id]['faculty_name'] = option.get('full_name', '')

    professional_development_rows = sorted(
        list(pd_map.values()),
        key=lambda row: (row.get('faculty_name') or '').lower()
    )

    return {
        'criterion6_id': criterion6.criterion6_id,
        'faculty_composition_narrative': criterion6.faculty_composition_narrative or '',
        'faculty_worklaod_expectations_description': criterion6.faculty_worklaod_expectations_description or '',
        'workload_expectations_desciption': criterion6.workload_expectations_desciption or '',
        'faculty_size_adequacy_description': criterion6.faculty_size_adequacy_description or '',
        'advising_and_student_interaction_description': criterion6.advising_and_student_interaction_description or '',
        'service_and_industry_engagement_description': criterion6.service_and_industry_engagement_description or '',
        'course_creation_role_description': criterion6.course_creation_role_description or '',
        'peo_ro_role_description': criterion6.peo_ro_role_description or '',
        'leadership_roles_description': criterion6.leadership_roles_description or '',
        'cycle': cycle.cycle_id,
        'item': item.item_id if item else None,
        'faculty_options': faculty_options,
        'faculty_name_lookup': faculty_name_lookup,
        'qualification_rows': qualification_rows,
        'workload_rows': workload_rows,
        'professional_development_rows': professional_development_rows,
    }


@api_view(['GET', 'PUT'])
def cycle_criterion6(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    criterion6, item = _get_or_create_criterion6(cycle)

    if request.method == 'GET':
        return Response(_serialize_criterion6_payload(cycle, criterion6, item))

    qualification_rows = request.data.get('qualification_rows', [])
    workload_rows = request.data.get('workload_rows', [])
    professional_development_rows = request.data.get('professional_development_rows', [])

    if not isinstance(qualification_rows, list):
        return Response({'detail': 'qualification_rows must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(workload_rows, list):
        return Response({'detail': 'workload_rows must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(professional_development_rows, list):
        return Response({'detail': 'professional_development_rows must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    workload_description = (
        f'{request.data.get("workload_expectations_desciption", "")}'.strip()
        or f'{request.data.get("faculty_worklaod_expectations_description", "")}'.strip()
    )

    scalar_payload = {
        'faculty_composition_narrative': f'{request.data.get("faculty_composition_narrative", "")}'.strip(),
        'faculty_worklaod_expectations_description': workload_description,
        'workload_expectations_desciption': workload_description,
        'faculty_size_adequacy_description': f'{request.data.get("faculty_size_adequacy_description", "")}'.strip(),
        'advising_and_student_interaction_description': f'{request.data.get("advising_and_student_interaction_description", "")}'.strip(),
        'service_and_industry_engagement_description': f'{request.data.get("service_and_industry_engagement_description", "")}'.strip(),
        'course_creation_role_description': f'{request.data.get("course_creation_role_description", "")}'.strip(),
        'peo_ro_role_description': f'{request.data.get("peo_ro_role_description", "")}'.strip(),
        'leadership_roles_description': f'{request.data.get("leadership_roles_description", "")}'.strip(),
        'cycle': cycle.cycle_id,
    }

    prepared_qualification_rows = []
    for index, row in enumerate(qualification_rows, start=1):
        if not isinstance(row, dict):
            continue

        faculty_id = _safe_int(row.get('faculty_id'), 0)
        faculty_name = f'{row.get("faculty_name", "")}'.strip()
        row_has_text = any(
            f'{row.get(field, "")}'.strip()
            for field in [
                'faculty_name',
                'highest_degree_field',
                'academic_rank',
                'academic_appointment',
                'full_time_or_part_time',
                'professional_registration',
            ]
        )
        row_has_numeric = any(
            f'{row.get(field, "")}'.strip()
            for field in [
                'highest_degree_year',
                'years_gov_industry',
                'years_teaching',
                'years_at_institution',
            ]
        )
        if not (faculty_id or row_has_text or row_has_numeric):
            continue

        resolved_faculty_id, faculty_error = _resolve_or_create_criterion6_faculty(
            cycle,
            row,
            f'Qualification row {index}'
        )
        if faculty_error:
            return faculty_error

        prepared_qualification_rows.append({
            'faculty_id': resolved_faculty_id,
            'faculty_name': faculty_name,
            'highest_degree_field': f'{row.get("highest_degree_field", "")}'.strip(),
            'highest_degree_year': _safe_int(row.get('highest_degree_year'), 0),
            'academic_rank': f'{row.get("academic_rank", "")}'.strip(),
            'academic_appointment': f'{row.get("academic_appointment", "")}'.strip(),
            'full_time_or_part_time': f'{row.get("full_time_or_part_time", "")}'.strip(),
            'years_gov_industry': _safe_int(row.get('years_gov_industry'), 0),
            'years_teaching': _safe_int(row.get('years_teaching'), 0),
            'years_at_institution': _safe_int(row.get('years_at_institution'), 0),
            'professional_registration': f'{row.get("professional_registration", "")}'.strip(),
        })

    default_course_id = _criterion6_default_course_id(cycle.cycle_id)
    prepared_workload_rows = []
    for index, row in enumerate(workload_rows, start=1):
        if not isinstance(row, dict):
            continue

        faculty_id = _safe_int(row.get('faculty_id'), 0)
        faculty_name = f'{row.get("faculty_name", "")}'.strip()
        row_has_text = any(
            f'{row.get(field, "")}'.strip()
            for field in ['faculty_name', 'fill_tie_or_part_time', 'classes_taught_description', 'term']
        )
        row_has_year = f'{row.get("year", "")}'.strip() != ''
        if not (faculty_id or row_has_text or row_has_year):
            continue

        if faculty_id <= 0:
            resolved_faculty_id, faculty_error = _resolve_or_create_criterion6_faculty(
                cycle,
                row,
                f'Workload row {index}'
            )
            if faculty_error:
                return faculty_error
            faculty_id = resolved_faculty_id
        elif not FacultyMember.objects.filter(faculty_id=faculty_id).exists():
            return Response({'detail': f'Workload row {index}: faculty member not found.'}, status=status.HTTP_400_BAD_REQUEST)

        course_id = _safe_int(row.get('course_id'), default_course_id)
        if course_id <= 0:
            course_id = default_course_id
        if course_id <= 0:
            return Response(
                {'detail': f'Workload row {index}: no course is available. Add at least one course before saving workload rows.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resolved_year = _safe_int(row.get('year'), 0)
        if resolved_year <= 0:
            resolved_year = int(cycle.end_year or cycle.start_year or timezone.now().year)

        prepared_workload_rows.append({
            'faculty_id': faculty_id,
            'fill_tie_or_part_time': f'{row.get("fill_tie_or_part_time", "")}'.strip(),
            'classes_taught_description': f'{row.get("classes_taught_description", "")}'.strip(),
            'term': f'{row.get("term", "")}'.strip(),
            'year': resolved_year,
            'course_id': course_id,
        })

    prepared_pd_rows = []
    for row in professional_development_rows:
        if not isinstance(row, dict):
            continue
        faculty_id = _safe_int(row.get('faculty_id'), 0)
        if faculty_id <= 0:
            continue
        if not FacultyMember.objects.filter(faculty_id=faculty_id).exists():
            return Response({'detail': f'Professional development: faculty {faculty_id} not found.'}, status=status.HTTP_400_BAD_REQUEST)

        activities_payload = row.get('activities')
        if isinstance(activities_payload, list):
            activities = [f'{value}'.strip() for value in activities_payload if f'{value}'.strip()]
        else:
            activities_text = f'{row.get("activities_text", "")}'.strip()
            if not activities_text:
                activities_text = f'{row.get("activity_description", "")}'.strip()
            activities = [
                line.strip('- ').strip()
                for line in activities_text.splitlines()
                if line.strip('- ').strip()
            ]

        for activity in activities:
            prepared_pd_rows.append({
                'faculty_id': faculty_id,
                'activity_description': activity
            })

    with transaction.atomic():
        serializer = Criterion6FacultySerializer(criterion6, data=scalar_payload, partial=True)
        serializer.is_valid(raise_exception=True)
        saved_criterion6 = serializer.save(cycle=cycle)

        if item and item.criterion6_id != saved_criterion6.criterion6_id:
            item.criterion6 = saved_criterion6
            item.save(update_fields=['criterion6'])

        FacultyQualificationRow.objects.filter(criterion6_id=saved_criterion6.criterion6_id).delete()
        next_q_id = (FacultyQualificationRow.objects.aggregate(max_id=Max('faculty_qualification_row_id')).get('max_id') or 0) + 1
        qualification_objects = []
        for row in prepared_qualification_rows:
            qualification_objects.append(
                FacultyQualificationRow(
                    faculty_qualification_row_id=next_q_id,
                    highest_degree_field=row['highest_degree_field'],
                    highest_degree_year=row['highest_degree_year'],
                    academic_rank=row['academic_rank'],
                    academic_appointment=row['academic_appointment'],
                    full_time_or_part_time=row['full_time_or_part_time'],
                    years_gov_industry=row['years_gov_industry'],
                    years_teaching=row['years_teaching'],
                    years_at_institution=row['years_at_institution'],
                    professional_registration=row['professional_registration'],
                    criterion6_id=saved_criterion6.criterion6_id,
                    faculty_id=row['faculty_id'],
                )
            )
            next_q_id += 1
        if qualification_objects:
            FacultyQualificationRow.objects.bulk_create(qualification_objects)

        FacultyWorkloadRow.objects.filter(criterion6_id=saved_criterion6.criterion6_id).delete()
        next_w_id = (FacultyWorkloadRow.objects.aggregate(max_id=Max('faculty_workload_row_id')).get('max_id') or 0) + 1
        workload_objects = []
        for row in prepared_workload_rows:
            workload_objects.append(
                FacultyWorkloadRow(
                    faculty_workload_row_id=next_w_id,
                    fill_tie_or_part_time=row['fill_tie_or_part_time'],
                    classes_taught_description=row['classes_taught_description'],
                    term=row['term'],
                    year=row['year'],
                    criterion6_id=saved_criterion6.criterion6_id,
                    faculty_id=row['faculty_id'],
                    course_id=row['course_id'],
                )
            )
            next_w_id += 1
        if workload_objects:
            FacultyWorkloadRow.objects.bulk_create(workload_objects)

        ProfessionalDevelopment.objects.filter(criterion6_id=saved_criterion6.criterion6_id).delete()
        next_pd_id = (ProfessionalDevelopment.objects.aggregate(max_id=Max('development_id')).get('max_id') or 0) + 1
        pd_objects = []
        for row in prepared_pd_rows:
            pd_objects.append(
                ProfessionalDevelopment(
                    development_id=next_pd_id,
                    activity_description=row['activity_description'],
                    faculty_id=row['faculty_id'],
                    criterion6_id=saved_criterion6.criterion6_id,
                )
            )
            next_pd_id += 1
        if pd_objects:
            ProfessionalDevelopment.objects.bulk_create(pd_objects)

    return Response(_serialize_criterion6_payload(cycle, saved_criterion6, item))


def _get_or_create_appendixc(cycle):
    appendix = AppendixCEquipment.objects.filter(cycle=cycle).order_by('-appendix_c_id').first()
    if appendix:
        return appendix

    return AppendixCEquipment.objects.create(
        cycle=cycle,
        last_updated_date=timezone.now().date(),
        labs_covered_count=0,
        equipment_items_count=0,
        high_value_assets_count=0,
    )


def _ensure_appendices_item(cycle):
    _ensure_checklist_items(cycle)
    item = ChecklistItem.objects.filter(
        checklist=cycle.checklist,
        item_name__icontains='append'
    ).order_by('-item_id').first()
    if item:
        return item
    return ChecklistItem.objects.create(
        checklist=cycle.checklist,
        item_name=CRITERION_ITEMS[9],
        status=0,
        completion_percentage=0,
    )


def _validate_appendixc_service_date(raw_value):
    text = f'{raw_value or ""}'.strip()
    if not text:
        return None, 'Last service date is required.'

    parsed = None
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%m/%d/%Y'):
        try:
            parsed = datetime.strptime(text, fmt).date()
            break
        except ValueError:
            continue
    if parsed is None:
        return None, 'Last service date must be a valid date (YYYY-MM-DD, YYYY/MM/DD, or MM/DD/YYYY).'

    if parsed > timezone.now().date():
        return None, 'Last service date cannot be in the future.'
    return parsed, None


def _appendixc_completion_from_rows(rows):
    if not rows:
        return 0
    required_fields = 6  # name/category/quantity/location/use/last_service_date
    total_cells = len(rows) * required_fields
    filled_cells = 0

    for row in rows:
        if f'{row.get("equipment_name") or ""}'.strip():
            filled_cells += 1
        if f'{row.get("category") or ""}'.strip():
            filled_cells += 1
        if int(row.get('quantity') or 0) > 0:
            filled_cells += 1
        if f'{row.get("location_lab") or ""}'.strip():
            filled_cells += 1
        if f'{row.get("instructional_use") or ""}'.strip():
            filled_cells += 1
        if row.get('last_service_date') is not None:
            filled_cells += 1

    return round((filled_cells / total_cells) * 100)


def _appendixd_completion_from_payload(payload):
    scalar_fields = [
        payload.get('institution_name'),
        payload.get('institutiton_address'),
        payload.get('chief_executive_name'),
        payload.get('chief_ececutive_title'),
        payload.get('self_study_submitter_name'),
        payload.get('self_study_submitter_title'),
        payload.get('institutional_accreditations'),
        payload.get('accreditation_evalutaion_dates'),
        payload.get('control_type_description'),
        payload.get('administrative_chain_description'),
        payload.get('credit_hour_definition'),
        payload.get('deviations_from_standard'),
    ]
    scalar_completed = sum(1 for value in scalar_fields if f'{value or ""}'.strip())
    scalar_total = len(scalar_fields)

    row_groups = [
        payload.get('academic_support_units') or [],
        payload.get('nonacademic_support_units') or [],
        payload.get('enrollment_records') or [],
        payload.get('personnel_records') or [],
    ]
    row_group_completed = sum(1 for rows in row_groups if len(rows) > 0)
    row_group_total = len(row_groups)

    return round(((scalar_completed + row_group_completed) / (scalar_total + row_group_total)) * 100)


def _current_appendixd_completion(cycle):
    appendix_d = AppendixDInstitution.objects.filter(cycle=cycle).order_by('-appendix_d_id').first()
    if not appendix_d:
        return 0

    payload = {
        'institution_name': appendix_d.institution_name,
        'institutiton_address': appendix_d.institutiton_address,
        'chief_executive_name': appendix_d.chief_executive_name,
        'chief_ececutive_title': appendix_d.chief_ececutive_title,
        'self_study_submitter_name': appendix_d.self_study_submitter_name,
        'self_study_submitter_title': appendix_d.self_study_submitter_title,
        'institutional_accreditations': appendix_d.institutional_accreditations,
        'accreditation_evalutaion_dates': appendix_d.accreditation_evalutaion_dates,
        'control_type_description': appendix_d.control_type_description,
        'administrative_chain_description': appendix_d.administrative_chain_description,
        'credit_hour_definition': appendix_d.credit_hour_definition,
        'deviations_from_standard': appendix_d.deviations_from_standard,
        'academic_support_units': list(AcademicSupportUnit.objects.filter(appendix_d=appendix_d).values('support_unit_id')),
        'nonacademic_support_units': list(NonacademicSupportUnit.objects.filter(appendix_d=appendix_d).values('nonacademic_support_unit_id')),
        'enrollment_records': list(EnrollmentRecord.objects.filter(appendix_d=appendix_d).values('enrollment_record_id')),
        'personnel_records': list(PersonnelRecord.objects.filter(appendix_d=appendix_d).values('personnel_record_id')),
    }
    return _appendixd_completion_from_payload(payload)


def _current_appendixc_completion(cycle):
    appendix_c = AppendixCEquipment.objects.filter(cycle=cycle).order_by('-appendix_c_id').first()
    if not appendix_c:
        return 0
    rows = EquipmentItem.objects.filter(appendix_c=appendix_c).values(
        'equipment_name',
        'category',
        'quantity',
        'location_lab',
        'instructional_use',
        'last_service_date',
    )
    return _appendixc_completion_from_rows(rows)


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@api_view(['GET', 'PUT'])
def cycle_appendixc(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    appendix = _get_or_create_appendixc(cycle)

    if request.method == 'GET':
        equipment_rows = EquipmentItem.objects.filter(appendix_c=appendix).order_by('equipment_id')
        return Response({
            'appendix': AppendixCEquipmentSerializer(appendix).data,
            'equipment_rows': EquipmentItemSerializer(equipment_rows, many=True).data,
        })

    rows = request.data.get('equipment_rows', [])
    if not isinstance(rows, list):
        return Response({'detail': 'equipment_rows must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    labs_covered_count = _to_int(request.data.get('labs_covered_count'), 0)
    high_value_assets_count = _to_int(request.data.get('high_value_assets_count'), 0)
    if labs_covered_count < 0:
        return Response({'labs_covered_count': ['Labs covered count must be 0 or greater.']}, status=status.HTTP_400_BAD_REQUEST)
    if high_value_assets_count < 0:
        return Response({'high_value_assets_count': ['High-value assets count must be 0 or greater.']}, status=status.HTTP_400_BAD_REQUEST)

    normalized_rows = []
    row_errors = {}
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            row_errors[f'equipment_rows[{index}]'] = ['Each equipment row must be an object.']
            continue

        equipment_name = f'{row.get("equipment_name") or ""}'.strip()
        category = f'{row.get("category") or ""}'.strip()
        location_lab = f'{row.get("location_lab") or ""}'.strip()
        instructional_use = f'{row.get("instructional_use") or ""}'.strip()
        evidence_link = f'{row.get("evidence_link") or ""}'.strip()
        quantity_raw = row.get('quantity')
        try:
            quantity = int(quantity_raw)
        except (TypeError, ValueError):
            quantity = -1
        service_date, service_date_error = _validate_appendixc_service_date(row.get('last_service_date'))

        current_row_errors = []
        if not equipment_name:
            current_row_errors.append('Equipment name is required.')
        if not category:
            current_row_errors.append('Category is required.')
        if quantity <= 0:
            current_row_errors.append('Quantity must be a positive integer.')
        if not location_lab:
            current_row_errors.append('Location / Lab is required.')
        if not instructional_use:
            current_row_errors.append('Instructional use is required.')
        if service_date_error:
            current_row_errors.append(service_date_error)

        if current_row_errors:
            row_errors[f'equipment_rows[{index}]'] = current_row_errors
            continue

        normalized_rows.append({
            'equipment_name': equipment_name,
            'category': category,
            'quantity': quantity,
            'location_lab': location_lab,
            'instructional_use': instructional_use,
            'last_service_date': service_date,
            'evidence_link': evidence_link,
        })

    if row_errors:
        return Response(row_errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        EquipmentItem.objects.filter(appendix_c=appendix).delete()

        next_equipment_id = (EquipmentItem.objects.aggregate(max_id=Max('equipment_id')).get('max_id') or 0) + 1
        created_rows = []
        for index, row in enumerate(normalized_rows):
            created = EquipmentItem.objects.create(
                equipment_id=int(next_equipment_id + index),
                equipment_name=row.get('equipment_name'),
                category=row.get('category'),
                quantity=row.get('quantity'),
                location_lab=row.get('location_lab'),
                instructional_use=row.get('instructional_use'),
                last_service_date=row.get('last_service_date'),
                evidence_link=row.get('evidence_link'),
                appendix_c=appendix,
            )
            created_rows.append(created)

        appendix.labs_covered_count = labs_covered_count
        appendix.high_value_assets_count = high_value_assets_count
        appendix.equipment_items_count = len(created_rows)
        appendix.last_updated_date = timezone.now().date()
        appendix.save()

        appendices_item = _ensure_appendices_item(cycle)
        appendix_c_completion = _appendixc_completion_from_rows(normalized_rows)
        appendix_d_completion = _current_appendixd_completion(cycle)
        completion_percentage = round((appendix_c_completion + appendix_d_completion) / 2)
        appendices_item.status = 1 if completion_percentage >= 100 else 0
        appendices_item.completion_percentage = completion_percentage
        appendices_item.save(update_fields=['status', 'completion_percentage'])

    return Response({
        'appendix': AppendixCEquipmentSerializer(appendix).data,
        'equipment_rows': EquipmentItemSerializer(created_rows, many=True).data,
    })


def _get_or_create_appendixd(cycle):
    appendix_d = AppendixDInstitution.objects.filter(cycle=cycle).order_by('-appendix_d_id').first()
    if appendix_d:
        return appendix_d

    appendices_item = _ensure_appendices_item(cycle)
    max_id = AppendixDInstitution.objects.aggregate(max_id=Max('appendix_d_id')).get('max_id') or 0
    return AppendixDInstitution.objects.create(
        appendix_d_id=int(max_id) + 1,
        institution_name='',
        institutiton_address='',
        chief_executive_name='',
        chief_ececutive_title='',
        self_study_submitter_name='',
        self_study_submitter_title='',
        institutional_accreditations='',
        accreditation_evalutaion_dates='',
        control_type_description='',
        administrative_chain_description='',
        organization_chart_file_reference='',
        credit_hour_definition='',
        deviations_from_standard='',
        cycle=cycle,
        item=appendices_item,
    )


def _serialize_appendixd_payload(appendix_d):
    academic_units = list(
        AcademicSupportUnit.objects.filter(appendix_d=appendix_d).order_by('support_unit_id').values(
            'support_unit_id', 'unit_name', 'responsible_person_name', 'responsible_person_title', 'contact_email', 'contact_phone'
        )
    )
    nonacademic_units = list(
        NonacademicSupportUnit.objects.filter(appendix_d=appendix_d).order_by('nonacademic_support_unit_id').values(
            'nonacademic_support_unit_id', 'unit_name', 'responsible_person_name', 'responsible_person_title', 'contact_email', 'contact_phone'
        )
    )
    enrollment_records = list(
        EnrollmentRecord.objects.filter(appendix_d=appendix_d).order_by('enrollment_record_id').values(
            'enrollment_record_id',
            'academic_year',
            'student_type',
            'year1_count',
            'year2_count',
            'year3_count',
            'year4_count',
            'year5_count',
            'total_undergraduate',
            'total_graduate',
            'associates_awarded',
            'bachelors_awarded',
            'masters_awarded',
            'doctorates_awarded',
        )
    )
    personnel_records = list(
        PersonnelRecord.objects.filter(appendix_d=appendix_d).order_by('personnel_record_id').values(
            'personnel_record_id', 'employment_category', 'full_time_count', 'part_time_count', 'fte_count'
        )
    )

    return {
        'appendix_d_id': appendix_d.appendix_d_id,
        'institutionName': appendix_d.institution_name or '',
        'institutionAddress': appendix_d.institutiton_address or '',
        'chiefExecutiveName': appendix_d.chief_executive_name or '',
        'chiefExecutiveTitle': appendix_d.chief_ececutive_title or '',
        'selfStudySubmitterName': appendix_d.self_study_submitter_name or '',
        'selfStudySubmitterTitle': appendix_d.self_study_submitter_title or '',
        'institutionalAccreditations': appendix_d.institutional_accreditations or '',
        'accreditationEvaluationDates': appendix_d.accreditation_evalutaion_dates or '',
        'controlTypeDescription': appendix_d.control_type_description or '',
        'administrativeChainDescription': appendix_d.administrative_chain_description or '',
        'organizationChartFileReference': appendix_d.organization_chart_file_reference or '',
        'creditHourDefinition': appendix_d.credit_hour_definition or '',
        'deviationsFromStandard': appendix_d.deviations_from_standard or '',
        'academicSupportUnits': academic_units,
        'nonacademicSupportUnits': nonacademic_units,
        'enrollmentRecords': enrollment_records,
        'personnelRecords': personnel_records,
    }


@api_view(['GET', 'PUT'])
def cycle_appendixd(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'Accreditation cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

    appendix_d = _get_or_create_appendixd(cycle)

    if request.method == 'GET':
        return Response(_serialize_appendixd_payload(appendix_d))

    academic_units = request.data.get('academicSupportUnits', [])
    nonacademic_units = request.data.get('nonacademicSupportUnits', [])
    enrollment_records = request.data.get('enrollmentRecords', [])
    personnel_records = request.data.get('personnelRecords', [])

    list_fields = {
        'academicSupportUnits': academic_units,
        'nonacademicSupportUnits': nonacademic_units,
        'enrollmentRecords': enrollment_records,
        'personnelRecords': personnel_records,
    }
    for field_name, field_value in list_fields.items():
        if not isinstance(field_value, list):
            return Response({field_name: ['Must be a list.']}, status=status.HTTP_400_BAD_REQUEST)

    def _norm_text(value):
        return f'{value or ""}'.strip()
    email_regex = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
    def _is_numeric_contact(text):
        normalized = re.sub(r'[\s\-\(\)]', '', text or '')
        return bool(re.fullmatch(r'\+?\d+', normalized))
    def _optional_nonnegative_int(value, label):
        text = f'{value or ""}'.strip()
        if text == '':
            return 0, None
        try:
            parsed = int(text)
        except (TypeError, ValueError):
            return 0, f'{label} must be a non-negative integer.'
        if parsed < 0:
            return 0, f'{label} must be a non-negative integer.'
        return parsed, None
    def _optional_nonnegative_number(value, label):
        text = f'{value or ""}'.strip()
        if text == '':
            return 0, None
        try:
            parsed = float(text)
        except (TypeError, ValueError):
            return 0, f'{label} must be a non-negative number.'
        if parsed < 0:
            return 0, f'{label} must be a non-negative number.'
        return parsed, None
    def _is_valid_academic_year(value):
        match = re.fullmatch(r'(\d{4})-(\d{4})', value or '')
        if not match:
            return False
        return int(match.group(2)) == int(match.group(1)) + 1

    normalized_academic = []
    row_errors = {}
    for row in academic_units:
        if not isinstance(row, dict):
            continue
        normalized = {
            'unit_name': _norm_text(row.get('unit_name', row.get('unit'))),
            'responsible_person_name': _norm_text(row.get('responsible_person_name', row.get('name'))),
            'responsible_person_title': _norm_text(row.get('responsible_person_title', row.get('title'))),
            'contact_email': _norm_text(row.get('contact_email')),
            'contact_phone': _norm_text(row.get('contact_phone', row.get('contact'))),
        }
        row_index = len(normalized_academic)
        current_errors = []
        has_any = any(normalized.values())
        if not has_any:
            continue
        if normalized['contact_email'] and not email_regex.match(normalized['contact_email']):
            current_errors.append('Email must be valid.')
        if normalized['contact_phone'] and not _is_numeric_contact(normalized['contact_phone']):
            current_errors.append('Phone must contain only numbers.')
        if current_errors:
            row_errors[f'academicSupportUnits[{row_index}]'] = current_errors
        normalized_academic.append(normalized)

    normalized_nonacademic = []
    for row in nonacademic_units:
        if not isinstance(row, dict):
            continue
        normalized = {
            'unit_name': _norm_text(row.get('unit_name', row.get('unit'))),
            'responsible_person_name': _norm_text(row.get('responsible_person_name', row.get('name'))),
            'responsible_person_title': _norm_text(row.get('responsible_person_title', row.get('title'))),
            'contact_email': _norm_text(row.get('contact_email')),
            'contact_phone': _norm_text(row.get('contact_phone', row.get('contact'))),
        }
        row_index = len(normalized_nonacademic)
        current_errors = []
        has_any = any(normalized.values())
        if not has_any:
            continue
        if normalized['contact_email'] and not email_regex.match(normalized['contact_email']):
            current_errors.append('Email must be valid.')
        if normalized['contact_phone'] and not _is_numeric_contact(normalized['contact_phone']):
            current_errors.append('Phone must contain only numbers.')
        if current_errors:
            row_errors[f'nonacademicSupportUnits[{row_index}]'] = current_errors
        normalized_nonacademic.append(normalized)

    normalized_enrollment = []
    seen_enrollment_keys = set()
    for row in enrollment_records:
        if not isinstance(row, dict):
            continue
        year1_count, err_year1 = _optional_nonnegative_int(row.get('year1_count', row.get('y1')), '1st year enrollment')
        year2_count, err_year2 = _optional_nonnegative_int(row.get('year2_count', row.get('y2')), '2nd year enrollment')
        year3_count, err_year3 = _optional_nonnegative_int(row.get('year3_count', row.get('y3')), '3rd year enrollment')
        year4_count, err_year4 = _optional_nonnegative_int(row.get('year4_count', row.get('y4')), '4th year enrollment')
        year5_count, err_year5 = _optional_nonnegative_int(row.get('year5_count', row.get('y5')), '5th year enrollment')
        total_graduate, err_grad = _optional_nonnegative_int(row.get('total_graduate', row.get('grad')), 'Total Grad')
        associates_awarded, err_a = _optional_nonnegative_int(row.get('associates_awarded', row.get('a')), 'Associates')
        bachelors_awarded, err_b = _optional_nonnegative_int(row.get('bachelors_awarded', row.get('b')), 'Bachelors')
        masters_awarded, err_m = _optional_nonnegative_int(row.get('masters_awarded', row.get('m')), 'Masters')
        doctorates_awarded, err_d = _optional_nonnegative_int(row.get('doctorates_awarded', row.get('d')), 'Doctorates')
        normalized = {
            'academic_year': _norm_text(row.get('academic_year', row.get('year'))),
            'student_type': _norm_text(row.get('student_type', row.get('type'))).upper(),
            'year1_count': year1_count,
            'year2_count': year2_count,
            'year3_count': year3_count,
            'year4_count': year4_count,
            'year5_count': year5_count,
            'total_undergraduate': year1_count + year2_count + year3_count + year4_count + year5_count,
            'total_graduate': total_graduate,
            'associates_awarded': associates_awarded,
            'bachelors_awarded': bachelors_awarded,
            'masters_awarded': masters_awarded,
            'doctorates_awarded': doctorates_awarded,
        }
        row_index = len(normalized_enrollment)
        current_errors = []
        has_any = (
            normalized['academic_year'] or normalized['student_type'] or
            normalized['year1_count'] or normalized['year2_count'] or normalized['year3_count'] or normalized['year4_count'] or
            normalized['year5_count'] or normalized['total_graduate'] or
            normalized['associates_awarded'] or normalized['bachelors_awarded'] or normalized['masters_awarded'] or normalized['doctorates_awarded']
        )
        if not has_any:
            continue
        if not normalized['academic_year']:
            current_errors.append('Academic Year is required.')
        elif not _is_valid_academic_year(normalized['academic_year']):
            current_errors.append('Academic Year must use YYYY-YYYY.')
        if not normalized['student_type']:
            current_errors.append('FT/PT is required.')
        if normalized['student_type'] and normalized['student_type'].upper() not in ('FT', 'PT'):
            current_errors.append('FT/PT must be either FT or PT.')
        for parse_error in [
            err_year1, err_year2, err_year3, err_year4, err_year5,
            err_grad, err_a, err_b, err_m, err_d
        ]:
            if parse_error:
                current_errors.append(parse_error)
        duplicate_key = f"{normalized['academic_year']}::{normalized['student_type']}"
        if normalized['academic_year'] and normalized['student_type']:
            if duplicate_key in seen_enrollment_keys:
                current_errors.append('Duplicate Academic Year + FT/PT combination.')
            else:
                seen_enrollment_keys.add(duplicate_key)
        if current_errors:
            row_errors[f'enrollmentRecords[{row_index}]'] = current_errors
        normalized_enrollment.append(normalized)

    normalized_personnel = []
    for row in personnel_records:
        if not isinstance(row, dict):
            continue
        full_time_count, err_ft = _optional_nonnegative_int(row.get('full_time_count', row.get('ft')), 'FT')
        part_time_count, err_pt = _optional_nonnegative_int(row.get('part_time_count', row.get('pt')), 'PT')
        fte_count, err_fte = _optional_nonnegative_number(row.get('fte_count', row.get('fte')), 'FTE')
        normalized = {
            'employment_category': _norm_text(row.get('employment_category', row.get('cat'))),
            'full_time_count': full_time_count,
            'part_time_count': part_time_count,
            'fte_count': full_time_count + (part_time_count * 0.5),
        }
        row_index = len(normalized_personnel)
        current_errors = []
        has_any = normalized['employment_category'] or normalized['full_time_count'] or normalized['part_time_count'] or normalized['fte_count']
        if not has_any:
            continue
        if not normalized['employment_category']:
            current_errors.append('Employment Category is required.')
        for parse_error in [err_ft, err_pt, err_fte]:
            if parse_error:
                current_errors.append(parse_error)
        if current_errors:
            row_errors[f'personnelRecords[{row_index}]'] = current_errors
        normalized_personnel.append(normalized)
    if row_errors:
        return Response(row_errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        appendix_d.institution_name = _norm_text(request.data.get('institutionName'))
        appendix_d.institutiton_address = _norm_text(request.data.get('institutionAddress'))
        appendix_d.chief_executive_name = _norm_text(request.data.get('chiefExecutiveName'))
        appendix_d.chief_ececutive_title = _norm_text(request.data.get('chiefExecutiveTitle'))
        appendix_d.self_study_submitter_name = _norm_text(request.data.get('selfStudySubmitterName'))
        appendix_d.self_study_submitter_title = _norm_text(request.data.get('selfStudySubmitterTitle'))
        appendix_d.institutional_accreditations = _norm_text(request.data.get('institutionalAccreditations'))
        appendix_d.accreditation_evalutaion_dates = _norm_text(request.data.get('accreditationEvaluationDates'))
        appendix_d.control_type_description = _norm_text(request.data.get('controlTypeDescription'))
        appendix_d.administrative_chain_description = _norm_text(request.data.get('administrativeChainDescription'))
        appendix_d.organization_chart_file_reference = _norm_text(request.data.get('organizationChartFileReference'))
        appendix_d.credit_hour_definition = _norm_text(request.data.get('creditHourDefinition'))
        appendix_d.deviations_from_standard = _norm_text(request.data.get('deviationsFromStandard'))
        appendix_d.save()

        AcademicSupportUnit.objects.filter(appendix_d=appendix_d).delete()
        NonacademicSupportUnit.objects.filter(appendix_d=appendix_d).delete()
        EnrollmentRecord.objects.filter(appendix_d=appendix_d).delete()
        PersonnelRecord.objects.filter(appendix_d=appendix_d).delete()

        next_academic_id = (AcademicSupportUnit.objects.aggregate(max_id=Max('support_unit_id')).get('max_id') or 0) + 1
        for index, row in enumerate(normalized_academic):
            AcademicSupportUnit.objects.create(
                support_unit_id=int(next_academic_id + index),
                appendix_d=appendix_d,
                **row,
            )

        next_nonacademic_id = (NonacademicSupportUnit.objects.aggregate(max_id=Max('nonacademic_support_unit_id')).get('max_id') or 0) + 1
        for index, row in enumerate(normalized_nonacademic):
            NonacademicSupportUnit.objects.create(
                nonacademic_support_unit_id=int(next_nonacademic_id + index),
                appendix_d=appendix_d,
                **row,
            )

        next_enrollment_id = (EnrollmentRecord.objects.aggregate(max_id=Max('enrollment_record_id')).get('max_id') or 0) + 1
        for index, row in enumerate(normalized_enrollment):
            EnrollmentRecord.objects.create(
                enrollment_record_id=int(next_enrollment_id + index),
                appendix_d=appendix_d,
                **row,
            )

        next_personnel_id = (PersonnelRecord.objects.aggregate(max_id=Max('personnel_record_id')).get('max_id') or 0) + 1
        for index, row in enumerate(normalized_personnel):
            PersonnelRecord.objects.create(
                personnel_record_id=int(next_personnel_id + index),
                appendix_d=appendix_d,
                **row,
            )

        appendices_item = _ensure_appendices_item(cycle)
        appendix_d_completion = _appendixd_completion_from_payload({
            'institution_name': appendix_d.institution_name,
            'institutiton_address': appendix_d.institutiton_address,
            'chief_executive_name': appendix_d.chief_executive_name,
            'chief_ececutive_title': appendix_d.chief_ececutive_title,
            'self_study_submitter_name': appendix_d.self_study_submitter_name,
            'self_study_submitter_title': appendix_d.self_study_submitter_title,
            'institutional_accreditations': appendix_d.institutional_accreditations,
            'accreditation_evalutaion_dates': appendix_d.accreditation_evalutaion_dates,
            'control_type_description': appendix_d.control_type_description,
            'administrative_chain_description': appendix_d.administrative_chain_description,
            'credit_hour_definition': appendix_d.credit_hour_definition,
            'deviations_from_standard': appendix_d.deviations_from_standard,
            'academic_support_units': normalized_academic,
            'nonacademic_support_units': normalized_nonacademic,
            'enrollment_records': normalized_enrollment,
            'personnel_records': normalized_personnel,
        })
        appendix_c_completion = _current_appendixc_completion(cycle)
        completion_percentage = round((appendix_c_completion + appendix_d_completion) / 2)
        appendices_item.status = 1 if completion_percentage >= 100 else 0
        appendices_item.completion_percentage = completion_percentage
        appendices_item.save(update_fields=['status', 'completion_percentage'])

    appendix_d.refresh_from_db()
    return Response(_serialize_appendixd_payload(appendix_d))


# ============================================================================
# CRITERION 7 VIEWSETS
# ============================================================================

class Criterion7FacilitiesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Criterion 7 (Facilities)
    
    Endpoints:
    - GET    /api/criterion7/          - List all Criterion 7 records
    - POST   /api/criterion7/          - Create new Criterion 7 record
    - GET    /api/criterion7/{id}/     - Retrieve specific record
    - PUT    /api/criterion7/{id}/     - Update specific record
    - DELETE /api/criterion7/{id}/     - Delete specific record
    """
    queryset = Criterion7Facilities.objects.all()
    serializer_class = Criterion7FacilitiesSerializer
    
    @action(detail=True, methods=['get'])
    def classrooms(self, request, pk=None):
        """Get all classrooms for a specific Criterion 7 record"""
        criterion7 = self.get_object()
        classrooms = criterion7.classrooms.all()
        serializer = ClassroomsSerializer(classrooms, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def laboratories(self, request, pk=None):
        """Get all laboratories for a specific Criterion 7 record"""
        criterion7 = self.get_object()
        laboratories = criterion7.laboratories.all()
        serializer = LaboratoriesSerializer(laboratories, many=True)
        return Response(serializer.data)


class ClassroomsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Classrooms
    """
    queryset = Classrooms.objects.all()
    serializer_class = ClassroomsSerializer


class LaboratoriesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Laboratories
    """
    queryset = Laboratories.objects.all()
    serializer_class = LaboratoriesSerializer


class ComputingResourcesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Computing Resources
    """
    queryset = ComputingResources.objects.all()
    serializer_class = ComputingResourcesSerializer


class UpgradingFacilitiesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Upgrading Facilities
    """
    queryset = UpgradingFacilities.objects.all()
    serializer_class = UpgradingFacilitiesSerializer


# ============================================================================
# CRITERION 8 VIEWSETS
# ============================================================================

class Criterion8InstitutionalSupportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Criterion 8 (Institutional Support)
    
    Endpoints:
    - GET    /api/criterion8/          - List all Criterion 8 records
    - POST   /api/criterion8/          - Create new Criterion 8 record
    - GET    /api/criterion8/{id}/     - Retrieve specific record
    - PUT    /api/criterion8/{id}/     - Update specific record
    - DELETE /api/criterion8/{id}/     - Delete specific record
    """
    queryset = Criterion8InstitutionalSupport.objects.all()
    serializer_class = Criterion8InstitutionalSupportSerializer

    def _ensure_cycle(self):
        latest_cycle = AccreditationCycle.objects.order_by('-cycle_id').first()
        if latest_cycle:
            return latest_cycle

        program, _ = Program.objects.get_or_create(
            program_name='Default Program',
            defaults={'program_level': 'Undergraduate'}
        )
        checklist, _ = CycleChecklist.objects.get_or_create(
            title='Default Checklist',
            defaults={'status': 0}
        )
        criterion2 = Criterion2Peos.objects.order_by('-criterion2_id').first()
        if not criterion2:
            criterion2 = Criterion2Peos.objects.create(
                institutional_mission_statement='',
                program_mission_statement='',
                mission_source_link='',
                peos_list='',
                peos_short_descriptions='',
                peos_publication_location='',
                peos_mission_alignment_explanation='',
                constituencies_list='',
                constituencies_contribution_description='',
                peo_review_frequency='',
                peo_review_participants='',
                feedback_collection_and_decision_process='',
                changes_since_last_peo_review='',
            )
        criterion3 = Criterion3SoPeo.objects.order_by('-criterion3_id').first()
        if not criterion3:
            criterion3 = Criterion3SoPeo.objects.create()

        return AccreditationCycle.objects.create(
            start_year=2025,
            end_year=2027,
            overall_progress_percentage=0,
            program=program,
            checklist=checklist,
            criterion2=criterion2,
            criterion3=criterion3,
        )

    def _ensure_criterion8_item(self, cycle):
        criterion8_item = ChecklistItem.objects.filter(
            checklist=cycle.checklist,
            item_name__icontains='criterion 8'
        ).order_by('-item_id').first()
        if criterion8_item:
            return criterion8_item

        return ChecklistItem.objects.create(
            item_name='Criterion 8 - Institutional Support',
            status=0,
            completion_percentage=0,
            checklist=cycle.checklist,
        )

    def _inject_missing_cycle_item(self, request):
        data = request.data.copy()
        cycle_id = data.get('cycle')
        item_id = data.get('item')

        cycle = None
        if cycle_id in (None, '', 'null'):
            cycle = self._ensure_cycle()
            data['cycle'] = cycle.cycle_id
        else:
            try:
                cycle = AccreditationCycle.objects.get(pk=cycle_id)
            except AccreditationCycle.DoesNotExist:
                cycle = self._ensure_cycle()
                data['cycle'] = cycle.cycle_id

        if item_id in (None, '', 'null'):
            item = self._ensure_criterion8_item(cycle)
            data['item'] = item.item_id

        return data

    def create(self, request, *args, **kwargs):
        data = self._inject_missing_cycle_item(request)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._inject_missing_cycle_item(request)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def staffing(self, request, pk=None):
        """Get all staffing rows for a specific Criterion 8 record"""
        criterion8 = self.get_object()
        staffing = criterion8.staffing_rows.all()
        serializer = StaffingRowSerializer(staffing, many=True)
        return Response(serializer.data)


class StaffingRowViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Staffing Rows
    """
    queryset = StaffingRow.objects.all()
    serializer_class = StaffingRowSerializer


# ============================================================================
# SUPPORTING VIEWSETS
# ============================================================================

class EvidenceFileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Evidence Files
    """
    serializer_class = EvidenceFileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = EvidenceFile.objects.select_related('user', 'cycle', 'program').order_by('-uploaded_at', '-evidence_id')
        cycle_id = self.request.query_params.get('cycle_id')
        program_id = self.request.query_params.get('program_id')

        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        if program_id:
            queryset = queryset.filter(program_id=program_id)

        return queryset

    def create(self, request, *args, **kwargs):
        upload = request.FILES.get('file')
        cycle_id = request.data.get('cycle') or request.data.get('cycle_id')
        program_id = request.data.get('program') or request.data.get('program_id')

        if upload is None:
            return Response({'detail': 'A file is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not cycle_id:
            return Response({'detail': 'cycle_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not program_id:
            return Response({'detail': 'program_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cycle = AccreditationCycle.objects.filter(pk=cycle_id).first()
        if cycle is None:
            return Response({'detail': 'Cycle not found.'}, status=status.HTTP_404_NOT_FOUND)

        program = Program.objects.filter(pk=program_id).first()
        if program is None:
            return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = _get_request_user(request)
        if user is None:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        content = upload.read()
        last_modified_raw = request.data.get('last_modified')
        try:
            last_modified = int(last_modified_raw) if last_modified_raw not in (None, '') else None
        except (TypeError, ValueError):
            last_modified = None

        existing = EvidenceFile.objects.filter(
            cycle=cycle,
            program=program,
            file_name=upload.name,
            file_size=upload.size or len(content),
            last_modified=last_modified,
        ).order_by('-uploaded_at').first()
        if existing is not None:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        evidence = EvidenceFile.objects.create(
            file_name=upload.name,
            file_type=upload.content_type or 'application/octet-stream',
            upload_date=timezone.now().date(),
            cycle=cycle,
            program=program,
            user=user,
            uploaded_at=timezone.now(),
            file_size=upload.size or len(content),
            last_modified=last_modified,
            file_blob=content,
        )
        serializer = self.get_serializer(evidence)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        evidence = self.get_object()
        response = HttpResponse(bytes(evidence.file_blob), content_type=evidence.file_type or 'application/octet-stream')
        response['Content-Disposition'] = f'inline; filename="{evidence.file_name}"'
        response['Content-Length'] = evidence.file_size
        return response


class AccreditationCycleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Accreditation Cycles
    """
    queryset = AccreditationCycle.objects.all()
    serializer_class = AccreditationCycleSerializer


class ChecklistItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Checklist Items
    """
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer


class FacultyMemberViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Faculty Members
    """
    queryset = FacultyMember.objects.all()
    serializer_class = FacultyMemberSerializer


def _ensure_criterion6_for_cycle(cycle_id):
    criterion6 = Criterion6Faculty.objects.filter(cycle_id=cycle_id).order_by('-criterion6_id').first()
    if criterion6:
        return criterion6
    max_id = Criterion6Faculty.objects.aggregate(max_id=Max('criterion6_id')).get('max_id') or 0
    return Criterion6Faculty.objects.create(
        criterion6_id=int(max_id) + 1,
        faculty_composition_narrative='',
        faculty_worklaod_expectations_description='',
        workload_expectations_desciption='',
        faculty_size_adequacy_description='',
        advising_and_student_interaction_description='',
        service_and_industry_engagement_description='',
        course_creation_role_description='',
        peo_ro_role_description='',
        leadership_roles_description='',
        cycle_id=cycle_id,
    )


def _program_so_rows(program_id):
    return StudentOutcome.objects.filter(program_id=program_id).order_by('so_id')


def _extract_so_number(so_code):
    if not so_code:
        return 0
    matched = re.search(r'SO(\d+)', str(so_code).upper())
    if not matched:
        return 0
    try:
        return int(matched.group(1))
    except (TypeError, ValueError):
        return 0


def _serialize_so(row):
    number = _extract_so_number(row.so_code)
    display_code = f'SO{number}' if number > 0 else row.so_code
    return {
        'so_id': row.so_id,
        'so_code': row.so_code,
        'display_code': display_code,
        'so_discription': row.so_discription,
        'program_id': row.program_id,
    }


def _program_peo_rows(program_id):
    return Peo.objects.filter(program_id=program_id).order_by('peo_id')


def _extract_peo_number(peo_code):
    if not peo_code:
        return 0
    matched = re.search(r'PEO(\d+)', str(peo_code).upper())
    if not matched:
        return 0
    try:
        return int(matched.group(1))
    except (TypeError, ValueError):
        return 0


def _serialize_peo(row):
    number = _extract_peo_number(row.peo_code)
    display_code = f'PEO{number}' if number > 0 else row.peo_code
    return {
        'peo_id': row.peo_id,
        'peo_code': row.peo_code,
        'display_code': display_code,
        'peo_description': row.peo_description,
        'program_id': row.program_id,
    }


def _renumber_program_peos(program_id):
    rows = list(Peo.objects.filter(program_id=program_id).order_by('peo_id'))
    for index, row in enumerate(rows, start=1):
        next_code = f'P{program_id}-PEO{index}'
        if row.peo_code != next_code:
            row.peo_code = next_code
            row.save(update_fields=['peo_code'])


def _ensure_supports_peo_table():
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS SUPPORTS_PEO (
                so_id INTEGER NOT NULL,
                peo_id INTEGER NOT NULL,
                PRIMARY KEY (so_id, peo_id)
            )
            '''
        )
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_supports_peo_so ON SUPPORTS_PEO (so_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_supports_peo_peo ON SUPPORTS_PEO (peo_id)')


def _program_so_peo_mappings(program_id):
    _ensure_supports_peo_table()
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT sp.so_id, sp.peo_id
            FROM SUPPORTS_PEO sp
            INNER JOIN STUDENT_OUTCOME so ON so.so_id = sp.so_id
            INNER JOIN PEO peo ON peo.peo_id = sp.peo_id
            WHERE so.program_id = %s AND peo.program_id = %s
            ORDER BY sp.so_id, sp.peo_id
            ''',
            [program_id, program_id]
        )
        rows = cursor.fetchall()
    return [{'so_id': int(row[0]), 'peo_id': int(row[1])} for row in rows]


def _program_clo_rows(program_id):
    prefix = f'P{program_id}-CLO'
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT clo_id, description, level FROM CLO WHERE level LIKE %s ORDER BY clo_id',
            [f'{prefix}%']
        )
        rows = cursor.fetchall()
    return [
        {
            'clo_id': int(row[0]),
            'description': row[1] or '',
            'level': row[2] or '',
        }
        for row in rows
    ]


def _extract_clo_number(level_value):
    if not level_value:
        return 0
    matched = re.search(r'CLO(\d+)', str(level_value).upper())
    if not matched:
        return 0
    try:
        return int(matched.group(1))
    except (TypeError, ValueError):
        return 0


def _serialize_clo(row):
    number = _extract_clo_number(row.get('level'))
    display_code = f'CLO{number}' if number > 0 else f"CLO{row.get('clo_id')}"
    return {
        'clo_id': int(row.get('clo_id') or 0),
        'clo_code': row.get('level') or display_code,
        'display_code': display_code,
        'description': row.get('description') or '',
    }


def _renumber_program_clos(program_id):
    rows = _program_clo_rows(program_id)
    with connection.cursor() as cursor:
        for index, row in enumerate(rows, start=1):
            next_code = f'P{program_id}-CLO{index}'
            if (row.get('level') or '') != next_code:
                cursor.execute('UPDATE CLO SET level = %s WHERE clo_id = %s', [next_code, row.get('clo_id')])


def _next_pk(table_name, pk_column):
    with connection.cursor() as cursor:
        cursor.execute(f'SELECT COALESCE(MAX({pk_column}), 0) + 1 FROM {table_name}')
        return int(cursor.fetchone()[0] or 1)


def _resolve_program_cycle(program_id, request):
    cycle_id_raw = request.query_params.get('cycle_id') or request.data.get('cycle_id')
    if cycle_id_raw is None or f'{cycle_id_raw}'.strip() == '':
        return None, Response({'detail': 'cycle_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        cycle_id = int(cycle_id_raw)
    except (TypeError, ValueError):
        return None, Response({'detail': 'cycle_id must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
    cycle = AccreditationCycle.objects.filter(cycle_id=cycle_id, program_id=program_id).first()
    if not cycle:
        return None, Response({'detail': 'Cycle not found for this program.'}, status=status.HTTP_404_NOT_FOUND)
    return cycle, None


def _course_sections_rows(course_id):
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT s.syllabus_id, s.term, s.Faculty_ID, COALESCE(f.Full_Name, '')
            FROM INSTRUCTOR_SYLLABUS s
            LEFT JOIN FACULTY_MEMBER f ON f.Faculty_ID = s.Faculty_ID
            WHERE s.Course_ID = %s
            ORDER BY s.term, s.syllabus_id
            ''',
            [course_id]
        )
        rows = cursor.fetchall()
    return [
        {
            'id': int(row[0]),
            'syllabus_id': int(row[0]),
            'term': row[1] or '',
            'faculty_id': int(row[2]) if row[2] is not None else None,
            'faculty_name': row[3] or '',
        }
        for row in rows
    ]


def _serialize_course_row(row):
    course_id = int(row[0])
    return {
        'id': course_id,
        'course_id': course_id,
        'code': row[1] or '',
        'name': row[1] or '',
        'credits': int(row[2] or 0),
        'contact_hours': int(row[3] or 0),
        'course_type': row[4] or 'Required',
        'sections': _course_sections_rows(course_id),
    }


def _clean_string_list(items):
    if not isinstance(items, list):
        return []
    cleaned = []
    for value in items:
        text = f'{value}'.strip()
        if text:
            cleaned.append(text)
    return cleaned


def _ensure_syllabus_clo_so_map_table():
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS SYLLABUS_CLO_SO_MAP (
              map_id INTEGER PRIMARY KEY AUTOINCREMENT,
              syllabus_id INT NOT NULL,
              clo_id INT NOT NULL,
              so_id INT NOT NULL,
              UNIQUE (syllabus_id, clo_id, so_id)
            )
            '''
        )
        cursor.execute(
            'CREATE INDEX IF NOT EXISTS idx_syllabus_clo_so_map_syllabus ON SYLLABUS_CLO_SO_MAP (syllabus_id)'
        )
        cursor.execute(
            'CREATE INDEX IF NOT EXISTS idx_syllabus_clo_so_map_clo ON SYLLABUS_CLO_SO_MAP (clo_id)'
        )


def _delete_syllabus_children(syllabus_id):
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT description_id, outline_id, additional_info_id, unified_syllabus_id FROM INSTRUCTOR_SYLLABUS WHERE syllabus_id = %s',
            [syllabus_id]
        )
        section_row = cursor.fetchone()
        if not section_row:
            return

        description_id, outline_id, additional_info_id, unified_syllabus_id = section_row

        cursor.execute('DELETE FROM ASSESMENT WHERE syllabus_id = %s', [syllabus_id])
        cursor.execute('DELETE FROM SUPPLEMENT_MATERIAL WHERE syllabus_id = %s', [syllabus_id])
        cursor.execute('DELETE FROM TEXTBOOK WHERE syllabus_id = %s', [syllabus_id])
        cursor.execute('DELETE FROM PREREQUISITE WHERE syllabus_id = %s', [syllabus_id])
        cursor.execute('DELETE FROM COREQUISITE WHERE syllabus_id = %s', [syllabus_id])
        _ensure_syllabus_clo_so_map_table()
        cursor.execute('DELETE FROM SYLLABUS_CLO_SO_MAP WHERE syllabus_id = %s', [syllabus_id])
        cursor.execute('DELETE FROM HAS_CLO WHERE syllabus_id = %s', [syllabus_id])
        cursor.execute('DELETE FROM INSTRUCTOR_SYLLABUS WHERE syllabus_id = %s', [syllabus_id])

        cursor.execute('SELECT COUNT(*) FROM INSTRUCTOR_SYLLABUS WHERE description_id = %s', [description_id])
        if int(cursor.fetchone()[0] or 0) == 0:
            cursor.execute('DELETE FROM COURSE_DISCRIPTION WHERE description_id = %s', [description_id])

        cursor.execute('SELECT COUNT(*) FROM INSTRUCTOR_SYLLABUS WHERE outline_id = %s', [outline_id])
        if int(cursor.fetchone()[0] or 0) == 0:
            cursor.execute('DELETE FROM WEEKLY_TOPIC_OUTLINE WHERE outline_id = %s', [outline_id])

        cursor.execute('SELECT COUNT(*) FROM INSTRUCTOR_SYLLABUS WHERE additional_info_id = %s', [additional_info_id])
        if int(cursor.fetchone()[0] or 0) == 0:
            cursor.execute('DELETE FROM ADDITIONAL_INFORMATION WHERE additional_info_id = %s', [additional_info_id])

        cursor.execute('SELECT COUNT(*) FROM INSTRUCTOR_SYLLABUS WHERE unified_syllabus_id = %s', [unified_syllabus_id])
        section_count = int(cursor.fetchone()[0] or 0)
        cursor.execute('SELECT COUNT(*) FROM COURSE WHERE unified_syllabus_id = %s', [unified_syllabus_id])
        course_count = int(cursor.fetchone()[0] or 0)
        if section_count == 0 and course_count == 0:
            cursor.execute('DELETE FROM UNIFIED_SYLLABUS WHERE unified_syllabus_id = %s', [unified_syllabus_id])


@api_view(['GET', 'POST'])
def program_student_outcomes(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        rows = _program_so_rows(program_id)
        return Response([_serialize_so(row) for row in rows])

    description = f'{request.data.get("so_discription", "")}'.strip()
    if not description:
        return Response({'detail': 'SO description is required.'}, status=status.HTTP_400_BAD_REQUEST)

    rows = list(_program_so_rows(program_id))
    next_number = max([_extract_so_number(row.so_code) for row in rows], default=0) + 1
    next_so_id = (StudentOutcome.objects.aggregate(max_id=Max('so_id')).get('max_id') or 0) + 1
    stored_so_code = f'P{program_id}-SO{next_number}'

    so_row = StudentOutcome.objects.create(
        so_id=next_so_id,
        so_code=stored_so_code,
        so_discription=description,
        program_id=program_id,
    )
    return Response(_serialize_so(so_row), status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
def program_student_outcome_detail(request, program_id, so_id):
    try:
        so_row = StudentOutcome.objects.get(so_id=so_id, program_id=program_id)
    except StudentOutcome.DoesNotExist:
        return Response({'detail': 'Student outcome not found for this program.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        so_row.delete()
        return Response({'detail': 'Student outcome deleted successfully.'}, status=status.HTTP_200_OK)

    description = f'{request.data.get("so_discription", "")}'.strip()
    if not description:
        return Response({'detail': 'SO description is required.'}, status=status.HTTP_400_BAD_REQUEST)

    so_row.so_discription = description
    so_row.save(update_fields=['so_discription'])
    return Response(_serialize_so(so_row))


@api_view(['GET', 'PUT'])
def program_so_peo_mappings(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    so_rows = list(_program_so_rows(program_id))
    peo_rows = list(_program_peo_rows(program_id))

    if request.method == 'GET':
        return Response({
            'student_outcomes': [_serialize_so(row) for row in so_rows],
            'peos': [_serialize_peo(row) for row in peo_rows],
            'mappings': _program_so_peo_mappings(program_id),
        })

    mappings_payload = request.data.get('mappings')
    if not isinstance(mappings_payload, list):
        return Response({'detail': 'mappings must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    valid_so_ids = {int(row.so_id) for row in so_rows}
    valid_peo_ids = {int(row.peo_id) for row in peo_rows}
    deduped_pairs = []
    seen_pairs = set()

    for row in mappings_payload:
        if not isinstance(row, dict):
            return Response({'detail': 'Each mapping must be an object.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            so_id = int(row.get('so_id'))
            peo_id = int(row.get('peo_id'))
        except (TypeError, ValueError):
            return Response({'detail': 'Each mapping must include numeric so_id and peo_id.'}, status=status.HTTP_400_BAD_REQUEST)

        if so_id not in valid_so_ids:
            return Response({'detail': f'SO {so_id} does not belong to this program.'}, status=status.HTTP_400_BAD_REQUEST)
        if peo_id not in valid_peo_ids:
            return Response({'detail': f'PEO {peo_id} does not belong to this program.'}, status=status.HTTP_400_BAD_REQUEST)

        pair = (so_id, peo_id)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        deduped_pairs.append(pair)

    with transaction.atomic():
        _ensure_supports_peo_table()
        with connection.cursor() as cursor:
            if valid_so_ids:
                so_id_values = sorted(valid_so_ids)
                placeholders = ', '.join(['%s'] * len(so_id_values))
                cursor.execute(f'DELETE FROM SUPPORTS_PEO WHERE so_id IN ({placeholders})', so_id_values)

            for so_id, peo_id in deduped_pairs:
                cursor.execute('INSERT INTO SUPPORTS_PEO (so_id, peo_id) VALUES (%s, %s)', [so_id, peo_id])

    return Response({
        'detail': 'SO-PEO mappings saved successfully.',
        'student_outcomes': [_serialize_so(row) for row in so_rows],
        'peos': [_serialize_peo(row) for row in peo_rows],
        'mappings': _program_so_peo_mappings(program_id),
    })


@api_view(['GET'])
def program_so_course_links(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle, cycle_error = _resolve_program_cycle(program_id, request)
    if cycle_error:
        return cycle_error

    so_payload = []
    so_lookup = {}
    for so_row in _program_so_rows(program_id):
        serialized = _serialize_so(so_row)
        serialized.update({
            'linked_courses': [],
            'linked_clos': [],
            'course_clos': [],
            '_course_map': {},
            '_clo_map': {},
        })
        so_lookup[int(serialized['so_id'])] = serialized
        so_payload.append(serialized)

    _ensure_syllabus_clo_so_map_table()
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT
              m.so_id,
              c.Course_ID,
              COALESCE(c.Course_Code, ''),
              m.clo_id,
              COALESCE(clo.description, ''),
              COALESCE(clo.level, '')
            FROM SYLLABUS_CLO_SO_MAP m
            INNER JOIN STUDENT_OUTCOME so ON so.so_id = m.so_id
            INNER JOIN INSTRUCTOR_SYLLABUS s ON s.syllabus_id = m.syllabus_id
            INNER JOIN COURSE c ON c.Course_ID = s.Course_ID
            LEFT JOIN CLO clo ON clo.clo_id = m.clo_id
            WHERE so.program_id = %s AND c.Cycle_ID = %s
            ORDER BY m.so_id, c.Course_Code, m.clo_id
            ''',
            [program_id, cycle.cycle_id]
        )
        rows = cursor.fetchall()

    for row in rows:
        so_id = int(row[0])
        course_id = int(row[1])
        course_code = f'{row[2] or ""}'.strip() or f'Course {course_id}'
        clo_id = int(row[3]) if row[3] is not None else None
        clo_description = f'{row[4] or ""}'.strip()
        clo_level = f'{row[5] or ""}'.strip()

        so_entry = so_lookup.get(so_id)
        if not so_entry:
            continue

        if course_id not in so_entry['_course_map']:
            so_entry['_course_map'][course_id] = {
                'course_id': course_id,
                'course_code': course_code,
                'clos': {},
            }
        course_entry = so_entry['_course_map'][course_id]

        if clo_id is not None:
            clo_serialized = _serialize_clo({
                'clo_id': clo_id,
                'description': clo_description,
                'level': clo_level,
            })
            clo_entry = {
                'clo_id': int(clo_serialized['clo_id']),
                'display_code': clo_serialized['display_code'],
                'description': clo_serialized['description'],
            }
            course_entry['clos'][clo_id] = clo_entry
            so_entry['_clo_map'][clo_id] = clo_entry

    for so_entry in so_payload:
        course_clos = []
        for course_entry in so_entry['_course_map'].values():
            clos = sorted(
                list(course_entry['clos'].values()),
                key=lambda item: item.get('display_code', '')
            )
            course_clos.append({
                'course_id': int(course_entry['course_id']),
                'course_code': course_entry['course_code'],
                'clos': clos,
            })
        course_clos.sort(key=lambda item: item.get('course_code', ''))

        linked_clos = sorted(
            list(so_entry['_clo_map'].values()),
            key=lambda item: item.get('display_code', '')
        )

        so_entry['course_clos'] = course_clos
        so_entry['linked_courses'] = [item['course_code'] for item in course_clos]
        so_entry['linked_clos'] = linked_clos
        del so_entry['_course_map']
        del so_entry['_clo_map']

    return Response({'student_outcomes': so_payload})


@api_view(['GET', 'POST'])
def program_peos(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        rows = _program_peo_rows(program_id)
        return Response([_serialize_peo(row) for row in rows])

    description = f'{request.data.get("peo_description", "")}'.strip()
    if not description:
        return Response({'detail': 'PEO description is required.'}, status=status.HTTP_400_BAD_REQUEST)

    rows = list(_program_peo_rows(program_id))
    next_number = max([_extract_peo_number(row.peo_code) for row in rows], default=0) + 1
    next_peo_id = (Peo.objects.aggregate(max_id=Max('peo_id')).get('max_id') or 0) + 1
    stored_peo_code = f'P{program_id}-PEO{next_number}'

    peo_row = Peo.objects.create(
        peo_id=next_peo_id,
        peo_code=stored_peo_code,
        peo_description=description,
        program_id=program_id,
    )
    _renumber_program_peos(program_id)
    peo_row.refresh_from_db()
    return Response(_serialize_peo(peo_row), status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
def program_peo_detail(request, program_id, peo_id):
    try:
        peo_row = Peo.objects.get(peo_id=peo_id, program_id=program_id)
    except Peo.DoesNotExist:
        return Response({'detail': 'PEO not found for this program.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        peo_row.delete()
        _renumber_program_peos(program_id)
        return Response({'detail': 'PEO deleted successfully.'}, status=status.HTTP_200_OK)

    description = f'{request.data.get("peo_description", "")}'.strip()
    if not description:
        return Response({'detail': 'PEO description is required.'}, status=status.HTTP_400_BAD_REQUEST)

    peo_row.peo_description = description
    peo_row.save(update_fields=['peo_description'])
    return Response(_serialize_peo(peo_row))


@api_view(['GET', 'POST'])
def program_clos(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        rows = _program_clo_rows(program_id)
        return Response([_serialize_clo(row) for row in rows])

    description = f'{request.data.get("description", "")}'.strip()
    if not description:
        return Response({'detail': 'CLO description is required.'}, status=status.HTTP_400_BAD_REQUEST)

    existing_rows = _program_clo_rows(program_id)
    next_number = max([_extract_clo_number(row.get('level')) for row in existing_rows], default=0) + 1
    next_clo_id = _next_pk('CLO', 'clo_id')
    stored_code = f'P{program_id}-CLO{next_number}'

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                'INSERT INTO CLO (clo_id, description, level) VALUES (%s, %s, %s)',
                [next_clo_id, description, stored_code]
            )
            _renumber_program_clos(program_id)

    refreshed_row = next((item for item in _program_clo_rows(program_id) if int(item.get('clo_id') or 0) == next_clo_id), None)
    return Response(
        _serialize_clo(refreshed_row or {'clo_id': next_clo_id, 'description': description, 'level': stored_code}),
        status=status.HTTP_201_CREATED
    )


@api_view(['PUT', 'DELETE'])
def program_clo_detail(request, program_id, clo_id):
    row = None
    for item in _program_clo_rows(program_id):
        if int(item.get('clo_id') or 0) == int(clo_id):
            row = item
            break
    if row is None:
        return Response({'detail': 'CLO not found for this program.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        with transaction.atomic():
            with connection.cursor() as cursor:
                _ensure_syllabus_clo_so_map_table()
                cursor.execute('DELETE FROM SYLLABUS_CLO_SO_MAP WHERE clo_id = %s', [clo_id])
                cursor.execute('DELETE FROM HAS_CLO WHERE clo_id = %s', [clo_id])
                cursor.execute('DELETE FROM MAPS_TO WHERE clo_id = %s', [clo_id])
                cursor.execute('DELETE FROM CLO WHERE clo_id = %s', [clo_id])
                _renumber_program_clos(program_id)
        return Response({'detail': 'CLO deleted successfully.'}, status=status.HTTP_200_OK)

    description = f'{request.data.get("description", "")}'.strip()
    if not description:
        return Response({'detail': 'CLO description is required.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute('UPDATE CLO SET description = %s WHERE clo_id = %s', [description, clo_id])

    return Response(_serialize_clo({'clo_id': clo_id, 'description': description, 'level': row.get('level')}))


@api_view(['GET', 'POST'])
def program_courses(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle, cycle_error = _resolve_program_cycle(program_id, request)
    if cycle_error:
        return cycle_error

    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                SELECT Course_ID, Course_Code, Credits, Contact_Hours, Course_Type
                FROM COURSE
                WHERE Cycle_ID = %s
                ORDER BY Course_Code, Course_ID
                ''',
                [cycle.cycle_id]
            )
            rows = cursor.fetchall()
        return Response([_serialize_course_row(row) for row in rows])

    course_code = f'{request.data.get("course_code", "")}'.strip().upper()
    if not course_code:
        return Response({'detail': 'Course code is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        credits = int(request.data.get('credits') or 0)
        contact_hours = int(request.data.get('contact_hours') or 0)
    except (TypeError, ValueError):
        return Response({'detail': 'credits and contact_hours must be integers.'}, status=status.HTTP_400_BAD_REQUEST)
    if credits < 0 or contact_hours < 0:
        return Response({'detail': 'credits and contact_hours must be zero or greater.'}, status=status.HTTP_400_BAD_REQUEST)
    course_type = f'{request.data.get("course_type", "Required")}'.strip() or 'Required'

    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT 1 FROM COURSE WHERE Cycle_ID = %s AND UPPER(TRIM(Course_Code)) = %s',
            [cycle.cycle_id, course_code]
        )
        if cursor.fetchone():
            return Response({'detail': 'A course with this code already exists in this cycle.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        unified_id = _next_pk('UNIFIED_SYLLABUS', 'unified_syllabus_id')
        course_id = _next_pk('COURSE', 'Course_ID')
        with connection.cursor() as cursor:
            cursor.execute(
                'INSERT INTO UNIFIED_SYLLABUS (unified_syllabus_id, status) VALUES (%s, %s)',
                [unified_id, 0]
            )
            cursor.execute(
                '''
                INSERT INTO COURSE
                (Course_ID, Course_Code, Credits, Contact_Hours, Course_Type, Cycle_ID, unified_syllabus_id, curr_course_row_id, criterion5_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''',
                [course_id, course_code, credits, contact_hours, course_type, cycle.cycle_id, unified_id, None, None]
            )

    return Response(
        {
            'id': course_id,
            'course_id': course_id,
            'code': course_code,
            'name': course_code,
            'credits': credits,
            'contact_hours': contact_hours,
            'course_type': course_type,
            'sections': [],
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['PUT', 'DELETE'])
def program_course_detail(request, program_id, course_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle, cycle_error = _resolve_program_cycle(program_id, request)
    if cycle_error:
        return cycle_error

    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT Course_ID, Course_Code, Credits, Contact_Hours, Course_Type, unified_syllabus_id
            FROM COURSE
            WHERE Course_ID = %s AND Cycle_ID = %s
            ''',
            [course_id, cycle.cycle_id]
        )
        course_row = cursor.fetchone()
    if not course_row:
        return Response({'detail': 'Course not found in this cycle.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute('SELECT syllabus_id FROM INSTRUCTOR_SYLLABUS WHERE Course_ID = %s', [course_id])
                syllabus_ids = [int(row[0]) for row in cursor.fetchall()]

            for syllabus_row_id in syllabus_ids:
                _delete_syllabus_children(syllabus_row_id)

            with connection.cursor() as cursor:
                cursor.execute('DELETE FROM TEACHES WHERE Course_ID = %s', [course_id])
                cursor.execute('DELETE FROM COURSE WHERE Course_ID = %s', [course_id])
                unified_id = int(course_row[5])
                cursor.execute('SELECT COUNT(*) FROM COURSE WHERE unified_syllabus_id = %s', [unified_id])
                course_count = int(cursor.fetchone()[0] or 0)
                cursor.execute('SELECT COUNT(*) FROM INSTRUCTOR_SYLLABUS WHERE unified_syllabus_id = %s', [unified_id])
                section_count = int(cursor.fetchone()[0] or 0)
                if course_count == 0 and section_count == 0:
                    cursor.execute('DELETE FROM UNIFIED_SYLLABUS WHERE unified_syllabus_id = %s', [unified_id])
        return Response({'detail': 'Course deleted successfully.'}, status=status.HTTP_200_OK)

    next_code = f'{request.data.get("course_code", course_row[1])}'.strip().upper()
    if not next_code:
        return Response({'detail': 'Course code is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        next_credits = int(request.data.get('credits', course_row[2]) or 0)
        next_contact_hours = int(request.data.get('contact_hours', course_row[3]) or 0)
    except (TypeError, ValueError):
        return Response({'detail': 'credits and contact_hours must be integers.'}, status=status.HTTP_400_BAD_REQUEST)
    if next_credits < 0 or next_contact_hours < 0:
        return Response({'detail': 'credits and contact_hours must be zero or greater.'}, status=status.HTTP_400_BAD_REQUEST)
    next_type = f'{request.data.get("course_type", course_row[4])}'.strip() or 'Required'

    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT 1 FROM COURSE
            WHERE Cycle_ID = %s AND Course_ID <> %s AND UPPER(TRIM(Course_Code)) = %s
            ''',
            [cycle.cycle_id, course_id, next_code]
        )
        if cursor.fetchone():
            return Response({'detail': 'A course with this code already exists in this cycle.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                UPDATE COURSE
                SET Course_Code = %s, Credits = %s, Contact_Hours = %s, Course_Type = %s
                WHERE Course_ID = %s
                ''',
                [next_code, next_credits, next_contact_hours, next_type, course_id]
            )

    return Response(
        {
            'id': int(course_id),
            'course_id': int(course_id),
            'code': next_code,
            'name': next_code,
            'credits': next_credits,
            'contact_hours': next_contact_hours,
            'course_type': next_type,
            'sections': _course_sections_rows(course_id),
        }
    )


@api_view(['GET', 'POST'])
def program_course_sections(request, program_id, course_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle, cycle_error = _resolve_program_cycle(program_id, request)
    if cycle_error:
        return cycle_error

    with connection.cursor() as cursor:
        cursor.execute('SELECT Course_ID, unified_syllabus_id FROM COURSE WHERE Course_ID = %s AND Cycle_ID = %s', [course_id, cycle.cycle_id])
        course_row = cursor.fetchone()
    if not course_row:
        return Response({'detail': 'Course not found in this cycle.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(_course_sections_rows(course_id))

    term = f'{request.data.get("term", "")}'.strip()
    faculty_id_raw = request.data.get('faculty_id')
    if not term:
        return Response({'detail': 'Term is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        faculty_id = int(faculty_id_raw)
    except (TypeError, ValueError):
        return Response({'detail': 'faculty_id is required and must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute('SELECT 1 FROM FACULTY_MEMBER WHERE Faculty_ID = %s', [faculty_id])
        if not cursor.fetchone():
            return Response({'detail': 'Faculty member not found.'}, status=status.HTTP_404_NOT_FOUND)
        cursor.execute('SELECT 1 FROM ASSIGNED_TO WHERE program_id = %s AND Faculty_ID = %s', [program_id, faculty_id])
        if not cursor.fetchone():
            return Response({'detail': 'Faculty member is not assigned to this program.'}, status=status.HTTP_400_BAD_REQUEST)
        cursor.execute(
            '''
            SELECT 1 FROM INSTRUCTOR_SYLLABUS
            WHERE Course_ID = %s AND Faculty_ID = %s
            ''',
            [course_id, faculty_id]
        )
        if cursor.fetchone():
            return Response({'detail': 'This faculty member already has a syllabus section for this course.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        description_id = _next_pk('COURSE_DISCRIPTION', 'description_id')
        outline_id = _next_pk('WEEKLY_TOPIC_OUTLINE', 'outline_id')
        additional_info_id = _next_pk('ADDITIONAL_INFORMATION', 'additional_info_id')
        syllabus_row_id = _next_pk('INSTRUCTOR_SYLLABUS', 'syllabus_id')
        unified_id = int(course_row[1])

        with connection.cursor() as cursor:
            cursor.execute(
                'INSERT INTO COURSE_DISCRIPTION (description_id, catalog_description) VALUES (%s, %s)',
                [description_id, '']
            )
            cursor.execute(
                'INSERT INTO WEEKLY_TOPIC_OUTLINE (outline_id, topics_description) VALUES (%s, %s)',
                [outline_id, '']
            )
            cursor.execute(
                'INSERT INTO ADDITIONAL_INFORMATION (additional_info_id, design_content_percentage, software_or_labs_tools_used) VALUES (%s, %s, %s)',
                [additional_info_id, 0, '']
            )
            cursor.execute(
                '''
                INSERT INTO INSTRUCTOR_SYLLABUS
                (syllabus_id, term, syllabus_status, Faculty_ID, Course_ID, description_id, outline_id, additional_info_id, unified_syllabus_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''',
                [syllabus_row_id, term, 0, faculty_id, course_id, description_id, outline_id, additional_info_id, unified_id]
            )
            cursor.execute('SELECT 1 FROM TEACHES WHERE Faculty_ID = %s AND Course_ID = %s', [faculty_id, course_id])
            if not cursor.fetchone():
                cursor.execute('INSERT INTO TEACHES (Faculty_ID, Course_ID) VALUES (%s, %s)', [faculty_id, course_id])
            cursor.execute('SELECT COALESCE(Full_Name, \'\') FROM FACULTY_MEMBER WHERE Faculty_ID = %s', [faculty_id])
            faculty_name = (cursor.fetchone() or [''])[0]

    return Response(
        {
            'id': syllabus_row_id,
            'syllabus_id': syllabus_row_id,
            'term': term,
            'faculty_id': faculty_id,
            'faculty_name': faculty_name,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['PUT', 'DELETE'])
def program_course_section_detail(request, program_id, course_id, syllabus_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle, cycle_error = _resolve_program_cycle(program_id, request)
    if cycle_error:
        return cycle_error

    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT s.syllabus_id, s.term, s.Faculty_ID
            FROM INSTRUCTOR_SYLLABUS s
            JOIN COURSE c ON c.Course_ID = s.Course_ID
            WHERE s.syllabus_id = %s AND s.Course_ID = %s AND c.Cycle_ID = %s
            ''',
            [syllabus_id, course_id, cycle.cycle_id]
        )
        section_row = cursor.fetchone()
    if not section_row:
        return Response({'detail': 'Section not found for this course and cycle.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        with transaction.atomic():
            _delete_syllabus_children(syllabus_id)
        return Response({'detail': 'Section deleted successfully.'}, status=status.HTTP_200_OK)

    term = f'{request.data.get("term", section_row[1])}'.strip()
    if not term:
        return Response({'detail': 'Term is required.'}, status=status.HTTP_400_BAD_REQUEST)
    faculty_id_raw = request.data.get('faculty_id', section_row[2])
    try:
        faculty_id = int(faculty_id_raw)
    except (TypeError, ValueError):
        return Response({'detail': 'faculty_id must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute('SELECT 1 FROM FACULTY_MEMBER WHERE Faculty_ID = %s', [faculty_id])
        if not cursor.fetchone():
            return Response({'detail': 'Faculty member not found.'}, status=status.HTTP_404_NOT_FOUND)
        cursor.execute('SELECT 1 FROM ASSIGNED_TO WHERE program_id = %s AND Faculty_ID = %s', [program_id, faculty_id])
        if not cursor.fetchone():
            return Response({'detail': 'Faculty member is not assigned to this program.'}, status=status.HTTP_400_BAD_REQUEST)
        cursor.execute(
            '''
            SELECT 1 FROM INSTRUCTOR_SYLLABUS
            WHERE Course_ID = %s AND syllabus_id <> %s AND Faculty_ID = %s
            ''',
            [course_id, syllabus_id, faculty_id]
        )
        if cursor.fetchone():
            return Response({'detail': 'This faculty member already has a syllabus section for this course.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                'UPDATE INSTRUCTOR_SYLLABUS SET term = %s, Faculty_ID = %s WHERE syllabus_id = %s',
                [term, faculty_id, syllabus_id]
            )
            cursor.execute('SELECT 1 FROM TEACHES WHERE Faculty_ID = %s AND Course_ID = %s', [faculty_id, course_id])
            if not cursor.fetchone():
                cursor.execute('INSERT INTO TEACHES (Faculty_ID, Course_ID) VALUES (%s, %s)', [faculty_id, course_id])
            cursor.execute('SELECT COALESCE(Full_Name, \'\') FROM FACULTY_MEMBER WHERE Faculty_ID = %s', [faculty_id])
            faculty_name = (cursor.fetchone() or [''])[0]

    return Response(
        {
            'id': int(syllabus_id),
            'syllabus_id': int(syllabus_id),
            'term': term,
            'faculty_id': faculty_id,
            'faculty_name': faculty_name,
        }
    )


def _load_syllabus_payload(program_id, cycle_id, course_id, syllabus_id):
    with connection.cursor() as cursor:
        cursor.execute(
            '''
            SELECT
              s.syllabus_id,
              s.term,
              s.Faculty_ID,
              COALESCE(f.Full_Name, ''),
              s.description_id,
              s.outline_id,
              s.additional_info_id,
              c.Course_ID,
              c.Course_Code,
              c.Credits,
              c.Contact_Hours,
              c.Course_Type
            FROM INSTRUCTOR_SYLLABUS s
            JOIN COURSE c ON c.Course_ID = s.Course_ID
            LEFT JOIN FACULTY_MEMBER f ON f.Faculty_ID = s.Faculty_ID
            WHERE s.syllabus_id = %s AND s.Course_ID = %s AND c.Cycle_ID = %s
            ''',
            [syllabus_id, course_id, cycle_id]
        )
        row = cursor.fetchone()
        if not row:
            return None

        desc_id = int(row[4])
        outline_id = int(row[5])
        addl_id = int(row[6])

        cursor.execute('SELECT catalog_description FROM COURSE_DISCRIPTION WHERE description_id = %s', [desc_id])
        catalog_description = (cursor.fetchone() or [''])[0] or ''
        cursor.execute('SELECT topics_description FROM WEEKLY_TOPIC_OUTLINE WHERE outline_id = %s', [outline_id])
        weekly_topics = (cursor.fetchone() or [''])[0] or ''
        cursor.execute(
            'SELECT design_content_percentage, software_or_labs_tools_used FROM ADDITIONAL_INFORMATION WHERE additional_info_id = %s',
            [addl_id]
        )
        addl_row = cursor.fetchone() or [0, '']
        design_content_percentage = float(addl_row[0] or 0)
        software_tools = addl_row[1] or ''

        cursor.execute('SELECT textbook_id, title_author_year, Attribute FROM TEXTBOOK WHERE syllabus_id = %s ORDER BY textbook_id', [syllabus_id])
        textbooks = [
            {'id': int(item[0]), 'title_author_year': item[1] or '', 'attribute': item[2] or ''}
            for item in cursor.fetchall()
        ]

        cursor.execute('SELECT material_id, material_discription FROM SUPPLEMENT_MATERIAL WHERE syllabus_id = %s ORDER BY material_id', [syllabus_id])
        supplements = [
            {'id': int(item[0]), 'material_discription': item[1] or ''}
            for item in cursor.fetchall()
        ]

        cursor.execute('SELECT prerequisite_id, course_code FROM PREREQUISITE WHERE syllabus_id = %s ORDER BY prerequisite_id', [syllabus_id])
        prerequisites = [
            {'id': int(item[0]), 'course_code': item[1] or ''}
            for item in cursor.fetchall()
        ]

        cursor.execute('SELECT corequisite_id, course_code FROM COREQUISITE WHERE syllabus_id = %s ORDER BY corequisite_id', [syllabus_id])
        corequisites = [
            {'id': int(item[0]), 'course_code': item[1] or ''}
            for item in cursor.fetchall()
        ]

        cursor.execute('SELECT assessment_id, assesment_type, weight_percentage FROM ASSESMENT WHERE syllabus_id = %s ORDER BY assessment_id', [syllabus_id])
        assessments = [
            {'id': int(item[0]), 'assessment_type': item[1] or '', 'weight_percentage': float(item[2] or 0)}
            for item in cursor.fetchall()
        ]

        cursor.execute('SELECT clo_id FROM HAS_CLO WHERE syllabus_id = %s ORDER BY clo_id', [syllabus_id])
        clo_ids = [int(item[0]) for item in cursor.fetchall()]

        _ensure_syllabus_clo_so_map_table()
        cursor.execute(
            'SELECT clo_id, so_id FROM SYLLABUS_CLO_SO_MAP WHERE syllabus_id = %s ORDER BY clo_id, so_id',
            [syllabus_id]
        )
        saved_pairs = [(int(item[0]), int(item[1])) for item in cursor.fetchall()]

        clo_mappings = []
        if saved_pairs:
            mapping_by_clo = {}
            for clo_id, so_id in saved_pairs:
                mapping_by_clo.setdefault(clo_id, set()).add(so_id)
            for clo_id in clo_ids:
                so_ids = sorted(mapping_by_clo.get(clo_id, set()))
                if so_ids:
                    for so_id in so_ids:
                        clo_mappings.append({'clo_id': clo_id, 'so_id': so_id})
                else:
                    clo_mappings.append({'clo_id': clo_id, 'so_id': None})
        else:
            # Backward-compatibility for legacy data saved before SYLLABUS_CLO_SO_MAP.
            for clo_id in clo_ids:
                cursor.execute('SELECT so_id FROM MAPS_TO WHERE clo_id = %s ORDER BY so_id', [clo_id])
                so_rows = [int(item[0]) for item in cursor.fetchall()]
                if so_rows:
                    for so_id in so_rows:
                        clo_mappings.append({'clo_id': clo_id, 'so_id': so_id})
                else:
                    clo_mappings.append({'clo_id': clo_id, 'so_id': None})

        cursor.execute(
            '''
            SELECT f.Faculty_ID, COALESCE(f.Full_Name, '')
            FROM ASSIGNED_TO a
            JOIN FACULTY_MEMBER f ON f.Faculty_ID = a.Faculty_ID
            WHERE a.program_id = %s
            ORDER BY f.Full_Name
            ''',
            [program_id]
        )
        faculty_options = [
            {'faculty_id': int(item[0]), 'full_name': item[1] or ''}
            for item in cursor.fetchall()
        ]

    return {
        'course': {
            'course_id': int(row[7]),
            'course_code': row[8] or '',
            'credits': int(row[9] or 0),
            'contact_hours': int(row[10] or 0),
            'course_type': row[11] or 'Required',
        },
        'section': {
            'syllabus_id': int(row[0]),
            'term': row[1] or '',
            'faculty_id': int(row[2]) if row[2] is not None else None,
            'faculty_name': row[3] or '',
        },
        'syllabus': {
            'catalog_description': catalog_description,
            'weekly_topics': weekly_topics,
            'design_content_percentage': design_content_percentage,
            'software_or_labs_tools_used': software_tools,
            'textbooks': textbooks,
            'supplements': supplements,
            'prerequisites': prerequisites,
            'corequisites': corequisites,
            'assessments': assessments,
            'clo_mappings': clo_mappings,
        },
        'available_sos': [_serialize_so(item) for item in _program_so_rows(program_id)],
        'available_clos': [_serialize_clo(item) for item in _program_clo_rows(program_id)],
        'faculty_options': faculty_options,
    }


@api_view(['GET', 'PUT'])
def program_syllabus_detail(request, program_id, course_id, syllabus_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle, cycle_error = _resolve_program_cycle(program_id, request)
    if cycle_error:
        return cycle_error

    payload = _load_syllabus_payload(program_id, cycle.cycle_id, course_id, syllabus_id)
    if payload is None:
        return Response({'detail': 'Syllabus section not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(payload)

    course_payload = request.data.get('course') if isinstance(request.data.get('course'), dict) else {}
    section_payload = request.data.get('section') if isinstance(request.data.get('section'), dict) else {}
    syllabus_payload = request.data.get('syllabus') if isinstance(request.data.get('syllabus'), dict) else {}

    next_code = f'{course_payload.get("course_code", payload["course"]["course_code"])}'.strip().upper()
    if not next_code:
        return Response({'detail': 'Course code is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        next_credits = int(course_payload.get('credits', payload['course']['credits']) or 0)
        next_contact_hours = int(course_payload.get('contact_hours', payload['course']['contact_hours']) or 0)
    except (TypeError, ValueError):
        return Response({'detail': 'credits and contact_hours must be integers.'}, status=status.HTTP_400_BAD_REQUEST)
    if next_credits < 0 or next_contact_hours < 0:
        return Response({'detail': 'credits and contact_hours must be zero or greater.'}, status=status.HTTP_400_BAD_REQUEST)
    next_type = f'{course_payload.get("course_type", payload["course"]["course_type"])}'.strip() or 'Required'

    next_term = f'{section_payload.get("term", payload["section"]["term"])}'.strip()
    if not next_term:
        return Response({'detail': 'Term is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        next_faculty_id = int(section_payload.get('faculty_id', payload['section']['faculty_id']))
    except (TypeError, ValueError):
        return Response({'detail': 'faculty_id must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute('SELECT 1 FROM FACULTY_MEMBER WHERE Faculty_ID = %s', [next_faculty_id])
        if not cursor.fetchone():
            return Response({'detail': 'Faculty member not found.'}, status=status.HTTP_404_NOT_FOUND)
        cursor.execute('SELECT 1 FROM ASSIGNED_TO WHERE program_id = %s AND Faculty_ID = %s', [program_id, next_faculty_id])
        if not cursor.fetchone():
            return Response({'detail': 'Faculty member is not assigned to this program.'}, status=status.HTTP_400_BAD_REQUEST)
        cursor.execute(
            '''
            SELECT 1 FROM COURSE
            WHERE Cycle_ID = %s AND Course_ID <> %s AND UPPER(TRIM(Course_Code)) = %s
            ''',
            [cycle.cycle_id, course_id, next_code]
        )
        if cursor.fetchone():
            return Response({'detail': 'Another course in this cycle already uses this code.'}, status=status.HTTP_400_BAD_REQUEST)
        cursor.execute(
            '''
            SELECT 1 FROM INSTRUCTOR_SYLLABUS
            WHERE Course_ID = %s AND syllabus_id <> %s AND Faculty_ID = %s
            ''',
            [course_id, syllabus_id, next_faculty_id]
        )
        if cursor.fetchone():
            return Response({'detail': 'This faculty member already has a syllabus section for this course.'}, status=status.HTTP_400_BAD_REQUEST)

    catalog_description = f'{syllabus_payload.get("catalog_description", "")}'
    weekly_topics = f'{syllabus_payload.get("weekly_topics", "")}'
    try:
        design_content = float(syllabus_payload.get('design_content_percentage', 0) or 0)
    except (TypeError, ValueError):
        return Response({'detail': 'design_content_percentage must be numeric.'}, status=status.HTTP_400_BAD_REQUEST)
    if design_content < 0:
        design_content = 0
    if design_content > 100:
        design_content = 100
    software_tools = f'{syllabus_payload.get("software_or_labs_tools_used", "")}'

    textbooks = syllabus_payload.get('textbooks') if isinstance(syllabus_payload.get('textbooks'), list) else []
    supplements = syllabus_payload.get('supplements') if isinstance(syllabus_payload.get('supplements'), list) else []
    prerequisites = syllabus_payload.get('prerequisites') if isinstance(syllabus_payload.get('prerequisites'), list) else []
    corequisites = syllabus_payload.get('corequisites') if isinstance(syllabus_payload.get('corequisites'), list) else []
    assessments = syllabus_payload.get('assessments') if isinstance(syllabus_payload.get('assessments'), list) else []
    clo_mappings = syllabus_payload.get('clo_mappings') if isinstance(syllabus_payload.get('clo_mappings'), list) else []

    clo_lookup = {int(item['clo_id']): item for item in _program_clo_rows(program_id)}
    so_lookup = {int(item.so_id): item for item in _program_so_rows(program_id)}
    normalized_clo_mappings = []
    for row in clo_mappings:
        try:
            clo_id = int(row.get('clo_id'))
        except (TypeError, ValueError):
            continue
        if clo_id not in clo_lookup:
            continue
        so_id = None
        so_id_raw = row.get('so_id')
        if so_id_raw not in (None, '', 'null'):
            try:
                parsed_so = int(so_id_raw)
                if parsed_so in so_lookup:
                    so_id = parsed_so
            except (TypeError, ValueError):
                so_id = None
        normalized_clo_mappings.append({'clo_id': clo_id, 'so_id': so_id})

    deduped_clo_mappings = []
    seen_mapping_pairs = set()
    for row in normalized_clo_mappings:
        clo_id = int(row['clo_id'])
        so_id = row.get('so_id')
        pair_key = (clo_id, int(so_id) if so_id is not None else None)
        if pair_key in seen_mapping_pairs:
            continue
        seen_mapping_pairs.add(pair_key)
        deduped_clo_mappings.append({'clo_id': clo_id, 'so_id': so_id})

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                'UPDATE COURSE SET Course_Code = %s, Credits = %s, Contact_Hours = %s, Course_Type = %s WHERE Course_ID = %s',
                [next_code, next_credits, next_contact_hours, next_type, course_id]
            )
            cursor.execute(
                'UPDATE INSTRUCTOR_SYLLABUS SET term = %s, Faculty_ID = %s WHERE syllabus_id = %s',
                [next_term, next_faculty_id, syllabus_id]
            )
            cursor.execute('SELECT 1 FROM TEACHES WHERE Faculty_ID = %s AND Course_ID = %s', [next_faculty_id, course_id])
            if not cursor.fetchone():
                cursor.execute('INSERT INTO TEACHES (Faculty_ID, Course_ID) VALUES (%s, %s)', [next_faculty_id, course_id])

            cursor.execute('SELECT description_id, outline_id, additional_info_id FROM INSTRUCTOR_SYLLABUS WHERE syllabus_id = %s', [syllabus_id])
            dep_row = cursor.fetchone()
            description_id = int(dep_row[0])
            outline_id = int(dep_row[1])
            additional_info_id = int(dep_row[2])

            cursor.execute('UPDATE COURSE_DISCRIPTION SET catalog_description = %s WHERE description_id = %s', [catalog_description, description_id])
            cursor.execute('UPDATE WEEKLY_TOPIC_OUTLINE SET topics_description = %s WHERE outline_id = %s', [weekly_topics, outline_id])
            cursor.execute(
                'UPDATE ADDITIONAL_INFORMATION SET design_content_percentage = %s, software_or_labs_tools_used = %s WHERE additional_info_id = %s',
                [design_content, software_tools, additional_info_id]
            )

            cursor.execute('DELETE FROM TEXTBOOK WHERE syllabus_id = %s', [syllabus_id])
            for item in textbooks:
                title = f'{item.get("title_author_year", "")}'.strip()
                attribute = f'{item.get("attribute", "")}'.strip()
                if not title:
                    continue
                textbook_id = _next_pk('TEXTBOOK', 'textbook_id')
                cursor.execute(
                    'INSERT INTO TEXTBOOK (textbook_id, title_author_year, Attribute, syllabus_id) VALUES (%s, %s, %s, %s)',
                    [textbook_id, title, attribute, syllabus_id]
                )

            cursor.execute('DELETE FROM SUPPLEMENT_MATERIAL WHERE syllabus_id = %s', [syllabus_id])
            for item in supplements:
                text = f'{item.get("material_discription", item if isinstance(item, str) else "")}'.strip()
                if not text:
                    continue
                material_id = _next_pk('SUPPLEMENT_MATERIAL', 'material_id')
                cursor.execute(
                    'INSERT INTO SUPPLEMENT_MATERIAL (material_id, material_discription, syllabus_id) VALUES (%s, %s, %s)',
                    [material_id, text, syllabus_id]
                )

            cursor.execute('DELETE FROM PREREQUISITE WHERE syllabus_id = %s', [syllabus_id])
            for item in prerequisites:
                code = f'{item.get("course_code", item if isinstance(item, str) else "")}'.strip().upper()
                if not code:
                    continue
                prerequisite_id = _next_pk('PREREQUISITE', 'prerequisite_id')
                cursor.execute(
                    'INSERT INTO PREREQUISITE (prerequisite_id, course_code, syllabus_id) VALUES (%s, %s, %s)',
                    [prerequisite_id, code, syllabus_id]
                )

            cursor.execute('DELETE FROM COREQUISITE WHERE syllabus_id = %s', [syllabus_id])
            for item in corequisites:
                code = f'{item.get("course_code", item if isinstance(item, str) else "")}'.strip().upper()
                if not code:
                    continue
                corequisite_id = _next_pk('COREQUISITE', 'corequisite_id')
                cursor.execute(
                    'INSERT INTO COREQUISITE (corequisite_id, course_code, syllabus_id) VALUES (%s, %s, %s)',
                    [corequisite_id, code, syllabus_id]
                )

            cursor.execute('DELETE FROM ASSESMENT WHERE syllabus_id = %s', [syllabus_id])
            for item in assessments:
                assessment_type = f'{item.get("assessment_type", item.get("assesment_type", ""))}'.strip()
                if not assessment_type:
                    continue
                try:
                    weight = float(item.get('weight_percentage', 0) or 0)
                except (TypeError, ValueError):
                    weight = 0
                if weight < 0:
                    weight = 0
                assessment_id = _next_pk('ASSESMENT', 'assessment_id')
                cursor.execute(
                    'INSERT INTO ASSESMENT (assessment_id, assesment_type, weight_percentage, syllabus_id) VALUES (%s, %s, %s, %s)',
                    [assessment_id, assessment_type, weight, syllabus_id]
                )

            _ensure_syllabus_clo_so_map_table()
            cursor.execute('DELETE FROM SYLLABUS_CLO_SO_MAP WHERE syllabus_id = %s', [syllabus_id])
            cursor.execute('DELETE FROM HAS_CLO WHERE syllabus_id = %s', [syllabus_id])
            unique_clo_ids = []
            for row in deduped_clo_mappings:
                clo_id = int(row['clo_id'])
                if clo_id in unique_clo_ids:
                    continue
                unique_clo_ids.append(clo_id)
                cursor.execute('INSERT INTO HAS_CLO (clo_id, syllabus_id) VALUES (%s, %s)', [clo_id, syllabus_id])

            for row in deduped_clo_mappings:
                clo_id = int(row['clo_id'])
                so_id = row.get('so_id')
                if so_id is not None:
                    cursor.execute(
                        'INSERT OR IGNORE INTO SYLLABUS_CLO_SO_MAP (syllabus_id, clo_id, so_id) VALUES (%s, %s, %s)',
                        [syllabus_id, clo_id, int(so_id)]
                    )

    refreshed = _load_syllabus_payload(program_id, cycle.cycle_id, course_id, syllabus_id)
    return Response(refreshed)


@api_view(['GET', 'POST'])
def program_faculty_members(request, program_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT Faculty_ID FROM ASSIGNED_TO WHERE program_id = %s ORDER BY Faculty_ID',
                [program_id]
            )
            faculty_ids = [row[0] for row in cursor.fetchall()]
        if not faculty_ids:
            return Response([])
        faculty_list = FacultyMember.objects.filter(faculty_id__in=faculty_ids).order_by('full_name')
        return Response(FacultyMemberSerializer(faculty_list, many=True).data)

    faculty_id = request.data.get('faculty_id')
    if not faculty_id:
        return Response({'detail': 'faculty_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        faculty_id = int(faculty_id)
    except (TypeError, ValueError):
        return Response({'detail': 'faculty_id must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    if not FacultyMember.objects.filter(faculty_id=faculty_id).exists():
        return Response({'detail': 'Faculty member not found.'}, status=status.HTTP_404_NOT_FOUND)

    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT 1 FROM ASSIGNED_TO WHERE program_id = %s AND Faculty_ID = %s',
            [program_id, faculty_id]
        )
        exists = cursor.fetchone() is not None
        if not exists:
            cursor.execute(
                'INSERT INTO ASSIGNED_TO (program_id, Faculty_ID) VALUES (%s, %s)',
                [program_id, faculty_id]
            )
    return Response({'detail': 'Faculty assigned successfully.'}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def program_faculty_member_delete(request, program_id, faculty_id):
    try:
        Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return Response({'detail': 'Program not found.'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
      with connection.cursor() as cursor:
          cursor.execute(
              'DELETE FROM ASSIGNED_TO WHERE program_id = %s AND Faculty_ID = %s',
              [program_id, faculty_id]
          )
          removed_assignment = cursor.rowcount

          if removed_assignment == 0:
              return Response({'detail': 'Faculty member is not assigned to this program.'}, status=status.HTTP_404_NOT_FOUND)

          cursor.execute('SELECT COUNT(*) FROM ASSIGNED_TO WHERE Faculty_ID = %s', [faculty_id])
          remaining_assignment_count = int(cursor.fetchone()[0] or 0)

          if remaining_assignment_count == 0:
              tables_to_cleanup = [
                  'QUALIFICATION',
                  'CERTIFICATION',
                  'PROFESSIONAL_MEMBERSHIP',
                  'PROFESSIONAL_DEVELOPMENT',
                  'INDUSTRY_EXPERIENCE',
                  'WORKLOAD',
                  'HONOR_AWARD',
                  'SERVICE_ACTIVITY',
                  'PUBLICATION',
                  'FACULTY_QUALIFICATION_ROW',
                  'FACULTY_WORKLOAD_ROW',
                  'INSTRUCTOR_SYLLABUS',
                  'TEACHES',
              ]
              for table_name in tables_to_cleanup:
                  cursor.execute(f'DELETE FROM {table_name} WHERE Faculty_ID = %s', [faculty_id])

              cursor.execute('DELETE FROM FACULTY_MEMBER WHERE Faculty_ID = %s', [faculty_id])

    return Response({'detail': 'Faculty member deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
def faculty_member_profile(request, faculty_id):
    try:
        faculty = FacultyMember.objects.get(pk=faculty_id)
    except FacultyMember.DoesNotExist:
        return Response({'detail': 'Faculty member not found.'}, status=status.HTTP_404_NOT_FOUND)

    cycle_id_raw = request.query_params.get('cycle_id') or request.data.get('cycle_id')
    cycle_id = None
    if cycle_id_raw is not None and f'{cycle_id_raw}'.strip() != '':
        try:
            cycle_id = int(cycle_id_raw)
        except (TypeError, ValueError):
            return Response({'detail': 'cycle_id must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        qualification = Qualification.objects.filter(faculty_id=faculty_id).order_by('-qualification_id').first()
        profile_payload = {
            'qualification': {
                'degree_field': qualification.degree_field if qualification else '',
                'degree_institution': qualification.degree_institution if qualification else '',
                'degree_year': qualification.degree_year if qualification else '',
                'years_industry_government': qualification.years_industry_government if qualification else '',
                'years_at_institution': qualification.years_at_institution if qualification else '',
            },
            'certifications': list(Certification.objects.filter(faculty_id=faculty_id).order_by('certification_id').values_list('certification_title', flat=True)),
            'memberships': list(ProfessionalMembership.objects.filter(faculty_id=faculty_id).order_by('membership_id').values_list('membership_description', flat=True)),
            'industry_experience': list(IndustryExperience.objects.filter(faculty_id=faculty_id).order_by('experience_id').values_list('experience_discription', flat=True)),
            'honors': list(HonorAward.objects.filter(faculty_id=faculty_id).order_by('award_id').values_list('award_discription', flat=True)),
            'services': list(ServiceActivity.objects.filter(faculty_id=faculty_id).order_by('service_id').values_list('service_description', flat=True)),
            'publications': list(Publication.objects.filter(faculty_id=faculty_id).order_by('publication_id').values_list('publication_discription', flat=True)),
        }
        if cycle_id:
            criterion6 = Criterion6Faculty.objects.filter(cycle_id=cycle_id).order_by('-criterion6_id').first()
            if criterion6:
                profile_payload['development_activities'] = list(
                    ProfessionalDevelopment.objects.filter(faculty_id=faculty_id, criterion6_id=criterion6.criterion6_id)
                    .order_by('development_id')
                    .values_list('activity_description', flat=True)
                )
            else:
                profile_payload['development_activities'] = []
        else:
            profile_payload['development_activities'] = list(
                ProfessionalDevelopment.objects.filter(faculty_id=faculty_id).order_by('development_id').values_list('activity_description', flat=True)
            )
        return Response(profile_payload)

    def _next_id(model_cls, field_name):
        max_id = model_cls.objects.aggregate(max_id=Max(field_name)).get('max_id') or 0
        return int(max_id) + 1

    qualification_data = request.data.get('qualification') or {}
    certifications = [f'{value}'.strip() for value in (request.data.get('certifications') or []) if f'{value}'.strip()]
    memberships = [f'{value}'.strip() for value in (request.data.get('memberships') or []) if f'{value}'.strip()]
    development_activities = [f'{value}'.strip() for value in (request.data.get('development_activities') or []) if f'{value}'.strip()]
    industry_experience = [f'{value}'.strip() for value in (request.data.get('industry_experience') or []) if f'{value}'.strip()]
    honors = [f'{value}'.strip() for value in (request.data.get('honors') or []) if f'{value}'.strip()]
    services = [f'{value}'.strip() for value in (request.data.get('services') or []) if f'{value}'.strip()]
    publications = [f'{value}'.strip() for value in (request.data.get('publications') or []) if f'{value}'.strip()]

    Qualification.objects.filter(faculty_id=faculty_id).delete()
    if any(f'{qualification_data.get(field, "")}'.strip() for field in ['degree_field', 'degree_institution', 'degree_year', 'years_industry_government', 'years_at_institution']):
        def _to_int(value):
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0
        Qualification.objects.create(
            qualification_id=_next_id(Qualification, 'qualification_id'),
            degree_field=f'{qualification_data.get("degree_field", "")}'.strip(),
            degree_institution=f'{qualification_data.get("degree_institution", "")}'.strip(),
            degree_year=_to_int(qualification_data.get('degree_year')),
            years_industry_government=_to_int(qualification_data.get('years_industry_government')),
            years_at_institution=_to_int(qualification_data.get('years_at_institution')),
            faculty_id=faculty_id
        )

    Certification.objects.filter(faculty_id=faculty_id).delete()
    next_cert_id = _next_id(Certification, 'certification_id')
    Certification.objects.bulk_create([
        Certification(certification_id=(next_cert_id + index), certification_title=value, faculty_id=faculty_id)
        for index, value in enumerate(certifications)
    ])

    ProfessionalMembership.objects.filter(faculty_id=faculty_id).delete()
    next_membership_id = _next_id(ProfessionalMembership, 'membership_id')
    ProfessionalMembership.objects.bulk_create([
        ProfessionalMembership(membership_id=(next_membership_id + index), membership_description=value, faculty_id=faculty_id)
        for index, value in enumerate(memberships)
    ])

    IndustryExperience.objects.filter(faculty_id=faculty_id).delete()
    next_experience_id = _next_id(IndustryExperience, 'experience_id')
    IndustryExperience.objects.bulk_create([
        IndustryExperience(experience_id=(next_experience_id + index), experience_discription=value, faculty_id=faculty_id)
        for index, value in enumerate(industry_experience)
    ])

    HonorAward.objects.filter(faculty_id=faculty_id).delete()
    next_award_id = _next_id(HonorAward, 'award_id')
    HonorAward.objects.bulk_create([
        HonorAward(award_id=(next_award_id + index), award_discription=value, faculty_id=faculty_id)
        for index, value in enumerate(honors)
    ])

    ServiceActivity.objects.filter(faculty_id=faculty_id).delete()
    next_service_id = _next_id(ServiceActivity, 'service_id')
    ServiceActivity.objects.bulk_create([
        ServiceActivity(service_id=(next_service_id + index), service_description=value, faculty_id=faculty_id)
        for index, value in enumerate(services)
    ])

    Publication.objects.filter(faculty_id=faculty_id).delete()
    next_publication_id = _next_id(Publication, 'publication_id')
    Publication.objects.bulk_create([
        Publication(publication_id=(next_publication_id + index), publication_discription=value, faculty_id=faculty_id)
        for index, value in enumerate(publications)
    ])

    if cycle_id:
        criterion6 = _ensure_criterion6_for_cycle(cycle_id)
        ProfessionalDevelopment.objects.filter(faculty_id=faculty_id, criterion6_id=criterion6.criterion6_id).delete()
        next_development_id = _next_id(ProfessionalDevelopment, 'development_id')
        ProfessionalDevelopment.objects.bulk_create([
            ProfessionalDevelopment(
                development_id=(next_development_id + index),
                activity_description=value,
                faculty_id=faculty_id,
                criterion6_id=criterion6.criterion6_id
            )
            for index, value in enumerate(development_activities)
        ])

    return Response({'detail': 'Faculty profile saved successfully.'})
