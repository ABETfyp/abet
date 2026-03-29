import React, { useEffect, useState } from 'react';
import { Save, Plus, Sparkles } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';
import { getActiveContext } from '../utils/activeContext';

const TRACKED_FIELDS = [
  'faculty_composition_narrative',
  'workload_expectations_desciption',
  'faculty_size_adequacy_description',
  'advising_and_student_interaction_description',
  'service_and_industry_engagement_description',
  'course_creation_role_description',
  'peo_ro_role_description',
  'leadership_roles_description',
];

const RANK_OPTIONS = [
  { value: 'Professor', label: 'Professor' },
  { value: 'ASC', label: 'ASC - Associate Professor' },
  { value: 'AST', label: 'AST - Assistant Professor' },
  { value: 'I', label: 'I - Instructor' },
  { value: 'A', label: 'A - Adjunct' },
  { value: 'O', label: 'O - Other' },
];
const APPOINTMENT_OPTIONS = [
  { value: 'TT', label: 'TT - Tenure-Track' },
  { value: 'T', label: 'T - Tenured' },
  { value: 'OA', label: 'OA - Other Academic Appointment' },
];

const FT_PT_OPTIONS = ['FT', 'PT'];
const ROW_BATCH_SIZE = 5;

const id = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const splitActivities = (text) => (
  `${text ?? ''}`
    .split(/\r?\n/)
    .flatMap((line) => {
      const normalizedLine = line.trim().replace(/^-+\s*/, '');
      if (!normalizedLine) return [];
      const extractedTitles = extractProfileEntryTitles(normalizedLine);
      return extractedTitles.length > 0 ? extractedTitles : [normalizedLine];
    })
    .filter(Boolean)
);
const calculateCompletion = (payload, { qualificationRows = [], workloadRows = [], pdRows = [] }) => {
  const scalarCompleted = TRACKED_FIELDS.filter((field) => `${payload?.[field] ?? ''}`.trim() !== '').length;
  const rowChecks = [
    qualificationRows.some((row) => {
      const hasName = `${row?.faculty_name ?? ''}`.trim() !== '' || `${row?.faculty_id ?? ''}`.trim() !== '';
      return hasName
        && `${row?.highest_degree_field ?? ''}`.trim() !== ''
        && `${row?.highest_degree_year ?? ''}`.trim() !== ''
        && `${row?.academic_rank ?? ''}`.trim() !== ''
        && `${row?.academic_appointment ?? ''}`.trim() !== ''
        && `${row?.full_time_or_part_time ?? ''}`.trim() !== ''
        && `${row?.years_gov_industry ?? ''}`.trim() !== ''
        && `${row?.years_teaching ?? ''}`.trim() !== ''
        && `${row?.years_at_institution ?? ''}`.trim() !== '';
    }),
    workloadRows.some((row) => {
      const hasFaculty = `${row?.faculty_id ?? ''}`.trim() !== '' || `${row?.faculty_name ?? ''}`.trim() !== '';
      return hasFaculty
        && `${row?.fill_tie_or_part_time ?? ''}`.trim() !== ''
        && `${row?.classes_taught_description ?? ''}`.trim() !== ''
        && `${row?.term ?? ''}`.trim() !== ''
        && `${row?.year ?? ''}`.trim() !== '';
    }),
    pdRows.some((row) => (Array.isArray(row?.activities) ? row.activities.some((value) => `${value ?? ''}`.trim() !== '') : `${row?.activities_text ?? ''}`.trim() !== '')),
  ];
  return Math.round(((scalarCompleted + rowChecks.filter(Boolean).length) / (TRACKED_FIELDS.length + rowChecks.length)) * 100);
};

const qualificationRow = (seed = {}) => ({
  local_id: seed.local_id || id('c6q'),
  faculty_qualification_row_id: seed.faculty_qualification_row_id ?? null,
  faculty_id: seed.faculty_id ?? '',
  faculty_name: seed.faculty_name ?? '',
  highest_degree_field: seed.highest_degree_field ?? '',
  highest_degree_year: seed.highest_degree_year ?? '',
  academic_rank: seed.academic_rank ?? '',
  academic_appointment: seed.academic_appointment ?? '',
  full_time_or_part_time: seed.full_time_or_part_time ?? '',
  years_gov_industry: seed.years_gov_industry ?? '',
  years_teaching: seed.years_teaching ?? '',
  years_at_institution: seed.years_at_institution ?? '',
  professional_registration: seed.professional_registration ?? '',
});

const workloadRow = (seed = {}) => ({
  local_id: seed.local_id || id('c6w'),
  faculty_workload_row_id: seed.faculty_workload_row_id ?? null,
  faculty_id: seed.faculty_id ?? '',
  faculty_name: seed.faculty_name ?? '',
  fill_tie_or_part_time: seed.fill_tie_or_part_time ?? '',
  classes_taught_description: seed.classes_taught_description ?? '',
  term: seed.term ?? '',
  year: seed.year ?? '',
  course_id: seed.course_id ?? '',
});

const pdRow = (seed = {}) => ({
  local_id: seed.local_id || id('c6p'),
  faculty_id: seed.faculty_id ?? '',
  faculty_name: seed.faculty_name ?? '',
  activities_text: seed.activities_text ?? '',
});

const PROFILE_ENTRY_PREFIX = '__ABET_ENTRY__';

const extractProfileEntryTitles = (value) => {
  const text = `${value ?? ''}`.trim();
  if (!text) return [];

  const prefixedMatches = [...text.matchAll(/__ABET_ENTRY__\{.*?\}(?=,\s*__ABET_ENTRY__|$)/g)].map((match) => match[0]);
  if (prefixedMatches.length > 0) {
    return prefixedMatches.map((entry) => {
      try {
        const parsed = JSON.parse(entry.slice(PROFILE_ENTRY_PREFIX.length));
        return `${parsed?.title ?? ''}`.trim();
      } catch (_error) {
        return '';
      }
    }).filter(Boolean);
  }

  if (text.startsWith(PROFILE_ENTRY_PREFIX)) {
    try {
      const parsed = JSON.parse(text.slice(PROFILE_ENTRY_PREFIX.length));
      const title = `${parsed?.title ?? ''}`.trim();
      return title ? [title] : [];
    } catch (_error) {
      return [];
    }
  }

  return text
    .split(/\r?\n|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeRegistrationText = (value) => {
  const titles = extractProfileEntryTitles(value);
  return titles.join(', ');
};

const normalizeRankValue = (value) => {
  const text = `${value ?? ''}`.trim();
  const lower = text.toLowerCase();
  if (!text) return '';
  if (text === 'ASC' || lower.includes('associate')) return 'ASC';
  if (text === 'AST' || lower.includes('assistant')) return 'AST';
  if (text === 'A' || lower.includes('adjunct')) return 'A';
  if (text === 'I' || lower.includes('instructor')) return 'I';
  if (lower.includes('professor')) return 'Professor';
  if (text === 'O') return 'O';
  return text;
};

const normalizeAppointmentValue = (value) => {
  const text = `${value ?? ''}`.trim();
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();
  if (!text) return '';
  if (upper === 'TT' || lower.includes('tenure-track') || lower.includes('tenure track')) return 'TT';
  if (upper === 'T' || lower === 'tenured' || lower.includes('tenured')) return 'T';
  if (upper === 'OA' || lower.includes('other academic') || lower === 'other') return 'OA';
  return text;
};

const inferFtPtValue = (appointmentType, existingValue = '') => {
  const current = `${existingValue ?? ''}`.trim().toUpperCase();
  if (current === 'FT' || current === 'PT') return current;
  const text = `${appointmentType ?? ''}`.trim().toLowerCase();
  if (!text) return '';
  if (text === 'tt' || text === 't') return 'FT';
  if (text.includes('adjunct') || text.includes('part-time') || text.includes('part time')) return 'PT';
  if (text.includes('full-time') || text.includes('full time') || text.includes('tenure') || text.includes('track')) return 'FT';
  return '';
};

const extractYearFromTerm = (term, fallbackYear) => {
  const match = `${term ?? ''}`.match(/(19|20)\d{2}/);
  if (match) return match[0];
  return `${fallbackYear ?? ''}`.trim();
};

const buildCourseLabel = (course) => {
  const code = `${course?.code ?? ''}`.trim();
  const name = `${course?.name ?? ''}`.trim();
  const credits = Number(course?.credits || 0);
  const base = [code, name && name !== code ? name : ''].filter(Boolean).join(' - ');
  return credits > 0 ? `${base || code} (${credits} cr)` : (base || code);
};

const mergeQualificationRows = (existingRows = [], facultyOptions = [], facultyProfiles = {}) => {
  const existingByFacultyId = new Map(
    existingRows
      .filter((row) => Number(row?.faculty_id || 0) > 0)
      .map((row) => [Number(row.faculty_id), row])
  );
  const sidebarFacultyIds = new Set((facultyOptions || []).map((option) => Number(option?.faculty_id || 0)).filter((value) => value > 0));

  const syncedRows = (facultyOptions || []).map((option) => {
    const facultyId = Number(option?.faculty_id || 0);
    const existing = existingByFacultyId.get(facultyId) || {};
    const profile = facultyProfiles?.[facultyId] || {};
    const qualification = profile?.qualification || {};
    const certifications = Array.isArray(profile?.certifications) ? profile.certifications.filter(Boolean) : [];
    return qualificationRow({
      ...existing,
      faculty_id: facultyId,
      faculty_name: option?.full_name || existing?.faculty_name || '',
      highest_degree_field: `${existing?.highest_degree_field ?? ''}`.trim() || `${qualification?.degree_field ?? ''}`.trim(),
      highest_degree_year: `${existing?.highest_degree_year ?? ''}`.trim() || `${qualification?.degree_year ?? ''}`.trim(),
      academic_rank: normalizeRankValue(existing?.academic_rank || option?.academic_rank || ''),
      academic_appointment: normalizeAppointmentValue(`${existing?.academic_appointment ?? ''}`.trim() || `${option?.appointment_type ?? ''}`.trim()),
      full_time_or_part_time: inferFtPtValue(option?.appointment_type, existing?.full_time_or_part_time),
      years_gov_industry: `${existing?.years_gov_industry ?? ''}`.trim() || `${qualification?.years_industry_government ?? ''}`.trim(),
      years_teaching: `${existing?.years_teaching ?? ''}`.trim(),
      years_at_institution: `${existing?.years_at_institution ?? ''}`.trim() || `${qualification?.years_at_institution ?? ''}`.trim(),
      professional_registration: normalizeRegistrationText(`${existing?.professional_registration ?? ''}`.trim()) || certifications.flatMap((item) => extractProfileEntryTitles(item)).join(', '),
    });
  });

  const manualRows = (existingRows || [])
    .filter((row) => {
      const facultyId = Number(row?.faculty_id || 0);
      return facultyId <= 0 || !sidebarFacultyIds.has(facultyId);
    })
    .map((row) => qualificationRow(row));

  const mergedRows = [...syncedRows, ...manualRows];
  return mergedRows.length > 0 ? mergedRows : [qualificationRow()];
};

const mergeWorkloadRows = (existingRows = [], qualificationRows = [], courses = [], fallbackYear = '') => {
  const qualificationByFacultyId = new Map(
    (qualificationRows || [])
      .filter((row) => Number(row?.faculty_id || 0) > 0)
      .map((row) => [Number(row.faculty_id), row])
  );
  const existingByKey = new Map();
  (existingRows || []).forEach((row) => {
    const facultyId = Number(row?.faculty_id || 0);
    const courseId = Number(row?.course_id || 0);
    const term = `${row?.term ?? ''}`.trim();
    if (facultyId > 0 && courseId > 0) {
      existingByKey.set(`${facultyId}::${courseId}::${term}`, row);
    }
  });

  const syncedKeys = new Set();
  const syncedRows = [];
  (courses || []).forEach((course) => {
    const courseId = Number(course?.course_id || course?.id || 0);
    const courseLabel = buildCourseLabel(course);
    (Array.isArray(course?.sections) ? course.sections : []).forEach((section) => {
      const facultyId = Number(section?.faculty_id || 0);
      if (facultyId <= 0) return;
      const term = `${section?.term ?? ''}`.trim();
      const key = `${facultyId}::${courseId}::${term}`;
      syncedKeys.add(key);
      const existing = existingByKey.get(key) || {};
      const qualification = qualificationByFacultyId.get(facultyId) || {};
      syncedRows.push(workloadRow({
        ...existing,
        faculty_id: facultyId,
        faculty_name: section?.faculty_name || qualification?.faculty_name || existing?.faculty_name || '',
        fill_tie_or_part_time: `${existing?.fill_tie_or_part_time ?? ''}`.trim() || `${qualification?.full_time_or_part_time ?? ''}`.trim(),
        classes_taught_description: `${existing?.classes_taught_description ?? ''}`.trim() || courseLabel,
        term: term || `${existing?.term ?? ''}`.trim(),
        year: `${existing?.year ?? ''}`.trim() || extractYearFromTerm(term, fallbackYear),
        course_id: courseId,
      }));
    });
  });

  const manualRows = (existingRows || [])
    .filter((row) => {
      const facultyId = Number(row?.faculty_id || 0);
      const courseId = Number(row?.course_id || 0);
      const term = `${row?.term ?? ''}`.trim();
      if (facultyId > 0 && courseId > 0) {
        return !syncedKeys.has(`${facultyId}::${courseId}::${term}`);
      }
      return true;
    })
    .map((row) => workloadRow(row));

  const mergedRows = [...syncedRows, ...manualRows];
  return mergedRows.length > 0 ? mergedRows : [workloadRow()];
};

const groupWorkloadRowsForDisplay = (rows = []) => {
  const grouped = [];
  const groupedIndexByFaculty = new Map();

  (rows || []).forEach((row) => {
    const facultyId = Number(row?.faculty_id || 0);
    const facultyName = `${row?.faculty_name ?? ''}`.trim();
    const isSynced = facultyId > 0 && Number(row?.course_id || 0) > 0;
    const groupKey = isSynced ? `faculty:${facultyId || facultyName}` : `row:${row?.local_id || row?.faculty_workload_row_id || id('c6wg')}`;

    if (!isSynced || !groupedIndexByFaculty.has(groupKey)) {
      const line = `${row?.classes_taught_description ?? ''}`.trim();
      groupedIndexByFaculty.set(groupKey, grouped.length);
      grouped.push({
        key: groupKey,
        row,
        isGroupedSynced: isSynced,
        displayClasses: line,
        displayTerm: `${row?.term ?? ''}`.trim(),
        displayYear: `${row?.year ?? ''}`.trim(),
      });
      return;
    }

    const target = grouped[groupedIndexByFaculty.get(groupKey)];
    const line = [
      `${row?.classes_taught_description ?? ''}`.trim(),
      `${row?.term ?? ''}`.trim(),
      `${row?.year ?? ''}`.trim(),
    ].filter(Boolean).join(' - ');
    const currentLines = target.displayClasses ? target.displayClasses.split('\n').map((value) => value.trim()).filter(Boolean) : [];
    if (line && !currentLines.includes(line)) {
      target.displayClasses = [...currentLines, line].join('\n');
    }
    const termValue = `${row?.term ?? ''}`.trim();
    const yearValue = `${row?.year ?? ''}`.trim();
    if (termValue && target.displayTerm && target.displayTerm !== termValue) {
      target.displayTerm = 'Multiple';
    } else if (termValue && !target.displayTerm) {
      target.displayTerm = termValue;
    }
    if (yearValue && target.displayYear && target.displayYear !== yearValue) {
      target.displayYear = 'Multiple';
    } else if (yearValue && !target.displayYear) {
      target.displayYear = yearValue;
    }
  });

  return grouped;
};

const syncWorkloadRowsWithQualifications = (qualificationRows, existingWorkloadRows = []) => {
  if (!Array.isArray(qualificationRows) || qualificationRows.length === 0) {
    return [workloadRow()];
  }

  return qualificationRows.map((qualification, index) => {
    const existing = existingWorkloadRows[index] || {};
    return workloadRow({
      ...existing,
      faculty_id: qualification?.faculty_id ?? existing.faculty_id ?? '',
      faculty_name: qualification?.faculty_name ?? existing.faculty_name ?? '',
      fill_tie_or_part_time: `${existing.fill_tie_or_part_time ?? ''}`.trim() || `${qualification?.full_time_or_part_time ?? ''}`.trim(),
    });
  });
};

const box = { backgroundColor: 'white', borderRadius: '12px', padding: '22px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' };
const textAreaStyle = { width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' };

const AddRowButton = ({ label, onClick, disabled = false }) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isActive = hovered && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: 'white',
        color: colors.primary,
        border: `1px ${isActive ? 'solid' : 'dashed'} ${colors.primary}`,
        borderRadius: '8px',
        padding: '9px 12px',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        boxShadow: isActive ? '0 10px 22px rgba(25, 90, 170, 0.28)' : '0 3px 8px rgba(17, 24, 39, 0.1)',
        transform: disabled ? 'translateY(0)' : pressed ? 'translateY(0)' : (isActive ? 'translateY(-2px)' : 'translateY(0)'),
        transition: 'all 0.2s ease',
      }}
    >
      <Plus size={14} style={{ transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      {label}
    </button>
  );
};

const Criterion6Page = ({ onToggleSidebar, onBack }) => {
  const cycleId = localStorage.getItem('currentCycleId') || 1;
  const programId = localStorage.getItem('currentProgramId') || 1;
  const [data, setData] = useState({
    criterion6_id: null,
    faculty_composition_narrative: '',
    workload_expectations_desciption: '',
    faculty_size_adequacy_description: '',
    advising_and_student_interaction_description: '',
    service_and_industry_engagement_description: '',
    course_creation_role_description: '',
    peo_ro_role_description: '',
    leadership_roles_description: '',
    cycle: null,
    item: null,
  });
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [sidebarCourses, setSidebarCourses] = useState([]);
  const [facultyProfiles, setFacultyProfiles] = useState({});
  const [qualificationRows, setQualificationRows] = useState([qualificationRow()]);
  const [workloadRows, setWorkloadRows] = useState([workloadRow()]);
  const [pdRows, setPdRows] = useState([pdRow()]);
  const [visibleQualificationRows, setVisibleQualificationRows] = useState(ROW_BATCH_SIZE);
  const [visibleWorkloadRows, setVisibleWorkloadRows] = useState(ROW_BATCH_SIZE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const findFaculty = (facultyId) => facultyOptions.find((option) => Number(option?.faculty_id) === Number(facultyId));
  const isSidebarFacultyRow = (facultyId) => facultyOptions.some((option) => Number(option?.faculty_id || 0) === Number(facultyId || 0));
  const isSyncedWorkloadRow = (row) => Number(row?.faculty_id || 0) > 0 && Number(row?.course_id || 0) > 0;
  const currentAcademicYear = (() => {
    const cycleLabel = `${localStorage.getItem('currentCycleLabel') || ''}`;
    const match = cycleLabel.match(/(19|20)\d{2}/);
    return match ? match[0] : `${new Date().getFullYear()}`;
  })();

  const hydrate = (payload, sourceFacultyOptions = null, sourceCourses = null, sourceProfiles = null) => {
    const options = Array.isArray(sourceFacultyOptions)
      ? sourceFacultyOptions
      : (Array.isArray(payload?.faculty_options) ? payload.faculty_options : []);
    const courses = Array.isArray(sourceCourses) ? sourceCourses : sidebarCourses;
    const profiles = sourceProfiles && typeof sourceProfiles === 'object' ? sourceProfiles : facultyProfiles;
    setFacultyOptions(options);
    setData({
      criterion6_id: payload?.criterion6_id ?? null,
      faculty_composition_narrative: payload?.faculty_composition_narrative ?? '',
      workload_expectations_desciption: payload?.workload_expectations_desciption ?? payload?.faculty_worklaod_expectations_description ?? '',
      faculty_size_adequacy_description: payload?.faculty_size_adequacy_description ?? '',
      advising_and_student_interaction_description: payload?.advising_and_student_interaction_description ?? '',
      service_and_industry_engagement_description: payload?.service_and_industry_engagement_description ?? '',
      course_creation_role_description: payload?.course_creation_role_description ?? '',
      peo_ro_role_description: payload?.peo_ro_role_description ?? '',
      leadership_roles_description: payload?.leadership_roles_description ?? '',
      cycle: payload?.cycle ?? Number(cycleId),
      item: payload?.item ?? null,
    });

    const incomingW = Array.isArray(payload?.workload_rows) ? payload.workload_rows : [];
    const incomingQ = Array.isArray(payload?.qualification_rows) ? payload.qualification_rows : [];
    const resolvedQRows = (
      incomingQ.length > 0
        ? incomingQ.map((row) => qualificationRow(row))
        : (incomingW.length > 0
            ? incomingW.map((row) => qualificationRow({
                faculty_id: row?.faculty_id ?? '',
                faculty_name: row?.faculty_name ?? '',
              }))
            : [qualificationRow()])
    );
    const mergedQualificationRows = mergeQualificationRows(resolvedQRows, options, profiles);
    setQualificationRows(mergedQualificationRows);
    setWorkloadRows(mergeWorkloadRows(
      incomingW.map((row) => workloadRow(row)),
      mergedQualificationRows,
      courses,
      currentAcademicYear,
    ));
    setVisibleQualificationRows(ROW_BATCH_SIZE);
    setVisibleWorkloadRows(ROW_BATCH_SIZE);

    const incomingPd = Array.isArray(payload?.professional_development_rows) ? payload.professional_development_rows : [];
    const incomingByFaculty = new Map();
    incomingPd.forEach((row) => {
      const facultyId = toInt(row?.faculty_id, 0);
      if (facultyId <= 0) return;
      const decodedActivities = Array.isArray(row?.activities)
        ? row.activities.flatMap((value) => {
            const titles = extractProfileEntryTitles(value);
            return titles.length > 0 ? titles : [`${value ?? ''}`.trim()].filter(Boolean);
          })
        : [];
      incomingByFaculty.set(facultyId, pdRow({
        faculty_id: facultyId,
        faculty_name: row?.faculty_name ?? '',
        activities_text: decodedActivities.join('\n'),
      }));
    });
    const mergedPd = options.map((option) => {
      const facultyId = Number(option?.faculty_id || 0);
      return incomingByFaculty.get(facultyId) || pdRow({ faculty_id: facultyId, faculty_name: option.full_name || '' });
    });
    if (mergedPd.length > 0) {
      setPdRows(mergedPd);
    } else if (incomingPd.length > 0) {
      setPdRows(incomingPd.map((row) => pdRow({
        faculty_id: row?.faculty_id ?? '',
        faculty_name: row?.faculty_name ?? '',
        activities_text: (Array.isArray(row?.activities) ? row.activities : [])
          .flatMap((value) => {
            const titles = extractProfileEntryTitles(value);
            return titles.length > 0 ? titles : [`${value ?? ''}`.trim()].filter(Boolean);
          })
          .join('\n'),
      })));
    } else {
      setPdRows([pdRow()]);
    }
  };

  const loadSidebarContext = async () => {
    const resolvedProgramId = Number(programId || 0);
    if (!resolvedProgramId) {
      return { facultyRows: [], courseRows: [], profileMap: {} };
    }

    const [facultyRows, courseRows] = await Promise.all([
      apiRequest(`/programs/${resolvedProgramId}/faculty-members/`, { method: 'GET' }),
      apiRequest(`/programs/${resolvedProgramId}/courses/?cycle_id=${cycleId}`, { method: 'GET' }),
    ]);

    const normalizedFacultyRows = Array.isArray(facultyRows) ? facultyRows : [];
    const normalizedCourseRows = Array.isArray(courseRows) ? courseRows : [];
    const profileEntries = await Promise.all(
      normalizedFacultyRows.map(async (faculty) => {
        const facultyId = Number(faculty?.faculty_id || 0);
        if (facultyId <= 0) return [facultyId, null];
        try {
          const profile = await apiRequest(`/faculty-members/${facultyId}/profile/?cycle_id=${cycleId}`, { method: 'GET' });
          return [facultyId, profile];
        } catch (_error) {
          return [facultyId, null];
        }
      })
    );

    return {
      facultyRows: normalizedFacultyRows,
      courseRows: normalizedCourseRows,
      profileMap: Object.fromEntries(profileEntries.filter(([facultyId]) => facultyId > 0)),
    };
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [payload, sidebarContext] = await Promise.all([
          apiRequest(`/cycles/${cycleId}/criterion6/`, { method: 'GET' }),
          loadSidebarContext(),
        ]);
        if (!mounted) return;
        setSidebarCourses(sidebarContext.courseRows);
        setFacultyProfiles(sidebarContext.profileMap);
        hydrate(payload, sidebarContext.facultyRows, sidebarContext.courseRows, sidebarContext.profileMap);
        if (payload?.item) {
          const checklistItem = await apiRequest(`/checklist-items/${payload.item}/`, { method: 'GET' });
          if (!mounted) return;
          setIsComplete(Number(checklistItem?.status ?? 0) === 1 || Number(checklistItem?.completion_percentage ?? 0) >= 100);
        }
      } catch (error) {
        if (mounted) setSaveError(error?.message || 'Unable to load Criterion 6.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const handleSidebarDataUpdated = () => {
      load();
    };
    window.addEventListener('faculty-updated', handleSidebarDataUpdated);
    window.addEventListener('courses-updated', handleSidebarDataUpdated);
    return () => {
      mounted = false;
      window.removeEventListener('faculty-updated', handleSidebarDataUpdated);
      window.removeEventListener('courses-updated', handleSidebarDataUpdated);
    };
  }, [cycleId, programId]);

  const updateSection = (field) => (event) => setData((prev) => ({ ...prev, [field]: event.target.value }));
  const updateQualification = (index, field) => (event) => {
    const nextValue = event.target.value;
    setQualificationRows((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: nextValue } : row
    )));
  };
  const updateWorkload = (index, field) => (event) => setWorkloadRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: event.target.value } : row)));
  const updatePd = (index, field) => (event) => {
    const { value } = event.target;
    setPdRows((prev) => prev.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      if (field === 'faculty_id') {
        const selected = findFaculty(value);
        return { ...row, faculty_id: value, faculty_name: selected?.full_name || row.faculty_name || '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const addSyncedFacultyRow = () => {
    setQualificationRows((prevQualificationRows) => [...prevQualificationRows, qualificationRow()]);
  };

  const addWorkloadRow = () => setWorkloadRows((prev) => [...prev, workloadRow()]);

  const removeQualificationRow = (localId) => {
    setQualificationRows((prevQualificationRows) => (
      prevQualificationRows.length <= 1
        ? prevQualificationRows
        : prevQualificationRows.filter((row) => row.local_id !== localId)
    ));
  };

  const saveCriterion6 = async ({ markComplete = false } = {}) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError('');

      let checklistItemId = data.item;
      if (!checklistItemId) {
        const checklistResult = await apiRequest(`/cycles/${cycleId}/checklist/`, { method: 'GET' });
        checklistItemId = checklistResult?.items?.find((row) => Number(row?.criterion_number) === 6)?.item_id ?? null;
      }

      const normalizedQ = qualificationRows.map((row) => ({
        faculty_id: toInt(row.faculty_id, 0) || '',
        faculty_name: `${row.faculty_name ?? ''}`.trim(),
        highest_degree_field: `${row.highest_degree_field ?? ''}`.trim(),
        highest_degree_year: `${row.highest_degree_year ?? ''}`.trim(),
        academic_rank: `${row.academic_rank ?? ''}`.trim(),
        academic_appointment: `${row.academic_appointment ?? ''}`.trim(),
        full_time_or_part_time: `${row.full_time_or_part_time ?? ''}`.trim(),
        years_gov_industry: `${row.years_gov_industry ?? ''}`.trim(),
        years_teaching: `${row.years_teaching ?? ''}`.trim(),
        years_at_institution: `${row.years_at_institution ?? ''}`.trim(),
        professional_registration: `${row.professional_registration ?? ''}`.trim(),
      })).filter((row) => Object.values(row).some((value) => `${value}`.trim() !== ''));

      const normalizedW = workloadRows.map((row) => ({
        faculty_id: toInt(row.faculty_id, 0) || '',
        faculty_name: `${row.faculty_name ?? ''}`.trim(),
        fill_tie_or_part_time: `${row.fill_tie_or_part_time ?? ''}`.trim(),
        classes_taught_description: `${row.classes_taught_description ?? ''}`.trim(),
        term: `${row.term ?? ''}`.trim(),
        year: `${row.year ?? ''}`.trim(),
        course_id: `${row.course_id ?? ''}`.trim(),
      })).filter((row) => Object.values(row).some((value) => `${value}`.trim() !== ''));

      const normalizedPd = pdRows.map((row) => ({
        faculty_id: toInt(row.faculty_id, 0),
        activities: splitActivities(row.activities_text),
        activities_text: `${row.activities_text ?? ''}`.trim(),
      })).filter((row) => row.faculty_id > 0);

      const payload = {
        faculty_composition_narrative: data.faculty_composition_narrative,
        workload_expectations_desciption: data.workload_expectations_desciption,
        faculty_worklaod_expectations_description: data.workload_expectations_desciption,
        faculty_size_adequacy_description: data.faculty_size_adequacy_description,
        advising_and_student_interaction_description: data.advising_and_student_interaction_description,
        service_and_industry_engagement_description: data.service_and_industry_engagement_description,
        course_creation_role_description: data.course_creation_role_description,
        peo_ro_role_description: data.peo_ro_role_description,
        leadership_roles_description: data.leadership_roles_description,
        qualification_rows: normalizedQ,
        workload_rows: normalizedW,
        professional_development_rows: normalizedPd,
      };

      const result = await apiRequest(`/cycles/${cycleId}/criterion6/`, { method: 'PUT', body: JSON.stringify(payload) });
      hydrate(result, facultyOptions, sidebarCourses, facultyProfiles);

      const completion = markComplete ? 100 : calculateCompletion(payload, { qualificationRows: normalizedQ, workloadRows: normalizedW, pdRows: normalizedPd });
      const resolvedItemId = result?.item ?? checklistItemId;
      if (resolvedItemId) {
        const checklistItem = await apiRequest(`/checklist-items/${resolvedItemId}/`, { method: 'GET' });
        await apiRequest(`/checklist-items/${resolvedItemId}/`, {
          method: 'PUT',
          body: JSON.stringify({ ...checklistItem, status: completion >= 100 ? 1 : 0, completion_percentage: completion }),
        });
      }

      setData((prev) => ({ ...prev, criterion6_id: result?.criterion6_id ?? prev.criterion6_id, item: resolvedItemId ?? prev.item }));
      setIsComplete(completion >= 100);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      localStorage.setItem('checklistNeedsRefresh', 'true');
    } catch (error) {
      setSaveError(error?.message || 'Unable to save Criterion 6.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: colors.mediumGray, fontFamily: fontStack }}>Loading Criterion 6 data...</div>;
  }

  const displayedQualificationRows = qualificationRows.slice(0, visibleQualificationRows);
  const groupedWorkloadRows = groupWorkloadRowsForDisplay(workloadRows);
  const displayedWorkloadRows = groupedWorkloadRows.slice(0, visibleWorkloadRows);
  const canViewMoreQualifications = qualificationRows.length > displayedQualificationRows.length;
  const canViewMoreWorkload = groupedWorkloadRows.length > displayedWorkloadRows.length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 6 - Faculty" subtitle={getActiveContext().subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />
      <div style={{ padding: '48px', maxWidth: '1500px', margin: '0 auto' }}>
        <div style={{ ...box, borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800' }}>Faculty Qualifications, Workload, and Roles</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Document faculty credentials, workload, size, professional development, and governance responsibilities.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => saveCriterion6()} disabled={saving} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}><Save size={15} />{saving ? 'Saving...' : 'Save Draft'}</button>
            </div>
          </div>
          {saveSuccess ? <div style={{ marginTop: '10px', fontSize: '13px', color: '#155724' }}>Criterion 6 saved successfully.</div> : null}
          {saveError ? <div style={{ marginTop: '10px', fontSize: '13px', color: '#721c24' }}>{saveError}</div> : null}
        </div>

        <div style={box}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A Faculty Qualifications</h3>
          <p style={{ color: colors.mediumGray, margin: '6px 0 12px 0', fontSize: '14px' }}>Describe faculty credentials and coverage of curricular areas. Complete Table 6-1 below and include resumes in Appendix B.</p>
          <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '6px' }}>
            Rank codes: Professor, ASC (Associate Professor), AST (Assistant Professor), I (Instructor), A (Adjunct), O (Other).
          </div>
          <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>
            Appointment codes: TT = Tenure-Track, T = Tenured, OA = Other Academic Appointment.
          </div>
          <textarea value={data.faculty_composition_narrative} onChange={updateSection('faculty_composition_narrative')} placeholder="Narrative on faculty composition, size, credentials, and experience adequacy for the curriculum and program criteria." style={{ ...textAreaStyle, minHeight: '130px' }} />
          <div style={{ marginTop: '12px', overflowX: 'auto' }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '8px', fontSize: '14px' }}>Table 6-1. Faculty Qualifications</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: colors.lightGray }}>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Faculty Name</th>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Highest Degree Earned (Field and Year)</th>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Rank</th>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Academic Appointment (TT / T / OA)</th>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>FT / PT</th>
                  <th colSpan={3} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'center' }}>Years of Experience</th>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Professional Registration / Certification</th>
                  <th rowSpan={2} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Action</th>
                </tr>
                <tr style={{ backgroundColor: '#f6f7fb' }}>
                  <th style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Govt / Industry Practice</th>
                  <th style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>Teaching</th>
                  <th style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>This Institution</th>
                </tr>
              </thead>
              <tbody>
                {displayedQualificationRows.map((row, index) => (
                  <tr key={row.faculty_qualification_row_id || row.local_id}>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '190px' }}>
                      <input
                        value={row.faculty_name}
                        onChange={updateQualification(index, 'faculty_name')}
                        readOnly={isSidebarFacultyRow(row.faculty_id)}
                        placeholder={isSidebarFacultyRow(row.faculty_id) ? 'Synced from Faculty sidebar' : 'e.g., Dr. Lina Saab'}
                        style={{ ...inputStyle, backgroundColor: isSidebarFacultyRow(row.faculty_id) ? '#f9fafb' : 'white' }}
                      />
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '190px' }}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <input value={row.highest_degree_field} onChange={updateQualification(index, 'highest_degree_field')} placeholder="e.g., PhD Electrical Engineering" style={inputStyle} />
                        <input value={row.highest_degree_year} onChange={updateQualification(index, 'highest_degree_year')} placeholder="e.g., 2016" style={inputStyle} />
                      </div>
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '180px' }}>
                      <select value={row.academic_rank} onChange={updateQualification(index, 'academic_rank')} style={inputStyle}>
                        <option value="">Select rank</option>
                        {RANK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px' }}>
                      <select value={row.academic_appointment} onChange={updateQualification(index, 'academic_appointment')} style={{ ...inputStyle, backgroundColor: 'white' }}>
                        <option value="">Select appointment</option>
                        {APPOINTMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '100px' }}>
                      <select value={row.full_time_or_part_time} onChange={updateQualification(index, 'full_time_or_part_time')} style={inputStyle}>
                        <option value="">Select</option>
                        {FT_PT_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px' }}><input type="number" min="0" value={row.years_gov_industry} onChange={updateQualification(index, 'years_gov_industry')} placeholder="Years" style={inputStyle} /></td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px' }}><input type="number" min="0" value={row.years_teaching} onChange={updateQualification(index, 'years_teaching')} placeholder="Years" style={inputStyle} /></td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px' }}><input type="number" min="0" value={row.years_at_institution} onChange={updateQualification(index, 'years_at_institution')} placeholder="Years" style={inputStyle} /></td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px' }}><input value={row.professional_registration} onChange={updateQualification(index, 'professional_registration')} placeholder="e.g., PE, PMP, CCNA" style={inputStyle} /></td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '90px' }}>
                      <button
                        type="button"
                        onClick={() => removeQualificationRow(row.local_id)}
                        disabled={qualificationRows.length <= 1 || isSidebarFacultyRow(row.faculty_id)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: 'white',
                          color: colors.mediumGray,
                          fontWeight: '700',
                          cursor: qualificationRows.length <= 1 || isSidebarFacultyRow(row.faculty_id) ? 'not-allowed' : 'pointer',
                          opacity: qualificationRows.length <= 1 || isSidebarFacultyRow(row.faculty_id) ? 0.6 : 1,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canViewMoreQualifications ? (
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setVisibleQualificationRows((prev) => prev + ROW_BATCH_SIZE)}
                style={{
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(17, 24, 39, 0.08)',
                }}
              >
                View More
              </button>
            </div>
          ) : null}
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <AddRowButton label="Add Faculty Row" onClick={addSyncedFacultyRow} />
          </div>
        </div>

        <div style={box}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Faculty Workload</h3>
          <p style={{ color: colors.mediumGray, margin: '6px 0 12px 0', fontSize: '14px' }}>Complete Table 6-2 and describe workload expectations.</p>
          <textarea value={data.workload_expectations_desciption} onChange={updateSection('workload_expectations_desciption')} placeholder="Describe workload expectations (teaching, research, service) and how assignments are balanced." style={{ ...textAreaStyle, minHeight: '110px' }} />
          <div style={{ marginTop: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ backgroundColor: colors.lightGray }}>{['Faculty', 'PT/FT', 'Classes Taught + Term/Year'].map((h) => <th key={h} style={{ border: `1px solid ${colors.border}`, padding: '8px', textAlign: 'left' }}>{h}</th>)}</tr></thead>
              <tbody>
                {displayedWorkloadRows.map(({ key, row, isGroupedSynced, displayClasses, displayTerm, displayYear }) => {
                  const rowIndex = workloadRows.findIndex((workloadRowItem) => workloadRowItem.local_id === row.local_id);
                  return (
                  <tr key={key}>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '190px' }}>
                      <input
                        value={row.faculty_name}
                        readOnly={isGroupedSynced || isSyncedWorkloadRow(row)}
                        onChange={rowIndex >= 0 ? updateWorkload(rowIndex, 'faculty_name') : undefined}
                        placeholder={isGroupedSynced || isSyncedWorkloadRow(row) ? 'Synced from Courses sidebar' : 'Faculty name'}
                        style={{ ...inputStyle, backgroundColor: isGroupedSynced || isSyncedWorkloadRow(row) ? '#f9fafb' : 'white' }}
                      />
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '110px' }}>
                      <select value={row.fill_tie_or_part_time} onChange={rowIndex >= 0 ? updateWorkload(rowIndex, 'fill_tie_or_part_time') : undefined} style={inputStyle}>
                        <option value="">Select</option>
                        {FT_PT_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </td>
                    <td style={{ border: `1px solid ${colors.border}`, padding: '8px', minWidth: '280px' }}>
                      <textarea value={isGroupedSynced ? displayClasses : row.classes_taught_description} readOnly={isGroupedSynced || isSyncedWorkloadRow(row)} onChange={rowIndex >= 0 ? updateWorkload(rowIndex, 'classes_taught_description') : undefined} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', backgroundColor: isGroupedSynced || isSyncedWorkloadRow(row) ? '#f9fafb' : 'white' }} />
                      {isGroupedSynced ? (
                        <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 130px', gap: '6px' }}>
                          <input value={displayTerm} readOnly placeholder="Term" style={{ ...inputStyle, backgroundColor: '#f9fafb' }} />
                          <input value={displayYear} readOnly placeholder="Year" style={{ ...inputStyle, backgroundColor: '#f9fafb' }} />
                        </div>
                      ) : (
                        <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 130px', gap: '6px' }}>
                          <input value={row.term} readOnly={isSyncedWorkloadRow(row)} onChange={rowIndex >= 0 ? updateWorkload(rowIndex, 'term') : undefined} placeholder="Term" style={{ ...inputStyle, backgroundColor: isSyncedWorkloadRow(row) ? '#f9fafb' : 'white' }} />
                          <input value={row.year} readOnly={isSyncedWorkloadRow(row)} onChange={rowIndex >= 0 ? updateWorkload(rowIndex, 'year') : undefined} placeholder="Year" style={{ ...inputStyle, backgroundColor: isSyncedWorkloadRow(row) ? '#f9fafb' : 'white' }} />
                        </div>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          {canViewMoreWorkload ? (
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setVisibleWorkloadRows((prev) => prev + ROW_BATCH_SIZE)}
                style={{
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(17, 24, 39, 0.08)',
                }}
              >
                View More (5)
              </button>
            </div>
          ) : null}
          <div style={{ marginTop: '10px' }}>
            <AddRowButton label="Add Workload Row" onClick={addWorkloadRow} />
          </div>
        </div>

        <div style={box}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Faculty Size</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <textarea value={data.faculty_size_adequacy_description} onChange={updateSection('faculty_size_adequacy_description')} placeholder="Adequacy of faculty size for curriculum delivery" style={textAreaStyle} />
            <textarea value={data.advising_and_student_interaction_description} onChange={updateSection('advising_and_student_interaction_description')} placeholder="Faculty involvement in advising/counseling/student interaction" style={textAreaStyle} />
            <textarea value={data.service_and_industry_engagement_description} onChange={updateSection('service_and_industry_engagement_description')} placeholder="Service and engagement with industry/professional practitioners" style={textAreaStyle} />
          </div>
        </div>

        <div style={box}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Professional Development</h3>
          <p style={{ color: colors.mediumGray, margin: '6px 0 10px 0', fontSize: '14px' }}>Provide detailed descriptions of professional development activities for each faculty member.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {pdRows.map((row, index) => (
              <div key={row.local_id} style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: colors.lightGray, padding: '10px' }}>
                <select value={row.faculty_id} onChange={updatePd(index, 'faculty_id')} style={inputStyle}>
                  <option value="">Select faculty</option>
                  {row.faculty_id && !findFaculty(row.faculty_id) ? <option value={row.faculty_id}>{row.faculty_name || `Faculty #${row.faculty_id}`}</option> : null}
                  {facultyOptions.map((option) => <option key={option.faculty_id} value={option.faculty_id}>{option.full_name}</option>)}
                </select>
                <div style={{ fontSize: '12px', color: colors.mediumGray, margin: '6px 0' }}>{findFaculty(row.faculty_id)?.full_name || row.faculty_name || ''}</div>
                <textarea value={row.activities_text} onChange={updatePd(index, 'activities_text')} placeholder="One activity per line" style={{ ...textAreaStyle, minHeight: '100px', fontSize: '13px' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px' }}>
            <AddRowButton label="Add PD Entry" onClick={() => setPdRows((prev) => [...prev, pdRow()])} />
          </div>
        </div>

        <div style={box}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Authority and Responsibility of Faculty</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <textarea value={data.course_creation_role_description} onChange={updateSection('course_creation_role_description')} placeholder="Role of faculty in course creation, modification, and evaluation" style={textAreaStyle} />
            <textarea value={data.peo_ro_role_description} onChange={updateSection('peo_ro_role_description')} placeholder="Role of faculty in PEO/SO definition and attainment processes" style={textAreaStyle} />
            <textarea value={data.leadership_roles_description} onChange={updateSection('leadership_roles_description')} placeholder="Roles of dean/provost/other leadership in these areas" style={textAreaStyle} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Criterion6Page;
