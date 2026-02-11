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

    class Meta:
        db_table = 'ACCREDIATION_CYCLE'

    def __str__(self):
        return f"Cycle {self.start_year}-{self.end_year}"


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
