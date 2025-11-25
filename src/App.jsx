import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Upload,
  Search,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Users,
  BookOpen,
  Database,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  Save,
} from 'lucide-react';

const AUBAccreditationSystem = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facultyExpanded, setFacultyExpanded] = useState(false);
  const [coursesExpanded, setCoursesExpanded] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [syllabusMode, setSyllabusMode] = useState(null);

  const colors = {
    primary: '#8B1538',
    primaryDark: '#6B0F2A',
    secondary: '#FFFFFF',
    lightGray: '#F8F9FA',
    mediumGray: '#6C757D',
    darkGray: '#212529',
    border: '#DEE2E6',
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
    hover: '#F1F3F5',
  };

  const facultyMembers = [
    { id: 1, name: 'Dr. Imad Moukadam', rank: 'Professor', department: 'CCE', email: 'imad.moukadam@aub.edu.lb' },
    { id: 2, name: 'Dr. Lina Saab', rank: 'Associate Professor', department: 'CCE', email: 'lina.saab@aub.edu.lb' },
    { id: 3, name: 'Dr. Ali Hassan', rank: 'Assistant Professor', department: 'CCE', email: 'ali.hassan@aub.edu.lb' },
  ];

  const courses = [
    {
      id: 1,
      code: 'EECE 210',
      name: 'Circuits I',
      instructors: [
        { id: 1, name: 'Dr. Imad Moukadam', term: 'Fall 2025' },
        { id: 2, name: 'Dr. Lina Saab', term: 'Spring 2026' },
      ],
    },
    {
      id: 2,
      code: 'EECE 311',
      name: 'Signals & Systems',
      instructors: [{ id: 1, name: 'Dr. Imad Moukadam', term: 'Fall 2025' }],
    },
    {
      id: 3,
      code: 'EECE 320',
      name: 'Digital Systems',
      instructors: [{ id: 3, name: 'Dr. Ali Hassan', term: 'Spring 2026' }],
    },
  ];

  const GlobalHeader = ({ title, subtitle, showBackButton = false }) => (
    <div
      style={{
        backgroundColor: colors.primary,
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            marginRight: '20px',
            padding: '8px',
          }}
        >
          <Menu size={24} />
        </button>
        <div
          style={{
            backgroundColor: 'white',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
            }}
          ></div>
        </div>
        <div>
          <div
            style={{
              color: 'white',
              fontSize: '17px',
              fontWeight: '700',
              letterSpacing: '0.3px',
            }}
          >
            {title || 'ABET Accreditation System'}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '12px',
              marginTop: '2px',
            }}
          >
            {subtitle || 'Faculty of Engineering'}
          </div>
        </div>
      </div>
      {showBackButton && (
        <button
          onClick={() => setCurrentPage('checklist')}
          style={{
            color: 'white',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          Back to Checklist
        </button>
      )}
    </div>
  );

  const LoginPage = () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.lightGray,
        fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: colors.primary,
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
            }}
          ></div>
        </div>
        <div>
          <div
            style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            AMERICAN UNIVERSITY OF BEIRUT
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '13px',
              fontWeight: '400',
              marginTop: '4px',
              letterSpacing: '1px',
            }}
          >
            FACULTY OF ENGINEERING
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '60px',
            width: '100%',
            maxWidth: '480px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1
              style={{
                color: colors.darkGray,
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '12px',
                letterSpacing: '-0.5px',
              }}
            >
              ABET Accreditation Portal
            </h1>
            <p
              style={{
                color: colors.mediumGray,
                fontSize: '15px',
                fontWeight: '400',
                lineHeight: '1.5',
              }}
            >
              Sign in with your university credentials
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                color: colors.darkGray,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '10px',
              }}
            >
              University Email
            </label>
            <input
              type="email"
              placeholder="username@aub.edu.lb"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                color: colors.darkGray,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '10px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => setCurrentPage('selection')}
            style={{
              width: '100%',
              backgroundColor: colors.primary,
              color: 'white',
              padding: '16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              letterSpacing: '0.3px',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = colors.primaryDark)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = colors.primary)}
          >
            Sign In
          </button>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a
              href="#"
              style={{
                color: colors.primary,
                fontSize: '14px',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Forgot your password?
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          textAlign: 'center',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <p
          style={{
            color: colors.mediumGray,
            fontSize: '13px',
            margin: 0,
            fontWeight: '400',
          }}
        >
          © 2025 American University of Beirut. All rights reserved.
        </p>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-260px',
        width: '260px',
        height: '100%',
        backgroundColor: 'white',
        boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
        transition: 'left 0.3s ease',
        zIndex: 20,
        borderRight: `1px solid ${colors.border}`,
        padding: '20px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: colors.darkGray }}>Navigation</h3>
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ marginBottom: '8px', color: colors.mediumGray, fontSize: '12px', letterSpacing: '0.5px' }}>
        MODULES
      </div>

      <div>
        <button
          onClick={() => setFacultyExpanded(!facultyExpanded)}
          style={{
            width: '100%',
            padding: '12px 10px',
            background: 'none',
            border: 'none',
            color: colors.darkGray,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} />
            <span style={{ fontWeight: 600 }}>Faculty</span>
          </div>
          {facultyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {facultyExpanded && (
          <div style={{ paddingLeft: '12px' }}>
            {facultyMembers.map((faculty) => (
              <div
                key={faculty.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
                onClick={() => setSelectedFaculty(faculty)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: colors.lightGray,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: colors.primary,
                      fontSize: '12px',
                    }}
                  >
                    {faculty.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{faculty.name}</div>
                    <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{faculty.rank}</div>
                  </div>
                </div>
                <ChevronRight size={14} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px' }}>
        <button
          onClick={() => setCoursesExpanded(!coursesExpanded)}
          style={{
            width: '100%',
            padding: '12px 10px',
            background: 'none',
            border: 'none',
            color: colors.darkGray,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} />
            <span style={{ fontWeight: 600 }}>Courses</span>
          </div>
          {coursesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {coursesExpanded && (
          <div style={{ paddingLeft: '12px' }}>
            {courses.map((course) => (
              <div key={course.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                  }}
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: colors.lightGray,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: colors.primary,
                        fontSize: '12px',
                      }}
                    >
                      {course.code}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{course.name}</div>
                      <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{course.code}</div>
                    </div>
                  </div>
                  {expandedCourse === course.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedCourse === course.id && (
                  <div style={{ paddingLeft: '12px' }}>
                    {course.instructors.map((instructor) => (
                      <div
                        key={instructor.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 8px',
                          cursor: 'pointer',
                          borderRadius: '8px',
                        }}
                        onClick={() => {
                          setSelectedCourse(course);
                          setSelectedInstructor(instructor);
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: colors.lightGray,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: colors.primary,
                              fontSize: '12px',
                            }}
                          >
                            {instructor.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{instructor.name}</div>
                            <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{instructor.term}</div>
                          </div>
                        </div>
                        <ChevronRight size={14} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const SelectionPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray }}>
      <GlobalHeader title="ABET Accreditation System" subtitle="Faculty of Engineering" />

      <Sidebar />

      <div style={{ padding: '32px 48px', marginLeft: sidebarOpen ? '260px' : '0', transition: 'margin-left 0.3s ease' }}>
        <div
          style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, color: colors.darkGray }}>Welcome back</h2>
              <p style={{ margin: '6px 0 0', color: colors.mediumGray }}>Select a course, instructor, and action to preview the UI</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Plus size={16} /> New Item
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: colors.lightGray,
                  color: colors.darkGray,
                  padding: '10px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Upload size={16} /> Upload
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', background: colors.secondary }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} />
                  <span style={{ fontWeight: 700 }}>Faculty</span>
                </div>
                <Search size={16} color={colors.mediumGray} />
              </div>
              <p style={{ color: colors.mediumGray, fontSize: '13px', margin: '8px 0 12px' }}>Choose a faculty member</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {facultyMembers.map((faculty) => (
                  <button
                    key={faculty.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onClick={() => setSelectedFaculty(faculty)}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: colors.lightGray,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: colors.primary,
                        fontSize: '12px',
                      }}
                    >
                      {faculty.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{faculty.name}</div>
                      <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{faculty.rank}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', background: colors.secondary }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} />
                  <span style={{ fontWeight: 700 }}>Courses</span>
                </div>
                <Search size={16} color={colors.mediumGray} />
              </div>
              <p style={{ color: colors.mediumGray, fontSize: '13px', margin: '8px 0 12px' }}>Pick a course to review</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      background: 'white',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: colors.lightGray,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: colors.primary,
                          fontSize: '12px',
                        }}
                      >
                        {course.code}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{course.name}</div>
                        <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{course.code}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', background: colors.secondary }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} />
                  <span style={{ fontWeight: 700 }}>Instructors</span>
                </div>
                <Search size={16} color={colors.mediumGray} />
              </div>
              <p style={{ color: colors.mediumGray, fontSize: '13px', margin: '8px 0 12px' }}>Assign a term instructor</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCourse ? (
                  courses
                    .find((course) => course.id === selectedCourse.id)
                    ?.instructors.map((instructor) => (
                      <button
                        key={instructor.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px',
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`,
                          background: 'white',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedInstructor(instructor)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: colors.lightGray,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: colors.primary,
                              fontSize: '12px',
                            }}
                          >
                            {instructor.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{instructor.name}</div>
                            <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{instructor.term}</div>
                          </div>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    ))) : (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px dashed ${colors.border}`,
                    color: colors.mediumGray,
                    textAlign: 'center',
                  }}>
                    Select a course to view instructors
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', background: colors.secondary }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} />
                  <span style={{ fontWeight: 700 }}>Actions</span>
                </div>
                <Search size={16} color={colors.mediumGray} />
              </div>
              <p style={{ color: colors.mediumGray, fontSize: '13px', margin: '8px 0 12px' }}>Pick a syllabus action</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                {[['Upload', Upload], ['View', Eye], ['Download', Download], ['Save Draft', Save]].map(([label, Icon]) => (
                  <button
                    key={label}
                    onClick={() => setSyllabusMode(label.toLowerCase())}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      background: 'white',
                      cursor: 'pointer',
                      justifyContent: 'center',
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return currentPage === 'login' ? <LoginPage /> : <SelectionPage />;
};

export default AUBAccreditationSystem;
