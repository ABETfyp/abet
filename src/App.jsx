import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { colors, fontStack } from './styles/theme';
import { useManropeFont } from './hooks/useManropeFont';
import { apiRequest } from './utils/api';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import SelectionPage from './pages/SelectionPage';
import ChecklistPage from './pages/ChecklistPage';
import { FullReportPage, BackgroundPage } from './pages/ReportPages';
import { Criterion1Page, Criterion2Page, Criterion3Page, Criterion4Page, Criterion5Page, Criterion6Page, Criterion7Page, Criterion8Page } from './pages/CriterionPages';
import { AppendicesPage, AppendixCPage, AppendixDPage } from './pages/AppendixPages';
import EvidencePage from './pages/EvidencePage';
import Sidebar from './components/layout/Sidebar';
import { SyllabusModal, FacultyProfileModal, CourseSummaryModal } from './components/modals/Modals';

const pageToPath = {
  login: '/login',
  register: '/register',
  selection: '/selection',
  checklist: '/checklist',
  fullReport: '/full-report',
  background: '/background',
  criterion1: '/criterion-1',
  criterion2: '/criterion-2',
  criterion3: '/criterion-3',
  criterion4: '/criterion-4',
  criterion5: '/criterion-5',
  criterion6: '/criterion-6',
  criterion7: '/criterion-7',
  criterion8: '/criterion-8',
  appendices: '/appendices',
  appendixC: '/appendix-c',
  appendixD: '/appendix-d',
  evidence: '/evidence'
};

const pathToPage = Object.entries(pageToPath).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

const AUBAccreditationSystem = () => {
  useManropeFont();

  const navigate = useNavigate();
  const location = useLocation();
  const initialPage = useMemo(() => pathToPage[location.pathname] || 'login', [location.pathname]);
  const [currentPage, setCurrentPageState] = useState(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facultyExpanded, setFacultyExpanded] = useState(false);
  const [coursesExpanded, setCoursesExpanded] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [syllabusMode, setSyllabusMode] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', role: 'professor' });

  const setCurrentPage = (page) => {
    const target = pageToPath[page] || '/login';
    setCurrentPageState(page);
    navigate(target);
  };

  useEffect(() => {
    const nextPage = pathToPage[location.pathname] || 'login';
    if (nextPage !== currentPage) {
      setCurrentPageState(nextPage);
    }
  }, [location.pathname, currentPage]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      setCurrentPage('selection');
    } catch (error) {
      setAuthError(error.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await apiRequest('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      const data = await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password
        })
      });
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      setCurrentPage('selection');
    } catch (error) {
      setAuthError(error.message || 'Signup failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setAuthError('Password reset is not available in-app. Please contact support at it@aub.edu.lb.');
    window.location.href = 'mailto:it@aub.edu.lb?subject=Password%20Reset%20Request';
  };

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);
  const handleBackToChecklist = () => setCurrentPage('checklist');

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            handleLogin={handleLogin}
            authLoading={authLoading}
            authError={authError}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            setAuthError={setAuthError}
            setCurrentPage={setCurrentPage}
            onForgotPassword={handleForgotPassword}
          />
        );
      case 'register':
        return (
          <RegisterPage
            handleRegister={handleRegister}
            authLoading={authLoading}
            authError={authError}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            setAuthError={setAuthError}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'selection':
        return <SelectionPage setCurrentPage={setCurrentPage} />;
      case 'checklist':
        return (
          <ChecklistPage
            setCurrentPage={setCurrentPage}
            onToggleSidebar={handleToggleSidebar}
            onBack={handleBackToChecklist}
          />
        );
      case 'fullReport':
        return <FullReportPage onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'background':
        return <BackgroundPage onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion1':
        return <Criterion1Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion2':
        return <Criterion2Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion3':
        return <Criterion3Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion4':
        return <Criterion4Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion5':
        return <Criterion5Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion6':
        return <Criterion6Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion7':
        return <Criterion7Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} setCurrentPage={setCurrentPage} />;
      case 'criterion8':
        return <Criterion8Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} setCurrentPage={setCurrentPage} />;
      case 'appendices':
        return (
          <AppendicesPage
            setCurrentPage={setCurrentPage}
            onToggleSidebar={handleToggleSidebar}
            onBack={handleBackToChecklist}
          />
        );
      case 'appendixC':
        return <AppendixCPage onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} setCurrentPage={setCurrentPage} />;
      case 'appendixD':
        return <AppendixDPage onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'evidence':
        return <EvidencePage onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      default:
        return (
          <LoginPage
            handleLogin={handleLogin}
            authLoading={authLoading}
            authError={authError}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            setAuthError={setAuthError}
            setCurrentPage={setCurrentPage}
            onForgotPassword={handleForgotPassword}
          />
        );
    }
  };

  return (
    <div style={{ fontFamily: fontStack }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={renderPage()} />
        <Route path="/register" element={renderPage()} />
        <Route path="/selection" element={renderPage()} />
        <Route path="/checklist" element={renderPage()} />
        <Route path="/full-report" element={renderPage()} />
        <Route path="/background" element={renderPage()} />
        <Route path="/criterion-1" element={renderPage()} />
        <Route path="/criterion-2" element={renderPage()} />
        <Route path="/criterion-3" element={renderPage()} />
        <Route path="/criterion-4" element={renderPage()} />
        <Route path="/criterion-5" element={renderPage()} />
        <Route path="/criterion-6" element={renderPage()} />
        <Route path="/criterion-7" element={renderPage()} />
        <Route path="/criterion-8" element={renderPage()} />
        <Route path="/appendices" element={renderPage()} />
        <Route path="/appendix-c" element={renderPage()} />
        <Route path="/appendix-d" element={renderPage()} />
        <Route path="/evidence" element={renderPage()} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {currentPage !== 'login' && currentPage !== 'register' && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          facultyExpanded={facultyExpanded}
          setFacultyExpanded={setFacultyExpanded}
          coursesExpanded={coursesExpanded}
          setCoursesExpanded={setCoursesExpanded}
          expandedCourse={expandedCourse}
          setExpandedCourse={setExpandedCourse}
          setSelectedFaculty={setSelectedFaculty}
          setSelectedCourse={setSelectedCourse}
          setSelectedInstructor={setSelectedInstructor}
          setSyllabusMode={setSyllabusMode}
          setCurrentPage={setCurrentPage}
        />
      )}
      {selectedFaculty && (
        <FacultyProfileModal
          selectedFaculty={selectedFaculty}
          setSelectedFaculty={setSelectedFaculty}
        />
      )}
      {selectedCourse && !selectedInstructor && (
        <CourseSummaryModal
          selectedCourse={selectedCourse}
          selectedInstructor={selectedInstructor}
          setSelectedCourse={setSelectedCourse}
          setSelectedInstructor={setSelectedInstructor}
          setSyllabusMode={setSyllabusMode}
        />
      )}
      {selectedInstructor && syllabusMode && (
        <SyllabusModal
          selectedInstructor={selectedInstructor}
          selectedCourse={selectedCourse}
          syllabusMode={syllabusMode}
          setSelectedInstructor={setSelectedInstructor}
          setSyllabusMode={setSyllabusMode}
        />
      )}

      {/* Navigation Controls */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: `1px solid ${colors.border}`, zIndex: 999 }}>
        <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: colors.darkGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Page Navigator</div>
        <select
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
          style={{ width: '220px', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500', marginBottom: '12px' }}
        >
          <option value="login">Login</option>
          <option value="register">Register</option>
          <option value="selection">Framework Selection</option>
          <option value="checklist">Checklist Dashboard</option>
          <option value="fullReport">Full Report</option>
          <option value="background">Background Info</option>
          <option value="criterion1">Criterion 1</option>
          <option value="criterion2">Criterion 2</option>
          <option value="criterion3">Criterion 3</option>
          <option value="criterion4">Criterion 4</option>
          <option value="criterion5">Criterion 5</option>
          <option value="criterion6">Criterion 6</option>
          <option value="criterion7">Criterion 7</option>
          <option value="criterion8">Criterion 8</option>
          <option value="appendices">Appendices A & B</option>
          <option value="appendixC">Appendix C</option>
          <option value="appendixD">Appendix D</option>
          <option value="evidence">Evidence Library</option>
        </select>
        <div style={{ fontSize: '11px', color: colors.mediumGray, fontWeight: '500' }}>Select a page to preview the UI</div>
      </div>
    </div>
  );
};

export default AUBAccreditationSystem;
