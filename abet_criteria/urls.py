from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    auth_login,
    auth_register,
    frameworks_list,
    programs_list,
    program_faculty_members,
    program_faculty_member_delete,
    program_student_outcomes,
    program_student_outcome_detail,
    program_so_peo_mappings,
    program_so_course_links,
    program_clos,
    program_clo_detail,
    program_peos,
    program_peo_detail,
    program_courses,
    program_course_detail,
    program_course_sections,
    program_course_section_detail,
    program_syllabus_detail,
    program_cycles_create,
    program_cycles_delete,
    cycle_detail,
    cycle_checklist,
    cycle_criterion1,
    cycle_criterion2,
    cycle_appendixc,
    faculty_member_profile,
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
    path('auth/login/', auth_login),
    path('auth/register/', auth_register),
    path('frameworks/', frameworks_list),
    path('programs/', programs_list),
    path('programs/<int:program_id>/faculty-members/', program_faculty_members),
    path('programs/<int:program_id>/faculty-members/<int:faculty_id>/', program_faculty_member_delete),
    path('programs/<int:program_id>/student-outcomes/', program_student_outcomes),
    path('programs/<int:program_id>/student-outcomes/<int:so_id>/', program_student_outcome_detail),
    path('programs/<int:program_id>/so-peo-mappings/', program_so_peo_mappings),
    path('programs/<int:program_id>/so-course-links/', program_so_course_links),
    path('programs/<int:program_id>/clos/', program_clos),
    path('programs/<int:program_id>/clos/<int:clo_id>/', program_clo_detail),
    path('programs/<int:program_id>/peos/', program_peos),
    path('programs/<int:program_id>/peos/<int:peo_id>/', program_peo_detail),
    path('programs/<int:program_id>/courses/', program_courses),
    path('programs/<int:program_id>/courses/<int:course_id>/', program_course_detail),
    path('programs/<int:program_id>/courses/<int:course_id>/sections/', program_course_sections),
    path('programs/<int:program_id>/courses/<int:course_id>/sections/<int:syllabus_id>/', program_course_section_detail),
    path('programs/<int:program_id>/courses/<int:course_id>/sections/<int:syllabus_id>/syllabus/', program_syllabus_detail),
    path('programs/<int:program_id>/cycles/', program_cycles_create),
    path('programs/<int:program_id>/cycles/<int:cycle_id>/', program_cycles_delete),
    path('cycles/<int:cycle_id>/', cycle_detail),
    path('cycles/<int:cycle_id>/checklist/', cycle_checklist),
    path('cycles/<int:cycle_id>/criterion1/', cycle_criterion1),
    path('cycles/<int:cycle_id>/criterion2/', cycle_criterion2),
    path('cycles/<int:cycle_id>/appendixc/', cycle_appendixc),
    path('faculty-members/<int:faculty_id>/profile/', faculty_member_profile),
    path('', include(router.urls)),
]
