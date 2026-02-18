import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download, Save, Check, ClipboardList, FileText, Plus, Edit, Eye, Sparkles } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';
import { getActiveContext } from '../utils/activeContext';

const C1_DOCS_DB_NAME = 'abet-criterion1-documents';
const C1_DOCS_STORE = 'documents';
const C1_TRACKED_FIELDS = [
  'admission_requirements',
  'admission_process_summary',
  'transfer_pathways',
  'pperformance_evaluation_process',
  'prerequisite_verification_method',
  'prerequisite_not_met_action',
  'transfer_policy_summary',
  'transfer_credit_evaluation_process',
  'articulation_agreements',
  'advising_providers',
  'advising_frequency',
  'career_guidance_description',
  'work_in_lieu_policies',
  'work_in_lieu_approval_process',
  'minimum_required_credits',
  'required_gpa_or_standing',
  'essential_courses_categories',
  'degree_name',
  'transcript_format_explanation',
  'program_name_on_transcript',
];

const openCriterion1DocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(C1_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(C1_DOCS_STORE)) {
      const store = db.createObjectStore(C1_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_section', ['cycleId', 'sectionTitle'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open document storage.'));
});

const listCriterion1SectionDocs = async (cycleId, sectionTitle) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readonly');
    const store = tx.objectStore(C1_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));
    query.onsuccess = () => resolve(query.result || []);
    query.onerror = () => reject(query.error || new Error('Unable to read stored documents.'));
  });
};

const appendCriterion1SectionDocs = async (cycleId, sectionTitle, files) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(C1_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));
      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${sectionTitle}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          sectionTitle,
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString(),
        });
      });
    };
    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to store documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store documents.'));
  });
};

const deleteCriterion1DocById = async (docId) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readwrite');
    tx.objectStore(C1_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove document.'));
  });
};

const calculateCriterion1Completion = (payload) => {
  if (!payload) return 0;
  const completed = C1_TRACKED_FIELDS.filter((field) => {
    const value = payload[field];
    if (field === 'minimum_required_credits') {
      return Number(value) > 0;
    }
    return `${value ?? ''}`.trim() !== '';
  }).length;
  return Math.round((completed / C1_TRACKED_FIELDS.length) * 100);
};

const C2_TRACKED_FIELDS = [
  'institutional_mission_statement',
  'program_mission_statement',
  'mission_source_link',
  'peos_list',
  'peos_short_descriptions',
  'peos_publication_location',
  'peos_mission_alignment_explanation',
  'constituencies_list',
  'constituencies_contribution_description',
  'peo_review_frequency',
  'peo_review_participants',
  'feedback_collection_and_decision_process',
  'changes_since_last_peo_review'
];

const calculateCriterion2Completion = (payload) => {
  const completed = C2_TRACKED_FIELDS.filter((field) => `${payload?.[field] ?? ''}`.trim() !== '').length;
  return Math.round((completed / C2_TRACKED_FIELDS.length) * 100);
};

const C7_TRACKED_FIELDS = [
  'total_number_of_offices',
  'average_workspace_size',
  'student_availability_details',
  'guidance_description',
  'responsible_faculty_name',
  'maintenance_policy_description',
  'technical_collections_and_journals',
  'electronic_databases_and_eresources',
  'faculty_book_request_process',
  'library_access_hours_and_systems',
  'facilities_support_student_outcomes',
  'safety_and_inspection_processes',
  'compliance_with_university_policy',
];

const hasPopulatedRow = (rows, requiredFields) => rows.some((row) => requiredFields.every((field) => `${row?.[field] ?? ''}`.trim() !== ''));

const calculateCriterion7Completion = (payload, { classrooms, laboratories, computingResources, upgradingFacilities }) => {
  const scalarCompleted = C7_TRACKED_FIELDS.filter((field) => `${payload?.[field] ?? ''}`.trim() !== '').length;
  const rowChecks = [
    hasPopulatedRow(classrooms, [
      'classroom_room',
      'classroom_capacity',
      'classroom_multimedia',
      'classroom_internet_access',
      'classroom_typical_use',
      'classroom_adequacy_comments'
    ]),
    hasPopulatedRow(laboratories, [
      'lab_name',
      'lab_room',
      'lab_category',
      'lab_hardware_list',
      'lab_software_list',
      'lab_open_hours',
      'lab_courses_using_lab'
    ]),
    hasPopulatedRow(computingResources, [
      'computing_resource_name',
      'computing_resource_location',
      'computing_access_type',
      'computing_hours_available',
      'computing_adequacy_notes'
    ]),
    hasPopulatedRow(upgradingFacilities, [
      'facility_name',
      'last_upgrade_date',
      'next_scheduled_upgrade',
      'responsible_staff',
      'maintenance_notes'
    ])
  ];
  const rowsCompleted = rowChecks.filter(Boolean).length;
  const totalRequired = C7_TRACKED_FIELDS.length + rowChecks.length;
  return Math.round(((scalarCompleted + rowsCompleted) / totalRequired) * 100);
};

const C8_TRACKED_FIELDS = [
  'leadership_structure_description',
  'leadership_adequacy_description',
  'leadership_participation_description',
  'budget_process_continuity',
  'teaching_support_description',
  'infrastructure_funding_description',
  'resource_adequacy_description',
  'hiring_process_description',
  'retention_strategies_description',
  'professional_development_support_types',
  'professional_development_request_process',
  'professional_development_funding_details',
  'additional_narrative_on_staffing',
];

  const calculateCriterion8Completion = (payload) => {
  const completed = C8_TRACKED_FIELDS.filter((field) => `${payload?.[field] ?? ''}`.trim() !== '').length;
  return Math.round((completed / C8_TRACKED_FIELDS.length) * 100);
};

const DEFAULT_CRITERION8_STAFFING_ROWS = [
  {
    staffing_row_id: null,
    category: 'Administrative',
    number_of_staff: '',
    primary_role: '',
    training_retention_practices: ''
  },
  {
    staffing_row_id: null,
    category: 'Technical',
    number_of_staff: '',
    primary_role: '',
    training_retention_practices: ''
  },
  {
    staffing_row_id: null,
    category: 'Instructional Assistants',
    number_of_staff: '',
    primary_role: '',
    training_retention_practices: ''
  }
];


  const courses = [
    { id: 'cce-210', code: 'EECE 210', name: 'Circuits I' },
    { id: 'cce-320', code: 'EECE 320', name: 'Digital Systems' },
    { id: 'math-201', code: 'MATH 201', name: 'Calculus I' }
  ];

  const facultyMembers = [
    { id: 'f-1', name: 'Dr. Rami Khalil', rank: 'Associate Professor', department: 'Electrical Engineering' },
    { id: 'f-2', name: 'Dr. Lina Saab', rank: 'Assistant Professor', department: 'Computer Engineering' },
    { id: 'f-3', name: 'Dr. Omar Taha', rank: 'Professor', department: 'Mechanical Engineering' }
  ];

  const Criterion1Page = ({ onToggleSidebar, onBack }) => {
  const { subtitle } = getActiveContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [docModal, setDocModal] = useState({ open: false, sectionTitle: '' });
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [docStatus, setDocStatus] = useState('');
  
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

      const completionPercentage = calculateCriterion1Completion(result);
      let checklistItemId = result?.item;
      if (!checklistItemId) {
        const checklistResult = await apiRequest(`/cycles/${cycleId}/checklist/`);
        const criterion1Item = checklistResult?.items?.find((row) => Number(row?.criterion_number) === 1);
        checklistItemId = criterion1Item?.item_id;
      }

      if (checklistItemId) {
        const checklistItem = await apiRequest(`/checklist-items/${checklistItemId}/`, { method: 'GET' });
        await apiRequest(`/checklist-items/${checklistItemId}/`, {
          method: 'PUT',
          body: JSON.stringify({
            ...checklistItem,
            status: completionPercentage >= 100 ? 1 : 0,
            completion_percentage: completionPercentage
          })
        });
      }

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

  const openDocModal = async (sectionTitle) => {
    setDocStatus('');
    setDocModal({ open: true, sectionTitle });
    try {
      const docs = await listCriterion1SectionDocs(cycleId, sectionTitle);
      setSelectedDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
    } catch (err) {
      setSelectedDocs([]);
      setDocStatus(err?.message || 'Unable to load documents.');
    }
  };

  const closeDocModal = () => {
    setDocModal({ open: false, sectionTitle: '' });
    setSelectedDocs([]);
    setDocStatus('');
  };

  const handleDocSelection = (event) => {
    if (!docModal.sectionTitle) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    appendCriterion1SectionDocs(cycleId, docModal.sectionTitle, files)
      .then(() => listCriterion1SectionDocs(cycleId, docModal.sectionTitle))
      .then((docs) => {
        setSelectedDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setDocStatus(`${docs.length} file(s) saved for ${docModal.sectionTitle}.`);
      })
      .catch((err) => setDocStatus(err?.message || 'Unable to save documents.'));
  };

  const handleRemoveDoc = (docId) => {
    deleteCriterion1DocById(docId)
      .then(() => listCriterion1SectionDocs(cycleId, docModal.sectionTitle))
      .then((docs) => {
        setSelectedDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setDocStatus('Document removed.');
      })
      .catch((err) => setDocStatus(err?.message || 'Unable to remove document.'));
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
    <GlobalHeader
      title="Criterion 1 - Students"
      subtitle={subtitle}
      showBackButton={true}
      onToggleSidebar={onToggleSidebar}
      onBack={onBack}
    />
    {/* MAIN CONTENT AREA */}
    <div style={{ padding: '48px', maxWidth: '1500px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Students, Admissions, and Academic Progress</div>
            <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
              Document admissions, performance evaluation, transfer policies, advising, graduation, and transcript practices.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              style={{
                backgroundColor: saving ? '#6c757d' : colors.primary,
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Draft'}
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

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px', backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb', borderRadius: '6px',
          color: '#721c24', marginBottom: '20px', fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Section A: Student Admissions */}
      <Criterion1Section
        letter="A"
        title="Student Admissions"
        purpose="describe how new students are accepted into the program."
        sectionTitle="A. Student Admissions"
        onOpenUpload={openDocModal}
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
      </Criterion1Section>

      {/* Section B: Evaluating Student Performance */}
      <Criterion1Section
        letter="B"
        title="Evaluating Student Performance"
        purpose="explain how the program tracks and evaluates student progress."
        sectionTitle="B. Evaluating Student Performance"
        onOpenUpload={openDocModal}
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
      </Criterion1Section>

      {/* Section C: Transfer Students and Transfer Courses */}
      <Criterion1Section
        letter="C"
        title="Transfer Students and Transfer Courses"
        purpose="describe how transfer students and courses are handled."
        sectionTitle="C. Transfer Students and Transfer Courses"
        onOpenUpload={openDocModal}
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
      </Criterion1Section>

      {/* Section D: Advising and Career Guidance */}
      <Criterion1Section
        letter="D"
        title="Advising and Career Guidance"
        purpose="summarize how students are advised academically and professionally."
        sectionTitle="D. Advising and Career Guidance"
        onOpenUpload={openDocModal}
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
      </Criterion1Section>

      {/* Section E: Work in Lieu of Courses */}
      <Criterion1Section
        letter="E"
        title="Work in Lieu of Courses"
        purpose="explain how students can get credit for prior learning or experiences."
        sectionTitle="E. Work in Lieu of Courses"
        onOpenUpload={openDocModal}
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
      </Criterion1Section>

      {/* Section F: Graduation Requirements */}
      <Criterion1Section
        letter="F"
        title="Graduation Requirements"
        purpose="explain what students must complete to graduate."
        sectionTitle="F. Graduation Requirements"
        onOpenUpload={openDocModal}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
          <FormField
            label="Minimum required credits"
            value={data?.minimum_required_credits || 0}
            onChange={(value) => {
              const digitsOnly = `${value ?? ''}`.replace(/\D/g, '');
              handleChange('minimum_required_credits', digitsOnly === '' ? 0 : Number(digitsOnly));
            }}
            type="text"
            inputMode="numeric"
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
      </Criterion1Section>

      {/* Section G: Transcripts of Recent Graduates */}
      <Criterion1Section
        letter="G"
        title="Transcripts of Recent Graduates"
        purpose="mention how graduate transcripts are provided and how program options appear on them."
        sectionTitle="G. Transcripts of Recent Graduates"
        onOpenUpload={openDocModal}
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
      </Criterion1Section>

      {docModal.open && (
        <div
          onClick={closeDocModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 35, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1700
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: 'white',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '800' }}>AI Document Import</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{docModal.sectionTitle}</div>
              </div>
              <button onClick={closeDocModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                x
              </button>
            </div>

            <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                Select Documents
                <input type="file" multiple onChange={handleDocSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
              </label>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Selected Files
                </div>
                {selectedDocs.length === 0 ? (
                  <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {selectedDocs.map((file) => (
                      <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(file.id)}
                          style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {docStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{docStatus}</div> : null}
            </div>

            <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
              <button type="button" onClick={closeDocModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
                Extract with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

// Section Component
const Criterion1Section = ({ letter, title, purpose, sectionTitle, onOpenUpload, children }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '32px',
      marginBottom: '24px'
    }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#2c3e50', margin: '0 0 8px 0' }}>
            {letter}. {title}
          </h2>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Purpose: {purpose}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenUpload(sectionTitle)}
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 8px 20px rgba(139,21,56,0.24)'
          }}
        >
          <Upload size={16} />
          Upload & AI Auto-fill
        </button>
      </div>
      {children}
    </div>
  );
};

// Section Component
const Section = ({ letter, title, purpose, sectionTitle, onOpenUpload, children }) => {
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => onOpenUpload?.(sectionTitle)}
            style={{
            padding: '8px 12px',
            backgroundColor: colors.primary,
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Upload size={14} />
            Upload Documents
          </button>
          
        </div>
      </div>

      {/* Section Content */}
      {children}
    </div>
  );
};

// Keep your existing FormField component (with placeholder support)
const FormField = ({ label, value, onChange, multiline = false, type = 'text', rows = 4, placeholder = '', inputMode = undefined }) => {
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
          inputMode={inputMode}
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
const Criterion2Page = ({ onToggleSidebar, onBack }) => {
  const { subtitle, programName, cycleLabel } = getActiveContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [docModal, setDocModal] = useState({ open: false, sectionTitle: '' });
  const [criterion2Docs, setCriterion2Docs] = useState([]);
  const [criterion2DocStatus, setCriterion2DocStatus] = useState('');
  
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

  const openCriterion2UploadModal = async (sectionTitle) => {
    setCriterion2DocStatus('');
    setDocModal({ open: true, sectionTitle });
    try {
      const docs = await listCriterion1SectionDocs(cycleId, `Criterion2:${sectionTitle}`);
      setCriterion2Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
    } catch (err) {
      setCriterion2Docs([]);
      setCriterion2DocStatus(err?.message || 'Unable to load documents.');
    }
  };

  const closeCriterion2UploadModal = () => {
    setDocModal({ open: false, sectionTitle: '' });
    setCriterion2Docs([]);
    setCriterion2DocStatus('');
  };

  const handleCriterion2DocSelection = (event) => {
    if (!docModal.sectionTitle) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    appendCriterion1SectionDocs(cycleId, `Criterion2:${docModal.sectionTitle}`, files)
      .then(() => listCriterion1SectionDocs(cycleId, `Criterion2:${docModal.sectionTitle}`))
      .then((docs) => {
        setCriterion2Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setCriterion2DocStatus(`${docs.length} file(s) saved for ${docModal.sectionTitle}.`);
      })
      .catch((err) => setCriterion2DocStatus(err?.message || 'Unable to save documents.'));
  };

  const handleCriterion2RemoveDoc = (docId) => {
    deleteCriterion1DocById(docId)
      .then(() => listCriterion1SectionDocs(cycleId, `Criterion2:${docModal.sectionTitle}`))
      .then((docs) => {
        setCriterion2Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setCriterion2DocStatus('Document removed.');
      })
      .catch((err) => setCriterion2DocStatus(err?.message || 'Unable to remove document.'));
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

      const checklistResult = await apiRequest(`/cycles/${cycleId}/checklist/`);
      const criterion2Item = checklistResult?.items?.find((row) => Number(row?.criterion_number) === 2);
      const completionPercentage = calculateCriterion2Completion(result);
      if (criterion2Item?.item_id) {
        const checklistItem = await apiRequest(`/checklist-items/${criterion2Item.item_id}/`, { method: 'GET' });
        await apiRequest(`/checklist-items/${criterion2Item.item_id}/`, {
          method: 'PUT',
          body: JSON.stringify({
            ...checklistItem,
            status: completionPercentage >= 100 ? 1 : 0,
            completion_percentage: completionPercentage
          })
        });
      }

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
      <GlobalHeader
        title="Criterion 2 - Program Educational Objectives"
        subtitle={subtitle}
        showBackButton={true}
        onToggleSidebar={onToggleSidebar}
        onBack={onBack}
      />
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
              Sections A-E with editable fields, uploads, and AI auto-fill support for mission, PEOs, alignment, constituencies, and review process.
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingTop: '4px'
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSave()}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  backgroundColor: saving ? '#6c757d' : '#8b1538',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Draft'}
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
          sectionTitle="A. Mission Statement"
          onOpenUpload={openCriterion2UploadModal}
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
        </Section>

        {/* Section B: Program Educational Objectives (PEOs) */}
        <Section
          letter="B"
          title="Program Educational Objectives (PEOs)"
          purpose="list long-term objectives and where they are published."
          sectionTitle="B. Program Educational Objectives (PEOs)"
          onOpenUpload={openCriterion2UploadModal}
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
        </Section>

        {/* Section C: Consistency of PEOs with Institutional Mission */}
        <Section
          letter="C"
          title="Consistency of PEOs with Institutional Mission"
          purpose="explain how objectives support the university mission."
          sectionTitle="C. Consistency of PEOs with Institutional Mission"
          onOpenUpload={openCriterion2UploadModal}
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
          sectionTitle="D. Program Constituencies"
          onOpenUpload={openCriterion2UploadModal}
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
        </Section>

        {/* Section E: Process for Review of PEOs */}
        <Section
          letter="E"
          title="Process for Review of PEOs"
          purpose="describe review cadence, participants, feedback collection, and changes."
          sectionTitle="E. Process for Review of PEOs"
          onOpenUpload={openCriterion2UploadModal}
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
        </Section>

        {docModal.open && (
          <div
            onClick={closeCriterion2UploadModal}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 25, 35, 0.52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1700
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '760px',
                borderRadius: '14px',
                backgroundColor: 'white',
                boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '800' }}>Document Upload</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{docModal.sectionTitle}</div>
                </div>
                <button onClick={closeCriterion2UploadModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                  x
                </button>
              </div>

              <div style={{ padding: '16px 20px', display: 'grid', gap: '12px' }}>
                <input type="file" multiple onChange={handleCriterion2DocSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />

                <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                  {criterion2Docs.length === 0 ? (
                    <div style={{ color: colors.mediumGray, fontSize: '13px' }}>No documents uploaded yet.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {criterion2Docs.map((file) => (
                        <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: colors.darkGray, fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                            <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{file.type || 'Unknown'} - {Math.max(1, Math.round((Number(file.size || 0) / 1024)))} KB</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCriterion2RemoveDoc(file.id)}
                            style={{
                              border: `1px solid ${colors.border}`,
                              backgroundColor: 'white',
                              color: colors.mediumGray,
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontWeight: '700'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {criterion2DocStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{criterion2DocStatus}</div> : null}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={closeCriterion2UploadModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                    Close
                  </button>
                  <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
                    Extract with AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Keep the same Section and FormField components from Criterion1Page

const Criterion3Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 4 - Continuous Improvement" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Student Outcomes</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Criterion 3 focuses on what students are expected to know and be able to do by graduation.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>{getActiveContext().programName}</span> - Cycle: <span style={{ color: colors.primary }}>{getActiveContext().cycleLabel}</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>





        {/* Section A: Student Outcomes */}

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>

            <div>

              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>A. Student Outcomes</h3>

              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>List official Student Outcomes and connect them with course CLOs</p>

            </div>

            <button style={{ 

              backgroundColor: colors.primary, 

              color: 'white', 

              padding: '10px 20px', 

              borderRadius: '6px', 

              border: 'none', 

              cursor: 'pointer', 

              fontSize: '13px',

              fontWeight: '600',

              display: 'flex',

              alignItems: 'center',

              gap: '6px'

            }}>

              <Plus size={16} />

              Add New Outcome

            </button>

          </div>



          {/* SO Cards */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* SO 1 */}

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '24px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>

                <div style={{ flex: 1 }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>

                    <span style={{ backgroundColor: colors.primary, color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>SO 1</span>

                    <input type="text" value="Ability to apply knowledge of math, science and engineering" style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                  </div>

                </div>

                <button style={{ marginLeft: '12px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>

                  <Edit size={14} />

                  Edit

                </button>

              </div>



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>

                <div>

                  <div style={{ color: colors.darkGray, fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Linked Courses</div>

                  <div style={{ fontSize: '13px', color: colors.mediumGray }}>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>EECE 210</div>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>EECE 320</div>

                    <div style={{ fontWeight: '500' }}>EECE 330</div>

                  </div>

                </div>

                <div>

                  <div style={{ color: colors.darkGray, fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CLOs Covered</div>

                  <div style={{ fontSize: '13px', color: colors.mediumGray }}>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>CLO 1, CLO 3</div>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>CLO 2</div>

                    <div style={{ fontWeight: '500' }}>CLO 1, CLO 4</div>

                  </div>

                </div>

                <div>

                  <div style={{ color: colors.darkGray, fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evidence</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                    <a href="#" style={{ fontSize: '13px', color: colors.primary, textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>

                      <FileText size={14} />

                      Assessment Matrix.pdf

                    </a>

                    <button style={{ fontSize: '12px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontWeight: '600' }}>

                      + Upload Evidence

                    </button>

                  </div>

                </div>

              </div>



              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>

                <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>

                  Link Courses

                </button>

                <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>

                  AI Auto-Map

                </button>

              </div>

            </div>

          </div>

        </div>



        {/* Section C: SO to PEO Mapping */}

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ marginBottom: '24px' }}>

            <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>B. Relationship of Student Outcomes to Program Educational Objectives</h3>

            <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>Show how SOs help graduates reach the PEOs</p>

          </div>



          {/* Mapping Matrix */}

          <div style={{ overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                  <th style={{ padding: '14px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>Student Outcome</th>

                  <th style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>PEO 1</th>

                  <th style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>PEO 2</th>

                  <th style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>PEO 3</th>

                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '700' }}>PEO 4</th>

                </tr>

              </thead>

              <tbody>

                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>

                  <td style={{ padding: '14px', borderRight: `1px solid ${colors.border}`, fontWeight: '600' }}>SO 1</td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center' }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                </tr>

                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>

                  <td style={{ padding: '14px', borderRight: `1px solid ${colors.border}`, fontWeight: '600' }}>SO 2</td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center' }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                </tr>

              </tbody>

            </table>

          </div>



          <button style={{ 

            marginTop: '20px', 

            backgroundColor: colors.lightGray, 

            color: colors.primary, 

            padding: '10px 20px', 

            borderRadius: '6px', 

            border: 'none', 

            cursor: 'pointer', 

            fontSize: '13px', 

            fontWeight: '600' 

          }}>

            AI Auto-Generate Matrix

          </button>

        </div>

      </div>

    </div>

  );



  // Criterion 4 Page

  const Criterion4Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 4 - Continuous Improvement" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Assessment, Evaluation, and Continuous Improvement</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Document assessment processes, evaluation results, attainment levels, and how evidence drives program improvements.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>{getActiveContext().programName}</span> - Cycle: <span style={{ color: colors.primary }}>{getActiveContext().cycleLabel}</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Student Outcomes */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Student Outcomes</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Assessment processes, frequency, attainment targets, evaluation summaries, and how results are documented.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Assessment Plan / Instruments

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract processes & targets

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="A1. Assessment processes used (exam questions, projects, portfolios, surveys, etc.)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A2. Frequency of assessment processes (termly, annually, multi-year cycle)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A5. Documentation and data storage (repositories, dashboards, evidence library)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>



          <div style={{ marginTop: '18px', backgroundColor: colors.lightGray, borderRadius: '10px', padding: '16px', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>

              <ClipboardList size={18} color={colors.primary} />

              <div style={{ fontWeight: '800', color: colors.darkGray }}>A3-A4. Outcome Attainment Targets and Evaluation Summary</div>

            </div>

            <div style={{ overflowX: 'auto' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

                <thead>

                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                    {['Student Outcome', 'Assessment Evidence', 'Target Attainment', 'Evaluation Summary', 'Where Stored'].map((header) => (

                      <th key={header} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{header}</th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {[

                    { so: 'SO 1', evidence: 'Direct: Exam Q4, Lab 3; Indirect: Exit Survey', target: '70%+ at level 3', summary: '78% met target, minor gaps in Lab 3', stored: 'Evidence Library / SO1' },

                    { so: 'SO 2', evidence: 'Capstone rubric, design review', target: '75%+ at level 3', summary: '72% slightly below target, action planned', stored: 'Assessment Drive / Capstone' },

                    { so: 'SO 3', evidence: 'Oral presentations, peer review', target: '80%+ at level 3', summary: '84% met target', stored: 'Evidence Library / SO3' }

                  ].map((row) => (

                    <tr key={row.so} style={{ borderBottom: `1px solid ${colors.border}` }}>

                      <td style={{ padding: '10px', fontWeight: '700' }}>{row.so}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.evidence}</td>

                      <td style={{ padding: '10px' }}>{row.target}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.summary}</td>

                      <td style={{ padding: '10px' }}>{row.stored}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Plus size={14} />

                Add Outcome Row

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} />

                AI Summarize attainment

              </button>

            </div>

            <p style={{ color: colors.mediumGray, fontSize: '12px', marginTop: '10px' }}>

              Note: When courses are shared across programs, attach disaggregated outcome data per program.

            </p>

          </div>

        </div>



        {/* B. Continuous Improvement */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Continuous Improvement</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Show how evaluation results are used to improve the program and the outcomes of those changes.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload CI Logs / Meeting Minutes

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract actions

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="How evaluation results are used as input for improvement decisions" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Recent changes implemented and their impact (if re-assessed)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Future improvement plans and brief rationale" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>



          <div style={{ marginTop: '18px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                  {['Year', 'Trigger', 'Action Taken', 'Status', 'Re-assessment Result'].map((header) => (

                    <th key={header} style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>{header}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[

                  { year: '2024', trigger: 'SO2 below target', action: 'Revised lab rubric and added tutorial', status: 'Implemented', result: 'SO2 +5% next cycle' },

                  { year: '2025', trigger: 'Advisory board feedback', action: 'Added systems verification module', status: 'In progress', result: 'Pending' }

                ].map((row) => (

                  <tr key={row.year} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px', fontWeight: '700' }}>{row.year}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.trigger}</td>

                    <td style={{ padding: '12px' }}>{row.action}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.status}</td>

                    <td style={{ padding: '12px' }}>{row.result}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px' }}>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Improvement Action

            </button>

          </div>

        </div>



        {/* C. Additional Information */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Additional Information</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Assessment instruments, meeting minutes, and supporting materials available for the visit.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Supporting Evidence

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Check completeness

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '14px' }}>

            {[

              'Assessment instruments (exams, rubrics, surveys)',

              'Meeting minutes where results were evaluated',

              'Advisory board recommendations',

              'Disaggregated data by program'

            ].map((item) => (

              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: colors.lightGray }}>

                <input type="checkbox" />

                <span style={{ color: colors.darkGray, fontWeight: '600', fontSize: '13px' }}>{item}</span>

              </div>

            ))}

          </div>



          <textarea placeholder="Notes for on-site review (where files are located, access instructions, etc.)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }} />

        </div>

      </div>

    </div>

  );



  const PageTitleCard = ({ title, subtitle }) => (

    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '18px 24px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

      <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>{title}</div>

      {subtitle && (

        <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '13px', fontWeight: '500' }}>

          {subtitle}

        </p>

      )}

    </div>

  );



  // Criterion 5 Page

  const Criterion5Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 5 - Curriculum" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1500px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Program Curriculum, Syllabi, and Evidence</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Complete Table 5-1, document alignment with PEOs and SOs, and attach curriculum evidence and syllabi.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>{getActiveContext().programName}</span> - Cycle: <span style={{ color: colors.primary }}>{getActiveContext().cycleLabel}</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Program Curriculum */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Program Curriculum</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Provide the plan of study, assessment of curriculum alignment, prerequisite flowchart, and curriculum evidence.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Plan of Study / Flowchart

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract curriculum data

              </button>

            </div>

          </div>



          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>

            <div style={{ flex: '1 1 240px', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: colors.lightGray }}>

              <div style={{ fontSize: '12px', fontWeight: '700', color: colors.mediumGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Calendar</div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: colors.darkGray }}>

                  <input type="radio" name="calendarType" defaultChecked />

                  Semester

                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: colors.darkGray }}>

                  <input type="radio" name="calendarType" />

                  Quarter

                </label>

              </div>

            </div>

            <div style={{ flex: '2 1 360px', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: colors.lightGray }}>

              <div style={{ fontSize: '12px', fontWeight: '700', color: colors.mediumGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Curricular Paths / Options</div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>

                <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px' }}>General Track</button>

                <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                  <Plus size={12} />

                  Add Path

                </button>

              </div>

            </div>

          </div>



          {/* Table 5-1 */}

          <div style={{ marginTop: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table 5-1 Curriculum</div>

              <div style={{ color: colors.mediumGray, fontSize: '12px' }}>List all courses by term, include subject areas, offerings, and max enrollments.</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Course (Dept, No., Title)</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>R/E/SE</th>

                  <th colSpan={3} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Subject Area (Credit Hours)</th>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Last Two Terms Offered</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Max Section Enrollment (Last Two Terms)</th>

                </tr>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Math & Basic Sciences</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Engineering Topics</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Other</th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                </tr>

              </thead>

              <tbody>

                {[

                  { course: 'MATH 201 Calculus I', type: 'R', mbs: '3', eng: '', other: '', terms: 'Fall 2024, Fall 2025', max: '80' },

                  { course: 'PHYS 210 Physics I', type: 'R', mbs: '3', eng: '', other: '', terms: 'Fall 2024, Fall 2025', max: '70' },

                  { course: 'EECE 210 Circuits I', type: 'R', mbs: '', eng: '3', other: '', terms: 'Fall 2024, Fall 2025', max: '60' },

                  { course: 'EECE 320 Digital Systems', type: 'R', mbs: '', eng: '3', other: '', terms: 'Spring 2025, Spring 2026', max: '55' },

                  { course: 'HUMN 201 Ethics', type: 'R', mbs: '', eng: '', other: '3', terms: 'Fall 2024, Fall 2025', max: '90' }

                ].map((row) => (

                  <tr key={row.course} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.course}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.type}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.mbs}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.eng}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.other}</td>

                    <td style={{ padding: '10px' }}>{row.terms}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.max}</td>

                  </tr>

                ))}

                <tr style={{ backgroundColor: colors.lightGray }}>

                  <td style={{ padding: '10px', fontWeight: '700' }}>Totals (semester credit hours)</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>33</td>

                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>48</td>

                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>24</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px' }}></td>

                </tr>

                <tr>

                  <td style={{ padding: '10px', color: colors.mediumGray }}>Minimum semester credit hours</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px', textAlign: 'center', color: colors.mediumGray }}>30 hours</td>

                  <td style={{ padding: '10px', textAlign: 'center', color: colors.mediumGray }}>45 hours</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px' }}></td>

                </tr>

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Course Row

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Fill Table 5-1

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '18px' }}>

            <textarea placeholder="A2. How the curriculum aligns with program educational objectives" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A3. How the curriculum and prerequisites support student outcomes" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A5. Hours/depth by subject area (Math & Basic Sciences, Engineering Topics)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A6. Broad education component and how it complements technical content" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>



          <div style={{ marginTop: '18px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: colors.lightGray }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>

              <FileText size={18} color={colors.primary} />

              <div style={{ fontWeight: '800', color: colors.darkGray }}>A4. Prerequisite Flowchart / Worksheet</div>

            </div>

            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Attach a flowchart illustrating prerequisites for required courses.</p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={14} />

                Upload Flowchart

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} />

                AI Extract prerequisites

              </button>

            </div>

          </div>



          <div style={{ marginTop: '18px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: colors.lightGray }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>

              <ClipboardList size={18} color={colors.primary} />

              <div style={{ fontWeight: '800', color: colors.darkGray }}>A7. Culminating Major Design Experience</div>

            </div>

            <textarea placeholder="Describe the culminating design experience, standards used, and design constraints." style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <div style={{ marginTop: '12px', overflowX: 'auto' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

                <thead>

                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                    {['Project Title', 'Team / Identifier', 'Year'].map((header) => (

                      <th key={header} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{header}</th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {[

                    { title: 'Smart Campus Energy Monitor', team: 'Team A', year: '2025' },

                    { title: 'Low-Power IoT Gateway', team: 'Team B', year: '2025' }

                  ].map((row) => (

                    <tr key={`${row.title}-${row.team}`} style={{ borderBottom: `1px solid ${colors.border}` }}>

                      <td style={{ padding: '10px' }}>{row.title}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.team}</td>

                      <td style={{ padding: '10px' }}>{row.year}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <button style={{ marginTop: '10px', backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Project Title

            </button>

          </div>



          <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>

            <textarea placeholder="A8. Cooperative education: academic component and evaluation by faculty (if applicable)" style={{ width: '100%', minHeight: '130px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A9. Materials available for review during/prior to visit (worksamples, exams, rubrics, etc.)" style={{ width: '100%', minHeight: '130px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* B. Course Syllabi */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Course Syllabi</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                In Appendix A, include syllabi for courses that satisfy mathematics, science, and discipline-specific requirements.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Syllabi Pack

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Check coverage

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            {courses.map((course) => (

              <div key={course.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

                <div style={{ fontWeight: '700', color: colors.primary, marginBottom: '6px' }}>{course.code}</div>

                <div style={{ color: colors.darkGray, fontWeight: '600', marginBottom: '10px' }}>{course.name}</div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                    <Eye size={12} />

                    View Syllabus

                  </button>

                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                    <Upload size={12} />

                    Upload

                  </button>

                </div>

              </div>

            ))}

          </div>



          <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Course Syllabus

            </button>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Download size={14} />

              Export Appendix A Index

            </button>

          </div>

        </div>

      </div>

    </div>

  );



  // Criterion 6 Page

  const Criterion6Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 6 - Faculty" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1500px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Faculty Qualifications, Workload, and Roles</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Document faculty credentials, workload, size, professional development, and governance responsibilities.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>{getActiveContext().programName}</span> - Cycle: <span style={{ color: colors.primary }}>{getActiveContext().cycleLabel}</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Faculty Qualifications */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Faculty Qualifications</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Describe faculty credentials and coverage of curricular areas. Include resumes in Appendix B.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Faculty CVs (Appendix B)

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract credentials

              </button>

            </div>

          </div>



          <textarea

            placeholder="Narrative on faculty composition, size, credentials, and experience adequacy for the curriculum and program criteria."

            style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }}

          />



          <div style={{ marginTop: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table 6-1. Faculty Qualifications</div>

              <div style={{ color: colors.mediumGray, fontSize: '12px' }}>Complete for each faculty member; update at time of visit.</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Faculty Name</th>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Highest Degree Earned (Field, Year)</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Rank</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Academic Appointment</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FT/PT</th>

                  <th colSpan={4} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Years of Experience</th>

                </tr>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Govt/Ind. Practice</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Teaching</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>This Institution</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Prof. Reg./Cert.</th>

                </tr>

              </thead>

              <tbody>

                {[

                  { name: 'Dr. Imad Moukadam', degree: 'PhD EE, 2010', rank: 'Professor', appoint: 'Tenured', ftpt: 'FT', gov: '6', teach: '14', inst: '10', reg: 'PE' },

                  { name: 'Dr. Lina Saab', degree: 'PhD CCE, 2012', rank: 'Associate Prof.', appoint: 'Tenure-track', ftpt: 'FT', gov: '4', teach: '12', inst: '8', reg: 'None' },

                  { name: 'Dr. Ali Hassan', degree: 'PhD ECE, 2016', rank: 'Assistant Prof.', appoint: 'Tenure-track', ftpt: 'FT', gov: '2', teach: '7', inst: '5', reg: 'None' }

                ].map((row) => (

                  <tr key={row.name} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.name}</td>

                    <td style={{ padding: '10px', color: colors.mediumGray }}>{row.degree}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.rank}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.appoint}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.ftpt}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.gov}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.teach}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.inst}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.reg}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Faculty Row

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Populate Table 6-1

            </button>

          </div>

        </div>



        {/* B. Faculty Workload */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Faculty Workload</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Summarize teaching loads and workload expectations. Complete Table 6-2.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Workload Summary

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract workload

              </button>

            </div>

          </div>



          <textarea

            placeholder="Describe workload expectations (teaching, research, service) and how assignments are balanced."

            style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }}

          />



          <div style={{ marginTop: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table 6-2. Faculty Workload Summary</div>

              <div style={{ color: colors.mediumGray, fontSize: '12px' }}>List courses taught with term and year.</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Faculty Member (Name)</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>PT/FT</th>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Classes Taught (Course No./Title/Credit Hrs.) Term and Year</th>

                </tr>

              </thead>

              <tbody>

                {[

                  { name: 'Dr. Imad Moukadam', type: 'FT', classes: 'EECE 210 Circuits I (3cr) - Fall 2025; EECE 311 Signals & Systems (3cr) - Fall 2025' },

                  { name: 'Dr. Lina Saab', type: 'FT', classes: 'EECE 210 Circuits I (3cr) - Spring 2026; EECE 330 Electronics (3cr) - Spring 2026' },

                  { name: 'Dr. Ali Hassan', type: 'FT', classes: 'EECE 320 Digital Systems (3cr) - Spring 2026' }

                ].map((row) => (

                  <tr key={row.name} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.name}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.type}</td>

                    <td style={{ padding: '10px', color: colors.mediumGray }}>{row.classes}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Workload Row

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Fill Table 6-2

            </button>

          </div>

        </div>



        {/* C. Faculty Size */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Faculty Size</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Discuss size adequacy and faculty engagement with students, advising, service, development, and industry.

              </p>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Adequacy of faculty size for curriculum delivery" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Faculty involvement in advising, counseling, and student interaction" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Service activities and engagement with industry/professional practitioners" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* D. Professional Development */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Professional Development</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Provide detailed descriptions of professional development activities for each faculty member.

              </p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={16} />

              AI Summarize PD logs

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            {facultyMembers.map((faculty) => (

              <div key={faculty.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

                <div style={{ fontWeight: '700', color: colors.primary, marginBottom: '6px' }}>{faculty.name}</div>

                <div style={{ color: colors.mediumGray, fontSize: '12px', marginBottom: '10px' }}>{faculty.rank} - {faculty.department}</div>

                <textarea placeholder="Workshops, conferences, industry collaboration, certifications, sabbatical, etc." style={{ width: '100%', minHeight: '120px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />

                <button style={{ marginTop: '8px', backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                  <Upload size={12} />

                  Upload Evidence

                </button>

              </div>

            ))}

          </div>

        </div>



        {/* E. Authority and Responsibility */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Authority and Responsibility of Faculty</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Describe faculty roles in course creation, assessment, PEO/SO revision, and the roles of leadership.

              </p>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Role of faculty in course creation, modification, and evaluation" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Role of faculty in PEO/SO definition and attainment processes" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Roles of dean/provost/other leadership in these areas" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>

      </div>

    </div>

  );



  // Criterion 7 Page

  const Criterion7Page = ({ onToggleSidebar, onBack, setCurrentPage }) => {
    // State for Criterion 7 data
  const cycleId = localStorage.getItem('currentCycleId') || 1;
  const [criterion7Data, setCriterion7Data] = useState({
    criterion7_id: null,
    is_complete: false,
    total_number_of_offices: '',
    average_workspace_size: '',
    guidance_description: '',
    responsible_faculty_name: '',
    maintenance_policy_description: '',
    technical_collections_and_journals: '',
    electronic_databases_and_eresources: '',
    faculty_book_request_process: '',
    library_access_hours_and_systems: '',
    facilities_support_student_outcomes: '',
    safety_and_inspection_processes: '',
    compliance_with_university_policy: '',
    student_availability_details: '',
    cycle: null
  });
  const [classroomRows, setClassroomRows] = useState([
    {
      local_id: Date.now(),
      classroom_id: null,
      classroom_room: '',
      classroom_capacity: '',
      classroom_multimedia: '',
      classroom_internet_access: '',
      classroom_typical_use: '',
      classroom_adequacy_comments: ''
    }
  ]);
  const [laboratoryRows, setLaboratoryRows] = useState([
    {
      local_id: Date.now() + 5000,
      lab_id: null,
      lab_name: '',
      lab_room: '',
      lab_category: '',
      lab_hardware_list: '',
      lab_software_list: '',
      lab_open_hours: '',
      lab_courses_using_lab: ''
    }
  ]);
  const [computingResourceRows, setComputingResourceRows] = useState([
    {
      local_id: Date.now() + 10000,
      computing_resources_id: null,
      computing_resource_name: '',
      computing_resource_location: '',
      computing_access_type: '',
      computing_hours_available: '',
      computing_adequacy_notes: ''
    }
  ]);
  const [upgradingFacilityRows, setUpgradingFacilityRows] = useState([
    {
      local_id: Date.now() + 15000,
      facility_id: null,
      facility_name: '',
      last_upgrade_date: '',
      next_scheduled_upgrade: '',
      responsible_staff: '',
      maintenance_notes: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isCriterion7Complete, setIsCriterion7Complete] = useState(false);
  const [criterion7DocModal, setCriterion7DocModal] = useState({ open: false, sectionTitle: '' });
  const [criterion7Docs, setCriterion7Docs] = useState([]);
  const [criterion7DocStatus, setCriterion7DocStatus] = useState('');

  useEffect(() => {
    const loadCriterion7 = async () => {
      try {
        const records = await apiRequest('/criterion7/', { method: 'GET' });
        if (!Array.isArray(records) || records.length === 0) {
          return;
        }
        const matchingForCycle = records.filter(
          (row) => Number(row?.cycle) === Number(cycleId)
        );
        if (matchingForCycle.length === 0) {
          return;
        }
        const latest = matchingForCycle[matchingForCycle.length - 1];
        const criterion7Id = latest.criterion7_id;
        setCriterion7Data((prev) => ({
          ...prev,
          ...latest,
          criterion7_id: criterion7Id,
          is_complete: !!latest.is_complete,
          total_number_of_offices: latest.total_number_of_offices ?? '',
          average_workspace_size: latest.average_workspace_size ?? '',
          cycle: latest.cycle ?? null
        }));
        setIsCriterion7Complete(!!latest.is_complete);

        if (criterion7Id) {
          const classrooms = await apiRequest(`/criterion7/${criterion7Id}/classrooms/`, { method: 'GET' });
          if (Array.isArray(classrooms) && classrooms.length > 0) {
            setClassroomRows(
              classrooms.map((row, idx) => ({
                local_id: Date.now() + idx,
                classroom_id: row.classroom_id ?? null,
                classroom_room: row.classroom_room ?? '',
                classroom_capacity: row.classroom_capacity ?? '',
                classroom_multimedia: row.classroom_multimedia ?? '',
                classroom_internet_access: row.classroom_internet_access ?? '',
                classroom_typical_use: row.classroom_typical_use ?? '',
                classroom_adequacy_comments: row.classroom_adequacy_comments ?? ''
              }))
            );
          }

          const laboratories = await apiRequest(`/criterion7/${criterion7Id}/laboratories/`, { method: 'GET' });
          if (Array.isArray(laboratories) && laboratories.length > 0) {
            setLaboratoryRows(
              laboratories.map((row, idx) => ({
                local_id: Date.now() + 5000 + idx,
                lab_id: row.lab_id ?? null,
                lab_name: row.lab_name ?? '',
                lab_room: row.lab_room ?? '',
                lab_category: row.lab_category ?? '',
                lab_hardware_list: row.lab_hardware_list ?? '',
                lab_software_list: row.lab_software_list ?? '',
                lab_open_hours: row.lab_open_hours ?? '',
                lab_courses_using_lab: row.lab_courses_using_lab ?? ''
              }))
            );
          }

          if (Array.isArray(latest.computing_resources) && latest.computing_resources.length > 0) {
            setComputingResourceRows(
              latest.computing_resources.map((row, idx) => ({
                local_id: Date.now() + 10000 + idx,
                computing_resources_id: row.computing_resources_id ?? null,
                computing_resource_name: row.computing_resource_name ?? '',
                computing_resource_location: row.computing_resource_location ?? '',
                computing_access_type: row.computing_access_type ?? '',
                computing_hours_available: row.computing_hours_available ?? '',
                computing_adequacy_notes: row.computing_adequacy_notes ?? ''
              }))
            );
          }

          if (Array.isArray(latest.upgrading_facilities) && latest.upgrading_facilities.length > 0) {
            setUpgradingFacilityRows(
              latest.upgrading_facilities.map((row, idx) => ({
                local_id: Date.now() + 15000 + idx,
                facility_id: row.facility_id ?? null,
                facility_name: row.facility_name ?? '',
                last_upgrade_date: row.last_upgrade_date ?? '',
                next_scheduled_upgrade: row.next_scheduled_upgrade ?? '',
                responsible_staff: row.responsible_staff ?? '',
                maintenance_notes: row.maintenance_notes ?? ''
              }))
            );
          }
        }
      } catch (_error) {
        // Keep empty form if load fails.
      }
    };

    loadCriterion7();
  }, [cycleId]);

  const handleCriterion7Change = (field) => (event) => {
    const { value } = event.target;
    setCriterion7Data((prev) => ({ ...prev, [field]: value }));
  };

  const addClassroomRow = () => {
    setClassroomRows((prev) => [
      ...prev,
      {
        local_id: Date.now() + Math.floor(Math.random() * 1000),
        classroom_id: null,
        classroom_room: '',
        classroom_capacity: '',
        classroom_multimedia: '',
        classroom_internet_access: '',
        classroom_typical_use: '',
        classroom_adequacy_comments: ''
      }
    ]);
  };

  const removeClassroomRow = (localId) => {
    setClassroomRows((prev) => prev.filter((row) => row.local_id !== localId));
  };

  const handleClassroomChange = (localId, field) => (event) => {
    const { value } = event.target;
    setClassroomRows((prev) =>
      prev.map((row) => (row.local_id === localId ? { ...row, [field]: value } : row))
    );
  };

  const addLaboratoryRow = () => {
    setLaboratoryRows((prev) => [
      ...prev,
      {
        local_id: Date.now() + Math.floor(Math.random() * 1000),
        lab_id: null,
        lab_name: '',
        lab_room: '',
        lab_category: '',
        lab_hardware_list: '',
        lab_software_list: '',
        lab_open_hours: '',
        lab_courses_using_lab: ''
      }
    ]);
  };

  const removeLaboratoryRow = (localId) => {
    setLaboratoryRows((prev) => prev.filter((row) => row.local_id !== localId));
  };

  const handleLaboratoryChange = (localId, field) => (event) => {
    const { value } = event.target;
    setLaboratoryRows((prev) =>
      prev.map((row) => (row.local_id === localId ? { ...row, [field]: value } : row))
    );
  };

  const addComputingResourceRow = () => {
    setComputingResourceRows((prev) => [
      ...prev,
      {
        local_id: Date.now() + Math.floor(Math.random() * 1000),
        computing_resources_id: null,
        computing_resource_name: '',
        computing_resource_location: '',
        computing_access_type: '',
        computing_hours_available: '',
        computing_adequacy_notes: ''
      }
    ]);
  };

  const removeComputingResourceRow = (localId) => {
    setComputingResourceRows((prev) => prev.filter((row) => row.local_id !== localId));
  };

  const handleComputingResourceChange = (localId, field) => (event) => {
    const { value } = event.target;
    setComputingResourceRows((prev) =>
      prev.map((row) => (row.local_id === localId ? { ...row, [field]: value } : row))
    );
  };

  const addUpgradingFacilityRow = () => {
    setUpgradingFacilityRows((prev) => [
      ...prev,
      {
        local_id: Date.now() + Math.floor(Math.random() * 1000),
        facility_id: null,
        facility_name: '',
        last_upgrade_date: '',
        next_scheduled_upgrade: '',
        responsible_staff: '',
        maintenance_notes: ''
      }
    ]);
  };

  const removeUpgradingFacilityRow = (localId) => {
    setUpgradingFacilityRows((prev) => prev.filter((row) => row.local_id !== localId));
  };

  const handleUpgradingFacilityChange = (localId, field) => (event) => {
    const { value } = event.target;
    setUpgradingFacilityRows((prev) =>
      prev.map((row) => (row.local_id === localId ? { ...row, [field]: value } : row))
    );
  };

  const saveCriterion7 = async ({ markComplete = false } = {}) => {
    try {
      setLoading(true);
      setSaveError('');
      setSaveSuccess(false);

      let resolvedCycleId = Number(cycleId);
      if (!Number.isInteger(resolvedCycleId) || resolvedCycleId < 1) {
        resolvedCycleId = Number(criterion7Data?.cycle);
      }
      if (!Number.isInteger(resolvedCycleId) || resolvedCycleId < 1) {
        resolvedCycleId = 1;
      }

      const payload = {
        cycle: resolvedCycleId,
        total_number_of_offices:
          criterion7Data.total_number_of_offices === ''
            ? null
            : Number(criterion7Data.total_number_of_offices),
        average_workspace_size:
          criterion7Data.average_workspace_size === ''
            ? null
            : Number(criterion7Data.average_workspace_size),
        guidance_description: criterion7Data.guidance_description || '',
        responsible_faculty_name: criterion7Data.responsible_faculty_name || '',
        maintenance_policy_description: criterion7Data.maintenance_policy_description || '',
        technical_collections_and_journals: criterion7Data.technical_collections_and_journals || '',
        electronic_databases_and_eresources: criterion7Data.electronic_databases_and_eresources || '',
        faculty_book_request_process: criterion7Data.faculty_book_request_process || '',
        library_access_hours_and_systems: criterion7Data.library_access_hours_and_systems || '',
        facilities_support_student_outcomes: criterion7Data.facilities_support_student_outcomes || '',
        safety_and_inspection_processes: criterion7Data.safety_and_inspection_processes || '',
        compliance_with_university_policy: criterion7Data.compliance_with_university_policy || '',
        student_availability_details: criterion7Data.student_availability_details || '',
      };

      let criterion7Result = null;
      let criterion7Id = criterion7Data.criterion7_id;
      try {
        criterion7Result = criterion7Data.criterion7_id
          ? await apiRequest(`/criterion7/${criterion7Data.criterion7_id}/`, {
              method: 'PATCH',
              body: JSON.stringify(payload)
            })
          : await apiRequest('/criterion7/', {
              method: 'POST',
              body: JSON.stringify(payload)
            });

        criterion7Id = criterion7Result?.criterion7_id || criterion7Data.criterion7_id;
        setCriterion7Data((prev) => ({
          ...prev,
          criterion7_id: criterion7Id,
          cycle: resolvedCycleId,
        }));
      } catch (criterion7SaveError) {
        if (!markComplete) {
          throw criterion7SaveError;
        }
      }

      const rowsToSave = criterion7Id ? classroomRows.filter((row) =>
        [
          row.classroom_room,
          row.classroom_capacity,
          row.classroom_multimedia,
          row.classroom_internet_access,
          row.classroom_typical_use,
          row.classroom_adequacy_comments
        ].some((value) => `${value}`.trim() !== '')
      ) : [];

      for (let i = 0; i < rowsToSave.length; i += 1) {
        const row = rowsToSave[i];
        const rowNumber = i + 1;
        const required = [
          'classroom_room',
          'classroom_capacity',
          'classroom_multimedia',
          'classroom_internet_access',
          'classroom_typical_use',
          'classroom_adequacy_comments'
        ];
        const hasMissing = required.some((field) => `${row[field]}`.trim() === '');
        if (hasMissing) {
          throw new Error(`Classroom row ${rowNumber}: fill all columns before saving.`);
        }

        const classroomPayload = {
          classroom_room: row.classroom_room,
          classroom_capacity: Number(row.classroom_capacity),
          classroom_multimedia: row.classroom_multimedia,
          classroom_internet_access: row.classroom_internet_access,
          classroom_typical_use: row.classroom_typical_use,
          classroom_adequacy_comments: row.classroom_adequacy_comments,
          criterion7: criterion7Id
        };

        const savedRow = row.classroom_id
          ? await apiRequest(`/classrooms/${row.classroom_id}/`, {
              method: 'PUT',
              body: JSON.stringify(classroomPayload)
            })
          : await apiRequest('/classrooms/', {
              method: 'POST',
              body: JSON.stringify(classroomPayload)
            });

        if (!row.classroom_id && savedRow?.classroom_id) {
          setClassroomRows((prev) =>
            prev.map((r) =>
              r.local_id === row.local_id ? { ...r, classroom_id: savedRow.classroom_id } : r
            )
          );
        }
      }
      const labsToSave = criterion7Id ? laboratoryRows.filter((row) =>
        [
          row.lab_name,
          row.lab_room,
          row.lab_category,
          row.lab_hardware_list,
          row.lab_software_list,
          row.lab_open_hours,
          row.lab_courses_using_lab
        ].some((value) => `${value}`.trim() !== '')
      ) : [];

      for (let i = 0; i < labsToSave.length; i += 1) {
        const row = labsToSave[i];
        const rowNumber = i + 1;
        const required = [
          'lab_name',
          'lab_room',
          'lab_category',
          'lab_hardware_list',
          'lab_software_list',
          'lab_open_hours',
          'lab_courses_using_lab'
        ];
        const hasMissing = required.some((field) => `${row[field]}`.trim() === '');
        if (hasMissing) {
          throw new Error(`Laboratory row ${rowNumber}: fill all columns before saving.`);
        }

        const laboratoryPayload = {
          lab_name: row.lab_name,
          lab_room: row.lab_room,
          lab_category: row.lab_category,
          lab_hardware_list: row.lab_hardware_list,
          lab_software_list: row.lab_software_list,
          lab_open_hours: row.lab_open_hours,
          lab_courses_using_lab: row.lab_courses_using_lab,
          criterion7: criterion7Id
        };

        const savedLab = row.lab_id
          ? await apiRequest(`/laboratories/${row.lab_id}/`, {
              method: 'PUT',
              body: JSON.stringify(laboratoryPayload)
            })
          : await apiRequest('/laboratories/', {
              method: 'POST',
              body: JSON.stringify(laboratoryPayload)
            });

        if (!row.lab_id && savedLab?.lab_id) {
          setLaboratoryRows((prev) =>
            prev.map((r) => (r.local_id === row.local_id ? { ...r, lab_id: savedLab.lab_id } : r))
          );
        }
      }

      const computingRowsToSave = criterion7Id ? computingResourceRows.filter((row) =>
        [
          row.computing_resource_name,
          row.computing_resource_location,
          row.computing_access_type,
          row.computing_hours_available,
          row.computing_adequacy_notes
        ].some((value) => `${value}`.trim() !== '')
      ) : [];

      for (let i = 0; i < computingRowsToSave.length; i += 1) {
        const row = computingRowsToSave[i];
        const rowNumber = i + 1;
        const required = [
          'computing_resource_name',
          'computing_resource_location',
          'computing_access_type',
          'computing_hours_available',
          'computing_adequacy_notes'
        ];
        const hasMissing = required.some((field) => `${row[field]}`.trim() === '');
        if (hasMissing) {
          throw new Error(`Computing resource row ${rowNumber}: fill all columns before saving.`);
        }

        const computingPayload = {
          computing_resource_name: row.computing_resource_name,
          computing_resource_location: row.computing_resource_location,
          computing_access_type: row.computing_access_type,
          computing_hours_available: row.computing_hours_available,
          computing_adequacy_notes: row.computing_adequacy_notes,
          criterion7: criterion7Id
        };

        const savedRow = row.computing_resources_id
          ? await apiRequest(`/computing-resources/${row.computing_resources_id}/`, {
              method: 'PUT',
              body: JSON.stringify(computingPayload)
            })
          : await apiRequest('/computing-resources/', {
              method: 'POST',
              body: JSON.stringify(computingPayload)
            });

        if (!row.computing_resources_id && savedRow?.computing_resources_id) {
          setComputingResourceRows((prev) =>
            prev.map((r) =>
              r.local_id === row.local_id
                ? { ...r, computing_resources_id: savedRow.computing_resources_id }
                : r
            )
          );
        }
      }

      const upgradingRowsToSave = criterion7Id ? upgradingFacilityRows.filter((row) =>
        [
          row.facility_name,
          row.last_upgrade_date,
          row.next_scheduled_upgrade,
          row.responsible_staff,
          row.maintenance_notes
        ].some((value) => `${value}`.trim() !== '')
      ) : [];

      for (let i = 0; i < upgradingRowsToSave.length; i += 1) {
        const row = upgradingRowsToSave[i];
        const rowNumber = i + 1;
        const required = [
          'facility_name',
          'last_upgrade_date',
          'next_scheduled_upgrade',
          'responsible_staff',
          'maintenance_notes'
        ];
        const hasMissing = required.some((field) => `${row[field]}`.trim() === '');
        if (hasMissing) {
          throw new Error(`Maintenance row ${rowNumber}: fill all columns before saving.`);
        }

        const upgradingPayload = {
          facility_name: row.facility_name,
          last_upgrade_date: row.last_upgrade_date,
          next_scheduled_upgrade: row.next_scheduled_upgrade,
          responsible_staff: row.responsible_staff,
          maintenance_notes: row.maintenance_notes,
          criterion7: criterion7Id
        };

        const savedRow = row.facility_id
          ? await apiRequest(`/upgrading-facilities/${row.facility_id}/`, {
              method: 'PUT',
              body: JSON.stringify(upgradingPayload)
            })
          : await apiRequest('/upgrading-facilities/', {
              method: 'POST',
              body: JSON.stringify(upgradingPayload)
            });

        if (!row.facility_id && savedRow?.facility_id) {
          setUpgradingFacilityRows((prev) =>
            prev.map((r) => (r.local_id === row.local_id ? { ...r, facility_id: savedRow.facility_id } : r))
          );
        }
      }

      const checklistResult = await apiRequest(`/cycles/${resolvedCycleId}/checklist/`, { method: 'GET' });
      const criterion7Item = checklistResult?.items?.find((row) => Number(row?.criterion_number) === 7);
      const criterion7ItemId = criterion7Item?.item_id ?? null;

      const completionPercentage = markComplete
        ? 100
        : calculateCriterion7Completion(criterion7Data, {
            classrooms: classroomRows,
            laboratories: laboratoryRows,
            computingResources: computingResourceRows,
            upgradingFacilities: upgradingFacilityRows
          });

      if (criterion7ItemId) {
        const checklistItem = await apiRequest(`/checklist-items/${criterion7ItemId}/`, { method: 'GET' });
        await apiRequest(`/checklist-items/${criterion7ItemId}/`, {
          method: 'PUT',
          body: JSON.stringify({
            ...checklistItem,
            status: completionPercentage >= 100 ? 1 : 0,
            completion_percentage: completionPercentage
          })
        });
      }

      setIsCriterion7Complete(completionPercentage >= 100);
      setSaveSuccess(true);
      localStorage.setItem('checklistNeedsRefresh', 'true');

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error:', error);
      setSaveError(`Save failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    saveCriterion7();
  };

  const openCriterion7UploadModal = async (sectionTitle) => {
    setCriterion7DocStatus('');
    setCriterion7DocModal({ open: true, sectionTitle });
    try {
      const docs = await listCriterion1SectionDocs(cycleId, `Criterion7:${sectionTitle}`);
      setCriterion7Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
    } catch (err) {
      setCriterion7Docs([]);
      setCriterion7DocStatus(err?.message || 'Unable to load documents.');
    }
  };

  const closeCriterion7UploadModal = () => {
    setCriterion7DocModal({ open: false, sectionTitle: '' });
    setCriterion7Docs([]);
    setCriterion7DocStatus('');
  };

  const handleCriterion7DocSelection = (event) => {
    if (!criterion7DocModal.sectionTitle) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    appendCriterion1SectionDocs(cycleId, `Criterion7:${criterion7DocModal.sectionTitle}`, files)
      .then(() => listCriterion1SectionDocs(cycleId, `Criterion7:${criterion7DocModal.sectionTitle}`))
      .then((docs) => {
        setCriterion7Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setCriterion7DocStatus(`${docs.length} file(s) saved for ${criterion7DocModal.sectionTitle}.`);
      })
      .catch((err) => setCriterion7DocStatus(err?.message || 'Unable to save documents.'));
  };

  const handleCriterion7RemoveDoc = (docId) => {
    deleteCriterion1DocById(docId)
      .then(() => listCriterion1SectionDocs(cycleId, `Criterion7:${criterion7DocModal.sectionTitle}`))
      .then((docs) => {
        setCriterion7Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setCriterion7DocStatus('Document removed.');
      })
      .catch((err) => setCriterion7DocStatus(err?.message || 'Unable to remove document.'));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 7 - Facilities" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Criterion 7 - Facilities</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
                Summarize facilities adequacy, computing resources, guidance, maintenance, library support, and overall compliance.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px' }}>

              <button onClick={handleSaveDraft} disabled={loading} style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>

                <Save size={16} />

                {loading ? 'Saving...' : 'Save Draft'}

              </button>

            </div>

          </div>

          {saveSuccess && (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', color: '#155724', fontSize: '14px' }}>
              Saved successfully!
            </div>
          )}
          {saveError && (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#721c24', fontSize: '14px' }}>
              {saveError}
            </div>
          )}

        </div>
        {/* A. Offices, Classrooms & Laboratories */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>A. Offices, Classrooms & Laboratories</h3>
          <p style={{ color: colors.mediumGray, margin: '0 0 14px 0', fontSize: '14px' }}>Document offices, classrooms, and laboratories used by the program.</p>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', backgroundColor: colors.lightGray }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Offices</div>
            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Describe faculty, administrative, and TA offices; include size and distribution.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', color: colors.darkGray, fontSize: '12px' }}>Total Number of Offices</label>
                <input type="number" placeholder="e.g., 24" value={criterion7Data.total_number_of_offices} onChange={handleCriterion7Change('total_number_of_offices')} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', color: colors.darkGray, fontSize: '12px' }}>Average Workspace Size</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" step="0.01" placeholder="e.g., 14.5" value={criterion7Data.average_workspace_size} onChange={handleCriterion7Change('average_workspace_size')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
                  <span style={{ color: colors.mediumGray, fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>m²</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', color: colors.darkGray, fontSize: '12px' }}>Student Availability Details</label>
                <input placeholder="e.g., Faculty office hours posted weekly" value={criterion7Data.student_availability_details} onChange={handleCriterion7Change('student_availability_details')} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => openCriterion7UploadModal('A. Offices')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload Documents
              </button>
            </div>
          </div>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', backgroundColor: colors.lightGray }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Classrooms</div>
            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Add classroom rows and save them as part of this draft.</p>
            <div style={{ marginTop: '12px', overflowX: 'auto', backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontWeight: '700', color: colors.darkGray, marginBottom: '8px' }}>Classroom Rows</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: colors.darkGray }}>
                    {['Room', 'Capacity', 'Multimedia', 'Internet Access', 'Typical Use', 'Adequacy Comments', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classroomRows.map((row) => (
                    <tr key={row.local_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., ENG 203" value={row.classroom_room} onChange={handleClassroomChange(row.local_id, 'classroom_room')} style={{ width: '120px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" min="0" placeholder="e.g., 45" value={row.classroom_capacity} onChange={handleClassroomChange(row.local_id, 'classroom_capacity')} style={{ width: '80px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Projector + audio" value={row.classroom_multimedia} onChange={handleClassroomChange(row.local_id, 'classroom_multimedia')} style={{ width: '150px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Wi-Fi + LAN" value={row.classroom_internet_access} onChange={handleClassroomChange(row.local_id, 'classroom_internet_access')} style={{ width: '150px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Core lectures" value={row.classroom_typical_use} onChange={handleClassroomChange(row.local_id, 'classroom_typical_use')} style={{ width: '150px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., AV upgrade planned" value={row.classroom_adequacy_comments} onChange={handleClassroomChange(row.local_id, 'classroom_adequacy_comments')} style={{ width: '170px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button onClick={() => removeClassroomRow(row.local_id)} disabled={classroomRows.length === 1} style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.border}`, padding: '5px 8px', borderRadius: '6px', fontWeight: '700', opacity: classroomRows.length === 1 ? 0.5 : 1 }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={addClassroomRow} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> Add classroom row
              </button>
              <button type="button" onClick={() => openCriterion7UploadModal('A. Classrooms')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload Documents
              </button>
            </div>
          </div>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Laboratories</div>
            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Add laboratory rows and save them as part of this draft.</p>
            <div style={{ marginTop: '12px', overflowX: 'auto', backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontWeight: '700', color: colors.darkGray, marginBottom: '8px' }}>Laboratory Rows</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: colors.darkGray }}>
                    {['Lab Name', 'Room', 'Category', 'Hardware List', 'Software List', 'Open Hours', 'Courses Using Lab', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {laboratoryRows.map((row) => (
                    <tr key={row.local_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Embedded Systems Lab" value={row.lab_name} onChange={handleLaboratoryChange(row.local_id, 'lab_name')} style={{ width: '150px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., ENG B12" value={row.lab_room} onChange={handleLaboratoryChange(row.local_id, 'lab_room')} style={{ width: '100px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Computer Engineering" value={row.lab_category} onChange={handleLaboratoryChange(row.local_id, 'lab_category')} style={{ width: '130px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Oscilloscopes, FPGA kits" value={row.lab_hardware_list} onChange={handleLaboratoryChange(row.local_id, 'lab_hardware_list')} style={{ width: '180px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., MATLAB, Vivado" value={row.lab_software_list} onChange={handleLaboratoryChange(row.local_id, 'lab_software_list')} style={{ width: '180px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., Mon-Fri 08:00-18:00" value={row.lab_open_hours} onChange={handleLaboratoryChange(row.local_id, 'lab_open_hours')} style={{ width: '130px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input placeholder="e.g., EECE 320, EECE 401" value={row.lab_courses_using_lab} onChange={handleLaboratoryChange(row.local_id, 'lab_courses_using_lab')} style={{ width: '170px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button onClick={() => removeLaboratoryRow(row.local_id)} disabled={laboratoryRows.length === 1} style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.border}`, padding: '5px 8px', borderRadius: '6px', fontWeight: '700', opacity: laboratoryRows.length === 1 ? 0.5 : 1 }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={addLaboratoryRow} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> Add laboratory row
              </button>
              <button type="button" onClick={() => openCriterion7UploadModal('A. Laboratories')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload Documents
              </button>
            </div>
          </div>
        </div>
        {/* B. Computing Resources */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Computing Resources</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe shared computing infrastructure available to students.</p>
            </div>
            <button type="button" onClick={() => openCriterion7UploadModal('B. Computing Resources')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Documents
            </button>
          </div>
          <div style={{ marginTop: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>
                  {['Resource', 'Location', 'Access Type (on-campus/VPN)', 'Hours Available', 'Adequacy Notes', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computingResourceRows.map((row) => (
                  <tr key={row.local_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., Virtual Lab Cluster" value={row.computing_resource_name} onChange={handleComputingResourceChange(row.local_id, 'computing_resource_name')} style={{ width: '180px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., Engineering Building, Floor 2" value={row.computing_resource_location} onChange={handleComputingResourceChange(row.local_id, 'computing_resource_location')} style={{ width: '160px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., On-campus + VPN" value={row.computing_access_type} onChange={handleComputingResourceChange(row.local_id, 'computing_access_type')} style={{ width: '180px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., 24/7" value={row.computing_hours_available} onChange={handleComputingResourceChange(row.local_id, 'computing_hours_available')} style={{ width: '120px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., Capacity adequate for capstone teams" value={row.computing_adequacy_notes} onChange={handleComputingResourceChange(row.local_id, 'computing_adequacy_notes')} style={{ width: '220px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => removeComputingResourceRow(row.local_id)} disabled={computingResourceRows.length === 1} style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.border}`, padding: '5px 8px', borderRadius: '6px', fontWeight: '700', opacity: computingResourceRows.length === 1 ? 0.5 : 1 }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={addComputingResourceRow} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add computing resource row
            </button>
          </div>
        </div>
        {/* C. Guidance */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Guidance</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe student guidance, orientation, and support for using facilities.</p>
            </div>
            <button type="button" onClick={() => openCriterion7UploadModal('C. Guidance')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Documents
            </button>
          </div>
          <textarea placeholder="e.g., New students attend a lab safety orientation in week 1; tutorials are available every Tuesday." value={criterion7Data.guidance_description} onChange={handleCriterion7Change('guidance_description')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '700', color: colors.darkGray, fontSize: '12px' }}>Responsible Faculty Name</label>
              <input placeholder="e.g., Dr. Lina Saab" value={criterion7Data.responsible_faculty_name} onChange={handleCriterion7Change('responsible_faculty_name')} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
            </div>
          </div>
        </div>
        {/* D. Maintenance and Upgrading */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Maintenance and Upgrading of Facilities</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe how maintenance and upgrades are planned and tracked.</p>
            </div>
            <button type="button" onClick={() => openCriterion7UploadModal('D. Maintenance and Upgrading')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Documents
            </button>
          </div>
          <textarea placeholder="e.g., Facilities are reviewed each semester and high-use equipment is replaced every 3 years." value={criterion7Data.maintenance_policy_description} onChange={handleCriterion7Change('maintenance_policy_description')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />
          <div style={{ marginTop: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>
                  {['Facility / Lab', 'Last Upgrade', 'Next Scheduled', 'Responsible Staff', 'Notes', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upgradingFacilityRows.map((row) => (
                  <tr key={row.local_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., Networks Lab" value={row.facility_name} onChange={handleUpgradingFacilityChange(row.local_id, 'facility_name')} style={{ width: '180px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="date" value={row.last_upgrade_date} onChange={handleUpgradingFacilityChange(row.local_id, 'last_upgrade_date')} style={{ width: '140px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="date" value={row.next_scheduled_upgrade} onChange={handleUpgradingFacilityChange(row.local_id, 'next_scheduled_upgrade')} style={{ width: '140px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., Eng. Support Team" value={row.responsible_staff} onChange={handleUpgradingFacilityChange(row.local_id, 'responsible_staff')} style={{ width: '180px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input placeholder="e.g., Switches replaced; calibration completed" value={row.maintenance_notes} onChange={handleUpgradingFacilityChange(row.local_id, 'maintenance_notes')} style={{ width: '220px', padding: '6px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => removeUpgradingFacilityRow(row.local_id)} disabled={upgradingFacilityRows.length === 1} style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.border}`, padding: '5px 8px', borderRadius: '6px', fontWeight: '700', opacity: upgradingFacilityRows.length === 1 ? 0.5 : 1 }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={addUpgradingFacilityRow} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add maintenance row
            </button>
            <button type="button" onClick={() => openCriterion7UploadModal('D. Maintenance and Upgrading')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Upload Documents
            </button>
          </div>
        </div>
        {/* E. Library Services */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Library Services</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Summarize technical collections, e-resources, request process, and access hours/systems.</p>
            </div>
            <button type="button" onClick={() => openCriterion7UploadModal('E. Library Services')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Documents
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Technical collections and journals</label>
              <textarea placeholder="e.g., IEEE Xplore journals and print references for core EE courses" value={criterion7Data.technical_collections_and_journals} onChange={handleCriterion7Change('technical_collections_and_journals')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Electronic databases and e-resources</label>
              <textarea placeholder="e.g., Scopus, ScienceDirect, ACM Digital Library with campus VPN access" value={criterion7Data.electronic_databases_and_eresources} onChange={handleCriterion7Change('electronic_databases_and_eresources')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Process for faculty book requests</label>
              <textarea placeholder="e.g., Faculty submit requests to the department committee each semester." value={criterion7Data.faculty_book_request_process} onChange={handleCriterion7Change('faculty_book_request_process')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Access hours and systems (e-catalog, VPN)</label>
              <textarea placeholder="e.g., Library open Mon-Sat 8:00-20:00, e-catalog and VPN available 24/7." value={criterion7Data.library_access_hours_and_systems} onChange={handleCriterion7Change('library_access_hours_and_systems')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
          </div>
        </div>
        {/* F. Overall Comments */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>F. Overall Comments on Facilities</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Optional fields: how facilities support student outcomes, safety/inspection, and university policy compliance.</p>
            </div>
            <button type="button" onClick={() => openCriterion7UploadModal('F. Overall Comments')} style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Upload size={16} /> Upload Documents
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Facilities support student outcomes</label>
              <textarea placeholder="e.g., Facilities enable hands-on design, testing, and team-based projects." value={criterion7Data.facilities_support_student_outcomes} onChange={handleCriterion7Change('facilities_support_student_outcomes')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Safety and inspection processes</label>
              <textarea placeholder="e.g., Annual safety audits and monthly equipment inspections are documented." value={criterion7Data.safety_and_inspection_processes} onChange={handleCriterion7Change('safety_and_inspection_processes')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Compliance with university policy</label>
              <textarea placeholder="e.g., All spaces comply with university safety, procurement, and accessibility policies." value={criterion7Data.compliance_with_university_policy} onChange={handleCriterion7Change('compliance_with_university_policy')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
            </div>
          </div>
        </div>

        {criterion7DocModal.open && (
          <div
            onClick={closeCriterion7UploadModal}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 25, 35, 0.52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1700
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '620px',
                backgroundColor: 'white',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '800' }}>Document Upload</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{criterion7DocModal.sectionTitle}</div>
                </div>
                <button onClick={closeCriterion7UploadModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                  x
                </button>
              </div>
              <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Select Documents
                  <input type="file" multiple onChange={handleCriterion7DocSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
                </label>
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Selected Files
                  </div>
                  {criterion7Docs.length === 0 ? (
                    <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {criterion7Docs.map((file) => (
                        <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleCriterion7RemoveDoc(file.id)}
                            style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {criterion7DocStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{criterion7DocStatus}</div> : null}
              </div>
              <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
                <button type="button" onClick={closeCriterion7UploadModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
                  Extract with AI
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};



  // Criterion 8 Page

  const Criterion8Page = ({ onToggleSidebar, onBack }) => {
    const cycleId = localStorage.getItem('currentCycleId') || 1;
    const [criterion8Data, setCriterion8Data] = useState({
      criterion8_id: null,
      leadership_structure_description: '',
      leadership_adequacy_description: '',
      leadership_participation_description: '',
      budget_process_continuity: '',
      teaching_support_description: '',
      infrastructure_funding_description: '',
      resource_adequacy_description: '',
      hiring_process_description: '',
      retention_strategies_description: '',
      professional_development_support_types: '',
      professional_development_request_process: '',
      professional_development_funding_details: '',
      additional_narrative_on_staffing: '',
      cycle: null,
      item: null
    });
    const [criterion8Loading, setCriterion8Loading] = useState(false);
    const [criterion8SaveSuccess, setCriterion8SaveSuccess] = useState(false);
    const [criterion8SaveError, setCriterion8SaveError] = useState('');
    const [isCriterion8Complete, setIsCriterion8Complete] = useState(false);
    const [criterion8Dirty, setCriterion8Dirty] = useState(false);
    const criterion8ReadyRef = useRef(false);
    const [criterion8DocModal, setCriterion8DocModal] = useState({ open: false, sectionTitle: '' });
    const [criterion8Docs, setCriterion8Docs] = useState([]);
    const [criterion8DocStatus, setCriterion8DocStatus] = useState('');
    const [staffingRows, setStaffingRows] = useState(DEFAULT_CRITERION8_STAFFING_ROWS);

    useEffect(() => {
      const loadCriterion8 = async () => {
        try {
          const records = await apiRequest('/criterion8/', { method: 'GET' });
          if (!Array.isArray(records) || records.length === 0) {
            return;
          }
          const matchingForCycle = records.filter((row) => Number(row?.cycle) === Number(cycleId));
          if (matchingForCycle.length === 0) {
            return;
          }
          const latest = matchingForCycle[matchingForCycle.length - 1];
          setCriterion8Data((prev) => ({
            ...prev,
            ...latest,
            criterion8_id: latest.criterion8_id ?? null,
            leadership_structure_description: latest.leadership_structure_description ?? '',
            leadership_adequacy_description: latest.leadership_adequacy_description ?? '',
            leadership_participation_description: latest.leadership_participation_description ?? '',
            budget_process_continuity: latest.budget_process_continuity ?? '',
            teaching_support_description: latest.teaching_support_description ?? '',
            infrastructure_funding_description: latest.infrastructure_funding_description ?? '',
            resource_adequacy_description: latest.resource_adequacy_description ?? '',
            hiring_process_description: latest.hiring_process_description ?? '',
            retention_strategies_description: latest.retention_strategies_description ?? '',
            professional_development_support_types: latest.professional_development_support_types ?? '',
            professional_development_request_process: latest.professional_development_request_process ?? '',
            professional_development_funding_details: latest.professional_development_funding_details ?? '',
            additional_narrative_on_staffing: latest.additional_narrative_on_staffing ?? '',
            cycle: latest.cycle ?? null,
            item: latest.item ?? null
          }));

          const itemId = latest.item ?? null;
          if (itemId) {
            const checklistItem = await apiRequest(`/checklist-items/${itemId}/`, { method: 'GET' });
            const completion = Number(checklistItem?.completion_percentage ?? 0);
            const status = Number(checklistItem?.status ?? 0);
            setIsCriterion8Complete(status === 1 || completion >= 100);
          }

          if (latest?.criterion8_id) {
            try {
              const staffing = await apiRequest(`/criterion8/${latest.criterion8_id}/staffing/`, { method: 'GET' });
              if (Array.isArray(staffing) && staffing.length > 0) {
                setStaffingRows(staffing.map((row) => ({
                  staffing_row_id: row?.staffing_row_id ?? null,
                  category: row?.category ?? '',
                  number_of_staff: row?.number_of_staff ?? '',
                  primary_role: row?.primary_role ?? '',
                  training_retention_practices: row?.training_retention_practices ?? ''
                })));
              } else {
                setStaffingRows(DEFAULT_CRITERION8_STAFFING_ROWS);
              }
            } catch (_staffingError) {
              setStaffingRows(DEFAULT_CRITERION8_STAFFING_ROWS);
            }
          }
        } catch (_error) {
          // Keep empty form if load fails.
        } finally {
          // Enable autosave only after initial data load attempt completes.
          criterion8ReadyRef.current = true;
        }
      };

      loadCriterion8();
    }, [cycleId]);

    const handleCriterion8Change = (field) => (event) => {
      const { value } = event.target;
      setCriterion8Data((prev) => ({ ...prev, [field]: value }));
      setCriterion8Dirty(true);
    };

    const handleStaffingRowChange = (index, field) => (event) => {
      const { value } = event.target;
      setStaffingRows((prev) => prev.map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: value } : row
      )));
      setCriterion8Dirty(true);
    };

    const handleRemoveStaffingRow = (index) => {
      setStaffingRows((prev) => {
        if (prev.length <= 1) return prev;
        return prev.filter((_, rowIndex) => rowIndex !== index);
      });
      setCriterion8Dirty(true);
    };

    const openCriterion8UploadModal = async (sectionTitle) => {
      setCriterion8DocStatus('');
      setCriterion8DocModal({ open: true, sectionTitle });
      try {
        const docs = await listCriterion1SectionDocs(cycleId, `Criterion8:${sectionTitle}`);
        setCriterion8Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
      } catch (err) {
        setCriterion8Docs([]);
        setCriterion8DocStatus(err?.message || 'Unable to load documents.');
      }
    };

    const closeCriterion8UploadModal = () => {
      setCriterion8DocModal({ open: false, sectionTitle: '' });
      setCriterion8Docs([]);
      setCriterion8DocStatus('');
    };

    const handleCriterion8DocSelection = (event) => {
      if (!criterion8DocModal.sectionTitle) return;
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      appendCriterion1SectionDocs(cycleId, `Criterion8:${criterion8DocModal.sectionTitle}`, files)
        .then(() => listCriterion1SectionDocs(cycleId, `Criterion8:${criterion8DocModal.sectionTitle}`))
        .then((docs) => {
          setCriterion8Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
          setCriterion8DocStatus(`${docs.length} file(s) saved for ${criterion8DocModal.sectionTitle}.`);
        })
        .catch((err) => setCriterion8DocStatus(err?.message || 'Unable to save documents.'));
    };

    const handleCriterion8RemoveDoc = (docId) => {
      deleteCriterion1DocById(docId)
        .then(() => listCriterion1SectionDocs(cycleId, `Criterion8:${criterion8DocModal.sectionTitle}`))
        .then((docs) => {
          setCriterion8Docs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
          setCriterion8DocStatus('Document removed.');
        })
        .catch((err) => setCriterion8DocStatus(err?.message || 'Unable to remove document.'));
    };

    const saveCriterion8 = async ({ markComplete = false, silent = false } = {}) => {
      try {
        setCriterion8Loading(true);
        if (!silent) {
          setCriterion8SaveError('');
          setCriterion8SaveSuccess(false);
        }

        const resolvedCycleId = Number(cycleId);

        let checklistItemId = criterion8Data.item;
        if (!checklistItemId) {
          const checklistResult = await apiRequest(`/cycles/${resolvedCycleId}/checklist/`, { method: 'GET' });
          const criterion8Item = checklistResult?.items?.find((row) => Number(row?.criterion_number) === 8);
          checklistItemId = criterion8Item?.item_id ?? null;
        }

        const payload = {
          leadership_structure_description: criterion8Data.leadership_structure_description,
          leadership_adequacy_description: criterion8Data.leadership_adequacy_description,
          leadership_participation_description: criterion8Data.leadership_participation_description,
          budget_process_continuity: criterion8Data.budget_process_continuity,
          teaching_support_description: criterion8Data.teaching_support_description,
          infrastructure_funding_description: criterion8Data.infrastructure_funding_description,
          resource_adequacy_description: criterion8Data.resource_adequacy_description,
          hiring_process_description: criterion8Data.hiring_process_description,
          retention_strategies_description: criterion8Data.retention_strategies_description,
          professional_development_support_types: criterion8Data.professional_development_support_types,
          professional_development_request_process: criterion8Data.professional_development_request_process,
          professional_development_funding_details: criterion8Data.professional_development_funding_details,
          additional_narrative_on_staffing: criterion8Data.additional_narrative_on_staffing,
          ...(resolvedCycleId ? { cycle: resolvedCycleId } : {}),
          ...(checklistItemId ? { item: checklistItemId } : {})
        };

        const result = criterion8Data.criterion8_id
          ? await apiRequest(`/criterion8/${criterion8Data.criterion8_id}/`, {
              method: 'PUT',
              body: JSON.stringify(payload)
            })
          : await apiRequest('/criterion8/', {
              method: 'POST',
              body: JSON.stringify(payload)
            });

        const resolvedItemId = result?.item ?? checklistItemId;
        const resolvedCriterion8Id = result?.criterion8_id ?? criterion8Data.criterion8_id;

        if (resolvedCriterion8Id) {
          const existingRows = await apiRequest(`/criterion8/${resolvedCriterion8Id}/staffing/`, { method: 'GET' });
          const existingById = new Map(
            (Array.isArray(existingRows) ? existingRows : [])
              .filter((row) => row?.staffing_row_id)
              .map((row) => [Number(row.staffing_row_id), row])
          );

          const rowsToSave = staffingRows.filter((row) => (
            `${row?.category ?? ''}`.trim() !== '' ||
            `${row?.number_of_staff ?? ''}`.trim() !== '' ||
            `${row?.primary_role ?? ''}`.trim() !== '' ||
            `${row?.training_retention_practices ?? ''}`.trim() !== ''
          ));

          const keptRowIds = new Set();
          for (const row of rowsToSave) {
            const payloadRow = {
              category: `${row?.category ?? ''}`.trim(),
              number_of_staff: Number.parseInt(`${row?.number_of_staff ?? ''}`, 10) || 0,
              primary_role: `${row?.primary_role ?? ''}`.trim(),
              training_retention_practices: `${row?.training_retention_practices ?? ''}`.trim(),
              criterion8: resolvedCriterion8Id
            };

            if (row?.staffing_row_id) {
              const rowId = Number(row.staffing_row_id);
              keptRowIds.add(rowId);
              await apiRequest(`/staffing-rows/${rowId}/`, {
                method: 'PUT',
                body: JSON.stringify({
                  staffing_row_id: rowId,
                  ...payloadRow
                })
              });
            } else {
              const created = await apiRequest('/staffing-rows/', {
                method: 'POST',
                body: JSON.stringify(payloadRow)
              });
              if (created?.staffing_row_id) {
                keptRowIds.add(Number(created.staffing_row_id));
              }
            }
          }

          const rowsToDelete = (Array.isArray(existingRows) ? existingRows : []).filter((row) => !keptRowIds.has(Number(row?.staffing_row_id)));
          for (const row of rowsToDelete) {
            if (row?.staffing_row_id) {
              await apiRequest(`/staffing-rows/${row.staffing_row_id}/`, { method: 'DELETE' });
            }
          }

          const refreshedRows = await apiRequest(`/criterion8/${resolvedCriterion8Id}/staffing/`, { method: 'GET' });
          if (Array.isArray(refreshedRows) && refreshedRows.length > 0) {
            setStaffingRows(refreshedRows.map((row) => ({
              staffing_row_id: row?.staffing_row_id ?? null,
              category: row?.category ?? '',
              number_of_staff: row?.number_of_staff ?? '',
              primary_role: row?.primary_role ?? '',
              training_retention_practices: row?.training_retention_practices ?? ''
            })));
          } else {
            setStaffingRows(DEFAULT_CRITERION8_STAFFING_ROWS);
          }
        }

        const completionPercentage = markComplete ? 100 : calculateCriterion8Completion(payload);
        if (resolvedItemId) {
          const checklistItem = await apiRequest(`/checklist-items/${resolvedItemId}/`, { method: 'GET' });
          await apiRequest(`/checklist-items/${resolvedItemId}/`, {
            method: 'PUT',
            body: JSON.stringify({
              ...checklistItem,
              status: completionPercentage >= 100 ? 1 : 0,
              completion_percentage: completionPercentage
            })
          });
        }

        setCriterion8Data((prev) => ({
          ...prev,
          criterion8_id: result?.criterion8_id ?? prev.criterion8_id,
          cycle: result?.cycle ?? resolvedCycleId,
          item: resolvedItemId
        }));

        if (!silent) {
          setCriterion8SaveSuccess(true);
          setTimeout(() => setCriterion8SaveSuccess(false), 3000);
        }
        setIsCriterion8Complete(completionPercentage >= 100);
        setCriterion8Dirty(false);
        localStorage.setItem('checklistNeedsRefresh', 'true');
      } catch (error) {
        if (!silent) {
          setCriterion8SaveError(error?.message || 'Error saving Criterion 8.');
        }
      } finally {
        setCriterion8Loading(false);
      }
    };

    useEffect(() => {
      if (!criterion8ReadyRef.current || !criterion8Dirty || criterion8Loading) {
        return;
      }

      const autosaveTimer = setTimeout(() => {
        saveCriterion8({ silent: true });
      }, 1200);

      return () => clearTimeout(autosaveTimer);
    }, [criterion8Data, criterion8Dirty, criterion8Loading]);

    const handleSaveDraft8 = () => saveCriterion8();

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
        <GlobalHeader title="Criterion 8 - Institutional Support" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />

        <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Institutional Support Workspace</div>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Five-part layout (A-E) for leadership, budget, staffing, hiring/retention, and professional development.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSaveDraft8} disabled={criterion8Loading} style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', opacity: criterion8Loading ? 0.7 : 1 }}>
                  <Save size={16} />
                  {criterion8Loading ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </div>
            {criterion8SaveSuccess && (
              <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', color: '#155724', fontSize: '14px' }}>
                Saved successfully!
              </div>
            )}
            {criterion8SaveError && (
              <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#721c24', fontSize: '14px' }}>
                {criterion8SaveError}
              </div>
            )}
          </div>

          {/* A. Leadership */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Leadership</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe leadership structure, adequacy, and participation in decisions. Upload org charts or policies.</p>
              </div>
              <button type="button" onClick={() => openCriterion8UploadModal('A. Leadership')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} /> Upload Documents
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Leadership structure (Program Chair, Department Head, Dean)</label>
                <textarea placeholder="Describe leadership roles and decision-making chain." value={criterion8Data.leadership_structure_description} onChange={handleCriterion8Change('leadership_structure_description')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Adequacy of leadership to ensure program quality and continuity</label>
                <textarea placeholder="Explain how leadership supports continuity and quality assurance." value={criterion8Data.leadership_adequacy_description} onChange={handleCriterion8Change('leadership_adequacy_description')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>How leaders participate in curriculum and faculty decisions</label>
                <textarea placeholder="Document leadership involvement in curriculum and faculty processes." value={criterion8Data.leadership_participation_description} onChange={handleCriterion8Change('leadership_participation_description')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* B. Program Budget and Financial Support */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Program Budget and Financial Support</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Four sub-parts (B1-B4) displayed as collapsible-style cards with uploads and AI summaries.</p>
              </div>
              <button type="button" onClick={() => openCriterion8UploadModal('B. Program Budget and Financial Support')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload Documents
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
              {[{
                title: 'B1 - Budget Process and Continuity',
                desc: 'Describe how annual budget is set, approved, and monitored.',
                upload: 'Department Budget Policy.pdf',
                ai: 'AI summarize recurring vs temporary funds',
                field: 'budget_process_continuity'
              }, {
                title: 'B2 - Teaching Support',
                desc: 'Explain support for teaching (graders, TAs, workshops, equipment).',
                upload: 'TA Assignments.xlsx',
                ai: 'AI summarize TAs, training, grants',
                field: 'teaching_support_description'
              }, {
                title: 'B3 - Infrastructure Funding',
                desc: 'How the university funds maintenance and lab/facility upgrades.',
                upload: 'Facilities Funding Plan.pdf',
                ai: 'AI identify funding amounts and cycles',
                field: 'infrastructure_funding_description'
              }, {
                title: 'B4 - Adequacy of Resources',
                desc: 'Assess how current budget supports students achieving SOs.',
                upload: 'Annual Assessment Report.pdf',
                ai: 'AI pull students/credits/budget per student',
                field: 'resource_adequacy_description'
              }].map((card) => (
                <div key={card.title} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '800', color: colors.darkGray }}>{card.title}</div>
                      <p style={{ color: colors.mediumGray, margin: '6px 0 10px 0', fontSize: '13px' }}>{card.desc}</p>
                    </div>
                  </div>

                  <textarea placeholder="Enter details or paste summary" value={criterion8Data[card.field]} onChange={handleCriterion8Change(card.field)} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
                </div>
              ))}
            </div>
          </div>

          {/* C. Staffing */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Staffing</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Summarize administrative and technical staff counts with roles and retention practices.</p>
              </div>
              <button type="button" onClick={() => openCriterion8UploadModal('C. Staffing')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} /> Upload Documents
              </button>
            </div>

            <div style={{ marginTop: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>
                    {['Category', 'Number', 'Primary Role', 'Training / Retention Practices'].map((h) => (
                      <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffingRows.map((row, index) => (
                    <tr key={row.staffing_row_id || `staffing-row-${index}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px' }}>
                        <input
                          value={row.category}
                          onChange={handleStaffingRowChange(index, 'category')}
                          placeholder="e.g., Technical"
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.number_of_staff}
                          onChange={handleStaffingRowChange(index, 'number_of_staff')}
                          placeholder="0"
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input
                          value={row.primary_role}
                          onChange={handleStaffingRowChange(index, 'primary_role')}
                          placeholder="e.g., Lab engineers, equipment upkeep"
                          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            value={row.training_retention_practices}
                            onChange={handleStaffingRowChange(index, 'training_retention_practices')}
                            placeholder="e.g., Safety training and mentoring"
                            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStaffingRow(index)}
                            disabled={staffingRows.length <= 1}
                            style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px 10px', cursor: staffingRows.length <= 1 ? 'not-allowed' : 'pointer', opacity: staffingRows.length <= 1 ? 0.6 : 1 }}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <textarea placeholder="Additional narrative on staffing adequacy and linkage to Faculty Members" value={criterion8Data.additional_narrative_on_staffing} onChange={handleCriterion8Change('additional_narrative_on_staffing')} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '10px' }} />

          </div>

          {/* D. Faculty Hiring and Retention */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Faculty Hiring and Retention</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Sub-sections D1 (hiring process) and D2 (retention strategies) with uploads and AI extraction.</p>
              </div>
              <button type="button" onClick={() => openCriterion8UploadModal('D. Faculty Hiring and Retention')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload Documents
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginTop: '12px' }}>
              {[{
                title: 'D1 - Hiring Process',
                placeholder: 'Describe recruitment procedure (advertising, committees, approvals).',
                upload: 'Faculty Hiring Policy.pdf',
                ai: 'AI summarize steps & timeline',
                field: 'hiring_process_description'
              }, {
                title: 'D2 - Retention Strategies',
                placeholder: 'Explain promotion, recognition, salary review, mentorship systems.',
                upload: 'Retention Plan.pdf',
                ai: 'AI identify key benefits & retention methods',
                field: 'retention_strategies_description'
              }].map((card) => (
                <div key={card.title} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '800', color: colors.darkGray }}>{card.title}</div>
                  </div>

                  <textarea placeholder={card.placeholder} value={criterion8Data[card.field]} onChange={handleCriterion8Change(card.field)} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '10px' }} />
                </div>
              ))}
            </div>
          </div>

          {/* E. Support of Faculty Professional Development */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Support of Faculty Professional Development</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Document support types, request/approval process, and funding activities.</p>
              </div>

              <button type="button" onClick={() => openCriterion8UploadModal('E. Support of Faculty Professional Development')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} /> Upload Documents
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Support types (sabbaticals, travel funds, workshops, seminars)</label>
                <textarea placeholder="List and describe available professional development supports." value={criterion8Data.professional_development_support_types} onChange={handleCriterion8Change('professional_development_support_types')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Process for request + approval</label>
                <textarea placeholder="Outline how faculty submit, approve, and track requests." value={criterion8Data.professional_development_request_process} onChange={handleCriterion8Change('professional_development_request_process')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>Funding activity details (per year if available)</label>
                <textarea placeholder="Capture amounts, number of participants, and frequency." value={criterion8Data.professional_development_funding_details} onChange={handleCriterion8Change('professional_development_funding_details')} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            </div>

          </div>

          {criterion8DocModal.open && (
            <div
              onClick={closeCriterion8UploadModal}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(20, 25, 35, 0.52)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 1700
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '620px',
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '800' }}>Document Upload</div>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{criterion8DocModal.sectionTitle}</div>
                  </div>
                  <button onClick={closeCriterion8UploadModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                    x
                  </button>
                </div>

                <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
                  <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                    Select Documents
                    <input type="file" multiple onChange={handleCriterion8DocSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
                  </label>

                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                    <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Selected Files
                    </div>
                    {criterion8Docs.length === 0 ? (
                      <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {criterion8Docs.map((file) => (
                          <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleCriterion8RemoveDoc(file.id)}
                              style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {criterion8DocStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{criterion8DocStatus}</div> : null}
                </div>

                <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
                  <button type="button" onClick={closeCriterion8UploadModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
                    Extract with AI
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  // Appendix C Page


export { Criterion1Page, Criterion2Page, Criterion3Page, Criterion4Page, Criterion5Page, Criterion6Page, Criterion7Page, Criterion8Page };
















