import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Menu, X, Upload, Search, Check, Clock, AlertCircle, FileText, Users, BookOpen, Database, Plus, Edit, Trash2, Download, Eye, Save, ShieldCheck, Mail, Lock, Award, Globe2, Cpu, Cog, FlaskConical, CheckCircle2, Sparkles, LayoutGrid, ClipboardList } from 'lucide-react';
import { colors, fontStack } from '../../styles/theme';
import { apiRequest } from '../../utils/api';

const FACULTY_DOCS_DB_NAME = 'abet-faculty-documents';
const FACULTY_DOCS_STORE = 'documents';

const openFacultyDocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(FACULTY_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(FACULTY_DOCS_STORE)) {
      const store = db.createObjectStore(FACULTY_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_faculty', ['cycleId', 'facultyKey'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open CV storage.'));
});

const listFacultyDocs = async (cycleId, facultyKey) => {
  const db = await openFacultyDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FACULTY_DOCS_STORE, 'readonly');
    const store = tx.objectStore(FACULTY_DOCS_STORE);
    const index = store.index('by_cycle_faculty');
    const req = index.getAll(IDBKeyRange.only([String(cycleId), String(facultyKey)]));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error('Unable to read CV documents.'));
  });
};

const appendFacultyDocs = async (cycleId, facultyKey, files) => {
  const db = await openFacultyDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FACULTY_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(FACULTY_DOCS_STORE);
    const index = store.index('by_cycle_faculty');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), String(facultyKey)]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));
      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${facultyKey}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          facultyKey: String(facultyKey),
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString()
        });
      });
    };
    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to store CV documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store CV documents.'));
  });
};

const deleteFacultyDocById = async (docId) => {
  const db = await openFacultyDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FACULTY_DOCS_STORE, 'readwrite');
    tx.objectStore(FACULTY_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove CV document.'));
  });
};

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



  // Faculty Profile Modal
  const FacultyProfileModal = ({ selectedFaculty, setSelectedFaculty }) => {
    if (!selectedFaculty) return null;

    const cycleId = localStorage.getItem('currentCycleId') || 1;
    const facultyKey = selectedFaculty?.faculty_id || selectedFaculty?.email || 'new';
    const extrasStorageKey = `faculty-profile-extras:${cycleId}:${facultyKey}`;

    const [profile, setProfile] = useState({
      faculty_id: selectedFaculty?.faculty_id ?? null,
      full_name: selectedFaculty?.full_name ?? selectedFaculty?.name ?? '',
      academic_rank: selectedFaculty?.academic_rank ?? selectedFaculty?.rank ?? '',
      appointment_type: selectedFaculty?.appointment_type ?? '',
      email: selectedFaculty?.email ?? '',
      office_hours: selectedFaculty?.office_hours ?? ''
    });
    const [qualification, setQualification] = useState({
      degree_field: '',
      degree_institution: '',
      degree_year: '',
      years_industry_government: '',
      years_at_institution: ''
    });
    const [certifications, setCertifications] = useState(['']);
    const [memberships, setMemberships] = useState(['']);
    const [developmentActivities, setDevelopmentActivities] = useState(['']);
    const [industryExperience, setIndustryExperience] = useState(['']);
    const [workload, setWorkload] = useState({
      teaching_percentage: '',
      research_percentage: '',
      other_percentage: '',
      program_time_percentage: ''
    });
    const [honors, setHonors] = useState(['']);
    const [services, setServices] = useState(['']);
    const [publications, setPublications] = useState(['']);
    const [cvModalOpen, setCvModalOpen] = useState(false);
    const [cvFiles, setCvFiles] = useState([]);
    const [cvStatus, setCvStatus] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
      try {
        const raw = localStorage.getItem(extrasStorageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.qualification) setQualification(parsed.qualification);
        if (Array.isArray(parsed?.certifications)) setCertifications(parsed.certifications.length ? parsed.certifications : ['']);
        if (Array.isArray(parsed?.memberships)) setMemberships(parsed.memberships.length ? parsed.memberships : ['']);
        if (Array.isArray(parsed?.developmentActivities)) setDevelopmentActivities(parsed.developmentActivities.length ? parsed.developmentActivities : ['']);
        if (Array.isArray(parsed?.industryExperience)) setIndustryExperience(parsed.industryExperience.length ? parsed.industryExperience : ['']);
        if (parsed?.workload) setWorkload(parsed.workload);
        if (Array.isArray(parsed?.honors)) setHonors(parsed.honors.length ? parsed.honors : ['']);
        if (Array.isArray(parsed?.services)) setServices(parsed.services.length ? parsed.services : ['']);
        if (Array.isArray(parsed?.publications)) setPublications(parsed.publications.length ? parsed.publications : ['']);
      } catch (_error) {
      }
    }, [extrasStorageKey]);

    useEffect(() => {
      const payload = {
        qualification,
        certifications,
        memberships,
        developmentActivities,
        industryExperience,
        workload,
        honors,
        services,
        publications
      };
      localStorage.setItem(extrasStorageKey, JSON.stringify(payload));
    }, [extrasStorageKey, qualification, certifications, memberships, developmentActivities, industryExperience, workload, honors, services, publications]);

    const updateListItem = (setter, index, value) => setter((prev) => prev.map((row, i) => (i === index ? value : row)));
    const addListItem = (setter) => setter((prev) => [...prev, '']);
    const removeListItem = (setter, index) => setter((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

    const openCvModal = async () => {
      setCvStatus('');
      setCvModalOpen(true);
      try {
        const docs = await listFacultyDocs(cycleId, facultyKey);
        setCvFiles(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
      } catch (error) {
        setCvFiles([]);
        setCvStatus(error?.message || 'Unable to load CV documents.');
      }
    };

    const handleCvSelection = async (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      try {
        await appendFacultyDocs(cycleId, facultyKey, files);
        const docs = await listFacultyDocs(cycleId, facultyKey);
        setCvFiles(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setCvStatus(`${docs.length} file(s) saved.`);
      } catch (error) {
        setCvStatus(error?.message || 'Unable to save CV documents.');
      }
    };

    const handleCvRemove = async (docId) => {
      try {
        await deleteFacultyDocById(docId);
        const docs = await listFacultyDocs(cycleId, facultyKey);
        setCvFiles(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setCvStatus('Document removed.');
      } catch (error) {
        setCvStatus(error?.message || 'Unable to remove document.');
      }
    };

    const handleSaveProfile = async () => {
      const name = `${profile.full_name ?? ''}`.trim();
      const email = `${profile.email ?? ''}`.trim();
      if (!name || !email) {
        setSaveError('Full name and email are required.');
        return;
      }

      try {
        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        let facultyId = profile.faculty_id;
        if (!facultyId) {
          const allFaculty = await apiRequest('/faculty-members/', { method: 'GET' });
          const maxId = (Array.isArray(allFaculty) ? allFaculty : []).reduce((max, row) => {
            const id = Number(row?.faculty_id || 0);
            return Number.isFinite(id) && id > max ? id : max;
          }, 0);
          facultyId = maxId + 1;
        }

        const payload = {
          faculty_id: facultyId,
          full_name: name,
          academic_rank: `${profile.academic_rank ?? ''}`.trim(),
          appointment_type: `${profile.appointment_type ?? ''}`.trim(),
          email,
          office_hours: `${profile.office_hours ?? ''}`.trim()
        };

        try {
          await apiRequest(`/faculty-members/${facultyId}/`, { method: 'GET' });
          await apiRequest(`/faculty-members/${facultyId}/`, { method: 'PUT', body: JSON.stringify(payload) });
        } catch (_notFound) {
          await apiRequest('/faculty-members/', { method: 'POST', body: JSON.stringify(payload) });
        }

        setProfile((prev) => ({ ...prev, faculty_id: facultyId }));
        localStorage.setItem(`faculty-profile-extras:${cycleId}:${facultyId}`, JSON.stringify({
          qualification,
          certifications,
          memberships,
          developmentActivities,
          industryExperience,
          workload,
          honors,
          services,
          publications
        }));
        setSelectedFaculty((prev) => ({ ...(prev || {}), ...payload, name: payload.full_name, rank: payload.academic_rank }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        localStorage.setItem('facultyNeedsRefresh', 'true');
        window.dispatchEvent(new Event('faculty-updated'));
        setTimeout(() => setSelectedFaculty(null), 350);
      } catch (error) {
        setSaveError(error?.message || 'Unable to save faculty profile.');
      } finally {
        setSaving(false);
      }
    };

    const renderSimpleList = (title, items, setter, placeholder) => (
      <div style={{ marginBottom: '22px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: colors.darkGray, marginBottom: '8px' }}>{title}</label>
        {items.map((row, index) => (
          <div key={`${title}-${index}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={row}
              onChange={(event) => updateListItem(setter, index, event.target.value)}
              placeholder={placeholder}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }}
            />
            <button type="button" onClick={() => removeListItem(setter, index)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '10px 12px', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => addListItem(setter)} style={{ padding: '6px 12px', backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={14} />
          Add
        </button>
      </div>
    );

    const profileTitle = useMemo(() => `${profile.full_name || 'Faculty Profile'}`, [profile.full_name]);

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={() => setSelectedFaculty(null)}>
        <div onClick={(event) => event.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '960px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: fontStack }}>
          <div style={{ padding: '28px 30px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.darkGray, marginBottom: '6px', letterSpacing: '-0.3px' }}>{profileTitle}</h2>
              <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0, fontWeight: '500' }}>{profile.academic_rank || 'Set rank'} - {profile.email || 'Set email'}</p>
            </div>
            <button onClick={() => setSelectedFaculty(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: colors.mediumGray }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: colors.lightGray, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: colors.darkGray }}>Faculty CV</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={openCvModal} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} />
                    Upload Documents
                  </button>
                  <button type="button" disabled style={{ backgroundColor: '#eceef2', color: colors.mediumGray, border: `1px solid ${colors.border}`, padding: '8px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'not-allowed', opacity: 0.9 }}>
                    Extract with AI
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '16px' }}>Basic Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input type="text" value={profile.full_name} onChange={(event) => setProfile((prev) => ({ ...prev, full_name: event.target.value }))} placeholder="Full name" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="email" value={profile.email} onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="text" value={profile.academic_rank} onChange={(event) => setProfile((prev) => ({ ...prev, academic_rank: event.target.value }))} placeholder="Academic rank" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="text" value={profile.appointment_type} onChange={(event) => setProfile((prev) => ({ ...prev, appointment_type: event.target.value }))} placeholder="Appointment type" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="text" value={profile.office_hours} onChange={(event) => setProfile((prev) => ({ ...prev, office_hours: event.target.value }))} placeholder="Office hours" style={{ gridColumn: '1 / -1', width: '100%', padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '16px' }}>Qualifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input type="text" value={qualification.degree_field} onChange={(event) => setQualification((prev) => ({ ...prev, degree_field: event.target.value }))} placeholder="Degree field" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="text" value={qualification.degree_institution} onChange={(event) => setQualification((prev) => ({ ...prev, degree_institution: event.target.value }))} placeholder="Institution" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="number" min="1900" max="9999" value={qualification.degree_year} onChange={(event) => setQualification((prev) => ({ ...prev, degree_year: event.target.value }))} placeholder="Year" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="number" min="0" value={qualification.years_industry_government} onChange={(event) => setQualification((prev) => ({ ...prev, years_industry_government: event.target.value }))} placeholder="Years in industry/government" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="number" min="0" value={qualification.years_at_institution} onChange={(event) => setQualification((prev) => ({ ...prev, years_at_institution: event.target.value }))} placeholder="Years at institution" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
            </div>

            {renderSimpleList('Professional Certifications', certifications, setCertifications, 'e.g., PE License (2020)')}
            {renderSimpleList('Professional Memberships', memberships, setMemberships, 'e.g., IEEE Senior Member')}
            {renderSimpleList('Professional Development Activities', developmentActivities, setDevelopmentActivities, 'e.g., ABET workshop 2025')}
            {renderSimpleList('Consulting or Work in Industry', industryExperience, setIndustryExperience, 'e.g., Technical Consultant at XYZ')}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.darkGray, marginBottom: '16px' }}>Workload (Courses will be linked later)</h3>
              <div style={{ padding: '12px', backgroundColor: colors.lightGray, border: `1px solid ${colors.border}`, borderRadius: '8px', marginBottom: '10px', color: colors.mediumGray, fontSize: '13px' }}>
                Courses section is intentionally blank for now and will be linked later.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <input type="number" min="0" max="100" value={workload.teaching_percentage} onChange={(event) => setWorkload((prev) => ({ ...prev, teaching_percentage: event.target.value }))} placeholder="% Teaching" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="number" min="0" max="100" value={workload.research_percentage} onChange={(event) => setWorkload((prev) => ({ ...prev, research_percentage: event.target.value }))} placeholder="% Research" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="number" min="0" max="100" value={workload.other_percentage} onChange={(event) => setWorkload((prev) => ({ ...prev, other_percentage: event.target.value }))} placeholder="% Other" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
                <input type="number" min="0" max="100" value={workload.program_time_percentage} onChange={(event) => setWorkload((prev) => ({ ...prev, program_time_percentage: event.target.value }))} placeholder="% Program Time" style={{ padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
              </div>
            </div>

            {renderSimpleList('Honors and Awards', honors, setHonors, 'e.g., Best Paper Award')}
            {renderSimpleList('Service Activities', services, setServices, 'e.g., Curriculum committee member')}
            {renderSimpleList('Publications', publications, setPublications, 'e.g., Author, Title, Venue, Year')}

            {saveSuccess && (
              <div style={{ marginBottom: '12px', padding: '12px 16px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', color: '#155724', fontSize: '14px' }}>
                Saved successfully!
              </div>
            )}
            {saveError && (
              <div style={{ marginBottom: '12px', padding: '12px 16px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#721c24', fontSize: '14px' }}>
                {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
              <button type="button" onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, padding: '13px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => setSelectedFaculty(null)} style={{ padding: '13px 22px', backgroundColor: 'white', color: colors.mediumGray, border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        {cvModalOpen && (
          <div onClick={() => setCvModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20, 25, 35, 0.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2100 }}>
            <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: '720px', borderRadius: '14px', backgroundColor: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <div style={{ backgroundColor: colors.primary, color: 'white', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '700' }}>Faculty CV Documents</div>
                <button onClick={() => setCvModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">x</button>
              </div>
              <div style={{ padding: '16px 18px', display: 'grid', gap: '12px' }}>
                <input type="file" multiple onChange={handleCvSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
                <button type="button" disabled style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: '#eceef2', color: colors.mediumGray, fontWeight: '700', cursor: 'not-allowed' }}>
                  Extract with AI
                </button>
                {cvStatus && (
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: colors.mediumGray, fontSize: '13px' }}>
                    {cvStatus}
                  </div>
                )}
                <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                  {cvFiles.length === 0 ? (
                    <div style={{ padding: '14px', color: colors.mediumGray, fontSize: '13px' }}>No documents uploaded yet.</div>
                  ) : (
                    cvFiles.map((file) => (
                      <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', padding: '12px 14px', borderTop: `1px solid ${colors.border}` }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: colors.darkGray, fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                          <div style={{ color: colors.mediumGray, fontSize: '12px' }}>{file.type || 'Unknown'} - {Math.max(1, Math.round((Number(file.size || 0) / 1024)))} KB</div>
                        </div>
                        <button type="button" onClick={() => handleCvRemove(file.id)} style={{ border: `1px solid ${colors.border}`, backgroundColor: 'white', color: colors.mediumGray, borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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

