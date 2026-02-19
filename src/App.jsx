import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { fontStack } from './styles/theme';
import { useManropeFont } from './hooks/useManropeFont';
import { apiRequest } from './utils/api';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import SelectionPage from './pages/SelectionPage';
import ChecklistPage from './pages/ChecklistPage';
import { BackgroundPage } from './pages/ReportPages';
import { Criterion1Page, Criterion2Page, Criterion3Page, Criterion4Page, Criterion5Page, Criterion6Page, Criterion7Page, Criterion8Page } from './pages/CriterionPages';
import { AppendicesPage, AppendixCPage, AppendixDPage } from './pages/AppendixPages';
import EvidencePage from './pages/EvidencePage';
import Sidebar from './components/layout/Sidebar';
import { FacultyProfileModal } from './components/modals/Modals';
import { SyllabusModal, CourseSummaryModal } from './components/modals/CourseModals';

const pageToPath = {
  login: '/login',
  register: '/register',
  selection: '/selection',
  checklist: '/checklist',
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

const cycleRequiredPages = new Set([
  'checklist',
  'background',
  'criterion1',
  'criterion2',
  'criterion3',
  'criterion4',
  'criterion5',
  'criterion6',
  'criterion7',
  'criterion8',
  'appendices',
  'appendixC',
  'appendixD',
  'evidence'
]);

const AUBAccreditationSystem = () => {
  useManropeFont();

  const navigate = useNavigate();
  const location = useLocation();
  const firstLoadRef = useRef(true);
  const initialPage = useMemo(() => pathToPage[location.pathname] || 'login', [location.pathname]);
  const [currentPage, setCurrentPageState] = useState(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facultyExpanded, setFacultyExpanded] = useState(false);
  const [soExpanded, setSoExpanded] = useState(false);
  const [cloExpanded, setCloExpanded] = useState(false);
  const [peoExpanded, setPeoExpanded] = useState(false);
  const [coursesExpanded, setCoursesExpanded] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [syllabusMode, setSyllabusMode] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', role: 'faculty_admin' });
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

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

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
      if (!isAuthPage) {
        navigate('/login', { replace: true });
        return;
      }
    }

    const token = localStorage.getItem('accessToken');
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const nextPage = pathToPage[location.pathname];
    const hasSelectedCycle = Boolean(localStorage.getItem('currentCycleId'));
    if (!token && !isAuthPage) {
      navigate('/login', { replace: true });
      return;
    }
    if (token && cycleRequiredPages.has(nextPage) && !hasSelectedCycle) {
      navigate('/selection', { replace: true });
    }
  }, [location.pathname, navigate]);

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
      setAuthError('');
      setCurrentPage('login');
      setLoginForm({ email: registerForm.email, password: '' });
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

      {isAuthenticated && currentPage !== 'login' && currentPage !== 'register' && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          facultyExpanded={facultyExpanded}
          setFacultyExpanded={setFacultyExpanded}
          soExpanded={soExpanded}
          setSoExpanded={setSoExpanded}
          cloExpanded={cloExpanded}
          setCloExpanded={setCloExpanded}
          peoExpanded={peoExpanded}
          setPeoExpanded={setPeoExpanded}
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
          setSelectedCourse={setSelectedCourse}
        />
      )}
    </div>
  );
};

export default AUBAccreditationSystem;
