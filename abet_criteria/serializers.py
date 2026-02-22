from rest_framework import serializers
from .models import (
    Criterion1Students,
    Criterion2Peos,
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
)


class Criterion1StudentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion1Students
        fields = '__all__'


class Criterion2PeosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion2Peos
        fields = '__all__'
        extra_kwargs = {
            'institutional_mission_statement': {'required': False, 'allow_blank': True},
            'program_mission_statement': {'required': False, 'allow_blank': True},
            'mission_source_link': {'required': False, 'allow_blank': True},
            'peos_list': {'required': False, 'allow_blank': True},
            'peos_short_descriptions': {'required': False, 'allow_blank': True},
            'peos_publication_location': {'required': False, 'allow_blank': True},
            'peos_mission_alignment_explanation': {'required': False, 'allow_blank': True},
            'constituencies_list': {'required': False, 'allow_blank': True},
            'constituencies_contribution_description': {'required': False, 'allow_blank': True},
            'peo_review_frequency': {'required': False, 'allow_blank': True},
            'peo_review_participants': {'required': False, 'allow_blank': True},
            'feedback_collection_and_decision_process': {'required': False, 'allow_blank': True},
            'changes_since_last_peo_review': {'required': False, 'allow_blank': True},
        }


class BackgroundInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackgroundInfo
        fields = '__all__'
        extra_kwargs = {
            'program_contact_name': {'required': False, 'allow_blank': True},
            'contact_title': {'required': False, 'allow_blank': True},
            'office_location': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'email_address': {'required': False, 'allow_blank': True},
            'year_implemented': {'required': False},
            'last_general_review_date': {'required': False},
            'summary_of_major_changes': {'required': False, 'allow_blank': True},
        }


class AppendixCEquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppendixCEquipment
        fields = '__all__'


class EquipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentItem
        fields = '__all__'


# ============================================================================
# CRITERION 7 SERIALIZERS
# ============================================================================

class ClassroomsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classrooms
        fields = '__all__'


class LaboratoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Laboratories
        fields = '__all__'


class ComputingResourcesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComputingResources
        fields = '__all__'


class UpgradingFacilitiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UpgradingFacilities
        fields = '__all__'


class Criterion7FacilitiesSerializer(serializers.ModelSerializer):
    classrooms = ClassroomsSerializer(many=True, read_only=True)
    laboratories = LaboratoriesSerializer(many=True, read_only=True)
    computing_resources = ComputingResourcesSerializer(many=True, read_only=True)
    upgrading_facilities = UpgradingFacilitiesSerializer(many=True, read_only=True)
    
    class Meta:
        model = Criterion7Facilities
        fields = '__all__'


# ============================================================================
# CRITERION 8 SERIALIZERS
# ============================================================================

class StaffingRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffingRow
        fields = '__all__'


class Criterion8InstitutionalSupportSerializer(serializers.ModelSerializer):
    staffing_rows = StaffingRowSerializer(many=True, read_only=True)
    
    class Meta:
        model = Criterion8InstitutionalSupport
        fields = '__all__'
        extra_kwargs = {
            'leadership_structure_description': {'required': False, 'allow_blank': True},
            'leadership_adequacy_description': {'required': False, 'allow_blank': True},
            'leadership_participation_description': {'required': False, 'allow_blank': True},
            'budget_process_continuity': {'required': False, 'allow_blank': True},
            'teaching_support_description': {'required': False, 'allow_blank': True},
            'infrastructure_funding_description': {'required': False, 'allow_blank': True},
            'resource_adequacy_description': {'required': False, 'allow_blank': True},
            'hiring_process_description': {'required': False, 'allow_blank': True},
            'retention_strategies_description': {'required': False, 'allow_blank': True},
            'professional_development_support_types': {'required': False, 'allow_blank': True},
            'professional_development_request_process': {'required': False, 'allow_blank': True},
            'professional_development_funding_details': {'required': False, 'allow_blank': True},
            'additional_narrative_on_staffing': {'required': False, 'allow_blank': True},
        }


# ============================================================================
# SUPPORTING SERIALIZERS
# ============================================================================

class EvidenceFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenceFile
        fields = '__all__'


class AccreditationCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccreditationCycle
        fields = '__all__'


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = '__all__'


class FacultyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyMember
        fields = '__all__'
