import React, { useEffect, useState } from 'react';
import { ShieldCheck, Award, Globe2, Cpu, Cog, FlaskConical, ClipboardList, CheckCircle2, Clock, Plus } from 'lucide-react';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';

  const SelectionPage = ({ setCurrentPage }) => {
    const [frameworks, setFrameworks] = useState([]);
    const [selectedFramework, setSelectedFramework] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [loadingFrameworks, setLoadingFrameworks] = useState(true);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [error, setError] = useState('');

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

    const handleCreateProgram = async () => {
      const name = window.prompt('Program name');
      if (!name) return;
      const level = window.prompt('Program level (e.g., Undergraduate)', 'Undergraduate') || 'Undergraduate';
      const department = window.prompt('Department', 'Engineering') || 'Engineering';
      const icon = window.prompt('Icon key (e.g., cpu, cog, flask)', 'cpu') || 'cpu';
      try {
        await apiRequest('/programs/', {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            name,
            level,
            department,
            icon,
            framework_id: selectedFramework
          })
        });
        await fetchPrograms(selectedFramework);
      } catch (err) {
        setError(err.message || 'Unable to create program');
      }
    };

    const handleCreateCycle = async (programId) => {
      const label = window.prompt('Cycle label (e.g., ABET 2026-2028)');
      if (!label) return;
      try {
        await apiRequest(`/programs/${programId}/cycles/`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            label,
            framework_id: selectedFramework
          })
        });
        await fetchPrograms(selectedFramework);
      } catch (err) {
        setError(err.message || 'Unable to create cycle');
      }
    };

    const handleOpenCycle = async (cycleId) => {
      try {
        await apiRequest(`/cycles/${cycleId}/`, {
          headers: authHeader()
        });
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

          {error && (
            <div style={{ marginBottom: '18px', color: colors.danger, fontSize: '13px', fontWeight: '600' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
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
                      padding: '36px',
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

            }}
            onClick={handleCreateProgram}
            disabled={!selectedFramework}
            >

              <Plus size={18} />

              Add New Program

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
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
                      cursor: 'pointer',
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(program.cycles || []).map((cycle) => (
                          <div
                            key={cycle.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              backgroundColor: cycle.status === 'completed' ? colors.lightGray : '#FFF8E1',
                              borderRadius: '8px',
                              border: cycle.status === 'completed' ? `1px solid ${colors.border}` : '1px solid #FFE082'
                            }}
                          >
                            <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {cycle.status === 'completed' ? (
                                <CheckCircle2 size={16} color={colors.primary} />
                              ) : (
                                <Clock size={16} color="#F57C00" />
                              )}
                              {cycle.label}
                            </span>
                            {cycle.status === 'completed' ? (
                              <span style={{ fontSize: '12px', color: colors.success, fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: 'rgba(40,167,69,0.08)', borderRadius: '999px' }}>
                                <ShieldCheck size={14} /> Completed
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#F57C00', fontWeight: '800', padding: '6px 10px', backgroundColor: 'rgba(245,124,0,0.12)', borderRadius: '999px' }}>
                                {cycle.status === 'planning' ? 'Planning' : `In Progress (${cycle.progress || 0}%)`}
                              </span>
                            )}
                          </div>
                        ))}
                        {(program.cycles || []).length === 0 && (
                          <div style={{ fontSize: '13px', color: colors.mediumGray }}>No cycles yet.</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => {
                          const openTarget = (program.cycles || []).find((cycle) => cycle.status !== 'completed') || program.cycles?.[0];
                          if (!openTarget) {
                            setError('No cycles available to open.');
                            return;
                          }
                          handleOpenCycle(openTarget.id);
                        }}
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
                      <button
                        onClick={() => handleCreateCycle(program.id)}
                        style={{
                          flex: 1,
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

    </div>

  );
};



  // Enhanced Sidebar with Faculty, Courses, and Evidence


export default SelectionPage;
