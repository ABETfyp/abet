import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Save, Upload } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';
import { getActiveContext } from '../utils/activeContext';
import EvidenceLibraryImport from '../components/shared/EvidenceLibraryImport';
import { exportSelfStudyReport } from '../utils/selfStudyExport';
import { buildTextboxAiStatus, extractTextboxSectionWithLocalAi } from '../utils/textboxAi';

const BG_DOCS_DB_NAME = 'abet-background-documents';
const BG_DOCS_STORE = 'documents';

const openBackgroundDocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(BG_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(BG_DOCS_STORE)) {
      const store = db.createObjectStore(BG_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_section', ['cycleId', 'sectionTitle'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open documents storage.'));
});

const listBackgroundSectionDocs = async (cycleId, sectionTitle) => {
  const db = await openBackgroundDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_DOCS_STORE, 'readonly');
    const store = tx.objectStore(BG_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));
    query.onsuccess = () => {
      const rows = query.result || [];
      rows.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      resolve(rows);
    };
    query.onerror = () => reject(query.error || new Error('Unable to read stored documents.'));
  });
};

const appendBackgroundSectionDocs = async (cycleId, sectionTitle, files) => {
  const db = await openBackgroundDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(BG_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(
        existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`)
      );

      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) {
          return;
        }
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

const deleteBackgroundDocById = async (docId) => {
  const db = await openBackgroundDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(BG_DOCS_STORE);
    store.delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove document.'));
  });
};

const getBackgroundDocById = async (docId) => {
  const db = await openBackgroundDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_DOCS_STORE, 'readonly');
    const req = tx.objectStore(BG_DOCS_STORE).get(docId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Unable to load document.'));
  });
};

const BACKGROUND_TEXTBOX_SECTION_FIELDS = {
  'A. Contact Information': ['contactName', 'positionTitle', 'officeLocation', 'phoneNumber', 'emailAddress'],
  'B. Program History': ['yearImplemented', 'lastReviewDate', 'majorChanges'],
};

  const FullReportPage = ({ onToggleSidebar, onBack }) => {
    const cycleId = localStorage.getItem('currentCycleId') || 1;
    const { programName, cycleLabel } = getActiveContext();
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [exportSuccess, setExportSuccess] = useState('');
    const [reportPayload, setReportPayload] = useState(null);
    const [aiOptions, setAiOptions] = useState([]);
    const [selectedAiFields, setSelectedAiFields] = useState([]);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiModalError, setAiModalError] = useState('');
    const [aiDrafting, setAiDrafting] = useState(false);

    const completedItems = [

      'Background Information',

      'Criterion 1 – Students',

      'Criterion 2 – Program Educational Objectives',

      'Criterion 3 – Student Outcomes',

      'Criterion 4 – Continuous Improvement',

      'Criterion 5 – Curriculum',

      'Criterion 6 – Faculty',

      'Criterion 7 – Facilities',

      'Criterion 8 – Institutional Support',

      'Appendices A & B'

    ];

    const fieldSelectionKey = (sectionId, fieldKey) => `${sectionId}::${fieldKey}`;
    const selectedCount = selectedAiFields.length;
    const allSelectableKeys = aiOptions.flatMap((group) =>
      (Array.isArray(group?.fields) ? group.fields : []).map((field) => fieldSelectionKey(field.sectionId, field.fieldKey))
    );
    const allFieldsSelected = allSelectableKeys.length > 0 && allSelectableKeys.every((key) => selectedAiFields.includes(key));

    const resetAiModalState = () => {
      setAiModalOpen(false);
      setAiModalError('');
      setAiOptions([]);
      setSelectedAiFields([]);
      setReportPayload(null);
      setAiDrafting(false);
    };

    const handlePrepareReportGeneration = async () => {
      try {
        setExporting(true);
        setExportError('');
        setExportSuccess('');
        setAiModalError('');
        const payload = await apiRequest(`/cycles/${cycleId}/self-study/`, { method: 'GET' });
        setReportPayload(payload);
        setAiOptions(Array.isArray(payload?.ai_options) ? payload.ai_options : []);
        setSelectedAiFields([]);
        setAiModalOpen(true);
      } catch (error) {
        setExportError(`Unable to prepare the report: ${error?.message || 'Unknown error'}`);
      } finally {
        setExporting(false);
      }
    };

    const handleToggleAiField = (sectionId, fieldKey) => {
      const key = fieldSelectionKey(sectionId, fieldKey);
      setSelectedAiFields((prev) => (
        prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
      ));
    };

    const handleToggleAllAiFields = () => {
      setSelectedAiFields(allFieldsSelected ? [] : allSelectableKeys);
    };

    const handleExportPayload = async (payload, successMessage) => {
      await exportSelfStudyReport(payload, { allowSavePicker: false });
      setExportSuccess(successMessage);
    };

    const handleGenerateReportAsIs = async () => {
      if (!reportPayload) {
        setAiModalError('The report payload is not ready yet.');
        return;
      }
      try {
        setExporting(true);
        setExportError('');
        setExportSuccess('');
        await handleExportPayload(reportPayload, 'Full report exported successfully.');
        resetAiModalState();
      } catch (error) {
        setAiModalError(error?.message || 'Unable to export the report.');
      } finally {
        setExporting(false);
      }
    };

    const handleGenerateReportWithAi = async () => {
      if (!reportPayload) {
        setAiModalError('The report payload is not ready yet.');
        return;
      }
      if (selectedAiFields.length === 0) {
        setAiModalError('Select at least one field for AI drafting, or use Generate As Is.');
        return;
      }
      try {
        setAiDrafting(true);
        setExportError('');
        setExportSuccess('');
        setAiModalError('');

        const selectedFields = selectedAiFields.map((key) => {
          const [sectionId, fieldKey] = key.split('::');
          return { sectionId, fieldKey };
        });

        const result = await apiRequest(`/cycles/${cycleId}/self-study/ai-draft/`, {
          method: 'POST',
          body: JSON.stringify({ selectedFields, saveToBackend: true })
        });

        if (!result?.payload) {
          throw new Error('The AI drafting response did not include a report payload.');
        }

        setExporting(true);
      await handleExportPayload(
        result.payload,
        `Full report exported successfully with AI-expanded writing in ${Array.isArray(result?.appliedFields) ? result.appliedFields.length : selectedAiFields.length} field(s), and the website content was updated.`
      );
        resetAiModalState();
      } catch (error) {
        setAiModalError(error?.message || 'Unable to generate AI-assisted report text.');
      } finally {
        setAiDrafting(false);
        setExporting(false);
      }
    };



    return (

      <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

        <GlobalHeader title="Full Accreditation Report" subtitle="Complete submission overview" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



        <div style={{ padding: '48px' }}>

          {/* Progress Header */}

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '36px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>

              <div>

                <h2 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.4px' }}>{programName}</h2>

                <p style={{ color: colors.mediumGray, fontSize: '15px', margin: 0, fontWeight: '500' }}>{cycleLabel}</p>

              </div>

              <div style={{ textAlign: 'right' }}>

                <div style={{ fontSize: '42px', fontWeight: '800', color: colors.success, marginBottom: '4px', letterSpacing: '-1px' }}>100%</div>

                <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</div>

              </div>

            </div>



            {/* Progress Bar */}

            <div style={{ height: '14px', backgroundColor: colors.lightGray, borderRadius: '7px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>

              <div style={{ width: '100%', height: '100%', backgroundColor: colors.success, transition: 'width 0.3s' }}></div>

            </div>



            <div style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '12px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

              <div style={{ display: 'grid', gap: '4px' }}>
                <span>Last updated: November 25, 2025</span>
                <span>Select which narrative fields ChatGPT should expand before export.</span>
              </div>

              <button

                onClick={handlePrepareReportGeneration}
                disabled={exporting || aiDrafting}
                style={{

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '8px',

                  backgroundColor: colors.primary,

                  color: 'white',

                  padding: '12px 18px',

                  borderRadius: '8px',

                  border: 'none',

                  cursor: exporting || aiDrafting ? 'not-allowed' : 'pointer',

                  fontSize: '14px',

                  fontWeight: '700',

                  opacity: exporting || aiDrafting ? 0.7 : 1,

                  letterSpacing: '0.2px'

                }}

              >

                <FileText size={18} />

                {exporting ? 'Preparing...' : 'Generate Full Report'}

              </button>

            </div>

            {exportSuccess ? (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '6px',
                color: '#155724',
                fontSize: '14px'
              }}>
                {exportSuccess}
              </div>
            ) : null}

            {exportError ? (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '6px',
                color: '#721c24',
                fontSize: '14px'
              }}>
                {exportError}
              </div>
            ) : null}

          </div>



          {/* Completed Checklist */}

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <h3 style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '700', marginBottom: '28px', letterSpacing: '-0.3px' }}>Accreditation Checklist (Completed)</h3>



            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {completedItems.map((name, index) => (

                <div

                  key={index}

                  style={{

                    display: 'flex',

                    alignItems: 'center',

                    padding: '24px',

                    border: `1px solid ${colors.border}`,

                    borderRadius: '10px',

                    backgroundColor: 'white'

                  }}

                >

                  <div style={{ marginRight: '20px' }}>

                    <CheckCircle2 size={28} color={colors.success} strokeWidth={2.5} />

                  </div>

                  <div style={{ flex: 1 }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>

                      <h4 style={{ color: colors.darkGray, fontSize: '16px', fontWeight: '700', margin: 0, letterSpacing: '-0.1px' }}>{name}</h4>

                      <span style={{ color: colors.darkGray, fontSize: '15px', fontWeight: '700', marginRight: '20px' }}>100%</span>

                    </div>

                    <div style={{ height: '8px', backgroundColor: colors.lightGray, borderRadius: '4px', overflow: 'hidden' }}>

                      <div style={{ width: '100%', height: '100%', backgroundColor: colors.success, transition: 'width 0.3s' }}></div>

                    </div>

                  </div>

                  <button style={{

                    marginLeft: '24px',

                    backgroundColor: colors.success,

                    color: 'white',

                    padding: '10px 20px',

                    borderRadius: '6px',

                    border: 'none',

                    cursor: 'pointer',

                    fontSize: '14px',

                    fontWeight: '700',

                    letterSpacing: '0.2px'

                  }}>

                    View Section

                  </button>

                </div>

              ))}

            </div>

          </div>

        </div>

        {aiModalOpen ? (
          <div
            onClick={() => {
              if (!aiDrafting && !exporting) {
                resetAiModalState();
              }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 25, 35, 0.52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1800
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '980px',
                maxHeight: '85vh',
                overflow: 'hidden',
                backgroundColor: 'white',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto'
              }}
            >
              <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>AI Writing for Full Report</div>
                  <div style={{ fontSize: '12px', opacity: 0.92, marginTop: '2px' }}>
                    Select the narrative fields you want ChatGPT to expand before the report is exported.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetAiModalState}
                  disabled={aiDrafting || exporting}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: aiDrafting || exporting ? 'not-allowed' : 'pointer', fontSize: '18px', fontWeight: '700' }}
                  aria-label="Close"
                >
                  x
                </button>
              </div>

              <div style={{ padding: '22px', overflowY: 'auto', display: 'grid', gap: '18px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '700' }}>
                    {selectedCount} field{selectedCount === 1 ? '' : 's'} selected for AI drafting
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAllAiFields}
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${colors.border}`,
                      color: colors.primary,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {allFieldsSelected ? 'Clear Selection' : 'Select All'}
                  </button>
                </div>

                {aiOptions.length === 0 ? (
                  <div style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '20px', color: colors.mediumGray, fontSize: '14px' }}>
                    No AI-eligible narrative fields were found in this report payload. You can still generate the report as-is.
                  </div>
                ) : (
                  aiOptions.map((group) => (
                    <div key={group.sectionId} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: colors.darkGray, marginBottom: '14px' }}>
                        {group.sectionTitle}
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {(Array.isArray(group.fields) ? group.fields : []).map((field) => {
                          const key = fieldSelectionKey(field.sectionId, field.fieldKey);
                          const checked = selectedAiFields.includes(key);
                          return (
                            <label
                              key={key}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '18px 1fr',
                                gap: '12px',
                                alignItems: 'start',
                                padding: '12px 14px',
                                border: checked ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                                borderRadius: '10px',
                                backgroundColor: checked ? 'rgba(139, 21, 56, 0.06)' : '#fff'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleAiField(field.sectionId, field.fieldKey)}
                                style={{ marginTop: '2px' }}
                              />
                              <div style={{ display: 'grid', gap: '6px' }}>
                                <div style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '700' }}>{field.label}</div>
                                <div style={{ color: colors.mediumGray, fontSize: '12px', lineHeight: 1.5 }}>
                                  {field.currentValue ? `Current text: ${field.currentValue}` : 'Current text is empty. AI will draft a report-ready version from the section context when possible.'}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}

                {aiModalError ? (
                  <div style={{ padding: '12px 16px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', color: '#721c24', fontSize: '14px' }}>
                    {aiModalError}
                  </div>
                ) : null}
              </div>

              <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderTop: `1px solid ${colors.border}`, flexWrap: 'wrap' }}>
                <div style={{ color: colors.mediumGray, fontSize: '12px', maxWidth: '520px', lineHeight: 1.5 }}>
                  Tables and uploaded files are excluded. The AI step only rewrites selected narrative fields, then the report is exported with the same DOCX format.
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={resetAiModalState}
                    disabled={aiDrafting || exporting}
                    style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: aiDrafting || exporting ? 'not-allowed' : 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateReportAsIs}
                    disabled={aiDrafting || exporting}
                    style={{ backgroundColor: 'white', border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: aiDrafting || exporting ? 'not-allowed' : 'pointer' }}
                  >
                    {exporting && !aiDrafting ? 'Generating...' : 'Generate As Is'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateReportWithAi}
                    disabled={aiDrafting || exporting || selectedCount === 0}
                    style={{
                      backgroundColor: aiDrafting || exporting || selectedCount === 0 ? '#d8d8dd' : colors.primary,
                      border: 'none',
                      color: aiDrafting || exporting || selectedCount === 0 ? '#6c757d' : 'white',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: '700',
                      cursor: aiDrafting || exporting || selectedCount === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {aiDrafting ? 'Writing with AI...' : `Generate with AI (${selectedCount})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

    );

  };



  // Background Information Page

  const BackgroundPage = ({ onToggleSidebar, onBack }) => {
    const cycleId = localStorage.getItem('currentCycleId') || 1;
    const programId = localStorage.getItem('currentProgramId') || 1;
    const { programName, cycleLabel, subtitle } = getActiveContext();
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [aiImportModal, setAiImportModal] = useState({ open: false, sectionTitle: '' });
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [aiImportStatus, setAiImportStatus] = useState('');
    const [aiImportLoading, setAiImportLoading] = useState(false);
    const [formData, setFormData] = useState({
      contactName: '',
      positionTitle: '',
      officeLocation: '',
      phoneNumber: '',
      emailAddress: '',
      yearImplemented: '',
      lastReviewDate: '',
      majorChanges: ''
    });

    useEffect(() => {
      const fetchBackgroundData = async () => {
        try {
          setLoading(true);
          setSaveError('');
          const result = await apiRequest(`/cycles/${cycleId}/background/`, { method: 'GET' });
          setFormData((prev) => ({
            ...prev,
            contactName: `${result?.contactName ?? ''}`,
            positionTitle: `${result?.positionTitle ?? ''}`,
            officeLocation: `${result?.officeLocation ?? ''}`,
            phoneNumber: `${result?.phoneNumber ?? ''}`,
            emailAddress: `${result?.emailAddress ?? ''}`,
            yearImplemented: `${result?.yearImplemented ?? ''}`,
            lastReviewDate: `${result?.lastReviewDate ?? ''}`,
            majorChanges: `${result?.majorChanges ?? ''}`,
          }));
        } catch (error) {
          setSaveError(`Unable to load background information: ${error?.message || 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      };
      fetchBackgroundData();
    }, [cycleId]);

    const parseValidDate = (value) => {
      const text = `${value || ''}`.trim();
      if (!text) return null;

      const yyyyMmDd = /^(\d{4})-(\d{2})-(\d{2})$/;
      const yyyyMmDdSlash = /^(\d{4})\/(\d{2})\/(\d{2})$/;
      const mmDdYyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;

      let year;
      let month;
      let day;
      if (yyyyMmDd.test(text)) {
        const match = text.match(yyyyMmDd);
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
      } else if (yyyyMmDdSlash.test(text)) {
        const match = text.match(yyyyMmDdSlash);
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
      } else if (mmDdYyyy.test(text)) {
        const match = text.match(mmDdYyyy);
        month = Number(match[1]);
        day = Number(match[2]);
        year = Number(match[3]);
      } else {
        return null;
      }

      const parsed = new Date(year, month - 1, day);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
      ) {
        return null;
      }
      return parsed;
    };

    const validateBackgroundForm = () => {
      const today = new Date();

      const yearText = `${formData.yearImplemented || ''}`.trim();
      if (yearText && !/^\d{4}$/.test(yearText)) {
        return 'Year Implemented must be a 4-digit number.';
      }
      if (yearText && Number(yearText) > today.getFullYear()) {
        return 'Year Implemented cannot be in the future.';
      }

      const phoneText = `${formData.phoneNumber || ''}`.trim();
      if (phoneText) {
        const normalizedPhone = phoneText.replace(/[\s\-()]/g, '');
        if (!/^\+?\d+$/.test(normalizedPhone)) {
          return 'Phone Number must contain only numbers.';
        }
      }

      const reviewDateText = `${formData.lastReviewDate || ''}`.trim();
      if (reviewDateText) {
        const parsedReviewDate = parseValidDate(reviewDateText);
        if (!parsedReviewDate) {
          return 'Date of Last General Review must be a valid date (YYYY-MM-DD, YYYY/MM/DD, or MM/DD/YYYY).';
        }
        if (parsedReviewDate > today) {
          return 'Date of Last General Review cannot be in the future.';
        }
        if (yearText && Number(yearText) > parsedReviewDate.getFullYear()) {
          return 'Year Implemented cannot be after Date of Last General Review.';
        }
      }

      return '';
    };

    const handleSaveDraft = async () => {
      try {
        setLoading(true);
        setSaveError('');
        setSaveSuccess(false);

        const validationError = validateBackgroundForm();
        if (validationError) {
          setSaveError(validationError);
          return;
        }

        const saved = await apiRequest(`/cycles/${cycleId}/background/`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setFormData((prev) => ({
          ...prev,
          contactName: `${saved?.contactName ?? prev.contactName}`,
          positionTitle: `${saved?.positionTitle ?? prev.positionTitle}`,
          officeLocation: `${saved?.officeLocation ?? prev.officeLocation}`,
          phoneNumber: `${saved?.phoneNumber ?? prev.phoneNumber}`,
          emailAddress: `${saved?.emailAddress ?? prev.emailAddress}`,
          yearImplemented: `${saved?.yearImplemented ?? prev.yearImplemented}`,
          lastReviewDate: `${saved?.lastReviewDate ?? prev.lastReviewDate}`,
          majorChanges: `${saved?.majorChanges ?? prev.majorChanges}`,
        }));

        localStorage.setItem('checklistNeedsRefresh', 'true');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        setSaveError(`Save failed: ${error?.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    const handleFieldChange = (field) => (event) => {
      const { value } = event.target;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const openAiImportModal = async (sectionTitle) => {
      setAiImportStatus('');
      setAiImportModal({ open: true, sectionTitle });
      try {
        const storedDocs = await listBackgroundSectionDocs(cycleId, sectionTitle);
        const mappedDocs = storedDocs.map((row) => ({
          id: row.id,
          name: row.name,
          size: row.size,
          type: row.type,
        }));
        setSelectedDocuments(mappedDocs);
      } catch (error) {
        setSelectedDocuments([]);
        setAiImportStatus(error?.message || 'Unable to load saved documents.');
      }
    };

    const closeAiImportModal = () => {
      setAiImportModal({ open: false, sectionTitle: '' });
      setSelectedDocuments([]);
      setAiImportStatus('');
      setAiImportLoading(false);
    };

    const handleStoreSectionDocuments = async (files) => {
      if (!aiImportModal.sectionTitle) return;
      if (!Array.isArray(files) || files.length === 0) return;
      try {
        await appendBackgroundSectionDocs(cycleId, aiImportModal.sectionTitle, files);
        const storedDocs = await listBackgroundSectionDocs(cycleId, aiImportModal.sectionTitle);
        const mappedDocs = storedDocs.map((row) => ({
          id: row.id,
          name: row.name,
          size: row.size,
          type: row.type,
        }));
        setSelectedDocuments(mappedDocs);
        setAiImportStatus(`${mappedDocs.length} file(s) saved for ${aiImportModal.sectionTitle}.`);
      } catch (error) {
        setAiImportStatus(error?.message || 'Unable to save selected documents.');
      }
    };

    const handleDocumentSelection = (event) => {
      const files = Array.from(event.target.files || []);
      handleStoreSectionDocuments(files);
    };

    const handleRemoveDocument = (docId) => {
      if (!docId || !aiImportModal.sectionTitle) return;
      deleteBackgroundDocById(docId)
        .then(() => listBackgroundSectionDocs(cycleId, aiImportModal.sectionTitle))
        .then((storedDocs) => {
          const mappedDocs = storedDocs.map((row) => ({
            id: row.id,
            name: row.name,
            size: row.size,
            type: row.type,
          }));
          setSelectedDocuments(mappedDocs);
          setAiImportStatus('Document removed.');
        })
        .catch((error) => {
          setAiImportStatus(error?.message || 'Unable to remove document.');
        });
    };

    const handleDownloadDocument = async (docId) => {
      if (!docId) return;
      try {
        const doc = await getBackgroundDocById(docId);
        if (!doc?.fileBlob) {
          setAiImportStatus('Selected file is not available.');
          return;
        }
        const objectUrl = URL.createObjectURL(doc.fileBlob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = doc.name || 'document';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      } catch (error) {
        setAiImportStatus(error?.message || 'Unable to download document.');
      }
    };

    const handleExtractWithAi = async () => {
      if (aiImportLoading) return;
      const eligibleFields = BACKGROUND_TEXTBOX_SECTION_FIELDS[aiImportModal.sectionTitle];
      if (!eligibleFields) {
        setAiImportStatus('Local AI extraction is not enabled for this section.');
        return;
      }
      if (selectedDocuments.length === 0) {
        setAiImportStatus('Upload at least one document before running Extract with AI.');
        return;
      }

      try {
        setAiImportLoading(true);
        setAiImportStatus('Reading the selected documents and extracting ABET-relevant information for this section...');

        const currentFields = eligibleFields.reduce((accumulator, field) => ({
          ...accumulator,
          [field]: `${formData?.[field] ?? ''}`,
        }), {});

        const result = await extractTextboxSectionWithLocalAi({
          cycleId,
          pageKey: 'background',
          sectionTitle: aiImportModal.sectionTitle,
          currentFields,
          selectedDocuments,
          loadStoredDocById: getBackgroundDocById,
        });

        setFormData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            eligibleFields.map((field) => [field, `${result?.mergedFields?.[field] ?? prev?.[field] ?? ''}`])
          ),
        }));

        setAiImportStatus(buildTextboxAiStatus(result, 'AI extraction completed.'));
      } catch (error) {
        setAiImportStatus(error?.message || 'AI extraction failed.');
      } finally {
        setAiImportLoading(false);
      }
    };

    const sectionActionButtonStyle = {
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
    };

    return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Background Information" subtitle={subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Background Information</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
                Program context, contacts, and history used across ABET criteria sections.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleSaveDraft} disabled={loading} style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
          {saveSuccess && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              color: '#155724',
              fontSize: '14px'
            }}>
              Saved successfully!
            </div>
          )}
          {saveError && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              color: '#721c24',
              fontSize: '14px'
            }}>
              {saveError}
            </div>
          )}
        </div>



        {/* Section A: Contact Information */}

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>

            <div>

              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>A. Contact Information</h3>

              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>List the main program contact person and institutional info</p>

            </div>

            <div style={{ display: 'grid', gap: '8px', justifyItems: 'end', maxWidth: '360px' }}>
              <button type="button" onClick={() => openAiImportModal('A. Contact Information')} style={sectionActionButtonStyle}>
                <Upload size={16} />
                Upload & AI Auto-fill
              </button>
            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Program Contact Name</label>

              <input type="text" value={formData.contactName} onChange={handleFieldChange('contactName')} placeholder="e.g., Dr. John Smith" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Position / Title</label>

              <input type="text" value={formData.positionTitle} onChange={handleFieldChange('positionTitle')} placeholder="e.g., Program Coordinator" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Office Location</label>

              <input type="text" value={formData.officeLocation} onChange={handleFieldChange('officeLocation')} placeholder="e.g., Engineering Building, Room 301" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Phone Number</label>

              <input type="text" inputMode="numeric" value={formData.phoneNumber} onChange={handleFieldChange('phoneNumber')} placeholder="e.g., +9611123456" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div style={{ gridColumn: '1 / -1' }}>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>

              <input type="email" value={formData.emailAddress} onChange={handleFieldChange('emailAddress')} placeholder="e.g., coordinator@aub.edu.lb" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

          </div>

        </div>



        {/* Section B: Program History */}

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>

            <div>

              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>B. Program History</h3>

              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>Describe when the program started and what changed since the last review</p>

            </div>

            <div style={{ display: 'grid', gap: '8px', justifyItems: 'end', maxWidth: '360px' }}>
              <button type="button" onClick={() => openAiImportModal('B. Program History')} style={sectionActionButtonStyle}>
                <Upload size={16} />
                Upload & AI Auto-fill
              </button>
            </div>

          </div>



          <div style={{ display: 'grid', gap: '20px' }}>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Year Implemented</label>

              <input type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={formData.yearImplemented} onChange={handleFieldChange('yearImplemented')} placeholder="e.g., 1995" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Date of Last General Review</label>

              <input type="text" value={formData.lastReviewDate} onChange={handleFieldChange('lastReviewDate')} placeholder="e.g., 2022-05-15" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Summary of Major Changes Since Last Review</label>

              <textarea value={formData.majorChanges} onChange={handleFieldChange('majorChanges')} placeholder="Describe the major curriculum changes, faculty updates, facilities improvements, etc." style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', minHeight: '120px' }} />

            </div>

          </div>

        </div>

        {aiImportModal.open && (
          <div
            onClick={closeAiImportModal}
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
              <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '800' }}>AI Document Import</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{aiImportModal.sectionTitle}</div>
                </div>
                <button onClick={closeAiImportModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                  x
                </button>
              </div>

              <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Select Documents
                  <input type="file" multiple onChange={handleDocumentSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
                </label>
                <EvidenceLibraryImport
                  cycleId={cycleId}
                  programId={programId}
                  onImportFiles={handleStoreSectionDocuments}
                />

                <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Selected Files
                  </div>
                  {selectedDocuments.length === 0 ? (
                    <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {selectedDocuments.map((file) => (
                        <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(file.id)}
                              style={{
                                backgroundColor: 'white',
                                border: `1px solid ${colors.border}`,
                                color: colors.primary,
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(file.id)}
                              style={{
                                backgroundColor: 'white',
                                border: `1px solid ${colors.border}`,
                                color: colors.danger,
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {aiImportStatus ? (
                  <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700', whiteSpace: 'pre-line' }}>
                    {aiImportStatus}
                  </div>
                ) : null}
              </div>

              <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
                <button type="button" onClick={closeAiImportModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                  <button
                    type="button"
                    onClick={handleExtractWithAi}
                    disabled={aiImportLoading || selectedDocuments.length === 0 || !BACKGROUND_TEXTBOX_SECTION_FIELDS[aiImportModal.sectionTitle]}
                    style={{
                      backgroundColor: aiImportLoading || selectedDocuments.length === 0 || !BACKGROUND_TEXTBOX_SECTION_FIELDS[aiImportModal.sectionTitle] ? '#d8d8dd' : colors.primary,
                      border: 'none',
                      color: aiImportLoading || selectedDocuments.length === 0 || !BACKGROUND_TEXTBOX_SECTION_FIELDS[aiImportModal.sectionTitle] ? '#6c757d' : 'white',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: '700',
                      cursor: aiImportLoading || selectedDocuments.length === 0 || !BACKGROUND_TEXTBOX_SECTION_FIELDS[aiImportModal.sectionTitle] ? 'not-allowed' : 'pointer'
                    }}
                  >
                  {aiImportLoading ? 'Extracting...' : 'Extract with AI'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>

  );
  };



    // Criterion 1 Page (ensure section blocks stay balanced to avoid bracket parse errors)


export { FullReportPage, BackgroundPage };
