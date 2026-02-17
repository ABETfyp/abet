import React, { useEffect, useState } from 'react';
import { Clock, Cog, Cpu, Database, Download, Eye, FileText, FlaskConical, Plus, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { courses, facultyMembers } from '../data/sampleData';
import { apiRequest } from '../utils/api';

  const AppendixCPage = ({ onToggleSidebar, onBack, setCurrentPage }) => {
    const [equipmentRows, setEquipmentRows] = useState([
      { id: 1, name: 'Oscilloscope Tektronix MDO3', cat: 'Electronics', qty: '12', loc: 'Embedded Systems Lab', use: 'Circuits & Signals labs', service: '2025-09-01', evidence: 'Calibration Log.pdf' },
      { id: 2, name: 'FPGA Development Kits', cat: 'Digital Systems', qty: '24', loc: 'Digital Systems Lab', use: 'EECE 320 projects', service: '2025-08-01', evidence: 'Inventory Sheet.xlsx' },
      { id: 3, name: 'Cisco ISR Routers', cat: 'Networking', qty: '10', loc: 'Networks Lab', use: 'Routing & switching', service: '2025-05-01', evidence: 'Maintenance Record.pdf' },
      { id: 4, name: '3D Printer (Ultimaker)', cat: 'Prototyping', qty: '2', loc: 'Design Studio', use: 'Capstone prototypes', service: '2025-10-01', evidence: 'Service Ticket #223' }
    ]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [labsCoveredCount, setLabsCoveredCount] = useState(6);
    const [highValueAssetsCount, setHighValueAssetsCount] = useState(12);
    const [lastUpdatedLabel, setLastUpdatedLabel] = useState('Nov 2025');
    const cycleId = localStorage.getItem('currentCycleId') || 1;

    useEffect(() => {
      fetchAppendixCData();
    }, [cycleId]);

    const fetchAppendixCData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest(`/cycles/${cycleId}/appendixc/`);
        const rows = Array.isArray(result?.equipment_rows) ? result.equipment_rows : [];
        setEquipmentRows(rows.map((row) => ({
          id: row.equipment_id || Date.now() + Math.random(),
          name: row.equipment_name || '',
          cat: row.category || '',
          qty: String(row.quantity ?? ''),
          loc: row.location_lab || '',
          use: row.instructional_use || '',
          service: row.last_service_date || '',
          evidence: row.evidence_link || '',
        })));

        const appendix = result?.appendix || {};
        setLabsCoveredCount(appendix.labs_covered_count ?? 0);
        setHighValueAssetsCount(appendix.high_value_assets_count ?? 0);
        if (appendix.last_updated_date) {
          const date = new Date(appendix.last_updated_date);
          setLastUpdatedLabel(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }
      } catch (err) {
        setError(err.message || 'Failed to load Appendix C data.');
      } finally {
        setLoading(false);
      }
    };

    const handleSaveAppendixC = async () => {
      setSaving(true);
      setError(null);
      setSuccess(false);
      try {
        const payload = {
          labs_covered_count: labsCoveredCount,
          high_value_assets_count: highValueAssetsCount,
          equipment_rows: equipmentRows.map((row) => ({
            equipment_name: row.name || '',
            category: row.cat || '',
            quantity: Number.parseInt(row.qty, 10) || 0,
            location_lab: row.loc || '',
            instructional_use: row.use || '',
            last_service_date: row.service || null,
            evidence_link: row.evidence || '',
          })),
        };

        const result = await apiRequest(`/cycles/${cycleId}/appendixc/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        const rows = Array.isArray(result?.equipment_rows) ? result.equipment_rows : [];
        setEquipmentRows(rows.map((row) => ({
          id: row.equipment_id || Date.now() + Math.random(),
          name: row.equipment_name || '',
          cat: row.category || '',
          qty: String(row.quantity ?? ''),
          loc: row.location_lab || '',
          use: row.instructional_use || '',
          service: row.last_service_date || '',
          evidence: row.evidence_link || '',
        })));

        const appendix = result?.appendix || {};
        setLabsCoveredCount(appendix.labs_covered_count ?? 0);
        setHighValueAssetsCount(appendix.high_value_assets_count ?? 0);
        if (appendix.last_updated_date) {
          const date = new Date(appendix.last_updated_date);
          setLastUpdatedLabel(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }

        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err) {
        setError(err.message || 'Failed to save Appendix C data.');
      } finally {
        setSaving(false);
      }
    };

    const handleAddEquipment = () => {
      setEquipmentRows((prevRows) => [
        ...prevRows,
        {
          id: Date.now(),
          name: '',
          cat: '',
          qty: '',
          loc: '',
          use: '',
          service: '',
          evidence: '',
        }
      ]);
    };

    const handleEquipmentChange = (id, field, value) => {
      setEquipmentRows((prevRows) =>
        prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
      );
    };

    const handleRemoveEquipment = (id) => {
      setEquipmentRows((prevRows) => prevRows.filter((row) => row.id !== id));
    };

  return (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Appendix C - Equipment" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Major Equipment Inventory</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                List major pieces of equipment used by the program in support of instruction.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <button
                onClick={handleSaveAppendixC}
                disabled={saving}
                style={{ backgroundColor: saving ? '#6c757d' : colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}
              >

                <Save size={16} />

                {saving ? 'Saving...' : 'Save Draft'}

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Sparkles size={16} />

                Auto-Gather Equipment

              </button>

            </div>

          </div>

        </div>



        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>

            {[
            { label: 'Labs Covered', value: String(labsCoveredCount), icon: <FlaskConical size={18} color={colors.primary} /> },
            { label: 'Equipment Items', value: String(equipmentRows.length), icon: <Cog size={18} color={colors.primary} /> },
            { label: 'High-Value Assets', value: String(highValueAssetsCount), icon: <Cpu size={18} color={colors.primary} /> },
            { label: 'Last Updated', value: lastUpdatedLabel, icon: <Clock size={18} color={colors.primary} /> }
          ].map((stat) => (

            <div key={stat.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>

                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: colors.softHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                  {stat.icon}

                </div>

                <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stat.label}</div>

              </div>

              <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>{stat.value}</div>

            </div>

          ))}

        </div>



        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          {loading ? (
            <div style={{ color: colors.mediumGray, fontSize: '14px', fontWeight: '600' }}>Loading equipment data...</div>
          ) : null}
          {error ? (
            <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </div>
          ) : null}
          {success ? (
            <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
              Appendix C saved successfully.
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Equipment List</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Include location, instructional use, and maintenance status for major equipment.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Inventory Sheet

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract Equipment

              </button>

            </div>

          </div>



          <div style={{ marginTop: '16px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                  {['Equipment', 'Category', 'Qty', 'Location / Lab', 'Instructional Use', 'Last Service', 'Evidence', 'Actions'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {equipmentRows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        value={row.name}
                        onChange={(e) => handleEquipmentChange(row.id, 'name', e.target.value)}
                        placeholder="Equipment name"
                        type="date"
                        style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        value={row.cat}
                        onChange={(e) => handleEquipmentChange(row.id, 'cat', e.target.value)}
                        placeholder="Category"
                        style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        value={row.qty}
                        onChange={(e) => handleEquipmentChange(row.id, 'qty', e.target.value)}
                        placeholder="Qty"
                        style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px', textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        value={row.loc}
                        onChange={(e) => handleEquipmentChange(row.id, 'loc', e.target.value)}
                        placeholder="Location / Lab"
                        style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        value={row.use}
                        onChange={(e) => handleEquipmentChange(row.id, 'use', e.target.value)}
                        placeholder="Instructional use"
                        style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px' }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        value={row.service}
                        onChange={(e) => handleEquipmentChange(row.id, 'service', e.target.value)}
                        placeholder="Last service"
                        style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px' }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setCurrentPage && setCurrentPage('evidence')}
                        style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        View
                      </button>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => handleRemoveEquipment(row.id)}
                        style={{ backgroundColor: '#fff1f1', color: '#b42318', border: '1px solid #fecaca', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>



          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button onClick={handleAddEquipment} style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>

              <Plus size={14} />

              Add Equipment

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Check Coverage

            </button>

          </div>

        </div>

      </div>

    </div>

  );
};



  // Appendix D Page

  const AppendixDPage = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Appendix D - Institutional Summary" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Institutional Summary</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Provide institutional details, administrative structure, support units, credit policy, and required tables.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Download size={16} />

                Export Appendix D

              </button>

            </div>

          </div>

        </div>



        {/* 1. The Institution */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>1. The Institution</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Provide institutional identity, leadership, and accreditation history.

              </p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={16} />

              AI Populate from profile

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="1a. Name and address of the institution" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="1b. Chief executive officer (name and title)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="1c. Person submitting the Self-Study (name and title)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="1d. Institutional accreditations and evaluation dates" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* 2. Type of Control */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>2. Type of Control</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Managerial control (private/non-profit, public, denominational, etc.).</p>

            </div>

          </div>

          <textarea placeholder="Describe the type of control for the institution." style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

        </div>



        {/* 3. Educational Unit */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>3. Educational Unit</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Describe administrative chain of responsibility; include org chart if available.

              </p>

            </div>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} />

              Upload Organization Chart

            </button>

          </div>



          <textarea placeholder="Administrative chain (program director -> dean -> provost -> CEO)" style={{ width: '100%', minHeight: '130px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

        </div>



        {/* 4. Academic Support Units */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>4. Academic Support Units</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                List responsible individuals for units teaching required courses (e.g., Math, Physics).

              </p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={16} />

              Add Unit

            </button>

          </div>



          <div style={{ marginTop: '12px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Support Unit', 'Responsible Person', 'Title', 'Email / Phone'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[{ unit: 'Mathematics', name: 'Dr. Rania K.', title: 'Chair, Math Department', contact: 'r.k@aub.edu.lb' }, { unit: 'Physics', name: 'Dr. Ahmad S.', title: 'Chair, Physics Department', contact: 'a.s@aub.edu.lb' }].map((row) => (

                  <tr key={row.unit} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px', fontWeight: '700' }}>{row.unit}</td>

                    <td style={{ padding: '12px' }}>{row.name}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.title}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.contact}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>



        {/* 5. Non-academic Support Units */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>5. Non-academic Support Units</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                List responsible individuals for library, computing, placement, tutoring, etc.

              </p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={16} />

              Add Unit

            </button>

          </div>



          <div style={{ marginTop: '12px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Support Unit', 'Responsible Person', 'Title', 'Email / Phone'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[{ unit: 'Library Services', name: 'Ms. Nadine H.', title: 'Head Librarian', contact: 'n.h@aub.edu.lb' }, { unit: 'Career Services', name: 'Mr. Karim R.', title: 'Director, Career Center', contact: 'k.r@aub.edu.lb' }].map((row) => (

                  <tr key={row.unit} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px', fontWeight: '700' }}>{row.unit}</td>

                    <td style={{ padding: '12px' }}>{row.name}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.title}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.contact}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>



        {/* 6. Credit Unit */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>6. Credit Unit</h3>

          <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

            Indicate credit hour definition if different from standard semester/quarter assumptions.

          </p>

          <textarea placeholder="Describe credit hour definitions and any deviations from standard assumptions." style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

        </div>



        {/* 7. Tables */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ marginBottom: '16px' }}>

            <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>7. Tables</h3>

            <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

              Complete the enrollment and personnel tables for the program undergoing evaluation.

            </p>

          </div>



          {/* Table D-1 */}

          <div style={{ marginBottom: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table D-1. Program Enrollment and Degree Data</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Academic Year</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FT/PT</th>

                  <th colSpan={5} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Enrollment Year</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Total UG</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Total Grad</th>

                  <th colSpan={4} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Degrees Awarded</th>

                </tr>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  {['1st', '2nd', '3rd', '4th', '5th'].map((h) => (

                    <th key={h} style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  {['Associates', 'Bachelors', 'Masters', 'Doctorates'].map((h) => (

                    <th key={h} style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[

                  { year: 'Current', type: 'FT', y1: '65', y2: '58', y3: '54', y4: '48', y5: '', ug: '225', grad: '18', a: '0', b: '45', m: '10', d: '0' },

                  { year: 'Current', type: 'PT', y1: '6', y2: '5', y3: '3', y4: '2', y5: '', ug: '16', grad: '2', a: '0', b: '3', m: '1', d: '0' },

                  { year: '1', type: 'FT', y1: '60', y2: '55', y3: '50', y4: '46', y5: '', ug: '211', grad: '16', a: '0', b: '42', m: '9', d: '0' },

                  { year: '1', type: 'PT', y1: '5', y2: '4', y3: '3', y4: '2', y5: '', ug: '14', grad: '1', a: '0', b: '2', m: '1', d: '0' }

                ].map((row, idx) => (

                  <tr key={`${row.year}-${row.type}-${idx}`} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.year}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.type}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.y1}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.y2}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.y3}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.y4}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.y5}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.ug}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.grad}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.a}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.b}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.m}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.d}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>



          {/* Table D-2 */}

          <div style={{ overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table D-2. Personnel</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Employment Category</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FT</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>PT</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FTE</th>

                </tr>

              </thead>

              <tbody>

                {[

                  { cat: 'Administrative', ft: '2', pt: '0', fte: '2.0' },

                  { cat: 'Faculty (tenure-track)', ft: '12', pt: '0', fte: '12.0' },

                  { cat: 'Other Faculty (excluding student assistants)', ft: '3', pt: '2', fte: '3.5' },

                  { cat: 'Student Teaching Assistants', ft: '0', pt: '10', fte: '2.5' },

                  { cat: 'Technicians/Specialists', ft: '4', pt: '1', fte: '4.5' },

                  { cat: 'Office/Clerical Employees', ft: '3', pt: '0', fte: '3.0' },

                  { cat: 'Others', ft: '1', pt: '0', fte: '1.0' }

                ].map((row) => (

                  <tr key={row.cat} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.cat}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.ft}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.pt}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.fte}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>

  );



  // Appendices Page

  const AppendicesPage = ({ setCurrentPage, onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Appendices A & B" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Appendix Dashboard</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Course syllabi pull from the Courses sidebar; faculty vitae pull from Faculty Members.</p>

            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Download size={16} />

                Export All

              </button>

              <button

                onClick={() => setCurrentPage('appendixC')}

                style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}

              >

                <Database size={16} />

                Appendix C - Equipment

              </button>

              <button

                onClick={() => setCurrentPage('appendixD')}

                style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}

              >

                <FileText size={16} />

                Appendix D - Institutional Summary

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Sparkles size={16} />

                Auto-Gather Evidence

              </button>

            </div>

          </div>

        </div>



        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

              <div>

                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix A – Course Syllabi</h3>

                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Auto-generated from unified syllabi; CLO→SO mapping imported from Criterion 3.</p>

              </div>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Eye size={16} /> Preview PDF

              </button>

            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {courses.map((course) => (

                <div key={course.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px', backgroundColor: colors.lightGray }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <div>

                      <div style={{ fontWeight: '800', color: colors.darkGray }}>{course.code} – {course.name}</div>

                      <div style={{ color: colors.mediumGray, fontSize: '13px' }}>Credits & contact hours imported from course record; topics extracted from syllabi uploads.</div>

                    </div>

                    <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                      <Sparkles size={14} /> Generate 2-page layout

                    </button>

                  </div>

                </div>

              ))}

            </div>

          </div>



          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

              <div>

                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix B – Faculty Vitae</h3>

                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>CV uploads from the Faculty Members sidebar feed the 10 ABET sections automatically.</p>

              </div>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Download size={16} /> Generate All Vitae

              </button>

            </div>

            <div style={{ marginTop: '12px', border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>

                <thead>

                  <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Faculty Name</th>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Vitae Status</th>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Last Updated</th>

                  </tr>

                </thead>

                <tbody>

                  {facultyMembers.map((faculty) => (

                    <tr key={faculty.id} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: 'white' }}>

                      <td style={{ padding: '12px', fontWeight: '700', color: colors.darkGray }}>{faculty.name}</td>

                      <td style={{ padding: '12px', color: colors.mediumGray }}>{faculty.rank}</td>

                      <td style={{ padding: '12px', color: colors.success, fontWeight: '700' }}>Ready</td>

                      <td style={{ padding: '12px', color: colors.mediumGray }}>Oct 2025</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </div>

  );



  // Evidence Library Page


export { AppendicesPage, AppendixCPage, AppendixDPage };
