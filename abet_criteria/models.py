from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# ============================================================================
# BASE MODELS (Required by Criterion 7 & 8)
# ============================================================================

class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=100)

    class Meta:
        db_table = 'ROLE'

    def __str__(self):
        return self.role_name


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, db_column='role_id')

    class Meta:
        db_table = 'USER'

    def __str__(self):
        return self.email


class Program(models.Model):
    program_id = models.AutoField(primary_key=True)
    program_name = models.CharField(max_length=255, unique=True)
    program_level = models.CharField(max_length=50)

    class Meta:
        db_table = 'PROGRAM'

    def __str__(self):
        return self.program_name


class CycleChecklist(models.Model):
    checklist_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    status = models.IntegerField()

    class Meta:
        db_table = 'CYCLE_CHECKLIST'

    def __str__(self):
        return self.title


class Criterion2Peos(models.Model):
    criterion2_id = models.AutoField(primary_key=True)
    institutional_mission_statement = models.TextField()
    program_mission_statement = models.TextField()
    mission_source_link = models.TextField()
    peos_list = models.TextField()
    peos_short_descriptions = models.TextField()
    peos_publication_location = models.TextField()
    peos_mission_alignment_explanation = models.TextField()
    constituencies_list = models.TextField()
    constituencies_contribution_description = models.TextField()
    peo_review_frequency = models.TextField()
    peo_review_participants = models.TextField()
    feedback_collection_and_decision_process = models.TextField()
    changes_since_last_peo_review = models.TextField()

    class Meta:
        db_table = 'CRITERION_2_PEOS'

    def __str__(self):
        return f"Criterion 2 - {self.criterion2_id}"


class Criterion3SoPeo(models.Model):
    criterion3_id = models.AutoField(primary_key=True)

    class Meta:
        db_table = 'CRITERION_3_SO_PEO'

    def __str__(self):
        return f"Criterion 3 - {self.criterion3_id}"


class Criterion5Curriculum(models.Model):
    criterion5_id = models.AutoField(primary_key=True)
    academic_calender_type = models.CharField(max_length=50)
    curriculum_alignment_description = models.TextField()
    prerequisites_support_description = models.TextField()
    hours_depth_by_subject_area_description = models.TextField()
    broad_education_component_description = models.TextField()
    cooperative_education_description = models.TextField()
    materials_available_description = models.TextField()
    culminating_design_experience = models.TextField()
    curricular_paths = models.TextField(db_column='Curricular_paths')

    class Meta:
        db_table = 'CRITERION_5_CURRICULUM'

    def __str__(self):
        return f"Criterion 5 - {self.criterion5_id}"


class AppendixA(models.Model):
    appendixA_id = models.AutoField(primary_key=True)

    class Meta:
        db_table = 'APPENIXA'

    def __str__(self):
        return f"Appendix A - {self.appendixA_id}"


class AccreditationCycle(models.Model):
    cycle_id = models.AutoField(primary_key=True, db_column='Cycle_ID')
    start_year = models.IntegerField(db_column='Start_year')
    end_year = models.IntegerField(db_column='End_year')
    overall_progress_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        db_column='Overall_Progress_Percentage'
    )
    program = models.ForeignKey(Program, on_delete=models.CASCADE, db_column='program_id')
    checklist = models.ForeignKey(CycleChecklist, on_delete=models.CASCADE, db_column='checklist_id')
    criterion2 = models.ForeignKey(Criterion2Peos, on_delete=models.CASCADE, db_column='criterion2_id')
    criterion3 = models.ForeignKey(Criterion3SoPeo, on_delete=models.CASCADE, db_column='criterion3_id')
    criterion5 = models.ForeignKey(
        Criterion5Curriculum,
        on_delete=models.CASCADE,
        db_column='criterion5_id',
        null=True,
        blank=True
    )
    appendixA = models.ForeignKey(
        AppendixA,
        on_delete=models.CASCADE,
        db_column='appendixA_id',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'ACCREDIATION_CYCLE'

    def __str__(self):
        return f"Cycle {self.start_year}-{self.end_year}"


class Criterion1Students(models.Model):
    criterion1_id = models.AutoField(primary_key=True)
    admission_requirements = models.TextField(blank=True, default='')
    admission_process_summary = models.TextField(blank=True, default='')
    transfer_pathways = models.TextField(blank=True, default='')
    pperformance_evaluation_process = models.TextField(blank=True, default='')
    prerequisite_verification_method = models.TextField(blank=True, default='')
    prerequisite_not_met_action = models.TextField(blank=True, default='')
    transfer_policy_summary = models.TextField(blank=True, default='')
    transfer_credit_evaluation_process = models.TextField(blank=True, default='')
    articulation_agreements = models.TextField(blank=True, default='')
    advising_providers = models.TextField(blank=True, default='')
    advising_frequency = models.TextField(blank=True, default='')
    career_guidance_description = models.TextField(blank=True, default='')
    work_in_lieu_policies = models.TextField(blank=True, default='')
    work_in_lieu_approval_process = models.TextField(blank=True, default='')
    minimum_required_credits = models.IntegerField(default=0)
    required_gpa_or_standing = models.CharField(max_length=50, blank=True, default='')
    essential_courses_categories = models.TextField(blank=True, default='')
    degree_name = models.CharField(max_length=255, blank=True, default='')
    transcript_format_explanation = models.TextField(blank=True, default='')
    program_name_on_transcript = models.CharField(max_length=255, blank=True, default='')
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    item = models.ForeignKey('ChecklistItem', on_delete=models.CASCADE, db_column='item_id')

    class Meta:
        db_table = 'CRITERION_1_STUDENTS'
        managed = False

    def __str__(self):
        return f"Criterion 1 - Cycle {self.cycle.cycle_id}"


# ============================================================================
# CRITERION 7: FACILITIES
# ============================================================================

class Criterion7Facilities(models.Model):
    criterion7_id = models.AutoField(primary_key=True)
    is_complete = models.BooleanField(default=False)
    total_number_of_offices = models.IntegerField(null=True, blank=True)
    average_workspace_size = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    guidance_description = models.TextField(null=True, blank=True)
    responsible_faculty_name = models.CharField(max_length=255, null=True, blank=True)
    maintenance_policy_description = models.TextField(null=True, blank=True)
    technical_collections_and_journals = models.TextField(null=True, blank=True)
    electronic_databases_and_eresources = models.TextField(null=True, blank=True)
    faculty_book_request_process = models.TextField(null=True, blank=True)
    library_access_hours_and_systems = models.TextField(null=True, blank=True)
    facilities_support_student_outcomes = models.TextField(null=True, blank=True)
    safety_and_inspection_processes = models.TextField(null=True, blank=True)
    compliance_with_university_policy = models.TextField(null=True, blank=True)
    student_availability_details = models.TextField(null=True, blank=True)
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID', null=True, blank=True)

    class Meta:
        db_table = 'CRITERION_7_FACILITIES'

    def __str__(self):
        return f"Criterion 7 - Cycle {self.cycle.cycle_id}"


class Classrooms(models.Model):
    classroom_id = models.AutoField(primary_key=True)
    classroom_room = models.CharField(max_length=50)
    classroom_capacity = models.IntegerField()
    classroom_multimedia = models.TextField()
    classroom_internet_access = models.TextField()
    classroom_typical_use = models.TextField()
    classroom_adequacy_comments = models.TextField()
    criterion7 = models.ForeignKey(
        Criterion7Facilities, 
        on_delete=models.CASCADE, 
        db_column='criterion7_id',
        related_name='classrooms'
    )

    class Meta:
        db_table = 'CLASSROOMS'

    def __str__(self):
        return f"Classroom {self.classroom_room}"


class Laboratories(models.Model):
    lab_id = models.AutoField(primary_key=True)
    lab_name = models.CharField(max_length=255)
    lab_room = models.CharField(max_length=50)
    lab_category = models.CharField(max_length=100)
    lab_hardware_list = models.TextField()
    lab_software_list = models.TextField()
    lab_open_hours = models.TextField()
    lab_courses_using_lab = models.TextField()
    criterion7 = models.ForeignKey(
        Criterion7Facilities, 
        on_delete=models.CASCADE, 
        db_column='criterion7_id',
        related_name='laboratories'
    )

    class Meta:
        db_table = 'LABORATORIES'

    def __str__(self):
        return self.lab_name


class ComputingResources(models.Model):
    computing_resources_id = models.AutoField(primary_key=True)
    computing_resource_name = models.CharField(max_length=255)
    computing_resource_location = models.TextField()
    computing_adequacy_notes = models.TextField()
    computing_hours_available = models.TextField()
    computing_access_type = models.TextField()
    criterion7 = models.ForeignKey(
        Criterion7Facilities, 
        on_delete=models.CASCADE, 
        db_column='criterion7_id',
        related_name='computing_resources'
    )

    class Meta:
        db_table = 'COMPUTING_RESOURCES'

    def __str__(self):
        return self.computing_resource_name


class UpgradingFacilities(models.Model):
    facility_id = models.AutoField(primary_key=True)
    facility_name = models.CharField(max_length=255)
    next_scheduled_upgrade = models.DateField()
    last_upgrade_date = models.DateField()
    maintenance_notes = models.TextField()
    responsible_staff = models.CharField(max_length=255)
    criterion7 = models.ForeignKey(
        Criterion7Facilities, 
        on_delete=models.CASCADE, 
        db_column='criterion7_id',
        related_name='upgrading_facilities'
    )

    class Meta:
        db_table = 'UPGRADING_FACILITES'

    def __str__(self):
        return self.facility_name


# ============================================================================
# CRITERION 8: INSTITUTIONAL SUPPORT
# ============================================================================

class Criterion6Faculty(models.Model):
    criterion6_id = models.AutoField(primary_key=True)
    faculty_composition_narrative = models.TextField()
    faculty_worklaod_expectations_description = models.TextField()
    workload_expectations_desciption = models.TextField()
    faculty_size_adequacy_description = models.TextField()
    advising_and_student_interaction_description = models.TextField()
    service_and_industry_engagement_description = models.TextField()
    course_creation_role_description = models.TextField()
    peo_ro_role_description = models.TextField()
    leadership_roles_description = models.TextField()
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')

    class Meta:
        db_table = 'CRITERION_6_FACULTY'

    def __str__(self):
        return f"Criterion 6 - {self.criterion6_id}"


class AppendixCEquipment(models.Model):
    appendix_c_id = models.AutoField(primary_key=True)
    last_updated_date = models.DateField()
    labs_covered_count = models.IntegerField()
    equipment_items_count = models.IntegerField()
    high_value_assets_count = models.IntegerField()
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')

    class Meta:
        db_table = 'APPENDIX_C_EQUIPMENT'

    def __str__(self):
        return f"Appendix C - {self.appendix_c_id}"


class ChecklistItem(models.Model):
    item_id = models.AutoField(primary_key=True)
    item_name = models.CharField(max_length=255)
    status = models.IntegerField()
    completion_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        db_column='completion_percetage'
    )
    checklist = models.ForeignKey(CycleChecklist, on_delete=models.CASCADE, db_column='checklist_id')
    criterion7 = models.ForeignKey(
        Criterion7Facilities, 
        on_delete=models.CASCADE, 
        db_column='criterion7_id',
        null=True,
        blank=True
    )
    criterion3 = models.ForeignKey(
        Criterion3SoPeo, 
        on_delete=models.CASCADE, 
        db_column='criterion3_id',
        null=True,
        blank=True
    )
    criterion5 = models.ForeignKey(
        Criterion5Curriculum,
        on_delete=models.CASCADE,
        db_column='criterion5_id',
        null=True,
        blank=True
    )
    criterion6 = models.ForeignKey(
        Criterion6Faculty,
        on_delete=models.CASCADE,
        db_column='criterion6_id',
        null=True,
        blank=True
    )
    appendixA = models.ForeignKey(
        AppendixA,
        on_delete=models.CASCADE,
        db_column='appendixA_id',
        null=True,
        blank=True
    )
    appendix_c = models.ForeignKey(
        AppendixCEquipment,
        on_delete=models.CASCADE,
        db_column='appendix_c_id',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'CHECKLIST_ITEM'

    def __str__(self):
        return self.item_name


class Criterion8InstitutionalSupport(models.Model):
    criterion8_id = models.AutoField(primary_key=True)
    leadership_structure_description = models.TextField()
    leadership_adequacy_description = models.TextField()
    leadership_participation_description = models.TextField()
    budget_process_continuity = models.TextField()
    teaching_support_description = models.TextField()
    infrastructure_funding_description = models.TextField()
    resource_adequacy_description = models.TextField()
    hiring_process_description = models.TextField()
    retention_strategies_description = models.TextField()
    professional_development_support_types = models.TextField()
    professional_development_request_process = models.TextField()
    professional_development_funding_details = models.TextField()
    additional_narrative_on_staffing = models.TextField(db_column='Additional_narrative_on_staffing')
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    item = models.ForeignKey(ChecklistItem, on_delete=models.CASCADE, db_column='item_id')

    class Meta:
        db_table = 'CRITERION_8_INSTITUTIONAL_SUPPORT'

    def __str__(self):
        return f"Criterion 8 - Cycle {self.cycle.cycle_id}"


class StaffingRow(models.Model):
    staffing_row_id = models.AutoField(primary_key=True)
    category = models.CharField(max_length=100)
    number_of_staff = models.IntegerField()
    primary_role = models.CharField(max_length=255)
    training_retention_practices = models.TextField()
    criterion8 = models.ForeignKey(
        Criterion8InstitutionalSupport, 
        on_delete=models.CASCADE, 
        db_column='criterion8_id',
        related_name='staffing_rows'
    )

    class Meta:
        db_table = 'STAFFING_ROW'

    def __str__(self):
        return f"{self.category} - {self.number_of_staff} staff"


# ============================================================================
# EVIDENCE FILES (Supports Criterion 7 & 8)
# ============================================================================

class EvidenceFile(models.Model):
    evidence_id = models.AutoField(primary_key=True)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    upload_date = models.DateField()
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')

    class Meta:
        db_table = 'EVIDENCE_FILE'

    def __str__(self):
        return self.file_name


class FacultyMember(models.Model):
    faculty_id = models.IntegerField(primary_key=True, db_column='Faculty_ID')
    full_name = models.CharField(max_length=255, db_column='Full_Name')
    academic_rank = models.CharField(max_length=100, db_column='Academic_Rank')
    appointment_type = models.CharField(max_length=100, db_column='Appointment_Type')
    email = models.EmailField(max_length=255, db_column='Email', unique=True)
    office_hours = models.TextField(db_column='Office_Hours', null=True, blank=True)

    class Meta:
        db_table = 'FACULTY_MEMBER'
        managed = False

    def __str__(self):
        return self.full_name


# ============================================================================
# FINAL SCHEMA TABLE MAPPINGS
# ============================================================================

class Qualification(models.Model):
    qualification_id = models.AutoField(primary_key=True, db_column='Qualification_ID')
    degree_field = models.CharField(max_length=255, db_column='Degree_Field')
    degree_institution = models.CharField(max_length=255, db_column='Degree_Institution')
    degree_year = models.IntegerField(db_column='Degree_Year')
    years_industry_government = models.IntegerField(db_column='Years_Industry_Government')
    years_at_institution = models.IntegerField(db_column='Years_At_Institution')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'QUALIFICATION'
        managed = False


class Certification(models.Model):
    certification_id = models.AutoField(primary_key=True, db_column='Certification_ID')
    certification_title = models.CharField(max_length=255, db_column='Certification_title')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'CERTIFICATION'
        managed = False


class ProfessionalMembership(models.Model):
    membership_id = models.AutoField(primary_key=True, db_column='Membership_ID')
    membership_description = models.TextField(db_column='Membership_Description')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'PROFESSIONAL_MEMBERSHIP'
        managed = False


class ProfessionalDevelopment(models.Model):
    development_id = models.AutoField(primary_key=True, db_column='Development_ID')
    activity_description = models.TextField(db_column='Activity_Description')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')
    criterion6 = models.ForeignKey(Criterion6Faculty, on_delete=models.CASCADE, db_column='criterion6_id')

    class Meta:
        db_table = 'PROFESSIONAL_DEVELOPMENT'
        managed = False


class IndustryExperience(models.Model):
    experience_id = models.AutoField(primary_key=True, db_column='Experience_ID')
    experience_discription = models.TextField(db_column='Experience_discription')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'INDUSTRY_EXPERIENCE'
        managed = False


class Workload(models.Model):
    workload_id = models.AutoField(primary_key=True, db_column='Workload_ID')
    teaching_percentage = models.DecimalField(max_digits=5, decimal_places=2, db_column='Teaching_Percentage')
    research_percentage = models.DecimalField(max_digits=5, decimal_places=2, db_column='Research_Percentage')
    other_percentage = models.DecimalField(max_digits=5, decimal_places=2, db_column='Other_Percentage')
    program_time_percentage = models.DecimalField(max_digits=5, decimal_places=2, db_column='Program_Time_Percentage')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')

    class Meta:
        db_table = 'WORKLOAD'
        managed = False


class HonorAward(models.Model):
    award_id = models.AutoField(primary_key=True, db_column='Award_ID')
    award_discription = models.TextField(db_column='Award_discription')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'HONOR_AWARD'
        managed = False


class ServiceActivity(models.Model):
    service_id = models.AutoField(primary_key=True, db_column='Service_ID')
    service_description = models.TextField(db_column='Service_Description')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'SERVICE_ACTIVITY'
        managed = False


class Publication(models.Model):
    publication_id = models.AutoField(primary_key=True, db_column='Publication_ID')
    publication_discription = models.TextField(db_column='Publication_Discription')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'PUBLICATION'
        managed = False


class BackgroundInfo(models.Model):
    background_id = models.AutoField(primary_key=True, db_column='background_id_')
    program_contact_name = models.CharField(max_length=255)
    contact_title = models.CharField(max_length=255)
    office_location = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=50)
    email_address = models.CharField(max_length=255)
    year_implemented = models.IntegerField()
    last_general_review_date = models.DateField()
    summary_of_major_changes = models.TextField()
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    item = models.ForeignKey(ChecklistItem, on_delete=models.CASCADE, db_column='item_id')

    class Meta:
        db_table = 'BACKGROUND_INFO'
        managed = False


class UnifiedSyllabus(models.Model):
    unified_syllabus_id = models.AutoField(primary_key=True)
    status = models.IntegerField()

    class Meta:
        db_table = 'UNIFIED_SYLLABUS'
        managed = False


class CurriculumCourseRow(models.Model):
    curr_course_row_id = models.AutoField(primary_key=True)
    r_se_category = models.CharField(max_length=100)
    math_basic_sciences_credits = models.IntegerField()
    engineering_topics_credits = models.IntegerField()
    other_credits = models.IntegerField()
    last_two_terms_offered = models.CharField(max_length=100)
    max_section_enrollment = models.IntegerField()
    criterion5 = models.ForeignKey(Criterion5Curriculum, on_delete=models.CASCADE, db_column='criterion5_id')

    class Meta:
        db_table = 'CURRICULUM_COURSE_ROW'
        managed = False


class Course(models.Model):
    course_id = models.AutoField(primary_key=True, db_column='Course_ID')
    course_code = models.CharField(max_length=50, db_column='Course_Code')
    credits = models.IntegerField(db_column='Credits')
    contact_hours = models.IntegerField(db_column='Contact_Hours')
    course_type = models.CharField(max_length=50, db_column='Course_Type')
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    unified_syllabus = models.ForeignKey(UnifiedSyllabus, on_delete=models.CASCADE, db_column='unified_syllabus_id')
    curr_course_row = models.ForeignKey(CurriculumCourseRow, on_delete=models.CASCADE, db_column='curr_course_row_id')
    criterion5 = models.ForeignKey(Criterion5Curriculum, on_delete=models.CASCADE, db_column='criterion5_id')

    class Meta:
        db_table = 'COURSE'
        managed = False


class CourseDiscription(models.Model):
    description_id = models.AutoField(primary_key=True)
    catalog_description = models.TextField()

    class Meta:
        db_table = 'COURSE_DISCRIPTION'
        managed = False


class WeeklyTopicOutline(models.Model):
    outline_id = models.AutoField(primary_key=True)
    topics_description = models.TextField()

    class Meta:
        db_table = 'WEEKLY_TOPIC_OUTLINE'
        managed = False


class AdditionalInformation(models.Model):
    additional_info_id = models.AutoField(primary_key=True)
    design_content_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    software_or_labs_tools_used = models.TextField()

    class Meta:
        db_table = 'ADDITIONAL_INFORMATION'
        managed = False


class InstructorSyllabus(models.Model):
    syllabus_id = models.AutoField(primary_key=True)
    term = models.CharField(max_length=50)
    syllabus_status = models.IntegerField()
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='Course_ID')
    description = models.ForeignKey(CourseDiscription, on_delete=models.CASCADE, db_column='description_id')
    outline = models.ForeignKey(WeeklyTopicOutline, on_delete=models.CASCADE, db_column='outline_id')
    additional_info = models.ForeignKey(AdditionalInformation, on_delete=models.CASCADE, db_column='additional_info_id')
    unified_syllabus = models.ForeignKey(UnifiedSyllabus, on_delete=models.CASCADE, db_column='unified_syllabus_id')

    class Meta:
        db_table = 'INSTRUCTOR_SYLLABUS'
        managed = False


class Clo(models.Model):
    clo_id = models.AutoField(primary_key=True)
    description = models.TextField()
    level = models.CharField(max_length=50)

    class Meta:
        db_table = 'CLO'
        managed = False


class Assesment(models.Model):
    assessment_id = models.AutoField(primary_key=True)
    assesment_type = models.CharField(max_length=100)
    weight_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    syllabus = models.ForeignKey(InstructorSyllabus, on_delete=models.CASCADE, db_column='syllabus_id')

    class Meta:
        db_table = 'ASSESMENT'
        managed = False


class SupplementMaterial(models.Model):
    material_id = models.AutoField(primary_key=True)
    material_discription = models.TextField()
    syllabus = models.ForeignKey(InstructorSyllabus, on_delete=models.CASCADE, db_column='syllabus_id')

    class Meta:
        db_table = 'SUPPLEMENT_MATERIAL'
        managed = False


class Textbook(models.Model):
    textbook_id = models.AutoField(primary_key=True)
    title_author_year = models.TextField()
    attribute = models.TextField(db_column='Attribute')
    syllabus = models.ForeignKey(InstructorSyllabus, on_delete=models.CASCADE, db_column='syllabus_id')

    class Meta:
        db_table = 'TEXTBOOK'
        managed = False


class Prerequisite(models.Model):
    prerequisite_id = models.AutoField(primary_key=True)
    course_code = models.CharField(max_length=50)
    syllabus = models.ForeignKey(InstructorSyllabus, on_delete=models.CASCADE, db_column='syllabus_id')

    class Meta:
        db_table = 'PREREQUISITE'
        managed = False


class Corequisite(models.Model):
    corequisite_id = models.AutoField(primary_key=True)
    course_code = models.CharField(max_length=50)
    syllabus = models.ForeignKey(InstructorSyllabus, on_delete=models.CASCADE, db_column='syllabus_id')

    class Meta:
        db_table = 'COREQUISITE'
        managed = False


class StudentOutcome(models.Model):
    so_id = models.AutoField(primary_key=True)
    so_code = models.CharField(max_length=20, unique=True)
    so_discription = models.TextField()
    program = models.ForeignKey(Program, on_delete=models.CASCADE, db_column='program_id')

    class Meta:
        db_table = 'STUDENT_OUTCOME'
        managed = False


class Peo(models.Model):
    peo_id = models.AutoField(primary_key=True)
    peo_code = models.CharField(max_length=20, unique=True)
    peo_description = models.TextField()
    program = models.ForeignKey(Program, on_delete=models.CASCADE, db_column='program_id')

    class Meta:
        db_table = 'PEO'
        managed = False


class Criterion4(models.Model):
    criterion4_id = models.AutoField(primary_key=True)
    assessment_processes_description = models.TextField()
    assessment_frequency_description = models.TextField()
    documentation_storage_description = models.TextField()
    ci_process_description = models.TextField()
    recent_changes_description = models.TextField()
    future_improvement_plans_description = models.TextField()
    assessment_instruments_available = models.TextField()
    meeting_minutes_available = models.TextField()
    advisory_board_recommendations_available = models.TextField()
    disaggregated_data_available = models.TextField()
    onsite_review_notes = models.TextField()
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    item = models.ForeignKey(ChecklistItem, on_delete=models.CASCADE, db_column='item_id')

    class Meta:
        db_table = 'CRITERION_4'
        managed = False


class OutcomeAttainmentRow(models.Model):
    attainment_row_id = models.AutoField(primary_key=True)
    assessment_evidence = models.TextField()
    target_attainment = models.CharField(max_length=100)
    evaluation_summary = models.TextField()
    where_stored = models.TextField()
    criterion4 = models.ForeignKey(Criterion4, on_delete=models.CASCADE, db_column='criterion4_id')
    so = models.ForeignKey(StudentOutcome, on_delete=models.CASCADE, db_column='so_id')

    class Meta:
        db_table = 'OUTCOME_ATTAINMENT_ROW'
        managed = False


class CiActionRow(models.Model):
    ci_row_id = models.AutoField(primary_key=True)
    year = models.IntegerField()
    trigger_description = models.TextField()
    action_taken = models.TextField()
    status = models.CharField(max_length=100)
    reassessment_result = models.TextField()
    criterion4 = models.ForeignKey(Criterion4, on_delete=models.CASCADE, db_column='criterion4_id')

    class Meta:
        db_table = 'CI_ACTION_ROW'
        managed = False


class DesignProjectRow(models.Model):
    design_project_row_id = models.AutoField(primary_key=True)
    project_title = models.CharField(max_length=255)
    team_identifier = models.CharField(max_length=100)
    year = models.IntegerField()
    criterion5 = models.ForeignKey(Criterion5Curriculum, on_delete=models.CASCADE, db_column='criterion5_id')

    class Meta:
        db_table = 'DESIGN_PROJECT_ROW'
        managed = False


class FacultyQualificationRow(models.Model):
    faculty_qualification_row_id = models.AutoField(primary_key=True)
    highest_degree_field = models.CharField(max_length=255)
    highest_degree_year = models.IntegerField()
    academic_rank = models.CharField(max_length=100)
    academic_appointment = models.CharField(max_length=100)
    full_time_or_part_time = models.CharField(max_length=50)
    years_gov_industry = models.IntegerField()
    years_teaching = models.IntegerField()
    years_at_institution = models.IntegerField()
    professional_registration = models.CharField(max_length=255)
    criterion6 = models.ForeignKey(Criterion6Faculty, on_delete=models.CASCADE, db_column='criterion6_id')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'FACULTY_QUALIFICATION_ROW'
        managed = False


class FacultyWorkloadRow(models.Model):
    faculty_workload_row_id = models.AutoField(primary_key=True)
    fill_tie_or_part_time = models.CharField(max_length=50)
    classes_taught_description = models.TextField()
    term = models.CharField(max_length=50)
    year = models.IntegerField()
    criterion6 = models.ForeignKey(Criterion6Faculty, on_delete=models.CASCADE, db_column='criterion6_id')
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='Course_ID')

    class Meta:
        db_table = 'FACULTY_WORKLOAD_ROW'
        managed = False


class AppendixB(models.Model):
    appendixB_id = models.AutoField(primary_key=True)
    item = models.ForeignKey(ChecklistItem, on_delete=models.CASCADE, db_column='item_id')

    class Meta:
        db_table = 'APPENDIXB'
        managed = False


class EquipmentItem(models.Model):
    equipment_id = models.AutoField(primary_key=True)
    equipment_name = models.CharField(max_length=255)
    category = models.CharField(max_length=150)
    quantity = models.IntegerField()
    location_lab = models.CharField(max_length=255)
    instructional_use = models.TextField()
    last_service_date = models.DateField()
    evidence_link = models.TextField()
    appendix_c = models.ForeignKey(AppendixCEquipment, on_delete=models.CASCADE, db_column='appendix_c_id')

    class Meta:
        db_table = 'EQUIPMENT_ITEM'
        managed = False


class AppendixDInstitution(models.Model):
    appendix_d_id = models.AutoField(primary_key=True)
    institution_name = models.CharField(max_length=255)
    institutiton_address = models.TextField()
    chief_executive_name = models.CharField(max_length=255)
    chief_ececutive_title = models.CharField(max_length=255)
    self_study_submitter_name = models.CharField(max_length=255)
    self_study_submitter_title = models.CharField(max_length=255)
    institutional_accreditations = models.TextField()
    accreditation_evalutaion_dates = models.TextField()
    control_type_description = models.TextField()
    administrative_chain_description = models.TextField()
    organization_chart_file_reference = models.TextField()
    credit_hour_definition = models.TextField()
    deviations_from_standard = models.TextField()
    cycle = models.ForeignKey(AccreditationCycle, on_delete=models.CASCADE, db_column='Cycle_ID')
    item = models.ForeignKey(ChecklistItem, on_delete=models.CASCADE, db_column='item_id')

    class Meta:
        db_table = 'APPENDIX_D_INSTITUTION'
        managed = False


class AcademicSupportUnit(models.Model):
    support_unit_id = models.AutoField(primary_key=True)
    unit_name = models.CharField(max_length=255)
    responsible_person_name = models.CharField(max_length=255)
    responsible_person_title = models.CharField(max_length=255)
    contact_email = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=50)
    appendix_d = models.ForeignKey(AppendixDInstitution, on_delete=models.CASCADE, db_column='appendix_d_id')

    class Meta:
        db_table = 'ACADEMIC_SUPPORT_UNIT'
        managed = False


class NonacademicSupportUnit(models.Model):
    nonacademic_support_unit_id = models.AutoField(primary_key=True)
    unit_name = models.CharField(max_length=255)
    responsible_person_name = models.CharField(max_length=255)
    responsible_person_title = models.CharField(max_length=255)
    contact_email = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=50)
    appendix_d = models.ForeignKey(AppendixDInstitution, on_delete=models.CASCADE, db_column='appendix_d_id')

    class Meta:
        db_table = 'NONACADEMIC_SUPPORT_UNIT'
        managed = False


class EnrollmentRecord(models.Model):
    enrollment_record_id = models.AutoField(primary_key=True)
    academic_year = models.CharField(max_length=20)
    student_type = models.CharField(max_length=100)
    year1_count = models.IntegerField()
    year2_count = models.IntegerField()
    year3_count = models.IntegerField()
    year4_count = models.IntegerField()
    year5_count = models.IntegerField()
    total_undergraduate = models.IntegerField()
    total_graduate = models.IntegerField()
    associates_awarded = models.IntegerField()
    bachelors_awarded = models.IntegerField()
    masters_awarded = models.IntegerField()
    doctorates_awarded = models.IntegerField()
    appendix_d = models.ForeignKey(AppendixDInstitution, on_delete=models.CASCADE, db_column='appendix_d_id')

    class Meta:
        db_table = 'ENROLLMENT_RECORD'
        managed = False


class PersonnelRecord(models.Model):
    personnel_record_id = models.AutoField(primary_key=True)
    employment_category = models.CharField(max_length=150)
    full_time_count = models.IntegerField()
    part_time_count = models.IntegerField()
    fte_count = models.IntegerField()
    appendix_d = models.ForeignKey(AppendixDInstitution, on_delete=models.CASCADE, db_column='appendix_d_id')

    class Meta:
        db_table = 'PERSONNEL_RECORD'
        managed = False


class ResponsibleFor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', primary_key=True)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, db_column='program_id')

    class Meta:
        db_table = 'RESPONSIBLE_FOR'
        managed = False
        unique_together = (('user', 'program'),)


class AssignedTo(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, db_column='program_id', primary_key=True)
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID')

    class Meta:
        db_table = 'ASSIGNED_TO'
        managed = False
        unique_together = (('program', 'faculty'),)


class Teaches(models.Model):
    faculty = models.ForeignKey(FacultyMember, on_delete=models.CASCADE, db_column='Faculty_ID', primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='Course_ID')

    class Meta:
        db_table = 'TEACHES'
        managed = False
        unique_together = (('faculty', 'course'),)


class HasClo(models.Model):
    clo = models.ForeignKey(Clo, on_delete=models.CASCADE, db_column='clo_id', primary_key=True)
    syllabus = models.ForeignKey(InstructorSyllabus, on_delete=models.CASCADE, db_column='syllabus_id')

    class Meta:
        db_table = 'HAS_CLO'
        managed = False
        unique_together = (('clo', 'syllabus'),)


class MapsTo(models.Model):
    so = models.ForeignKey(StudentOutcome, on_delete=models.CASCADE, db_column='so_id', primary_key=True)
    clo = models.ForeignKey(Clo, on_delete=models.CASCADE, db_column='clo_id')

    class Meta:
        db_table = 'MAPS_TO'
        managed = False
        unique_together = (('so', 'clo'),)


class SupportsPeo(models.Model):
    so = models.ForeignKey(StudentOutcome, on_delete=models.CASCADE, db_column='so_id', primary_key=True)
    peo = models.ForeignKey(Peo, on_delete=models.CASCADE, db_column='peo_id')

    class Meta:
        db_table = 'SUPPORTS_PEO'
        managed = False
        unique_together = (('so', 'peo'),)
