from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
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
