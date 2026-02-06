import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import { colors } from '../styles/theme';

// ========================================
// CRITERION 1 PAGE - FULLY INTEGRATED
// ========================================
export const Criterion1Page = ({ onToggleSidebar, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Get cycle ID from localStorage or default to 1
  const cycleId = localStorage.getItem('currentCycleId') || 1;

  useEffect(() => {
    fetchCriterion1Data();
  }, [cycleId]);

  const fetchCriterion1Data = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest(`/cycles/${cycleId}/criterion1/`);
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch Criterion 1 data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await apiRequest(`/cycles/${cycleId}/criterion1/`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setData(result);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Save failed: ' + err.message);
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'inherit'
      }}>
        <div style={{ fontSize: '18px', color: colors.mediumGray }}>
          Loading Criterion 1 data...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'inherit'
      }}>
        <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '20px' }}>
          Error: {error}
        </div>
        <button 
          onClick={fetchCriterion1Data}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.primary || '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: colors.darkGray || '#2c3e50',
            margin: '0 0 8px 0'
          }}>
            Criterion 1: Students
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: colors.mediumGray || '#6c757d',
            margin: 0
          }}>
            Student performance and support information
          </p>
        </div>
        
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '10px 16px',
            backgroundColor: colors.lightGray || '#f8f9fa',
            border: `1px solid ${colors.border || '#dee2e6'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ☰ Menu
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px',
          color: '#155724',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ✓ Saved successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          color: '#721c24',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ✗ {error}
        </div>
      )}

      {/* Form */}
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '30px'
      }}>
        {/* Section 1: Admission Requirements */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Admission Requirements
          </h2>
          
          <FormField
            label="Admission Requirements"
            value={data?.admission_requirements || ''}
            onChange={(value) => handleChange('admission_requirements', value)}
            multiline
          />
          
          <FormField
            label="Admission Process Summary"
            value={data?.admission_process_summary || ''}
            onChange={(value) => handleChange('admission_process_summary', value)}
            multiline
          />
          
          <FormField
            label="Transfer Pathways"
            value={data?.transfer_pathways || ''}
            onChange={(value) => handleChange('transfer_pathways', value)}
            multiline
          />
        </div>

        {/* Section 2: Performance Evaluation */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Performance Evaluation
          </h2>
          
          <FormField
            label="Performance Evaluation Process"
            value={data?.pperformance_evaluation_process || ''}
            onChange={(value) => handleChange('pperformance_evaluation_process', value)}
            multiline
          />
          
          <FormField
            label="Prerequisite Verification Method"
            value={data?.prerequisite_verification_method || ''}
            onChange={(value) => handleChange('prerequisite_verification_method', value)}
            multiline
          />
          
          <FormField
            label="Prerequisite Not Met Action"
            value={data?.prerequisite_not_met_action || ''}
            onChange={(value) => handleChange('prerequisite_not_met_action', value)}
            multiline
          />
        </div>

        {/* Section 3: Transfer Policies */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Transfer Policies
          </h2>
          
          <FormField
            label="Transfer Policy Summary"
            value={data?.transfer_policy_summary || ''}
            onChange={(value) => handleChange('transfer_policy_summary', value)}
            multiline
          />
          
          <FormField
            label="Transfer Credit Evaluation Process"
            value={data?.transfer_credit_evaluation_process || ''}
            onChange={(value) => handleChange('transfer_credit_evaluation_process', value)}
            multiline
          />
          
          <FormField
            label="Articulation Agreements"
            value={data?.articulation_agreements || ''}
            onChange={(value) => handleChange('articulation_agreements', value)}
            multiline
          />
        </div>

        {/* Section 4: Advising & Career Guidance */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Advising & Career Guidance
          </h2>
          
          <FormField
            label="Advising Providers"
            value={data?.advising_providers || ''}
            onChange={(value) => handleChange('advising_providers', value)}
            multiline
          />
          
          <FormField
            label="Advising Frequency"
            value={data?.advising_frequency || ''}
            onChange={(value) => handleChange('advising_frequency', value)}
          />
          
          <FormField
            label="Career Guidance Description"
            value={data?.career_guidance_description || ''}
            onChange={(value) => handleChange('career_guidance_description', value)}
            multiline
          />
        </div>

        {/* Section 5: Work in Lieu Policies */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Work in Lieu Policies
          </h2>
          
          <FormField
            label="Work in Lieu Policies"
            value={data?.work_in_lieu_policies || ''}
            onChange={(value) => handleChange('work_in_lieu_policies', value)}
            multiline
          />
          
          <FormField
            label="Work in Lieu Approval Process"
            value={data?.work_in_lieu_approval_process || ''}
            onChange={(value) => handleChange('work_in_lieu_approval_process', value)}
            multiline
          />
        </div>

        {/* Section 6: Graduation Requirements */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Graduation Requirements
          </h2>
          
          <FormField
            label="Minimum Required Credits"
            value={data?.minimum_required_credits || 0}
            onChange={(value) => handleChange('minimum_required_credits', parseInt(value) || 0)}
            type="number"
          />
          
          <FormField
            label="Required GPA or Standing"
            value={data?.required_gpa_or_standing || ''}
            onChange={(value) => handleChange('required_gpa_or_standing', value)}
          />
          
          <FormField
            label="Essential Courses Categories"
            value={data?.essential_courses_categories || ''}
            onChange={(value) => handleChange('essential_courses_categories', value)}
            multiline
          />
        </div>

        {/* Section 7: Degree Information */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.darkGray || '#2c3e50',
            marginBottom: '20px'
          }}>
            Degree Information
          </h2>
          
          <FormField
            label="Degree Name"
            value={data?.degree_name || ''}
            onChange={(value) => handleChange('degree_name', value)}
          />
          
          <FormField
            label="Program Name on Transcript"
            value={data?.program_name_on_transcript || ''}
            onChange={(value) => handleChange('program_name_on_transcript', value)}
          />
          
          <FormField
            label="Transcript Format Explanation"
            value={data?.transcript_format_explanation || ''}
            onChange={(value) => handleChange('transcript_format_explanation', value)}
            multiline
          />
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.border || '#dee2e6'}`
        }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: colors.darkGray || '#2c3e50',
              border: `1px solid ${colors.border || '#dee2e6'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Back to Checklist
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? (colors.mediumGray || '#6c757d') : (colors.primary || '#0066cc'),
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// FORM FIELD HELPER COMPONENT
// ========================================
const FormField = ({ label, value, onChange, multiline = false, type = 'text', rows = 4, placeholder = '' }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block', fontSize: '14px', fontWeight: '600',
        color: colors.darkGray || '#2c3e50', marginBottom: '8px'
      }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 12px',
            border: `1px solid ${colors.border || '#dee2e6'}`,
            borderRadius: '6px', fontSize: '14px',
            fontFamily: 'inherit', resize: 'vertical'
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 12px',
            border: `1px solid ${colors.border || '#dee2e6'}`,
            borderRadius: '6px', fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      )}
    </div>
  );
};

// ========================================
// CRITERION 2-8 PAGES (PLACEHOLDERS)
// ========================================
export const Criterion2Page = ({ onToggleSidebar, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const cycleId = localStorage.getItem('currentCycleId') || 1;

  useEffect(() => {
    fetchCriterion2Data();
  }, [cycleId]);

  const fetchCriterion2Data = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest(`/cycles/${cycleId}/criterion2/`);
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch Criterion 2 data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await apiRequest(`/cycles/${cycleId}/criterion2/`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      setData(result);
      setSuccess(true);
      
      // Trigger checklist refresh
      localStorage.setItem('checklistNeedsRefresh', 'true');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Save failed: ' + err.message);
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'inherit' }}>
        <div style={{ fontSize: '18px', color: colors.mediumGray || '#6c757d' }}>
          Loading Criterion 2 data...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'inherit' }}>
        <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '20px' }}>
          Error: {error}
        </div>
        <button onClick={fetchCriterion2Data} style={{
          padding: '10px 20px', backgroundColor: colors.primary || '#0066cc',
          color: 'white', border: 'none', borderRadius: '6px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: '0 0 8px 0' }}>
            Criterion 2: Program Educational Objectives
          </h1>
          <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d', margin: 0 }}>
            Program mission, PEOs, and continuous review process
          </p>
        </div>
        
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px', backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`, borderRadius: '6px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb', borderRadius: '6px',
          color: '#155724', marginBottom: '20px', fontSize: '14px'
        }}>
          ✓ Saved successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb', borderRadius: '6px',
          color: '#721c24', marginBottom: '20px', fontSize: '14px'
        }}>
          ✗ {error}
        </div>
      )}

      {/* Form */}
      <div style={{ backgroundColor: 'white', border: `1px solid ${colors.border || '#dee2e6'}`, borderRadius: '8px', padding: '30px' }}>
        
        {/* Section 1: Mission Statements */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.darkGray || '#2c3e50', marginBottom: '20px' }}>
            Mission Statements
          </h2>
          
          <FormField
            label="Institutional Mission Statement"
            value={data?.institutional_mission_statement || ''}
            onChange={(value) => handleChange('institutional_mission_statement', value)}
            multiline
            rows={3}
          />
          
          <FormField
            label="Program Mission Statement"
            value={data?.program_mission_statement || ''}
            onChange={(value) => handleChange('program_mission_statement', value)}
            multiline
            rows={3}
          />
          
          <FormField
            label="Mission Source Link"
            value={data?.mission_source_link || ''}
            onChange={(value) => handleChange('mission_source_link', value)}
            placeholder="https://..."
          />
        </div>

        {/* Section 2: Program Educational Objectives (PEOs) */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.darkGray || '#2c3e50', marginBottom: '20px' }}>
            Program Educational Objectives (PEOs)
          </h2>
          
          <FormField
            label="PEOs List"
            value={data?.peos_list || ''}
            onChange={(value) => handleChange('peos_list', value)}
            multiline
            rows={6}
            placeholder="List your program's educational objectives (e.g., PEO-1, PEO-2, etc.)"
          />
          
          <FormField
            label="PEOs Short Descriptions"
            value={data?.peos_short_descriptions || ''}
            onChange={(value) => handleChange('peos_short_descriptions', value)}
            multiline
            rows={6}
            placeholder="Provide brief descriptions for each PEO"
          />
        </div>

        {/* Section 3: PEO Publication & Alignment */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.darkGray || '#2c3e50', marginBottom: '20px' }}>
            PEO Publication & Mission Alignment
          </h2>
          
          <FormField
            label="PEOs Publication Location"
            value={data?.peos_publication_location || ''}
            onChange={(value) => handleChange('peos_publication_location', value)}
            multiline
            rows={3}
            placeholder="Where are the PEOs published? (e.g., website, handbook, course catalog)"
          />
          
          <FormField
            label="PEOs Mission Alignment Explanation"
            value={data?.peos_mission_alignment_explanation || ''}
            onChange={(value) => handleChange('peos_mission_alignment_explanation', value)}
            multiline
            rows={5}
            placeholder="Explain how PEOs align with the institutional and program mission"
          />
        </div>

        {/* Section 4: Constituencies */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.darkGray || '#2c3e50', marginBottom: '20px' }}>
            Constituencies
          </h2>
          
          <FormField
            label="Constituencies List"
            value={data?.constituencies_list || ''}
            onChange={(value) => handleChange('constituencies_list', value)}
            multiline
            rows={4}
            placeholder="List key constituencies (e.g., students, alumni, employers, industry advisory board)"
          />
          
          <FormField
            label="Constituencies Contribution Description"
            value={data?.constituencies_contribution_description || ''}
            onChange={(value) => handleChange('constituencies_contribution_description', value)}
            multiline
            rows={5}
            placeholder="Describe how constituencies contribute to the development of PEOs"
          />
        </div>

        {/* Section 5: PEO Review Process */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.darkGray || '#2c3e50', marginBottom: '20px' }}>
            PEO Review Process
          </h2>
          
          <FormField
            label="PEO Review Frequency"
            value={data?.peo_review_frequency || ''}
            onChange={(value) => handleChange('peo_review_frequency', value)}
            placeholder="e.g., Annually, Every 2 years, Every 3 years"
          />
          
          <FormField
            label="PEO Review Participants"
            value={data?.peo_review_participants || ''}
            onChange={(value) => handleChange('peo_review_participants', value)}
            multiline
            rows={3}
            placeholder="Who participates in the PEO review process?"
          />
          
          <FormField
            label="Feedback Collection and Decision Process"
            value={data?.feedback_collection_and_decision_process || ''}
            onChange={(value) => handleChange('feedback_collection_and_decision_process', value)}
            multiline
            rows={5}
            placeholder="Describe how feedback is collected and how decisions are made"
          />
          
          <FormField
            label="Changes Since Last PEO Review"
            value={data?.changes_since_last_peo_review || ''}
            onChange={(value) => handleChange('changes_since_last_peo_review', value)}
            multiline
            rows={5}
            placeholder="Describe any changes made to PEOs since the last review"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: `1px solid ${colors.border || '#dee2e6'}` }}>
          <button onClick={onBack} style={{
            padding: '12px 24px', backgroundColor: 'white',
            color: colors.darkGray || '#2c3e50',
            border: `1px solid ${colors.border || '#dee2e6'}`,
            borderRadius: '6px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600'
          }}>
            Back to Checklist
          </button>
          
          <button onClick={handleSave} disabled={saving} style={{
            padding: '12px 24px',
            backgroundColor: saving ? (colors.mediumGray || '#6c757d') : (colors.primary || '#0066cc'),
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: '600', opacity: saving ? 0.7 : 1
          }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Criterion3Page = ({ onToggleSidebar, onBack }) => {
  return (
    <div style={{ padding: '40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: 0 }}>
          Criterion 3: Student Outcomes
        </h1>
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px',
          backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d' }}>
          Coming soon - Backend integration in progress
        </p>
      </div>
    </div>
  );
};

export const Criterion4Page = ({ onToggleSidebar, onBack }) => {
  return (
    <div style={{ padding: '40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: 0 }}>
          Criterion 4: Continuous Improvement
        </h1>
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px',
          backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d' }}>
          Coming soon - Backend integration in progress
        </p>
      </div>
    </div>
  );
};

export const Criterion5Page = ({ onToggleSidebar, onBack }) => {
  return (
    <div style={{ padding: '40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: 0 }}>
          Criterion 5: Curriculum
        </h1>
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px',
          backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d' }}>
          Coming soon - Backend integration in progress
        </p>
      </div>
    </div>
  );
};

export const Criterion6Page = ({ onToggleSidebar, onBack }) => {
  return (
    <div style={{ padding: '40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: 0 }}>
          Criterion 6: Faculty
        </h1>
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px',
          backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d' }}>
          Coming soon - Backend integration in progress
        </p>
      </div>
    </div>
  );
};

export const Criterion7Page = ({ onToggleSidebar, onBack }) => {
  return (
    <div style={{ padding: '40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: 0 }}>
          Criterion 7: Facilities
        </h1>
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px',
          backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d' }}>
          Coming soon - Backend integration in progress
        </p>
      </div>
    </div>
  );
};

export const Criterion8Page = ({ onToggleSidebar, onBack }) => {
  return (
    <div style={{ padding: '40px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.darkGray || '#2c3e50', margin: 0 }}>
          Criterion 8: Institutional Support
        </h1>
        <button onClick={onToggleSidebar} style={{
          padding: '10px 16px',
          backgroundColor: colors.lightGray || '#f8f9fa',
          border: `1px solid ${colors.border || '#dee2e6'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ☰ Menu
        </button>
      </div>
      <div style={{ 
        backgroundColor: 'white',
        border: `1px solid ${colors.border || '#dee2e6'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: colors.mediumGray || '#6c757d' }}>
          Coming soon - Backend integration in progress
        </p>
      </div>
    </div>
  );
};