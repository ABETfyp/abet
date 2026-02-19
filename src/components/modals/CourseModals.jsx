import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Eye, Plus, Save, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { colors, fontStack } from '../../styles/theme';
import { apiRequest } from '../../utils/api';
import EvidenceLibraryImport from '../shared/EvidenceLibraryImport';

const DOCS_DB = 'abet-syllabus-documents';
const DOCS_STORE = 'documents';

const openDocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(DOCS_DB, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(DOCS_STORE)) {
      const store = db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_scope', ['cycleId', 'programId', 'courseId', 'syllabusId'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open syllabus documents storage.'));
});

const listDocs = async (scope) => {
  const db = await openDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCS_STORE, 'readonly');
    const store = tx.objectStore(DOCS_STORE);
    const index = store.index('by_scope');
    const req = index.getAll(IDBKeyRange.only([String(scope.cycleId), String(scope.programId), String(scope.courseId), String(scope.syllabusId)]));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error('Unable to load stored documents.'));
  });
};

const appendDocs = async (scope, files) => {
  const db = await openDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCS_STORE, 'readwrite');
    const store = tx.objectStore(DOCS_STORE);
    const index = store.index('by_scope');
    const req = index.getAll(IDBKeyRange.only([String(scope.cycleId), String(scope.programId), String(scope.courseId), String(scope.syllabusId)]));
    req.onsuccess = () => {
      const existing = req.result || [];
      const existingSet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));
      files.forEach((file, idx) => {
        const key = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingSet.has(key)) return;
        store.put({
          id: `${scope.cycleId}-${scope.programId}-${scope.courseId}-${scope.syllabusId}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(scope.cycleId),
          programId: String(scope.programId),
          courseId: String(scope.courseId),
          syllabusId: String(scope.syllabusId),
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString()
        });
      });
    };
    req.onerror = () => reject(req.error || new Error('Unable to store documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store documents.'));
  });
};

const removeDoc = async (docId) => {
  const db = await openDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCS_STORE, 'readwrite');
    tx.objectStore(DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove document.'));
  });
};

const emptyAssessment = () => ({ assessment_type: '', weight_percentage: '' });
const emptyMapping = () => ({ clo_id: '', so_id: '' });

const mapPayloadToForm = (payload) => ({
  course: {
    course_code: payload?.course?.course_code || '',
    credits: payload?.course?.credits ?? 0,
    contact_hours: payload?.course?.contact_hours ?? 0,
    course_type: payload?.course?.course_type || 'Required'
  },
  section: {
    term: payload?.section?.term || '',
    faculty_id: payload?.section?.faculty_id ?? ''
  },
  syllabus: {
    catalog_description: payload?.syllabus?.catalog_description || '',
    weekly_topics: payload?.syllabus?.weekly_topics || '',
    design_content_percentage: payload?.syllabus?.design_content_percentage ?? 0,
    software_or_labs_tools_used: payload?.syllabus?.software_or_labs_tools_used || '',
    textbooks_text: (payload?.syllabus?.textbooks || []).map((row) => `${row.title_author_year || ''}${row.attribute ? ` | ${row.attribute}` : ''}`).join('\n'),
    supplements_text: (payload?.syllabus?.supplements || []).map((row) => row.material_discription || '').join('\n'),
    prerequisites_text: (payload?.syllabus?.prerequisites || []).map((row) => row.course_code || '').join(', '),
    corequisites_text: (payload?.syllabus?.corequisites || []).map((row) => row.course_code || '').join(', '),
    assessments: (payload?.syllabus?.assessments || []).length > 0
      ? payload.syllabus.assessments.map((row) => ({ assessment_type: row.assessment_type || '', weight_percentage: row.weight_percentage ?? '' }))
      : [emptyAssessment()],
    clo_mappings: (payload?.syllabus?.clo_mappings || []).length > 0
      ? payload.syllabus.clo_mappings.map((row) => ({ clo_id: row.clo_id ?? '', so_id: row.so_id ?? '' }))
      : [emptyMapping()]
  }
});

const asCodeList = (text) => text.split(/[,\n]/).map((value) => `${value}`.trim().toUpperCase()).filter(Boolean);
const asLineList = (text) => text.split('\n').map((value) => `${value}`.trim()).filter(Boolean);
const syllabusPath = ({ programId, courseId, syllabusId, cycleId }) => `/programs/${programId}/courses/${courseId}/sections/${syllabusId}/syllabus/?cycle_id=${cycleId}`;

const FieldLabel = ({ children }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px' }}>{children}</label>
);

const SectionCard = ({ title, children }) => (
  <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', backgroundColor: 'white', padding: '16px' }}>
    <div style={{ fontSize: '17px', fontWeight: '800', color: colors.darkGray, marginBottom: '12px' }}>{title}</div>
    {children}
  </div>
);

const SyllabusModal = ({
  selectedInstructor,
  selectedCourse,
  syllabusMode,
  setSelectedInstructor,
  setSyllabusMode,
  setSelectedCourse
}) => {
  if (!selectedInstructor || !syllabusMode) return null;

  const scope = {
    programId: Number(selectedInstructor.program_id || selectedCourse?.program_id || 0),
    courseId: Number(selectedInstructor.course_id || selectedCourse?.course_id || selectedCourse?.id || 0),
    syllabusId: Number(selectedInstructor.syllabus_id || 0),
    cycleId: Number(selectedInstructor.cycle_id || localStorage.getItem('currentCycleId') || 0)
  };

  const readOnly = syllabusMode === 'view';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payload, setPayload] = useState(null);
  const [form, setForm] = useState(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsStatus, setDocsStatus] = useState('');

  const closeModal = () => {
    setSelectedInstructor(null);
    setSyllabusMode(null);
    if (setSelectedCourse) setSelectedCourse(null);
  };

  const loadPayload = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await apiRequest(syllabusPath(scope), { method: 'GET' });
      setPayload(result);
      setForm(mapPayloadToForm(result));
    } catch (e) {
      setError(e?.message || 'Unable to load syllabus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scope.programId || !scope.courseId || !scope.syllabusId || !scope.cycleId) {
      setLoading(false);
      setError('Missing syllabus identifiers.');
      return;
    }
    loadPayload();
  }, [scope.programId, scope.courseId, scope.syllabusId, scope.cycleId]);

  const availableSos = useMemo(() => (Array.isArray(payload?.available_sos) ? payload.available_sos : []), [payload]);
  const availableClos = useMemo(() => (Array.isArray(payload?.available_clos) ? payload.available_clos : []), [payload]);
  const facultyOptions = useMemo(() => (Array.isArray(payload?.faculty_options) ? payload.faculty_options : []), [payload]);

  const setCourseField = (field, value) => setForm((prev) => ({ ...prev, course: { ...prev.course, [field]: value } }));
  const setSectionField = (field, value) => setForm((prev) => ({ ...prev, section: { ...prev.section, [field]: value } }));
  const setSyllabusField = (field, value) => setForm((prev) => ({ ...prev, syllabus: { ...prev.syllabus, [field]: value } }));
  const setAssessment = (index, patch) => setForm((prev) => {
    const rows = [...prev.syllabus.assessments];
    rows[index] = { ...rows[index], ...patch };
    return { ...prev, syllabus: { ...prev.syllabus, assessments: rows } };
  });
  const setMapping = (index, patch) => setForm((prev) => {
    const rows = [...prev.syllabus.clo_mappings];
    rows[index] = { ...rows[index], ...patch };
    return { ...prev, syllabus: { ...prev.syllabus, clo_mappings: rows } };
  });

  const saveDraft = async () => {
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const textbooks = asLineList(form.syllabus.textbooks_text).map((line) => {
        const [title, attr] = line.split('|');
        return { title_author_year: `${title || ''}`.trim(), attribute: `${attr || ''}`.trim() };
      }).filter((row) => row.title_author_year);
      const supplements = asLineList(form.syllabus.supplements_text).map((line) => ({ material_discription: line }));
      const prerequisites = asCodeList(form.syllabus.prerequisites_text).map((code) => ({ course_code: code }));
      const corequisites = asCodeList(form.syllabus.corequisites_text).map((code) => ({ course_code: code }));
      const assessments = form.syllabus.assessments
        .map((row) => ({ assessment_type: `${row.assessment_type || ''}`.trim(), weight_percentage: Number(row.weight_percentage || 0) }))
        .filter((row) => row.assessment_type);
      const clo_mappings = form.syllabus.clo_mappings
        .map((row) => ({ clo_id: Number(row.clo_id || 0), so_id: row.so_id ? Number(row.so_id) : null }))
        .filter((row) => row.clo_id > 0);

      await apiRequest(syllabusPath(scope), {
        method: 'PUT',
        body: JSON.stringify({
          course: {
            course_code: `${form.course.course_code || ''}`.trim().toUpperCase(),
            credits: Number(form.course.credits || 0),
            contact_hours: Number(form.course.contact_hours || 0),
            course_type: `${form.course.course_type || 'Required'}`
          },
          section: {
            term: `${form.section.term || ''}`.trim(),
            faculty_id: Number(form.section.faculty_id || 0)
          },
          syllabus: {
            catalog_description: `${form.syllabus.catalog_description || ''}`,
            weekly_topics: `${form.syllabus.weekly_topics || ''}`,
            design_content_percentage: Number(form.syllabus.design_content_percentage || 0),
            software_or_labs_tools_used: `${form.syllabus.software_or_labs_tools_used || ''}`,
            textbooks,
            supplements,
            prerequisites,
            corequisites,
            assessments,
            clo_mappings
          }
        })
      });
      setSuccess('Saved successfully.');
      window.dispatchEvent(new CustomEvent('courses-updated'));
      loadPayload();
    } catch (e) {
      setError(e?.message || 'Unable to save syllabus.');
    } finally {
      setSaving(false);
    }
  };

  const openDocuments = async () => {
    try {
      setDocsStatus('');
      const rows = await listDocs(scope);
      setDocs(rows);
      setDocsOpen(true);
    } catch (e) {
      setDocs([]);
      setDocsStatus(e?.message || 'Unable to load documents.');
      setDocsOpen(true);
    }
  };

  const handleDocsFiles = async (files) => {
    const selectedFiles = Array.isArray(files) ? files : [];
    if (selectedFiles.length === 0) return;
    try {
      await appendDocs(scope, selectedFiles);
      const rows = await listDocs(scope);
      setDocs(rows);
      setDocsStatus(`${rows.length} file(s) stored.`);
    } catch (e) {
      setDocsStatus(e?.message || 'Unable to store files.');
    }
  };

  const onFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    await handleDocsFiles(files);
  };

  const onRemoveFile = async (docId) => {
    try {
      await removeDoc(docId);
      const rows = await listDocs(scope);
      setDocs(rows);
      setDocsStatus('Document removed.');
    } catch (e) {
      setDocsStatus(e?.message || 'Unable to remove file.');
    }
  };

  return (
    <div onClick={closeModal} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '1140px', maxHeight: '92vh', overflow: 'auto', borderRadius: '12px', backgroundColor: '#f6f7f9', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', fontFamily: fontStack }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', borderBottom: `1px solid ${colors.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.darkGray }}>{loading ? 'Loading syllabus...' : `${form?.course?.course_code || selectedCourse?.code || 'Course'} Syllabus`}</div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: colors.mediumGray }}>{readOnly ? 'View mode' : 'Edit mode'} - {selectedInstructor?.name || 'Instructor'}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {readOnly ? (
              <button type="button" onClick={() => setSyllabusMode('edit')} style={{ backgroundColor: 'white', border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Edit size={16} />
                Edit
              </button>
            ) : (
              <button type="button" onClick={saveDraft} disabled={saving || loading} style={{ backgroundColor: colors.primary, border: 'none', color: 'white', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: saving || loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving || loading ? 0.7 : 1 }}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            )}
            <button onClick={closeModal} type="button" style={{ background: 'none', border: 'none', color: colors.mediumGray, cursor: 'pointer', padding: '6px' }}><X size={22} /></button>
          </div>
        </div>

        <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
          {error ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #f5c6cb', backgroundColor: '#f8d7da', color: '#721c24', fontSize: '13px', fontWeight: '700' }}>{error}</div> : null}
          {success ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #b7ebc6', backgroundColor: '#e6f7ec', color: '#155724', fontSize: '13px', fontWeight: '700' }}>{success}</div> : null}

          <SectionCard title="Syllabus Documents">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={openDocuments} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={15} />
                Upload Syllabus Documents
              </button>
              <button type="button" disabled style={{ backgroundColor: '#d8d8dd', color: '#6c757d', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: 'not-allowed' }}>Extract with AI</button>
            </div>
          </SectionCard>

          {!loading && form ? (
            <>
              <SectionCard title="Course And Section Setup">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  <div>
                    <FieldLabel>Course Code</FieldLabel>
                    <input type="text" value={form.course.course_code} disabled={readOnly} onChange={(event) => setCourseField('course_code', event.target.value.toUpperCase())} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div>
                    <FieldLabel>Course Type</FieldLabel>
                    <select value={form.course.course_type} disabled={readOnly} onChange={(event) => setCourseField('course_type', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }}>
                      <option value="Required">Required</option>
                      <option value="Elective">Elective</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Credits</FieldLabel>
                    <input type="number" min="0" step="1" value={form.course.credits} disabled={readOnly} onChange={(event) => setCourseField('credits', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div>
                    <FieldLabel>Contact Hours</FieldLabel>
                    <input type="number" min="0" step="1" value={form.course.contact_hours} disabled={readOnly} onChange={(event) => setCourseField('contact_hours', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div>
                    <FieldLabel>Term</FieldLabel>
                    <input type="text" value={form.section.term} disabled={readOnly} onChange={(event) => setSectionField('term', event.target.value)} placeholder="e.g., Fall 2026" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div>
                    <FieldLabel>Instructor</FieldLabel>
                    <select value={form.section.faculty_id} disabled={readOnly} onChange={(event) => setSectionField('faculty_id', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }}>
                      <option value="">Select instructor</option>
                      {facultyOptions.map((option) => (
                        <option key={option.faculty_id} value={option.faculty_id}>{option.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Course Content">
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <FieldLabel>Catalog Description</FieldLabel>
                    <textarea rows={4} value={form.syllabus.catalog_description} disabled={readOnly} onChange={(event) => setSyllabusField('catalog_description', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div>
                    <FieldLabel>Weekly Topics</FieldLabel>
                    <textarea rows={5} value={form.syllabus.weekly_topics} disabled={readOnly} onChange={(event) => setSyllabusField('weekly_topics', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div>
                      <FieldLabel>Design Content %</FieldLabel>
                      <input type="number" min="0" max="100" step="0.1" value={form.syllabus.design_content_percentage} disabled={readOnly} onChange={(event) => setSyllabusField('design_content_percentage', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                    </div>
                    <div>
                      <FieldLabel>Software / Lab Tools</FieldLabel>
                      <input type="text" value={form.syllabus.software_or_labs_tools_used} disabled={readOnly} onChange={(event) => setSyllabusField('software_or_labs_tools_used', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Materials And Requirements">
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <FieldLabel>Textbooks (one per line, optional "| Attribute")</FieldLabel>
                    <textarea rows={4} value={form.syllabus.textbooks_text} disabled={readOnly} onChange={(event) => setSyllabusField('textbooks_text', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div>
                    <FieldLabel>Supplemental Materials (one per line)</FieldLabel>
                    <textarea rows={3} value={form.syllabus.supplements_text} disabled={readOnly} onChange={(event) => setSyllabusField('supplements_text', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <FieldLabel>Prerequisites (comma separated)</FieldLabel>
                      <input type="text" value={form.syllabus.prerequisites_text} disabled={readOnly} onChange={(event) => setSyllabusField('prerequisites_text', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                    </div>
                    <div>
                      <FieldLabel>Corequisites (comma separated)</FieldLabel>
                      <input type="text" value={form.syllabus.corequisites_text} disabled={readOnly} onChange={(event) => setSyllabusField('corequisites_text', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Assessments">
                <div style={{ display: 'grid', gap: '8px' }}>
                  {form.syllabus.assessments.map((row, index) => (
                    <div key={`assessment-${index}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px' }}>
                      <input type="text" value={row.assessment_type} disabled={readOnly} onChange={(event) => setAssessment(index, { assessment_type: event.target.value })} placeholder="Assessment type" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                      <input type="number" min="0" max="100" step="0.1" value={row.weight_percentage} disabled={readOnly} onChange={(event) => setAssessment(index, { weight_percentage: event.target.value })} placeholder="Weight %" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                      {!readOnly ? <button type="button" onClick={() => setForm((prev) => ({ ...prev, syllabus: { ...prev.syllabus, assessments: prev.syllabus.assessments.length > 1 ? prev.syllabus.assessments.filter((_, i) => i !== index) : [emptyAssessment()] } }))} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                    </div>
                  ))}
                  {!readOnly ? <button type="button" onClick={() => setForm((prev) => ({ ...prev, syllabus: { ...prev.syllabus, assessments: [...prev.syllabus.assessments, emptyAssessment()] } }))} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Plus size={14} />Add Assessment</button> : null}
                </div>
              </SectionCard>

              <SectionCard title="CLO To SO Mapping">
                <div style={{ display: 'grid', gap: '8px' }}>
                  {form.syllabus.clo_mappings.map((row, index) => (
                    <div key={`mapping-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                      <select value={row.clo_id} disabled={readOnly} onChange={(event) => setMapping(index, { clo_id: event.target.value })} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }}>
                        <option value="">Select CLO</option>
                        {availableClos.map((clo) => <option key={clo.clo_id} value={clo.clo_id}>{clo.display_code}: {clo.description}</option>)}
                      </select>
                      <select value={row.so_id ?? ''} disabled={readOnly} onChange={(event) => setMapping(index, { so_id: event.target.value })} style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }}>
                        <option value="">Unmapped</option>
                        {availableSos.map((so) => <option key={so.so_id} value={so.so_id}>{so.display_code}: {so.so_discription}</option>)}
                      </select>
                      {!readOnly ? <button type="button" onClick={() => setForm((prev) => ({ ...prev, syllabus: { ...prev.syllabus, clo_mappings: prev.syllabus.clo_mappings.length > 1 ? prev.syllabus.clo_mappings.filter((_, i) => i !== index) : [emptyMapping()] } }))} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                    </div>
                  ))}
                  {!readOnly ? <button type="button" onClick={() => setForm((prev) => ({ ...prev, syllabus: { ...prev.syllabus, clo_mappings: [...prev.syllabus.clo_mappings, emptyMapping()] } }))} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Plus size={14} />Add Mapping</button> : null}
                </div>
              </SectionCard>
            </>
          ) : null}
        </div>
      </div>
      {docsOpen && (
        <div onClick={() => setDocsOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20, 25, 35, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2200 }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '700px', backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${colors.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '800' }}>AI Document Import</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Instructor Syllabus</div>
              </div>
              <button onClick={() => setDocsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">x</button>
            </div>
            <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                Select Documents
                <input type="file" multiple onChange={onFiles} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
              </label>
              <EvidenceLibraryImport
                cycleId={scope.cycleId}
                programId={scope.programId}
                onImportFiles={handleDocsFiles}
              />
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Selected Files</div>
                {docs.length === 0 ? <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div> : docs.map((file) => (
                  <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <button type="button" onClick={() => onRemoveFile(file.id)} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
              </div>
              {docsStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{docsStatus}</div> : null}
            </div>
            <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
              <button type="button" onClick={() => setDocsOpen(false)} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>Close</button>
              <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>Extract with AI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CourseSummaryModal = ({
  selectedCourse,
  selectedInstructor,
  setSelectedCourse,
  setSelectedInstructor,
  setSyllabusMode
}) => {
  if (!selectedCourse || selectedInstructor) return null;
  const sections = Array.isArray(selectedCourse.sections) ? selectedCourse.sections : [];
  return (
    <div onClick={() => setSelectedCourse(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 2050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '980px', maxHeight: '90vh', overflow: 'auto', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', fontFamily: fontStack }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', borderBottom: `1px solid ${colors.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.darkGray }}>{selectedCourse.code} Syllabus Workspace</div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: colors.mediumGray }}>{selectedCourse.credits} credits - {selectedCourse.contact_hours} contact hours - {selectedCourse.course_type}</div>
          </div>
          <button type="button" onClick={() => setSelectedCourse(null)} style={{ background: 'none', border: 'none', color: colors.mediumGray, cursor: 'pointer', padding: '6px' }}><X size={22} /></button>
        </div>
        <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
          <SectionCard title="Common Syllabus Generation">
            <button type="button" disabled style={{ backgroundColor: '#eceef2', color: colors.mediumGray, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} />
              Generate Common Syllabus
            </button>
          </SectionCard>
          <SectionCard title={`Instructor Sections (${sections.length})`}>
            {sections.length === 0 ? <div style={{ fontSize: '13px', color: colors.mediumGray }}>No sections yet. Add sections from Courses in the sidebar.</div> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {sections.map((section) => (
                  <div key={section.syllabus_id} style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: colors.darkGray }}>{section.faculty_name || `Faculty #${section.faculty_id}`}</div>
                      <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '2px' }}>{section.term}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => { setSelectedInstructor({ ...section, name: section.faculty_name, course_id: selectedCourse.course_id || selectedCourse.id, program_id: selectedCourse.program_id, cycle_id: selectedCourse.cycle_id || localStorage.getItem('currentCycleId') }); setSyllabusMode('view'); }} style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '7px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Eye size={14} />
                        View
                      </button>
                      <button type="button" onClick={() => { setSelectedInstructor({ ...section, name: section.faculty_name, course_id: selectedCourse.course_id || selectedCourse.id, program_id: selectedCourse.program_id, cycle_id: selectedCourse.cycle_id || localStorage.getItem('currentCycleId') }); setSyllabusMode('edit'); }} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '7px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Edit size={14} />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export { SyllabusModal, CourseSummaryModal };
