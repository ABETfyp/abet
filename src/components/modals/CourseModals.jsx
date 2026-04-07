import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Save, Trash2, Upload, X } from 'lucide-react';
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
const emptyWeekTopic = () => ({ week: '', topic: '' });
const emptyTextbook = () => ({ title_author_year: '', attribute: '' });
const emptySupplement = () => ({ material_discription: '' });
const emptyCourseCode = () => ({ course_code: '' });
const sectionInstructorLabel = (section) => section?.faculty_name || (section?.faculty_id ? `Faculty #${section.faculty_id}` : 'Unassigned instructor');

const toTrimmedLines = (text) => `${text || ''}`.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const parseWeeklyTopics = (text) => {
  const rows = toTrimmedLines(text).map((line, index) => {
    const match = line.match(/^week\s*([0-9]+)\s*[:\-]\s*(.+)$/i);
    if (match) return { week: match[1], topic: match[2].trim() };
    return { week: String(index + 1), topic: line };
  });
  return rows.length > 0 ? rows : [emptyWeekTopic()];
};
const rowListOrEmpty = (rows, fallbackFactory) => (rows.length > 0 ? rows : [fallbackFactory()]);

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
    weekly_topics_rows: parseWeeklyTopics(payload?.syllabus?.weekly_topics || ''),
    design_content_percentage: payload?.syllabus?.design_content_percentage ?? 0,
    software_or_labs_tools_used: payload?.syllabus?.software_or_labs_tools_used || '',
    textbooks_rows: rowListOrEmpty(
      (payload?.syllabus?.textbooks || []).map((row) => ({
        title_author_year: row?.title_author_year || '',
        attribute: row?.attribute || '',
      })),
      emptyTextbook
    ),
    supplements_rows: rowListOrEmpty(
      (payload?.syllabus?.supplements || []).map((row) => ({ material_discription: row?.material_discription || '' })),
      emptySupplement
    ),
    prerequisites_rows: rowListOrEmpty(
      (payload?.syllabus?.prerequisites || []).map((row) => ({ course_code: `${row?.course_code || ''}`.toUpperCase() })),
      emptyCourseCode
    ),
    corequisites_rows: rowListOrEmpty(
      (payload?.syllabus?.corequisites || []).map((row) => ({ course_code: `${row?.course_code || ''}`.toUpperCase() })),
      emptyCourseCode
    ),
    assessments: (payload?.syllabus?.assessments || []).length > 0
      ? payload.syllabus.assessments.map((row) => ({ assessment_type: row.assessment_type || '', weight_percentage: row.weight_percentage ?? '' }))
      : [emptyAssessment()],
    clo_mappings: (payload?.syllabus?.clo_mappings || []).length > 0
      ? payload.syllabus.clo_mappings.map((row) => ({ clo_id: row.clo_id ?? '', so_id: row.so_id ?? '' }))
      : [emptyMapping()]
  }
});
const syllabusPath = ({ programId, courseId, syllabusId, cycleId }) => `/programs/${programId}/courses/${courseId}/sections/${syllabusId}/syllabus/?cycle_id=${cycleId}`;
const coursePath = ({ programId, courseId, cycleId }) => `/programs/${programId}/courses/${courseId}/?cycle_id=${cycleId}`;
const sectionPath = ({ programId, courseId, syllabusId, cycleId }) => `/programs/${programId}/courses/${courseId}/sections/${syllabusId}/?cycle_id=${cycleId}`;

const FieldLabel = ({ children }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px' }}>{children}</label>
);

const SectionCard = ({ title, children }) => (
  <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', backgroundColor: 'white', padding: '16px' }}>
    <div style={{ fontSize: '17px', fontWeight: '800', color: colors.darkGray, marginBottom: '12px' }}>{title}</div>
    {children}
  </div>
);

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.58)',
  zIndex: 2100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const panelStyle = {
  width: '100%',
  maxWidth: '860px',
  maxHeight: '92vh',
  overflow: 'auto',
  borderRadius: '12px',
  backgroundColor: '#f6f7f9',
  boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
  fontFamily: fontStack
};

const stickyHeaderStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: 'white',
  borderBottom: `1px solid ${colors.border}`,
  padding: '20px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const CourseEditorModal = ({
  selectedCourse,
  syllabusMode,
  setSelectedCourse,
  setSyllabusMode
}) => {
  if (!selectedCourse || syllabusMode !== 'course-edit') return null;

  const scope = {
    programId: Number(selectedCourse.program_id || 0),
    courseId: Number(selectedCourse.course_id || selectedCourse.id || 0),
    cycleId: Number(selectedCourse.cycle_id || localStorage.getItem('currentCycleId') || 0)
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    course_code: selectedCourse.code || '',
    credits: selectedCourse.credits ?? 0,
    contact_hours: selectedCourse.contact_hours ?? 0,
    course_type: selectedCourse.course_type || 'Required'
  });

  useEffect(() => {
    setForm({
      course_code: selectedCourse.code || '',
      credits: selectedCourse.credits ?? 0,
      contact_hours: selectedCourse.contact_hours ?? 0,
      course_type: selectedCourse.course_type || 'Required'
    });
    setError('');
    setSuccess('');
  }, [selectedCourse]);

  const closeModal = () => {
    setSelectedCourse(null);
    setSyllabusMode(null);
  };

  const setCourseField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveCourse = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      setLoading(true);
      const result = await apiRequest(coursePath(scope), {
        method: 'PUT',
        body: JSON.stringify({
          course_code: `${form.course_code || ''}`.trim().toUpperCase(),
          credits: Number(form.credits || 0),
          contact_hours: Number(form.contact_hours || 0),
          course_type: `${form.course_type || 'Required'}`.trim() || 'Required'
        })
      });
      setSelectedCourse((prev) => ({
        ...(prev || {}),
        ...result,
        code: result.code,
        course_id: result.course_id || scope.courseId,
        program_id: scope.programId,
        cycle_id: scope.cycleId
      }));
      setForm({
        course_code: result.code || '',
        credits: result.credits ?? 0,
        contact_hours: result.contact_hours ?? 0,
        course_type: result.course_type || 'Required'
      });
      setSuccess('Course updated successfully.');
      window.dispatchEvent(new CustomEvent('courses-updated'));
    } catch (e) {
      setError(e?.message || 'Unable to update course.');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  return (
    <div onClick={closeModal} style={overlayStyle}>
      <div onClick={(event) => event.stopPropagation()} style={panelStyle}>
        <div style={stickyHeaderStyle}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.darkGray }}>
              {selectedCourse.code || 'Course'} Setup
            </div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: colors.mediumGray }}>
              Edit course-level information
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" onClick={saveCourse} disabled={saving || loading} style={{ backgroundColor: colors.primary, border: 'none', color: 'white', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: saving || loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving || loading ? 0.7 : 1 }}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Course'}
            </button>
            <button onClick={closeModal} type="button" style={{ background: 'none', border: 'none', color: colors.mediumGray, cursor: 'pointer', padding: '6px' }}><X size={22} /></button>
          </div>
        </div>

        <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
          {error ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #f5c6cb', backgroundColor: '#f8d7da', color: '#721c24', fontSize: '13px', fontWeight: '700' }}>{error}</div> : null}
          {success ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #b7ebc6', backgroundColor: '#e6f7ec', color: '#155724', fontSize: '13px', fontWeight: '700' }}>{success}</div> : null}

          <SectionCard title="Course Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <FieldLabel>Course Code</FieldLabel>
                <input type="text" value={form.course_code} onChange={(event) => setCourseField('course_code', event.target.value.toUpperCase())} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }} />
              </div>
              <div>
                <FieldLabel>Course Type</FieldLabel>
                <select value={form.course_type} onChange={(event) => setCourseField('course_type', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }}>
                  <option value="Required">Required</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>
              <div>
                <FieldLabel>Credits</FieldLabel>
                <input type="number" min="0" step="1" value={form.credits} onChange={(event) => setCourseField('credits', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }} />
              </div>
              <div>
                <FieldLabel>Contact Hours</FieldLabel>
                <input type="number" min="0" step="1" value={form.contact_hours} onChange={(event) => setCourseField('contact_hours', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }} />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

const SectionEditorModal = ({
  selectedInstructor,
  selectedCourse,
  syllabusMode,
  setSelectedInstructor,
  setSyllabusMode
}) => {
  if (!selectedInstructor || syllabusMode !== 'section-edit') return null;

  const scope = {
    programId: Number(selectedInstructor.program_id || selectedCourse?.program_id || 0),
    courseId: Number(selectedInstructor.course_id || selectedCourse?.course_id || selectedCourse?.id || 0),
    syllabusId: Number(selectedInstructor.syllabus_id || 0),
    cycleId: Number(selectedInstructor.cycle_id || localStorage.getItem('currentCycleId') || 0)
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [form, setForm] = useState({
    faculty_id: selectedInstructor.faculty_id || '',
    term: selectedInstructor.term || ''
  });

  useEffect(() => {
    setForm({
      faculty_id: selectedInstructor.faculty_id || '',
      term: selectedInstructor.term || ''
    });
    setError('');
    setSuccess('');
  }, [selectedInstructor]);

  useEffect(() => {
    let cancelled = false;
    const loadFaculty = async () => {
      try {
        const result = await apiRequest(syllabusPath(scope), { method: 'GET' });
        if (!cancelled) {
          setFacultyOptions(Array.isArray(result?.faculty_options) ? result.faculty_options : []);
        }
      } catch (e) {
        if (!cancelled) {
          setFacultyOptions([]);
        }
      }
    };
    if (scope.programId && scope.courseId && scope.syllabusId && scope.cycleId) {
      loadFaculty();
    }
    return () => {
      cancelled = true;
    };
  }, [scope.programId, scope.courseId, scope.syllabusId, scope.cycleId]);

  const closeModal = () => {
    setSelectedInstructor(null);
    setSyllabusMode(null);
  };

  const setSectionField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveSection = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const result = await apiRequest(sectionPath(scope), {
        method: 'PUT',
        body: JSON.stringify({
          faculty_id: Number(form.faculty_id || 0),
          term: `${form.term || ''}`.trim()
        })
      });
      setSelectedInstructor((prev) => ({
        ...(prev || {}),
        ...result,
        name: result.faculty_name ?? '',
        course_id: scope.courseId,
        program_id: scope.programId,
        cycle_id: scope.cycleId
      }));
      setForm({
        faculty_id: result.faculty_id || '',
        term: result.term || ''
      });
      setSuccess('Section updated successfully.');
      window.dispatchEvent(new CustomEvent('courses-updated'));
    } catch (e) {
      setError(e?.message || 'Unable to update section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={closeModal} style={overlayStyle}>
      <div onClick={(event) => event.stopPropagation()} style={panelStyle}>
        <div style={stickyHeaderStyle}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.darkGray }}>
              {selectedInstructor?.course_code || selectedCourse?.code || 'Course'} Section
            </div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: colors.mediumGray }}>
              Edit professor and semester taught
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button type="button" onClick={saveSection} disabled={saving} style={{ backgroundColor: colors.primary, border: 'none', color: 'white', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Section'}
            </button>
            <button onClick={closeModal} type="button" style={{ background: 'none', border: 'none', color: colors.mediumGray, cursor: 'pointer', padding: '6px' }}><X size={22} /></button>
          </div>
        </div>

        <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
          {error ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #f5c6cb', backgroundColor: '#f8d7da', color: '#721c24', fontSize: '13px', fontWeight: '700' }}>{error}</div> : null}
          {success ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #b7ebc6', backgroundColor: '#e6f7ec', color: '#155724', fontSize: '13px', fontWeight: '700' }}>{success}</div> : null}

          <SectionCard title="Section Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <FieldLabel>Professor</FieldLabel>
                <select value={form.faculty_id} onChange={(event) => setSectionField('faculty_id', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }}>
                  <option value="">No professor yet</option>
                  {facultyOptions.map((option) => (
                    <option key={option.faculty_id} value={option.faculty_id}>{option.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Semester Taught</FieldLabel>
                <input type="text" value={form.term} onChange={(event) => setSectionField('term', event.target.value)} placeholder="e.g., Fall 2026" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }} />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payload, setPayload] = useState(null);
  const [form, setForm] = useState(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsStatus, setDocsStatus] = useState('');
  const [courseViewContext, setCourseViewContext] = useState(null);
  const readOnly = syllabusMode === 'view' || syllabusMode === 'course-view' || Boolean(courseViewContext);
  const showCourseSections = (syllabusMode === 'course-edit' || syllabusMode === 'course-view') && !courseViewContext;

  const closeModal = () => {
    if (courseViewContext) {
      setCourseViewContext(null);
      return;
    }
    if (syllabusMode === 'course-view') {
      setSyllabusMode('course-edit');
      return;
    }
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

  useEffect(() => {
    setCourseViewContext(null);
  }, [selectedCourse?.course_id, selectedInstructor?.syllabus_id, syllabusMode]);

  const availableSos = useMemo(() => (Array.isArray(payload?.available_sos) ? payload.available_sos : []), [payload]);
  const availableClos = useMemo(() => (Array.isArray(payload?.available_clos) ? payload.available_clos : []), [payload]);
  const facultyOptions = useMemo(() => (Array.isArray(payload?.faculty_options) ? payload.faculty_options : []), [payload]);

  const setCourseField = (field, value) => setForm((prev) => ({ ...prev, course: { ...prev.course, [field]: value } }));
  const setSectionField = (field, value) => setForm((prev) => ({ ...prev, section: { ...prev.section, [field]: value } }));
  const setSyllabusField = (field, value) => setForm((prev) => ({ ...prev, syllabus: { ...prev.syllabus, [field]: value } }));
  const setRowField = (field, index, key, value) => setForm((prev) => {
    const rows = Array.isArray(prev?.syllabus?.[field]) ? [...prev.syllabus[field]] : [];
    rows[index] = { ...rows[index], [key]: value };
    return { ...prev, syllabus: { ...prev.syllabus, [field]: rows } };
  });
  const addRow = (field, factory) => setForm((prev) => {
    const rows = Array.isArray(prev?.syllabus?.[field]) ? prev.syllabus[field] : [];
    return { ...prev, syllabus: { ...prev.syllabus, [field]: [...rows, factory()] } };
  });
  const removeRow = (field, index, factory) => setForm((prev) => {
    const rows = Array.isArray(prev?.syllabus?.[field]) ? prev.syllabus[field] : [];
    const next = rows.length > 1 ? rows.filter((_, i) => i !== index) : [factory()];
    return { ...prev, syllabus: { ...prev.syllabus, [field]: next } };
  });
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
      const weekly_topics = (Array.isArray(form.syllabus.weekly_topics_rows) ? form.syllabus.weekly_topics_rows : [])
        .map((row, index) => {
          const topic = `${row?.topic || ''}`.trim();
          if (!topic) return '';
          const weekLabel = `${row?.week || ''}`.trim() || String(index + 1);
          return `Week ${weekLabel}: ${topic}`;
        })
        .filter(Boolean)
        .join('\n');
      const textbooks = (Array.isArray(form.syllabus.textbooks_rows) ? form.syllabus.textbooks_rows : [])
        .map((row) => ({ title_author_year: `${row?.title_author_year || ''}`.trim(), attribute: `${row?.attribute || ''}`.trim() }))
        .filter((row) => row.title_author_year);
      const supplements = (Array.isArray(form.syllabus.supplements_rows) ? form.syllabus.supplements_rows : [])
        .map((row) => ({ material_discription: `${row?.material_discription || ''}`.trim() }))
        .filter((row) => row.material_discription);
      const prerequisites = (Array.isArray(form.syllabus.prerequisites_rows) ? form.syllabus.prerequisites_rows : [])
        .map((row) => ({ course_code: `${row?.course_code || ''}`.trim().toUpperCase() }))
        .filter((row) => row.course_code);
      const corequisites = (Array.isArray(form.syllabus.corequisites_rows) ? form.syllabus.corequisites_rows : [])
        .map((row) => ({ course_code: `${row?.course_code || ''}`.trim().toUpperCase() }))
        .filter((row) => row.course_code);
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
            weekly_topics,
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

  const onDownloadFile = (docId) => {
    try {
      const doc = docs.find((row) => row.id === docId);
      if (!doc?.fileBlob) {
        setDocsStatus('Selected file is not available.');
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
    } catch (e) {
      setDocsStatus(e?.message || 'Unable to download file.');
    }
  };

  return (
    <div onClick={closeModal} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '1140px', maxHeight: '92vh', overflow: 'auto', borderRadius: '12px', backgroundColor: '#f6f7f9', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', fontFamily: fontStack }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', borderBottom: `1px solid ${colors.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.darkGray }}>
              {loading
                ? 'Loading syllabus...'
                : `${form?.course?.course_code || selectedCourse?.code || 'Course'} Syllabus`}
            </div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: colors.mediumGray }}>
              {courseViewContext
                ? `View mode - ${courseViewContext.name || 'Instructor'}${courseViewContext.term ? ` (${courseViewContext.term})` : ''}`
                : showCourseSections
                ? 'Course-level syllabus'
                : `${readOnly ? 'View mode' : 'Edit mode'} - ${selectedInstructor?.name || 'Instructor'}`}
            </div>
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
            </div>
          </SectionCard>

          {!loading && form ? (
            <>
              <SectionCard title="Course Setup">
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
                    <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', backgroundColor: '#f9fafb', borderBottom: `1px solid ${colors.border}`, padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: colors.mediumGray, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <span>Week</span>
                        <span>Topic</span>
                        <span>Action</span>
                      </div>
                      <div style={{ display: 'grid', gap: '8px', padding: '10px' }}>
                        {form.syllabus.weekly_topics_rows.map((row, index) => (
                          <div key={`weekly-topic-${index}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '8px' }}>
                            <input type="text" value={row.week} disabled={readOnly} onChange={(event) => setRowField('weekly_topics_rows', index, 'week', event.target.value)} placeholder="e.g., 1" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                            <input type="text" value={row.topic} disabled={readOnly} onChange={(event) => setRowField('weekly_topics_rows', index, 'topic', event.target.value)} placeholder="Enter topic details" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                            {!readOnly ? <button type="button" onClick={() => removeRow('weekly_topics_rows', index, emptyWeekTopic)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    {!readOnly ? (
                      <button type="button" onClick={() => addRow('weekly_topics_rows', emptyWeekTopic)} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={14} />
                        Add Topic Row
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <FieldLabel>Software / Lab Tools</FieldLabel>
                    <input type="text" value={form.syllabus.software_or_labs_tools_used} disabled={readOnly} onChange={(event) => setSyllabusField('software_or_labs_tools_used', event.target.value)} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Materials And Requirements">
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <FieldLabel>Textbooks</FieldLabel>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {form.syllabus.textbooks_rows.map((row, index) => (
                        <div key={`textbook-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr auto', gap: '8px' }}>
                          <input type="text" value={row.title_author_year} disabled={readOnly} onChange={(event) => setRowField('textbooks_rows', index, 'title_author_year', event.target.value)} placeholder="Title / Author / Year" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                          <input type="text" value={row.attribute} disabled={readOnly} onChange={(event) => setRowField('textbooks_rows', index, 'attribute', event.target.value)} placeholder="Attribute (optional)" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                          {!readOnly ? <button type="button" onClick={() => removeRow('textbooks_rows', index, emptyTextbook)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                        </div>
                      ))}
                      {!readOnly ? (
                        <button type="button" onClick={() => addRow('textbooks_rows', emptyTextbook)} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Plus size={14} />
                          Add Textbook
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Supplemental Materials</FieldLabel>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {form.syllabus.supplements_rows.map((row, index) => (
                        <div key={`supplement-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                          <input type="text" value={row.material_discription} disabled={readOnly} onChange={(event) => setRowField('supplements_rows', index, 'material_discription', event.target.value)} placeholder="Material description" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                          {!readOnly ? <button type="button" onClick={() => removeRow('supplements_rows', index, emptySupplement)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                        </div>
                      ))}
                      {!readOnly ? (
                        <button type="button" onClick={() => addRow('supplements_rows', emptySupplement)} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Plus size={14} />
                          Add Supplement
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <FieldLabel>Prerequisites</FieldLabel>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {form.syllabus.prerequisites_rows.map((row, index) => (
                          <div key={`pre-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                            <input type="text" value={row.course_code} disabled={readOnly} onChange={(event) => setRowField('prerequisites_rows', index, 'course_code', event.target.value.toUpperCase())} placeholder="Course code" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                            {!readOnly ? <button type="button" onClick={() => removeRow('prerequisites_rows', index, emptyCourseCode)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                          </div>
                        ))}
                        {!readOnly ? (
                          <button type="button" onClick={() => addRow('prerequisites_rows', emptyCourseCode)} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Plus size={14} />
                            Add Prerequisite
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Corequisites</FieldLabel>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {form.syllabus.corequisites_rows.map((row, index) => (
                          <div key={`co-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                            <input type="text" value={row.course_code} disabled={readOnly} onChange={(event) => setRowField('corequisites_rows', index, 'course_code', event.target.value.toUpperCase())} placeholder="Course code" style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', backgroundColor: readOnly ? '#f7f8fa' : 'white' }} />
                            {!readOnly ? <button type="button" onClick={() => removeRow('corequisites_rows', index, emptyCourseCode)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button> : null}
                          </div>
                        ))}
                        {!readOnly ? (
                          <button type="button" onClick={() => addRow('corequisites_rows', emptyCourseCode)} style={{ width: 'fit-content', border: `1px dashed ${colors.primary}`, backgroundColor: 'white', color: colors.primary, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Plus size={14} />
                            Add Corequisite
                          </button>
                        ) : null}
                      </div>
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
              {showCourseSections ? (
                <SectionCard title={`Instructor Sections (${Array.isArray(selectedCourse?.sections) ? selectedCourse.sections.length : 0})`}>
                  {Array.isArray(selectedCourse?.sections) && selectedCourse.sections.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {selectedCourse.sections.map((section) => (
                        <div key={section.syllabus_id} style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: colors.darkGray }}>{sectionInstructorLabel(section)}</div>
                            <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '2px' }}>{section.term}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => { setSelectedInstructor({ ...section, name: section.faculty_name, course_code: selectedCourse.code, course_id: selectedCourse.course_id || selectedCourse.id, program_id: selectedCourse.program_id, cycle_id: selectedCourse.cycle_id || localStorage.getItem('currentCycleId') }); setSelectedCourse(null); setSyllabusMode('section-edit'); }} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '7px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Edit size={14} />
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: colors.mediumGray }}>No sections yet. Add sections from Courses in the sidebar.</div>
                  )}
                </SectionCard>
              ) : null}
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
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Course Syllabus</div>
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
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button type="button" onClick={() => onDownloadFile(file.id)} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.primary, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Download</button>
                      <button type="button" onClick={() => onRemoveFile(file.id)} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              {docsStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{docsStatus}</div> : null}
            </div>
            <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
              <button type="button" onClick={() => setDocsOpen(false)} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>Close</button>
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
  const primarySection = sections[0];
  const [creatingSyllabus, setCreatingSyllabus] = useState(false);
  const [error, setError] = useState('');

  const openCourseSyllabus = (section) => {
    setSelectedInstructor({
      ...section,
      name: section.faculty_name,
      course_code: selectedCourse.code,
      course_id: selectedCourse.course_id || selectedCourse.id,
      program_id: selectedCourse.program_id,
      cycle_id: selectedCourse.cycle_id || localStorage.getItem('currentCycleId')
    });
    setSyllabusMode('course-edit');
  };

  const handleEditCourse = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setError('');
    if (primarySection?.syllabus_id) {
      openCourseSyllabus(primarySection);
      return;
    }
    try {
      setCreatingSyllabus(true);
      const result = await apiRequest(`/programs/${selectedCourse.program_id}/courses/${selectedCourse.course_id || selectedCourse.id}/sections/`, {
        method: 'POST',
        body: JSON.stringify({
          cycle_id: Number(selectedCourse.cycle_id || localStorage.getItem('currentCycleId') || 0),
          term: 'TBD',
          faculty_id: ''
        })
      });
      setSelectedCourse((prev) => ({
        ...(prev || selectedCourse),
        sections: [...sections, result]
      }));
      openCourseSyllabus(result);
    } catch (e) {
      setError(e?.message || 'Unable to create a syllabus for this course.');
    } finally {
      setCreatingSyllabus(false);
    }
  };

  return (
    <div onClick={() => setSelectedCourse(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.58)', zIndex: 2050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '980px', maxHeight: '90vh', overflow: 'auto', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', fontFamily: fontStack }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', borderBottom: `1px solid ${colors.border}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.darkGray }}>{selectedCourse.code} Syllabus Workspace</div>
            <div style={{ marginTop: '4px', fontSize: '13px', color: colors.mediumGray }}>{selectedCourse.credits} credits - {selectedCourse.contact_hours} contact hours - {selectedCourse.course_type}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleEditCourse}
              disabled={creatingSyllabus}
              style={{ backgroundColor: 'white', border: `1px solid ${colors.primary}`, color: colors.primary, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', fontSize: '13px', cursor: creatingSyllabus ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: creatingSyllabus ? 0.7 : 1 }}
            >
              <Edit size={16} />
              {creatingSyllabus ? 'Creating Syllabus...' : 'Edit Course'}
            </button>
            <button type="button" onClick={() => setSelectedCourse(null)} style={{ background: 'none', border: 'none', color: colors.mediumGray, cursor: 'pointer', padding: '6px' }}><X size={22} /></button>
          </div>
        </div>
        <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
          {error ? <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #f5c6cb', backgroundColor: '#f8d7da', color: '#721c24', fontSize: '13px', fontWeight: '700' }}>{error}</div> : null}
          <SectionCard title={`Instructor Sections (${sections.length})`}>
            {sections.length === 0 ? <div style={{ fontSize: '13px', color: colors.mediumGray }}>No sections yet. Add sections from Courses in the sidebar.</div> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {sections.map((section) => (
                  <div key={section.syllabus_id} style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: colors.darkGray }}>{sectionInstructorLabel(section)}</div>
                      <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '2px' }}>{section.term}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => { setSelectedInstructor({ ...section, name: section.faculty_name, course_code: selectedCourse.code, course_id: selectedCourse.course_id || selectedCourse.id, program_id: selectedCourse.program_id, cycle_id: selectedCourse.cycle_id || localStorage.getItem('currentCycleId') }); setSelectedCourse(null); setSyllabusMode('section-edit'); }} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '7px', padding: '8px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
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

export { SyllabusModal, CourseSummaryModal, CourseEditorModal, SectionEditorModal };
