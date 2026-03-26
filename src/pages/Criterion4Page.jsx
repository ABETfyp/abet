import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ClipboardList, Download, Edit, Plus, Save, Search, X } from 'lucide-react';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import GlobalHeader from '../components/layout/GlobalHeader';
import { fontStack } from '../styles/theme';
import { getActiveContext } from '../utils/activeContext';
import { apiRequest } from '../utils/api';

const palette = {
  burg: '#6B1232',
  burgLight: '#F5EDF0',
  burgPale: '#FBF5F7',
  ink: '#18100F',
  ink2: '#4A3840',
  ink3: '#8A7880',
  ink4: '#BBA8B0',
  line: '#E8DFE3',
  line2: '#F0E8EC',
  bg: '#F7F3F4',
  white: '#FFFFFF',
  green: '#1B7A4A',
  greenBg: '#EBF7F1',
  amber: '#A86820',
  amberBg: '#FDF4E3',
  red: '#A82030',
  redBg: '#FCEDEF',
  blue: '#1A4A8C',
  blueBg: '#EBF0FA',
  shadow: '0 1px 3px rgba(107,18,50,0.07), 0 1px 2px rgba(107,18,50,0.04)',
  shadowLg: '0 4px 16px rgba(107,18,50,0.10), 0 2px 6px rgba(107,18,50,0.06)',
  shadowXl: '0 8px 32px rgba(107,18,50,0.14)',
};

const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  xxl: '32px',
};

const initialSos = [];

const initialCourses = [];

const baseInstrumentOptions = [
  'Rubric',
  'Embedded exam rubric',
  'Quiz',
  'Final exam',
  'Lab report',
  'Project report',
  'Presentation rubric',
  'Capstone design rubric',
  'Portfolio review',
  'Exit survey',
  'Student survey',
  'Internship evaluation',
];

const baseFrequencyOptions = [
  'Every semester',
  'Every fall',
  'Every spring',
  'Annually',
  'Twice per year',
  'Every 2 years',
  'Every 3 years',
];

const baseInstrumentVaultTypes = [
  'Rubric',
  'Exam question(s)',
  'Survey form',
  'Peer review form',
  'Capstone evaluation form',
  'Other',
];

const semesterTerms = ['Fall', 'Spring', 'Summer', 'Winter'];

const soTitleMap = {
  SO1: 'Problem Solving',
  SO2: 'Engineering Design',
  SO3: 'Communication',
  SO4: 'Ethics & Responsibility',
  SO5: 'Teamwork',
  SO6: 'Experimentation & Data Analysis',
  SO7: 'Lifelong Learning',
};

const getAttachmentName = (fileValue) => {
  if (!fileValue) return '';
  if (typeof fileValue === 'string') return fileValue;
  return fileValue.name || '';
};

const getAttachmentUrl = (fileValue) => {
  if (!fileValue || typeof fileValue === 'string') return '';
  return fileValue.dataUrl || '';
};

const getAttachmentSizeLabel = (fileValue) => {
  if (!fileValue || typeof fileValue === 'string') return '';
  const sizeBytes = Number(fileValue.size);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '';
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
};

const readFileAsAttachment = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: typeof reader.result === 'string' ? reader.result : '',
    });
  };
  reader.onerror = () => reject(new Error('Failed to read the selected file.'));
  reader.readAsDataURL(file);
});

const inferPiCodeMode = (piId) => (/^PI-\d+$/i.test(`${piId || ''}`) ? 'auto' : 'manual');
const requiredFieldStyle = (hasError) => ({
  border: `1px solid ${hasError ? palette.red : palette.line}`,
});
const getCycleApplicationYear = (cycleLabel) => {
  const matches = `${cycleLabel || ''}`.match(/\d{4}/g) || [];
  const years = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!years.length) {
    return new Date().getFullYear();
  }
  return Math.max(...years);
};

const parseSemesterValue = (value) => {
  const trimmed = `${value || ''}`.trim();
  const match = trimmed.match(/^(Fall|Spring|Summer|Winter)\s+(\d{4})$/);
  if (!match) {
    return { term: '', year: '' };
  }
  return { term: match[1], year: match[2] };
};

const initialPis = [];
const initialResults = [];
const initialMapping = {};
const initialLoops = [];
const initialMeetings = [];

const getStatus = (pct, threshold) => {
  if (pct == null) return 'none';
  if (pct >= threshold) return 'green';
  if (pct >= threshold - 5) return 'amber';
  return 'red';
};

const statusLabel = (pct, threshold) => {
  const status = getStatus(pct, threshold);
  if (status === 'green') return 'Meeting target';
  if (status === 'amber') return 'Near target';
  if (status === 'red') return 'Needs action';
  return 'No data';
};

const Badge = ({ children, tone = 'gray' }) => {
  const tones = {
    burg: { backgroundColor: palette.burgLight, color: palette.burg },
    green: { backgroundColor: palette.greenBg, color: palette.green },
    amber: { backgroundColor: palette.amberBg, color: palette.amber },
    red: { backgroundColor: palette.redBg, color: palette.red },
    blue: { backgroundColor: palette.blueBg, color: palette.blue },
    gray: { backgroundColor: palette.bg, color: palette.ink2, border: `1px solid ${palette.line}` },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', ...tones[tone] }}>
      {children}
    </span>
  );
};

const narrativeStatusOptions = [
  { value: 'not_started', label: 'Not filled' },
  { value: 'in_progress', label: 'Half completed' },
  { value: 'completed', label: 'Completed' },
  { value: 'needs_review', label: 'Needs review' },
];

const narrativeStatusTone = {
  not_started: 'gray',
  in_progress: 'amber',
  completed: 'green',
  needs_review: 'blue',
};

const defaultRecordsMaintenanceText = "Assessment results are recorded and maintained in the program's Accreditation Data Management System (ADMS) by the Program Coordinator. All attainment data, uploaded instruments, and supporting documentation are retained for a minimum of six years, covering the full ABET review period. The complete dataset is made available to ABET evaluators in the program resource room during the campus visit.";

const loopStatusLabelMap = {
  open: 'Action Planned',
  impl: 'Implemented',
  closed: 'Closed',
};

export default function Criterion4Page({ onToggleSidebar, onBack }) {
  const context = getActiveContext();
  const cycleId = Number(localStorage.getItem('currentCycleId') || 1);
  const initialInstrumentOptions = Array.from(new Set([...baseInstrumentOptions, ...initialPis.map((pi) => pi.instrument).filter(Boolean)]));
  const initialFrequencyOptions = Array.from(new Set([...baseFrequencyOptions, ...initialPis.map((pi) => pi.freq).filter(Boolean)]));
  const [activeSection, setActiveSection] = useState(() => {
    const storedSection = localStorage.getItem('criterion4ActiveSection');
    return ['4a', '4b', '4c'].includes(storedSection) ? storedSection : '4a';
  });
  const [activeSO, setActiveSO] = useState(initialSos[0]?.id || '');
  const [activeTab, setActiveTab] = useState('pis');
  const [criterion4Id, setCriterion4Id] = useState(null);
  const [checklistItemId, setChecklistItemId] = useState(null);
  const [programNarrative, setProgramNarrative] = useState('');
  const [recordsMaintenance, setRecordsMaintenance] = useState(defaultRecordsMaintenanceText);
  const [programNarrativeStatus, setProgramNarrativeStatus] = useState('not_started');
  const [recordsMaintenanceStatus, setRecordsMaintenanceStatus] = useState('not_started');
  const [programNarrativeCollapsed, setProgramNarrativeCollapsed] = useState(false);
  const [recordsMaintenanceCollapsed, setRecordsMaintenanceCollapsed] = useState(false);
  const [programNarrativeStatusOpen, setProgramNarrativeStatusOpen] = useState(false);
  const [recordsMaintenanceStatusOpen, setRecordsMaintenanceStatusOpen] = useState(false);
  const [sos, setSos] = useState(initialSos);
  const [courses, setCourses] = useState(initialCourses);
  const [pis, setPis] = useState(initialPis);
  const [results, setResults] = useState(initialResults);
  const [mapping, setMapping] = useState(initialMapping);
  const [loops, setLoops] = useState(initialLoops);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [instruments, setInstruments] = useState([]);
  const [instrumentOptions, setInstrumentOptions] = useState(initialInstrumentOptions);
  const [frequencyOptions, setFrequencyOptions] = useState(initialFrequencyOptions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [piModalOpen, setPiModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [loopModalOpen, setLoopModalOpen] = useState(false);
  const [loopModalExpanded, setLoopModalExpanded] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [instrumentModalOpen, setInstrumentModalOpen] = useState(false);
  const [collapsedLoopCards, setCollapsedLoopCards] = useState({});
  const [editingPiId, setEditingPiId] = useState('');
  const [editingLoopId, setEditingLoopId] = useState('');
  const [editingInstrumentId, setEditingInstrumentId] = useState('');
  const [customInstrument, setCustomInstrument] = useState('');
  const [customFrequency, setCustomFrequency] = useState('');
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('all');
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [resultSoFilter, setResultSoFilter] = useState('all');
  const [resultStatusFilter, setResultStatusFilter] = useState('all');
  const courseMenuRef = useRef(null);
  const programNarrativeStatusRef = useRef(null);
  const recordsMaintenanceStatusRef = useRef(null);
  const lastSavedSnapshotRef = useRef('');
  const autosaveTimeoutRef = useRef(null);
  const hasHydratedRef = useRef(false);
  const [piForm, setPiForm] = useState({ codeMode: 'auto', code: '', soId: '', type: 'Direct', desc: '', supplementalDetail: '', instrument: 'Rubric', freq: 'Every semester', threshold: 70, assessedCourseIds: [], file: '' });
  const [resultForm, setResultForm] = useState({ soId: '', piId: '', courseId: '', semester: '', semesterTerm: '', semesterYear: '', n: '', pct: '', interpretation: '' });
  const [loopForm, setLoopForm] = useState({ soId: '', type: 'Curriculum change', customType: '', status: 'open', courseId: '', coursesText: '', implSemester: '', implSemesterTerm: '', implSemesterYear: '', decisionMeeting: '', decisionMeetingName: '', decisionMeetingDate: '', finding: '', action: '', reassessmentSemester: '', reassessmentSemesterTerm: '', reassessmentSemesterYear: '', reassessmentPct: '', reassessmentOutcome: 'yes', reassessmentNarrative: '', plan: '' });
  const [meetingForm, setMeetingForm] = useState({ date: '', title: '', type: 'Faculty Assessment Meeting', attendees: '', sos: [], outcomes: '', minutesStatus: 'uploaded' });
  const [instrumentForm, setInstrumentForm] = useState({ name: '', type: 'Rubric', customType: '', soId: '', piId: '', file: '', uploadedAt: '' });
  const [piFormErrors, setPiFormErrors] = useState({});
  const [resultFormErrors, setResultFormErrors] = useState({});
  const [loopFormErrors, setLoopFormErrors] = useState({});
  const [meetingFormErrors, setMeetingFormErrors] = useState({});
  const [instrumentFormErrors, setInstrumentFormErrors] = useState({});

  const resolveProgramId = async () => {
    const storedProgramId = Number(localStorage.getItem('currentProgramId') || 0);
    if (storedProgramId > 0) {
      return storedProgramId;
    }
    const cycle = await apiRequest(`/accreditation-cycles/${cycleId}/`, { method: 'GET' });
    const resolvedProgramId = Number(cycle?.program || 0);
    if (resolvedProgramId > 0) {
      localStorage.setItem('currentProgramId', String(resolvedProgramId));
    }
    return resolvedProgramId;
  };

  const getPIsForSO = (soId) => pis.filter((pi) => pi.soId === soId);
  const activeSoRecord = sos.find((so) => so.id === activeSO);
  const cycleApplicationYear = getCycleApplicationYear(context.cycleLabel);
  const semesterYearOptions = Array.from({ length: 7 }, (_, index) => String(cycleApplicationYear - index));
  const earliestCriterion4Year = semesterYearOptions.length ? Math.min(...semesterYearOptions.map((year) => Number(year))) : cycleApplicationYear - 6;
  const latestCriterion4Year = semesterYearOptions.length ? Math.max(...semesterYearOptions.map((year) => Number(year))) : cycleApplicationYear;
  const getSoTitle = (soId, fallbackLabel = '') => soTitleMap[soId] || fallbackLabel || soId;
  const getCoursesForPi = (pi) => courses.filter((course) => (pi?.assessedCourseIds || []).map((value) => String(value)).includes(String(course.id)));
  const getInstrumentsForPi = (piId) => instruments.filter((instrument) => instrument.piId === piId);
  const selectedResultPi = pis.find((pi) => pi.id === resultForm.piId);
  const resultCourseOptions = getCoursesForPi(selectedResultPi);
  const selectedLoopCourse = courses.find((course) => String(course.id) === String(loopForm.courseId));
  const selectedInstrumentPi = pis.find((pi) => pi.id === instrumentForm.piId);
  const filteredCourseOptions = courses.filter((course) => {
    const query = courseSearchTerm.trim().toLowerCase();
    if (!query) return true;
    return `${course.code || ''} ${course.name || ''}`.toLowerCase().includes(query);
  });
  const getResultsForPI = (piId) => results.filter((row) => row.piId === piId);
  const pisWithoutResults = pis.filter((pi) => getResultsForPI(pi.id).length === 0);
  const getLoopsForSO = (soId) => loops.filter((loop) => (loop.soId || loop.sos?.[0]) === soId);
  const getLoopStatus = (soId) => {
    const soLoops = getLoopsForSO(soId);
    if (!soLoops.length) return 'empty';
    return soLoops.every((loop) => loop.status === 'closed') ? 'closed' : 'open';
  };
  const getLatestResultForPi = (piId) => {
    const related = getResultsForPI(piId);
    return related.length ? related[related.length - 1] : null;
  };
  const getLatestPct = (piId) => {
    const related = getResultsForPI(piId);
    return related.length ? related[related.length - 1].pct : null;
  };
  const filteredResults = results.filter((row) => {
    const pi = pis.find((item) => item.id === row.piId);
    const course = courses.find((item) => item.id === row.courseId);
    const tone = getStatus(row.pct, pi?.threshold || 70);
    const query = resultSearchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      row.soId,
      row.piId,
      course?.code || row.courseId,
      row.semester,
      row.interpretation,
    ].filter(Boolean).join(' ').toLowerCase().includes(query);
    const matchesSo = resultSoFilter === 'all' || row.soId === resultSoFilter;
    const matchesStatus = resultStatusFilter === 'all' || tone === resultStatusFilter;
    return matchesSearch && matchesSo && matchesStatus;
  });
  const getNextPiCode = (excludeId = '') => {
    const maxNumber = pis.reduce((highest, pi) => {
      if (pi.id === excludeId) return highest;
      const matched = /^PI-(\d+)$/i.exec(`${pi.id || ''}`.trim());
      if (!matched) return highest;
      return Math.max(highest, Number(matched[1]) || 0);
    }, 0);
    return `PI-${maxNumber + 1}`;
  };
  const getAutoPiCode = () => {
    if (editingPiId && inferPiCodeMode(editingPiId) === 'auto') {
      return editingPiId;
    }
    return getNextPiCode(editingPiId);
  };
  const buildCriterion4Payload = () => ({
    criterion4_id: criterion4Id,
    programNarrative,
    recordsMaintenance,
    programNarrativeStatus,
    recordsMaintenanceStatus,
    sos,
    courses,
    pis,
    results,
    mapping,
    loops,
    meetings,
    instruments,
    instrumentOptions,
    frequencyOptions,
  });

  const buildInstrumentFromPi = (pi, existingInstrument = null) => {
    const effectiveFile = existingInstrument?.file ?? pi.file ?? '';
    const effectiveType = existingInstrument?.type || pi.instrument || 'Rubric';
    return {
      id: existingInstrument?.id || `INST-${pi.id}`,
      piId: pi.id,
      soId: pi.soId,
      name: existingInstrument?.name || pi.desc || `${pi.id} instrument`,
      type: effectiveType,
      ref: `${pi.soId} · ${pi.id}`,
      file: effectiveFile,
      uploadedAt: existingInstrument?.uploadedAt || '',
    };
  };

  const legacyVisibleInstruments = instruments.filter((instrument) => {
    const query = instrumentSearchTerm.trim().toLowerCase();
    const matchesSearch = !query || `${instrument.name || ''} ${instrument.ref || ''}`.toLowerCase().includes(query);
    const matchesOutcome = !activeSO || instrument.soId === activeSO;
    const hasFile = Boolean(getAttachmentName(instrument.file));
    const matchesFilter = instrumentFilter === 'all'
      ? true
      : instrumentFilter === 'uploaded'
        ? hasFile
        : !hasFile;
    return matchesSearch && matchesOutcome && matchesFilter;
  });
  const uploadedInstruments = instruments.filter((instrument) => Boolean(getAttachmentName(instrument.file)));
  const instrumentCoverageCount = pis.filter((pi) => uploadedInstruments.some((instrument) => instrument.piId === pi.id)).length;
  const selectedSoPis = pis.filter((pi) => !activeSO || pi.soId === activeSO);
  const selectedSoUploadedFiles = uploadedInstruments.filter((instrument) => !activeSO || instrument.soId === activeSO);
  const selectedSoCoverageCount = selectedSoPis.filter((pi) => selectedSoUploadedFiles.some((instrument) => instrument.piId === pi.id)).length;
  const visibleInstruments = pis.flatMap((pi) => {
    const linkedInstruments = getInstrumentsForPi(pi.id);
    if (linkedInstruments.length) {
      return linkedInstruments.map((instrument) => ({
        ...instrument,
        ref: instrument.ref || `${pi.soId} · ${pi.id}`,
        isPlaceholder: false,
      }));
    }
    return [{
      id: `missing-${pi.id}`,
      piId: pi.id,
      soId: pi.soId,
      name: pi.desc || `${pi.id} instrument`,
      type: pi.instrument || 'Rubric',
      ref: `${pi.soId} · ${pi.id}`,
      file: '',
      uploadedAt: '',
      isPlaceholder: true,
    }];
  }).filter((instrument) => {
    const query = instrumentSearchTerm.trim().toLowerCase();
    const matchesSearch = !query || `${instrument.name || ''} ${instrument.ref || ''}`.toLowerCase().includes(query);
    const matchesOutcome = !activeSO || instrument.soId === activeSO;
    const hasFile = Boolean(getAttachmentName(instrument.file));
    const matchesFilter = instrumentFilter === 'all'
      ? true
      : instrumentFilter === 'uploaded'
        ? hasFile
        : !hasFile;
    return matchesSearch && matchesOutcome && matchesFilter;
  });
  const instrumentVaultTypeOptions = Array.from(new Set([
    ...baseInstrumentVaultTypes,
    ...pis.map((pi) => pi.instrument).filter(Boolean),
    ...instruments.map((instrument) => instrument.type).filter(Boolean),
  ]));

  const openAddPi = (soId = activeSO) => {
    const resolvedSoId = soId || sos[0]?.id || '';
    setEditingPiId('');
    setCustomInstrument('');
    setCustomFrequency('');
    setCourseMenuOpen(false);
    setCourseSearchTerm('');
    setPiFormErrors({});
    setPiForm({ codeMode: 'auto', code: getNextPiCode(), soId: resolvedSoId, type: 'Direct', desc: '', supplementalDetail: '', instrument: 'Rubric', freq: 'Every semester', threshold: 70, assessedCourseIds: [], file: '' });
    setPiModalOpen(true);
  };

  const openEditPi = (piId) => {
    const pi = pis.find((item) => item.id === piId);
    if (!pi) return;
    setEditingPiId(piId);
    setCustomInstrument('');
    setCustomFrequency('');
    setCourseMenuOpen(false);
    setCourseSearchTerm('');
    setPiFormErrors({});
    setPiForm({ codeMode: inferPiCodeMode(pi.id), code: pi.id, soId: pi.soId, type: pi.type, desc: pi.desc, supplementalDetail: pi.supplementalDetail || '', instrument: pi.instrument, freq: pi.freq, threshold: pi.threshold, assessedCourseIds: Array.isArray(pi.assessedCourseIds) ? pi.assessedCourseIds : [], file: pi.file || '' });
    setPiModalOpen(true);
  };

  const addInstrumentOption = () => {
    const value = customInstrument.trim();
    if (!value) return;
    setInstrumentOptions((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setPiForm((prev) => ({ ...prev, instrument: value }));
    setCustomInstrument('');
  };

  const addFrequencyOption = () => {
    const value = customFrequency.trim();
    if (!value) return;
    setFrequencyOptions((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setPiForm((prev) => ({ ...prev, freq: value }));
    setCustomFrequency('');
  };

  const savePi = () => {
    const resolvedInstrument = piForm.instrument.trim() || customInstrument.trim();
    const resolvedFrequency = piForm.freq.trim() || customFrequency.trim();
    const resolvedCode = piForm.codeMode === 'manual' ? piForm.code.trim() : getAutoPiCode();
    const nextErrors = {};
    if (!resolvedCode) nextErrors.code = 'PI code is required.';
    if (!piForm.desc.trim()) nextErrors.desc = 'Description is required.';
    if (!resolvedInstrument) nextErrors.instrument = 'Instrument is required.';
    if (!resolvedFrequency) nextErrors.freq = 'Frequency is required.';
    if (piForm.threshold === '' || piForm.threshold == null) nextErrors.threshold = 'Threshold target is required.';
    if (!piForm.assessedCourseIds.length) nextErrors.assessedCourseIds = 'Select at least one assessed course.';
    const duplicatePi = pis.find((pi) => pi.id === resolvedCode && pi.id !== editingPiId);
    if (duplicatePi) nextErrors.code = 'This PI code is already in use.';
    if (Object.keys(nextErrors).length) {
      setPiFormErrors(nextErrors);
      return;
    }
    setPiFormErrors({});
    if (!instrumentOptions.includes(resolvedInstrument)) {
      setInstrumentOptions((prev) => [...prev, resolvedInstrument]);
    }
    if (!frequencyOptions.includes(resolvedFrequency)) {
      setFrequencyOptions((prev) => [...prev, resolvedFrequency]);
    }
    const normalizedForm = { ...piForm, code: resolvedCode, instrument: resolvedInstrument, freq: resolvedFrequency };
    if (editingPiId) {
      setPis((prev) => prev.map((pi) => (pi.id === editingPiId ? { ...pi, ...normalizedForm, id: resolvedCode, threshold: Number(normalizedForm.threshold) || 70 } : pi)));
      if (editingPiId !== resolvedCode) {
        setResults((prev) => prev.map((row) => (row.piId === editingPiId ? { ...row, piId: resolvedCode } : row)));
      }
    } else {
      setPis((prev) => [...prev, { id: resolvedCode, ...normalizedForm, threshold: Number(normalizedForm.threshold) || 70 }]);
    }
    setCustomInstrument('');
    setCustomFrequency('');
    setPiModalOpen(false);
  };

  const deletePi = () => {
    if (!editingPiId) return;
    setPis((prev) => prev.filter((pi) => pi.id !== editingPiId));
    setResults((prev) => prev.filter((row) => row.piId !== editingPiId));
    setInstruments((prev) => prev.filter((instrument) => instrument.piId !== editingPiId));
    setPiModalOpen(false);
  };

  const openResultForPi = (piId) => {
    const pi = pis.find((item) => item.id === piId);
    setResultFormErrors({});
    setResultForm({ soId: pi?.soId || activeSO || sos[0]?.id || '', piId: piId || '', courseId: '', semester: '', semesterTerm: '', semesterYear: '', n: '', pct: '', interpretation: '' });
    setResultModalOpen(true);
  };

  const saveResult = () => {
    const nextErrors = {};
    const normalizedSemester = `${resultForm.semesterTerm || ''} ${resultForm.semesterYear || ''}`.trim();
    const studentCount = Number(resultForm.n);
    const percentMeeting = Number(resultForm.pct);
    if (!resultForm.soId) nextErrors.soId = 'Student outcome is required.';
    if (!resultForm.piId) nextErrors.piId = 'PI is required.';
    if (!resultForm.courseId) nextErrors.courseId = 'Course is required.';
    if (!resultForm.semesterTerm || !resultForm.semesterYear || !normalizedSemester) nextErrors.semester = 'Semester term and year are required.';
    if (resultForm.n === '') nextErrors.n = 'Number of students is required.';
    if (resultForm.n !== '' && (!Number.isFinite(studentCount) || studentCount < 0 || !Number.isInteger(studentCount))) nextErrors.n = 'Number of students must be a whole number.';
    if (resultForm.pct === '') nextErrors.pct = 'Percent meeting threshold is required.';
    if (resultForm.pct !== '' && (!Number.isFinite(percentMeeting) || percentMeeting < 0 || percentMeeting > 100)) nextErrors.pct = 'Percent meeting threshold must be between 0 and 100.';
    if (Object.keys(nextErrors).length) {
      setResultFormErrors(nextErrors);
      return;
    }
    setResultFormErrors({});
    setResults((prev) => [...prev, { id: `R-${Date.now()}`, ...resultForm, interpretation: resultForm.interpretation?.trim() || '', semester: normalizedSemester, n: studentCount, pct: percentMeeting }]);
    setResultModalOpen(false);
  };

  const saveLoop = () => {
    const nextErrors = {};
    const normalizedImplSemester = `${loopForm.implSemesterTerm || ''} ${loopForm.implSemesterYear || ''}`.trim();
    const normalizedReassessmentSemester = `${loopForm.reassessmentSemesterTerm || ''} ${loopForm.reassessmentSemesterYear || ''}`.trim();
    const normalizedDecisionMeetingDate = formatDecisionMeetingDateLabel(loopForm.decisionMeetingDate);
    const normalizedDecisionMeeting = formatDecisionMeetingValue(loopForm.decisionMeetingName.trim(), normalizedDecisionMeetingDate);
    const resolvedLoopType = loopForm.type === 'Other' ? loopForm.customType.trim() : loopForm.type;
    const requiresAction = loopForm.status === 'impl' || loopForm.status === 'closed';
    const requiresPlan = loopForm.status === 'open' || loopForm.status === 'impl';
    const reassessmentPctValue = Number(loopForm.reassessmentPct);
    if (!loopForm.soId) nextErrors.sos = 'Outcome is required.';
    if (!resolvedLoopType) nextErrors.type = 'Action type is required.';
    if (!loopForm.status) nextErrors.status = 'Status is required.';
    if (!loopForm.courseId) nextErrors.courseId = 'Course is required.';
    if (!loopForm.implSemesterTerm || !loopForm.implSemesterYear || !normalizedImplSemester) nextErrors.implSemester = 'Implementation semester term and year are required.';
    if (!loopForm.decisionMeetingName.trim()) nextErrors.decisionMeetingName = 'Meeting name is required.';
    if (!loopForm.decisionMeetingDate.trim()) nextErrors.decisionMeetingDate = 'Meeting date is required.';
    if (loopForm.decisionMeetingDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(loopForm.decisionMeetingDate.trim())) nextErrors.decisionMeetingDate = 'Meeting date must be selected from the calendar.';
    if (/^\d{4}-\d{2}-\d{2}$/.test(loopForm.decisionMeetingDate.trim())) {
      const [, yearText, monthText, dayText] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(loopForm.decisionMeetingDate.trim()) || [];
      const yearNumber = Number(yearText);
      const monthNumber = Number(monthText);
      const dayNumber = Number(dayText);
      if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
        nextErrors.decisionMeetingDate = 'Meeting date month must be between 01 and 12.';
      } else if (!dayNumber || dayNumber < 1 || dayNumber > 31) {
        nextErrors.decisionMeetingDate = 'Meeting date day must be between 01 and 31.';
      } else if (yearNumber < earliestCriterion4Year || yearNumber > latestCriterion4Year) {
        nextErrors.decisionMeetingDate = `Meeting date year must be between ${earliestCriterion4Year} and ${latestCriterion4Year}.`;
      }
    }
    if (!loopForm.finding.trim()) nextErrors.finding = 'Finding is required.';
    if (requiresAction && !loopForm.action.trim()) nextErrors.action = 'Action is required.';
    if (loopForm.status === 'closed') {
      if (!loopForm.reassessmentSemesterTerm || !loopForm.reassessmentSemesterYear || !normalizedReassessmentSemester) nextErrors.reassessmentSemester = 'Re-assessment semester term and year are required when closing the loop.';
      if (loopForm.reassessmentPct === '') nextErrors.reassessmentPct = 'New attainment percentage is required when closing the loop.';
      if (loopForm.reassessmentPct !== '' && (!Number.isFinite(reassessmentPctValue) || reassessmentPctValue < 0 || reassessmentPctValue > 100)) nextErrors.reassessmentPct = 'New attainment percentage must be between 0 and 100.';
      if (!loopForm.reassessmentOutcome) nextErrors.reassessmentOutcome = 'Re-assessment outcome is required when closing the loop.';
      if (!loopForm.reassessmentNarrative.trim()) nextErrors.reassessmentNarrative = 'Re-assessment narrative is required when closing the loop.';
    }
    if (requiresPlan && !loopForm.plan.trim()) {
      nextErrors.plan = 'Planned next step is required until the loop is closed.';
    }
    if (Object.keys(nextErrors).length) {
      setLoopFormErrors(nextErrors);
      return;
    }
    setLoopFormErrors({});
    const normalizedLoop = {
      ...loopForm,
      type: resolvedLoopType,
      title: resolvedLoopType,
      soId: loopForm.soId,
      sos: loopForm.soId ? [loopForm.soId] : [],
      coursesText: selectedLoopCourse ? `${selectedLoopCourse.code} - ${selectedLoopCourse.name}` : loopForm.coursesText,
      implSemester: normalizedImplSemester,
      semester: normalizedImplSemester,
      reassessmentSemester: normalizedReassessmentSemester,
      meeting: normalizedDecisionMeeting,
      decisionMeeting: normalizedDecisionMeeting,
      decisionMeetingName: loopForm.decisionMeetingName.trim(),
      decisionMeetingDate: loopForm.decisionMeetingDate.trim(),
      reassessmentPct: loopForm.reassessmentPct === '' ? '' : reassessmentPctValue,
    };
    const nextLoops = editingLoopId
      ? loops.map((loop) => (loop.id === editingLoopId ? { ...loop, ...normalizedLoop } : loop))
      : [{ id: `L-${Date.now()}`, ...normalizedLoop }, ...loops];
    setLoops(nextLoops);
    setLoopModalOpen(false);
    setLoopModalExpanded(false);
    setEditingLoopId('');
    setLoopForm({ soId: activeSO || '', type: 'Curriculum change', customType: '', status: 'open', courseId: '', coursesText: '', implSemester: '', implSemesterTerm: '', implSemesterYear: '', decisionMeeting: '', decisionMeetingName: '', decisionMeetingDate: '', finding: '', action: '', reassessmentSemester: '', reassessmentSemesterTerm: '', reassessmentSemesterYear: '', reassessmentPct: '', reassessmentOutcome: 'yes', reassessmentNarrative: '', plan: '' });
    saveCriterion4({ silent: true, payloadOverride: { ...buildCriterion4Payload(), loops: nextLoops } });
  };

  const saveMeeting = () => {
    const nextErrors = {};
    if (!meetingForm.date) nextErrors.date = 'Date is required.';
    if (!meetingForm.sos.length) nextErrors.sos = 'Outcome is required.';
    if (!meetingForm.title.trim()) nextErrors.title = 'Title is required.';
    if (!meetingForm.attendees.trim()) nextErrors.attendees = 'Attendees are required.';
    if (!meetingForm.outcomes.trim()) nextErrors.outcomes = 'Outcomes and decisions are required.';
    if (Object.keys(nextErrors).length) {
      setMeetingFormErrors(nextErrors);
      return;
    }
    setMeetingFormErrors({});
    setMeetings((prev) => [{ id: `M-${Date.now()}`, ...meetingForm }, ...prev]);
    setMeetingModalOpen(false);
    setMeetingForm({ date: '', title: '', type: 'Faculty Assessment Meeting', attendees: '', sos: activeSO ? [activeSO] : [], outcomes: '', minutesStatus: 'uploaded' });
  };

  const openAddInstrument = (piId = '') => {
    const selectedPi = pis.find((pi) => pi.id === piId) || null;
    setEditingInstrumentId('');
    setInstrumentFormErrors({});
    setInstrumentForm({
      name: selectedPi?.desc || '',
      type: selectedPi?.instrument || 'Rubric',
      customType: '',
      soId: selectedPi?.soId || activeSO || sos[0]?.id || '',
      piId: selectedPi?.id || '',
      file: '',
      uploadedAt: '',
    });
    setInstrumentModalOpen(true);
  };

  const openEditInstrument = (instrumentId) => {
    const instrument = instruments.find((item) => item.id === instrumentId);
    if (!instrument) return;
    setEditingInstrumentId(instrument.id);
    setInstrumentFormErrors({});
    setInstrumentForm({
      name: instrument.name || '',
      type: baseInstrumentVaultTypes.includes(instrument.type) ? instrument.type : 'Other',
      customType: baseInstrumentVaultTypes.includes(instrument.type) ? '' : (instrument.type || ''),
      soId: instrument.soId || '',
      piId: instrument.piId || '',
      file: instrument.file || '',
      uploadedAt: instrument.uploadedAt || '',
    });
    setInstrumentModalOpen(true);
  };

  const saveInstrument = () => {
    const nextErrors = {};
    const resolvedType = instrumentForm.type === 'Other' ? instrumentForm.customType.trim() : instrumentForm.type;
    if (!instrumentForm.name.trim()) nextErrors.name = 'Instrument name is required.';
    if (!resolvedType) nextErrors.type = 'Instrument type is required.';
    if (!instrumentForm.soId) nextErrors.soId = 'Student outcome is required.';
    if (!instrumentForm.piId) nextErrors.piId = 'Linked PI is required.';
    if (!getAttachmentName(instrumentForm.file)) nextErrors.file = 'Instrument file is required.';
    if (Object.keys(nextErrors).length) {
      setInstrumentFormErrors(nextErrors);
      return;
    }

    const linkedPi = pis.find((pi) => pi.id === instrumentForm.piId);
    const uploadedAt = getAttachmentName(instrumentForm.file) ? (instrumentForm.uploadedAt || new Date().toISOString()) : '';
    const normalizedInstrument = {
      id: editingInstrumentId || `INST-${Date.now()}`,
      piId: instrumentForm.piId,
      soId: linkedPi?.soId || instrumentForm.soId,
      name: instrumentForm.name.trim(),
      type: resolvedType,
      ref: `${linkedPi?.soId || instrumentForm.soId} · ${instrumentForm.piId}`,
      file: instrumentForm.file || '',
      uploadedAt,
    };

    const nextInstruments = [
      ...instruments.filter((instrument) => instrument.id !== normalizedInstrument.id),
      normalizedInstrument,
    ].sort((a, b) => `${a.soId || ''}${a.piId || ''}`.localeCompare(`${b.soId || ''}${b.piId || ''}`));

    setInstrumentFormErrors({});
    setInstruments(nextInstruments);
    setInstrumentModalOpen(false);
    setEditingInstrumentId('');
  };

  const deleteInstrument = () => {
    if (!editingInstrumentId) return;
    setInstruments((prev) => prev.filter((item) => item.id !== editingInstrumentId));
    setInstrumentModalOpen(false);
    setEditingInstrumentId('');
  };

  const openAddLoop = (soId = activeSO) => {
    setEditingLoopId('');
    setLoopModalExpanded(false);
    setLoopFormErrors({});
    setLoopForm({ soId: soId || '', type: 'Curriculum change', customType: '', status: 'open', courseId: '', coursesText: '', implSemester: '', implSemesterTerm: '', implSemesterYear: '', decisionMeeting: '', decisionMeetingName: '', decisionMeetingDate: '', finding: '', action: '', reassessmentSemester: '', reassessmentSemesterTerm: '', reassessmentSemesterYear: '', reassessmentPct: '', reassessmentOutcome: 'yes', reassessmentNarrative: '', plan: '' });
    setLoopModalOpen(true);
  };

  const normalizeLoopStatus = (status) => {
    if (status === 'action') return 'open';
    return status || 'open';
  };

  const parseDecisionMeetingValue = (value) => {
    const raw = `${value || ''}`.trim();
    if (!raw) return { name: '', date: '' };
    const parts = raw.split(/\s+[—-]\s+/);
    if (parts.length >= 2) {
      return {
        name: parts.slice(0, -1).join(' — ').trim(),
        date: parts[parts.length - 1].trim(),
      };
    }
    return { name: raw, date: '' };
  };

  const formatDecisionMeetingValue = (name, date) => [name, date].filter(Boolean).join(' — ');
  const formatDecisionMeetingDateLabel = (value) => {
    const raw = `${value || ''}`.trim();
    if (!raw) return '';
    const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (isoDateMatch) return `${isoDateMatch[3]}/${isoDateMatch[2]}/${isoDateMatch[1]}`;
    const isoMonthMatch = /^(\d{4})-(\d{2})$/.exec(raw);
    if (isoMonthMatch) return `01/${isoMonthMatch[2]}/${isoMonthMatch[1]}`;
    const slashDateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (slashDateMatch) return raw;
    const slashMonthMatch = /^(\d{2})\/(\d{4})$/.exec(raw);
    if (slashMonthMatch) return `01/${slashMonthMatch[1]}/${slashMonthMatch[2]}`;
    return raw;
  };
  const normalizeDecisionMeetingDateInput = (value) => {
    const raw = `${value || ''}`.trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}$/.test(raw)) return raw;
    const slashDateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (slashDateMatch) return `${slashDateMatch[3]}-${slashDateMatch[2]}-${slashDateMatch[1]}`;
    const slashMonthMatch = /^(\d{2})\/(\d{4})$/.exec(raw);
    if (slashMonthMatch) return `${slashMonthMatch[2]}-${slashMonthMatch[1]}-01`;
    return raw;
  };

  const openEditLoop = (loopId) => {
    const loop = loops.find((item) => item.id === loopId);
    if (!loop) return;
    const soId = loop.soId || loop.sos?.[0] || '';
    const parsedImplSemester = parseSemesterValue(loop.implSemester || loop.semester || '');
    const parsedReassessmentSemester = parseSemesterValue(loop.reassessmentSemester || loop.rsem || '');
    const parsedDecisionMeeting = parseDecisionMeetingValue(loop.decisionMeeting || loop.meeting || '');
    setEditingLoopId(loopId);
    setLoopModalExpanded(false);
    setLoopFormErrors({});
    setLoopForm({
      soId,
      type: ['Curriculum change', 'Rubric revision', 'New assessment tool', 'Prerequisite change', 'Course restructure', 'Faculty development', 'IAC recommendation'].includes(loop.type) ? loop.type : 'Other',
      customType: ['Curriculum change', 'Rubric revision', 'New assessment tool', 'Prerequisite change', 'Course restructure', 'Faculty development', 'IAC recommendation'].includes(loop.type) ? '' : (loop.type || ''),
      status: normalizeLoopStatus(loop.status),
      courseId: loop.courseId || '',
      coursesText: loop.coursesText || '',
      implSemester: loop.implSemester || loop.semester || '',
      implSemesterTerm: parsedImplSemester.term,
      implSemesterYear: parsedImplSemester.year,
      decisionMeeting: loop.decisionMeeting || loop.meeting || '',
      decisionMeetingName: loop.decisionMeetingName || parsedDecisionMeeting.name,
      decisionMeetingDate: normalizeDecisionMeetingDateInput(loop.decisionMeetingDate || parsedDecisionMeeting.date),
      finding: loop.finding || '',
      action: loop.action || '',
      reassessmentSemester: loop.reassessmentSemester || loop.rsem || '',
      reassessmentSemesterTerm: parsedReassessmentSemester.term,
      reassessmentSemesterYear: parsedReassessmentSemester.year,
      reassessmentPct: loop.reassessmentPct ?? loop.rpct ?? '',
      reassessmentOutcome: loop.reassessmentOutcome || loop.outcome || 'yes',
      reassessmentNarrative: loop.reassessmentNarrative || loop.rnarr || '',
      plan: loop.plan || '',
    });
    setLoopModalOpen(true);
  };

  const deleteLoop = () => {
    if (!editingLoopId) return;
    const nextLoops = loops.filter((loop) => loop.id !== editingLoopId);
    setLoops(nextLoops);
    setEditingLoopId('');
    setLoopModalOpen(false);
    setLoopModalExpanded(false);
    saveCriterion4({ silent: true, payloadOverride: { ...buildCriterion4Payload(), loops: nextLoops } });
  };

  const totalMet = results.filter((row) => {
    const pi = pis.find((item) => item.id === row.piId);
    return row.pct >= (pi?.threshold || 70);
  }).length;

  const readinessCount = [
    pis.length > 0,
    results.length > 0,
    loops.length > 0,
    meetings.length > 0,
    instruments.some((instrument) => Boolean(getAttachmentName(instrument.file))),
  ].filter(Boolean).length;

  useEffect(() => {
    const loadCriterion4 = async () => {
      try {
        setLoading(true);
        setSaveError('');
        hasHydratedRef.current = false;
        const resolvedProgramId = await resolveProgramId();
        if (!resolvedProgramId) {
          throw new Error('No program selected.');
        }
        const payload = await apiRequest(`/cycles/${cycleId}/criterion4/?program_id=${resolvedProgramId}`, { method: 'GET' });
        const loadedSos = Array.isArray(payload?.sos) ? payload.sos : [];
        const loadedCourses = Array.isArray(payload?.courses) ? payload.courses : [];
        const loadedPis = Array.isArray(payload?.pis) ? payload.pis : [];
        const loadedResults = Array.isArray(payload?.results) ? payload.results.map((row) => ({
          ...row,
          interpretation: typeof row?.interpretation === 'string' ? row.interpretation : '',
        })) : [];
        const loadedLoops = Array.isArray(payload?.loops)
          ? payload.loops.map((loop) => ({
            ...loop,
            status: normalizeLoopStatus(loop.status),
          }))
          : [];
        const loadedMeetings = Array.isArray(payload?.meetings) ? payload.meetings : [];
        const loadedInstruments = Array.isArray(payload?.instruments) && payload.instruments.length
          ? payload.instruments
          : loadedPis
            .filter((pi) => getAttachmentName(pi.file))
            .map((pi) => ({
              id: `legacy-${pi.id}`,
              piId: pi.id,
              soId: pi.soId,
              name: pi.desc || `${pi.id} instrument`,
              type: pi.instrument || 'Rubric',
              ref: `${pi.soId} · ${pi.id}`,
              file: pi.file,
              uploadedAt: '',
            }));
        const nextActiveSo = loadedSos[0]?.id || '';

        setCriterion4Id(payload?.criterion4_id ?? null);
        setChecklistItemId(payload?.item ?? null);
        setProgramNarrative(typeof payload?.programNarrative === 'string' ? payload.programNarrative : '');
        setRecordsMaintenance(typeof payload?.recordsMaintenance === 'string' ? payload.recordsMaintenance : defaultRecordsMaintenanceText);
        setProgramNarrativeStatus(typeof payload?.programNarrativeStatus === 'string' ? payload.programNarrativeStatus : 'not_started');
        setRecordsMaintenanceStatus(typeof payload?.recordsMaintenanceStatus === 'string' ? payload.recordsMaintenanceStatus : 'not_started');
        setSos(loadedSos);
        setCourses(loadedCourses);
        setPis(loadedPis);
        setResults(loadedResults);
        setMapping(payload?.mapping && typeof payload.mapping === 'object' ? payload.mapping : {});
        setLoops(loadedLoops);
        setMeetings(loadedMeetings);
        setInstruments(loadedInstruments);
        setInstrumentOptions(Array.from(new Set([...baseInstrumentOptions, ...(Array.isArray(payload?.instrumentOptions) ? payload.instrumentOptions : []), ...loadedPis.map((pi) => pi.instrument).filter(Boolean)])));
        setFrequencyOptions(Array.from(new Set([...baseFrequencyOptions, ...(Array.isArray(payload?.frequencyOptions) ? payload.frequencyOptions : []), ...loadedPis.map((pi) => pi.freq).filter(Boolean)])));
        setActiveSO(nextActiveSo);
        setPiForm((prev) => ({ ...prev, soId: nextActiveSo || prev.soId || '' }));
        setResultForm((prev) => ({ ...prev, soId: nextActiveSo || prev.soId || '', semester: '', semesterTerm: prev.semesterTerm || '', semesterYear: prev.semesterYear || '' }));
        setLoopForm((prev) => ({ ...prev, sos: nextActiveSo ? [nextActiveSo] : prev.sos, semester: prev.semester || context.cycleLabel || '' }));
        setMeetingForm((prev) => ({ ...prev, sos: nextActiveSo ? [nextActiveSo] : prev.sos }));
        lastSavedSnapshotRef.current = JSON.stringify({
          criterion4_id: payload?.criterion4_id ?? null,
          programNarrative: typeof payload?.programNarrative === 'string' ? payload.programNarrative : '',
          recordsMaintenance: typeof payload?.recordsMaintenance === 'string' ? payload.recordsMaintenance : defaultRecordsMaintenanceText,
          programNarrativeStatus: typeof payload?.programNarrativeStatus === 'string' ? payload.programNarrativeStatus : 'not_started',
          recordsMaintenanceStatus: typeof payload?.recordsMaintenanceStatus === 'string' ? payload.recordsMaintenanceStatus : 'not_started',
          sos: loadedSos,
          courses: loadedCourses,
          pis: loadedPis,
          results: loadedResults,
          mapping: payload?.mapping && typeof payload.mapping === 'object' ? payload.mapping : {},
          loops: loadedLoops,
          meetings: loadedMeetings,
          instruments: loadedInstruments,
          instrumentOptions: Array.from(new Set([...baseInstrumentOptions, ...(Array.isArray(payload?.instrumentOptions) ? payload.instrumentOptions : []), ...loadedPis.map((pi) => pi.instrument).filter(Boolean)])),
          frequencyOptions: Array.from(new Set([...baseFrequencyOptions, ...(Array.isArray(payload?.frequencyOptions) ? payload.frequencyOptions : []), ...loadedPis.map((pi) => pi.freq).filter(Boolean)])),
        });
        hasHydratedRef.current = true;
      } catch (error) {
        setSaveError(error.message || 'Failed to load Criterion 4.');
      } finally {
        setLoading(false);
      }
    };

    loadCriterion4();
  }, [cycleId, context.cycleLabel]);

  useEffect(() => {
    const handleCoursesUpdated = async () => {
      try {
        const resolvedProgramId = await resolveProgramId();
        if (!resolvedProgramId) return;
        const refreshedCourses = await apiRequest(`/programs/${resolvedProgramId}/courses/?cycle_id=${cycleId}`, { method: 'GET' });
        if (!Array.isArray(refreshedCourses)) return;
        setCourses(refreshedCourses);
      } catch (_error) {
        // Keep current course options if refresh fails.
      }
    };

    window.addEventListener('courses-updated', handleCoursesUpdated);
    return () => window.removeEventListener('courses-updated', handleCoursesUpdated);
  }, [cycleId]);

  useEffect(() => {
    if (!courseMenuOpen) return;

    const handlePointerDown = (event) => {
      if (courseMenuRef.current && !courseMenuRef.current.contains(event.target)) {
        setCourseMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [courseMenuOpen]);

  useEffect(() => {
    if (!programNarrativeStatusOpen) return;

    const handlePointerDown = (event) => {
      if (programNarrativeStatusRef.current && !programNarrativeStatusRef.current.contains(event.target)) {
        setProgramNarrativeStatusOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [programNarrativeStatusOpen]);

  useEffect(() => {
    if (!recordsMaintenanceStatusOpen) return;

    const handlePointerDown = (event) => {
      if (recordsMaintenanceStatusRef.current && !recordsMaintenanceStatusRef.current.contains(event.target)) {
        setRecordsMaintenanceStatusOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [recordsMaintenanceStatusOpen]);

  useEffect(() => {
    if (activeSO) return;
    const firstSoId = sos[0]?.id || '';
    if (firstSoId) {
      setActiveSO(firstSoId);
    }
  }, [activeSO, sos]);

  useEffect(() => {
    localStorage.setItem('criterion4ActiveSection', activeSection);
  }, [activeSection]);

  const saveCriterion4 = async ({ silent = false, payloadOverride = null } = {}) => {
    try {
      setSaving(true);
      setSaveError('');
      if (!silent) {
        setSaveSuccess(false);
      }
      const payload = payloadOverride || buildCriterion4Payload();
      const payloadSnapshot = JSON.stringify(payload);
      const resolvedProgramId = await resolveProgramId();
      if (!resolvedProgramId) {
        throw new Error('No program selected.');
      }
      const result = await apiRequest(`/cycles/${cycleId}/criterion4/`, {
        method: 'PUT',
        body: JSON.stringify({ ...payload, program_id: resolvedProgramId }),
      });
      setCriterion4Id(result?.criterion4_id ?? criterion4Id);
      const resolvedItemId = result?.item ?? checklistItemId;
      setChecklistItemId(resolvedItemId);

      if (resolvedItemId) {
        const completionPercentage = Math.round((readinessCount / 5) * 100);
        const checklistItem = await apiRequest(`/checklist-items/${resolvedItemId}/`, { method: 'GET' });
        await apiRequest(`/checklist-items/${resolvedItemId}/`, {
          method: 'PUT',
          body: JSON.stringify({
            ...checklistItem,
            status: completionPercentage >= 100 ? 1 : 0,
            completion_percentage: completionPercentage,
          }),
        });
        localStorage.setItem('checklistNeedsRefresh', 'true');
      }

      lastSavedSnapshotRef.current = payloadSnapshot;
      if (!silent) {
        setSaveSuccess(true);
        window.setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (error) {
      setSaveError(error.message || 'Failed to save Criterion 4.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSummary = async () => {
    try {
      setExporting(true);
      setSaveError('');
      const paragraphRow = (label, value) => new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun(`${value ?? ''}`),
        ],
      });
      const tableCell = (text, bold = false) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `${text ?? ''}`, bold })] })],
      });
      const piRows = [
        new TableRow({
          children: ['SO', 'PI Code', 'Type', 'Instrument', 'Frequency', 'Threshold', 'Assessed Courses', 'Has Data', 'Evidence File'].map((value) => tableCell(value, true)),
        }),
        ...pis.map((pi) => {
          const assessedCourses = getCoursesForPi(pi).map((course) => course.code).join(', ') || 'None';
          return new TableRow({
            children: [
              tableCell(pi.soId),
              tableCell(pi.id),
              tableCell(pi.type),
              tableCell(pi.instrument),
              tableCell(pi.freq),
              tableCell(`${pi.threshold}%`),
              tableCell(assessedCourses),
              tableCell(getResultsForPI(pi.id).length ? 'Yes' : 'No'),
              tableCell(getAttachmentName(pi.file) || 'None'),
            ],
          });
        }),
      ];
      const resultRows = [
        new TableRow({
          children: ['SO', 'PI', 'Course', 'Semester', 'Students', '% Met', 'Threshold', 'Status', 'Interpretation'].map((value) => tableCell(value, true)),
        }),
        ...results.map((row) => {
          const course = courses.find((item) => String(item.id) === String(row.courseId));
          const pi = pis.find((item) => item.id === row.piId);
          return new TableRow({
            children: [
              tableCell(row.soId),
              tableCell(row.piId),
              tableCell(course?.code || row.courseId),
              tableCell(row.semester),
              tableCell(row.n),
              tableCell(`${row.pct}%`),
              tableCell(`${pi?.threshold || 70}%`),
              tableCell(statusLabel(row.pct, pi?.threshold || 70)),
              tableCell(row.interpretation || ''),
            ],
          });
        }),
      ];
      const missingPiRows = [
        new TableRow({
          children: ['SO', 'PI Code', 'PI Description', 'Mapped Courses'].map((value) => tableCell(value, true)),
        }),
        ...pisWithoutResults.map((pi) => new TableRow({
          children: [
            tableCell(pi.soId),
            tableCell(pi.id),
            tableCell(pi.desc),
            tableCell(getCoursesForPi(pi).map((course) => course.code).join(', ') || 'None'),
          ],
        })),
      ];
      const instrumentRows = [
        new TableRow({
          children: ['SO', 'PI', 'Instrument Name', 'Type', 'Status', 'File'].map((value) => tableCell(value, true)),
        }),
        ...instruments.map((instrument) => new TableRow({
          children: [
            tableCell(instrument.soId || ''),
            tableCell(instrument.piId || ''),
            tableCell(instrument.name || ''),
            tableCell(instrument.type || ''),
            tableCell(getAttachmentName(instrument.file) ? 'Uploaded' : 'Missing'),
            tableCell(getAttachmentName(instrument.file) || 'None'),
          ],
        })),
      ];
      const loopSummaryRows = [
        new TableRow({
          children: ['SO', 'Status', 'Action Type', 'Course', 'Implementation Semester'].map((value) => tableCell(value, true)),
        }),
        ...loops.map((loop) => new TableRow({
          children: [
            tableCell((loop.sos || []).join(', ')),
            tableCell(loopStatusLabelMap[loop.status] || loop.status),
            tableCell(loop.type),
            tableCell(loop.coursesText || ''),
            tableCell(loop.implSemester || loop.semester || ''),
          ],
        })),
      ];
      const loopDetailBlocks = loops.flatMap((loop, index) => {
        const reassessmentOutcomeLabel = loop.reassessmentOutcome === 'yes'
          ? 'Threshold met'
          : loop.reassessmentOutcome === 'partial'
            ? 'Partial improvement'
            : loop.reassessmentOutcome === 'no'
              ? 'No meaningful improvement'
              : '';
        return [
          new Paragraph({ text: `Action ${index + 1}: ${(loop.sos || []).join(', ')} - ${loop.type || 'Improvement action'}`, heading: HeadingLevel.HEADING_3 }),
          paragraphRow('Status', loopStatusLabelMap[loop.status] || loop.status || ''),
          paragraphRow('Course', loop.coursesText || ''),
          paragraphRow('Implementation Semester', loop.implSemester || loop.semester || ''),
          paragraphRow('Decision Meeting / Date', loop.decisionMeeting || loop.meeting || ''),
          paragraphRow('Finding', loop.finding || ''),
          paragraphRow('Action', loop.action || ''),
          paragraphRow('Planned Next Step', loop.plan || ''),
          paragraphRow('Re-assessment Semester', loop.reassessmentSemester || ''),
          paragraphRow('Re-assessment %', loop.reassessmentPct === '' || loop.reassessmentPct == null ? '' : `${loop.reassessmentPct}%`),
          paragraphRow('Re-assessment Outcome', reassessmentOutcomeLabel),
          paragraphRow('Re-assessment Narrative', loop.reassessmentNarrative || ''),
          new Paragraph({ text: '' }),
        ];
      });
      const meetingRows = [
        new TableRow({
          children: ['Date', 'Title', 'Type', 'SOs', 'Attendees', 'Minutes Status'].map((value) => tableCell(value, true)),
        }),
        ...meetings.map((meeting) => new TableRow({
          children: [
            tableCell(meeting.date),
            tableCell(meeting.title),
            tableCell(meeting.type),
            tableCell((meeting.sos || []).join(', ')),
            tableCell(meeting.attendees),
            tableCell(meeting.minutesStatus),
          ],
        })),
      ];
      const soNarrativeBlocks = sos.flatMap((so) => {
        const soPis = getPIsForSO(so.id);
        return [
          new Paragraph({ text: `${so.id} - ${getSoTitle(so.id, so.label)}`, heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: so.label || '' }),
          new Paragraph({ text: so.narrative || 'No outcome-level narrative entered yet.' }),
          new Paragraph({ text: soPis.length ? `PIs: ${soPis.map((pi) => pi.id).join(', ')}` : 'PIs: None yet' }),
          new Paragraph({ text: '' }),
        ];
      });
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: 'Criterion 4 Summary', heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT }),
            paragraphRow('Program', context.programName),
            paragraphRow('Cycle', context.cycleLabel),
            paragraphRow('Exported At', new Date().toISOString()),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Program-Level Narrative', heading: HeadingLevel.HEADING_2 }),
            new Paragraph(programNarrative || 'No program-level 4A narrative entered yet.'),
            new Paragraph(recordsMaintenance || defaultRecordsMaintenanceText),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Overview', heading: HeadingLevel.HEADING_2 }),
            paragraphRow('Student Outcomes', sos.length),
            paragraphRow('Performance Indicators', pis.length),
            paragraphRow('Logged Results', results.length),
            paragraphRow('Improvement Loops', loops.length),
            paragraphRow('Instrument Files Uploaded', instruments.filter((instrument) => getAttachmentName(instrument.file)).length),
            paragraphRow('Decision Meetings', meetings.length),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Outcome Narratives', heading: HeadingLevel.HEADING_2 }),
            ...soNarrativeBlocks,
            new Paragraph({ text: 'PI Inventory', heading: HeadingLevel.HEADING_2 }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: piRows }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Results Log', heading: HeadingLevel.HEADING_2 }),
            ...(results.length ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: resultRows })] : [new Paragraph('No attainment results logged yet.')]),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'PIs Without Logged Data', heading: HeadingLevel.HEADING_2 }),
            ...(pisWithoutResults.length ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: missingPiRows })] : [new Paragraph('All PIs have at least one logged result.')]),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '4B Continuous Improvement', heading: HeadingLevel.HEADING_2 }),
            ...(loops.length ? [
              new Paragraph({ text: '4B Action Summary', heading: HeadingLevel.HEADING_3 }),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: loopSummaryRows }),
              new Paragraph({ text: '' }),
              new Paragraph({ text: '4B Action Details', heading: HeadingLevel.HEADING_3 }),
              ...loopDetailBlocks,
            ] : [new Paragraph('No improvement loops logged yet.')]),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '4C Assessment Instruments', heading: HeadingLevel.HEADING_2 }),
            ...(instruments.length ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: instrumentRows })] : [new Paragraph('No assessment instruments linked yet.')]),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Decision Meetings', heading: HeadingLevel.HEADING_2 }),
            ...(meetings.length ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: meetingRows })] : [new Paragraph('No meetings logged yet.')]),
          ],
        }],
      });
      const safeProgram = `${context.programName || 'program'}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'program';
      const safeCycle = `${context.cycleLabel || 'cycle'}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'cycle';
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `criterion4-summary-${safeProgram}-${safeCycle}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setSaveError(`Export failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (loading || !hasHydratedRef.current) return;

    const payload = buildCriterion4Payload();
    const payloadSnapshot = JSON.stringify(payload);
    if (payloadSnapshot === lastSavedSnapshotRef.current) return;

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      saveCriterion4({ silent: true, payloadOverride: payload });
    }, 900);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [criterion4Id, programNarrative, recordsMaintenance, programNarrativeStatus, sos, courses, pis, results, mapping, loops, meetings, instruments, instrumentOptions, frequencyOptions, loading]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: palette.bg, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 4 - Continuous Improvement" subtitle={context.subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />
      <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1500px', margin: '0 auto', display: 'grid', gap: spacing.lg }}>
        <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '14px', boxShadow: palette.shadow, padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 800, color: palette.ink, letterSpacing: '-0.02em' }}>
                Criterion 4 Workspace
              </div>
              <div style={{ marginTop: spacing.xs, fontSize: '15px', color: palette.ink3, lineHeight: 1.5, maxWidth: '760px' }}>
                Manage assessment processes, PI evidence, results logging, and continuous improvement actions in one place.
              </div>
            </div>
            <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleExportSummary} disabled={loading || exporting} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: loading || exporting ? 'not-allowed' : 'pointer', opacity: loading || exporting ? 0.7 : 1 }}>
                <Download size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                {exporting ? 'Exporting...' : 'Export Summary'}
              </button>
              <button type="button" onClick={saveCriterion4} disabled={saving || loading} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving || loading ? 'not-allowed' : 'pointer', boxShadow: palette.shadowLg, opacity: saving || loading ? 0.7 : 1 }}>
                <Save size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
          {!loading && saveError ? (
            <div style={{ marginTop: '14px', backgroundColor: palette.redBg, border: `1px solid ${palette.red}`, borderRadius: '10px', padding: '12px 14px', color: palette.red, fontSize: '13px' }}>
              {saveError}
            </div>
          ) : null}
          {!loading && saveSuccess ? (
            <div style={{ marginTop: '14px', backgroundColor: palette.greenBg, border: `1px solid ${palette.green}`, borderRadius: '10px', padding: '12px 14px', color: palette.green, fontSize: '13px' }}>
              Criterion 4 saved successfully.
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 220px)', backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '14px', boxShadow: palette.shadow, overflow: 'hidden' }}>
        <aside style={{ width: '240px', flexShrink: 0, backgroundColor: palette.white, borderRight: `1px solid ${palette.line}`, padding: `${spacing.lg} ${spacing.sm} ${spacing.md}`, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div style={{ padding: `0 ${spacing.sm} ${spacing.sm}`, borderBottom: `1px solid ${palette.line2}` }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: palette.ink4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Criterion 4</div>
            <div style={{ marginTop: spacing.xs, display: 'grid', gap: spacing.xs }}>
              <button type="button" onClick={() => setActiveSection('4a')} style={{ textAlign: 'left', border: 'none', borderLeft: activeSection === '4a' ? `3px solid ${palette.burg}` : '3px solid transparent', borderRadius: '8px', backgroundColor: activeSection === '4a' ? palette.burgLight : 'transparent', padding: '10px 12px', color: activeSection === '4a' ? palette.burg : palette.ink3, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                4A Assessment Processes
              </button>
              <button type="button" onClick={() => setActiveSection('4b')} style={{ textAlign: 'left', border: 'none', borderLeft: activeSection === '4b' ? `3px solid ${palette.burg}` : '3px solid transparent', borderRadius: '8px', backgroundColor: activeSection === '4b' ? palette.burgLight : 'transparent', padding: '10px 12px', color: activeSection === '4b' ? palette.burg : palette.ink3, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                4B Continuous Improvement
              </button>
              <button type="button" onClick={() => setActiveSection('4c')} style={{ textAlign: 'left', border: 'none', borderLeft: activeSection === '4c' ? `3px solid ${palette.burg}` : '3px solid transparent', borderRadius: '8px', backgroundColor: activeSection === '4c' ? palette.burgLight : 'transparent', padding: '10px 12px', color: activeSection === '4c' ? palette.burg : palette.ink3, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                4C Assessment Instruments
              </button>
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: palette.ink3 }}>{context.programName} · {context.cycleLabel}</div>
          </div>
          {activeSection === '4a' ? (
          <div style={{ display: 'grid', gap: spacing.xs, overflowY: 'auto', paddingRight: spacing.xs }}>
            {sos.map((so) => {
              const soPis = getPIsForSO(so.id);
              const values = soPis.map((pi) => getLatestPct(pi.id)).filter((value) => value != null);
              const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
              const dot = getStatus(average, 70);
              const dotColor = dot === 'green' ? palette.green : dot === 'amber' ? palette.amber : palette.red;
              return (
                <button key={so.id} type="button" onClick={() => setActiveSO(so.id)} style={{ textAlign: 'left', border: activeSO === so.id ? `1px solid rgba(107,18,50,0.15)` : '1px solid transparent', borderRadius: '8px', backgroundColor: activeSO === so.id ? palette.burgLight : 'transparent', padding: '10px 12px', cursor: 'pointer', position: 'relative' }}>
                  {activeSO === so.id ? <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: '3px', backgroundColor: palette.burg, borderRadius: '0 2px 2px 0' }} /> : null}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: palette.burg, backgroundColor: palette.burgLight, padding: '2px 7px', borderRadius: '4px', fontFamily: 'monospace' }}>{so.id}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: palette.ink }}>{getSoTitle(so.id, so.label)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', paddingLeft: '2px' }}>
                    <span style={{ fontSize: '11px', color: palette.ink3 }}>{soPis.length} PI{soPis.length === 1 ? '' : 's'}</span>
                    <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '999px', backgroundColor: dotColor }} />
                  </div>
                </button>
              );
            })}
            <div style={{ marginTop: spacing.sm, padding: '10px 12px', borderTop: `1px solid ${palette.line2}`, display: 'grid', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: palette.ink4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dot Key</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.green, flexShrink: 0 }} />
                Meeting target
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.amber, flexShrink: 0 }} />
                Near target
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.red, flexShrink: 0 }} />
                Needs action
              </div>
            </div>
          </div>
          ) : activeSection === '4b' ? (
          <div style={{ display: 'grid', gap: spacing.xs, overflowY: 'auto', paddingRight: spacing.xs }}>
            {sos.map((so) => {
              const status = getLoopStatus(so.id);
              const dotColor = status === 'closed' ? palette.green : status === 'open' ? palette.amber : palette.line;
              return (
                <button key={so.id} type="button" onClick={() => document.getElementById(`so-section-${so.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} style={{ textAlign: 'left', border: '1px solid transparent', borderRadius: '8px', backgroundColor: 'transparent', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: palette.burg, backgroundColor: palette.burgLight, padding: '2px 7px', borderRadius: '4px', fontFamily: 'monospace' }}>{so.id}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: palette.ink }}>{getSoTitle(so.id, so.label)}</div>
                  </div>
                  <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: dotColor, flexShrink: 0 }} />
                </button>
              );
            })}
            <div style={{ marginTop: spacing.sm, padding: '10px 12px', borderTop: `1px solid ${palette.line2}`, display: 'grid', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: palette.ink4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dot Key</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.green, flexShrink: 0 }} />
                All actions closed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.amber, flexShrink: 0 }} />
                Open actions remain
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.line, border: `1px solid ${palette.line2}`, flexShrink: 0 }} />
                No actions yet
              </div>
            </div>
          </div>
          ) : (
          <div style={{ display: 'grid', gap: spacing.xs, overflowY: 'auto', paddingRight: spacing.xs }}>
            {sos.map((so) => {
              const soPis = getPIsForSO(so.id);
              const soUploadedInstruments = uploadedInstruments.filter((instrument) => instrument.soId === so.id);
              const coveredPiCount = soPis.filter((pi) => soUploadedInstruments.some((instrument) => instrument.piId === pi.id)).length;
              const dotColor = !soPis.length
                ? palette.line
                : coveredPiCount === soPis.length
                  ? palette.green
                  : coveredPiCount > 0
                    ? palette.amber
                    : palette.red;
              return (
                <button key={so.id} type="button" onClick={() => setActiveSO(so.id)} style={{ textAlign: 'left', border: activeSO === so.id ? `1px solid rgba(107,18,50,0.15)` : '1px solid transparent', borderRadius: '8px', backgroundColor: activeSO === so.id ? palette.burgLight : 'transparent', padding: '10px 12px', cursor: 'pointer', position: 'relative' }}>
                  {activeSO === so.id ? <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: '3px', backgroundColor: palette.burg, borderRadius: '0 2px 2px 0' }} /> : null}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: palette.burg, backgroundColor: palette.burgLight, padding: '2px 7px', borderRadius: '4px', fontFamily: 'monospace' }}>{so.id}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: palette.ink }}>{getSoTitle(so.id, so.label)}</div>
                    </div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: dotColor, flexShrink: 0, marginTop: '4px' }} />
                  </div>
                </button>
              );
            })}
            <div style={{ marginTop: spacing.sm, padding: '10px 12px', borderTop: `1px solid ${palette.line2}`, display: 'grid', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: palette.ink4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dot Key</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.green, flexShrink: 0 }} />
                All PI instruments uploaded
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.amber, flexShrink: 0 }} />
                Some instruments uploaded
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.red, flexShrink: 0 }} />
                Missing uploads
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: palette.ink3 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: palette.line, border: `1px solid ${palette.line2}`, flexShrink: 0 }} />
                No PIs yet
              </div>
            </div>
          </div>
          )}
        </aside>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: palette.white, borderBottom: `1px solid ${palette.line}`, padding: `${spacing.lg} 28px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: palette.ink, letterSpacing: '-0.02em' }}>
                  {activeSection === '4a'
                    ? 'Criterion 4A: Assessment Processes'
                    : activeSection === '4b'
                      ? 'Criterion 4B: Continuous Improvement'
                      : 'Criterion 4C: Assessment Instruments'}
                </div>
                <div style={{ marginTop: spacing.xs, fontSize: '13px', color: palette.ink3, lineHeight: 1.6 }}>
                  {activeSection === '4a'
                    ? 'Interactive PI library, outcome narratives, assessed-course mapping, results log, and multi-year attainment view.'
                    : activeSection === '4b'
                      ? 'Track findings, actions, reassessment loops, and the meetings that justify continuous improvement decisions.'
                      : 'Upload the physical instruments referenced in 4A so ABET evaluators can inspect the underlying rubrics, prompts, and forms.'}
                </div>
              </div>
            </div>
          </div>

          {activeSection === '4a' ? (
            <div style={{ backgroundColor: palette.white, borderBottom: `1px solid ${palette.line}`, padding: '0 28px', display: 'flex', gap: spacing.xs, flexWrap: 'wrap', overflowX: 'visible' }}>
              {[
                ['pis', 'PI Library', getPIsForSO(activeSO).length],
                ['results', 'Results Log', results.length],
                ['multiyear', 'Multi-Year View', null],
              ].map(([key, label, badge]) => (
                <button key={key} type="button" onClick={() => setActiveTab(key)} style={{ background: 'none', border: 'none', borderBottom: activeTab === key ? `2px solid ${palette.burg}` : '2px solid transparent', color: activeTab === key ? palette.burg : palette.ink3, padding: '14px 18px', marginBottom: '-1px', fontSize: '13px', fontWeight: activeTab === key ? 700 : 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  {label}
                  {badge != null ? <span style={{ backgroundColor: palette.burgLight, color: palette.burg, fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>{badge}</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          <div style={{ padding: `${spacing.xl} 28px ${spacing.xxl}`, display: 'grid', gap: spacing.lg }}>
            {loading ? (
              <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '24px', color: palette.ink2, boxShadow: palette.shadow }}>
                Loading Criterion 4...
              </div>
            ) : null}
            {!loading && activeSection === '4a' && !sos.length ? (
              <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '24px', color: palette.ink2, boxShadow: palette.shadow }}>
                No student outcomes were found for this program yet. Define the program outcomes first, then return to Criterion 4.
              </div>
            ) : null}
            {activeSection === '4a' && activeTab === 'pis' ? (
              <div style={{ display: 'grid', gap: spacing.lg }}>
                <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', boxShadow: palette.shadow, overflow: 'visible', position: 'relative', zIndex: 2 }}>
                  <button
                    type="button"
                    onClick={() => setProgramNarrativeCollapsed((prev) => !prev)}
                    style={{ width: '100%', border: 'none', backgroundColor: palette.white, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: palette.ink, letterSpacing: '-0.02em' }}>Program-Level Narrative</div>
                      <div style={{ marginTop: '6px', fontSize: '12px', color: palette.ink3 }}>
                        Opening paragraph for Criterion 4A across the full program before the PI detail below.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexShrink: 0 }}>
                      <div ref={programNarrativeStatusRef} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setProgramNarrativeStatusOpen((prev) => !prev);
                          }}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          <Badge tone={narrativeStatusTone[programNarrativeStatus] || 'gray'}>
                            {narrativeStatusOptions.find((option) => option.value === programNarrativeStatus)?.label || 'Not filled'}
                          </Badge>
                        </button>
                        {programNarrativeStatusOpen ? (
                          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '160px', backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '10px', boxShadow: palette.shadowLg, padding: '6px', display: 'grid', gap: '4px', zIndex: 30 }}>
                            {narrativeStatusOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setProgramNarrativeStatus(option.value);
                                  setProgramNarrativeStatusOpen(false);
                                }}
                                style={{ border: 'none', backgroundColor: programNarrativeStatus === option.value ? palette.burgPale : palette.white, color: programNarrativeStatus === option.value ? palette.burg : palette.ink2, borderRadius: '8px', padding: '8px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <ChevronDown size={16} color={palette.ink3} style={{ transform: programNarrativeCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                    </div>
                  </button>
                  {!programNarrativeCollapsed ? (
                    <div style={{ padding: '0 20px 18px', display: 'grid', gap: spacing.sm }}>
                      <textarea
                        value={programNarrative}
                        onChange={(event) => setProgramNarrative(event.target.value)}
                        placeholder="Summarize how the program manages assessment processes, reviews evidence, and uses results across Criterion 4A."
                        style={{ width: '100%', minHeight: '96px', padding: '12px 14px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', backgroundColor: palette.white }}
                      />
                    </div>
                  ) : null}
                </div>
                <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', boxShadow: palette.shadow, overflow: 'visible', position: 'relative', zIndex: 1 }}>
                  <button
                    type="button"
                    onClick={() => setRecordsMaintenanceCollapsed((prev) => !prev)}
                    style={{ width: '100%', border: 'none', backgroundColor: palette.white, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: palette.ink, letterSpacing: '-0.02em' }}>Records & Maintenance</div>
                      <div style={{ marginTop: '6px', fontSize: '12px', color: palette.ink3 }}>
                        How assessment results are stored, maintained, and made available to ABET evaluators.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexShrink: 0 }}>
                      <div ref={recordsMaintenanceStatusRef} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRecordsMaintenanceStatusOpen((prev) => !prev);
                          }}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          <Badge tone={narrativeStatusTone[recordsMaintenanceStatus] || 'gray'}>
                            {narrativeStatusOptions.find((option) => option.value === recordsMaintenanceStatus)?.label || 'Not filled'}
                          </Badge>
                        </button>
                        {recordsMaintenanceStatusOpen ? (
                          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: '160px', backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '10px', boxShadow: palette.shadowLg, padding: '6px', display: 'grid', gap: '4px', zIndex: 30 }}>
                            {narrativeStatusOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setRecordsMaintenanceStatus(option.value);
                                  setRecordsMaintenanceStatusOpen(false);
                                }}
                                style={{ border: 'none', backgroundColor: recordsMaintenanceStatus === option.value ? palette.burgPale : palette.white, color: recordsMaintenanceStatus === option.value ? palette.burg : palette.ink2, borderRadius: '8px', padding: '8px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <ChevronDown size={16} color={palette.ink3} style={{ transform: recordsMaintenanceCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                    </div>
                  </button>
                  {!recordsMaintenanceCollapsed ? (
                    <div style={{ padding: '0 20px 18px', display: 'grid', gap: spacing.sm }}>
                      <textarea
                        value={recordsMaintenance}
                        onChange={(event) => setRecordsMaintenance(event.target.value)}
                        placeholder={defaultRecordsMaintenanceText}
                        style={{ width: '100%', minHeight: '96px', padding: '12px 14px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', backgroundColor: palette.white }}
                      />
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, flexWrap: 'nowrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: palette.ink }}>{activeSO} - {getSoTitle(activeSO, activeSoRecord?.label)}</div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: palette.ink3, lineHeight: 1.5 }}>{activeSoRecord?.label || 'Manage direct and indirect measures, thresholds, instruments, and recent attainment.'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <button type="button" onClick={() => openAddPi(activeSO)} disabled={!activeSO} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, cursor: activeSO ? 'pointer' : 'not-allowed', opacity: activeSO ? 1 : 0.6 }}>
                      <Plus size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      Add PI
                    </button>
                  </div>
                </div>
                {!getPIsForSO(activeSO).length ? (
                  <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '16px', padding: '40px 20px', textAlign: 'center', boxShadow: palette.shadow }}>
                    <div style={{ fontSize: '14px', color: palette.ink2 }}>No performance indicators yet for {activeSO}.</div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: palette.ink3 }}>Add at least one direct and one indirect measure where possible.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: spacing.lg }}>
                    {['Direct', 'Indirect'].map((group) => {
                      const groupItems = getPIsForSO(activeSO).filter((pi) => pi.type === group);
                      if (!groupItems.length) return null;
                      return (
                        <div key={group} style={{ display: 'grid', gap: spacing.sm }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3 }}>{group} Measures</div>
                          <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', boxShadow: palette.shadow, overflow: 'hidden' }}>
                            {groupItems.map((pi, index) => {
                              const pct = getLatestPct(pi.id);
                              const tone = getStatus(pct, pi.threshold);
                              const color = tone === 'green' ? palette.green : tone === 'amber' ? palette.amber : palette.red;
                              const attachmentName = getAttachmentName(pi.file);
                              const attachmentUrl = getAttachmentUrl(pi.file);
                              const assessedCourses = getCoursesForPi(pi);
                              return (
                                <div key={pi.id} style={{ padding: '18px 20px', borderBottom: index === groupItems.length - 1 ? 'none' : `1px solid ${palette.line2}`, display: 'flex', gap: spacing.md, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1, minWidth: '320px' }}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: palette.burg, marginBottom: '6px' }}>{pi.id} · {pi.soId}</div>
                                    <div style={{ fontSize: '13px', color: palette.ink, lineHeight: 1.5 }}>{pi.desc}</div>
                                    {pi.supplementalDetail ? (
                                      <div style={{ marginTop: '8px', padding: '9px 10px', borderRadius: '8px', backgroundColor: palette.bg, fontSize: '12px', color: palette.ink2, lineHeight: 1.5 }}>
                                        <span style={{ fontWeight: 700, color: palette.ink }}>Supplementary detail:</span> {pi.supplementalDetail}
                                      </div>
                                    ) : null}
                                    <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.sm }}>
                                      <Badge tone={pi.type === 'Direct' ? 'burg' : 'blue'}>{pi.type}</Badge>
                                      <Badge tone="gray">{pi.instrument}</Badge>
                                      <Badge tone="gray">{pi.freq}</Badge>
                                      <Badge tone="gray">Threshold {pi.threshold}%</Badge>
                                      {assessedCourses.map((course) => <Badge key={`${pi.id}-${course.id}`} tone="blue">{course.code}</Badge>)}
                                      {attachmentName ? <Badge tone="green">{attachmentName}</Badge> : <span style={{ fontSize: '11px', color: palette.red, fontWeight: 600 }}>No instrument uploaded</span>}
                                      {attachmentUrl ? (
                                        <a href={attachmentUrl} download={attachmentName} style={{ fontSize: '11px', fontWeight: 700, color: palette.blue, textDecoration: 'none', alignSelf: 'center' }}>
                                          Download file
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div style={{ minWidth: '140px', marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                                    {pct != null ? (
                                      <>
                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1 }}>{pct}%</div>
                                          <div style={{ fontSize: '11px', color: palette.ink3, marginTop: '2px' }}>Target {pi.threshold}%</div>
                                        </div>
                                        <div style={{ width: '86px', height: '4px', backgroundColor: palette.line, borderRadius: '3px', overflow: 'hidden' }}>
                                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color }} />
                                        </div>
                                        <Badge tone={tone === 'green' ? 'green' : tone === 'amber' ? 'amber' : 'red'}>{statusLabel(pct, pi.threshold)}</Badge>
                                      </>
                                    ) : <Badge tone="amber">No data yet</Badge>}
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button type="button" onClick={() => openEditPi(pi.id)} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '6px 8px', cursor: 'pointer' }}><Edit size={14} /></button>
                                      <button type="button" onClick={() => openResultForPi(pi.id)} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '6px 8px', cursor: 'pointer' }}><ClipboardList size={14} /></button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
            {activeSection === '4a' && activeTab === 'results' ? (
              <div style={{ display: 'grid', gap: spacing.lg }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing.md }}>
                  {[
                    ['Total Results', filteredResults.length, palette.burg],
                    ['Meeting Threshold', filteredResults.filter((row) => {
                      const pi = pis.find((item) => item.id === row.piId);
                      return row.pct >= (pi?.threshold || 70);
                    }).length, palette.green],
                    ['Needs Attention', filteredResults.filter((row) => {
                      const pi = pis.find((item) => item.id === row.piId);
                      return row.pct < (pi?.threshold || 70);
                    }).length, palette.red],
                    ['Semesters Covered', [...new Set(filteredResults.map((row) => row.semester))].length, palette.amber],
                  ].map(([label, value, accent]) => (
                    <div key={label} style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '14px 16px', boxShadow: palette.shadow }}>
                      <div style={{ fontSize: '30px', fontWeight: 700, color: palette.ink, lineHeight: 1 }}>{value}</div>
                      <div style={{ marginTop: '4px', fontSize: '11px', color: palette.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
                      <div style={{ marginTop: '10px', height: '3px', borderRadius: '999px', backgroundColor: accent }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>Logged Attainment Results</div>
                  <button type="button" onClick={() => {
                    setResultFormErrors({});
                    setResultForm({ soId: activeSO || sos[0]?.id || '', piId: '', courseId: '', semester: '', semesterTerm: '', semesterYear: '', n: '', pct: '', interpretation: '' });
                    setResultModalOpen(true);
                  }} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    Log Result
                  </button>
                </div>
                <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '14px 16px', boxShadow: palette.shadow, display: 'flex', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '320px' }}>
                    <Search size={14} color={palette.ink3} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      value={resultSearchTerm}
                      onChange={(event) => setResultSearchTerm(event.target.value)}
                      placeholder="Search PI, course, semester, or interpretation..."
                      style={{ width: '100%', padding: '9px 12px 9px 34px', border: `1px solid ${palette.line}`, borderRadius: '999px', fontSize: '12px', backgroundColor: palette.white }}
                    />
                  </div>
                  <select value={resultSoFilter} onChange={(event) => setResultSoFilter(event.target.value)} style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '999px', fontSize: '12px', backgroundColor: palette.white, color: palette.ink2 }}>
                    <option value="all">All SOs</option>
                    {sos.map((so) => <option key={so.id} value={so.id}>{so.id}</option>)}
                  </select>
                  {[
                    ['all', 'All statuses'],
                    ['green', 'Meeting target'],
                    ['amber', 'Near target'],
                    ['red', 'Needs action'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setResultStatusFilter(value)}
                      style={{ border: `1px solid ${resultStatusFilter === value ? palette.burg : palette.line}`, backgroundColor: resultStatusFilter === value ? palette.burg : palette.white, color: resultStatusFilter === value ? palette.white : palette.ink2, borderRadius: '999px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {pisWithoutResults.length ? (
                  <div style={{ backgroundColor: palette.amberBg, border: `1px solid ${palette.amber}`, borderRadius: '12px', padding: '16px 18px', display: 'grid', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: palette.amber, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Missing Logged Data</div>
                      <div style={{ marginTop: '4px', fontSize: '13px', color: palette.ink2 }}>
                        {pisWithoutResults.length} PI{pisWithoutResults.length === 1 ? '' : 's'} do not have any logged attainment results yet.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                      {pisWithoutResults.map((pi) => (
                        <span key={`missing-${pi.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 9px', borderRadius: '999px', backgroundColor: palette.white, border: `1px solid rgba(168,104,32,0.24)`, color: palette.amber, fontSize: '11px', fontWeight: 700 }}>
                          {pi.id}
                          <span style={{ color: palette.ink3, fontWeight: 600 }}>{pi.soId}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', boxShadow: palette.shadow, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['SO', 'PI', 'Course', 'Semester', 'Students', '% Met', 'Threshold', 'Status', 'Interpretation'].map((header) => (
                          <th key={header} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${palette.line}`, fontSize: '11px', color: palette.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((row) => {
                        const pi = pis.find((item) => item.id === row.piId);
                        const course = courses.find((item) => item.id === row.courseId);
                        const tone = getStatus(row.pct, pi?.threshold || 70);
                        const color = tone === 'green' ? palette.green : tone === 'amber' ? palette.amber : palette.red;
                        return (
                          <tr key={row.id}>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}` }}><Badge tone={tone === 'none' ? 'gray' : tone}>{row.soId}</Badge></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}`, fontFamily: 'monospace', fontSize: '11px', color: palette.burg }}>{row.piId}</td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}`, fontSize: '12px' }}>{course?.code || row.courseId}</td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}`, fontSize: '12px', color: palette.ink2 }}>{row.semester}</td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}`, textAlign: 'center' }}>{row.n}</td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 700, color }}>{row.pct}%</span>
                                <div style={{ width: '42px', height: '4px', backgroundColor: palette.line, borderRadius: '999px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(row.pct, 100)}%`, height: '100%', backgroundColor: color }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}`, fontSize: '12px', color: palette.ink3 }}>{pi?.threshold || 70}%</td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}` }}><Badge tone={tone === 'none' ? 'gray' : tone}>{statusLabel(row.pct, pi?.threshold || 70)}</Badge></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${palette.line2}`, fontSize: '12px', color: palette.ink2, minWidth: '220px' }}>{row.interpretation || '-'}</td>
                          </tr>
                        );
                      })}
                      {!filteredResults.length ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '24px 14px', textAlign: 'center', color: palette.ink3, fontSize: '13px' }}>
                            No results match the current filters.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeSection === '4a' && activeTab === 'multiyear' ? (
              <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', boxShadow: palette.shadow, overflowX: 'auto' }}>
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${palette.line}` }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>Multi-Year Attainment View</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: palette.ink3 }}>Compare PI attainment across semesters to support continuous improvement decisions.</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['SO', 'PI', 'Instrument', 'Threshold', 'Fall 2024', 'Spring 2025'].map((header, index) => (
                        <th key={header} style={{ padding: '8px 12px', textAlign: index < 3 ? 'left' : 'center', borderBottom: `1px solid ${palette.line}`, fontSize: '11px', color: palette.ink3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sos.flatMap((so) => getPIsForSO(so.id).map((pi, index, items) => {
                      const fall = results.find((row) => row.piId === pi.id && row.semester === 'Fall 2024');
                      const spring = results.find((row) => row.piId === pi.id && row.semester === 'Spring 2025');
                      return (
                        <tr key={pi.id}>
                          {index === 0 ? (
                            <td rowSpan={items.length} style={{ padding: '10px 12px', borderBottom: `1px solid ${palette.line2}`, verticalAlign: 'middle' }}>
                              <Badge tone="burg">{so.id}</Badge>
                              <div style={{ fontSize: '11px', color: palette.ink3, marginTop: '4px' }}>{so.label}</div>
                            </td>
                          ) : null}
                          <td style={{ padding: '10px 12px', borderBottom: `1px solid ${palette.line2}` }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: palette.burg }}>{pi.id}</div>
                            <div style={{ fontSize: '12px', color: palette.ink2 }}>{pi.desc.length > 52 ? `${pi.desc.slice(0, 52)}...` : pi.desc}</div>
                          </td>
                          <td style={{ padding: '10px 12px', borderBottom: `1px solid ${palette.line2}`, fontSize: '11px', color: palette.ink3 }}>{pi.instrument}</td>
                          <td style={{ padding: '10px 12px', borderBottom: `1px solid ${palette.line2}`, textAlign: 'center', fontSize: '12px' }}>{pi.threshold}%</td>
                          {[fall, spring].map((result, resultIndex) => {
                            const tone = getStatus(result?.pct ?? null, pi.threshold);
                            return (
                              <td key={`${pi.id}-${resultIndex}`} style={{ padding: '10px 12px', borderBottom: `1px solid ${palette.line2}`, textAlign: 'center' }}>
                                {result ? <Badge tone={tone === 'none' ? 'gray' : tone}>{result.pct}%</Badge> : <Badge tone="gray">-</Badge>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeSection === '4b' ? (
              <div style={{ display: 'grid', gap: spacing.lg }}>
                <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '24px', boxShadow: palette.shadow }}>
                  <div style={{ color: palette.ink, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.015em' }}>4B. Continuous Improvement</div>
                  <div style={{ marginTop: '8px', maxWidth: '720px', fontSize: '14px', color: palette.ink3, lineHeight: 1.5 }}>
                    For each student outcome, the 4A assessment data appears above the writing area. Use it to document the finding, the action taken, and the later result or next step.
                  </div>
                </div>
                {sos.map((so) => {
                  const soLoops = getLoopsForSO(so.id);
                  const allClosed = soLoops.length > 0 && soLoops.every((loop) => loop.status === 'closed');
                  return (
                    <section key={so.id} id={`so-section-${so.id}`} style={{ display: 'grid', gap: spacing.md, scrollMarginTop: '84px', backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '24px', boxShadow: palette.shadow }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '11px', fontWeight: 500, color: palette.burg, backgroundColor: palette.burgLight, padding: '3px 9px', borderRadius: '4px', marginBottom: '6px' }}>{so.id}</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: palette.ink, lineHeight: 1.3 }}>{getSoTitle(so.id, so.label)}</div>
                          <div style={{ marginTop: '4px', fontSize: '12px', color: palette.ink3, lineHeight: 1.5 }}>{so.label}</div>
                        </div>
                        <button type="button" onClick={() => openAddLoop(so.id)} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                          + Add Action
                        </button>
                      </div>

                      <div style={{ backgroundColor: palette.bg, border: `1px solid ${palette.line}`, borderRadius: '10px', padding: '16px', display: 'grid', gap: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: palette.ink }}>Related 4A Data</div>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          {getPIsForSO(so.id).length ? getPIsForSO(so.id).map((pi) => {
                            const latest = getLatestResultForPi(pi.id);
                            const tone = latest ? getStatus(latest.pct, pi.threshold) : 'none';
                            const badgeTone = tone === 'green' ? 'green' : tone === 'amber' ? 'amber' : tone === 'red' ? 'red' : 'gray';
                            return (
                              <Badge key={`4b-data-${pi.id}`} tone={badgeTone}>
                                <span style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.75 }}>{pi.id}</span>
                                <span style={{ fontWeight: 700 }}>{latest ? `${latest.pct}%` : 'No data'}</span>
                                <span>{latest ? latest.semester : ''}</span>
                              </Badge>
                            );
                          }) : <div style={{ fontSize: '12px', color: palette.ink4, lineHeight: 1.5 }}>No 4A data logged for {so.id} yet.</div>}
                        </div>
                      </div>

                      {!soLoops.length ? (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: palette.amberBg, border: `1px solid ${palette.amber}`, color: palette.amber, fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span>Review the 4A data above and document an improvement action if needed.</span>
                        </div>
                      ) : allClosed ? (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: palette.greenBg, border: `1px solid ${palette.green}`, color: palette.green, fontSize: '12px' }}>
                          All improvement actions for {so.id} are closed and re-assessed.
                        </div>
                      ) : null}

                      {soLoops.length ? (
                        soLoops.map((loop) => {
                          const isClosed = loop.status === 'closed';
                          const hasPlan = `${loop.plan || ''}`.trim().length > 0;
                          const needsPlan = !isClosed && !hasPlan;
                          const statusTone = loop.status === 'closed' ? 'green' : loop.status === 'impl' ? 'blue' : 'amber';
                          const isCollapsed = Boolean(collapsedLoopCards[loop.id]);
                          return (
                            <div key={loop.id} style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '10px', overflow: 'hidden' }}>
                              <div style={{ padding: '16px 18px', borderBottom: isCollapsed ? 'none' : `1px solid ${palette.line2}`, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: palette.bg, flexWrap: 'wrap' }}>
                                <Badge tone={statusTone}>{loopStatusLabelMap[loop.status] || loop.status}</Badge>
                                <span style={{ fontSize: '12px', color: palette.ink2, fontWeight: 600 }}>{loop.type}</span>
                                {loop.coursesText ? <span style={{ fontSize: '12px', color: palette.ink3 }}>{loop.coursesText}</span> : null}
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button type="button" onClick={() => openEditLoop(loop.id)} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                  <button
                                    type="button"
                                    onClick={() => setCollapsedLoopCards((prev) => ({ ...prev, [loop.id]: !prev[loop.id] }))}
                                    style={{ width: '32px', height: '32px', border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <ChevronDown size={14} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                                  </button>
                                </div>
                              </div>
                              {!isCollapsed ? (
                              <div style={{ padding: '20px 22px' }}>
                                <div style={{ display: 'grid', gap: '18px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3, marginBottom: '8px' }}>Finding</div>
                                    <div style={{ fontSize: '14px', color: palette.ink2, lineHeight: 1.65 }}>{loop.finding}</div>
                                  </div>
                                  <div style={{ height: '1px', backgroundColor: palette.line2 }} />
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3, marginBottom: '8px' }}>Decision Meeting / Date</div>
                                    <div style={{ fontSize: '14px', color: palette.ink2, lineHeight: 1.65 }}>{loop.decisionMeeting || loop.meeting || 'Not documented'}</div>
                                  </div>
                                  {loop.action ? (
                                    <>
                                      <div style={{ height: '1px', backgroundColor: palette.line2 }} />
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3, marginBottom: '8px' }}>Action{loop.implSemester ? ` · ${loop.implSemester}` : ''}</div>
                                        <div style={{ fontSize: '14px', color: palette.ink2, lineHeight: 1.65 }}>{loop.action}</div>
                                      </div>
                                    </>
                                  ) : null}
                                  {isClosed && loop.reassessmentPct !== '' && loop.reassessmentPct != null ? (
                                    <>
                                      <div style={{ height: '1px', backgroundColor: palette.line2 }} />
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3, marginBottom: '8px' }}>Re-assessment · {loop.reassessmentSemester || ''}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', backgroundColor: palette.greenBg, border: `1px solid rgba(27,122,74,0.22)`, borderRadius: '8px', marginBottom: '10px' }}>
                                          <div style={{ fontSize: '24px', fontWeight: 800, color: palette.green, lineHeight: 1, flexShrink: 0 }}>{loop.reassessmentPct}%</div>
                                          <div>
                                            <div style={{ fontSize: '12px', color: palette.green, fontWeight: 700 }}>{loop.reassessmentSemester}</div>
                                            <div style={{ fontSize: '11px', color: palette.green, marginTop: '2px' }}>
                                              {loop.reassessmentOutcome === 'yes' ? 'Threshold met' : loop.reassessmentOutcome === 'partial' ? 'Partial improvement — not yet met' : 'No meaningful improvement'}
                                            </div>
                                          </div>
                                        </div>
                                        {loop.reassessmentNarrative ? <div style={{ fontSize: '14px', color: palette.ink2, lineHeight: 1.65 }}>{loop.reassessmentNarrative}</div> : null}
                                      </div>
                                    </>
                                  ) : null}
                                  {!isClosed && hasPlan ? (
                                    <>
                                      <div style={{ height: '1px', backgroundColor: palette.line2 }} />
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3, marginBottom: '8px' }}>Planned Next Step</div>
                                        <div style={{ fontSize: '14px', color: palette.ink2, lineHeight: 1.65 }}>{loop.plan}</div>
                                      </div>
                                    </>
                                  ) : null}
                                  {needsPlan ? (
                                    <>
                                      <div style={{ height: '1px', backgroundColor: palette.line2 }} />
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: palette.ink3, marginBottom: '8px' }}>Planned Next Step</div>
                                        <div onClick={() => openEditLoop(loop.id)} style={{ fontSize: '13px', color: palette.ink4, lineHeight: 1.6, cursor: 'pointer' }}>No future plan documented — click to add.</div>
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '20px', border: `1.5px dashed ${palette.line}`, borderRadius: '10px', textAlign: 'center', color: palette.ink4, fontSize: '13px' }}>
                          No improvement actions yet for {so.id}
                        </div>
                      )}

                      <button type="button" onClick={() => openAddLoop(so.id)} style={{ width: '100%', padding: '12px', border: `1.5px dashed ${palette.line}`, borderRadius: '10px', background: 'transparent', fontSize: '13px', color: palette.ink3, cursor: 'pointer' }}>
                        + Add improvement action for {so.id}
                      </button>
                    </section>
                  );
                })}
              </div>
            ) : null}
            {activeSection === '4c' ? (
              <div style={{ display: 'grid', gap: spacing.lg }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing.md }}>
                  {[
                    ['PIs in Selected SO', selectedSoPis.length, palette.burg],
                    ['Uploaded Files', selectedSoUploadedFiles.length, palette.green],
                    ['PIs Covered', selectedSoCoverageCount, palette.blue],
                    ['Uploaded', `${selectedSoPis.length ? Math.round((selectedSoCoverageCount / selectedSoPis.length) * 100) : 0}%`, palette.amber],
                  ].map(([label, value, accent]) => (
                    <div key={label} style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', padding: '14px 16px', boxShadow: palette.shadow }}>
                      <div style={{ fontSize: '30px', fontWeight: 700, color: palette.ink, lineHeight: 1 }}>{value}</div>
                      <div style={{ marginTop: '4px', fontSize: '11px', color: palette.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
                      <div style={{ marginTop: '10px', height: '3px', borderRadius: '999px', backgroundColor: accent }} />
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: palette.white, border: `1px solid ${palette.line}`, borderRadius: '12px', boxShadow: palette.shadow, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>Assessment Instrument Vault</div>
                      <div style={{ marginTop: '4px', fontSize: '12px', color: palette.ink3 }}>
                        Upload the physical rubrics, prompts, and survey forms referenced by each PI in 4A.
                      </div>
                    </div>
                    <button type="button" onClick={() => openAddInstrument()} style={{ backgroundColor: palette.burg, color: palette.white, border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      <Plus size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      Upload Instrument
                    </button>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'grid', gap: spacing.md }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '280px' }}>
                          <Search size={14} color={palette.ink3} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            value={instrumentSearchTerm}
                            onChange={(event) => setInstrumentSearchTerm(event.target.value)}
                            placeholder="Search instruments..."
                            style={{ width: '100%', padding: '9px 12px 9px 34px', border: `1px solid ${palette.line}`, borderRadius: '999px', fontSize: '12px', backgroundColor: palette.white }}
                          />
                        </div>
                        {[
                          ['all', 'All'],
                          ['uploaded', 'Uploaded'],
                          ['missing', 'Missing'],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setInstrumentFilter(value)}
                            style={{ border: `1px solid ${instrumentFilter === value ? palette.burg : palette.line}`, backgroundColor: instrumentFilter === value ? palette.burg : palette.white, color: instrumentFilter === value ? palette.white : palette.ink2, borderRadius: '999px', padding: '7px 13px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                {!pis.length ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: palette.ink2 }}>
                    No performance indicators exist yet. Add PIs in 4A first, then return to 4C to upload their supporting instruments.
                  </div>
                ) : visibleInstruments.length ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {visibleInstruments.map((instrument) => {
                      const hasFile = Boolean(getAttachmentName(instrument.file));
                      const attachmentName = getAttachmentName(instrument.file);
                      const attachmentUrl = getAttachmentUrl(instrument.file);
                      const sizeLabel = getAttachmentSizeLabel(instrument.file);
                      const uploadedLabel = instrument.uploadedAt
                        ? new Date(instrument.uploadedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : '';
                      return (
                        <div key={instrument.id} style={{ backgroundColor: palette.white, border: `1px solid ${hasFile ? palette.line : '#E9B5BC'}`, borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${palette.line2}`, backgroundColor: hasFile ? palette.bg : palette.redBg, display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                            <Badge tone={hasFile ? 'green' : 'red'}>{hasFile ? 'Uploaded' : 'Missing'}</Badge>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: palette.ink }}>{instrument.name || instrument.piId}</span>
                            <span style={{ fontSize: '12px', color: palette.ink3 }}>{instrument.ref}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {attachmentUrl ? (
                                <a href={attachmentUrl} download={attachmentName} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '7px 9px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
                                  <Download size={14} />
                                </a>
                              ) : null}
                              {instrument.isPlaceholder ? (
                                <button type="button" onClick={() => openAddInstrument(instrument.piId)} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                  Upload
                                </button>
                              ) : (
                                <>
                                  <button type="button" onClick={() => openAddInstrument(instrument.piId)} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                    + Add Another
                                  </button>
                                  <button type="button" onClick={() => openEditInstrument(instrument.id)} style={{ border: `1px solid ${palette.line}`, backgroundColor: palette.white, color: palette.ink2, borderRadius: '8px', padding: '7px 9px', cursor: 'pointer' }}>
                                    <Edit size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ padding: '16px', display: 'grid', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <Badge tone="gray">{instrument.type}</Badge>
                              <Badge tone="burg">{instrument.piId}</Badge>
                              <Badge tone="blue">{instrument.soId}</Badge>
                            </div>
                            {hasFile ? (
                              <div style={{ fontSize: '12px', color: palette.ink3, lineHeight: 1.5 }}>
                                {attachmentName}{sizeLabel ? ` · ${sizeLabel}` : ''}{uploadedLabel ? ` · Uploaded ${uploadedLabel}` : ''}
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: palette.red, fontWeight: 600, lineHeight: 1.5 }}>
                                No file uploaded. This PI is still missing its supporting assessment instrument.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: palette.ink2 }}>
                    No instruments match the current search or filter.
                  </div>
                )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
      </div>
      {instrumentModalOpen ? (
        <div onClick={() => setInstrumentModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(18,8,12,.45)', zIndex: 1090, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '620px', maxHeight: 'calc(100vh - 40px)', backgroundColor: palette.white, borderRadius: '16px', boxShadow: palette.shadowXl, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>{editingInstrumentId ? 'Edit Instrument' : 'Upload Instrument'}</div>
              <button type="button" onClick={() => setInstrumentModalOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: palette.bg, border: 'none', cursor: 'pointer', fontSize: '16px', color: palette.ink3 }}>x</button>
            </div>
            <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'grid', gap: spacing.md }}>
              {Object.keys(instrumentFormErrors).length ? (
                <div style={{ backgroundColor: palette.redBg, border: `1px solid ${palette.red}`, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: palette.red }}>
                  Fill the required instrument fields before saving.
                </div>
              ) : null}
              <label style={{ display: 'none' }}>
                Instrument Name
                <input value={instrumentForm.name} onChange={(event) => setInstrumentForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Written communication rubric" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(instrumentFormErrors.name) }} />
                {instrumentFormErrors.name ? <div style={{ fontSize: '11px', color: palette.red }}>{instrumentFormErrors.name}</div> : null}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Type
                  <select value={instrumentVaultTypeOptions.includes(instrumentForm.type) ? instrumentForm.type : 'Other'} onChange={(event) => setInstrumentForm((prev) => ({ ...prev, type: event.target.value, customType: event.target.value === 'Other' ? prev.customType : '' }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(instrumentFormErrors.type) }}>
                    {instrumentVaultTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    {!instrumentVaultTypeOptions.includes('Other') ? <option value="Other">Other</option> : null}
                  </select>
                  {instrumentFormErrors.type ? <div style={{ fontSize: '11px', color: palette.red }}>{instrumentFormErrors.type}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Student Outcome
                  <select value={instrumentForm.soId} onChange={(event) => setInstrumentForm((prev) => ({ ...prev, soId: event.target.value, piId: '' }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(instrumentFormErrors.soId) }}>
                    <option value="">Select outcome...</option>
                    {sos.map((so) => <option key={so.id} value={so.id}>{so.id} - {getSoTitle(so.id, so.label)}</option>)}
                  </select>
                  {instrumentFormErrors.soId ? <div style={{ fontSize: '11px', color: palette.red }}>{instrumentFormErrors.soId}</div> : null}
                </label>
              </div>
              {instrumentForm.type === 'Other' ? (
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Custom Type
                  <input value={instrumentForm.customType} onChange={(event) => setInstrumentForm((prev) => ({ ...prev, customType: event.target.value }))} placeholder="Describe the instrument type" style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(instrumentFormErrors.type) }} />
                </label>
              ) : null}
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Linked PI
                <select value={instrumentForm.piId} onChange={(event) => {
                  const selectedPi = pis.find((pi) => pi.id === event.target.value);
                  setInstrumentForm((prev) => ({
                    ...prev,
                    piId: event.target.value,
                    soId: selectedPi?.soId || prev.soId,
                    name: prev.name || selectedPi?.desc || '',
                  }));
                }} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(instrumentFormErrors.piId) }}>
                  <option value="">Select PI...</option>
                  {getPIsForSO(instrumentForm.soId).map((pi) => <option key={pi.id} value={pi.id}>{pi.id} - {pi.desc}</option>)}
                </select>
                {instrumentFormErrors.piId ? <div style={{ fontSize: '11px', color: palette.red }}>{instrumentFormErrors.piId}</div> : null}
              </label>
              <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: palette.bg, border: `1px solid ${palette.line}`, fontSize: '12px', color: palette.ink2, lineHeight: 1.5 }}>
                Linked reference: {selectedInstrumentPi ? `${selectedInstrumentPi.soId} · ${selectedInstrumentPi.id}` : 'Choose an SO and PI to link this instrument to 4A.'}
              </div>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                File
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setInstrumentForm((prev) => ({ ...prev, file: '', uploadedAt: '' }));
                      return;
                    }
                    try {
                      const attachment = await readFileAsAttachment(file);
                      setInstrumentForm((prev) => ({ ...prev, file: attachment, uploadedAt: new Date().toISOString() }));
                    } catch (error) {
                      setInstrumentFormErrors((prev) => ({ ...prev, file: error.message || 'Failed to read the selected file.' }));
                    }
                  }}
                  style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', backgroundColor: palette.white, ...requiredFieldStyle(instrumentFormErrors.file) }}
                />
                <div style={{ fontSize: '11px', color: palette.ink3 }}>
                  {getAttachmentName(instrumentForm.file) ? `Selected: ${getAttachmentName(instrumentForm.file)}` : 'No file selected yet'}
                </div>
                {instrumentFormErrors.file ? <div style={{ fontSize: '11px', color: palette.red }}>{instrumentFormErrors.file}</div> : null}
              </label>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <div>{editingInstrumentId ? <button type="button" onClick={deleteInstrument} style={{ backgroundColor: palette.redBg, color: palette.red, border: `1px solid ${palette.red}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Clear Upload</button> : null}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setInstrumentModalOpen(false)} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={saveInstrument} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Save Instrument</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {piModalOpen ? (
        <div onClick={() => setPiModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(18,8,12,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '620px', maxHeight: 'calc(100vh - 40px)', backgroundColor: palette.white, borderRadius: '16px', boxShadow: palette.shadowXl, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>{editingPiId ? 'Edit Performance Indicator' : 'Add Performance Indicator'}</div>
              <button type="button" onClick={() => setPiModalOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: palette.bg, border: 'none', cursor: 'pointer', fontSize: '16px', color: palette.ink3 }}>x</button>
            </div>
            <div style={{ padding: '24px', display: 'grid', gap: spacing.md, overflowY: 'auto' }}>
              {Object.keys(piFormErrors).length ? (
                <div style={{ backgroundColor: palette.redBg, border: `1px solid ${palette.red}`, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: palette.red }}>
                  Fill the required fields before saving.
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  PI Code Type
                  <select
                    value={piForm.codeMode}
                    onChange={(event) => setPiForm((prev) => ({
                      ...prev,
                      codeMode: event.target.value,
                      code: event.target.value === 'manual' ? (prev.code || editingPiId || '') : getAutoPiCode(),
                    }))}
                    style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="auto">Auto-incremented</option>
                    <option value="manual">User-defined</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  PI Code
                  <input
                    value={piForm.codeMode === 'auto' ? getAutoPiCode() : piForm.code}
                    onChange={(event) => setPiForm((prev) => ({ ...prev, code: event.target.value }))}
                    placeholder={piForm.codeMode === 'auto' ? 'Generated automatically' : 'e.g., PI-101 or SO3-PI1'}
                    disabled={piForm.codeMode === 'auto'}
                    style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', backgroundColor: piForm.codeMode === 'auto' ? palette.bg : palette.white, color: piForm.codeMode === 'auto' ? palette.ink3 : palette.ink, ...requiredFieldStyle(piFormErrors.code) }}
                  />
                  {piFormErrors.code ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.code}</div> : null}
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Student Outcome
                  <select value={piForm.soId} onChange={(event) => setPiForm((prev) => ({ ...prev, soId: event.target.value }))} style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px' }}>
                    {sos.map((so) => <option key={so.id} value={so.id}>{so.id} - {getSoTitle(so.id, so.label)}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Type
                  <select value={piForm.type} onChange={(event) => setPiForm((prev) => ({ ...prev, type: event.target.value }))} style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px' }}>
                    <option value="Direct">Direct</option>
                    <option value="Indirect">Indirect</option>
                  </select>
                </label>
              </div>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Description
                <textarea value={piForm.desc} onChange={(event) => setPiForm((prev) => ({ ...prev, desc: event.target.value }))} placeholder="What is being measured" style={{ minHeight: '90px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical', ...requiredFieldStyle(piFormErrors.desc) }} />
                {piFormErrors.desc ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.desc}</div> : null}
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Supplementary Detail (Optional)
                <textarea
                  value={piForm.supplementalDetail}
                  onChange={(event) => setPiForm((prev) => ({ ...prev, supplementalDetail: event.target.value }))}
                  placeholder="Optional administration note, faculty calibration detail, or other supporting context."
                  style={{ minHeight: '72px', padding: '10px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                />
              </label>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>Assessed In Course(s)</div>
                <div ref={courseMenuRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setCourseMenuOpen((prev) => !prev)}
                    style={{ width: '100%', minHeight: '44px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', backgroundColor: palette.white, color: palette.ink, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer', textAlign: 'left', ...requiredFieldStyle(piFormErrors.assessedCourseIds) }}
                  >
                    <span style={{ color: piForm.assessedCourseIds.length ? palette.ink : palette.ink3 }}>
                      {piForm.assessedCourseIds.length
                        ? courses.filter((course) => piForm.assessedCourseIds.map((value) => String(value)).includes(String(course.id))).map((course) => course.code).join(', ')
                        : 'Select assessed courses'}
                    </span>
                    <ChevronDown size={16} color={palette.ink3} />
                  </button>
                  {courseMenuOpen ? (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', border: `1px solid ${palette.line}`, borderRadius: '10px', backgroundColor: palette.white, boxShadow: palette.shadowLg, zIndex: 20, overflow: 'hidden' }}>
                      <div style={{ padding: spacing.sm, borderBottom: `1px solid ${palette.line2}`, display: 'grid', gap: spacing.xs }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={14} color={palette.ink3} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            value={courseSearchTerm}
                            onChange={(event) => setCourseSearchTerm(event.target.value)}
                            placeholder="Search courses"
                            style={{ width: '100%', padding: '9px 10px 9px 32px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.xs }}>
                          <button type="button" onClick={() => setPiForm((prev) => ({ ...prev, assessedCourseIds: courses.map((course) => course.id) }))} style={{ border: 'none', background: 'none', color: palette.burg, fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            Select all
                          </button>
                          <button type="button" onClick={() => setPiForm((prev) => ({ ...prev, assessedCourseIds: [] }))} style={{ border: 'none', background: 'none', color: palette.ink3, fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            Clear
                          </button>
                        </div>
                      </div>
                      <div style={{ maxHeight: '220px', overflowY: 'auto', padding: spacing.xs }}>
                        {filteredCourseOptions.map((course) => {
                          const checked = piForm.assessedCourseIds.map((value) => String(value)).includes(String(course.id));
                          return (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => setPiForm((prev) => ({
                                ...prev,
                                assessedCourseIds: checked
                                  ? prev.assessedCourseIds.filter((value) => String(value) !== String(course.id))
                                  : [...prev.assessedCourseIds, course.id],
                              }))}
                              style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: spacing.sm, padding: '10px', border: 'none', backgroundColor: checked ? palette.burgPale : palette.white, borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
                            >
                              <span style={{ width: '16px', height: '16px', marginTop: '2px', borderRadius: '4px', border: `1px solid ${checked ? palette.burg : palette.line}`, backgroundColor: checked ? palette.burg : palette.white, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {checked ? <Check size={12} color="white" /> : null}
                              </span>
                              <span>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: palette.ink }}>{course.code}</span>
                                <span style={{ display: 'block', fontSize: '11px', color: palette.ink3, lineHeight: 1.4 }}>{course.name}</span>
                              </span>
                            </button>
                          );
                        })}
                        {!filteredCourseOptions.length ? <div style={{ padding: '10px', fontSize: '12px', color: palette.ink3 }}>No matching courses found.</div> : null}
                        {!courses.length ? <div style={{ padding: '10px', fontSize: '12px', color: palette.ink3 }}>No courses are available for this cycle yet.</div> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
                {piFormErrors.assessedCourseIds ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.assessedCourseIds}</div> : null}
                {piForm.assessedCourseIds.length ? (
                  <div onClick={() => setCourseMenuOpen(false)} style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                    {courses
                      .filter((course) => piForm.assessedCourseIds.map((value) => String(value)).includes(String(course.id)))
                      .map((course) => (
                        <span key={`selected-${course.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '999px', backgroundColor: palette.burgPale, color: palette.burg, fontSize: '11px', fontWeight: 700 }}>
                          {course.code}
                          <button
                            type="button"
                            onClick={() => setPiForm((prev) => ({ ...prev, assessedCourseIds: prev.assessedCourseIds.filter((value) => String(value) !== String(course.id)) }))}
                            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: palette.burg, display: 'inline-flex' }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                  </div>
                ) : null}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Instrument
                  <select value={instrumentOptions.includes(piForm.instrument) ? piForm.instrument : '__custom__'} onChange={(event) => {
                    const value = event.target.value;
                    if (value === '__custom__') {
                      setPiForm((prev) => ({ ...prev, instrument: '' }));
                      return;
                    }
                    setPiForm((prev) => ({ ...prev, instrument: value }));
                  }} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(piFormErrors.instrument) }}>
                    {instrumentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    <option value="__custom__">Add new instrument...</option>
                  </select>
                  {piFormErrors.instrument ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.instrument}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Frequency
                  <select value={frequencyOptions.includes(piForm.freq) ? piForm.freq : '__custom__'} onChange={(event) => {
                    const value = event.target.value;
                    if (value === '__custom__') {
                      setPiForm((prev) => ({ ...prev, freq: '' }));
                      return;
                    }
                    setPiForm((prev) => ({ ...prev, freq: value }));
                  }} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(piFormErrors.freq) }}>
                    {frequencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    <option value="__custom__">Add new frequency...</option>
                  </select>
                  {piFormErrors.freq ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.freq}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Threshold %
                  <input type="number" value={piForm.threshold} onChange={(event) => setPiForm((prev) => ({ ...prev, threshold: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(piFormErrors.threshold) }} />
                  {piFormErrors.threshold ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.threshold}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Evidence File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        setPiForm((prev) => ({ ...prev, file: '' }));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPiForm((prev) => ({
                          ...prev,
                          file: {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            dataUrl: typeof reader.result === 'string' ? reader.result : '',
                          },
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                    style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', backgroundColor: palette.white, ...requiredFieldStyle(piFormErrors.file) }}
                  />
                  <div style={{ fontSize: '11px', color: palette.ink3 }}>
                    {getAttachmentName(piForm.file) ? `Selected: ${getAttachmentName(piForm.file)}` : 'No document selected'}
                  </div>
                  {piFormErrors.file ? <div style={{ fontSize: '11px', color: palette.red }}>{piFormErrors.file}</div> : null}
                </label>
              </div>
              {!piForm.instrument ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.sm, alignItems: 'end' }}>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                    New Instrument
                    <input value={customInstrument} onChange={(event) => setCustomInstrument(event.target.value)} placeholder="e.g., Alumni survey" style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px' }} />
                  </label>
                  <button type="button" onClick={addInstrumentOption} style={{ backgroundColor: palette.white, color: palette.burg, border: `1px solid ${palette.burg}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Add Instrument
                  </button>
                </div>
              ) : null}
              {!piForm.freq ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.sm, alignItems: 'end' }}>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                    New Frequency
                    <input value={customFrequency} onChange={(event) => setCustomFrequency(event.target.value)} placeholder="e.g., Every summer" style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px' }} />
                  </label>
                  <button type="button" onClick={addFrequencyOption} style={{ backgroundColor: palette.white, color: palette.burg, border: `1px solid ${palette.burg}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Add Frequency
                  </button>
                </div>
              ) : null}
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <div>{editingPiId ? <button type="button" onClick={deletePi} style={{ backgroundColor: palette.redBg, color: palette.red, border: `1px solid ${palette.red}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Delete PI</button> : null}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setPiModalOpen(false)} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={savePi} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Save PI</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {resultModalOpen ? (
        <div onClick={() => setResultModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(18,8,12,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '620px', maxHeight: 'calc(100vh - 40px)', backgroundColor: palette.white, borderRadius: '16px', boxShadow: palette.shadowXl, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>Log Attainment Result</div>
              <button type="button" onClick={() => setResultModalOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: palette.bg, border: 'none', cursor: 'pointer', fontSize: '16px', color: palette.ink3 }}>x</button>
            </div>
            <div style={{ padding: '24px', display: 'grid', gap: spacing.md, overflowY: 'auto', minHeight: 0 }}>
              {Object.keys(resultFormErrors).length ? (
                <div style={{ backgroundColor: palette.redBg, border: `1px solid ${palette.red}`, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: palette.red }}>
                  Fill the required fields before saving.
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Student Outcome
                  <select value={resultForm.soId} onChange={(event) => setResultForm((prev) => ({ ...prev, soId: event.target.value, piId: '', courseId: '' }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(resultFormErrors.soId) }}>
                    {sos.map((so) => <option key={so.id} value={so.id}>{so.id} - {getSoTitle(so.id, so.label)}</option>)}
                  </select>
                  {resultFormErrors.soId ? <div style={{ fontSize: '11px', color: palette.red }}>{resultFormErrors.soId}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  PI
                  <select value={resultForm.piId} onChange={(event) => setResultForm((prev) => ({ ...prev, piId: event.target.value, courseId: '' }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(resultFormErrors.piId) }}>
                    <option value="">Select PI...</option>
                    {getPIsForSO(resultForm.soId).map((pi) => <option key={pi.id} value={pi.id}>{pi.id} - {pi.desc.slice(0, 40)}</option>)}
                  </select>
                  {resultFormErrors.piId ? <div style={{ fontSize: '11px', color: palette.red }}>{resultFormErrors.piId}</div> : null}
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Course
                  <select value={resultForm.courseId} onChange={(event) => setResultForm((prev) => ({ ...prev, courseId: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(resultFormErrors.courseId) }}>
                    <option value="">Select assessed course...</option>
                    {resultCourseOptions.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
                  </select>
                  {resultFormErrors.courseId ? <div style={{ fontSize: '11px', color: palette.red }}>{resultFormErrors.courseId}</div> : null}
                  {resultForm.piId && resultCourseOptions.length === 0 ? (
                    <div style={{ fontSize: '11px', color: palette.red }}>
                      This PI is not mapped to any assessed course yet.
                    </div>
                  ) : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Semester
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: spacing.sm }}>
                    <select value={resultForm.semesterTerm} onChange={(event) => setResultForm((prev) => ({ ...prev, semesterTerm: event.target.value, semester: `${event.target.value || ''} ${prev.semesterYear || ''}`.trim() }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(resultFormErrors.semester) }}>
                      <option value="">Select term...</option>
                      {semesterTerms.map((term) => <option key={term} value={term}>{term}</option>)}
                    </select>
                    <select value={resultForm.semesterYear} onChange={(event) => setResultForm((prev) => ({ ...prev, semesterYear: event.target.value, semester: `${prev.semesterTerm || ''} ${event.target.value || ''}`.trim() }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(resultFormErrors.semester) }}>
                      <option value="">Select year...</option>
                      {semesterYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  {resultFormErrors.semester ? <div style={{ fontSize: '11px', color: palette.red }}>{resultFormErrors.semester}</div> : null}
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Number of Students
                  <input type="number" min="0" step="1" inputMode="numeric" value={resultForm.n} onChange={(event) => setResultForm((prev) => ({ ...prev, n: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(resultFormErrors.n) }} />
                  {resultFormErrors.n ? <div style={{ fontSize: '11px', color: palette.red }}>{resultFormErrors.n}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Percent Meeting Threshold
                  <input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={resultForm.pct} onChange={(event) => setResultForm((prev) => ({ ...prev, pct: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(resultFormErrors.pct) }} />
                  {resultFormErrors.pct ? <div style={{ fontSize: '11px', color: palette.red }}>{resultFormErrors.pct}</div> : null}
                </label>
              </div>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Interpretation
                <textarea
                  value={resultForm.interpretation}
                  onChange={(event) => setResultForm((prev) => ({ ...prev, interpretation: event.target.value }))}
                  placeholder="One sentence on what this result means — appears in the report alongside the data."
                  style={{ minHeight: '72px', padding: '10px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical' }}
                />
              </label>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0 }}>
              <button type="button" onClick={() => setResultModalOpen(false)} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={saveResult} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Save Result</button>
            </div>
          </div>
        </div>
      ) : null}
      {loopModalOpen ? (
        <div onClick={() => {
          setLoopModalOpen(false);
          setLoopModalExpanded(false);
        }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(18,8,12,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: loopModalExpanded ? '12px' : '20px' }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: loopModalExpanded ? 'none' : '760px', height: loopModalExpanded ? 'calc(100vh - 24px)' : 'auto', maxHeight: loopModalExpanded ? 'calc(100vh - 24px)' : '90vh', backgroundColor: palette.white, borderRadius: loopModalExpanded ? '14px' : '16px', boxShadow: palette.shadowXl, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>{editingLoopId ? 'Edit Improvement Action' : 'Add Improvement Action'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={() => setLoopModalExpanded((prev) => !prev)} style={{ minWidth: '88px', height: '32px', borderRadius: '8px', backgroundColor: palette.white, border: `1px solid ${palette.line}`, cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: palette.ink2 }}>
                  {loopModalExpanded ? 'Collapse' : 'Expand'}
                </button>
                <button type="button" onClick={() => {
                  setLoopModalOpen(false);
                  setLoopModalExpanded(false);
                }} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: palette.bg, border: 'none', cursor: 'pointer', fontSize: '16px', color: palette.ink3 }}>x</button>
              </div>
            </div>
            <div style={{ padding: '24px', display: 'grid', gap: spacing.md, overflowY: 'auto', minHeight: 0 }}>
              {Object.keys(loopFormErrors).length ? (
                <div style={{ backgroundColor: palette.redBg, border: `1px solid ${palette.red}`, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: palette.red }}>
                  Fill the required fields before saving.
                </div>
              ) : null}
              <div style={{ backgroundColor: palette.bg, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '12px 14px', display: 'grid', gap: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: palette.ink4 }}>4A Data for {loopForm.soId || activeSO}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {getPIsForSO(loopForm.soId || activeSO).length ? getPIsForSO(loopForm.soId || activeSO).map((pi) => {
                    const latest = getLatestResultForPi(pi.id);
                    const tone = latest ? getStatus(latest.pct, pi.threshold) : 'none';
                    const badgeTone = tone === 'green' ? 'green' : tone === 'amber' ? 'amber' : tone === 'red' ? 'red' : 'gray';
                    return (
                      <div key={`modal-loop-${pi.id}`} style={{ maxWidth: '100%', minWidth: 0 }}>
                        <Badge tone={badgeTone}>
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.75, wordBreak: 'break-word' }}>{pi.id}</span>
                          <span style={{ fontWeight: 700 }}>{latest ? `${latest.pct}%` : 'No data'}</span>
                          <span style={{ wordBreak: 'break-word' }}>{latest ? latest.semester : ''}</span>
                        </Badge>
                      </div>
                    );
                  }) : <div style={{ fontSize: '12px', color: palette.ink4, lineHeight: 1.5 }}>No 4A data logged for this outcome yet.</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', minWidth: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Student Outcome
                  <select value={loopForm.soId} onChange={(event) => setLoopForm((prev) => ({ ...prev, soId: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.sos) }}>
                    <option value="">Select outcome...</option>
                    {sos.map((so) => <option key={so.id} value={so.id}>{so.id} - {getSoTitle(so.id, so.label)}</option>)}
                  </select>
                  {loopFormErrors.sos ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.sos}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', minWidth: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Action Type
                  <select value={loopForm.type} onChange={(event) => setLoopForm((prev) => ({ ...prev, type: event.target.value, customType: event.target.value === 'Other' ? prev.customType : '' }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.type) }}>
                    <option value="Curriculum change">Curriculum change</option>
                    <option value="Rubric revision">Rubric revision</option>
                    <option value="New assessment tool">New assessment tool</option>
                    <option value="Prerequisite change">Prerequisite change</option>
                    <option value="Course restructure">Course restructure</option>
                    <option value="Faculty development">Faculty development</option>
                    <option value="IAC recommendation">IAC recommendation</option>
                    <option value="Other">Other</option>
                  </select>
                  {loopForm.type === 'Other' ? (
                    <input
                      type="text"
                      value={loopForm.customType}
                      onChange={(event) => setLoopForm((prev) => ({ ...prev, customType: event.target.value }))}
                      placeholder="Write action type..."
                      style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(loopFormErrors.type) }}
                    />
                  ) : null}
                  {loopFormErrors.type ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.type}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', minWidth: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Status
                  <select value={loopForm.status} onChange={(event) => setLoopForm((prev) => ({ ...prev, status: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.status) }}>
                    <option value="open">Action Planned</option>
                    <option value="impl">Implemented</option>
                    <option value="closed">Closed</option>
                  </select>
                  {loopFormErrors.status ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.status}</div> : null}
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Affected Course(s)
                  <select
                    value={loopForm.courseId}
                    onChange={(event) => {
                      const nextCourse = courses.find((course) => String(course.id) === String(event.target.value));
                      setLoopForm((prev) => ({
                        ...prev,
                        courseId: event.target.value,
                        coursesText: nextCourse ? `${nextCourse.code} - ${nextCourse.name}` : '',
                      }));
                    }}
                    style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(loopFormErrors.courseId) }}
                  >
                    <option value="">Select course...</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
                  </select>
                  {loopFormErrors.courseId ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.courseId}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Implementation Semester
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: spacing.sm }}>
                    <select
                      value={loopForm.implSemesterTerm}
                      onChange={(event) => setLoopForm((prev) => ({ ...prev, implSemesterTerm: event.target.value, implSemester: `${event.target.value || ''} ${prev.implSemesterYear || ''}`.trim() }))}
                      style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.implSemester) }}
                    >
                      <option value="">Select term...</option>
                      {semesterTerms.map((term) => <option key={term} value={term}>{term}</option>)}
                    </select>
                    <select
                      value={loopForm.implSemesterYear}
                      onChange={(event) => setLoopForm((prev) => ({ ...prev, implSemesterYear: event.target.value, implSemester: `${prev.implSemesterTerm || ''} ${event.target.value || ''}`.trim() }))}
                      style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.implSemester) }}
                    >
                      <option value="">Select year...</option>
                      {semesterYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  {loopFormErrors.implSemester ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.implSemester}</div> : null}
                </label>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>Decision Meeting</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                    Meeting Name
                    <input
                      value={loopForm.decisionMeetingName}
                      onChange={(event) => setLoopForm((prev) => ({ ...prev, decisionMeetingName: event.target.value, decisionMeeting: formatDecisionMeetingValue(event.target.value, prev.decisionMeetingDate) }))}
                      placeholder="e.g. Faculty Assessment Meeting"
                      style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(loopFormErrors.decisionMeetingName) }}
                    />
                    {loopFormErrors.decisionMeetingName ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.decisionMeetingName}</div> : null}
                  </label>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                    Date
                    <input
                      type="date"
                      value={loopForm.decisionMeetingDate}
                      onChange={(event) => setLoopForm((prev) => ({ ...prev, decisionMeetingDate: event.target.value, decisionMeeting: formatDecisionMeetingValue(prev.decisionMeetingName, event.target.value) }))}
                      min={`${earliestCriterion4Year}-01-01`}
                      max={`${latestCriterion4Year}-12-31`}
                      style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(loopFormErrors.decisionMeetingDate) }}
                    />
                    {loopFormErrors.decisionMeetingDate ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.decisionMeetingDate}</div> : null}
                  </label>
                </div>
                <div style={{ fontSize: '11px', color: palette.ink3 }}>
                  The meeting where this action was reviewed and decided — appears in the report.
                </div>
              </div>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Finding
                <textarea value={loopForm.finding} onChange={(event) => setLoopForm((prev) => ({ ...prev, finding: event.target.value }))} placeholder="Use the 4A data shown above to write the finding. Name the PI, the percentages, the semesters, and whether the threshold was missed." style={{ minHeight: '110px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical', ...requiredFieldStyle(loopFormErrors.finding) }} />
                {loopFormErrors.finding ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.finding}</div> : null}
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Action{loopForm.status === 'open' ? ' (Optional)' : ''}
                <textarea
                  value={loopForm.action}
                  onChange={(event) => setLoopForm((prev) => ({ ...prev, action: event.target.value }))}
                  placeholder={
                    loopForm.status === 'open'
                      ? 'Optional: describe the specific change if it has already been decided.'
                      : loopForm.status === 'impl'
                        ? 'Document what change was carried out and when it was implemented.'
                        : 'Document what action was taken before re-assessment.'
                  }
                  style={{ minHeight: '92px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical', ...requiredFieldStyle(loopFormErrors.action) }}
                />
                {loopFormErrors.action ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.action}</div> : null}
              </label>
              {loopForm.status === 'closed' ? (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: palette.burg, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Re-assessment Result</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.md }}>
                    <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                      Semester
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: spacing.sm }}>
                        <select
                          value={loopForm.reassessmentSemesterTerm}
                          onChange={(event) => setLoopForm((prev) => ({ ...prev, reassessmentSemesterTerm: event.target.value, reassessmentSemester: `${event.target.value || ''} ${prev.reassessmentSemesterYear || ''}`.trim() }))}
                          style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.reassessmentSemester) }}
                        >
                          <option value="">Select term...</option>
                          {semesterTerms.map((term) => <option key={term} value={term}>{term}</option>)}
                        </select>
                        <select
                          value={loopForm.reassessmentSemesterYear}
                          onChange={(event) => setLoopForm((prev) => ({ ...prev, reassessmentSemesterYear: event.target.value, reassessmentSemester: `${prev.reassessmentSemesterTerm || ''} ${event.target.value || ''}`.trim() }))}
                          style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minWidth: 0, ...requiredFieldStyle(loopFormErrors.reassessmentSemester) }}
                        >
                          <option value="">Select year...</option>
                          {semesterYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                      {loopFormErrors.reassessmentSemester ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.reassessmentSemester}</div> : null}
                    </label>
                    <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                      New Attainment %
                      <input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={loopForm.reassessmentPct} onChange={(event) => setLoopForm((prev) => ({ ...prev, reassessmentPct: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(loopFormErrors.reassessmentPct) }} />
                      {loopFormErrors.reassessmentPct ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.reassessmentPct}</div> : null}
                    </label>
                  </div>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                    Outcome
                    <select value={loopForm.reassessmentOutcome} onChange={(event) => setLoopForm((prev) => ({ ...prev, reassessmentOutcome: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(loopFormErrors.reassessmentOutcome) }}>
                      <option value="yes">Threshold met</option>
                      <option value="partial">Partial improvement — not yet met</option>
                      <option value="no">No meaningful improvement</option>
                    </select>
                    {loopFormErrors.reassessmentOutcome ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.reassessmentOutcome}</div> : null}
                  </label>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                    Re-assessment Narrative
                    <textarea value={loopForm.reassessmentNarrative} onChange={(event) => setLoopForm((prev) => ({ ...prev, reassessmentNarrative: event.target.value }))} placeholder="Describe what the re-assessment showed and why the result changed." style={{ minHeight: '92px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical', ...requiredFieldStyle(loopFormErrors.reassessmentNarrative) }} />
                    {loopFormErrors.reassessmentNarrative ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.reassessmentNarrative}</div> : null}
                  </label>
                </>
              ) : (
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Planned Next Step
                  <textarea value={loopForm.plan} onChange={(event) => setLoopForm((prev) => ({ ...prev, plan: event.target.value }))} placeholder="Explain the next planned step until this loop can be closed." style={{ minHeight: '80px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical', ...requiredFieldStyle(loopFormErrors.plan) }} />
                  {loopFormErrors.plan ? <div style={{ fontSize: '11px', color: palette.red }}>{loopFormErrors.plan}</div> : null}
                </label>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {editingLoopId ? <button type="button" onClick={deleteLoop} style={{ marginRight: 'auto', backgroundColor: palette.redBg, color: palette.red, border: `1px solid ${palette.red}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Delete</button> : null}
              <button type="button" onClick={() => setLoopModalOpen(false)} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={saveLoop} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
      {meetingModalOpen ? (
        <div onClick={() => setMeetingModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(18,8,12,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '720px', backgroundColor: palette.white, borderRadius: '16px', boxShadow: palette.shadowXl, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: palette.ink }}>Log Decision Meeting</div>
              <button type="button" onClick={() => setMeetingModalOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: palette.bg, border: 'none', cursor: 'pointer', fontSize: '16px', color: palette.ink3 }}>x</button>
            </div>
            <div style={{ padding: '24px', display: 'grid', gap: spacing.md }}>
              {Object.keys(meetingFormErrors).length ? (
                <div style={{ backgroundColor: palette.redBg, border: `1px solid ${palette.red}`, borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: palette.red }}>
                  Fill the required fields before saving.
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing.md }}>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Date
                  <input type="date" value={meetingForm.date} onChange={(event) => setMeetingForm((prev) => ({ ...prev, date: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(meetingFormErrors.date) }} />
                  {meetingFormErrors.date ? <div style={{ fontSize: '11px', color: palette.red }}>{meetingFormErrors.date}</div> : null}
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Type
                  <select value={meetingForm.type} onChange={(event) => setMeetingForm((prev) => ({ ...prev, type: event.target.value }))} style={{ padding: '9px 12px', border: `1px solid ${palette.line}`, borderRadius: '8px', fontSize: '13px' }}>
                    <option value="Faculty Assessment Meeting">Faculty Assessment Meeting</option>
                    <option value="Curriculum Committee">Curriculum Committee</option>
                    <option value="Advisory Board">Advisory Board</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                  Outcome
                  <select value={meetingForm.sos[0] || ''} onChange={(event) => setMeetingForm((prev) => ({ ...prev, sos: event.target.value ? [event.target.value] : [] }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(meetingFormErrors.sos) }}>
                    <option value="">Select outcome...</option>
                    {sos.map((so) => <option key={so.id} value={so.id}>{so.id}</option>)}
                  </select>
                  {meetingFormErrors.sos ? <div style={{ fontSize: '11px', color: palette.red }}>{meetingFormErrors.sos}</div> : null}
                </label>
              </div>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Title
                <input value={meetingForm.title} onChange={(event) => setMeetingForm((prev) => ({ ...prev, title: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(meetingFormErrors.title) }} />
                {meetingFormErrors.title ? <div style={{ fontSize: '11px', color: palette.red }}>{meetingFormErrors.title}</div> : null}
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Attendees
                <input value={meetingForm.attendees} onChange={(event) => setMeetingForm((prev) => ({ ...prev, attendees: event.target.value }))} style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '13px', ...requiredFieldStyle(meetingFormErrors.attendees) }} />
                {meetingFormErrors.attendees ? <div style={{ fontSize: '11px', color: palette.red }}>{meetingFormErrors.attendees}</div> : null}
              </label>
              <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: palette.ink3 }}>
                Outcomes and decisions
                <textarea value={meetingForm.outcomes} onChange={(event) => setMeetingForm((prev) => ({ ...prev, outcomes: event.target.value }))} style={{ minHeight: '86px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', resize: 'vertical', ...requiredFieldStyle(meetingFormErrors.outcomes) }} />
                {meetingFormErrors.outcomes ? <div style={{ fontSize: '11px', color: palette.red }}>{meetingFormErrors.outcomes}</div> : null}
              </label>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${palette.line}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setMeetingModalOpen(false)} style={{ backgroundColor: palette.white, color: palette.ink2, border: `1px solid ${palette.line}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={saveMeeting} style={{ backgroundColor: palette.burg, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Save Meeting</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
