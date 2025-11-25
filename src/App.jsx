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
                    else if (item.name.includes('Criterion 3')) setCurrentPage('criterion3');
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
      case 'criterion3':
        return <Criterion3Page />;
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
          <option value="criterion3">Criterion 3</option>
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