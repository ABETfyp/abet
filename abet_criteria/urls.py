from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    Criterion7FacilitiesViewSet,
    ClassroomsViewSet,
    LaboratoriesViewSet,
    ComputingResourcesViewSet,
    UpgradingFacilitiesViewSet,
    Criterion8InstitutionalSupportViewSet,
    StaffingRowViewSet,
    EvidenceFileViewSet,
    AccreditationCycleViewSet,
    ChecklistItemViewSet,
    FacultyMemberViewSet,
)

router = DefaultRouter()
router.register(r'criterion7', Criterion7FacilitiesViewSet, basename='criterion7')
router.register(r'classrooms', ClassroomsViewSet, basename='classrooms')
router.register(r'laboratories', LaboratoriesViewSet, basename='laboratories')
router.register(r'computing-resources', ComputingResourcesViewSet, basename='computing-resources')
router.register(r'upgrading-facilities', UpgradingFacilitiesViewSet, basename='upgrading-facilities')
router.register(r'criterion8', Criterion8InstitutionalSupportViewSet, basename='criterion8')
router.register(r'staffing-rows', StaffingRowViewSet, basename='staffing-rows')
router.register(r'evidence-files', EvidenceFileViewSet, basename='evidence-files')
router.register(r'accreditation-cycles', AccreditationCycleViewSet, basename='accreditation-cycles')
router.register(r'checklist-items', ChecklistItemViewSet, basename='checklist-items')
router.register(r'faculty-members', FacultyMemberViewSet, basename='faculty-members')

urlpatterns = [
    path('', include(router.urls)),
]
