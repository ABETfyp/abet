import React from 'react';
import { Upload, Download, Save, Check, ClipboardList, FileText, Plus, Edit, Eye, Sparkles } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';

  const courses = [
    { id: 'cce-210', code: 'EECE 210', name: 'Circuits I' },
    { id: 'cce-320', code: 'EECE 320', name: 'Digital Systems' },
    { id: 'math-201', code: 'MATH 201', name: 'Calculus I' }
  ];

  const facultyMembers = [
    { id: 'f-1', name: 'Dr. Rami Khalil', rank: 'Associate Professor', department: 'Electrical Engineering' },
    { id: 'f-2', name: 'Dr. Lina Saab', rank: 'Assistant Professor', department: 'Computer Engineering' },
    { id: 'f-3', name: 'Dr. Omar Taha', rank: 'Professor', department: 'Mechanical Engineering' }
  ];

  const Criterion1Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 1 – Students" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1300px', margin: '0 auto' }}>

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '24px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

 

        </div>



        {/* A. Student Admissions */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Student Admissions</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: describe how new students are accepted into the program.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload admission policy / catalog / handbook

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract admissions summary

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Admission Requirements (e.g., grades, entrance exams)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Admission Process Summary (e.g., online application, interview, etc.)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Transfer Pathways (if applicable)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* B. Evaluating Student Performance */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Evaluating Student Performance</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: explain how the program tracks and evaluates student progress.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload assessment procedures / advising guidelines

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract performance rules

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Process for evaluating academic performance" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="How prerequisites are verified" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="What happens when prerequisites are not met" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* C. Transfer Students and Transfer Courses */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Transfer Students and Transfer Courses</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: describe how transfer students and courses are handled.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload transfer policy / articulation agreements

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract transfer process

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Transfer policy summary" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Evaluation process for transfer credits" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="State or institutional articulation agreements" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* D. Advising and Career Guidance */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Advising and Career Guidance</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: summarize how students are advised academically and professionally.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload advising policy / career center overview

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract advising details

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Who provides advising (faculty, department, college advisor, etc.)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="How often advising sessions occur" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Description of career guidance services" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: aligns with advising resources and evidence already uploaded; can reuse data from faculty and career center materials.</p>

        </div>



        {/* E. Work in Lieu of Courses */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Work in Lieu of Courses</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: explain how students can get credit for prior learning or experiences.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload institutional credit policy / regulations

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract substitutions

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Policies for advanced placement, test-out, dual enrollment, or work experience" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Approval process and documentation required" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: aligns with advising resources and evidence already uploaded; can reuse data from faculty and career center materials.</p>

        </div>



        {/* F. Graduation Requirements */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            marginBottom: '18px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>F. Graduation Requirements</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: explain what students must complete to graduate.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload graduation requirements / catalog

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract graduation rules

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Minimum required credits" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Required GPA or standing" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="List of essential courses / categories" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Degree name (e.g., Bachelor of Engineering in CCE)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: pulls total credits and curriculum details directly from Curriculum Overview in Background Info and Courses section (Table 5-1).</p>

        </div>



        {/* G. Transcripts of Recent Graduates */}

        <div

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            padding: '26px',

            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',

            border: `1px solid ${colors.border}`

          }}

        >

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>G. Transcripts of Recent Graduates</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: mention how graduate transcripts are provided and how program options appear on them.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload anonymized sample transcripts

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract transcript details

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Explanation of transcript format" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Statement of how degree/program name appears" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: colors.lightGray }}>

              <input type="checkbox" id="initialAccreditation" />

              <label htmlFor="initialAccreditation" style={{ color: colors.darkGray, fontWeight: '600' }}>Initial Accreditation (if first cycle)</label>

            </div>

          </div>

        </div>

      </div>

    </div>

  );



  // Criterion 2 Page

  const Criterion2Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 2 – Program Educational Objectives" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1300px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Program Educational Objectives Workspace</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Sections A–E with editable fields, uploads, and AI auto-fill support for mission, PEOs, alignment, constituencies, and review process.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>Computer & Communication Engineering</span> • Cycle: <span style={{ color: colors.primary }}>ABET 2025–2026</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark as Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Mission Statement */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Mission Statement</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: show the university or program mission statement with source or link.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Strategic Plan / Mission Doc

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract mission

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Institutional Mission Statement" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Program Mission Statement (if different)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Source or link (published URL)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: auto-fills from Background Information if already captured.</p>

        </div>



        {/* B. Program Educational Objectives */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Program Educational Objectives (PEOs)</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: list long-term objectives and where they are published.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload PEO Review Report / Brochure

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract PEOs

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Editable list of PEOs" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Short descriptions under each objective (optional)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Where PEOs are published (URL or document name)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: links later to Criterion 3 mapping (Student Outcomes → PEOs).</p>

        </div>



        {/* C. Consistency with Institutional Mission */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Consistency of PEOs with Institutional Mission</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: explain how objectives support the university mission.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Strategic Alignment Docs

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Summarize alignment

              </button>

            </div>

          </div>



          <textarea placeholder="How our program’s objectives align with the institutional mission" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }} />

        </div>



        {/* D. Program Constituencies */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Program Constituencies</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: identify constituencies and describe how each contributes to PEOs.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Advisory Minutes / Stakeholder Reports

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Identify constituencies

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="List of constituencies (students, alumni, employers, faculty, advisory board, etc.)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="How each group contributes to developing or reviewing PEOs" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: can pull stakeholder names from Evidence Uploads and sidebar lists.</p>

        </div>



        {/* E. Process for Review of PEOs */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Process for Review of PEOs</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Purpose: describe review cadence, participants, feedback collection, and changes.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload review process documents

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract timeline & actions

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Frequency of review (e.g., every 3 years)" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Who is involved (faculty, alumni, employers, advisory board)" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="How feedback is collected and decisions are made" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Changes made during the last review" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

          <p style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '10px' }}>Connected Feature: links to stakeholder evidence and previous PEO versions.</p>

        </div>

      </div>

    </div>

  );

// Criterion 3 Page

  const Criterion3Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 3 – Student Outcomes" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Progress */}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>

            <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>Section Progress</span>

            <span style={{ color: colors.primary, fontSize: '14px', fontWeight: '700' }}>45%</span>

          </div>

          <div style={{ height: '10px', backgroundColor: colors.lightGray, borderRadius: '5px', overflow: 'hidden' }}>

            <div style={{ width: '45%', height: '100%', backgroundColor: colors.primary }}></div>

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



        {/* Section B: Student Outcomes */}

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>

            <div>

              <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>B. Student Outcomes</h3>

              <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>List official Student Outcomes and connect them with course CLOs</p>

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

              <Plus size={16} />

              Add New Outcome

            </button>

          </div>



          {/* SO Cards */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* SO 1 */}

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '24px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>

                <div style={{ flex: 1 }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>

                    <span style={{ backgroundColor: colors.primary, color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>SO 1</span>

                    <input type="text" value="Ability to apply knowledge of math, science and engineering" style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                  </div>

                </div>

                <button style={{ marginLeft: '12px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>

                  <Edit size={14} />

                  Edit

                </button>

              </div>



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>

                <div>

                  <div style={{ color: colors.darkGray, fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Linked Courses</div>

                  <div style={{ fontSize: '13px', color: colors.mediumGray }}>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>EECE 210</div>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>EECE 320</div>

                    <div style={{ fontWeight: '500' }}>EECE 330</div>

                  </div>

                </div>

                <div>

                  <div style={{ color: colors.darkGray, fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CLOs Covered</div>

                  <div style={{ fontSize: '13px', color: colors.mediumGray }}>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>CLO 1, CLO 3</div>

                    <div style={{ marginBottom: '6px', fontWeight: '500' }}>CLO 2</div>

                    <div style={{ fontWeight: '500' }}>CLO 1, CLO 4</div>

                  </div>

                </div>

                <div>

                  <div style={{ color: colors.darkGray, fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evidence</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                    <a href="#" style={{ fontSize: '13px', color: colors.primary, textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>

                      <FileText size={14} />

                      Assessment Matrix.pdf

                    </a>

                    <button style={{ fontSize: '12px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontWeight: '600' }}>

                      + Upload Evidence

                    </button>

                  </div>

                </div>

              </div>



              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>

                <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>

                  Link Courses

                </button>

                <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>

                  AI Auto-Map

                </button>

              </div>

            </div>

          </div>

        </div>



        {/* Section C: SO to PEO Mapping */}

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ marginBottom: '24px' }}>

            <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.2px' }}>C. Relationship of Student Outcomes to Program Educational Objectives</h3>

            <p style={{ color: colors.mediumGray, fontSize: '14px', margin: 0 }}>Show how SOs help graduates reach the PEOs</p>

          </div>



          {/* Mapping Matrix */}

          <div style={{ overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                  <th style={{ padding: '14px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>Student Outcome</th>

                  <th style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>PEO 1</th>

                  <th style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>PEO 2</th>

                  <th style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>PEO 3</th>

                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '700' }}>PEO 4</th>

                </tr>

              </thead>

              <tbody>

                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>

                  <td style={{ padding: '14px', borderRight: `1px solid ${colors.border}`, fontWeight: '600' }}>SO 1</td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center' }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                </tr>

                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>

                  <td style={{ padding: '14px', borderRight: `1px solid ${colors.border}`, fontWeight: '600' }}>SO 2</td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>

                    <input type="checkbox" checked style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                  <td style={{ padding: '14px', textAlign: 'center' }}>

                    <input type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer' }} />

                  </td>

                </tr>

              </tbody>

            </table>

          </div>



          <button style={{ 

            marginTop: '20px', 

            backgroundColor: colors.lightGray, 

            color: colors.primary, 

            padding: '10px 20px', 

            borderRadius: '6px', 

            border: 'none', 

            cursor: 'pointer', 

            fontSize: '13px', 

            fontWeight: '600' 

          }}>

            AI Auto-Generate Matrix

          </button>

        </div>

      </div>

    </div>

  );



  // Criterion 4 Page

  const Criterion4Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 4 - Continuous Improvement" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Assessment, Evaluation, and Continuous Improvement</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Document assessment processes, evaluation results, attainment levels, and how evidence drives program improvements.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>Computer & Communication Engineering</span> - Cycle: <span style={{ color: colors.primary }}>ABET 2025-2026</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Student Outcomes */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Student Outcomes</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Assessment processes, frequency, attainment targets, evaluation summaries, and how results are documented.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Assessment Plan / Instruments

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract processes & targets

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="A1. Assessment processes used (exam questions, projects, portfolios, surveys, etc.)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A2. Frequency of assessment processes (termly, annually, multi-year cycle)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A5. Documentation and data storage (repositories, dashboards, evidence library)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>



          <div style={{ marginTop: '18px', backgroundColor: colors.lightGray, borderRadius: '10px', padding: '16px', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>

              <ClipboardList size={18} color={colors.primary} />

              <div style={{ fontWeight: '800', color: colors.darkGray }}>A3-A4. Outcome Attainment Targets and Evaluation Summary</div>

            </div>

            <div style={{ overflowX: 'auto' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

                <thead>

                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                    {['Student Outcome', 'Assessment Evidence', 'Target Attainment', 'Evaluation Summary', 'Where Stored'].map((header) => (

                      <th key={header} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{header}</th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {[

                    { so: 'SO 1', evidence: 'Direct: Exam Q4, Lab 3; Indirect: Exit Survey', target: '70%+ at level 3', summary: '78% met target, minor gaps in Lab 3', stored: 'Evidence Library / SO1' },

                    { so: 'SO 2', evidence: 'Capstone rubric, design review', target: '75%+ at level 3', summary: '72% slightly below target, action planned', stored: 'Assessment Drive / Capstone' },

                    { so: 'SO 3', evidence: 'Oral presentations, peer review', target: '80%+ at level 3', summary: '84% met target', stored: 'Evidence Library / SO3' }

                  ].map((row) => (

                    <tr key={row.so} style={{ borderBottom: `1px solid ${colors.border}` }}>

                      <td style={{ padding: '10px', fontWeight: '700' }}>{row.so}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.evidence}</td>

                      <td style={{ padding: '10px' }}>{row.target}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.summary}</td>

                      <td style={{ padding: '10px' }}>{row.stored}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Plus size={14} />

                Add Outcome Row

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} />

                AI Summarize attainment

              </button>

            </div>

            <p style={{ color: colors.mediumGray, fontSize: '12px', marginTop: '10px' }}>

              Note: When courses are shared across programs, attach disaggregated outcome data per program.

            </p>

          </div>

        </div>



        {/* B. Continuous Improvement */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Continuous Improvement</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Show how evaluation results are used to improve the program and the outcomes of those changes.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload CI Logs / Meeting Minutes

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract actions

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="How evaluation results are used as input for improvement decisions" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Recent changes implemented and their impact (if re-assessed)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Future improvement plans and brief rationale" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>



          <div style={{ marginTop: '18px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                  {['Year', 'Trigger', 'Action Taken', 'Status', 'Re-assessment Result'].map((header) => (

                    <th key={header} style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', fontWeight: '700' }}>{header}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[

                  { year: '2024', trigger: 'SO2 below target', action: 'Revised lab rubric and added tutorial', status: 'Implemented', result: 'SO2 +5% next cycle' },

                  { year: '2025', trigger: 'Advisory board feedback', action: 'Added systems verification module', status: 'In progress', result: 'Pending' }

                ].map((row) => (

                  <tr key={row.year} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px', fontWeight: '700' }}>{row.year}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.trigger}</td>

                    <td style={{ padding: '12px' }}>{row.action}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.status}</td>

                    <td style={{ padding: '12px' }}>{row.result}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px' }}>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Improvement Action

            </button>

          </div>

        </div>



        {/* C. Additional Information */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Additional Information</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Assessment instruments, meeting minutes, and supporting materials available for the visit.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Supporting Evidence

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Check completeness

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '14px' }}>

            {[

              'Assessment instruments (exams, rubrics, surveys)',

              'Meeting minutes where results were evaluated',

              'Advisory board recommendations',

              'Disaggregated data by program'

            ].map((item) => (

              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: '8px', backgroundColor: colors.lightGray }}>

                <input type="checkbox" />

                <span style={{ color: colors.darkGray, fontWeight: '600', fontSize: '13px' }}>{item}</span>

              </div>

            ))}

          </div>



          <textarea placeholder="Notes for on-site review (where files are located, access instructions, etc.)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }} />

        </div>

      </div>

    </div>

  );



  const PageTitleCard = ({ title, subtitle }) => (

    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '18px 24px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

      <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>{title}</div>

      {subtitle && (

        <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '13px', fontWeight: '500' }}>

          {subtitle}

        </p>

      )}

    </div>

  );



  // Criterion 5 Page

  const Criterion5Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 5 - Curriculum" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1500px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Program Curriculum, Syllabi, and Evidence</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Complete Table 5-1, document alignment with PEOs and SOs, and attach curriculum evidence and syllabi.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>Computer & Communication Engineering</span> - Cycle: <span style={{ color: colors.primary }}>ABET 2025-2026</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Program Curriculum */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Program Curriculum</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Provide the plan of study, assessment of curriculum alignment, prerequisite flowchart, and curriculum evidence.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Plan of Study / Flowchart

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract curriculum data

              </button>

            </div>

          </div>



          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>

            <div style={{ flex: '1 1 240px', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: colors.lightGray }}>

              <div style={{ fontSize: '12px', fontWeight: '700', color: colors.mediumGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Calendar</div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: colors.darkGray }}>

                  <input type="radio" name="calendarType" defaultChecked />

                  Semester

                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: colors.darkGray }}>

                  <input type="radio" name="calendarType" />

                  Quarter

                </label>

              </div>

            </div>

            <div style={{ flex: '2 1 360px', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: colors.lightGray }}>

              <div style={{ fontSize: '12px', fontWeight: '700', color: colors.mediumGray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Curricular Paths / Options</div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>

                <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px' }}>General Track</button>

                <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                  <Plus size={12} />

                  Add Path

                </button>

              </div>

            </div>

          </div>



          {/* Table 5-1 */}

          <div style={{ marginTop: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table 5-1 Curriculum</div>

              <div style={{ color: colors.mediumGray, fontSize: '12px' }}>List all courses by term, include subject areas, offerings, and max enrollments.</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Course (Dept, No., Title)</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>R/E/SE</th>

                  <th colSpan={3} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Subject Area (Credit Hours)</th>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Last Two Terms Offered</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Max Section Enrollment (Last Two Terms)</th>

                </tr>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Math & Basic Sciences</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Engineering Topics</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Other</th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                </tr>

              </thead>

              <tbody>

                {[

                  { course: 'MATH 201 Calculus I', type: 'R', mbs: '3', eng: '', other: '', terms: 'Fall 2024, Fall 2025', max: '80' },

                  { course: 'PHYS 210 Physics I', type: 'R', mbs: '3', eng: '', other: '', terms: 'Fall 2024, Fall 2025', max: '70' },

                  { course: 'EECE 210 Circuits I', type: 'R', mbs: '', eng: '3', other: '', terms: 'Fall 2024, Fall 2025', max: '60' },

                  { course: 'EECE 320 Digital Systems', type: 'R', mbs: '', eng: '3', other: '', terms: 'Spring 2025, Spring 2026', max: '55' },

                  { course: 'HUMN 201 Ethics', type: 'R', mbs: '', eng: '', other: '3', terms: 'Fall 2024, Fall 2025', max: '90' }

                ].map((row) => (

                  <tr key={row.course} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.course}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.type}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.mbs}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.eng}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.other}</td>

                    <td style={{ padding: '10px' }}>{row.terms}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.max}</td>

                  </tr>

                ))}

                <tr style={{ backgroundColor: colors.lightGray }}>

                  <td style={{ padding: '10px', fontWeight: '700' }}>Totals (semester credit hours)</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>33</td>

                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>48</td>

                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>24</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px' }}></td>

                </tr>

                <tr>

                  <td style={{ padding: '10px', color: colors.mediumGray }}>Minimum semester credit hours</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px', textAlign: 'center', color: colors.mediumGray }}>30 hours</td>

                  <td style={{ padding: '10px', textAlign: 'center', color: colors.mediumGray }}>45 hours</td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px' }}></td>

                  <td style={{ padding: '10px' }}></td>

                </tr>

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Course Row

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Fill Table 5-1

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '18px' }}>

            <textarea placeholder="A2. How the curriculum aligns with program educational objectives" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A3. How the curriculum and prerequisites support student outcomes" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A5. Hours/depth by subject area (Math & Basic Sciences, Engineering Topics)" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A6. Broad education component and how it complements technical content" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>



          <div style={{ marginTop: '18px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: colors.lightGray }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>

              <FileText size={18} color={colors.primary} />

              <div style={{ fontWeight: '800', color: colors.darkGray }}>A4. Prerequisite Flowchart / Worksheet</div>

            </div>

            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Attach a flowchart illustrating prerequisites for required courses.</p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={14} />

                Upload Flowchart

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} />

                AI Extract prerequisites

              </button>

            </div>

          </div>



          <div style={{ marginTop: '18px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px', backgroundColor: colors.lightGray }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>

              <ClipboardList size={18} color={colors.primary} />

              <div style={{ fontWeight: '800', color: colors.darkGray }}>A7. Culminating Major Design Experience</div>

            </div>

            <textarea placeholder="Describe the culminating design experience, standards used, and design constraints." style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <div style={{ marginTop: '12px', overflowX: 'auto' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

                <thead>

                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                    {['Project Title', 'Team / Identifier', 'Year'].map((header) => (

                      <th key={header} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{header}</th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {[

                    { title: 'Smart Campus Energy Monitor', team: 'Team A', year: '2025' },

                    { title: 'Low-Power IoT Gateway', team: 'Team B', year: '2025' }

                  ].map((row) => (

                    <tr key={`${row.title}-${row.team}`} style={{ borderBottom: `1px solid ${colors.border}` }}>

                      <td style={{ padding: '10px' }}>{row.title}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.team}</td>

                      <td style={{ padding: '10px' }}>{row.year}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <button style={{ marginTop: '10px', backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Project Title

            </button>

          </div>



          <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>

            <textarea placeholder="A8. Cooperative education: academic component and evaluation by faculty (if applicable)" style={{ width: '100%', minHeight: '130px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="A9. Materials available for review during/prior to visit (worksamples, exams, rubrics, etc.)" style={{ width: '100%', minHeight: '130px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* B. Course Syllabi */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Course Syllabi</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                In Appendix A, include syllabi for courses that satisfy mathematics, science, and discipline-specific requirements.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Syllabi Pack

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Check coverage

              </button>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            {courses.map((course) => (

              <div key={course.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

                <div style={{ fontWeight: '700', color: colors.primary, marginBottom: '6px' }}>{course.code}</div>

                <div style={{ color: colors.darkGray, fontWeight: '600', marginBottom: '10px' }}>{course.name}</div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                    <Eye size={12} />

                    View Syllabus

                  </button>

                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                    <Upload size={12} />

                    Upload

                  </button>

                </div>

              </div>

            ))}

          </div>



          <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Course Syllabus

            </button>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Download size={14} />

              Export Appendix A Index

            </button>

          </div>

        </div>

      </div>

    </div>

  );



  // Criterion 6 Page

  const Criterion6Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 6 - Faculty" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1500px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Faculty Qualifications, Workload, and Roles</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Document faculty credentials, workload, size, professional development, and governance responsibilities.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <div style={{ backgroundColor: colors.lightGray, borderRadius: '8px', padding: '10px 14px', border: `1px solid ${colors.border}`, color: colors.darkGray, fontWeight: '700', fontSize: '13px' }}>

                Program: <span style={{ color: colors.primary }}>Computer & Communication Engineering</span> - Cycle: <span style={{ color: colors.primary }}>ABET 2025-2026</span>

              </div>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Faculty Qualifications */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Faculty Qualifications</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Describe faculty credentials and coverage of curricular areas. Include resumes in Appendix B.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Faculty CVs (Appendix B)

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract credentials

              </button>

            </div>

          </div>



          <textarea

            placeholder="Narrative on faculty composition, size, credentials, and experience adequacy for the curriculum and program criteria."

            style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }}

          />



          <div style={{ marginTop: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table 6-1. Faculty Qualifications</div>

              <div style={{ color: colors.mediumGray, fontSize: '12px' }}>Complete for each faculty member; update at time of visit.</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Faculty Name</th>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Highest Degree Earned (Field, Year)</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Rank</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Academic Appointment</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FT/PT</th>

                  <th colSpan={4} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Years of Experience</th>

                </tr>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Govt/Ind. Practice</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Teaching</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>This Institution</th>

                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Prof. Reg./Cert.</th>

                </tr>

              </thead>

              <tbody>

                {[

                  { name: 'Dr. Imad Moukadam', degree: 'PhD EE, 2010', rank: 'Professor', appoint: 'Tenured', ftpt: 'FT', gov: '6', teach: '14', inst: '10', reg: 'PE' },

                  { name: 'Dr. Lina Saab', degree: 'PhD CCE, 2012', rank: 'Associate Prof.', appoint: 'Tenure-track', ftpt: 'FT', gov: '4', teach: '12', inst: '8', reg: 'None' },

                  { name: 'Dr. Ali Hassan', degree: 'PhD ECE, 2016', rank: 'Assistant Prof.', appoint: 'Tenure-track', ftpt: 'FT', gov: '2', teach: '7', inst: '5', reg: 'None' }

                ].map((row) => (

                  <tr key={row.name} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.name}</td>

                    <td style={{ padding: '10px', color: colors.mediumGray }}>{row.degree}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.rank}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.appoint}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.ftpt}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.gov}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.teach}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.inst}</td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.reg}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Faculty Row

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Populate Table 6-1

            </button>

          </div>

        </div>



        {/* B. Faculty Workload */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Faculty Workload</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Summarize teaching loads and workload expectations. Complete Table 6-2.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} />

                Upload Workload Summary

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={16} />

                AI Extract workload

              </button>

            </div>

          </div>



          <textarea

            placeholder="Describe workload expectations (teaching, research, service) and how assignments are balanced."

            style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '14px' }}

          />



          <div style={{ marginTop: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ fontWeight: '800', color: colors.darkGray }}>Table 6-2. Faculty Workload Summary</div>

              <div style={{ color: colors.mediumGray, fontSize: '12px' }}>List courses taught with term and year.</div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Faculty Member (Name)</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>PT/FT</th>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Classes Taught (Course No./Title/Credit Hrs.) Term and Year</th>

                </tr>

              </thead>

              <tbody>

                {[

                  { name: 'Dr. Imad Moukadam', type: 'FT', classes: 'EECE 210 Circuits I (3cr) - Fall 2025; EECE 311 Signals & Systems (3cr) - Fall 2025' },

                  { name: 'Dr. Lina Saab', type: 'FT', classes: 'EECE 210 Circuits I (3cr) - Spring 2026; EECE 330 Electronics (3cr) - Spring 2026' },

                  { name: 'Dr. Ali Hassan', type: 'FT', classes: 'EECE 320 Digital Systems (3cr) - Spring 2026' }

                ].map((row) => (

                  <tr key={row.name} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '10px' }}>{row.name}</td>

                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.type}</td>

                    <td style={{ padding: '10px', color: colors.mediumGray }}>{row.classes}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Plus size={14} />

              Add Workload Row

            </button>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} />

              AI Fill Table 6-2

            </button>

          </div>

        </div>



        {/* C. Faculty Size */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Faculty Size</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Discuss size adequacy and faculty engagement with students, advising, service, development, and industry.

              </p>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Adequacy of faculty size for curriculum delivery" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Faculty involvement in advising, counseling, and student interaction" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Service activities and engagement with industry/professional practitioners" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* D. Professional Development */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Professional Development</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Provide detailed descriptions of professional development activities for each faculty member.

              </p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={16} />

              AI Summarize PD logs

            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            {facultyMembers.map((faculty) => (

              <div key={faculty.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

                <div style={{ fontWeight: '700', color: colors.primary, marginBottom: '6px' }}>{faculty.name}</div>

                <div style={{ color: colors.mediumGray, fontSize: '12px', marginBottom: '10px' }}>{faculty.rank} - {faculty.department}</div>

                <textarea placeholder="Workshops, conferences, industry collaboration, certifications, sabbatical, etc." style={{ width: '100%', minHeight: '120px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />

                <button style={{ marginTop: '8px', backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>

                  <Upload size={12} />

                  Upload Evidence

                </button>

              </div>

            ))}

          </div>

        </div>



        {/* E. Authority and Responsibility */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Authority and Responsibility of Faculty</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Describe faculty roles in course creation, assessment, PEO/SO revision, and the roles of leadership.

              </p>

            </div>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea placeholder="Role of faculty in course creation, modification, and evaluation" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Role of faculty in PEO/SO definition and attainment processes" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea placeholder="Roles of dean/provost/other leadership in these areas" style={{ width: '100%', minHeight: '140px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>

      </div>

    </div>

  );



  // Criterion 7 Page

  const Criterion7Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 7 – Facilities" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Criterion 7 – Facilities</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Full-page layout with six parts: Offices/Classrooms/Laboratories • Computing Resources • Guidance • Maintenance & Upgrading • Library Services • Overall Comments.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px' }}>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Offices, Classrooms & Laboratories */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>A. Offices, Classrooms & Laboratories</h3>

          <p style={{ color: colors.mediumGray, margin: '0 0 14px 0', fontSize: '14px' }}>Text-based subsections with upload boxes and AI extraction for inventory data.</p>



          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', backgroundColor: colors.lightGray }}>

            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Offices</div>

            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Describe faculty, administrative, and TA offices; include size and distribution.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '10px' }}>

              <input placeholder="Total number of offices" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />

              <input placeholder="Average workspace size" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />

              <input placeholder="Student availability details" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }} />

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={14} /> Upload: Facilities Report.pdf

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} /> AI Extract counts & adequacy

              </button>

            </div>

          </div>



          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', backgroundColor: colors.lightGray }}>

            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Classrooms</div>

            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Table for quick data entry. Upload “Classroom Equipment List.xlsx” or “Timetable Summary.pdf.” AI fills capacities, network access, and equipment automatically.</p>

            <div style={{ marginTop: '10px', overflowX: 'auto' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

                <thead>

                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                    {['Room', 'Capacity', 'Multimedia', 'Internet Access', 'Typical Use', 'Adequacy Comments'].map((h) => (

                      <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {[{ room: 'ENG 203', capacity: '45', multimedia: 'Projector + Audio', internet: 'Wi‑Fi + LAN', use: 'Core lectures', adequacy: 'Ready' }, { room: 'ENG 305', capacity: '60', multimedia: 'Smart board', internet: 'Wi‑Fi', use: 'Large lectures', adequacy: 'Upgrade AV planned' }].map((row) => (

                    <tr key={row.room} style={{ borderBottom: `1px solid ${colors.border}` }}>

                      <td style={{ padding: '10px' }}>{row.room}</td>

                      <td style={{ padding: '10px' }}>{row.capacity}</td>

                      <td style={{ padding: '10px' }}>{row.multimedia}</td>

                      <td style={{ padding: '10px' }}>{row.internet}</td>

                      <td style={{ padding: '10px' }}>{row.use}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.adequacy}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={14} /> Upload equipment/timetable

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} /> AI Extract classroom details

              </button>

            </div>

          </div>



          <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

            <div style={{ fontWeight: '800', color: colors.darkGray, marginBottom: '6px' }}>Laboratories (+ Appendix C Generator)</div>

            <p style={{ margin: 0, color: colors.mediumGray, fontSize: '13px' }}>Each lab row shows linked courses from ☰ Courses. Upload inventories and AI fills hardware/software lists. Generate Appendix C automatically.</p>

            <div style={{ marginTop: '10px', overflowX: 'auto' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

                <thead>

                  <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                    {['Lab Name', 'Room', 'Category', 'Hardware List', 'Software List', 'Open Hours', 'Courses Using Lab'].map((h) => (

                      <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {[{ lab: 'Embedded Systems Lab', room: 'ENG B12', cat: 'Electrical/Computer', hardware: 'Oscilloscopes, FPGA kits, logic analyzers', software: 'Keil, Vivado, MATLAB', hours: 'Mon–Fri 8:00–18:00', courses: 'EECE 320, EECE 401' }, { lab: 'Networks Lab', room: 'ENG C08', cat: 'Comm/Networking', hardware: 'Routers, switches, Wi‑Fi controllers', software: 'Packet Tracer, GNS3', hours: 'Mon–Fri 9:00–19:00', courses: 'EECE 311, EECE 350' }].map((row) => (

                    <tr key={row.lab} style={{ borderBottom: `1px solid ${colors.border}` }}>

                      <td style={{ padding: '10px' }}>{row.lab}</td>

                      <td style={{ padding: '10px' }}>{row.room}</td>

                      <td style={{ padding: '10px' }}>{row.cat}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.hardware}</td>

                      <td style={{ padding: '10px', color: colors.mediumGray }}>{row.software}</td>

                      <td style={{ padding: '10px' }}>{row.hours}</td>

                      <td style={{ padding: '10px' }}>{row.courses}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

              <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={14} /> Upload inventory spreadsheets

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} /> AI Extract hardware/software

              </button>

              <button style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <FileText size={14} /> Generate Appendix C – Equipment List

              </button>

            </div>

          </div>

        </div>



        {/* B. Computing Resources */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Computing Resources</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe computing infrastructure beyond specific labs. Labs defined in part A appear here automatically.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} /> Upload IT Infrastructure Summary

            </button>

          </div>



          <div style={{ marginTop: '12px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Resource', 'Location', 'Access Type (on-campus/VPN)', 'Hours Available', 'Adequacy Notes'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[{ resource: 'Virtual Compute Cluster', location: 'Data Center 2', access: 'VPN / Remote Desktop', hours: '24/7', adequacy: 'Handles high-load simulations; burst credits available.' }, { resource: 'Software License Server', location: 'Central IT', access: 'On-campus & VPN', hours: '24/7', adequacy: 'MATLAB, Cadence, Altium seats tracked; alerts on shortage.' }].map((row) => (

                  <tr key={row.resource} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px' }}>{row.resource}</td>

                    <td style={{ padding: '12px' }}>{row.location}</td>

                    <td style={{ padding: '12px' }}>{row.access}</td>

                    <td style={{ padding: '12px' }}>{row.hours}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.adequacy}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>



        {/* C. Guidance */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Guidance</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Multi-line box for orientations/tutorials/safety training. Responsible faculty pulled from ☰ Faculty Members.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} /> Upload Lab Manual.pdf

            </button>

          </div>

          <textarea placeholder="Describe orientations / tutorials / safety training" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>

            <select style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '13px' }}>

              {facultyMembers.map((f) => (

                <option key={f.id}>{f.name} – safety lead</option>

              ))}

            </select>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI Extract training schedule

            </button>

          </div>

        </div>



        {/* D. Maintenance and Upgrading */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Maintenance and Upgrading of Facilities</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe how the program keeps tools and resources current. Labs in part A automatically appear here.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} /> Upload Maintenance Plan.xlsx

            </button>

          </div>

          <textarea placeholder="Describe maintenance policy and upgrade cadence" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

          <div style={{ marginTop: '10px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Facility / Lab', 'Last Upgrade', 'Next Scheduled', 'Responsible Staff', 'Notes'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[{ lab: 'Embedded Systems Lab', last: 'Aug 2024', next: 'Jul 2026', resp: 'Eng. Rami (from sidebar)', notes: 'Oscilloscopes recalibrated; add FPGA boards' }, { lab: 'Networks Lab', last: 'Jan 2023', next: 'Dec 2024', resp: 'IT Ops + CCE TA team', notes: 'VPN routers refresh aligned with cybersecurity policy' }].map((row) => (

                  <tr key={row.lab} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px' }}>{row.lab}</td>

                    <td style={{ padding: '12px' }}>{row.last}</td>

                    <td style={{ padding: '12px' }}>{row.next}</td>

                    <td style={{ padding: '12px' }}>{row.resp}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.notes}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI Detect upgrade cycles

            </button>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={14} /> Attach Procurement Policy.pdf

            </button>

          </div>

        </div>



        {/* E. Library Services */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Library Services</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Summarize technical collections, e-resources, request process, and access hours/systems.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} /> Upload Library Summary.pdf

            </button>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '12px' }}>

            {[{ label: 'Technical collections and journals' }, { label: 'Electronic databases and e-resources' }, { label: 'Process for faculty book requests' }, { label: 'Access hours and systems (e-catalog, VPN)' }].map((item) => (

              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>

                <textarea placeholder={item.label} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

              </div>

            ))}

          </div>

          <button style={{ marginTop: '12px', backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

            <Sparkles size={14} /> AI Extract titles & services

          </button>

        </div>



        {/* F. Overall Comments */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>F. Overall Comments on Facilities</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Optional fields: how facilities support student outcomes, safety/inspection, and university policy compliance.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

              <Upload size={16} /> Upload Safety Audit Report.pdf

            </button>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '12px' }}>

            {[{ label: 'Facilities support student outcomes' }, { label: 'Safety and inspection processes' }, { label: 'Compliance with university policy' }].map((item) => (

              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>

                <textarea placeholder={item.label} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

              </div>

            ))}

          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI Create adequacy paragraph

            </button>

            <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

              <Save size={16} /> Save Draft

            </button>

            <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

              <Check size={16} /> Mark as Complete

            </button>

          </div>

        </div>

      </div>

    </div>

  );



  // Criterion 8 Page

  const Criterion8Page = ({ onToggleSidebar, onBack }) => (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Criterion 8 – Institutional Support" subtitle="CCE - ABET 2025-2027" showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Institutional Support Workspace</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Five-part layout (A–E) with uploads and AI Extract matching the dedicated page flow.</p>

            </div>

            <div style={{ display: 'flex', gap: '10px' }}>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Save size={16} />

                Save Draft

              </button>

              <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Check size={16} />

                Mark as Complete

              </button>

            </div>

          </div>

        </div>



        {/* A. Leadership */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>A. Leadership</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Describe leadership structure, adequacy, and participation in decisions. Upload org charts or policies.</p>

            </div>

            <div style={{ display: 'flex', gap: '8px' }}>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Upload size={16} /> Organizational Chart

              </button>

              <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Sparkles size={14} /> AI Extract hierarchy

              </button>

            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>

            {[{ label: 'Leadership structure (Program Chair, Department Head, Dean)', placeholder: 'Describe leadership roles and decision-making chain.' }, { label: 'Adequacy of leadership to ensure program quality and continuity', placeholder: 'Explain how leadership supports continuity and quality assurance.' }, { label: 'How leaders participate in curriculum and faculty decisions', placeholder: 'Document leadership involvement in curriculum and faculty processes.' }].map((item) => (

              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>

                <textarea placeholder={item.placeholder} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

              </div>

            ))}

          </div>

        </div>



        {/* B. Program Budget and Financial Support */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>B. Program Budget and Financial Support</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Four sub-parts (B1–B4) displayed as collapsible-style cards with uploads and AI summaries.</p>

            </div>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI Scan financial reports

            </button>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>

            {[{

              title: 'B1 – Budget Process and Continuity',

              desc: 'Describe how annual budget is set, approved, and monitored.',

              upload: 'Department Budget Policy.pdf',

              ai: 'AI summarize recurring vs temporary funds'

            }, {

              title: 'B2 – Teaching Support',

              desc: 'Explain support for teaching (graders, TAs, workshops, equipment).',

              upload: 'TA Assignments.xlsx',

              ai: 'AI summarize TAs, training, grants'

            }, {

              title: 'B3 – Infrastructure Funding',

              desc: 'How the university funds maintenance and lab/facility upgrades.',

              upload: 'Facilities Funding Plan.pdf',

              ai: 'AI identify funding amounts and cycles'

            }, {

              title: 'B4 – Adequacy of Resources',

              desc: 'Assess how current budget supports students achieving SOs.',

              upload: 'Annual Assessment Report.pdf',

              ai: 'AI pull students/credits/budget per student'

            }].map((card) => (

              <div key={card.title} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>

                  <div>

                    <div style={{ fontWeight: '800', color: colors.darkGray }}>{card.title}</div>

                    <p style={{ color: colors.mediumGray, margin: '6px 0 10px 0', fontSize: '13px' }}>{card.desc}</p>

                  </div>

                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                    <Upload size={14} /> {card.upload}

                  </button>

                </div>

                <textarea placeholder="Enter details or paste summary" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

                <button style={{ marginTop: '10px', backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                  <Sparkles size={14} /> {card.ai}

                </button>

              </div>

            ))}

          </div>

        </div>



        {/* C. Staffing */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>C. Staffing</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Summarize administrative and technical staff counts with roles and retention practices.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} /> HR Staff List.xlsx

            </button>

          </div>

          <div style={{ marginTop: '12px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Category', 'Number', 'Primary Role', 'Training / Retention Practices'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {[{ category: 'Administrative', number: '4', role: 'Program coordinator, scheduling, student records', training: 'Annual HR workshops; cross-training plan' }, { category: 'Technical', number: '6', role: 'Lab engineers, equipment upkeep', training: 'Vendor certifications; safety refreshers' }, { category: 'Instructional Assistants', number: '10', role: 'Grading, lab supervision, tutorial sessions', training: 'TA orientation; mentorship with faculty' }].map((row) => (

                  <tr key={row.category} style={{ borderBottom: `1px solid ${colors.border}` }}>

                    <td style={{ padding: '12px', fontWeight: '700', color: colors.darkGray }}>{row.category}</td>

                    <td style={{ padding: '12px' }}>{row.number}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.role}</td>

                    <td style={{ padding: '12px', color: colors.mediumGray }}>{row.training}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <textarea placeholder="Additional narrative on staffing adequacy and linkage to ☰ Faculty Members" style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '10px' }} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI Extract counts from HR list

            </button>

            <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={14} /> Attach Training Policy.pdf

            </button>

          </div>

        </div>



        {/* D. Faculty Hiring and Retention */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>D. Faculty Hiring and Retention</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Sub-sections D1 (hiring process) and D2 (retention strategies) with uploads and AI extraction.</p>

            </div>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI summarize policy

            </button>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginTop: '12px' }}>

            {[{

              title: 'D1 – Hiring Process',

              placeholder: 'Describe recruitment procedure (advertising, committees, approvals).',

              upload: 'Faculty Hiring Policy.pdf',

              ai: 'AI summarize steps & timeline'

            }, {

              title: 'D2 – Retention Strategies',

              placeholder: 'Explain promotion, recognition, salary review, mentorship systems.',

              upload: 'Retention Plan.pdf',

              ai: 'AI identify key benefits & retention methods'

            }].map((card) => (

              <div key={card.title} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', backgroundColor: colors.lightGray }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                  <div style={{ fontWeight: '800', color: colors.darkGray }}>{card.title}</div>

                  <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                    <Upload size={14} /> {card.upload}

                  </button>

                </div>

                <textarea placeholder={card.placeholder} style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '10px' }} />

                <button style={{ marginTop: '10px', backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                  <Sparkles size={14} /> {card.ai}

                </button>

              </div>

            ))}

          </div>

        </div>



        {/* E. Support of Faculty Professional Development */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>E. Support of Faculty Professional Development</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Document support types, request/approval process, and funding activities.</p>

            </div>

            <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Upload size={16} /> Professional Development Policy.pdf

            </button>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginTop: '12px' }}>

            {[{ label: 'Support types (sabbaticals, travel funds, workshops, seminars)', placeholder: 'List and describe available professional development supports.' }, { label: 'Process for request + approval', placeholder: 'Outline how faculty submit, approve, and track requests.' }, { label: 'Funding activity details (per year if available)', placeholder: 'Capture amounts, number of participants, and frequency.' }].map((item) => (

              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                <label style={{ fontWeight: '800', color: colors.darkGray, fontSize: '13px' }}>{item.label}</label>

                <textarea placeholder={item.placeholder} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

              </div>

            ))}

          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>

            <button style={{ backgroundColor: colors.softHighlight, color: colors.primary, border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

              <Sparkles size={14} /> AI Extract activities & funding

            </button>

            <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

              <Save size={16} /> Save Draft

            </button>

            <button style={{ backgroundColor: colors.success, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

              <Check size={16} /> Mark as Complete

            </button>

          </div>

        </div>

      </div>

    </div>

  );

  // Appendix C Page


export { Criterion1Page, Criterion2Page, Criterion3Page, Criterion4Page, Criterion5Page, Criterion6Page, Criterion7Page, Criterion8Page };
