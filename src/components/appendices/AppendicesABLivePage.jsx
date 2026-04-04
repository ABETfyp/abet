import React, { useEffect, useState } from 'react';
import { Database, FileText } from 'lucide-react';
import GlobalHeader from '../layout/GlobalHeader';
import { colors, fontStack } from '../../styles/theme';
import { apiRequest } from '../../utils/api';
import { getActiveContext } from '../../utils/activeContext';

const hasText = (v) => `${v ?? ''}`.trim() !== '';
const toLines = (v) => `${v || ''}`.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
const PROFILE_ENTRY_PREFIX = '__ABET_ENTRY__';
const emptyProfileEntry = () => ({
  title: '',
  description: '',
  month: '',
  year: '',
  from_month: '',
  from_year: '',
  to_month: '',
  to_year: ''
});
const parseProfileEntry = (rawValue) => {
  const text = `${rawValue ?? ''}`.trim();
  if (!text) return emptyProfileEntry();
  if (text.startsWith(PROFILE_ENTRY_PREFIX)) {
    try {
      const parsed = JSON.parse(text.slice(PROFILE_ENTRY_PREFIX.length));
      return {
        title: `${parsed?.title ?? ''}`.trim(),
        description: `${parsed?.description ?? ''}`.trim(),
        month: `${parsed?.month ?? ''}`.trim(),
        year: `${parsed?.year ?? ''}`.replace(/\D/g, '').slice(0, 4),
        from_month: `${parsed?.from_month ?? ''}`.trim(),
        from_year: `${parsed?.from_year ?? ''}`.replace(/\D/g, '').slice(0, 4),
        to_month: `${parsed?.to_month ?? ''}`.trim(),
        to_year: `${parsed?.to_year ?? ''}`.replace(/\D/g, '').slice(0, 4),
      };
    } catch (error) {
      // fall through to legacy parsing
    }
  }

  const matched = text.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
  const title = `${matched?.[1] || text}`.trim();
  const suffix = `${matched?.[2] || ''}`.trim();
  let month = '';
  let year = '';
  const yearOnly = suffix.match(/^(\d{4})$/);
  const monthYear = suffix.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (yearOnly) year = yearOnly[1];
  if (monthYear) {
    month = monthYear[1];
    year = monthYear[2];
  }
  return { title, description: '', month, year, from_month: '', from_year: '', to_month: '', to_year: '' };
};
const parseProfileEntries = (rows) => (Array.isArray(rows) ? rows : [])
  .map((row) => parseProfileEntry(row))
  .filter((row) => hasText(row.title) || hasText(row.description) || hasText(row.month) || hasText(row.year));
const hasProfileRows = (rows) => parseProfileEntries(rows).length > 0;
const entryDate = (row) => [row?.month, row?.year].filter((v) => hasText(v)).join(' ');
const entryDateRange = (row) => {
  const fromDate = [row?.from_month, row?.from_year].filter((v) => hasText(v)).join(' ');
  const toDate = [row?.to_month, row?.to_year].filter((v) => hasText(v)).join(' ');
  if (fromDate && toDate) return `${fromDate}-${toDate}`;
  if (fromDate) return `${fromDate}-Present`;
  if (toDate) return toDate;
  return entryDate(row);
};
const parseWeekRows = (v) => toLines(v).map((line, index) => {
  const m = line.match(/^week\s*([0-9]+)\s*[:\-]\s*(.+)$/i);
  if (m) return { week: m[1], topic: m[2].trim() };
  return { week: String(index + 1), topic: line };
});
const courseCodes = (rows) => (Array.isArray(rows) ? rows : [])
  .map((row) => `${row?.course_code || ''}`.trim().toUpperCase())
  .filter(Boolean);
const textbookRows = (rows) => (Array.isArray(rows) ? rows : [])
  .map((row) => ({
    title: `${row?.title_author_year || ''}`.trim(),
    attribute: `${row?.attribute || ''}`.trim(),
  }))
  .filter((row) => row.title);
const supplementRows = (rows) => (Array.isArray(rows) ? rows : [])
  .map((row) => `${row?.material_discription || ''}`.trim())
  .filter(Boolean);
const courseIdOf = (course) => Number(course?.course_id || course?.id || 0);
const sectionEntriesOf = (course) => (Array.isArray(course?.sections) ? course.sections : [])
  .filter((section) => Number(section?.syllabus_id || 0) > 0);
const sectionDisplayLabel = (section) => {
  const term = `${section?.term || ''}`.trim() || 'TBD';
  const faculty = `${section?.faculty_name || ''}`.trim() || 'Unassigned instructor';
  return `${term} - ${faculty}`;
};

const commonMeta = (course) => {
  const sections = sectionEntriesOf(course);
  if (sections.length === 0) return { state: 'none', syllabusId: 0, section: null, sections: [] };
  if (sections.length === 1) {
    return {
      state: 'single',
      syllabusId: Number(sections[0]?.syllabus_id || 0),
      section: sections[0] || null,
      sections,
    };
  }
  return {
    state: 'shared',
    syllabusId: Number(sections[0]?.syllabus_id || 0),
    section: sections[0] || null,
    sections,
  };
};

const cvReady = (faculty, profile) => {
  const q = profile?.qualification || {};
  return (
    hasText(q.degree_field) ||
    hasText(q.degree_institution) ||
    hasText(q.degree_year) ||
    hasText(q.years_industry_government) ||
    hasText(q.years_at_institution) ||
    hasProfileRows(profile?.certifications) ||
    hasProfileRows(profile?.memberships) ||
    hasProfileRows(profile?.development_activities) ||
    hasProfileRows(profile?.industry_experience) ||
    hasProfileRows(profile?.honors) ||
    hasProfileRows(profile?.services) ||
    hasProfileRows(profile?.publications) ||
    hasText(faculty?.office_hours)
  );
};

const pageCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  border: `1px solid ${colors.border}`,
};

const docFrameStyle = {
  border: '1px solid #d2d8df',
  borderRadius: '10px',
  overflow: 'hidden',
  backgroundColor: 'white',
  fontFamily: "'Georgia', 'Times New Roman', serif",
};

const docHeaderStyle = {
  borderBottom: '1px solid #d8dee5',
  background: 'linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%)',
  padding: '12px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '8px',
};

const secTitleStyle = {
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#667085',
  borderBottom: '1px solid #d8dee5',
  paddingBottom: '4px',
  marginBottom: '8px',
};

const renderProfileEntryRows = (entries, emptyText, options = {}) => {
  const datePlacement = options?.datePlacement || 'right';
  const useRangeDate = options?.useRangeDate === true;
  if (!entries.length) {
    return <div style={{ fontSize: '13px', color: '#475467', lineHeight: 1.55 }}>{emptyText}</div>;
  }
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {entries.map((entry, index) => (
        <div key={`entry-row-${index}`} style={{ borderBottom: index < entries.length - 1 ? '1px solid #e5e7eb' : 'none', paddingBottom: index < entries.length - 1 ? '12px' : 0 }}>
          {datePlacement === 'left' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: '12px', alignItems: 'start' }}>
              <div style={{ fontSize: '12px', color: '#667085', fontWeight: '600', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                {(useRangeDate ? entryDateRange(entry) : entryDate(entry)) || '-'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{entry.title || 'Untitled entry'}</div>
                {hasText(entry.description) ? (
                  <div style={{ marginTop: '5px', fontSize: '13px', fontWeight: '400', color: '#374151', lineHeight: 1.65 }}>{entry.description}</div>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{entry.title || 'Untitled entry'}</div>
                <div style={{ fontSize: '12px', color: '#667085', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {(useRangeDate ? entryDateRange(entry) : entryDate(entry)) || '-'}
                </div>
              </div>
              {hasText(entry.description) ? (
                <div style={{ marginTop: '5px', fontSize: '13px', fontWeight: '400', color: '#374151', lineHeight: 1.65 }}>{entry.description}</div>
              ) : null}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

const AppendicesABLivePage = ({ setCurrentPage, onToggleSidebar, onBack }) => {
  const { subtitle } = getActiveContext();
  const cycleId = Number(localStorage.getItem('currentCycleId') || 1);
  const [programId, setProgramId] = useState(Number(localStorage.getItem('currentProgramId') || 0) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coursesData, setCoursesData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [syllabusByCourse, setSyllabusByCourse] = useState({});
  const [profilesByFaculty, setProfilesByFaculty] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);

  const resolveProgramId = async () => {
    const stored = Number(localStorage.getItem('currentProgramId') || 0) || null;
    if (stored) {
      setProgramId(stored);
      return stored;
    }
    const cycle = await apiRequest(`/accreditation-cycles/${cycleId}/`, { method: 'GET' });
    const resolved = Number(cycle?.program || 0) || null;
    if (resolved) {
      localStorage.setItem('currentProgramId', String(resolved));
      setProgramId(resolved);
    }
    return resolved;
  };

  useEffect(() => {
    const refresh = () => setRefreshTick((n) => n + 1);
    window.addEventListener('courses-updated', refresh);
    window.addEventListener('faculty-updated', refresh);
    return () => {
      window.removeEventListener('courses-updated', refresh);
      window.removeEventListener('faculty-updated', refresh);
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const pid = programId || (await resolveProgramId());
        if (!pid) throw new Error('No program selected.');

        const [courses, faculty] = await Promise.all([
          apiRequest(`/programs/${pid}/courses/?cycle_id=${cycleId}`, { method: 'GET' }),
          apiRequest(`/programs/${pid}/faculty-members/`, { method: 'GET' }),
        ]);
        if (!mounted) return;

        const cRows = Array.isArray(courses) ? courses : [];
        const fRows = Array.isArray(faculty) ? faculty : [];
        setCoursesData(cRows);
        setFacultyData(fRows);

        const syllState = {};
        const syllJobs = [];
        cRows.forEach((course) => {
          const id = courseIdOf(course);
          const meta = commonMeta(course);
          if (!id) return;
          if (meta.state === 'none') syllState[id] = { status: 'none', meta };
          else if (meta.syllabusId > 0) {
            syllJobs.push({
              id,
              meta,
              p: apiRequest(`/programs/${pid}/courses/${id}/sections/${meta.syllabusId}/syllabus/?cycle_id=${cycleId}`, { method: 'GET' }),
            });
          }
        });
        const syllResults = await Promise.allSettled(syllJobs.map((j) => j.p));
        syllResults.forEach((r, i) => {
          const job = syllJobs[i];
          syllState[job.id] = r.status === 'fulfilled'
            ? { status: 'ready', data: r.value, meta: job.meta }
            : { status: 'error', error: r.reason?.message || 'Unable to load preview.', meta: job.meta };
        });
        if (!mounted) return;
        setSyllabusByCourse(syllState);

        const profState = {};
        const profJobs = [];
        fRows.forEach((f) => {
          const id = Number(f?.faculty_id || f?.id || 0);
          if (!id) return;
          profJobs.push({ id, p: apiRequest(`/faculty-members/${id}/profile/?cycle_id=${cycleId}`, { method: 'GET' }) });
        });
        const profResults = await Promise.allSettled(profJobs.map((j) => j.p));
        profResults.forEach((r, i) => {
          const job = profJobs[i];
          profState[job.id] = r.status === 'fulfilled'
            ? { status: 'ready', data: r.value }
            : { status: 'error', error: r.reason?.message || 'Unable to load profile.' };
        });
        if (!mounted) return;
        setProfilesByFaculty(profState);
      } catch (e) {
        if (!mounted) return;
        setCoursesData([]);
        setFacultyData([]);
        setSyllabusByCourse({});
        setProfilesByFaculty({});
        setError(e?.message || 'Unable to load Appendix A/B.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [cycleId, programId, refreshTick]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Appendices A & B" subtitle={subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ ...pageCardStyle, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Appendix Dashboard</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
                Appendix A and B are synced from courses, sections, and faculty profiles.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentPage('appendixC')} style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={16} />Appendix C - Equipment</button>
              <button onClick={() => setCurrentPage('appendixD')} style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} />Appendix D - Institutional Summary</button>
            </div>
          </div>
        </div>

        {error ? <div style={{ backgroundColor: '#fff1f2', color: '#b42318', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', fontWeight: '700' }}>{error}</div> : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: '16px' }}>
          <div style={pageCardStyle}>
            <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix A - Course Syllabi</h3>
            <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>
              One syllabus is shown per course. When a course has multiple sections, the shared course syllabus is displayed once with the related sections and instructors listed together.
            </p>
            <div style={{ marginTop: '12px', display: 'grid', gap: '12px', maxHeight: '68vh', overflowY: 'auto', paddingRight: '4px' }}>
              {!loading && coursesData.length === 0 ? <div style={{ border: `1px dashed ${colors.border}`, borderRadius: '10px', padding: '14px', color: colors.mediumGray, fontSize: '13px' }}>No courses yet.</div> : null}
              {coursesData.map((course) => {
                const id = courseIdOf(course);
                const meta = commonMeta(course);
                const state = syllabusByCourse[id];
                const tag = meta.state === 'single' ? 'Single-section syllabus' : meta.state === 'shared' ? 'Shared course syllabus' : 'No section';
                const code = course?.code || course?.course_code || 'Course';
                const name = hasText(course?.name) ? ` - ${course.name}` : '';
                return (
                  <div key={id || code} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px', backgroundColor: colors.lightGray }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: colors.darkGray }}>{`${code}${name}`}</div>
                        <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{`${Number(course?.credits || 0)} credits - ${Number(course?.contact_hours || 0)} hours - ${course?.course_type || 'Required'}`}</div>
                      </div>
                      <span style={{ border: `1px solid ${colors.border}`, borderRadius: '999px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', backgroundColor: 'white' }}>{tag}</span>
                    </div>

                    <div style={{ marginTop: '10px', ...docFrameStyle }}>
                      <div style={docHeaderStyle}>
                        <div style={{ fontSize: '17px', fontWeight: '700', color: '#1f2937' }}>{code} Course Syllabus</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Appendix A</div>
                      </div>

                      {loading && !state ? <div style={{ padding: '10px', fontSize: '13px', color: colors.mediumGray }}>Loading...</div> : null}
                      {state?.status === 'none' ? <div style={{ padding: '10px', fontSize: '13px', color: colors.mediumGray }}>No section syllabus found.</div> : null}
                      {state?.status === 'error' ? <div style={{ margin: '12px', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#b42318', border: '1px solid #fecdd3', backgroundColor: '#fff1f2' }}>{state.error}</div> : null}

                      {state?.status === 'ready' ? (() => {
                        const payload = state.data || {};
                        const syllabus = payload?.syllabus || {};
                        const section = payload?.section || {};
                        const clos = Array.isArray(payload.available_clos) ? payload.available_clos : [];
                        const sos = Array.isArray(payload.available_sos) ? payload.available_sos : [];
                        const assessments = Array.isArray(syllabus.assessments) ? syllabus.assessments : [];
                        const weekRows = parseWeekRows(syllabus.weekly_topics);
                        const prereqs = courseCodes(syllabus.prerequisites);
                        const coreqs = courseCodes(syllabus.corequisites);
                        const textbooks = textbookRows(syllabus.textbooks);
                        const supplements = supplementRows(syllabus.supplements);
                        const toolText = `${syllabus.software_or_labs_tools_used || ''}`.trim();
                        const relatedSections = Array.isArray(meta?.sections) ? meta.sections : [];
                        return (
                          <div style={{ padding: '14px 16px', display: 'grid', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
                            {relatedSections.length > 1 ? (
                              <div>
                                <div style={secTitleStyle}>Covered Sections and Instructors</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {relatedSections.map((item) => (
                                    <span
                                      key={`section-chip-${item.syllabus_id}`}
                                      style={{
                                        border: '1px solid #dbe2ea',
                                        backgroundColor: '#f8fafc',
                                        color: '#344054',
                                        borderRadius: '999px',
                                        padding: '6px 10px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                      }}
                                    >
                                      {sectionDisplayLabel(item)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px', color: '#475467' }}>
                                <div>Instructor: <span style={{ fontWeight: '700', color: '#111827' }}>{section?.faculty_name || meta?.section?.faculty_name || '-'}</span></div>
                                <div>Term: <span style={{ fontWeight: '700', color: '#111827' }}>{section?.term || meta?.section?.term || '-'}</span></div>
                              </div>
                            )}

                            <div>
                              <div style={secTitleStyle}>Catalog Description</div>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55 }}>{hasText(syllabus.catalog_description) ? syllabus.catalog_description : 'No catalog description entered.'}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div style={{ border: '1px solid #dbe2ea', borderRadius: '8px', padding: '10px' }}>
                                <div style={secTitleStyle}>CLO List</div>
                                <div style={{ fontSize: '12px', color: '#1f2937', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{clos.length ? clos.map((clo) => `${clo.display_code || clo.clo_code || `CLO-${clo.clo_id}`}: ${clo.description || '-'}`).join('\n') : 'No CLOs available.'}</div>
                              </div>
                              <div style={{ border: '1px solid #dbe2ea', borderRadius: '8px', padding: '10px' }}>
                                <div style={secTitleStyle}>SO List</div>
                                <div style={{ fontSize: '12px', color: '#1f2937', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sos.length ? sos.map((so) => `${so.display_code || so.so_code || `SO-${so.so_id}`}: ${so.so_discription || so.description || '-'}`).join('\n') : 'No SOs available.'}</div>
                              </div>
                            </div>

                            <div>
                              <div style={secTitleStyle}>Weekly Topics</div>
                              {weekRows.length ? (
                                <div style={{ border: '1px solid #dbe2ea', borderRadius: '8px', overflow: 'hidden' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', backgroundColor: '#f8fafc', borderBottom: '1px solid #dbe2ea', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    <span>Week</span>
                                    <span>Topic</span>
                                  </div>
                                  <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                    {weekRows.map((row, idx) => (
                                      <div key={`wk-${idx}`} style={{ display: 'grid', gridTemplateColumns: '96px 1fr', borderBottom: idx < weekRows.length - 1 ? '1px solid #edf2f7' : 'none', padding: '7px 10px', fontSize: '12px', color: '#1f2937' }}>
                                        <span style={{ fontWeight: '700' }}>{row.week || idx + 1}</span>
                                        <span>{row.topic || '-'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.5 }}>No weekly topics entered.</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <div style={secTitleStyle}>Prerequisites</div>
                                <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55 }}>{prereqs.length ? prereqs.join(', ') : 'None listed.'}</div>
                              </div>
                              <div>
                                <div style={secTitleStyle}>Corequisites</div>
                                <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55 }}>{coreqs.length ? coreqs.join(', ') : 'None listed.'}</div>
                              </div>
                            </div>

                            <div>
                              <div style={secTitleStyle}>Software / Lab Tools</div>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55 }}>{toolText || 'No tools listed.'}</div>
                            </div>

                            <div>
                              <div style={secTitleStyle}>Textbooks</div>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                                {textbooks.length
                                  ? textbooks.map((row) => `${row.title}${row.attribute ? ` (${row.attribute})` : ''}`).join('\n')
                                  : 'No textbooks listed.'}
                              </div>
                            </div>

                            <div>
                              <div style={secTitleStyle}>Supplemental Materials</div>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                                {supplements.length ? supplements.join('\n') : 'No supplemental materials listed.'}
                              </div>
                            </div>

                            <div>
                              <div style={secTitleStyle}>Assessment Plan</div>
                              <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: 1.5 }}>{assessments.length ? assessments.map((a) => `${a.assessment_type || '-'} (${Number(a.weight_percentage || 0)}%)`).join(', ') : 'No assessments entered.'}</div>
                            </div>
                          </div>
                        );
                      })() : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={pageCardStyle}>
            <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix B - Faculty Vitae</h3>
            <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>
              Faculty vitae previews are presented in structured CV format from faculty profile records.
            </p>
            <div style={{ marginTop: '12px', display: 'grid', gap: '12px', maxHeight: '68vh', overflowY: 'auto', paddingRight: '4px' }}>
              {!loading && facultyData.length === 0 ? <div style={{ border: `1px dashed ${colors.border}`, borderRadius: '10px', padding: '14px', color: colors.mediumGray, fontSize: '13px' }}>No faculty members yet.</div> : null}
              {facultyData.map((f) => {
                const id = Number(f?.faculty_id || f?.id || 0);
                const profileState = profilesByFaculty[id];
                const profile = profileState?.data || {};
                const q = profile?.qualification || {};
                const certs = parseProfileEntries(profile?.certifications);
                const members = parseProfileEntries(profile?.memberships);
                const dev = parseProfileEntries(profile?.development_activities);
                const industry = parseProfileEntries(profile?.industry_experience);
                const honors = parseProfileEntries(profile?.honors);
                const service = parseProfileEntries(profile?.services);
                const pubs = parseProfileEntries(profile?.publications);
                const name = f?.full_name || f?.name || `Faculty #${id}`;
                const rank = `${f?.academic_rank || f?.rank || '-'} - ${f?.appointment_type || '-'}`;
                return (
                  <div key={id || name} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px', backgroundColor: colors.lightGray }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: colors.darkGray }}>{name}</div>
                        <div style={{ fontSize: '12px', color: colors.mediumGray }}>{rank}</div>
                      </div>
                      <span style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', border: `1px solid ${cvReady(f, profile) ? '#abefc6' : '#fed7aa'}`, backgroundColor: cvReady(f, profile) ? '#ecfdf3' : '#fff6ed', color: cvReady(f, profile) ? '#027a48' : '#b54708' }}>{cvReady(f, profile) ? 'CV Preview Ready' : 'Draft / Incomplete'}</span>
                    </div>

                    <div style={{ marginTop: '10px', ...docFrameStyle }}>
                      <div style={docHeaderStyle}>
                        <div style={{ fontSize: '17px', fontWeight: '700', color: '#1f2937' }}>Faculty Curriculum Vitae</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Appendix B</div>
                      </div>

                      {profileState?.status === 'error' ? <div style={{ margin: '12px', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#b42318', border: '1px solid #fecdd3', backgroundColor: '#fff1f2' }}>{profileState.error}</div> : null}

                      {profileState?.status === 'ready' ? (
                        <div style={{ padding: '18px 20px', display: 'grid', gap: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{name}</div>
                          <div style={{ fontSize: '12px', color: '#475467' }}>{rank}</div>

                          <div>
                            <div style={secTitleStyle}>Education & Qualification</div>
                            <div style={{ fontSize: '13px', color: '#1f2937', whiteSpace: 'pre-line', lineHeight: 1.55 }}>{`Field: ${q?.degree_field || '-'}\nInstitution: ${q?.degree_institution || '-'}\nYear: ${q?.degree_year || '-'}\nIndustry Years: ${q?.years_industry_government || '-'}\nInstitution Years: ${q?.years_at_institution || '-'}`}</div>
                          </div>

                          <div>
                            <div style={secTitleStyle}>Professional Certifications</div>
                            {renderProfileEntryRows(certs, 'No certifications listed.')}
                          </div>

                          <div>
                            <div style={secTitleStyle}>Professional Memberships</div>
                            {renderProfileEntryRows(members, 'No memberships listed.', { useRangeDate: true })}
                          </div>

                          <div>
                            <div style={secTitleStyle}>Professional Development</div>
                            {renderProfileEntryRows(dev, 'No professional development activities listed.', { useRangeDate: true })}
                          </div>

                          <div>
                            <div style={secTitleStyle}>Consulting / Industry Experience</div>
                            {renderProfileEntryRows(industry, 'No consulting or industry experience listed.', { useRangeDate: true })}
                          </div>

                          <div>
                            <div style={secTitleStyle}>Honors & Awards</div>
                            {renderProfileEntryRows(honors, 'No honors or awards listed.')}
                          </div>

                          <div>
                            <div style={secTitleStyle}>Service Activities</div>
                            {renderProfileEntryRows(service, 'No service activities listed.')}
                          </div>

                          <div>
                            <div style={secTitleStyle}>Publications</div>
                            {renderProfileEntryRows(pubs, 'No publications listed.')}
                          </div>
                        </div>
                      ) : profileState?.status !== 'error' ? <div style={{ padding: '10px', fontSize: '13px', color: colors.mediumGray }}>Loading...</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppendicesABLivePage;
