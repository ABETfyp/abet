import React from 'react';
import { Check, CheckCircle2, FileText, Save, Upload } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';

  const FullReportPage = ({ onToggleSidebar, onBack }) => {

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

        <GlobalHeader title="Full Accreditation Report" subtitle="Complete submission overview" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



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

  const BackgroundPage = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Background Information" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



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



    // Criterion 1 Page (ensure section blocks stay balanced to avoid bracket parse errors)


export { FullReportPage, BackgroundPage };
