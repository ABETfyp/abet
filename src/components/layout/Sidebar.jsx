import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, X, Users, BookOpen, Database, Plus } from 'lucide-react';
import { colors, fontStack } from '../../styles/theme';
import { courses } from '../../data/sampleData';
import { getActiveContext } from '../../utils/activeContext';
import { apiRequest } from '../../utils/api';

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  facultyExpanded,
  setFacultyExpanded,
  coursesExpanded,
  setCoursesExpanded,
  expandedCourse,
  setExpandedCourse,
  setSelectedFaculty,
  setSelectedCourse,
  setSelectedInstructor,
  setSyllabusMode,
  setCurrentPage
}) => {
  const cycleId = localStorage.getItem('currentCycleId') || 1;
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState('');

  const facultySubtitle = useMemo(() => {
    if (facultyLoading) return 'Loading...';
    if (facultyError) return facultyError;
    if (facultyMembers.length === 0) return 'No faculty members yet';
    return `${facultyMembers.length} member(s)`;
  }, [facultyLoading, facultyError, facultyMembers.length]);

  const loadFacultyMembers = async () => {
    try {
      setFacultyLoading(true);
      setFacultyError('');
      const list = await apiRequest('/faculty-members/', { method: 'GET' });
      if (Array.isArray(list)) {
        setFacultyMembers(list);
      } else {
        setFacultyMembers([]);
      }
    } catch (_error) {
      setFacultyMembers([]);
      setFacultyError('Unable to load');
    } finally {
      setFacultyLoading(false);
    }
  };

  useEffect(() => {
    if (sidebarOpen && facultyExpanded) {
      loadFacultyMembers();
    }
  }, [sidebarOpen, facultyExpanded]);

  useEffect(() => {
    const handleFacultyUpdated = () => {
      loadFacultyMembers();
      localStorage.removeItem('facultyNeedsRefresh');
    };

    window.addEventListener('faculty-updated', handleFacultyUpdated);
    return () => window.removeEventListener('faculty-updated', handleFacultyUpdated);
  }, []);

  const handleAddFaculty = () => {
    setSelectedFaculty({
      isNew: true,
      faculty_id: null,
      full_name: '',
      academic_rank: '',
      appointment_type: '',
      email: '',
      office_hours: ''
    });
  };

  return (
  <div style={{
    position: 'fixed',
    left: sidebarOpen ? 0 : '-420px',
    top: 0,
    width: '420px',
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
    transition: 'left 0.3s ease-in-out',
    zIndex: 1000,
    overflowY: 'auto',
    fontFamily: fontStack
  }}>
    {/* Sidebar Header */}
    <div style={{ backgroundColor: colors.primary, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
      <div>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: '700', letterSpacing: '0.3px' }}>Quick Access</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginTop: '4px', fontWeight: '400' }}>{getActiveContext().subtitle}</div>
      </div>
      <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
        <X size={24} />
      </button>
    </div>

    {/* Sidebar Content */}
    <div style={{ padding: '24px' }}>
      {/* Faculty Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setFacultyExpanded(!facultyExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} color={colors.primary} />
            Faculty Members
          </div>
          {facultyExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {facultyExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>{facultySubtitle}</div>
            {facultyMembers.map((faculty) => (
              <div
                key={faculty.faculty_id}
                onClick={() => setSelectedFaculty(faculty)}
                style={{
                  padding: '12px 16px',
                  marginBottom: '8px',
                  backgroundColor: colors.hover,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  border: `1px solid ${colors.border}`
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.darkGray, marginBottom: '4px' }}>{faculty.full_name}</div>
                <div style={{ fontSize: '12px', color: colors.mediumGray }}>{faculty.academic_rank || 'No rank yet'}</div>
              </div>
            ))}
            <button onClick={handleAddFaculty} style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              backgroundColor: 'white',
              color: colors.primary,
              border: `2px dashed ${colors.primary}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Plus size={16} />
              Add Faculty Member
            </button>
          </div>
        )}
      </div>

      {/* Courses Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setCoursesExpanded(!coursesExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={20} color={colors.primary} />
            Courses
          </div>
          {coursesExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {coursesExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            {courses.map((course) => (
              <div key={course.id} style={{ marginBottom: '12px' }}>
                {/* Course Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    onClick={() => setSelectedCourse(course)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      backgroundColor: colors.hover,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      border: `1px solid ${colors.border}`,
                      marginRight: '8px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '700', color: colors.primary, marginBottom: '2px' }}>{course.code}</div>
                    <div style={{ fontSize: '13px', color: colors.darkGray, fontWeight: '500' }}>{course.name}</div>
                  </div>
                  <button
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      color: colors.mediumGray
                    }}
                  >
                    {expandedCourse === course.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>

                {/* Expanded Instructors */}
                {expandedCourse === course.id && (
                  <div style={{ marginTop: '8px', marginLeft: '16px', paddingLeft: '16px', borderLeft: `2px solid ${colors.border}` }}>
                    {course.instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        style={{
                          padding: '10px 12px',
                          marginBottom: '6px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          border: `1px solid ${colors.border}`,
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: colors.darkGray, marginBottom: '2px' }}>{instructor.name}</div>
                        <div style={{ color: colors.mediumGray, fontSize: '11px', marginBottom: '8px' }}>{instructor.term}</div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setSelectedInstructor(instructor);
                              setSyllabusMode('view');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              fontSize: '11px',
                              backgroundColor: 'white',
                              color: colors.primary,
                              border: `1px solid ${colors.primary}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}>
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setSelectedInstructor(instructor);
                              setSyllabusMode('edit');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              fontSize: '11px',
                              backgroundColor: colors.primary,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}>
                            Edit
                          </button>
                        </div>
                        <button style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '11px',
                          backgroundColor: colors.success,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}>
                          Generate Syllabus
                        </button>
                      </div>
                    ))}
                    <button style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: 'white',
                      color: colors.primary,
                      border: `1px dashed ${colors.primary}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <Plus size={14} />
                      Add Section
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              backgroundColor: 'white',
              color: colors.primary,
              border: `2px dashed ${colors.primary}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Plus size={16} />
              Add Course
            </button>
          </div>
        )}
      </div>

      {/* Evidence Library Section */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => {
            setCurrentPage('evidence');
            setSidebarOpen(false);
          }}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={20} color={colors.primary} />
            Evidence Library
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  </div>
);
};

export default Sidebar;
