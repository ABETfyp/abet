import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Menu, X, Upload, Search, Check, Clock, AlertCircle, FileText, Users, BookOpen, Database, Plus, Edit, Trash2, Download, Eye, Save, ShieldCheck, Mail, Lock, Award, Globe2, Cpu, Cog, FlaskConical, CheckCircle2, Sparkles, LayoutGrid, ClipboardList } from 'lucide-react';

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

  // Typography
  const fontStack = '"Manrope", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // AUB Color Scheme - Professional Palette
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
    softHighlight: 'rgba(139, 21, 56, 0.06)'
  };

  // Sample Data
  const facultyMembers = [
    { id: 1, name: 'Dr. Imad Moukadam', rank: 'Professor', department: 'CCE', email: 'imad.moukadam@aub.edu.lb' },
    { id: 2, name: 'Dr. Lina Saab', rank: 'Associate Professor', department: 'CCE', email: 'lina.saab@aub.edu.lb' },
    { id: 3, name: 'Dr. Ali Hassan', rank: 'Assistant Professor', department: 'CCE', email: 'ali.hassan@aub.edu.lb' }
  ];

  const courses = [
    { 
      id: 1, 
      code: 'EECE 210', 
      name: 'Circuits I',
      instructors: [
        { id: 1, name: 'Dr. Imad Moukadam', term: 'Fall 2025' },
        { id: 2, name: 'Dr. Lina Saab', term: 'Spring 2026' }
      ]
    },
    { 
      id: 2, 
      code: 'EECE 311', 
      name: 'Signals & Systems',
      instructors: [
        { id: 1, name: 'Dr. Imad Moukadam', term: 'Fall 2025' }
      ]
    },
    { 
      id: 3, 
      code: 'EECE 320', 
      name: 'Digital Systems',
      instructors: [
        { id: 3, name: 'Dr. Ali Hassan', term: 'Spring 2026' }
      ]
    }
  ];

  // Global Header Component
  const GlobalHeader = ({ title, subtitle, showBackButton = false }) => (
    <div style={{ backgroundColor: colors.primary, padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '20px', padding: '8px' }}>
          <Menu size={24} />
        </button>
        <div style={{ backgroundColor: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: colors.primary }}></div>
        </div>
        <div>
          <div style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '0.3px' }}>{title || 'ABET Accreditation System'}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '2px' }}>{subtitle || 'Faculty of Engineering'}</div>
        </div>
      </div>
      {showBackButton && (
        <button onClick={() => setCurrentPage('checklist')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          Back to Checklist
        </button>
      )}
    </div>
  );

  // Page 1: Login Page
  const LoginPage = () => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: `radial-gradient(circle at 10% 20%, ${colors.softHighlight}, transparent 45%), radial-gradient(circle at 90% 10%, rgba(107, 15, 42, 0.08), transparent 35%), ${colors.lightGray}`, fontFamily: fontStack }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 60%, #9b1a43 100%)`, padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', width: '74px', height: '74px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px', boxShadow: '0 8px 26px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.22)' }}>
            <ShieldCheck size={28} color={colors.primary} />
          </div>
        </div>
        <div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px' }}>AMERICAN UNIVERSITY OF BEIRUT</div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500', marginTop: '6px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> FACULTY OF ENGINEERING
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.12)', padding: '56px', width: '100%', maxWidth: '520px', border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 0%, ${colors.softHighlight}, transparent 30%)` }}></div>
          <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '18px', backgroundColor: colors.softHighlight, color: colors.primary, marginBottom: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
              <LayoutGrid size={28} />
            </div>
            <h1 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>ABET Accreditation Portal</h1>
            <p style={{ color: colors.mediumGray, fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>Securely access accreditation workflows and resources</p>
          </div>

          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>University Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="username@aub.edu.lb"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 42px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  outline: 'none',
                  backgroundColor: colors.lightGray
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.softHighlight}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px', position: 'relative' }}>
            <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 42px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  outline: 'none',
                  backgroundColor: colors.lightGray
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.softHighlight}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('selection')}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              color: 'white',
              padding: '16px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              letterSpacing: '0.3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 12px 30px rgba(139,21,56,0.35)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 16px 36px rgba(139,21,56,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 12px 30px rgba(139,21,56,0.35)';
            }}
          >
            <ShieldCheck size={18} />
            Sign In
          </button>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="#" style={{ color: colors.primary, fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>Forgot your password?</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: 'white', padding: '24px', textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
        <p style={{ color: colors.mediumGray, fontSize: '13px', margin: 0, fontWeight: '400' }}>© 2025 American University of Beirut. All rights reserved.</p>
      </div>
    </div>
  );

  // Page 2: Selection Page
  const SelectionPage = () => (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.lightGray} 0%, #ffffff 100%)`,
      fontFamily: fontStack
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 60%, #9b1a43 100%)`,
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 14px 34px rgba(0,0,0,0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.16)',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
            boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <ShieldCheck size={26} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '0.3px' }}>ABET Accreditation System</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '2px' }}>Faculty of Engineering</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '48px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Framework Selection */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          marginBottom: '40px',
          boxShadow: '0 14px 36px rgba(0,0,0,0.08)',
          border: `1px solid ${colors.border}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 20%, ${colors.softHighlight}, transparent 45%)` }}></div>
          <div style={{ position: 'relative' }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ color: colors.darkGray, fontSize: '26px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.3px' }}>Select Accreditation Framework</h2>
            <p style={{ color: colors.mediumGray, fontSize: '15px', fontWeight: '400', margin: 0 }}>Choose the accreditation type for your program</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <button
              onClick={() => setCurrentPage('checklist')}
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                padding: '36px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textAlign: 'center',
                boxShadow: '0 14px 28px rgba(139,21,56,0.24)',
                backdropFilter: 'blur(2px)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 45%)' }}></div>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '58px', height: '58px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}>
                  <Award size={28} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>ABET</div>
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>Engineering Programs</div>
              </div>
            </button>

            <button
              disabled
              style={{
                backgroundColor: colors.lightGray,
                color: colors.mediumGray,
                padding: '36px',
                borderRadius: '14px',
                border: `2px dashed ${colors.border}`,
                cursor: 'not-allowed',
                textAlign: 'center',
                boxShadow: '0 6px 18px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', border: `1px solid ${colors.border}` }}>
                <ClipboardList size={24} color={colors.mediumGray} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', letterSpacing: '1px' }}>AACSB</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: colors.mediumGray }}>Coming Soon</div>
            </button>

            <button
              disabled
              style={{
                backgroundColor: colors.lightGray,
                color: colors.mediumGray,
                padding: '36px',
                borderRadius: '14px',
                border: `2px dashed ${colors.border}`,
                cursor: 'not-allowed',
                textAlign: 'center',
                boxShadow: '0 6px 18px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', border: `1px solid ${colors.border}` }}>
                <Globe2 size={24} color={colors.mediumGray} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', letterSpacing: '1px' }}>MSCHE</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: colors.mediumGray }}>Coming Soon</div>
            </button>
          </div>
          </div>
        </div>

        {/* Programs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 14px 36px rgba(0,0,0,0.08)',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
            <div>
              <h2 style={{ color: colors.darkGray, fontSize: '26px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.3px' }}>Engineering Programs</h2>
              <p style={{ color: colors.mediumGray, fontSize: '15px', fontWeight: '400', margin: 0 }}>Select a program to view or start accreditation cycle</p>
            </div>
            <button style={{
              backgroundColor: colors.primary,
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 24px rgba(139,21,56,0.25)'
            }}>
              <Plus size={18} />
              Add New Program
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
            {/* Program Card */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '28px',
              transition: 'box-shadow 0.2s, transform 0.2s',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              background: 'white'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: colors.softHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                  <Cpu size={22} />
                </div>
                <div>
                  <h3 style={{ color: colors.darkGray, fontSize: '19px', fontWeight: '800', margin: 0, letterSpacing: '-0.2px' }}>Computer & Communication Engineering</h3>
                  <div style={{ color: colors.mediumGray, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Undergraduate Program</div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: colors.mediumGray, fontSize: '13px', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Cycles</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: colors.lightGray, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color={colors.primary} />
                      ABET 2022-2024
                    </span>
                    <span style={{ fontSize: '12px', color: colors.success, fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: 'rgba(40,167,69,0.08)', borderRadius: '999px' }}>
                      <ShieldCheck size={14} /> Completed
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FFF8E1', borderRadius: '8px', border: '1px solid #FFE082' }}>
                    <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#F57C00" />
                      ABET 2025-2027
                    </span>
                    <span style={{ fontSize: '12px', color: '#F57C00', fontWeight: '800', padding: '6px 10px', backgroundColor: 'rgba(245,124,0,0.12)', borderRadius: '999px' }}>In Progress (45%)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setCurrentPage('checklist')}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    color: 'white',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(139,21,56,0.2)'
                  }}
                >
                  Open
                </button>
                <button style={{
                  flex: 1,
                  backgroundColor: 'white',
                  color: colors.primary,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${colors.primary}`,
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  New Cycle
                </button>
              </div>
            </div>

            {/* Program Card - Mechanical Engineering */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '28px',
              transition: 'box-shadow 0.2s, transform 0.2s',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              background: 'white'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: colors.softHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                  <Cog size={22} />
                </div>
                <div>
                  <h3 style={{ color: colors.darkGray, fontSize: '19px', fontWeight: '800', margin: 0, letterSpacing: '-0.2px' }}>Mechanical Engineering</h3>
                  <div style={{ color: colors.mediumGray, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Undergraduate Program</div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: colors.mediumGray, fontSize: '13px', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Cycles</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: colors.lightGray, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color={colors.primary} />
                      ABET 2021-2023
                    </span>
                    <span style={{ fontSize: '12px', color: colors.success, fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: 'rgba(40,167,69,0.08)', borderRadius: '999px' }}>
                      <ShieldCheck size={14} /> Completed
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FFF8E1', borderRadius: '8px', border: '1px solid #FFE082' }}>
                    <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#F57C00" />
                      ABET 2024-2026
                    </span>
                    <span style={{ fontSize: '12px', color: '#F57C00', fontWeight: '800', padding: '6px 10px', backgroundColor: 'rgba(245,124,0,0.12)', borderRadius: '999px' }}>Planning</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    color: 'white',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'default',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(139,21,56,0.2)',
                    opacity: 0.85
                  }}
                >
                  Open
                </button>
                <button style={{
                  flex: 1,
                  backgroundColor: 'white',
                  color: colors.primary,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${colors.primary}`,
                  cursor: 'default',
                  fontWeight: '700',
                  fontSize: '14px',
                  opacity: 0.85
                }}>
                  New Cycle
                </button>
              </div>
            </div>

            {/* Program Card - Chemical Engineering */}
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '28px',
              transition: 'box-shadow 0.2s, transform 0.2s',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              background: 'white'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: colors.softHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                  <FlaskConical size={22} />
                </div>
                <div>
                  <h3 style={{ color: colors.darkGray, fontSize: '19px', fontWeight: '800', margin: 0, letterSpacing: '-0.2px' }}>Chemical Engineering</h3>
                  <div style={{ color: colors.mediumGray, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Undergraduate Program</div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: colors.mediumGray, fontSize: '13px', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Cycles</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: colors.lightGray, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color={colors.primary} />
                      ABET 2020-2022
                    </span>
                    <span style={{ fontSize: '12px', color: colors.success, fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: 'rgba(40,167,69,0.08)', borderRadius: '999px' }}>
                      <ShieldCheck size={14} /> Completed
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#FFF8E1', borderRadius: '8px', border: '1px solid #FFE082' }}>
                    <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#F57C00" />
                      ABET 2023-2025
                    </span>
                    <span style={{ fontSize: '12px', color: '#F57C00', fontWeight: '800', padding: '6px 10px', backgroundColor: 'rgba(245,124,0,0.12)', borderRadius: '999px' }}>In Progress (20%)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    color: 'white',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'default',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(139,21,56,0.2)',
                    opacity: 0.85
                  }}
                >
                  Open
                </button>
                <button style={{
                  flex: 1,
                  backgroundColor: 'white',
                  color: colors.primary,
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${colors.primary}`,
                  cursor: 'default',
                  fontWeight: '700',
                  fontSize: '14px',
                  opacity: 0.85
                }}>
                  New Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Sidebar with Faculty, Courses, and Evidence
  const Sidebar = () => (
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
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginTop: '4px', fontWeight: '400' }}>CCE - ABET 2025-2027</div>
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
              {facultyMembers.map((faculty) => (
                <div 
                  key={faculty.id}
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
                  <div style={{ fontSize: '14px', fontWeight: '600', color: colors.darkGray, marginBottom: '4px' }}>{faculty.name}</div>
                  <div style={{ fontSize: '12px', color: colors.mediumGray }}>{faculty.rank}</div>
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

  // Syllabus Editing Modal
  const SyllabusModal = () => {
    if (!selectedInstructor || !syllabusMode) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={() => {
        setSelectedInstructor(null);
        setSyllabusMode(null);
      }}>
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            fontFamily: fontStack
          }}>
          {/* Modal Header */}
          <div style={{ 
            padding: '32px', 
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px', letterSpacing: '-0.3px' }}>
                {selectedCourse?.code} - {selectedCourse?.name}
              </h2>
              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>
                {selectedInstructor.name} • {selectedInstructor.term} • {syllabusMode === 'edit' ? 'Editing' : 'Viewing'}
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedInstructor(null);
                setSyllabusMode(null);
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                color: colors.mediumGray
              }}>
              <X size={24} />
            </button>
          </div>

          {/* Modal Content - Full Syllabus Form */}
          <div style={{ padding: '32px' }}>
            {/* Upload Section */}
            {syllabusMode === 'edit' && (
              <div style={{
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: colors.lightGray,
                borderRadius: '8px',
                border: `2px dashed ${colors.border}`,
                textAlign: 'center'
              }}>
                <Upload size={32} color={colors.primary} style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px' }}>
                  Upload Syllabus (PDF/Word)
                </h4>
                <p style={{ fontSize: '13px', color: colors.mediumGray, marginBottom: '16px' }}>
                  AI will automatically extract and fill all information below
                </p>
                <button style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Choose File
                </button>
              </div>
            )}

            {/* Basic Course Info */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Course Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Course Number & Name
                  </label>
                  <input 
                    type="text" 
                    value={`${selectedCourse?.code} - ${selectedCourse?.name}`}
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Credits
                  </label>
                  <input 
                    type="number" 
                    placeholder="3"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Contact Hours (Lecture/Lab/Other)
                  </label>
                  <input 
                    type="text" 
                    placeholder="3/0/0"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Instructor / Coordinator
                  </label>
                  <input 
                    type="text" 
                    value={selectedInstructor.name}
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Textbook */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Required Materials
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Textbooks (Title, Author, Year)
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g., Signals and Systems, Oppenheim & Willsky, 1997"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="e.g., Digital Signal Processing, Proakis & Manolakis, 2006"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                {syllabusMode === 'edit' && (
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: colors.primary,
                    border: `1px dashed ${colors.primary}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '16px'
                  }}>
                    <Plus size={14} />
                    Add Textbook
                  </button>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Supplemental Materials
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g., MATLAB Programming Guide"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="e.g., Additional online resources"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                {syllabusMode === 'edit' && (
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: colors.primary,
                    border: `1px dashed ${colors.primary}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Plus size={14} />
                    Add Material
                  </button>
                )}
              </div>
            </div>

            {/* Course Description */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Course Description & Prerequisites
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Catalog Description
                </label>
                <textarea 
                  placeholder="Official course description from catalog"
                  disabled={syllabusMode === 'view'}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '100px',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                  }} 
                />
              </div>
              
              {/* Prerequisites */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Prerequisites
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g., EECE 210"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                {syllabusMode === 'edit' && (
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: colors.primary,
                    border: `1px dashed ${colors.primary}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Plus size={14} />
                    Add Prerequisite
                  </button>
                )}
              </div>

              {/* Corequisites */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Corequisites
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="None"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                {syllabusMode === 'edit' && (
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: 'white',
                    color: colors.primary,
                    border: `1px dashed ${colors.primary}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Plus size={14} />
                    Add Corequisite
                  </button>
                )}
              </div>

              {/* Course Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Course Type
                </label>
                <select 
                  disabled={syllabusMode === 'view'}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                  }}>
                  <option>Required</option>
                  <option>Elective</option>
                  <option>Selective Elective</option>
                </select>
              </div>
            </div>

            {/* CLOs */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Course Learning Outcomes (CLOs)
              </h3>
              
              {/* CLO 1 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  CLO 1
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Students will be able to..."
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      flex: 1, 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                  <select 
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '130px', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }}>
                    <option>Maps to SO</option>
                    <option>SO 1</option>
                    <option>SO 2</option>
                    <option>SO 3</option>
                  </select>
                  <select 
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100px', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }}>
                    <option>Level</option>
                    <option>I</option>
                    <option>R</option>
                    <option>M</option>
                  </select>
                </div>
              </div>

              {/* CLO 2 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  CLO 2
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Students will be able to..."
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      flex: 1, 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                  <select 
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '130px', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }}>
                    <option>Maps to SO</option>
                    <option>SO 1</option>
                    <option>SO 2</option>
                    <option>SO 3</option>
                  </select>
                  <select 
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100px', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }}>
                    <option>Level</option>
                    <option>I</option>
                    <option>R</option>
                    <option>M</option>
                  </select>
                </div>
              </div>

              {syllabusMode === 'edit' && (
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Plus size={16} />
                  Add CLO
                </button>
              )}
            </div>

            {/* Topics Outline */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Weekly Topics Outline
              </h3>
              <textarea 
                placeholder="List main topics covered week by week"
                disabled={syllabusMode === 'view'}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: `1px solid ${colors.border}`, 
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '120px',
                  backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                }} 
              />
            </div>

            {/* Assessment */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Assessment Methods & Weights
              </h3>
              
              {/* Assessment 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Assessment Type (e.g., Midterm Exam)" 
                  disabled={syllabusMode === 'view'} 
                  style={{ 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 
                  }} 
                />
                <input 
                  type="text" 
                  placeholder="Weight %" 
                  disabled={syllabusMode === 'view'} 
                  style={{ 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 
                  }} 
                />
              </div>

              {/* Assessment 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Assessment Type (e.g., Final Exam)" 
                  disabled={syllabusMode === 'view'} 
                  style={{ 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 
                  }} 
                />
                <input 
                  type="text" 
                  placeholder="Weight %" 
                  disabled={syllabusMode === 'view'} 
                  style={{ 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 
                  }} 
                />
              </div>

              {/* Assessment 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Assessment Type (e.g., Homework/Assignments)" 
                  disabled={syllabusMode === 'view'} 
                  style={{ 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 
                  }} 
                />
                <input 
                  type="text" 
                  placeholder="Weight %" 
                  disabled={syllabusMode === 'view'} 
                  style={{ 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    fontFamily: 'inherit',
                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 
                  }} 
                />
              </div>

              {syllabusMode === 'edit' && (
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Plus size={16} />
                  Add Assessment
                </button>
              )}
            </div>

            {/* Additional Info */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Additional Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Design Content %
                  </label>
                  <input 
                    type="number" 
                    placeholder="0-100"
                    disabled={syllabusMode === 'view'}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Software / Lab Tools Used
                  </label>
                  <div style={{ marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="e.g., MATLAB"
                      disabled={syllabusMode === 'view'}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white',
                        marginBottom: '8px'
                      }} 
                    />
                    <input 
                      type="text" 
                      placeholder="e.g., Oscilloscope"
                      disabled={syllabusMode === 'view'}
                      style={{ 
                        width: '100%', 
                        padding: '10px 12px', 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'
                      }} 
                    />
                  </div>
                  {syllabusMode === 'edit' && (
                    <button style={{
                      padding: '6px 12px',
                      backgroundColor: 'white',
                      color: colors.primary,
                      border: `1px dashed ${colors.primary}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Plus size={14} />
                      Add Tool
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {syllabusMode === 'edit' && (
              <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                <button style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Save size={18} />
                  Save Syllabus
                </button>
                <button style={{
                  padding: '14px 24px',
                  backgroundColor: 'white',
                  color: colors.mediumGray,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedInstructor(null);
                  setSyllabusMode(null);
                }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Faculty Profile Modal (keeping existing implementation)
  const FacultyProfileModal = () => {
    if (!selectedFaculty) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={() => setSelectedFaculty(null)}>
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            fontFamily: fontStack
          }}>
          {/* Modal Header */}
          <div style={{ 
            padding: '32px', 
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px', letterSpacing: '-0.3px' }}>
                {selectedFaculty.name}
              </h2>
              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>
                {selectedFaculty.rank} • {selectedFaculty.department}
              </p>
            </div>
            <button 
              onClick={() => setSelectedFaculty(null)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                color: colors.mediumGray
              }}>
              <X size={24} />
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '32px' }}>
            {/* Upload CV Section */}
            <div style={{ 
              marginBottom: '32px',
              padding: '24px',
              backgroundColor: colors.lightGray,
              borderRadius: '8px',
              border: `2px dashed ${colors.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Upload size={32} color={colors.primary} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: colors.darkGray, marginBottom: '4px' }}>Upload CV</h4>
                  <p style={{ fontSize: '13px', color: colors.mediumGray, margin: 0 }}>AI will automatically extract information to fill the form</p>
                </div>
                <button style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  Choose File
                </button>
              </div>
            </div>

            {/* Profile Information */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Rank/Title
                  </label>
                  <select style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}>
                    <option>Professor</option>
                    <option>Associate Professor</option>
                    <option>Assistant Professor</option>
                    <option>Instructor</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Type of Appointment
                  </label>
                  <select style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}>
                    <option>Full-time, Tenure-track</option>
                    <option>Full-time, Not Tenure-track</option>
                    <option>Part-time</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={selectedFaculty.email}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Office Hours
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., MW 2-4 PM"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Qualifications (Table 6-1) */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Qualifications (Table 6-1)
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Highest Degree
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px' }}>
                  <input type="text" placeholder="Field (e.g., Electrical Engineering)" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                  <input type="text" placeholder="Institution (e.g., MIT)" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                  <input type="text" placeholder="Year" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Years in Industry/Government
                  </label>
                  <input type="number" placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    Years at This Institution
                  </label>
                  <input type="number" placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Professional Certifications
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., PE License (2020)"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., PMP Certification (2022)"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Certification
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Professional Memberships
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., IEEE (Senior Member)"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., ASME"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Membership
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Professional Development Activities
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., Attended IEEE International Conference 2024"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., Completed Advanced VLSI Design Workshop (2023)"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Activity
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Consulting or Work in Industry
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., Technical Consultant at XYZ Corporation (2023-Present)"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., Part-time Engineer at ABC Tech (2020-2022)"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Position
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Level of Activity
                </label>
                <select style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: `1px solid ${colors.border}`, 
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}>
                  <option value="">Select level</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Workload (Table 6-2) */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Workload (Table 6-2)
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Courses Taught (Current Cycle)
                </label>
                <div style={{ 
                  padding: '16px',
                  backgroundColor: colors.lightGray,
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{ fontSize: '13px', color: colors.mediumGray, marginBottom: '8px', fontWeight: '500' }}>
                    EECE 210 - Circuits I (Fall 2025, 3 credits)
                  </div>
                  <div style={{ fontSize: '13px', color: colors.mediumGray, fontWeight: '500' }}>
                    EECE 311 - Signals & Systems (Fall 2025, 3 credits)
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '8px', fontStyle: 'italic' }}>
                  Auto-populated from course assignments
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    % Teaching
                  </label>
                  <input type="number" placeholder="e.g., 60" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    % Research
                  </label>
                  <input type="number" placeholder="e.g., 30" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                    % Other
                  </label>
                  <input type="number" placeholder="e.g., 10" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                </div>
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  % of Time Devoted to This Program
                </label>
                <input type="number" placeholder="e.g., 100" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
            </div>

            {/* Additional Information */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>
                Additional Information for Appendix B
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Honors and Awards
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., Best Paper Award at IEEE Conference 2023"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., Outstanding Teaching Award 2022"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Honor/Award
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Service Activities
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., Member of Academic Senate"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., Chair of Curriculum Committee"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Service Activity
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>
                  Publications and Presentations (Last 5 Years)
                </label>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="text"
                    placeholder="e.g., J. Smith, 'Signal Processing Methods', IEEE Trans. 2024"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }} 
                  />
                  <input 
                    type="text"
                    placeholder="e.g., Conference presentation at ICASSP 2023"
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: `1px solid ${colors.border}`, 
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `1px dashed ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Plus size={14} />
                  Add Publication
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
              <button style={{
                flex: 1,
                padding: '14px',
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Save size={18} />
                Save Profile
              </button>
              <button style={{
                padding: '14px 24px',
                backgroundColor: 'white',
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Download size={18} />
                Generate Appendix B
              </button>
              <button style={{
                padding: '14px 24px',
                backgroundColor: 'white',
                color: colors.mediumGray,
                border: `2px solid ${colors.border}`,
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedFaculty(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Course Summary Modal (Generate Common Syllabus)
  const CourseSummaryModal = () => {
    if (!selectedCourse || selectedInstructor) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={() => setSelectedCourse(null)}>
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            fontFamily: fontStack
          }}>
          {/* Modal Header */}
          <div style={{ 
            padding: '32px', 
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px', letterSpacing: '-0.3px' }}>
                {selectedCourse.code} - {selectedCourse.name}
              </h2>
              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>
                Course Summary & Common Syllabus Management
              </p>
            </div>
            <button 
              onClick={() => setSelectedCourse(null)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                color: colors.mediumGray
              }}>
              <X size={24} />
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '32px' }}>
            {/* Generate Common Syllabus Button */}
            <div style={{
              marginBottom: '32px',
              padding: '28px',
              backgroundColor: '#E8F5E9',
              borderRadius: '10px',
              border: '1px solid #81C784',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px' }}>
                  Generate Common Syllabus
                </h4>
                <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0 }}>
                  Merge all instructor syllabi into one unified version for ABET reporting. Common elements will be combined, differences will be highlighted.
                </p>
              </div>
              <button style={{
                backgroundColor: colors.success,
                color: 'white',
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(40,167,69,0.3)'
              }}>
                Generate Now
              </button>
            </div>

            {/* Instructor Syllabi List */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.darkGray, marginBottom: '24px', letterSpacing: '-0.2px' }}>
                Instructor Syllabi ({selectedCourse.instructors.length})
              </h3>
              
              {selectedCourse.instructors.map((instructor) => (
                <div 
                  key={instructor.id}
                  style={{
                    marginBottom: '20px',
                    padding: '24px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: 'white'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px' }}>
                        {instructor.name}
                      </div>
                      <div style={{ fontSize: '14px', color: colors.mediumGray, fontWeight: '500' }}>
                        {instructor.term}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          setSelectedInstructor(instructor);
                          setSyllabusMode('view');
                        }}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: 'white',
                          color: colors.primary,
                          border: `2px solid ${colors.primary}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedInstructor(instructor);
                          setSyllabusMode('edit');
                        }}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: 'white',
                          color: colors.primary,
                          border: `2px solid ${colors.primary}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                        <Edit size={16} />
                        Edit
                      </button>
                      <button style={{
                        padding: '10px 20px',
                        backgroundColor: colors.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Download size={16} />
                        Generate
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credits</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>3</div>
                    </div>
                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CLOs</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>5</div>
                    </div>
                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOs Mapped</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>3</div>
                    </div>
                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: colors.success }}>Complete</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Checklist Page
  const ChecklistPage = () => {
    const checklistItems = [
      { name: 'Background Information', status: 'completed', progress: 100 },
      { name: 'Criterion 1 – Students', status: 'completed', progress: 100 },
      { name: 'Criterion 2 – Program Educational Objectives', status: 'in-progress', progress: 60 },
      { name: 'Criterion 3 – Student Outcomes', status: 'in-progress', progress: 45 },
      { name: 'Criterion 4 – Continuous Improvement', status: 'in-progress', progress: 30 },
      { name: 'Criterion 5 – Curriculum', status: 'in-progress', progress: 55 },
      { name: 'Criterion 6 – Faculty', status: 'not-started', progress: 0 },
      { name: 'Criterion 7 – Facilities', status: 'not-started', progress: 0 },
      { name: 'Criterion 8 – Institutional Support', status: 'not-started', progress: 0 },
      { name: 'Appendices A & B', status: 'not-started', progress: 0 }
    ];

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
        <GlobalHeader title="ABET Accreditation System" showBackButton={false} />

        <div style={{ padding: '48px' }}>
          {/* Progress Header */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '36px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.4px' }}>Computer & Communication Engineering</h2>
                <p style={{ color: colors.mediumGray, fontSize: '15px', margin: 0, fontWeight: '500' }}>ABET Cycle 2025-2027</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '42px', fontWeight: '800', color: colors.primary, marginBottom: '4px', letterSpacing: '-1px' }}>45%</div>
                <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '14px', backgroundColor: colors.lightGray, borderRadius: '7px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <div style={{ width: '45%', height: '100%', backgroundColor: colors.primary, transition: 'width 0.3s' }}></div>
            </div>

            <div style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '12px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span>Last updated: November 25, 2025</span>
              <button
                onClick={() => setCurrentPage('fullReport')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.2px'
                }}
              >
                <FileText size={16} />
                View Full Report
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <h3 style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '700', marginBottom: '28px', letterSpacing: '-0.3px' }}>ABET Criteria Checklist</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {checklistItems.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    if (item.name.includes('Background')) setCurrentPage('background');
                    else if (item.name.includes('Criterion 1')) setCurrentPage('criterion1');
                    else if (item.name.includes('Criterion 2')) setCurrentPage('criterion2');
                    else if (item.name.includes('Criterion 3')) setCurrentPage('criterion3');
                    else if (item.name.includes('Criterion 7')) setCurrentPage('criterion7');
                    else if (item.name.includes('Criterion 8')) setCurrentPage('criterion8');
                    else if (item.name.includes('Appendices')) setCurrentPage('appendices');
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '24px', 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                >
                  {/* Status Icon */}
                  <div style={{ marginRight: '20px' }}>
                    {item.status === 'completed' && <Check size={28} color={colors.success} strokeWidth={3} />}
                    {item.status === 'in-progress' && <Clock size={28} color={colors.warning} strokeWidth={2.5} />}
                    {item.status === 'not-started' && <AlertCircle size={28} color={colors.mediumGray} strokeWidth={2} />}
                  </div>

                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ color: colors.darkGray, fontSize: '16px', fontWeight: '700', margin: 0, letterSpacing: '-0.1px' }}>{item.name}</h4>
                      <span style={{ color: colors.darkGray, fontSize: '15px', fontWeight: '700', marginRight: '20px' }}>{item.progress}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ height: '8px', backgroundColor: colors.lightGray, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${item.progress}%`, 
                        height: '100%', 
                        backgroundColor: item.status === 'completed' ? colors.success : item.status === 'in-progress' ? colors.warning : colors.mediumGray,
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button style={{ 
                    marginLeft: '24px', 
                    backgroundColor: colors.primary, 
                    color: 'white', 
                    padding: '10px 20px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    letterSpacing: '0.2px'
                  }}>
                    {item.status === 'not-started' ? 'Start' : 'View / Edit'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Full Report Page (100% completion view)
  const FullReportPage = () => {
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
        <GlobalHeader title="Full Accreditation Report" subtitle="Complete submission overview" showBackButton={true} />

        <div style={{ padding: '48px' }}>
          {/* Progress Header */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '36px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.4px' }}>Computer & Communication Engineering</h2>
                <p style={{ color: colors.mediumGray, fontSize: '15px', margin: 0, fontWeight: '500' }}>ABET Cycle 2025-2027</p>
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
  const BackgroundPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Background Information" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>Section Progress</span>
            <span style={{ color: colors.primary, fontSize: '14px', fontWeight: '700' }}>30%</span>
          </div>
          <div style={{ height: '10px', backgroundColor: colors.lightGray, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '30%', height: '100%', backgroundColor: colors.primary }}></div>
          </div>
        </div>

        {/* Save Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button style={{ 
            backgroundColor: colors.primary, 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Save size={18} />
            Save Draft
          </button>
          <button style={{ 
            backgroundColor: colors.success, 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} />
            Mark as Complete
          </button>
        </div>

        {/* Section A: Contact Information */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>A. Contact Information</h3>
              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>List the main program contact person and institutional info</p>
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
              <Upload size={16} />
              Upload Document
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Program Contact Name</label>
              <input type="text" placeholder="e.g., Dr. John Smith" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Position / Title</label>
              <input type="text" placeholder="e.g., Program Coordinator" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Office Location</label>
              <input type="text" placeholder="e.g., Engineering Building, Room 301" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Phone Number</label>
              <input type="text" placeholder="e.g., +961 1 123456" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
              <input type="email" placeholder="e.g., coordinator@aub.edu.lb" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
          </div>

          <button style={{ 
            marginTop: '16px', 
            backgroundColor: colors.lightGray, 
            color: colors.primary, 
            padding: '10px 20px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '13px', 
            fontWeight: '600' 
          }}>
            AI Extract from Document
          </button>
        </div>

        {/* Section B: Program History */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>B. Program History</h3>
              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>Describe when the program started and what changed since the last review</p>
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
              <Upload size={16} />
              Upload Document
            </button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Year Implemented</label>
              <input type="text" placeholder="e.g., 1995" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Date of Last General Review</label>
              <input type="text" placeholder="e.g., 2022" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Summary of Major Changes Since Last Review</label>
              <textarea placeholder="Describe the major curriculum changes, faculty updates, facilities improvements, etc." style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', minHeight: '120px' }} />
            </div>
          </div>

          <button style={{ 
            marginTop: '16px', 
            backgroundColor: colors.lightGray, 
            color: colors.primary, 
            padding: '10px 20px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '13px', 
            fontWeight: '600' 
          }}>
            AI Extract from Document
          </button>
        </div>

        {/* Additional sections would follow same pattern */}
        <div style={{ textAlign: 'center', padding: '32px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>
          Sections C-G follow the same layout pattern...
        </div>
      </div>
    </div>
  );

  // Criterion 1 Page
  const Criterion1Page = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 1 – Students" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>Section Progress</span>
            <span style={{ color: colors.primary, fontSize: '14px', fontWeight: '700' }}>25%</span>
          </div>
          <div style={{ height: '10px', backgroundColor: colors.lightGray, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '25%', height: '100%', backgroundColor: colors.primary }}></div>
          </div>
        </div>

        {/* Save Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button style={{ 
            backgroundColor: colors.primary, 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Save size={18} />
            Save Draft
          </button>
          <button style={{ 
            backgroundColor: colors.success, 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} />
            Mark as Complete
          </button>
        </div>

        {/* Section A */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>A. Student Admissions</h3>
              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>Describe how new students are accepted into the program</p>
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
              <Upload size={16} />
              Upload Policy
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Admission Requirements</label>
            <textarea placeholder="Describe entrance requirements (e.g., grades, SAT scores, prerequisites)" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', minHeight: '100px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Admission Process Summary</label>
            <textarea placeholder="Explain the application and selection process" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', minHeight: '100px' }} />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Transfer Pathways</label>
            <textarea placeholder="Describe any transfer pathways or agreements (if applicable)" style={{ width: '100%', padding: '11px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', minHeight: '80px' }} />
          </div>

          <button style={{ 
            marginTop: '16px', 
            backgroundColor: colors.lightGray, 
            color: colors.primary, 
            padding: '10px 20px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '13px', 
            fontWeight: '600' 
          }}>
            AI Extract from Document
          </button>
        </div>

        {/* Additional sections indicated */}
        <div style={{ textAlign: 'center', padding: '32px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>
          Sections B through G follow the same format...
        </div>
      </div>
    </div>
  );

  // Criterion 2 Page
  const Criterion2Page = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 2 – Program Educational Objectives" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page header + progress */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '22px', marginBottom: '22px', boxShadow: '0 6px 14px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>Program: Computer & Communication Engineering</div>
              <div style={{ color: colors.mediumGray, fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>Cycle: ABET 2025–2026 · Section: Criterion 2 – Program Educational Objectives</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ flex: 1, backgroundColor: colors.lightGray, borderRadius: '6px', height: '10px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                  <div style={{ width: '20%', height: '100%', background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}></div>
                </div>
                <span style={{ color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>Progress: 20%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentPage('checklist')} style={{ backgroundColor: colors.lightGray, color: colors.darkGray, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                Back to Checklist
              </button>
              <button style={{ backgroundColor: colors.primary, color: 'white', borderRadius: '8px', padding: '10px 14px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} />
                Save Draft
              </button>
              <button style={{ backgroundColor: colors.success, color: 'white', borderRadius: '8px', padding: '10px 14px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} />
                Mark as Complete
              </button>
            </div>
          </div>
        </div>

        {/* A. Mission Statement */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Mission Statement</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: show the university or program’s official mission; auto-fills from Background Information if already entered.</p>
            </div>
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              AI Extract Mission
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '14px' }}>
            <textarea placeholder="Institutional Mission Statement" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Advance knowledge, serve the community, and graduate global engineers." />
            <textarea placeholder="Program Mission Statement (if different)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Prepare CCE graduates to design impactful communication and computing systems." />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Source or Link (URL)" style={{ flex: 1, minWidth: '240px', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '14px', fontFamily: 'inherit' }} defaultValue="https://aub.edu.lb/engineering" />
            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '10px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} />
              Upload “University Strategic Plan” / “Program Mission Document”
            </button>
          </div>
        </div>

        {/* B. Program Educational Objectives */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Program Educational Objectives (PEOs)</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: list long-term objectives; links automatically to Criterion 3 → Relationship of SOs to PEOs.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} />
                Upload “PEO Review Report” / “Program Brochure”
              </button>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                AI Extract PEO Sentences
              </button>
            </div>
          </div>

          {[1, 2, 3, 4].map((peo) => (
            <div key={peo} style={{ marginTop: '14px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'center' }}>
                <div style={{ backgroundColor: colors.primary, color: 'white', borderRadius: '6px', padding: '6px 10px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>PEO {peo}</div>
                <input type="text" defaultValue={`Graduates achieve objective ${peo} within 3–5 years after graduation.`} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
              <textarea placeholder="Optional short description for this PEO" style={{ width: '100%', marginTop: '8px', minHeight: '80px', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '14px', fontFamily: 'inherit' }} defaultValue="Describes how alumni contribute to industry, research, and societal needs." />
              <input type="text" placeholder="Where is this PEO published? (URL or document name)" style={{ marginTop: '8px', width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '14px', fontFamily: 'inherit' }} defaultValue="https://aub.edu.lb/peo" />
            </div>
          ))}
        </div>

        {/* C. Consistency with Institutional Mission */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Consistency of PEOs with Institutional Mission</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: explain how objectives support the university mission.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} />
                Upload “Strategic Plan Alignment” / “Self-Review”
              </button>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                AI Extract Alignment
              </button>
            </div>
          </div>
          <textarea placeholder="How our program’s objectives align with the institutional mission" style={{ width: '100%', minHeight: '140px', marginTop: '12px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Our PEOs emphasize societal impact, innovation, and ethical practice—directly supporting institutional goals on service, research excellence, and leadership." />
        </div>

        {/* D. Program Constituencies */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Program Constituencies</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: identify who helps define or review PEOs; connected to advisory board uploads and ☰ Evidence.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} />
                Upload “Advisory Board Minutes” / “Stakeholder Feedback Report”
              </button>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                AI Identify Stakeholders
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>
            {['Students', 'Alumni', 'Employers', 'Advisory Board', 'Faculty'].map((group) => (
              <div key={group} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px', backgroundColor: colors.lightGray }}>
                <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>{group}</div>
                <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Description of how this group contributes to developing or reviewing PEOs (surveys, meetings, feedback loops).</p>
              </div>
            ))}
          </div>
        </div>

        {/* E. Process for Review of PEOs */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Process for Review of PEOs</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: describe frequency, participants, feedback collection, and changes made; links to evidence of stakeholder engagement.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} />
                Upload “PEO Review Process” / “Meeting Minutes” / “Feedback Summary”
              </button>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} />
                AI Extract Timeline & Actions
              </button>
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <textarea placeholder="Frequency of review (e.g., every 3 years)" style={{ width: '100%', minHeight: '100px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Every 3 years with mid-cycle check-ins and advisory board confirmation." />
            <textarea placeholder="Who is involved (faculty, alumni, employers, advisory board)" style={{ width: '100%', minHeight: '100px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Faculty committee, alumni reps, employer partners, advisory board members." />
            <textarea placeholder="How feedback is collected and decisions are made" style={{ width: '100%', minHeight: '100px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Surveys, annual board meetings, and focus groups feed into the curriculum committee, which approves revisions." />
            <textarea placeholder="Any changes made during the last review" style={{ width: '100%', minHeight: '100px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} defaultValue="Updated PEO 2 wording to emphasize sustainability and community impact." />
          </div>
        </div>
      </div>
    </div>
  );

  // Criterion 3 Page
  const Criterion3Page = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 3 – Student Outcomes" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>Section Progress</span>
            <span style={{ color: colors.primary, fontSize: '14px', fontWeight: '700' }}>45%</span>
          </div>
          <div style={{ height: '10px', backgroundColor: colors.lightGray, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '45%', height: '100%', backgroundColor: colors.primary }}></div>
          </div>
        </div>

        {/* Save Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button style={{ 
            backgroundColor: colors.primary, 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Save size={18} />
            Save Draft
          </button>
          <button style={{ 
            backgroundColor: colors.success, 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} />
            Mark as Complete
          </button>
        </div>

        {/* Section B: Student Outcomes */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>B. Student Outcomes</h3>
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
            <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>C. Relationship of Student Outcomes to Program Educational Objectives</h3>
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

  // Criterion 7 Page
  const Criterion7Page = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 7 – Facilities" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Criterion 7 – Facilities</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
                Full-page layout with six parts: Offices/Classrooms/Laboratories • Computing Resources • Guidance • Maintenance & Upgrading • Library Services • Overall Comments.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
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

        {/* A. Offices, Classrooms & Laboratories */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>A. Offices, Classrooms & Laboratories</h3>
          <p style={{ color: colors.mediumGray, margin: '0 0 14px 0', fontSize: '14px' }}>Text-based subsections with upload boxes and AI extraction for inventory data.</p>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', backgroundColor: colors.lightGray }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Offices</div>
            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Describe faculty, administrative, and TA offices; include size and distribution.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '10px' }}>
              <input defaultValue="Total offices: 32" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
              <input defaultValue="Avg workspace: 12 m²" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
              <input defaultValue="Student availability: posted hours" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload: Facilities Report.pdf
              </button>
              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> AI Extract counts & adequacy
              </button>
            </div>
          </div>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', backgroundColor: colors.lightGray }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Classrooms</div>
            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Table for quick data entry. Upload “Classroom Equipment List.xlsx” or “Timetable Summary.pdf.” AI fills capacities, network access, and equipment automatically.</p>
            <div style={{ marginTop: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>
                    {['Room', 'Capacity', 'Multimedia', 'Internet Access', 'Typical Use', 'Adequacy Comments'].map((h) => (
                      <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[{ room: 'ENG 203', capacity: '45', multimedia: 'Projector + Audio', internet: 'Wi‑Fi + LAN', use: 'Core lectures', adequacy: 'Ready' }, { room: 'ENG 305', capacity: '60', multimedia: 'Smart board', internet: 'Wi‑Fi', use: 'Large lectures', adequacy: 'Upgrade AV planned' }].map((row) => (
                    <tr key={row.room} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '10px' }}>{row.room}</td>
                      <td style={{ padding: '10px' }}>{row.capacity}</td>
                      <td style={{ padding: '10px' }}>{row.multimedia}</td>
                      <td style={{ padding: '10px' }}>{row.internet}</td>
                      <td style={{ padding: '10px' }}>{row.use}</td>
                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.adequacy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload equipment/timetable
              </button>
              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> AI Extract classroom details
              </button>
            </div>
          </div>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Laboratories (+ Appendix C Generator)</div>
            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Each lab row shows linked courses from ☰ Courses. Upload inventories and AI fills hardware/software lists. Generate Appendix C automatically.</p>
            <div style={{ marginTop: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>
                    {['Lab Name', 'Room', 'Category', 'Hardware List', 'Software List', 'Open Hours', 'Courses Using Lab'].map((h) => (
                      <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[{ lab: 'Embedded Systems Lab', room: 'ENG B12', cat: 'Electrical/Computer', hardware: 'Oscilloscopes, FPGA kits, logic analyzers', software: 'Keil, Vivado, MATLAB', hours: 'Mon–Fri 8:00–18:00', courses: 'EECE 320, EECE 401' }, { lab: 'Networks Lab', room: 'ENG C08', cat: 'Comm/Networking', hardware: 'Routers, switches, Wi‑Fi controllers', software: 'Packet Tracer, GNS3', hours: 'Mon–Fri 9:00–19:00', courses: 'EECE 311, EECE 350' }].map((row) => (
                    <tr key={row.lab} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '10px' }}>{row.lab}</td>
                      <td style={{ padding: '10px' }}>{row.room}</td>
                      <td style={{ padding: '10px' }}>{row.cat}</td>
                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.hardware}</td>
                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.software}</td>
                      <td style={{ padding: '10px' }}>{row.hours}</td>
                      <td style={{ padding: '10px' }}>{row.courses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Upload inventory spreadsheets
              </button>
              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> AI Extract hardware/software
              </button>
              <button style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> Generate Appendix C – Equipment List
              </button>
            </div>
          </div>
        </div>

        {/* B. Computing Resources */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Computing Resources</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe computing infrastructure beyond specific labs. Labs defined in part A appear here automatically.</p>
            </div>
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload IT Infrastructure Summary
            </button>
          </div>

          <div style={{ marginTop: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>
                  {['Resource', 'Location', 'Access Type (on-campus/VPN)', 'Hours Available', 'Adequacy Notes'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[{ resource: 'Virtual Compute Cluster', location: 'Data Center 2', access: 'VPN / Remote Desktop', hours: '24/7', adequacy: 'Handles high-load simulations; burst credits available.' }, { resource: 'Software License Server', location: 'Central IT', access: 'On-campus & VPN', hours: '24/7', adequacy: 'MATLAB, Cadence, Altium seats tracked; alerts on shortage.' }].map((row) => (
                  <tr key={row.resource} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px' }}>{row.resource}</td>
                    <td style={{ padding: '12px' }}>{row.location}</td>
                    <td style={{ padding: '12px' }}>{row.access}</td>
                    <td style={{ padding: '12px' }}>{row.hours}</td>
                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.adequacy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* C. Guidance */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Guidance</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Multi-line box for orientations/tutorials/safety training. Responsible faculty pulled from ☰ Faculty Members.</p>
            </div>
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Lab Manual.pdf
            </button>
          </div>
          <textarea defaultValue="Orientation week 1; safety checklist required before lab access; Moodle video tutorials for software; refresher every semester." style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            <select style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }}>
              {facultyMembers.map((f) => (
                <option key={f.id}>{f.name} – safety lead</option>
              ))}
            </select>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Extract training schedule
            </button>
          </div>
        </div>

        {/* D. Maintenance and Upgrading */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Maintenance and Upgrading of Facilities</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe how the program keeps tools and resources current. Labs in part A automatically appear here.</p>
            </div>
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Maintenance Plan.xlsx
            </button>
          </div>
          <textarea defaultValue="Policy: annual review with lab engineers + IT; procurement via university portal; emergency replacements within 2 weeks." style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />
          <div style={{ marginTop: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>
                  {['Facility / Lab', 'Last Upgrade', 'Next Scheduled', 'Responsible Staff', 'Notes'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[{ lab: 'Embedded Systems Lab', last: 'Aug 2024', next: 'Jul 2026', resp: 'Eng. Rami (from sidebar)', notes: 'Oscilloscopes recalibrated; add FPGA boards' }, { lab: 'Networks Lab', last: 'Jan 2023', next: 'Dec 2024', resp: 'IT Ops + CCE TA team', notes: 'VPN routers refresh aligned with cybersecurity policy' }].map((row) => (
                  <tr key={row.lab} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px' }}>{row.lab}</td>
                    <td style={{ padding: '12px' }}>{row.last}</td>
                    <td style={{ padding: '12px' }}>{row.next}</td>
                    <td style={{ padding: '12px' }}>{row.resp}</td>
                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Detect upgrade cycles
            </button>
            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Attach Procurement Policy.pdf
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
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Upload Library Summary.pdf
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '12px' }}>
            {[{ label: 'Technical collections and journals', value: 'IEEE, ACM, ASME current; 120+ titles updated yearly.' }, { label: 'Electronic databases and e-resources', value: 'Scopus, ScienceDirect, IEEE Xplore; VPN/EZproxy access.' }, { label: 'Process for faculty book requests', value: 'Online request via liaison librarian; average 2-week fulfillment.' }, { label: 'Access hours and systems (e-catalog, VPN)', value: 'Physical 8am–10pm; digital catalog 24/7; remote via VPN.' }].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>
                <textarea defaultValue={item.value} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            ))}
          </div>
          <button style={{ marginTop: '12px', backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> AI Extract titles & services
          </button>
        </div>

        {/* F. Overall Comments */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>F. Overall Comments on Facilities</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Optional fields: how facilities support student outcomes, safety/inspection, and university policy compliance.</p>
            </div>
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} /> Upload Safety Audit Report.pdf
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '12px' }}>
            {[{ label: 'Facilities support student outcomes', value: 'Laboratories align to SO 1, 2, 4; design spaces support capstone needs.' }, { label: 'Safety and inspection processes', value: 'Annual inspections; weekly safety checks logged; PPE signage posted.' }, { label: 'Compliance with university policy', value: 'Follows university lab policy; evacuation drills each semester.' }].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>
                <textarea defaultValue={item.value} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Create adequacy paragraph
            </button>
            <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Save Draft
            </button>
            <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} /> Mark as Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Criterion 8 Page
  const Criterion8Page = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Criterion 8 – Institutional Support" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Institutional Support Workspace</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Five-part layout (A–E) with uploads and AI Extract matching the dedicated page flow.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} />
                Save Draft
              </button>
              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                Mark as Complete
              </button>
            </div>
          </div>
        </div>

        {/* A. Leadership */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Leadership</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe leadership structure, adequacy, and participation in decisions. Upload org charts or policies.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} /> Organizational Chart
              </button>
              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> AI Extract hierarchy
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {[{ label: 'Leadership structure (Program Chair, Department Head, Dean)', placeholder: 'Describe leadership roles and decision-making chain.' }, { label: 'Adequacy of leadership to ensure program quality and continuity', placeholder: 'Explain how leadership supports continuity and quality assurance.' }, { label: 'How leaders participate in curriculum and faculty decisions', placeholder: 'Document leadership involvement in curriculum and faculty processes.' }].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>
                <textarea placeholder={item.placeholder} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* B. Program Budget and Financial Support */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Program Budget and Financial Support</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Four sub-parts (B1–B4) displayed as collapsible-style cards with uploads and AI summaries.</p>
            </div>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Scan financial reports
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {[{
              title: 'B1 – Budget Process and Continuity',
              desc: 'Describe how annual budget is set, approved, and monitored.',
              upload: 'Department Budget Policy.pdf',
              ai: 'AI summarize recurring vs temporary funds'
            }, {
              title: 'B2 – Teaching Support',
              desc: 'Explain support for teaching (graders, TAs, workshops, equipment).',
              upload: 'TA Assignments.xlsx',
              ai: 'AI summarize TAs, training, grants'
            }, {
              title: 'B3 – Infrastructure Funding',
              desc: 'How the university funds maintenance and lab/facility upgrades.',
              upload: 'Facilities Funding Plan.pdf',
              ai: 'AI identify funding amounts and cycles'
            }, {
              title: 'B4 – Adequacy of Resources',
              desc: 'Assess how current budget supports students achieving SOs.',
              upload: 'Annual Assessment Report.pdf',
              ai: 'AI pull students/credits/budget per student'
            }].map((card) => (
              <div key={card.title} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: colors.darkGray }}>{card.title}</div>
                    <p style={{ color: colors.mediumGray, margin: '6px 0 10px 0', fontSize: '13px' }}>{card.desc}</p>
                  </div>
                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> {card.upload}
                  </button>
                </div>
                <textarea placeholder="Enter details or paste summary" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
                <button style={{ marginTop: '10px', backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> {card.ai}
                </button>
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
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> HR Staff List.xlsx
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
                {[{ category: 'Administrative', number: '4', role: 'Program coordinator, scheduling, student records', training: 'Annual HR workshops; cross-training plan' }, { category: 'Technical', number: '6', role: 'Lab engineers, equipment upkeep', training: 'Vendor certifications; safety refreshers' }, { category: 'Instructional Assistants', number: '10', role: 'Grading, lab supervision, tutorial sessions', training: 'TA orientation; mentorship with faculty' }].map((row) => (
                  <tr key={row.category} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: colors.darkGray }}>{row.category}</td>
                    <td style={{ padding: '12px' }}>{row.number}</td>
                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.role}</td>
                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.training}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <textarea placeholder="Additional narrative on staffing adequacy and linkage to ☰ Faculty Members" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '10px' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Extract counts from HR list
            </button>
            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Attach Training Policy.pdf
            </button>
          </div>
        </div>

        {/* D. Faculty Hiring and Retention */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Faculty Hiring and Retention</h3>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Sub-sections D1 (hiring process) and D2 (retention strategies) with uploads and AI extraction.</p>
            </div>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI summarize policy
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {[{
              title: 'D1 – Hiring Process',
              placeholder: 'Describe recruitment procedure (advertising, committees, approvals).',
              upload: 'Faculty Hiring Policy.pdf',
              ai: 'AI summarize steps & timeline'
            }, {
              title: 'D2 – Retention Strategies',
              placeholder: 'Explain promotion, recognition, salary review, mentorship systems.',
              upload: 'Retention Plan.pdf',
              ai: 'AI identify key benefits & retention methods'
            }].map((card) => (
              <div key={card.title} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '800', color: colors.darkGray }}>{card.title}</div>
                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} /> {card.upload}
                  </button>
                </div>
                <textarea placeholder={card.placeholder} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '10px' }} />
                <button style={{ marginTop: '10px', backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> {card.ai}
                </button>
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
            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} /> Professional Development Policy.pdf
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {[{ label: 'Support types (sabbaticals, travel funds, workshops, seminars)', placeholder: 'List and describe available professional development supports.' }, { label: 'Process for request + approval', placeholder: 'Outline how faculty submit, approve, and track requests.' }, { label: 'Funding activity details (per year if available)', placeholder: 'Capture amounts, number of participants, and frequency.' }].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>
                <textarea placeholder={item.placeholder} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Extract activities & funding
            </button>
            <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Save Draft
            </button>
            <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} /> Mark as Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // Appendices Page
  const AppendicesPage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Appendices A & B" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Appendix Dashboard</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Course syllabi pull from ☰ Courses; faculty vitae pull from ☰ Faculty Members.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} />
                Export All
              </button>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} />
                Auto-Gather Evidence
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix A – Course Syllabi</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Auto-generated from unified syllabi; CLO→SO mapping imported from Criterion 3.</p>
              </div>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} /> Preview PDF
              </button>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {courses.map((course) => (
                <div key={course.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px', backgroundColor: colors.lightGray }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '800', color: colors.darkGray }}>{course.code} – {course.name}</div>
                      <div style={{ color: colors.mediumGray, fontSize: '13px' }}>Credits & contact hours imported from course record; topics extracted from syllabi uploads.</div>
                    </div>
                    <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} /> Generate 2-page layout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix B – Faculty Vitae</h3>
                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>CV uploads from ☰ Faculty Members feed the 10 ABET sections automatically.</p>
              </div>
              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={16} /> Generate All Vitae
              </button>
            </div>
            <div style={{ marginTop: '12px', border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Faculty Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Vitae Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyMembers.map((faculty) => (
                    <tr key={faculty.id} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: 'white' }}>
                      <td style={{ padding: '12px', fontWeight: '700', color: colors.darkGray }}>{faculty.name}</td>
                      <td style={{ padding: '12px', color: colors.mediumGray }}>{faculty.rank}</td>
                      <td style={{ padding: '12px', color: colors.success, fontWeight: '700' }}>✅ Ready</td>
                      <td style={{ padding: '12px', color: colors.mediumGray }}>Oct 2025</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Evidence Library Page
  const EvidencePage = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Evidence Library" subtitle="CCE - ABET 2025-2027" showBackButton={true} />

      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Upload Area */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center', border: `2px dashed ${colors.border}` }}>
          <Upload size={56} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h3 style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.2px' }}>Upload Evidence Files</h3>
          <p style={{ color: colors.mediumGray, fontSize: '15px', marginBottom: '24px', fontWeight: '500' }}>Drag & drop your files here or click to browse</p>
          <button style={{ backgroundColor: colors.primary, color: 'white', padding: '14px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>
            Choose Files
          </button>
          <div style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '16px', fontWeight: '500' }}>
            Supported formats: PDF, Word, Excel, Images (PNG, JPG)
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by file name..."
              style={{ width: '100%', padding: '12px 12px 12px 48px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Files Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '24px', letterSpacing: '-0.2px' }}>Uploaded Files</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '14px', textAlign: 'left', color: colors.darkGray, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>File Name</th>
                <th style={{ padding: '14px', textAlign: 'left', color: colors.darkGray, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uploaded By</th>
                <th style={{ padding: '14px', textAlign: 'left', color: colors.darkGray, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload Date</th>
                <th style={{ padding: '14px', textAlign: 'center', color: colors.darkGray, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={22} color={colors.primary} />
                    <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>Curriculum Flowchart 2025.pdf</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>Coordinator</td>
                <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>20/10/2025</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px', fontSize: '13px', fontWeight: '600' }}>View</button>
                  <button style={{ color: colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Delete</button>
                </td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={22} color={colors.primary} />
                    <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>PEO Review Report 2024.pdf</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>Coordinator</td>
                <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>10/09/2025</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px', fontSize: '13px', fontWeight: '600' }}>View</button>
                  <button style={{ color: colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Delete</button>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText size={22} color={colors.primary} />
                    <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>Advisory Board Minutes.pdf</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>Admin</td>
                <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>05/09/2025</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px', fontSize: '13px', fontWeight: '600' }}>View</button>
                  <button style={{ color: colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Page Navigation
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage />;
      case 'selection':
        return <SelectionPage />;
      case 'checklist':
        return <ChecklistPage />;
      case 'fullReport':
        return <FullReportPage />;
      case 'background':
        return <BackgroundPage />;
      case 'criterion1':
        return <Criterion1Page />;
      case 'criterion2':
        return <Criterion2Page />;
      case 'criterion3':
        return <Criterion3Page />;
      case 'criterion7':
        return <Criterion7Page />;
      case 'criterion8':
        return <Criterion8Page />;
      case 'appendices':
        return <AppendicesPage />;
      case 'evidence':
        return <EvidencePage />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <div style={{ fontFamily: fontStack }}>
      {renderPage()}
      {currentPage !== 'login' && <Sidebar />}
      {selectedFaculty && <FacultyProfileModal />}
      {selectedCourse && !selectedInstructor && <CourseSummaryModal />}
      {selectedInstructor && syllabusMode && <SyllabusModal />}
      
      {/* Navigation Controls */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: `1px solid ${colors.border}`, zIndex: 999 }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: colors.darkGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Page Navigator</div>
        <select 
          value={currentPage} 
          onChange={(e) => setCurrentPage(e.target.value)}
          style={{ width: '220px', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500', marginBottom: '12px' }}
        >
          <option value="login">Login Page</option>
          <option value="selection">Program Selection</option>
          <option value="checklist">ABET Checklist</option>
          <option value="fullReport">Full Report (100%)</option>
          <option value="background">Background Info</option>
          <option value="criterion1">Criterion 1</option>
          <option value="criterion2">Criterion 2</option>
          <option value="criterion3">Criterion 3</option>
          <option value="criterion7">Criterion 7</option>
          <option value="criterion8">Criterion 8</option>
          <option value="appendices">Appendices</option>
          <option value="evidence">Evidence Library</option>
        </select>
        {currentPage !== 'login' && (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ 
              width: '100%', 
              backgroundColor: colors.primary, 
              color: 'white', 
              padding: '10px', 
              borderRadius: '6px', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            Toggle Sidebar
          </button>
        )}
      </div>

      {/* Overlay */}
      {sidebarOpen && currentPage !== 'login' && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.4)', 
            zIndex: 999,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}
    </div>
  );
};

export default AUBAccreditationSystem;