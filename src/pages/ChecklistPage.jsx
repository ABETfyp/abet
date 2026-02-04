import React from 'react';
import { Check, Clock, AlertCircle, FileText } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';

  const ChecklistPage = ({ setCurrentPage, onToggleSidebar, onBack, program, cycle }) => {
    const checklistItems = cycle?.checklist || [];
    const totalProgress = checklistItems.length
      ? Math.round(checklistItems.reduce((sum, item) => sum + item.progress, 0) / checklistItems.length)
      : 0;
    const lastUpdated = cycle?.lastUpdated ? new Date(cycle.lastUpdated).toLocaleDateString() : '—';



    return (

      <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

        <GlobalHeader title="ABET Accreditation System" showBackButton={false} onToggleSidebar={onToggleSidebar} onBack={onBack} />



        <div style={{ padding: '48px' }}>

          {/* Progress Header */}

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '36px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>

              <div>

                <h2 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.4px' }}>
                  {program?.name || 'Select a program'}
                </h2>

                <p style={{ color: colors.mediumGray, fontSize: '15px', margin: 0, fontWeight: '500' }}>
                  {cycle ? `ABET Cycle ${cycle.startYear}-${cycle.endYear}` : 'No cycle selected'}
                </p>

              </div>

              <div style={{ textAlign: 'right' }}>

                <div style={{ fontSize: '42px', fontWeight: '800', color: colors.primary, marginBottom: '4px', letterSpacing: '-1px' }}>{totalProgress}%</div>

                <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</div>

              </div>

            </div>



            {/* Progress Bar */}

            <div style={{ height: '14px', backgroundColor: colors.lightGray, borderRadius: '7px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>

              <div style={{ width: `${totalProgress}%`, height: '100%', backgroundColor: colors.primary, transition: 'width 0.3s' }}></div>

            </div>



            <div style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '12px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

              <span>Last updated: {lastUpdated}</span>

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
              {checklistItems.length === 0 && (
                <div style={{ padding: '18px', borderRadius: '10px', border: `1px dashed ${colors.border}`, color: colors.mediumGray, fontWeight: '600', textAlign: 'center', backgroundColor: colors.lightGray }}>
                  Select an ABET cycle to view its checklist sections.
                </div>
              )}

              {checklistItems.map((item, index) => {
                const status = item.progress === 100 ? 'completed' : item.progress > 0 ? 'in-progress' : 'not-started';
                return (

                <div 

                  key={index}

                  onClick={() => {

                    if (item.name.includes('Background')) setCurrentPage('background');

                    else if (item.name.includes('Criterion 1')) setCurrentPage('criterion1');

                    else if (item.name.includes('Criterion 2')) setCurrentPage('criterion2');

                    else if (item.name.includes('Criterion 3')) setCurrentPage('criterion3');

                    else if (item.name.includes('Criterion 4')) setCurrentPage('criterion4');

                    else if (item.name.includes('Criterion 5')) setCurrentPage('criterion5');

                    else if (item.name.includes('Criterion 6')) setCurrentPage('criterion6');

                    else if (item.name.includes('Criterion 7')) setCurrentPage('criterion7');

                    else if (item.name.includes('Criterion 8')) setCurrentPage('criterion8');

                    else if (item.name.includes('Appendix C')) setCurrentPage('appendixC');
                    else if (item.name.includes('Appendix D')) setCurrentPage('appendixD');
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

                    {status === 'completed' && <Check size={28} color={colors.success} strokeWidth={3} />}

                    {status === 'in-progress' && <Clock size={28} color={colors.warning} strokeWidth={2.5} />}

                    {status === 'not-started' && <AlertCircle size={28} color={colors.mediumGray} strokeWidth={2} />}

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

                        backgroundColor: status === 'completed' ? colors.success : status === 'in-progress' ? colors.warning : colors.mediumGray,

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

                    {status === 'not-started' ? 'Start' : 'View / Edit'}

                  </button>

                </div>

              );
              })}

            </div>

          </div>

        </div>

      </div>

    );

  };



  // Full Report Page (100% completion view)


export default ChecklistPage;
