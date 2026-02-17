import React from 'react';
import { Upload, Search, FileText, Download, Eye, Trash2 } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';

  const EvidencePage = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Evidence Library" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Evidence Library</div>
              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
                Upload, organize, and review supporting documents for all ABET criteria.
              </p>
            </div>
          </div>
        </div>

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


export default EvidencePage;
