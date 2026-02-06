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
          Loading Criterion 1 data...
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
        <button onClick={fetchCriterion1Data} style={{
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
  <div style={{ 
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'inherit'
  }}>
    {/* HEADER - Burgundy bar with title and back button */}
    <div style={{
      backgroundColor: '#8b1538',
      color: 'white',
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Left side: Menu + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ☰
        </button>

        {/* Circle Icon */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid white',
          backgroundColor: 'transparent'
        }}>
        </div>
        

        {/* Title and Subtitle */}
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            margin: '0 0 4px 0'
          }}>
            Criterion 1 - Students
          </h1>
          <p style={{ 
            fontSize: '14px', 
            margin: 0,
            opacity: 0.9
          }}>
            CCE - ABET 2025-2027
          </p>
        </div>
      </div>
      
      {/* Right side: Back to Checklist button */}
      <button
        onClick={onBack}
        style={{
          backgroundColor: 'transparent',
          border: '2px solid white',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ← Back to Checklist
      </button>
      
    </div>

    

    {/* MAIN CONTENT AREA */}
    <div style={{ padding: '40px' }}>
      {/* Top Save Bar */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          All changes are automatically updated to the database when you click Save.
        </p>
        <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              backgroundColor: saving ? '#6c757d' : '#8b1538',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
      </div>

      {/* Success/Error Messages */}
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

      {/* Section A: Student Admissions */}
      <Section
        letter="A"
        title="Student Admissions"
        purpose="describe how new students are accepted into the program."
        uploadText="Upload admission policy / catalog / handbook"
        aiText="AI Extract admissions summary"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <FormField
            label="Admission Requirements"
            value={data?.admission_requirements || ''}
            onChange={(value) => handleChange('admission_requirements', value)}
            placeholder="Admission Requirements (e.g., grades, entrance exams)"
            multiline
            rows={6}
          />
          <FormField
            label="Admission Process Summary"
            value={data?.admission_process_summary || ''}
            onChange={(value) => handleChange('admission_process_summary', value)}
            placeholder="Admission Process Summary (e.g., online application, interview, etc.)"
            multiline
            rows={6}
          />
          <FormField
            label="Transfer Pathways"
            value={data?.transfer_pathways || ''}
            onChange={(value) => handleChange('transfer_pathways', value)}
            placeholder="Transfer Pathways (if applicable)"
            multiline
            rows={6}
          />
        </div>
      </Section>

      {/* Section B: Evaluating Student Performance */}
      <Section
        letter="B"
        title="Evaluating Student Performance"
        purpose="explain how the program tracks and evaluates student progress."
        uploadText="Upload assessment procedures / advising guidelines"
        aiText="AI Extract performance rules"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <FormField
            label="Process for evaluating academic performance"
            value={data?.pperformance_evaluation_process || ''}
            onChange={(value) => handleChange('pperformance_evaluation_process', value)}
            placeholder="Process for evaluating academic performance"
            multiline
            rows={6}
          />
          <FormField
            label="How prerequisites are verified"
            value={data?.prerequisite_verification_method || ''}
            onChange={(value) => handleChange('prerequisite_verification_method', value)}
            placeholder="How prerequisites are verified"
            multiline
            rows={6}
          />
          <FormField
            label="What happens when prerequisites are not met"
            value={data?.prerequisite_not_met_action || ''}
            onChange={(value) => handleChange('prerequisite_not_met_action', value)}
            placeholder="What happens when prerequisites are not met"
            multiline
            rows={6}
          />
        </div>
      </Section>

      {/* Section C: Transfer Students and Transfer Courses */}
      <Section
        letter="C"
        title="Transfer Students and Transfer Courses"
        purpose="describe how transfer students and courses are handled."
        uploadText="Upload transfer policy / articulation agreements"
        aiText="AI Extract transfer process"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <FormField
            label="Transfer policy summary"
            value={data?.transfer_policy_summary || ''}
            onChange={(value) => handleChange('transfer_policy_summary', value)}
            placeholder="Transfer policy summary"
            multiline
            rows={6}
          />
          <FormField
            label="Evaluation process for transfer credits"
            value={data?.transfer_credit_evaluation_process || ''}
            onChange={(value) => handleChange('transfer_credit_evaluation_process', value)}
            placeholder="Evaluation process for transfer credits"
            multiline
            rows={6}
          />
          <FormField
            label="State or institutional articulation agreements"
            value={data?.articulation_agreements || ''}
            onChange={(value) => handleChange('articulation_agreements', value)}
            placeholder="State or institutional articulation agreements"
            multiline
            rows={6}
          />
        </div>
      </Section>

      {/* Section D: Advising and Career Guidance */}
      <Section
        letter="D"
        title="Advising and Career Guidance"
        purpose="summarize how students are advised academically and professionally."
        uploadText="Upload advising policy / career center overview"
        aiText="AI Extract advising details"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <FormField
            label="Who provides advising"
            value={data?.advising_providers || ''}
            onChange={(value) => handleChange('advising_providers', value)}
            placeholder="Who provides advising (faculty, department, college advisor, etc.)"
            multiline
            rows={6}
          />
          <FormField
            label="How often advising sessions occur"
            value={data?.advising_frequency || ''}
            onChange={(value) => handleChange('advising_frequency', value)}
            placeholder="How often advising sessions occur"
            multiline
            rows={6}
          />
          <FormField
            label="Description of career guidance services"
            value={data?.career_guidance_description || ''}
            onChange={(value) => handleChange('career_guidance_description', value)}
            placeholder="Description of career guidance services"
            multiline
            rows={6}
          />
        </div>
        <p style={{ 
          fontSize: '13px', 
          color: '#6c757d', 
          marginTop: '16px',
          fontStyle: 'italic'
        }}>
          Connected Feature: aligns with advising resources and evidence already uploaded; can reuse data from faculty and career center materials.
        </p>
      </Section>

      {/* Section E: Work in Lieu of Courses */}
      <Section
        letter="E"
        title="Work in Lieu of Courses"
        purpose="explain how students can get credit for prior learning or experiences."
        uploadText="Upload institutional credit policy / regulations"
        aiText="AI Extract substitutions"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormField
            label="Work experience policies"
            value={data?.work_in_lieu_policies || ''}
            onChange={(value) => handleChange('work_in_lieu_policies', value)}
            placeholder="Policies for advanced placement, test-out, dual enrollment, or work experience"
            multiline
            rows={6}
          />
          <FormField
            label="Approval process and documentation"
            value={data?.work_in_lieu_approval_process || ''}
            onChange={(value) => handleChange('work_in_lieu_approval_process', value)}
            placeholder="Approval process and documentation required"
            multiline
            rows={6}
          />
        </div>
        <p style={{ 
          fontSize: '13px', 
          color: '#6c757d', 
          marginTop: '16px',
          fontStyle: 'italic'
        }}>
          Connected Feature: aligns with advising resources and evidence already uploaded; can reuse data from faculty and career center materials.
        </p>
      </Section>

      {/* Section F: Graduation Requirements */}
      <Section
        letter="F"
        title="Graduation Requirements"
        purpose="explain what students must complete to graduate."
        uploadText="Upload graduation requirements / catalog"
        aiText="AI Extract graduation rules"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
          <FormField
            label="Minimum required credits"
            value={data?.minimum_required_credits || 0}
            onChange={(value) => handleChange('minimum_required_credits', parseInt(value) || 0)}
            type="number"
            placeholder="Minimum required credits"
          />
          <FormField
            label="Required GPA or standing"
            value={data?.required_gpa_or_standing || ''}
            onChange={(value) => handleChange('required_gpa_or_standing', value)}
            placeholder="Required GPA or standing"
          />
          <FormField
            label="List of essential courses / categories"
            value={data?.essential_courses_categories || ''}
            onChange={(value) => handleChange('essential_courses_categories', value)}
            placeholder="List of essential courses / categories"
            multiline
            rows={3}
          />
          <FormField
            label="Degree name"
            value={data?.degree_name || ''}
            onChange={(value) => handleChange('degree_name', value)}
            placeholder="Degree name (e.g., Bachelor of Engineering in CCE)"
          />
        </div>
        <p style={{ 
          fontSize: '13px', 
          color: '#6c757d', 
          marginTop: '16px',
          fontStyle: 'italic'
        }}>
          Connected Feature: pulls total credits and curriculum details directly from Curriculum Overview in Background Info and Courses section (Table 5-1).
        </p>
      </Section>

      {/* Section G: Transcripts of Recent Graduates */}
      <Section
        letter="G"
        title="Transcripts of Recent Graduates"
        purpose="mention how graduate transcripts are provided and how program options appear on them."
        uploadText="Upload anonymized sample transcripts"
        aiText="AI Extract transcript details"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormField
            label="Explanation of transcript format"
            value={data?.transcript_format_explanation || ''}
            onChange={(value) => handleChange('transcript_format_explanation', value)}
            placeholder="Explanation of transcript format"
            multiline
            rows={6}
          />
          <FormField
            label="Statement of how degree/program name appears"
            value={data?.program_name_on_transcript || ''}
            onChange={(value) => handleChange('program_name_on_transcript', value)}
            placeholder="Statement of how degree/program name appears"
            multiline
            rows={6}
          />
        </div>
      </Section>
    </div>
  </div>
);
};

// Section Component
const Section = ({ letter, title, purpose, uploadText, aiText, children }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '32px',
      marginBottom: '24px'
    }}>
      {/* Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '22px', 
          fontWeight: '600', 
          color: '#2c3e50',
          margin: '0 0 8px 0'
        }}>
          {letter}. {title}
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#6c757d',
          margin: '0 0 16px 0'
        }}>
          Purpose: {purpose}
        </p>

        {/* Action Buttons - NO EMOJIS */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '2px dashed #8b1538',
            borderRadius: '6px',
            color: '#8b1538',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            ↑ {uploadText}
          </button>
          
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '2px dashed #8b1538',
            borderRadius: '6px',
            color: '#8b1538',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            ★ {aiText}
          </button>
        </div>
      </div>

      {/* Section Content */}
      {children}
    </div>
  );
};

// Keep your existing FormField component (with placeholder support)
const FormField = ({ label, value, onChange, multiline = false, type = 'text', rows = 4, placeholder = '' }) => {
  return (
    <div style={{ marginBottom: '0' }}>
      <label style={{
        display: 'block', fontSize: '14px', fontWeight: '600',
        color: '#2c3e50', marginBottom: '8px'
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
            border: '1px solid #dee2e6',
            borderRadius: '6px', fontSize: '14px',
            fontFamily: 'inherit', resize: 'vertical',
            color: '#2c3e50'
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
            border: '1px solid #dee2e6',
            borderRadius: '6px', fontSize: '14px',
            fontFamily: 'inherit', color: '#2c3e50'
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
        <div style={{ fontSize: '18px', color: '#6c757d' }}>
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
          padding: '10px 20px', backgroundColor: '#0066cc',
          color: 'white', border: 'none', borderRadius: '6px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '600'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'inherit'
    }}>
      {/* HEADER - Burgundy bar */}
      <div style={{
        backgroundColor: '#8b1538',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ≡
          </button>

          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid white',
            backgroundColor: 'transparent'
          }} />

          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              margin: '0 0 4px 0'
            }}>
              Criterion 2 - Program Educational Objectives
            </h1>
            <p style={{ 
              fontSize: '14px', 
              margin: 0,
              opacity: 0.9
            }}>
              CCE - ABET 2025-2027
            </p>
          </div>
        </div>

        {/* Right side */}
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'transparent',
            border: '2px solid white',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ← Back to Checklist
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: '40px' }}>
        {/* Title Bar */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#2c3e50',
              margin: '0 0 8px 0'
            }}>
              Program Educational Objectives Workspace
            </h2>
            <p style={{ 
              fontSize: '15px', 
              color: '#6c757d',
              margin: 0
            }}>
              Sections A–E with editable fields, uploads, and AI auto-fill support for mission, PEOs, alignment, constituencies, and review process.
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #dee2e6'
          }}>
            <div style={{ fontSize: '14px', color: '#2c3e50' }}>
              <strong>Program:</strong> <span style={{ color: '#8b1538' }}>Computer & Communication Engineering</span>
              {' • '}
              <strong>Cycle:</strong> <span style={{ color: '#8b1538' }}>ABET 2025–2026</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  backgroundColor: saving ? '#6c757d' : '#8b1538',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ✓ Mark as Complete
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{
            padding: '12px 16px', backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb', borderRadius: '6px',
            color: '#155724', marginBottom: '20px', fontSize: '14px'
          }}>
            Saved successfully!
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb', borderRadius: '6px',
            color: '#721c24', marginBottom: '20px', fontSize: '14px'
          }}>
            Error: {error}
          </div>
        )}

        {/* Section A: Mission Statement */}
        <Section
          letter="A"
          title="Mission Statement"
          purpose="show the university or program mission statement with source or link."
          uploadText="Upload Strategic Plan / Mission Doc"
          aiText="AI Extract mission"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <FormField
              label="Institutional Mission Statement"
              value={data?.institutional_mission_statement || ''}
              onChange={(value) => handleChange('institutional_mission_statement', value)}
              placeholder="Institutional Mission Statement"
              multiline
              rows={6}
            />
            <FormField
              label="Program Mission Statement (if different)"
              value={data?.program_mission_statement || ''}
              onChange={(value) => handleChange('program_mission_statement', value)}
              placeholder="Program Mission Statement (if different)"
              multiline
              rows={6}
            />
            <FormField
              label="Source or link (published URL)"
              value={data?.mission_source_link || ''}
              onChange={(value) => handleChange('mission_source_link', value)}
              placeholder="Source or link (published URL)"
              multiline
              rows={6}
            />
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: '#6c757d', 
            marginTop: '16px',
            fontStyle: 'italic'
          }}>
            Connected Feature: auto-fills from Background Information if already captured.
          </p>
        </Section>

        {/* Section B: Program Educational Objectives (PEOs) */}
        <Section
          letter="B"
          title="Program Educational Objectives (PEOs)"
          purpose="list long-term objectives and where they are published."
          uploadText="Upload PEO Review Report / Brochure"
          aiText="AI Extract PEOs"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <FormField
              label="Editable list of PEOs"
              value={data?.peos_list || ''}
              onChange={(value) => handleChange('peos_list', value)}
              placeholder="Editable list of PEOs"
              multiline
              rows={6}
            />
            <FormField
              label="Short descriptions under each objective (optional)"
              value={data?.peos_short_descriptions || ''}
              onChange={(value) => handleChange('peos_short_descriptions', value)}
              placeholder="Short descriptions under each objective (optional)"
              multiline
              rows={6}
            />
            <FormField
              label="Where PEOs are published (URL or document name)"
              value={data?.peos_publication_location || ''}
              onChange={(value) => handleChange('peos_publication_location', value)}
              placeholder="Where PEOs are published (URL or document name)"
              multiline
              rows={6}
            />
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: '#6c757d', 
            marginTop: '16px',
            fontStyle: 'italic'
          }}>
            Connected Feature: links later to Criterion 3 mapping (Student Outcomes → PEOs).
          </p>
        </Section>

        {/* Section C: Consistency of PEOs with Institutional Mission */}
        <Section
          letter="C"
          title="Consistency of PEOs with Institutional Mission"
          purpose="explain how objectives support the university mission."
          uploadText="Upload Strategic Alignment Docs"
          aiText="AI Summarize alignment"
        >
          <FormField
            label="How our program's objectives align with the institutional mission"
            value={data?.peos_mission_alignment_explanation || ''}
            onChange={(value) => handleChange('peos_mission_alignment_explanation', value)}
            placeholder="How our program's objectives align with the institutional mission"
            multiline
            rows={6}
          />
        </Section>

        {/* Section D: Program Constituencies */}
        <Section
          letter="D"
          title="Program Constituencies"
          purpose="identify constituencies and describe how each contributes to PEOs."
          uploadText="Upload Advisory Minutes / Stakeholder Reports"
          aiText="AI Identify constituencies"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FormField
              label="List of constituencies (students, alumni, employers, faculty, advisory board, etc.)"
              value={data?.constituencies_list || ''}
              onChange={(value) => handleChange('constituencies_list', value)}
              placeholder="List of constituencies (students, alumni, employers, faculty, advisory board, etc.)"
              multiline
              rows={6}
            />
            <FormField
              label="How each group contributes to developing or reviewing PEOs"
              value={data?.constituencies_contribution_description || ''}
              onChange={(value) => handleChange('constituencies_contribution_description', value)}
              placeholder="How each group contributes to developing or reviewing PEOs"
              multiline
              rows={6}
            />
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: '#6c757d', 
            marginTop: '16px',
            fontStyle: 'italic'
          }}>
            Connected Feature: can pull stakeholder names from Evidence Uploads and sidebar lists.
          </p>
        </Section>

        {/* Section E: Process for Review of PEOs */}
        <Section
          letter="E"
          title="Process for Review of PEOs"
          purpose="describe review cadence, participants, feedback collection, and changes."
          uploadText="Upload review process documents"
          aiText="AI Extract timeline & actions"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
            <FormField
              label="Frequency of review (e.g., every 3 years)"
              value={data?.peo_review_frequency || ''}
              onChange={(value) => handleChange('peo_review_frequency', value)}
              placeholder="Frequency of review (e.g., every 3 years)"
              multiline
              rows={6}
            />
            <FormField
              label="Who is involved (faculty, alumni, employers, advisory board)"
              value={data?.peo_review_participants || ''}
              onChange={(value) => handleChange('peo_review_participants', value)}
              placeholder="Who is involved (faculty, alumni, employers, advisory board)"
              multiline
              rows={6}
            />
            <FormField
              label="How feedback is collected and decisions are made"
              value={data?.feedback_collection_and_decision_process || ''}
              onChange={(value) => handleChange('feedback_collection_and_decision_process', value)}
              placeholder="How feedback is collected and decisions are made"
              multiline
              rows={6}
            />
            <FormField
              label="Changes made since last review"
              value={data?.changes_since_last_peo_review || ''}
              onChange={(value) => handleChange('changes_since_last_peo_review', value)}
              placeholder="Changes made since last review"
              multiline
              rows={6}
            />
          </div>
          <p style={{ 
            fontSize: '13px', 
            color: '#6c757d', 
            marginTop: '16px',
            fontStyle: 'italic'
          }}>
            Connected Feature: links to stakeholder evidence and previous PEO versions.
          </p>
        </Section>
      </div>
    </div>
  );
};

// Keep the same Section and FormField components from Criterion1Page

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