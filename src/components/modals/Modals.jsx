import React from 'react';
import { ChevronRight, ChevronDown, Menu, X, Upload, Search, Check, Clock, AlertCircle, FileText, Users, BookOpen, Database, Plus, Edit, Trash2, Download, Eye, Save, ShieldCheck, Mail, Lock, Award, Globe2, Cpu, Cog, FlaskConical, CheckCircle2, Sparkles, LayoutGrid, ClipboardList } from 'lucide-react';
import { colors, fontStack } from '../../styles/theme';

  const SyllabusModal = ({ selectedInstructor, selectedCourse, syllabusMode, setSelectedInstructor, setSyllabusMode }) => {

    if (!selectedInstructor || !syllabusMode) return null;



    return (

      <div style={{

        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0,0,0,0.6)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 2000,

        padding: '20px'

      }}

      onClick={() => {

        setSelectedInstructor(null);

        setSyllabusMode(null);

      }}>

        <div 

          onClick={(e) => e.stopPropagation()}

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            width: '100%',

            maxWidth: '1100px',

            maxHeight: '90vh',

            overflow: 'auto',

            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',

            fontFamily: fontStack

          }}>

          {/* Modal Header */}

          <div style={{ 

            padding: '32px', 

            borderBottom: `1px solid ${colors.border}`,

            display: 'flex',

            justifyContent: 'space-between',

            alignItems: 'flex-start',

            position: 'sticky',

            top: 0,

            backgroundColor: 'white',

            zIndex: 10

          }}>

            <div>

              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px', letterSpacing: '-0.3px' }}>

                {selectedCourse?.code} - {selectedCourse?.name}

              </h2>

              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>

                {selectedInstructor.name} • {selectedInstructor.term} • {syllabusMode === 'edit' ? 'Editing' : 'Viewing'}

              </p>

            </div>

            <button 

              onClick={() => {

                setSelectedInstructor(null);

                setSyllabusMode(null);

              }}

              style={{ 

                background: 'none', 

                border: 'none', 

                cursor: 'pointer',

                padding: '8px',

                color: colors.mediumGray

              }}>

              <X size={24} />

            </button>

          </div>



          {/* Modal Content - Full Syllabus Form */}

          <div style={{ padding: '32px' }}>

            {/* Upload Section */}

            {syllabusMode === 'edit' && (

              <div style={{

                marginBottom: '32px',

                padding: '24px',

                backgroundColor: colors.lightGray,

                borderRadius: '8px',

                border: `2px dashed ${colors.border}`,

                textAlign: 'center'

              }}>

                <Upload size={32} color={colors.primary} style={{ marginBottom: '12px' }} />

                <h4 style={{ fontSize: '15px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px' }}>

                  Upload Syllabus (PDF/Word)

                </h4>

                <p style={{ fontSize: '13px', color: colors.mediumGray, marginBottom: '16px' }}>

                  AI will automatically extract and fill all information below

                </p>

                <button style={{

                  backgroundColor: colors.primary,

                  color: 'white',

                  padding: '10px 24px',

                  borderRadius: '6px',

                  border: 'none',

                  cursor: 'pointer',

                  fontSize: '14px',

                  fontWeight: '600'

                }}>

                  Choose File

                </button>

              </div>

            )}



            {/* Basic Course Info */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Course Information

              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Course Number & Name

                  </label>

                  <input 

                    type="text" 

                    value={`${selectedCourse?.code} - ${selectedCourse?.name}`}

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Credits

                  </label>

                  <input 

                    type="number" 

                    placeholder="3"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Contact Hours (Lecture/Lab/Other)

                  </label>

                  <input 

                    type="text" 

                    placeholder="3/0/0"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Instructor / Coordinator

                  </label>

                  <input 

                    type="text" 

                    value={selectedInstructor.name}

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

              </div>

            </div>



            {/* Textbook */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Required Materials

              </h3>

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Textbooks (Title, Author, Year)

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text" 

                    placeholder="e.g., Signals and Systems, Oppenheim & Willsky, 1997"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text" 

                    placeholder="e.g., Digital Signal Processing, Proakis & Manolakis, 2006"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                {syllabusMode === 'edit' && (

                  <button style={{

                    padding: '6px 12px',

                    backgroundColor: 'white',

                    color: colors.primary,

                    border: `1px dashed ${colors.primary}`,

                    borderRadius: '4px',

                    cursor: 'pointer',

                    fontSize: '12px',

                    fontWeight: '600',

                    display: 'flex',

                    alignItems: 'center',

                    gap: '4px',

                    marginBottom: '16px'

                  }}>

                    <Plus size={14} />

                    Add Textbook

                  </button>

                )}

              </div>

              <div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Supplemental Materials

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text" 

                    placeholder="e.g., MATLAB Programming Guide"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text" 

                    placeholder="e.g., Additional online resources"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                {syllabusMode === 'edit' && (

                  <button style={{

                    padding: '6px 12px',

                    backgroundColor: 'white',

                    color: colors.primary,

                    border: `1px dashed ${colors.primary}`,

                    borderRadius: '4px',

                    cursor: 'pointer',

                    fontSize: '12px',

                    fontWeight: '600',

                    display: 'flex',

                    alignItems: 'center',

                    gap: '4px'

                  }}>

                    <Plus size={14} />

                    Add Material

                  </button>

                )}

              </div>

            </div>



            {/* Course Description */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Course Description & Prerequisites

              </h3>

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Catalog Description

                </label>

                <textarea 

                  placeholder="Official course description from catalog"

                  disabled={syllabusMode === 'view'}

                  style={{ 

                    width: '100%', 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px',

                    fontSize: '14px',

                    fontFamily: 'inherit',

                    minHeight: '100px',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                  }} 

                />

              </div>

              

              {/* Prerequisites */}

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Prerequisites

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text" 

                    placeholder="e.g., EECE 210"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                {syllabusMode === 'edit' && (

                  <button style={{

                    padding: '6px 12px',

                    backgroundColor: 'white',

                    color: colors.primary,

                    border: `1px dashed ${colors.primary}`,

                    borderRadius: '4px',

                    cursor: 'pointer',

                    fontSize: '12px',

                    fontWeight: '600',

                    display: 'flex',

                    alignItems: 'center',

                    gap: '4px'

                  }}>

                    <Plus size={14} />

                    Add Prerequisite

                  </button>

                )}

              </div>



              {/* Corequisites */}

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Corequisites

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text" 

                    placeholder="None"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                {syllabusMode === 'edit' && (

                  <button style={{

                    padding: '6px 12px',

                    backgroundColor: 'white',

                    color: colors.primary,

                    border: `1px dashed ${colors.primary}`,

                    borderRadius: '4px',

                    cursor: 'pointer',

                    fontSize: '12px',

                    fontWeight: '600',

                    display: 'flex',

                    alignItems: 'center',

                    gap: '4px'

                  }}>

                    <Plus size={14} />

                    Add Corequisite

                  </button>

                )}

              </div>



              {/* Course Type */}

              <div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Course Type

                </label>

                <select 

                  disabled={syllabusMode === 'view'}

                  style={{ 

                    width: '100%', 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px',

                    fontSize: '14px',

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                  }}>

                  <option>Required</option>

                  <option>Elective</option>

                  <option>Selective Elective</option>

                </select>

              </div>

            </div>



            {/* CLOs */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Course Learning Outcomes (CLOs)

              </h3>

              

              {/* CLO 1 */}

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  CLO 1

                </label>

                <div style={{ display: 'flex', gap: '12px' }}>

                  <input 

                    type="text" 

                    placeholder="Students will be able to..."

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      flex: 1, 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                  <select 

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '130px', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }}>

                    <option>Maps to SO</option>

                    <option>SO 1</option>

                    <option>SO 2</option>

                    <option>SO 3</option>

                  </select>

                  <select 

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100px', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }}>

                    <option>Level</option>

                    <option>I</option>

                    <option>R</option>

                    <option>M</option>

                  </select>

                </div>

              </div>



              {/* CLO 2 */}

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  CLO 2

                </label>

                <div style={{ display: 'flex', gap: '12px' }}>

                  <input 

                    type="text" 

                    placeholder="Students will be able to..."

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      flex: 1, 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                  <select 

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '130px', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }}>

                    <option>Maps to SO</option>

                    <option>SO 1</option>

                    <option>SO 2</option>

                    <option>SO 3</option>

                  </select>

                  <select 

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100px', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }}>

                    <option>Level</option>

                    <option>I</option>

                    <option>R</option>

                    <option>M</option>

                  </select>

                </div>

              </div>



              {syllabusMode === 'edit' && (

                <button style={{

                  padding: '8px 16px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '6px',

                  cursor: 'pointer',

                  fontSize: '13px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '6px'

                }}>

                  <Plus size={16} />

                  Add CLO

                </button>

              )}

            </div>



            {/* Topics Outline */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Weekly Topics Outline

              </h3>

              <textarea 

                placeholder="List main topics covered week by week"

                disabled={syllabusMode === 'view'}

                style={{ 

                  width: '100%', 

                  padding: '10px 12px', 

                  border: `1px solid ${colors.border}`, 

                  borderRadius: '6px',

                  fontSize: '14px',

                  fontFamily: 'inherit',

                  minHeight: '120px',

                  backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                }} 

              />

            </div>



            {/* Assessment */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Assessment Methods & Weights

              </h3>

              

              {/* Assessment 1 */}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>

                <input 

                  type="text" 

                  placeholder="Assessment Type (e.g., Midterm Exam)" 

                  disabled={syllabusMode === 'view'} 

                  style={{ 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px', 

                    fontSize: '14px', 

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 

                  }} 

                />

                <input 

                  type="text" 

                  placeholder="Weight %" 

                  disabled={syllabusMode === 'view'} 

                  style={{ 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px', 

                    fontSize: '14px', 

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 

                  }} 

                />

              </div>



              {/* Assessment 2 */}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>

                <input 

                  type="text" 

                  placeholder="Assessment Type (e.g., Final Exam)" 

                  disabled={syllabusMode === 'view'} 

                  style={{ 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px', 

                    fontSize: '14px', 

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 

                  }} 

                />

                <input 

                  type="text" 

                  placeholder="Weight %" 

                  disabled={syllabusMode === 'view'} 

                  style={{ 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px', 

                    fontSize: '14px', 

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 

                  }} 

                />

              </div>



              {/* Assessment 3 */}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>

                <input 

                  type="text" 

                  placeholder="Assessment Type (e.g., Homework/Assignments)" 

                  disabled={syllabusMode === 'view'} 

                  style={{ 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px', 

                    fontSize: '14px', 

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 

                  }} 

                />

                <input 

                  type="text" 

                  placeholder="Weight %" 

                  disabled={syllabusMode === 'view'} 

                  style={{ 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px', 

                    fontSize: '14px', 

                    fontFamily: 'inherit',

                    backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white' 

                  }} 

                />

              </div>



              {syllabusMode === 'edit' && (

                <button style={{

                  padding: '8px 16px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '6px',

                  cursor: 'pointer',

                  fontSize: '13px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '6px'

                }}>

                  <Plus size={16} />

                  Add Assessment

                </button>

              )}

            </div>



            {/* Additional Info */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Additional Information

              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Design Content %

                  </label>

                  <input 

                    type="number" 

                    placeholder="0-100"

                    disabled={syllabusMode === 'view'}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                    }} 

                  />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Software / Lab Tools Used

                  </label>

                  <div style={{ marginBottom: '8px' }}>

                    <input 

                      type="text" 

                      placeholder="e.g., MATLAB"

                      disabled={syllabusMode === 'view'}

                      style={{ 

                        width: '100%', 

                        padding: '10px 12px', 

                        border: `1px solid ${colors.border}`, 

                        borderRadius: '6px',

                        fontSize: '14px',

                        fontFamily: 'inherit',

                        backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white',

                        marginBottom: '8px'

                      }} 

                    />

                    <input 

                      type="text" 

                      placeholder="e.g., Oscilloscope"

                      disabled={syllabusMode === 'view'}

                      style={{ 

                        width: '100%', 

                        padding: '10px 12px', 

                        border: `1px solid ${colors.border}`, 

                        borderRadius: '6px',

                        fontSize: '14px',

                        fontFamily: 'inherit',

                        backgroundColor: syllabusMode === 'view' ? colors.lightGray : 'white'

                      }} 

                    />

                  </div>

                  {syllabusMode === 'edit' && (

                    <button style={{

                      padding: '6px 12px',

                      backgroundColor: 'white',

                      color: colors.primary,

                      border: `1px dashed ${colors.primary}`,

                      borderRadius: '4px',

                      cursor: 'pointer',

                      fontSize: '12px',

                      fontWeight: '600',

                      display: 'flex',

                      alignItems: 'center',

                      gap: '4px'

                    }}>

                      <Plus size={14} />

                      Add Tool

                    </button>

                  )}

                </div>

              </div>

            </div>



            {/* Action Buttons */}

            {syllabusMode === 'edit' && (

              <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>

                <button style={{

                  flex: 1,

                  padding: '14px',

                  backgroundColor: colors.primary,

                  color: 'white',

                  border: 'none',

                  borderRadius: '6px',

                  fontSize: '15px',

                  fontWeight: '600',

                  cursor: 'pointer',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  gap: '8px'

                }}>

                  <Save size={18} />

                  Save Syllabus

                </button>

                <button style={{

                  padding: '14px 24px',

                  backgroundColor: 'white',

                  color: colors.mediumGray,

                  border: `2px solid ${colors.border}`,

                  borderRadius: '6px',

                  fontSize: '15px',

                  fontWeight: '600',

                  cursor: 'pointer'

                }}

                onClick={() => {

                  setSelectedInstructor(null);

                  setSyllabusMode(null);

                }}>

                  Cancel

                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    );

  };



  // Faculty Profile Modal (keeping existing implementation)


  const FacultyProfileModal = ({ selectedFaculty, setSelectedFaculty }) => {

    if (!selectedFaculty) return null;



    return (

      <div style={{

        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0,0,0,0.6)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 2000,

        padding: '20px'

      }}

      onClick={() => setSelectedFaculty(null)}>

        <div 

          onClick={(e) => e.stopPropagation()}

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            width: '100%',

            maxWidth: '900px',

            maxHeight: '90vh',

            overflow: 'auto',

            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',

            fontFamily: fontStack

          }}>

          {/* Modal Header */}

          <div style={{ 

            padding: '32px', 

            borderBottom: `1px solid ${colors.border}`,

            display: 'flex',

            justifyContent: 'space-between',

            alignItems: 'flex-start',

            position: 'sticky',

            top: 0,

            backgroundColor: 'white',

            zIndex: 10

          }}>

            <div>

              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px', letterSpacing: '-0.3px' }}>

                {selectedFaculty.name}

              </h2>

              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>

                {selectedFaculty.rank} • {selectedFaculty.department}

              </p>

            </div>

            <button 

              onClick={() => setSelectedFaculty(null)}

              style={{ 

                background: 'none', 

                border: 'none', 

                cursor: 'pointer',

                padding: '8px',

                color: colors.mediumGray

              }}>

              <X size={24} />

            </button>

          </div>



          {/* Modal Content */}

          <div style={{ padding: '32px' }}>

            {/* Upload CV Section */}

            <div style={{ 

              marginBottom: '32px',

              padding: '24px',

              backgroundColor: colors.lightGray,

              borderRadius: '8px',

              border: `2px dashed ${colors.border}`

            }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                <Upload size={32} color={colors.primary} />

                <div style={{ flex: 1 }}>

                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: colors.darkGray, marginBottom: '4px' }}>Upload CV</h4>

                  <p style={{ fontSize: '13px', color: colors.mediumGray, margin: 0 }}>AI will automatically extract information to fill the form</p>

                </div>

                <button style={{

                  backgroundColor: colors.primary,

                  color: 'white',

                  padding: '10px 20px',

                  borderRadius: '6px',

                  border: 'none',

                  cursor: 'pointer',

                  fontSize: '13px',

                  fontWeight: '600'

                }}>

                  Choose File

                </button>

              </div>

            </div>



            {/* Profile Information */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Basic Information

              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Rank/Title

                  </label>

                  <select style={{ 

                    width: '100%', 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px',

                    fontSize: '14px',

                    fontFamily: 'inherit'

                  }}>

                    <option>Professor</option>

                    <option>Associate Professor</option>

                    <option>Assistant Professor</option>

                    <option>Instructor</option>

                  </select>

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Type of Appointment

                  </label>

                  <select style={{ 

                    width: '100%', 

                    padding: '10px 12px', 

                    border: `1px solid ${colors.border}`, 

                    borderRadius: '6px',

                    fontSize: '14px',

                    fontFamily: 'inherit'

                  }}>

                    <option>Full-time, Tenure-track</option>

                    <option>Full-time, Not Tenure-track</option>

                    <option>Part-time</option>

                  </select>

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Email

                  </label>

                  <input 

                    type="email" 

                    value={selectedFaculty.email}

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Office Hours

                  </label>

                  <input 

                    type="text" 

                    placeholder="e.g., MW 2-4 PM"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

              </div>

            </div>



            {/* Qualifications (Table 6-1) */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Qualifications (Table 6-1)

              </h3>

              

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Highest Degree

                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px' }}>

                  <input type="text" placeholder="Field (e.g., Electrical Engineering)" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                  <input type="text" placeholder="Institution (e.g., MIT)" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                  <input type="text" placeholder="Year" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                </div>

              </div>



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Years in Industry/Government

                  </label>

                  <input type="number" placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    Years at This Institution

                  </label>

                  <input type="number" placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                </div>

              </div>



              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Professional Certifications

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., PE License (2020)"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., PMP Certification (2022)"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Certification

                </button>

              </div>



              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Professional Memberships

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., IEEE (Senior Member)"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., ASME"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Membership

                </button>

              </div>



              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Professional Development Activities

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., Attended IEEE International Conference 2024"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., Completed Advanced VLSI Design Workshop (2023)"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Activity

                </button>

              </div>



              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Consulting or Work in Industry

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., Technical Consultant at XYZ Corporation (2023-Present)"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., Part-time Engineer at ABC Tech (2020-2022)"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Position

                </button>

              </div>



              <div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Level of Activity

                </label>

                <select style={{ 

                  width: '100%', 

                  padding: '10px 12px', 

                  border: `1px solid ${colors.border}`, 

                  borderRadius: '6px',

                  fontSize: '14px',

                  fontFamily: 'inherit'

                }}>

                  <option value="">Select level</option>

                  <option value="high">High</option>

                  <option value="medium">Medium</option>

                  <option value="low">Low</option>

                </select>

              </div>

            </div>



            {/* Workload (Table 6-2) */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Workload (Table 6-2)

              </h3>

              

              <div style={{ marginBottom: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Courses Taught (Current Cycle)

                </label>

                <div style={{ 

                  padding: '16px',

                  backgroundColor: colors.lightGray,

                  borderRadius: '6px',

                  border: `1px solid ${colors.border}`

                }}>

                  <div style={{ fontSize: '13px', color: colors.mediumGray, marginBottom: '8px', fontWeight: '500' }}>

                    EECE 210 - Circuits I (Fall 2025, 3 credits)

                  </div>

                  <div style={{ fontSize: '13px', color: colors.mediumGray, fontWeight: '500' }}>

                    EECE 311 - Signals & Systems (Fall 2025, 3 credits)

                  </div>

                </div>

                <p style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '8px', fontStyle: 'italic' }}>

                  Auto-populated from course assignments

                </p>

              </div>



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    % Teaching

                  </label>

                  <input type="number" placeholder="e.g., 60" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    % Research

                  </label>

                  <input type="number" placeholder="e.g., 30" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                </div>

                <div>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                    % Other

                  </label>

                  <input type="number" placeholder="e.g., 10" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

                </div>

              </div>

              

              <div style={{ marginTop: '16px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  % of Time Devoted to This Program

                </label>

                <input type="number" placeholder="e.g., 100" min="0" max="100" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />

              </div>

            </div>



            {/* Additional Information */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '20px', letterSpacing: '-0.2px' }}>

                Additional Information for Appendix B

              </h3>

              

              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Honors and Awards

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., Best Paper Award at IEEE Conference 2023"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., Outstanding Teaching Award 2022"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Honor/Award

                </button>

              </div>



              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Service Activities

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., Member of Academic Senate"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., Chair of Curriculum Committee"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Service Activity

                </button>

              </div>



              <div style={{ marginBottom: '20px' }}>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.darkGray, marginBottom: '8px' }}>

                  Publications and Presentations (Last 5 Years)

                </label>

                <div style={{ marginBottom: '8px' }}>

                  <input 

                    type="text"

                    placeholder="e.g., J. Smith, 'Signal Processing Methods', IEEE Trans. 2024"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit',

                      marginBottom: '8px'

                    }} 

                  />

                  <input 

                    type="text"

                    placeholder="e.g., Conference presentation at ICASSP 2023"

                    style={{ 

                      width: '100%', 

                      padding: '10px 12px', 

                      border: `1px solid ${colors.border}`, 

                      borderRadius: '6px',

                      fontSize: '14px',

                      fontFamily: 'inherit'

                    }} 

                  />

                </div>

                <button style={{

                  padding: '6px 12px',

                  backgroundColor: 'white',

                  color: colors.primary,

                  border: `1px dashed ${colors.primary}`,

                  borderRadius: '4px',

                  cursor: 'pointer',

                  fontSize: '12px',

                  fontWeight: '600',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '4px'

                }}>

                  <Plus size={14} />

                  Add Publication

                </button>

              </div>

            </div>



            {/* Action Buttons */}

            <div style={{ display: 'flex', gap: '12px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>

              <button style={{

                flex: 1,

                padding: '14px',

                backgroundColor: colors.primary,

                color: 'white',

                border: 'none',

                borderRadius: '6px',

                fontSize: '15px',

                fontWeight: '600',

                cursor: 'pointer',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                gap: '8px'

              }}>

                <Save size={18} />

                Save Profile

              </button>

              <button style={{

                padding: '14px 24px',

                backgroundColor: 'white',

                color: colors.primary,

                border: `2px solid ${colors.primary}`,

                borderRadius: '6px',

                fontSize: '15px',

                fontWeight: '600',

                cursor: 'pointer',

                display: 'flex',

                alignItems: 'center',

                gap: '8px'

              }}>

                <Download size={18} />

                Generate Appendix B

              </button>

              <button style={{

                padding: '14px 24px',

                backgroundColor: 'white',

                color: colors.mediumGray,

                border: `2px solid ${colors.border}`,

                borderRadius: '6px',

                fontSize: '15px',

                fontWeight: '600',

                cursor: 'pointer'

              }}

              onClick={() => setSelectedFaculty(null)}>

                Cancel

              </button>

            </div>

          </div>

        </div>

      </div>

      );

    }



  // Course Summary Modal (Generate Common Syllabus)


  const CourseSummaryModal = ({ selectedCourse, selectedInstructor, setSelectedCourse, setSelectedInstructor, setSyllabusMode }) => {

    if (!selectedCourse || selectedInstructor) return null;



    return (

      <div style={{

        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0,0,0,0.6)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 2000,

        padding: '20px'

      }}

      onClick={() => setSelectedCourse(null)}>

        <div 

          onClick={(e) => e.stopPropagation()}

          style={{

            backgroundColor: 'white',

            borderRadius: '12px',

            width: '100%',

            maxWidth: '1000px',

            maxHeight: '90vh',

            overflow: 'auto',

            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',

            fontFamily: fontStack

          }}>

          {/* Modal Header */}

          <div style={{ 

            padding: '32px', 

            borderBottom: `1px solid ${colors.border}`,

            display: 'flex',

            justifyContent: 'space-between',

            alignItems: 'flex-start',

            position: 'sticky',

            top: 0,

            backgroundColor: 'white',

            zIndex: 10

          }}>

            <div>

              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px', letterSpacing: '-0.3px' }}>

                {selectedCourse.code} - {selectedCourse.name}

              </h2>

              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>

                Course Summary & Common Syllabus Management

              </p>

            </div>

            <button 

              onClick={() => setSelectedCourse(null)}

              style={{ 

                background: 'none', 

                border: 'none', 

                cursor: 'pointer',

                padding: '8px',

                color: colors.mediumGray

              }}>

              <X size={24} />

            </button>

          </div>



          {/* Modal Content */}

          <div style={{ padding: '32px' }}>

            {/* Generate Common Syllabus Button */}

            <div style={{

              marginBottom: '32px',

              padding: '28px',

              backgroundColor: '#E8F5E9',

              borderRadius: '10px',

              border: '1px solid #81C784',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'space-between'

            }}>

              <div>

                <h4 style={{ fontSize: '17px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px' }}>

                  Generate Common Syllabus

                </h4>

                <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0 }}>

                  Merge all instructor syllabi into one unified version for ABET reporting. Common elements will be combined, differences will be highlighted.

                </p>

              </div>

              <button style={{

                backgroundColor: colors.success,

                color: 'white',

                padding: '14px 28px',

                borderRadius: '8px',

                border: 'none',

                cursor: 'pointer',

                fontSize: '15px',

                fontWeight: '700',

                whiteSpace: 'nowrap',

                boxShadow: '0 4px 12px rgba(40,167,69,0.3)'

              }}>

                Generate Now

              </button>

            </div>



            {/* Instructor Syllabi List */}

            <div style={{ marginBottom: '32px' }}>

              <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.darkGray, marginBottom: '24px', letterSpacing: '-0.2px' }}>

                Instructor Syllabi ({selectedCourse.instructors.length})

              </h3>

              

              {selectedCourse.instructors.map((instructor) => (

                <div 

                  key={instructor.id}

                  style={{

                    marginBottom: '20px',

                    padding: '24px',

                    border: `1px solid ${colors.border}`,

                    borderRadius: '10px',

                    backgroundColor: 'white'

                  }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>

                    <div>

                      <div style={{ fontSize: '16px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px' }}>

                        {instructor.name}

                      </div>

                      <div style={{ fontSize: '14px', color: colors.mediumGray, fontWeight: '500' }}>

                        {instructor.term}

                      </div>

                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>

                      <button 

                        onClick={() => {

                          setSelectedInstructor(instructor);

                          setSyllabusMode('view');

                        }}

                        style={{

                          padding: '10px 20px',

                          backgroundColor: 'white',

                          color: colors.primary,

                          border: `2px solid ${colors.primary}`,

                          borderRadius: '6px',

                          fontSize: '14px',

                          fontWeight: '600',

                          cursor: 'pointer',

                          display: 'flex',

                          alignItems: 'center',

                          gap: '6px'

                        }}>

                        <Eye size={16} />

                        View

                      </button>

                      <button 

                        onClick={() => {

                          setSelectedInstructor(instructor);

                          setSyllabusMode('edit');

                        }}

                        style={{

                          padding: '10px 20px',

                          backgroundColor: 'white',

                          color: colors.primary,

                          border: `2px solid ${colors.primary}`,

                          borderRadius: '6px',

                          fontSize: '14px',

                          fontWeight: '600',

                          cursor: 'pointer',

                          display: 'flex',

                          alignItems: 'center',

                          gap: '6px'

                        }}>

                        <Edit size={16} />

                        Edit

                      </button>

                      <button style={{

                        padding: '10px 20px',

                        backgroundColor: colors.success,

                        color: 'white',

                        border: 'none',

                        borderRadius: '6px',

                        fontSize: '14px',

                        fontWeight: '600',

                        cursor: 'pointer',

                        display: 'flex',

                        alignItems: 'center',

                        gap: '6px'

                      }}>

                        <Download size={16} />

                        Generate

                      </button>

                    </div>

                  </div>



                  {/* Quick Stats */}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>

                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>

                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credits</div>

                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>3</div>

                    </div>

                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>

                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CLOs</div>

                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>5</div>

                    </div>

                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>

                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOs Mapped</div>

                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.darkGray }}>3</div>

                    </div>

                    <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderRadius: '8px' }}>

                      <div style={{ fontSize: '11px', color: colors.mediumGray, marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>

                      <div style={{ fontSize: '14px', fontWeight: '800', color: colors.success }}>Complete</div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    );

  };



  // Checklist Page


export { SyllabusModal, FacultyProfileModal, CourseSummaryModal };