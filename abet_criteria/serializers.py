from rest_framework import serializers
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
)


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
