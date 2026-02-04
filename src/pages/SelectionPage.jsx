import React from 'react';
import { ShieldCheck, Award, Globe2, Cpu, Cog, FlaskConical, ClipboardList, CheckCircle2, Clock, Plus } from 'lucide-react';
import { colors, fontStack } from '../styles/theme';

  const SelectionPage = ({ setCurrentPage }) => (

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


export default SelectionPage;
