import React, { useState } from 'react';
import { ShieldCheck, Award, Globe2, Cpu, Cog, FlaskConical, ClipboardList, CheckCircle2, Clock, Plus } from 'lucide-react';
import { colors, fontStack } from '../styles/theme';

  const SelectionPage = ({ programs, onAddProgram, onAddCycle, onOpenCycle }) => {
    const [programModalOpen, setProgramModalOpen] = useState(false);
    const [cycleModalOpen, setCycleModalOpen] = useState(false);
    const [activeProgramId, setActiveProgramId] = useState(null);
    const [programForm, setProgramForm] = useState({
      name: '',
      level: 'Undergraduate Program',
      startYear: '',
      endYear: ''
    });
    const [cycleForm, setCycleForm] = useState({ startYear: '', endYear: '' });

    const handleProgramSubmit = (event) => {
      event.preventDefault();
      if (!programForm.name || !programForm.startYear || !programForm.endYear) {
        return;
      }
      onAddProgram({
        name: programForm.name,
        level: programForm.level,
        startYear: Number(programForm.startYear),
        endYear: Number(programForm.endYear)
      });
      setProgramForm({ name: '', level: 'Undergraduate Program', startYear: '', endYear: '' });
      setProgramModalOpen(false);
    };

    const handleCycleSubmit = (event) => {
      event.preventDefault();
      if (!activeProgramId || !cycleForm.startYear || !cycleForm.endYear) {
        return;
      }
      onAddCycle(activeProgramId, {
        startYear: Number(cycleForm.startYear),
        endYear: Number(cycleForm.endYear)
      });
      setCycleForm({ startYear: '', endYear: '' });
      setCycleModalOpen(false);
      setActiveProgramId(null);
    };

    const iconSet = [Cpu, Cog, FlaskConical];

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



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>

            <button

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

            }}
            onClick={() => setProgramModalOpen(true)}
            >

              <Plus size={18} />

              Add New Program

            </button>

          </div>



          {programs.length === 0 ? (
            <div style={{ border: `1px dashed ${colors.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: colors.mediumGray, fontWeight: '600', backgroundColor: colors.lightGray }}>
              No programs yet. Add a program to start an ABET cycle.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
              {programs.map((program, index) => {
                const Icon = iconSet[index % iconSet.length];
                return (
                  <div
                    key={program.id}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: '14px',
                      padding: '28px',
                      transition: 'box-shadow 0.2s, transform 0.2s',
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
                        <div style={{ color: colors.mediumGray, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{program.level}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ color: colors.mediumGray, fontSize: '13px', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Cycles</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {program.cycles.map((cycle) => (
                          <button
                            key={cycle.id}
                            onClick={() => onOpenCycle(program.id, cycle.id)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              backgroundColor: colors.lightGray,
                              borderRadius: '8px',
                              border: `1px solid ${colors.border}`,
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontSize: '14px', color: colors.darkGray, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {cycle.overallProgress === 100 ? (
                                <CheckCircle2 size={16} color={colors.primary} />
                              ) : (
                                <Clock size={16} color={colors.warning} />
                              )}
                              ABET {cycle.startYear}-{cycle.endYear}
                            </span>
                            <span style={{ fontSize: '12px', color: colors.primary, fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: colors.softHighlight, borderRadius: '999px' }}>
                              <ShieldCheck size={14} /> {cycle.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => onOpenCycle(program.id, program.cycles[0]?.id)}
                        disabled={!program.cycles.length}
                        style={{
                          flex: 1,
                          backgroundColor: colors.primary,
                          color: 'white',
                          padding: '12px',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: program.cycles.length ? 'pointer' : 'not-allowed',
                          fontWeight: '700',
                          fontSize: '14px',
                          boxShadow: '0 10px 20px rgba(139,21,56,0.2)',
                          opacity: program.cycles.length ? 1 : 0.6
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => {
                          setActiveProgramId(program.id);
                          setCycleModalOpen(true);
                        }}
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
              })}
            </div>
          )}

        </div>

      </div>

      {programModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10,10,10,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleProgramSubmit} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${colors.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: colors.darkGray, fontSize: '22px', fontWeight: '800' }}>Add New Program</h3>
            <p style={{ color: colors.mediumGray, fontSize: '14px', marginTop: 0 }}>Specify the program level and start the first ABET cycle.</p>
            <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
              <div>
                <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Program Name</label>
                <input
                  type="text"
                  value={programForm.name}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Electrical Engineering"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '14px', backgroundColor: colors.lightGray }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Program Level</label>
                <select
                  value={programForm.level}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, level: event.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '14px', backgroundColor: colors.lightGray }}
                >
                  <option>Undergraduate Program</option>
                  <option>Graduate Program</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Start Year</label>
                  <input
                    type="number"
                    value={programForm.startYear}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, startYear: event.target.value }))}
                    placeholder="2025"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '14px', backgroundColor: colors.lightGray }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>End Year</label>
                  <input
                    type="number"
                    value={programForm.endYear}
                    onChange={(event) => setProgramForm((prev) => ({ ...prev, endYear: event.target.value }))}
                    placeholder="2027"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '14px', backgroundColor: colors.lightGray }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button type="button" onClick={() => setProgramModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: 'white', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: colors.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                Create Program
              </button>
            </div>
          </form>
        </div>
      )}

      {cycleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10,10,10,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCycleSubmit} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px', border: `1px solid ${colors.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: colors.darkGray, fontSize: '22px', fontWeight: '800' }}>Start New ABET Cycle</h3>
            <p style={{ color: colors.mediumGray, fontSize: '14px', marginTop: 0 }}>Define the accreditation cycle window.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <div>
                <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Start Year</label>
                <input
                  type="number"
                  value={cycleForm.startYear}
                  onChange={(event) => setCycleForm((prev) => ({ ...prev, startYear: event.target.value }))}
                  placeholder="2028"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '14px', backgroundColor: colors.lightGray }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: colors.darkGray, fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>End Year</label>
                <input
                  type="number"
                  value={cycleForm.endYear}
                  onChange={(event) => setCycleForm((prev) => ({ ...prev, endYear: event.target.value }))}
                  placeholder="2030"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '14px', backgroundColor: colors.lightGray }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button
                type="button"
                onClick={() => {
                  setCycleModalOpen(false);
                  setActiveProgramId(null);
                }}
                style={{ padding: '10px 18px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: colors.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                Add Cycle
              </button>
            </div>
          </form>
        </div>
      )}

    </div>

  );
  };



  // Enhanced Sidebar with Faculty, Courses, and Evidence


export default SelectionPage;
