import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Save, Upload } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';
import { getActiveContext } from '../utils/activeContext';

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

  const FullReportPage = ({ onToggleSidebar, onBack }) => {
    const { programName, cycleLabel } = getActiveContext();

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

              <span>Last updated: November 25, 2025</span>

              <button

                style={{

                  display: 'inline-flex',

                  alignItems: 'center',

                  gap: '8px',

                  backgroundColor: colors.primary,

                  color: 'white',

                  padding: '12px 18px',

                  borderRadius: '8px',

                  border: 'none',

                  cursor: 'pointer',

                  fontSize: '14px',

                  fontWeight: '700',

                  letterSpacing: '0.2px'

                }}

              >

                <FileText size={18} />

                Generate Full Report

              </button>

            </div>

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

      </div>

    );

  };



  // Background Information Page

  const BackgroundPage = ({ onToggleSidebar, onBack }) => {
    const cycleId = localStorage.getItem('currentCycleId') || 1;
    const { programName, cycleLabel, subtitle } = getActiveContext();
    const draftStorageKey = `backgroundInfoDraft_${cycleId}`;
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [aiImportModal, setAiImportModal] = useState({ open: false, sectionTitle: '' });
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [aiImportStatus, setAiImportStatus] = useState('');
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
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (_error) {
        // Ignore invalid local draft payloads.
      }
    }, [draftStorageKey]);

    const updateBackgroundChecklist = async (completionPercentage) => {
      const checklistResult = await apiRequest(`/cycles/${cycleId}/checklist/`, { method: 'GET' });
      const backgroundItem = checklistResult?.items?.find((row) => Number(row?.criterion_number) === 0);
      if (!backgroundItem?.item_id) {
        throw new Error('Background checklist item not found.');
      }
      const checklistItem = await apiRequest(`/checklist-items/${backgroundItem.item_id}/`, { method: 'GET' });
      await apiRequest(`/checklist-items/${backgroundItem.item_id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          ...checklistItem,
          status: completionPercentage >= 100 ? 1 : 0,
          completion_percentage: completionPercentage
        })
      });
    };

    const handleSaveDraft = async () => {
      try {
        setLoading(true);
        setSaveError('');
        setSaveSuccess(false);
        localStorage.setItem(draftStorageKey, JSON.stringify(formData));

        const trackedFields = Object.values(formData);
        const completedCount = trackedFields.filter((value) => `${value}`.trim() !== '').length;
        const completion = Math.round((completedCount / trackedFields.length) * 100);
        await updateBackgroundChecklist(completion);

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
    };

    const handleDocumentSelection = (event) => {
      if (!aiImportModal.sectionTitle) return;
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      appendBackgroundSectionDocs(cycleId, aiImportModal.sectionTitle, files)
        .then(() => {
          return listBackgroundSectionDocs(cycleId, aiImportModal.sectionTitle);
        })
        .then((storedDocs) => {
          const mappedDocs = storedDocs.map((row) => ({
            id: row.id,
            name: row.name,
            size: row.size,
            type: row.type,
          }));
          setSelectedDocuments(mappedDocs);
          setAiImportStatus(`${mappedDocs.length} file(s) saved for ${aiImportModal.sectionTitle}.`);
        })
        .catch((error) => {
          setAiImportStatus(error?.message || 'Unable to save selected documents.');
        });
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

              <input type="text" value={formData.phoneNumber} onChange={handleFieldChange('phoneNumber')} placeholder="e.g., +961 1 123456" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

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

              <input type="text" value={formData.yearImplemented} onChange={handleFieldChange('yearImplemented')} placeholder="e.g., 1995" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

            </div>

            <div>

              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Date of Last General Review</label>

              <input type="text" value={formData.lastReviewDate} onChange={handleFieldChange('lastReviewDate')} placeholder="e.g., 2022" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

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
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {aiImportStatus ? (
                  <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>
                    {aiImportStatus}
                  </div>
                ) : null}
              </div>

              <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
                <button type="button" onClick={closeAiImportModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
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



    // Criterion 1 Page (ensure section blocks stay balanced to avoid bracket parse errors)


export { FullReportPage, BackgroundPage };
