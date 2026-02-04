import React, { useMemo, useState } from 'react';
import { colors, fontStack } from './styles/theme';
import { useManropeFont } from './hooks/useManropeFont';
import { apiRequest } from './utils/api';
import { LoginPage } from './pages/AuthPages';
import SelectionPage from './pages/SelectionPage';
import ChecklistPage from './pages/ChecklistPage';
import { FullReportPage, BackgroundPage } from './pages/ReportPages';
import { Criterion1Page, Criterion2Page, Criterion3Page, Criterion4Page, Criterion5Page, Criterion6Page, Criterion7Page, Criterion8Page } from './pages/CriterionPages';
import { AppendicesPage, AppendixCPage, AppendixDPage } from './pages/AppendixPages';
import EvidencePage from './pages/EvidencePage';
import Sidebar from './components/layout/Sidebar';
import { SyllabusModal, FacultyProfileModal, CourseSummaryModal } from './components/modals/Modals';

const AUBAccreditationSystem = () => {
  useManropeFont();

  const [currentPage, setCurrentPage] = useState('login');
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
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  const defaultChecklistItems = useMemo(
    () => [
      { name: 'Background Information', progress: 0 },
      { name: 'Criterion 1 – Students', progress: 0 },
      { name: 'Criterion 2 – Program Educational Objectives', progress: 0 },
      { name: 'Criterion 3 – Student Outcomes', progress: 0 },
      { name: 'Criterion 4 – Continuous Improvement', progress: 0 },
      { name: 'Criterion 5 – Curriculum', progress: 0 },
      { name: 'Criterion 6 – Faculty', progress: 0 },
      { name: 'Criterion 7 – Facilities', progress: 0 },
      { name: 'Criterion 8 – Institutional Support', progress: 0 },
      { name: 'Appendices A & B', progress: 0 },
      { name: 'Appendix C', progress: 0 },
      { name: 'Appendix D', progress: 0 }
    ],
    []
  );

  const createChecklistItems = () => defaultChecklistItems.map((item) => ({ ...item }));

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const data = await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      const role =
        data?.role ||
        data?.role_name ||
        data?.user?.role ||
        data?.user?.role_name ||
        data?.user?.role?.name ||
        data?.user?.role?.role_name;
      if (!role || !`${role}`.toLowerCase().includes('admin')) {
        throw new Error('Only ABET administrators can sign in.');
      }
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      setCurrentPage('selection');
    } catch (error) {
      setAuthError(error.message || 'Login failed');
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

  const handleAddProgram = ({ name, level, startYear, endYear }) => {
    const newProgram = {
      id: `program-${Date.now()}`,
      name,
      level,
      cycles: [
        {
          id: `cycle-${Date.now()}`,
          startYear,
          endYear,
          status: 'Planning',
          overallProgress: 0,
          lastUpdated: new Date().toISOString(),
          checklist: createChecklistItems()
        }
      ]
    };
    setPrograms((prev) => [...prev, newProgram]);
  };

  const handleAddCycle = (programId, { startYear, endYear }) => {
    setPrograms((prev) =>
      prev.map((program) => {
        if (program.id !== programId) return program;
        return {
          ...program,
          cycles: [
            ...program.cycles,
            {
              id: `cycle-${Date.now()}`,
              startYear,
              endYear,
              status: 'Planning',
              overallProgress: 0,
              lastUpdated: new Date().toISOString(),
              checklist: createChecklistItems()
            }
          ]
        };
      })
    );
  };

  const handleOpenCycle = (programId, cycleId) => {
    setSelectedProgramId(programId);
    setSelectedCycleId(cycleId);
    setCurrentPage('checklist');
  };

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
            onForgotPassword={handleForgotPassword}
          />
        );
      case 'selection':
        return (
          <SelectionPage
            programs={programs}
            onAddProgram={handleAddProgram}
            onAddCycle={handleAddCycle}
            onOpenCycle={handleOpenCycle}
          />
        );
      case 'checklist':
        return (
          <ChecklistPage
            setCurrentPage={setCurrentPage}
            onToggleSidebar={handleToggleSidebar}
            onBack={handleBackToChecklist}
            program={programs.find((program) => program.id === selectedProgramId)}
            cycle={programs
              .find((program) => program.id === selectedProgramId)
              ?.cycles.find((cycleItem) => cycleItem.id === selectedCycleId)}
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
        return <Criterion7Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'criterion8':
        return <Criterion8Page onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
      case 'appendices':
        return (
          <AppendicesPage
            setCurrentPage={setCurrentPage}
            onToggleSidebar={handleToggleSidebar}
            onBack={handleBackToChecklist}
          />
        );
      case 'appendixC':
        return <AppendixCPage onToggleSidebar={handleToggleSidebar} onBack={handleBackToChecklist} />;
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
            onForgotPassword={handleForgotPassword}
          />
        );
    }
  };

  return (
    <div style={{ fontFamily: fontStack }}>
      {renderPage()}
      {currentPage !== 'login' && (
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
