from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Max
from django.utils import timezone
from datetime import datetime
import re
from .models import (
    Criterion1Students,
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
)
from .serializers import (
    Criterion1StudentsSerializer,
    Criterion2PeosSerializer,
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


def _ensure_cycle(cycle_id):
    try:
        return AccreditationCycle.objects.get(pk=cycle_id)
    except AccreditationCycle.DoesNotExist:
        return AccreditationCycle.objects.order_by('-cycle_id').first()


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
    criterion_progress = {}
    for item in items:
        criterion_number = _criterion_number_from_name(item.item_name)
        if criterion_number not in (1, 2, 3, 4, 5, 6, 7, 8):
            continue
        criterion_progress[criterion_number] = float(item.completion_percentage or 0)

    if not criterion_progress:
        return float(cycle.overall_progress_percentage or 0)

    total = sum(criterion_progress.values())
    return round(total / len(criterion_progress))


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
        return Response({'detail': 'No accreditation cycles found.'}, status=status.HTTP_404_NOT_FOUND)

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

    program = Program.objects.create(program_name=name, program_level=level)
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

    label = (request.data.get('label') or '').strip()
    years = re.findall(r'\d{4}', label)
    current_year = timezone.now().year
    start_year = int(years[0]) if len(years) >= 1 else current_year
    end_year = int(years[1]) if len(years) >= 2 else (start_year + 2)

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


@api_view(['GET'])
def cycle_detail(request, cycle_id):
    cycle = _ensure_cycle(cycle_id)
    if not cycle:
        return Response({'detail': 'No accreditation cycles found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'id': cycle.cycle_id,
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
        return Response({'detail': 'No accreditation cycles found.'}, status=status.HTTP_404_NOT_FOUND)

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
        return Response({'detail': 'No accreditation cycles found.'}, status=status.HTTP_404_NOT_FOUND)

    criterion2 = cycle.criterion2

    if request.method == 'GET':
        return Response(Criterion2PeosSerializer(criterion2).data)

    serializer = Criterion2PeosSerializer(criterion2, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


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
        return Response({'detail': 'No accreditation cycles found.'}, status=status.HTTP_404_NOT_FOUND)

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
