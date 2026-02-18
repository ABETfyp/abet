import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Award, Globe2, Cpu, Cog, FlaskConical, ClipboardList, CheckCircle2, Clock, Plus, Trash2, X } from 'lucide-react';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';

  const SelectionPage = ({ setCurrentPage }) => {
    const [frameworks, setFrameworks] = useState([]);
    const [selectedFramework, setSelectedFramework] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [loadingFrameworks, setLoadingFrameworks] = useState(true);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [error, setError] = useState('');
    const [programModalOpen, setProgramModalOpen] = useState(false);
    const [creatingProgram, setCreatingProgram] = useState(false);
    const [cycleModalOpen, setCycleModalOpen] = useState(false);
    const [creatingCycle, setCreatingCycle] = useState(false);
    const [programModalError, setProgramModalError] = useState('');
    const [cycleModalError, setCycleModalError] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingCycle, setDeletingCycle] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [programForm, setProgramForm] = useState({
      name: '',
      level: 'Undergraduate',
      department: 'Engineering',
      icon: 'cpu',
      initialCycleStartYear: '',
      initialCycleEndYear: ''
    });
    const [cycleForm, setCycleForm] = useState({
      programId: null,
      startYear: '',
      endYear: '',
      minStartYear: null
    });

    const currentYear = new Date().getFullYear();
    const yearOptions = useMemo(() => {
      const years = [];
      for (let year = 1900; year <= 2200; year += 1) {
        years.push(year);
      }
      return years;
    }, []);

    const parseFourDigitYear = (value) => {
      const raw = `${value ?? ''}`.trim();
      if (!/^\d{4}$/.test(raw)) {
        return null;
      }
      return Number(raw);
    };

    const authHeader = () => {
      const token = localStorage.getItem('accessToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchFrameworks = async () => {
      setLoadingFrameworks(true);
      setError('');
      try {
        const data = await apiRequest('/frameworks/', {
          headers: authHeader()
        });
        const items = data?.items || [];
        setFrameworks(items);
        const firstAvailable = items.find((item) => item.status === 'available') || items[0] || null;
        setSelectedFramework(firstAvailable?.id || null);
      } catch (err) {
        setError(err.message || 'Unable to load frameworks');
      } finally {
        setLoadingFrameworks(false);
      }
    };

    const fetchPrograms = async (frameworkId) => {
      if (!frameworkId) {
        setPrograms([]);
        return;
      }
      setLoadingPrograms(true);
      setError('');
      try {
        const data = await apiRequest(`/programs/?framework=${encodeURIComponent(frameworkId)}`, {
          headers: authHeader()
        });
        setPrograms(data?.items || []);
      } catch (err) {
        setError(err.message || 'Unable to load programs');
      } finally {
        setLoadingPrograms(false);
      }
    };

    useEffect(() => {
      fetchFrameworks();
    }, []);

    useEffect(() => {
      fetchPrograms(selectedFramework);
    }, [selectedFramework]);

    const openProgramModal = () => {
      setProgramModalError('');
      setProgramForm({
        name: '',
        level: 'Undergraduate',
        department: 'Engineering',
        icon: 'cpu',
        initialCycleStartYear: currentYear,
        initialCycleEndYear: currentYear + 2
      });
      setProgramModalOpen(true);
    };

    const handleCreateProgram = async () => {
      setProgramModalError('');
      if (!programForm.name.trim()) {
        setProgramModalError('Program name is required.');
        return;
      }
      const startYear = parseFourDigitYear(programForm.initialCycleStartYear);
      const endYear = parseFourDigitYear(programForm.initialCycleEndYear);
      if (startYear === null || endYear === null) {
        setProgramModalError('Years must be exactly 4 digits (e.g., 2026).');
        return;
      }
      if (endYear <= startYear) {
        setProgramModalError('End year must be greater than start year.');
        return;
      }

      setCreatingProgram(true);
      try {
        const createdProgram = await apiRequest('/programs/', {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            name: programForm.name.trim(),
            level: programForm.level,
            department: programForm.department,
            icon: programForm.icon,
            framework_id: selectedFramework
          })
        });
        await apiRequest(`/programs/${createdProgram.id}/cycles/`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            start_year: startYear,
            end_year: endYear,
            framework_id: selectedFramework
          })
        });
        setProgramModalOpen(false);
        await fetchPrograms(selectedFramework);
      } catch (err) {
        setProgramModalError(err.message || 'Unable to create program');
      } finally {
        setCreatingProgram(false);
      }
    };

    const getDefaultCycleYears = (cycles = []) => {
      const parsedEnds = cycles
        .map((cycle) => {
          const label = `${cycle?.label || ''}`;
          const match = label.match(/(\d{4})\D+(\d{4})/);
          return match ? Number(match[2]) : null;
        })
        .filter((year) => Number.isFinite(year));

      const startYear = parsedEnds.length > 0 ? Math.max(...parsedEnds) + 1 : currentYear;
      const endYear = startYear + 2;
      return { startYear, endYear };
    };

    const openCycleModal = (program) => {
      setCycleModalError('');
      const years = getDefaultCycleYears(program?.cycles || []);
      setCycleForm({
        programId: program?.id || null,
        startYear: years.startYear,
        endYear: years.endYear,
        minStartYear: years.startYear
      });
      setCycleModalOpen(true);
    };

    const handleCreateCycle = async () => {
      setCycleModalError('');
      if (!cycleForm.programId) {
        setCycleModalError('Program is required to create cycle.');
        return;
      }
      const startYear = parseFourDigitYear(cycleForm.startYear);
      const endYear = parseFourDigitYear(cycleForm.endYear);
      if (startYear === null || endYear === null) {
        setCycleModalError('Years must be exactly 4 digits (e.g., 2026).');
        return;
      }
      if (endYear <= startYear) {
        setCycleModalError('End year must be greater than start year.');
        return;
      }
      if (Number.isFinite(Number(cycleForm.minStartYear)) && startYear < Number(cycleForm.minStartYear)) {
        setCycleModalError(`Start year must be ${cycleForm.minStartYear} or greater for this program.`);
        return;
      }
      setCreatingCycle(true);
      try {
        await apiRequest(`/programs/${cycleForm.programId}/cycles/`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            start_year: startYear,
            end_year: endYear,
            framework_id: selectedFramework
          })
        });
        setCycleModalOpen(false);
        await fetchPrograms(selectedFramework);
      } catch (err) {
        setCycleModalError(err.message || 'Unable to create cycle');
      } finally {
        setCreatingCycle(false);
      }
    };

    const openDeleteConfirm = (programId, cycleId, cycleLabel) => {
      setDeleteTarget({ programId, cycleId, cycleLabel });
      setDeleteConfirmOpen(true);
    };

    const handleDeleteCycle = async () => {
      if (!deleteTarget) return;
      const { programId, cycleId } = deleteTarget;
      setDeletingCycle(true);
      try {
        setError('');
        await apiRequest(`/programs/${programId}/cycles/${cycleId}/`, {
          method: 'DELETE',
          headers: authHeader()
        });
        const currentCycleId = localStorage.getItem('currentCycleId');
        if (Number(currentCycleId) === Number(cycleId)) {
          localStorage.removeItem('currentCycleId');
          localStorage.removeItem('currentProgramName');
          localStorage.removeItem('currentCycleLabel');
        }
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
        await fetchPrograms(selectedFramework);
      } catch (err) {
        setError(err.message || 'Unable to delete cycle');
      } finally {
        setDeletingCycle(false);
      }
    };

    const handleOpenCycle = async (cycleId) => {
      try {
        const cycleData = await apiRequest(`/cycles/${cycleId}/`, {
          headers: authHeader()
        });
        localStorage.setItem('currentCycleId', cycleId);
        if (cycleData?.program_name) {
          localStorage.setItem('currentProgramName', cycleData.program_name);
        }
        if (cycleData?.cycle_label) {
          localStorage.setItem('currentCycleLabel', cycleData.cycle_label);
        }
        setCurrentPage('checklist');
      } catch (err) {
        setError(err.message || 'Unable to open cycle');
      }
    };

    const frameworkIcons = {
      award: Award,
      clipboard: ClipboardList,
      globe: Globe2
    };

    const programIcons = {
      cpu: Cpu,
      cog: Cog,
      flask: FlaskConical
    };

    return (

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



      <div style={{ padding: '32px clamp(16px, 4vw, 48px)', maxWidth: '1280px', margin: '0 auto' }}>

        {/* Framework Selection */}

        <div style={{

          backgroundColor: 'white',

          borderRadius: '16px',

          padding: 'clamp(20px, 4vw, 48px)',

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

          {error && (
            <div style={{ marginBottom: '18px', color: colors.danger, fontSize: '13px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {loadingFrameworks ? (
              <div style={{ color: colors.mediumGray, fontSize: '14px', fontWeight: '600' }}>Loading frameworks...</div>
            ) : (
              frameworks.map((framework) => {
                const Icon = frameworkIcons[framework.icon] || Award;
                const isAvailable = framework.status === 'available';
                const isSelected = selectedFramework === framework.id;
                return (
                  <button
                    key={framework.id}
                    disabled={!isAvailable}
                    onClick={() => {
                      if (!isAvailable) return;
                      setSelectedFramework(framework.id);
                    }}
                    style={{
                      backgroundColor: isAvailable ? colors.primary : colors.lightGray,
                      color: isAvailable ? 'white' : colors.mediumGray,
                      padding: 'clamp(20px, 3vw, 36px)',
                      borderRadius: '14px',
                      border: isAvailable ? 'none' : `2px dashed ${colors.border}`,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      textAlign: 'center',
                      boxShadow: isAvailable ? '0 14px 28px rgba(139,21,56,0.24)' : '0 6px 18px rgba(0,0,0,0.04)',
                      backdropFilter: 'blur(2px)',
                      position: 'relative',
                      overflow: 'hidden',
                      outline: isSelected ? `2px solid ${colors.primaryDark}` : 'none'
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: isAvailable ? 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 45%)' : 'none' }}></div>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '58px', height: '58px', borderRadius: '16px', backgroundColor: isAvailable ? 'rgba(255,255,255,0.16)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}>
                        <Icon size={28} color={isAvailable ? 'white' : colors.mediumGray} />
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>{framework.name}</div>
                      <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '500' }}>{framework.category}</div>
                      {!isAvailable && (
                        <div style={{ fontSize: '12px', fontWeight: '700', color: colors.mediumGray }}>Coming Soon</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          </div>

        </div>



        {/* Programs */}

        <div style={{

          backgroundColor: 'white',

          borderRadius: '16px',

          padding: 'clamp(20px, 4vw, 48px)',

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

            }}
            onClick={openProgramModal}
            disabled={!selectedFramework}
            >

              <Plus size={18} />

              Add New Program

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {loadingPrograms ? (
              <div style={{ color: colors.mediumGray, fontSize: '14px', fontWeight: '600' }}>Loading programs...</div>
            ) : (
              programs.map((program) => {
                const Icon = programIcons[program.icon] || Cpu;
                return (
                  <div
                    key={program.id}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: '14px',
                      padding: '28px',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      cursor: 'default',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'white'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: colors.softHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 style={{ color: colors.darkGray, fontSize: '19px', fontWeight: '800', margin: 0, letterSpacing: '-0.2px' }}>{program.name}</h3>
                        <div style={{ color: colors.mediumGray, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{program.level} Program</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ color: colors.mediumGray, fontSize: '13px', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Cycles</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        {(program.cycles || []).map((cycle) => (
                          <div
                            key={cycle.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 12px',
                              backgroundColor: cycle.status === 'completed' ? colors.lightGray : '#FFF8E1',
                              borderRadius: '8px',
                              border: cycle.status === 'completed' ? `1px solid ${colors.border}` : '1px solid #FFE082',
                              gap: '8px'
                            }}
                          >
                            <button
                              onClick={() => {
                                localStorage.setItem('currentProgramName', program.name);
                                localStorage.setItem('currentCycleLabel', cycle.label);
                                handleOpenCycle(cycle.id);
                              }}
                              style={{
                                flex: 1,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 0,
                                gap: '10px',
                                minWidth: 0
                              }}
                            >
                              <span style={{ fontSize: '13px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                {cycle.status === 'completed' ? (
                                  <CheckCircle2 size={16} color={colors.primary} />
                                ) : (
                                  <Clock size={16} color="#F57C00" />
                                )}
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cycle.label}</span>
                              </span>
                              {cycle.status === 'completed' ? (
                                <span style={{ fontSize: '11px', color: colors.success, fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 9px', backgroundColor: 'rgba(40,167,69,0.08)', borderRadius: '999px', flexShrink: 0 }}>
                                  <ShieldCheck size={13} /> Completed
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#F57C00', fontWeight: '800', padding: '5px 9px', backgroundColor: 'rgba(245,124,0,0.12)', borderRadius: '999px', flexShrink: 0 }}>
                                  {cycle.status === 'planning' ? 'Planning' : `${cycle.progress || 0}%`}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(program.id, cycle.id, cycle.label)}
                              style={{
                                backgroundColor: 'white',
                                border: `1px solid ${colors.border}`,
                                color: colors.danger,
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              title={`Delete ${cycle.label}`}
                              aria-label={`Delete ${cycle.label}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(program.cycles || []).length === 0 && (
                          <div style={{ fontSize: '13px', color: colors.mediumGray }}>No cycles yet.</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => openCycleModal(program)}
                        style={{
                          width: '100%',
                          backgroundColor: 'white',
                          color: colors.primary,
                          padding: '12px',
                          borderRadius: '10px',
                          border: `2px solid ${colors.primary}`,
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}
                      >
                        New Cycle
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {programModalOpen && (
        <div
          onClick={() => setProgramModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 35, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1600
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'white',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '800' }}>Add New Program</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Create a program and its first ABET cycle</div>
              </div>
              <button
                onClick={() => setProgramModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
              {programModalError && (
                <div style={{ color: colors.danger, fontSize: '13px', fontWeight: '700' }}>
                  {programModalError}
                </div>
              )}
              <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                Program Name
                <input
                  value={programForm.name}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g., Computer Engineering"
                  style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
                />
              </label>

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Level
                  <select
                    value={programForm.level}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, level: event.target.value }))}
                    style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', backgroundColor: 'white' }}
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Department
                  <input
                    value={programForm.department}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, department: event.target.value }))}
                    style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Icon
                  <select
                    value={programForm.icon}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, icon: event.target.value }))}
                    style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', backgroundColor: 'white' }}
                  >
                    <option value="cpu">CPU</option>
                    <option value="cog">Cog</option>
                    <option value="flask">Flask</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Initial Cycle Start Year
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    list="year-options"
                    value={programForm.initialCycleStartYear}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, initialCycleStartYear: event.target.value }))}
                    placeholder="YYYY"
                    style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  Initial Cycle End Year
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    list="year-options"
                    value={programForm.initialCycleEndYear}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, initialCycleEndYear: event.target.value }))}
                    placeholder="YYYY"
                    style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </label>
              </div>
            </div>

            <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
              <button
                type="button"
                onClick={() => setProgramModalOpen(false)}
                style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProgram}
                disabled={creatingProgram}
                style={{ backgroundColor: colors.primary, border: 'none', color: 'white', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: creatingProgram ? 'not-allowed' : 'pointer', opacity: creatingProgram ? 0.7 : 1 }}
              >
                {creatingProgram ? 'Creating...' : 'Create Program'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cycleModalOpen && (
        <div
          onClick={() => setCycleModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 35, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1650
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'white',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '17px', fontWeight: '800' }}>Create New Cycle</div>
              <button
                onClick={() => setCycleModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '22px', display: 'grid', gap: '14px' }}>
              {cycleModalError && (
                <div style={{ color: colors.danger, fontSize: '13px', fontWeight: '700' }}>
                  {cycleModalError}
                </div>
              )}
              {Number.isFinite(Number(cycleForm.minStartYear)) && (
                <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '600' }}>
                  Start year must be {cycleForm.minStartYear} or later to avoid overlapping existing cycles.
                </div>
              )}
              <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                Start Year
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  list="year-options"
                  value={cycleForm.startYear}
                  onChange={(event) => setCycleForm((prev) => ({ ...prev, startYear: event.target.value }))}
                  placeholder="YYYY"
                  style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '6px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                End Year
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  list="year-options"
                  value={cycleForm.endYear}
                  onChange={(event) => setCycleForm((prev) => ({ ...prev, endYear: event.target.value }))}
                  placeholder="YYYY"
                  style={{ padding: '11px 12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px' }}
                />
              </label>
            </div>

            <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
              <button
                type="button"
                onClick={() => setCycleModalOpen(false)}
                style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCycle}
                disabled={creatingCycle}
                style={{ backgroundColor: colors.primary, border: 'none', color: 'white', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: creatingCycle ? 'not-allowed' : 'pointer', opacity: creatingCycle ? 0.7 : 1 }}
              >
                {creatingCycle ? 'Creating...' : 'Create Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div
          onClick={() => {
            if (deletingCycle) return;
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 35, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1700
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'white',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '18px 22px', backgroundColor: '#fff3f3', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ color: colors.danger, fontSize: '17px', fontWeight: '800' }}>Delete Cycle?</div>
            </div>

            <div style={{ padding: '22px', color: colors.darkGray, fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{deleteTarget?.cycleLabel || 'this cycle'}</strong>? This action cannot be undone.
            </div>

            <div style={{ padding: '0 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (deletingCycle) return;
                  setDeleteConfirmOpen(false);
                  setDeleteTarget(null);
                }}
                style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCycle}
                disabled={deletingCycle}
                style={{ backgroundColor: colors.danger, border: 'none', color: 'white', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: deletingCycle ? 'not-allowed' : 'pointer', opacity: deletingCycle ? 0.7 : 1 }}
              >
                {deletingCycle ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <datalist id="year-options">
        {yearOptions.map((year) => (
          <option key={`year-option-${year}`} value={year} />
        ))}
      </datalist>

    </div>

  );
};



  // Enhanced Sidebar with Faculty, Courses, and Evidence


export default SelectionPage;
