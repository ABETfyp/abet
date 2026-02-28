from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db import IntegrityError
from django.db import connection
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from datetime import datetime
import re
import jwt
from datetime import timedelta
from .models import (
    Criterion1Students,
    Criterion5Curriculum,
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
)
from .serializers import (
    Criterion1StudentsSerializer,
    Criterion2PeosSerializer,
    Criterion5CurriculumSerializer,
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

    completed_count = 0
    for criterion_number in target_criteria:
        completion_value = criterion_progress.get(criterion_number, 0)
        if completion_value >= 100:
            completed_count += 1

    return round((completed_count / len(target_criteria)) * 100)


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


def _parse_service_date(raw_value):
    if not raw_value:
        return timezone.now().date()

    value = str(raw_value).strip()
    for fmt in ('%Y-%m-%d', '%b %Y', '%B %Y'):
        try:
            parsed = datetime.strptime(value, fmt)
            if fmt in ('%b %Y', '%B %Y'):
                return parsed.replace(day=1).date()
            return parsed.date()
        except ValueError:
            continue

    return timezone.now().date()


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

    EquipmentItem.objects.filter(appendix_c=appendix).delete()

    created_rows = []
    for row in rows:
        if not isinstance(row, dict):
            continue

        created = EquipmentItem.objects.create(
            equipment_name=(row.get('equipment_name') or '').strip(),
            category=(row.get('category') or '').strip(),
            quantity=_to_int(row.get('quantity'), 0),
            location_lab=(row.get('location_lab') or '').strip(),
            instructional_use=(row.get('instructional_use') or '').strip(),
            last_service_date=_parse_service_date(row.get('last_service_date')),
            evidence_link=(row.get('evidence_link') or '').strip(),
            appendix_c=appendix,
        )
        created_rows.append(created)

    appendix.labs_covered_count = _to_int(request.data.get('labs_covered_count'), appendix.labs_covered_count or 0)
    appendix.high_value_assets_count = _to_int(request.data.get('high_value_assets_count'), appendix.high_value_assets_count or 0)
    appendix.equipment_items_count = len(created_rows)
    appendix.last_updated_date = timezone.now().date()
    appendix.save()

    return Response({
        'appendix': AppendixCEquipmentSerializer(appendix).data,
        'equipment_rows': EquipmentItemSerializer(created_rows, many=True).data,
    })


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
    queryset = EvidenceFile.objects.all()
    serializer_class = EvidenceFileSerializer


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
    return Response(_serialize_peo(peo_row), status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
def program_peo_detail(request, program_id, peo_id):
    try:
        peo_row = Peo.objects.get(peo_id=peo_id, program_id=program_id)
    except Peo.DoesNotExist:
        return Response({'detail': 'PEO not found for this program.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        peo_row.delete()
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

    return Response(
        _serialize_clo({'clo_id': next_clo_id, 'description': description, 'level': stored_code}),
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
