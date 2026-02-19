import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, X, Users, BookOpen, Database, Plus, ClipboardList, Trash2, Upload, Search } from 'lucide-react';
import { colors, fontStack } from '../../styles/theme';
import { getActiveContext } from '../../utils/activeContext';
import { apiRequest } from '../../utils/api';
import EvidenceLibraryImport from '../shared/EvidenceLibraryImport';

const SO_DOCS_DB_NAME = 'abet-so-documents';
const SO_DOCS_STORE = 'documents';
const CLO_DOCS_DB_NAME = 'abet-clo-documents';
const CLO_DOCS_STORE = 'documents';
const PEO_DOCS_DB_NAME = 'abet-peo-documents';
const PEO_DOCS_STORE = 'documents';

const openSoDocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(SO_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(SO_DOCS_STORE)) {
      const store = db.createObjectStore(SO_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_program', ['cycleId', 'programId'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open SO documents storage.'));
});

const listSoDocuments = async (cycleId, programId) => {
  const db = await openSoDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SO_DOCS_STORE, 'readonly');
    const store = tx.objectStore(SO_DOCS_STORE);
    const index = store.index('by_cycle_program');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));
    query.onsuccess = () => {
      const rows = query.result || [];
      rows.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      resolve(rows);
    };
    query.onerror = () => reject(query.error || new Error('Unable to read stored SO documents.'));
  });
};

const appendSoDocuments = async (cycleId, programId, files) => {
  const db = await openSoDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SO_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(SO_DOCS_STORE);
    const index = store.index('by_cycle_program');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));

      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${programId}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          programId: String(programId),
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString()
        });
      });
    };

    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to store SO documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store SO documents.'));
  });
};

const deleteSoDocumentById = async (docId) => {
  const db = await openSoDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SO_DOCS_STORE, 'readwrite');
    tx.objectStore(SO_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove SO document.'));
  });
};

const openCloDocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(CLO_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(CLO_DOCS_STORE)) {
      const store = db.createObjectStore(CLO_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_program', ['cycleId', 'programId'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open CLO documents storage.'));
});

const listCloDocuments = async (cycleId, programId) => {
  const db = await openCloDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CLO_DOCS_STORE, 'readonly');
    const store = tx.objectStore(CLO_DOCS_STORE);
    const index = store.index('by_cycle_program');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));
    query.onsuccess = () => {
      const rows = query.result || [];
      rows.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      resolve(rows);
    };
    query.onerror = () => reject(query.error || new Error('Unable to read stored CLO documents.'));
  });
};

const appendCloDocuments = async (cycleId, programId, files) => {
  const db = await openCloDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CLO_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(CLO_DOCS_STORE);
    const index = store.index('by_cycle_program');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));

      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${programId}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          programId: String(programId),
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString()
        });
      });
    };

    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to store CLO documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store CLO documents.'));
  });
};

const deleteCloDocumentById = async (docId) => {
  const db = await openCloDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CLO_DOCS_STORE, 'readwrite');
    tx.objectStore(CLO_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove CLO document.'));
  });
};

const openPeoDocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(PEO_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(PEO_DOCS_STORE)) {
      const store = db.createObjectStore(PEO_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_program', ['cycleId', 'programId'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open PEO documents storage.'));
});

const listPeoDocuments = async (cycleId, programId) => {
  const db = await openPeoDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PEO_DOCS_STORE, 'readonly');
    const store = tx.objectStore(PEO_DOCS_STORE);
    const index = store.index('by_cycle_program');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));
    query.onsuccess = () => {
      const rows = query.result || [];
      rows.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      resolve(rows);
    };
    query.onerror = () => reject(query.error || new Error('Unable to read stored PEO documents.'));
  });
};

const appendPeoDocuments = async (cycleId, programId, files) => {
  const db = await openPeoDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PEO_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(PEO_DOCS_STORE);
    const index = store.index('by_cycle_program');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));

      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${programId}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          programId: String(programId),
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString()
        });
      });
    };

    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to store PEO documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store PEO documents.'));
  });
};

const deletePeoDocumentById = async (docId) => {
  const db = await openPeoDocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PEO_DOCS_STORE, 'readwrite');
    tx.objectStore(PEO_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove PEO document.'));
  });
};

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  facultyExpanded,
  setFacultyExpanded,
  soExpanded,
  setSoExpanded,
  cloExpanded,
  setCloExpanded,
  peoExpanded,
  setPeoExpanded,
  coursesExpanded,
  setCoursesExpanded,
  expandedCourse,
  setExpandedCourse,
  setSelectedFaculty,
  setSelectedCourse,
  setSelectedInstructor,
  setSyllabusMode,
  setCurrentPage
}) => {
  const cycleId = localStorage.getItem('currentCycleId') || 1;
  const [programId, setProgramId] = useState(localStorage.getItem('currentProgramId') || null);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState('');
  const [studentOutcomes, setStudentOutcomes] = useState([]);
  const [soLoading, setSoLoading] = useState(false);
  const [soError, setSoError] = useState('');
  const [newSoDescription, setNewSoDescription] = useState('');
  const [editingSoId, setEditingSoId] = useState(null);
  const [editingSoDescription, setEditingSoDescription] = useState('');
  const [deleteSoConfirm, setDeleteSoConfirm] = useState({ open: false, soId: null, label: '' });
  const [soSearchTerm, setSoSearchTerm] = useState('');
  const [soDocsModalOpen, setSoDocsModalOpen] = useState(false);
  const [soDocuments, setSoDocuments] = useState([]);
  const [soDocStatus, setSoDocStatus] = useState('');
  const [clos, setClos] = useState([]);
  const [cloLoading, setCloLoading] = useState(false);
  const [cloError, setCloError] = useState('');
  const [newCloDescription, setNewCloDescription] = useState('');
  const [editingCloId, setEditingCloId] = useState(null);
  const [editingCloDescription, setEditingCloDescription] = useState('');
  const [deleteCloConfirm, setDeleteCloConfirm] = useState({ open: false, cloId: null, label: '' });
  const [cloSearchTerm, setCloSearchTerm] = useState('');
  const [cloDocsModalOpen, setCloDocsModalOpen] = useState(false);
  const [cloDocuments, setCloDocuments] = useState([]);
  const [cloDocStatus, setCloDocStatus] = useState('');
  const [peos, setPeos] = useState([]);
  const [peoLoading, setPeoLoading] = useState(false);
  const [peoError, setPeoError] = useState('');
  const [newPeoDescription, setNewPeoDescription] = useState('');
  const [editingPeoId, setEditingPeoId] = useState(null);
  const [editingPeoDescription, setEditingPeoDescription] = useState('');
  const [deletePeoConfirm, setDeletePeoConfirm] = useState({ open: false, peoId: null, label: '' });
  const [peoSearchTerm, setPeoSearchTerm] = useState('');
  const [peoDocsModalOpen, setPeoDocsModalOpen] = useState(false);
  const [peoDocuments, setPeoDocuments] = useState([]);
  const [peoDocStatus, setPeoDocStatus] = useState('');
  const [coursesData, setCoursesData] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    course_code: '',
    credits: '',
    contact_hours: '',
    course_type: 'Required',
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [sectionDrafts, setSectionDrafts] = useState({});
  const [savingSectionCourseId, setSavingSectionCourseId] = useState(null);
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState({ open: false, courseId: null, label: '' });
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState({ open: false, courseId: null, syllabusId: null, label: '' });

  const facultySubtitle = useMemo(() => {
    if (facultyLoading) return 'Loading...';
    if (facultyError) return facultyError;
    if (facultyMembers.length === 0) return 'No faculty members yet';
    return `${facultyMembers.length} member(s)`;
  }, [facultyLoading, facultyError, facultyMembers.length]);

  const soSubtitle = useMemo(() => {
    if (soLoading) return 'Loading...';
    if (soError) return soError;
    if (studentOutcomes.length === 0) return 'No SOs yet';
    return `${studentOutcomes.length} SO(s)`;
  }, [soLoading, soError, studentOutcomes.length]);

  const filteredStudentOutcomes = useMemo(() => {
    const query = soSearchTerm.trim().toLowerCase();
    if (!query) return studentOutcomes;
    return studentOutcomes.filter((row) => {
      const description = `${row?.so_discription || ''}`.toLowerCase();
      const code = `${row?.display_code || row?.so_code || ''}`.toLowerCase();
      return description.includes(query) || code.includes(query);
    });
  }, [studentOutcomes, soSearchTerm]);

  const cloSubtitle = useMemo(() => {
    if (cloLoading) return 'Loading...';
    if (cloError) return cloError;
    if (clos.length === 0) return 'No CLOs yet';
    return `${clos.length} CLO(s)`;
  }, [cloLoading, cloError, clos.length]);

  const filteredClos = useMemo(() => {
    const query = cloSearchTerm.trim().toLowerCase();
    if (!query) return clos;
    return clos.filter((row) => {
      const description = `${row?.description || ''}`.toLowerCase();
      const code = `${row?.display_code || row?.clo_code || ''}`.toLowerCase();
      return description.includes(query) || code.includes(query);
    });
  }, [clos, cloSearchTerm]);

  const peoSubtitle = useMemo(() => {
    if (peoLoading) return 'Loading...';
    if (peoError) return peoError;
    if (peos.length === 0) return 'No PEOs yet';
    return `${peos.length} PEO(s)`;
  }, [peoLoading, peoError, peos.length]);

  const filteredPeos = useMemo(() => {
    const query = peoSearchTerm.trim().toLowerCase();
    if (!query) return peos;
    return peos.filter((row) => {
      const description = `${row?.peo_description || ''}`.toLowerCase();
      const code = `${row?.display_code || row?.peo_code || ''}`.toLowerCase();
      return description.includes(query) || code.includes(query);
    });
  }, [peos, peoSearchTerm]);

  const resolveProgramId = async () => {
    const cycle = await apiRequest(`/accreditation-cycles/${cycleId}/`, { method: 'GET' });
    const resolvedProgramId = Number(cycle?.program || 0) || null;
    if (resolvedProgramId) {
      setProgramId(resolvedProgramId);
      localStorage.setItem('currentProgramId', String(resolvedProgramId));
    }
    return resolvedProgramId;
  };

  const loadFacultyMembers = async ({ retryOnUnexpectedEmpty = false } = {}) => {
    const previousCount = facultyMembers.length;
    try {
      setFacultyLoading(true);
      setFacultyError('');
      const resolvedProgramId = await resolveProgramId();
      if (!resolvedProgramId) {
        setFacultyMembers([]);
        setFacultyError('No program selected');
        return;
      }
      let list = await apiRequest(`/programs/${resolvedProgramId}/faculty-members/`, { method: 'GET' });
      if (retryOnUnexpectedEmpty && previousCount > 0 && Array.isArray(list) && list.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        list = await apiRequest(`/programs/${resolvedProgramId}/faculty-members/`, { method: 'GET' });
      }
      if (Array.isArray(list)) {
        setFacultyMembers(list);
      } else {
        setFacultyMembers([]);
      }
    } catch (_error) {
      setFacultyError('Unable to load');
    } finally {
      setFacultyLoading(false);
    }
  };

  const loadStudentOutcomes = async () => {
    try {
      setSoLoading(true);
      setSoError('');
      const resolvedProgramId = await resolveProgramId();
      if (!resolvedProgramId) {
        setStudentOutcomes([]);
        setSoError('No program selected');
        return;
      }
      const rows = await apiRequest(`/programs/${resolvedProgramId}/student-outcomes/`, { method: 'GET' });
      setStudentOutcomes(Array.isArray(rows) ? rows : []);
    } catch (_error) {
      setSoError('Unable to load');
    } finally {
      setSoLoading(false);
    }
  };

  const loadClos = async () => {
    try {
      setCloLoading(true);
      setCloError('');
      const resolvedProgramId = await resolveProgramId();
      if (!resolvedProgramId) {
        setClos([]);
        setCloError('No program selected');
        return;
      }
      const rows = await apiRequest(`/programs/${resolvedProgramId}/clos/`, { method: 'GET' });
      setClos(Array.isArray(rows) ? rows : []);
    } catch (_error) {
      setCloError('Unable to load');
    } finally {
      setCloLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      setCoursesError('');
      const resolvedProgramId = await resolveProgramId();
      if (!resolvedProgramId) {
        setCoursesData([]);
        setCoursesError('No program selected');
        return;
      }
      const rows = await apiRequest(`/programs/${resolvedProgramId}/courses/?cycle_id=${cycleId}`, { method: 'GET' });
      setCoursesData(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setCoursesError(error?.message || 'Unable to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadPeos = async () => {
    try {
      setPeoLoading(true);
      setPeoError('');
      const resolvedProgramId = await resolveProgramId();
      if (!resolvedProgramId) {
        setPeos([]);
        setPeoError('No program selected');
        return;
      }
      const rows = await apiRequest(`/programs/${resolvedProgramId}/peos/`, { method: 'GET' });
      setPeos(Array.isArray(rows) ? rows : []);
    } catch (_error) {
      setPeoError('Unable to load');
    } finally {
      setPeoLoading(false);
    }
  };

  useEffect(() => {
    if (sidebarOpen && facultyExpanded) {
      loadFacultyMembers();
    }
  }, [sidebarOpen, facultyExpanded, cycleId]);

  useEffect(() => {
    if (sidebarOpen && soExpanded) {
      loadStudentOutcomes();
    }
  }, [sidebarOpen, soExpanded, cycleId]);

  useEffect(() => {
    if (sidebarOpen && cloExpanded) {
      loadClos();
    }
  }, [sidebarOpen, cloExpanded, cycleId]);

  useEffect(() => {
    if (sidebarOpen && peoExpanded) {
      loadPeos();
    }
  }, [sidebarOpen, peoExpanded, cycleId]);

  useEffect(() => {
    if (sidebarOpen && coursesExpanded) {
      loadCourses();
      loadFacultyMembers();
    }
  }, [sidebarOpen, coursesExpanded, cycleId]);

  useEffect(() => {
    const handleFacultyUpdated = (event) => {
      const deletedFacultyId = Number(event?.detail?.deletedFacultyId || 0);
      if (deletedFacultyId) {
        setFacultyMembers((prev) => prev.filter((row) => Number(row?.faculty_id) !== deletedFacultyId));
      }
      loadFacultyMembers({ retryOnUnexpectedEmpty: true });
      localStorage.removeItem('facultyNeedsRefresh');
    };

    window.addEventListener('faculty-updated', handleFacultyUpdated);
    return () => window.removeEventListener('faculty-updated', handleFacultyUpdated);
  }, []);

  useEffect(() => {
    const handleCoursesUpdated = () => {
      if (sidebarOpen && coursesExpanded) {
        loadCourses();
      }
    };
    window.addEventListener('courses-updated', handleCoursesUpdated);
    return () => window.removeEventListener('courses-updated', handleCoursesUpdated);
  }, [sidebarOpen, coursesExpanded]);

  const handleAddFaculty = () => {
      setSelectedFaculty({
        isNew: true,
        faculty_id: null,
      program_id: programId ? Number(programId) : null,
      full_name: '',
      academic_rank: '',
      appointment_type: '',
      email: '',
      office_hours: ''
    });
  };

  const handleCreateSo = async () => {
    const description = newSoDescription.trim();
    if (!description) {
      setSoError('SO description cannot be blank.');
      return;
    }
    try {
      setSoLoading(true);
      setSoError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setSoError('No program selected');
        return;
      }
      const created = await apiRequest(`/programs/${resolvedProgramId}/student-outcomes/`, {
        method: 'POST',
        body: JSON.stringify({ so_discription: description })
      });
      setStudentOutcomes((prev) => [...prev, created]);
      window.dispatchEvent(new CustomEvent('so-peo-updated'));
      setNewSoDescription('');
    } catch (error) {
      setSoError(error?.message || 'Unable to create SO.');
    } finally {
      setSoLoading(false);
    }
  };

  const handleSaveSoEdit = async () => {
    const description = editingSoDescription.trim();
    if (!editingSoId) return;
    if (!description) {
      setSoError('SO description cannot be blank.');
      return;
    }
    try {
      setSoLoading(true);
      setSoError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setSoError('No program selected');
        return;
      }
      const updated = await apiRequest(`/programs/${resolvedProgramId}/student-outcomes/${editingSoId}/`, {
        method: 'PUT',
        body: JSON.stringify({ so_discription: description })
      });
      setStudentOutcomes((prev) => prev.map((row) => (Number(row.so_id) === Number(editingSoId) ? updated : row)));
      window.dispatchEvent(new CustomEvent('so-peo-updated'));
      setEditingSoId(null);
      setEditingSoDescription('');
    } catch (error) {
      setSoError(error?.message || 'Unable to update SO.');
    } finally {
      setSoLoading(false);
    }
  };

  const handleDeleteSo = async () => {
    try {
      const soId = deleteSoConfirm.soId;
      if (!soId) return;
      setSoLoading(true);
      setSoError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setSoError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/student-outcomes/${soId}/`, { method: 'DELETE' });
      setStudentOutcomes((prev) => prev.filter((row) => Number(row.so_id) !== Number(soId)));
      window.dispatchEvent(new CustomEvent('so-peo-updated'));
      setDeleteSoConfirm({ open: false, soId: null, label: '' });
    } catch (error) {
      setSoError(error?.message || 'Unable to delete SO.');
    } finally {
      setSoLoading(false);
    }
  };

  const openSoDocsModal = async () => {
    try {
      setSoDocStatus('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setSoDocStatus('No program selected.');
        return;
      }
      const rows = await listSoDocuments(cycleId, resolvedProgramId);
      setSoDocuments(rows);
      setSoDocsModalOpen(true);
    } catch (error) {
      setSoDocuments([]);
      setSoDocStatus(error?.message || 'Unable to load saved documents.');
      setSoDocsModalOpen(true);
    }
  };

  const closeSoDocsModal = () => {
    setSoDocsModalOpen(false);
    setSoDocuments([]);
    setSoDocStatus('');
  };

  const handleSoDocumentFiles = async (files) => {
    try {
      const selectedFiles = Array.isArray(files) ? files : [];
      if (selectedFiles.length === 0) return;
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setSoDocStatus('No program selected.');
        return;
      }
      await appendSoDocuments(cycleId, resolvedProgramId, selectedFiles);
      const rows = await listSoDocuments(cycleId, resolvedProgramId);
      setSoDocuments(rows);
      setSoDocStatus(`${rows.length} file(s) saved for SO bulk import.`);
    } catch (error) {
      setSoDocStatus(error?.message || 'Unable to save selected documents.');
    }
  };

  const handleSoDocumentSelection = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      await handleSoDocumentFiles(files);
    } catch (error) {
      setSoDocStatus(error?.message || 'Unable to save selected documents.');
    }
  };

  const handleRemoveSoDocument = async (docId) => {
    if (!docId) return;
    try {
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setSoDocStatus('No program selected.');
        return;
      }
      await deleteSoDocumentById(docId);
      const rows = await listSoDocuments(cycleId, resolvedProgramId);
      setSoDocuments(rows);
      setSoDocStatus('Document removed.');
    } catch (error) {
      setSoDocStatus(error?.message || 'Unable to remove document.');
    }
  };

  const handleCreateClo = async () => {
    const description = newCloDescription.trim();
    if (!description) {
      setCloError('CLO description cannot be blank.');
      return;
    }
    try {
      setCloLoading(true);
      setCloError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCloError('No program selected');
        return;
      }
      const created = await apiRequest(`/programs/${resolvedProgramId}/clos/`, {
        method: 'POST',
        body: JSON.stringify({ description })
      });
      setClos((prev) => [...prev, created]);
      setNewCloDescription('');
    } catch (error) {
      setCloError(error?.message || 'Unable to create CLO.');
    } finally {
      setCloLoading(false);
    }
  };

  const handleSaveCloEdit = async () => {
    const description = editingCloDescription.trim();
    if (!editingCloId) return;
    if (!description) {
      setCloError('CLO description cannot be blank.');
      return;
    }
    try {
      setCloLoading(true);
      setCloError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCloError('No program selected');
        return;
      }
      const updated = await apiRequest(`/programs/${resolvedProgramId}/clos/${editingCloId}/`, {
        method: 'PUT',
        body: JSON.stringify({ description })
      });
      setClos((prev) => prev.map((row) => (Number(row.clo_id) === Number(editingCloId) ? updated : row)));
      setEditingCloId(null);
      setEditingCloDescription('');
    } catch (error) {
      setCloError(error?.message || 'Unable to update CLO.');
    } finally {
      setCloLoading(false);
    }
  };

  const handleDeleteClo = async () => {
    try {
      const cloId = deleteCloConfirm.cloId;
      if (!cloId) return;
      setCloLoading(true);
      setCloError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCloError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/clos/${cloId}/`, { method: 'DELETE' });
      setClos((prev) => prev.filter((row) => Number(row.clo_id) !== Number(cloId)));
      setDeleteCloConfirm({ open: false, cloId: null, label: '' });
    } catch (error) {
      setCloError(error?.message || 'Unable to delete CLO.');
    } finally {
      setCloLoading(false);
    }
  };

  const openCloDocsModal = async () => {
    try {
      setCloDocStatus('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCloDocStatus('No program selected.');
        return;
      }
      const rows = await listCloDocuments(cycleId, resolvedProgramId);
      setCloDocuments(rows);
      setCloDocsModalOpen(true);
    } catch (error) {
      setCloDocuments([]);
      setCloDocStatus(error?.message || 'Unable to load saved documents.');
      setCloDocsModalOpen(true);
    }
  };

  const closeCloDocsModal = () => {
    setCloDocsModalOpen(false);
    setCloDocuments([]);
    setCloDocStatus('');
  };

  const handleCloDocumentFiles = async (files) => {
    try {
      const selectedFiles = Array.isArray(files) ? files : [];
      if (selectedFiles.length === 0) return;
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCloDocStatus('No program selected.');
        return;
      }
      await appendCloDocuments(cycleId, resolvedProgramId, selectedFiles);
      const rows = await listCloDocuments(cycleId, resolvedProgramId);
      setCloDocuments(rows);
      setCloDocStatus(`${rows.length} file(s) saved for CLO bulk import.`);
    } catch (error) {
      setCloDocStatus(error?.message || 'Unable to save selected documents.');
    }
  };

  const handleCloDocumentSelection = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      await handleCloDocumentFiles(files);
    } catch (error) {
      setCloDocStatus(error?.message || 'Unable to save selected documents.');
    }
  };

  const handleRemoveCloDocument = async (docId) => {
    if (!docId) return;
    try {
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCloDocStatus('No program selected.');
        return;
      }
      await deleteCloDocumentById(docId);
      const rows = await listCloDocuments(cycleId, resolvedProgramId);
      setCloDocuments(rows);
      setCloDocStatus('Document removed.');
    } catch (error) {
      setCloDocStatus(error?.message || 'Unable to remove document.');
    }
  };

  const handleCreatePeo = async () => {
    const description = newPeoDescription.trim();
    if (!description) {
      setPeoError('PEO description cannot be blank.');
      return;
    }
    try {
      setPeoLoading(true);
      setPeoError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setPeoError('No program selected');
        return;
      }
      const created = await apiRequest(`/programs/${resolvedProgramId}/peos/`, {
        method: 'POST',
        body: JSON.stringify({ peo_description: description })
      });
      setPeos((prev) => [...prev, created]);
      window.dispatchEvent(new CustomEvent('so-peo-updated'));
      setNewPeoDescription('');
    } catch (error) {
      setPeoError(error?.message || 'Unable to create PEO.');
    } finally {
      setPeoLoading(false);
    }
  };

  const handleSavePeoEdit = async () => {
    const description = editingPeoDescription.trim();
    if (!editingPeoId) return;
    if (!description) {
      setPeoError('PEO description cannot be blank.');
      return;
    }
    try {
      setPeoLoading(true);
      setPeoError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setPeoError('No program selected');
        return;
      }
      const updated = await apiRequest(`/programs/${resolvedProgramId}/peos/${editingPeoId}/`, {
        method: 'PUT',
        body: JSON.stringify({ peo_description: description })
      });
      setPeos((prev) => prev.map((row) => (Number(row.peo_id) === Number(editingPeoId) ? updated : row)));
      window.dispatchEvent(new CustomEvent('so-peo-updated'));
      setEditingPeoId(null);
      setEditingPeoDescription('');
    } catch (error) {
      setPeoError(error?.message || 'Unable to update PEO.');
    } finally {
      setPeoLoading(false);
    }
  };

  const handleDeletePeo = async () => {
    try {
      const peoId = deletePeoConfirm.peoId;
      if (!peoId) return;
      setPeoLoading(true);
      setPeoError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setPeoError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/peos/${peoId}/`, { method: 'DELETE' });
      setPeos((prev) => prev.filter((row) => Number(row.peo_id) !== Number(peoId)));
      window.dispatchEvent(new CustomEvent('so-peo-updated'));
      setDeletePeoConfirm({ open: false, peoId: null, label: '' });
    } catch (error) {
      setPeoError(error?.message || 'Unable to delete PEO.');
    } finally {
      setPeoLoading(false);
    }
  };

  const openPeoDocsModal = async () => {
    try {
      setPeoDocStatus('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setPeoDocStatus('No program selected.');
        return;
      }
      const rows = await listPeoDocuments(cycleId, resolvedProgramId);
      setPeoDocuments(rows);
      setPeoDocsModalOpen(true);
    } catch (error) {
      setPeoDocuments([]);
      setPeoDocStatus(error?.message || 'Unable to load saved documents.');
      setPeoDocsModalOpen(true);
    }
  };

  const closePeoDocsModal = () => {
    setPeoDocsModalOpen(false);
    setPeoDocuments([]);
    setPeoDocStatus('');
  };

  const handlePeoDocumentFiles = async (files) => {
    try {
      const selectedFiles = Array.isArray(files) ? files : [];
      if (selectedFiles.length === 0) return;
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setPeoDocStatus('No program selected.');
        return;
      }
      await appendPeoDocuments(cycleId, resolvedProgramId, selectedFiles);
      const rows = await listPeoDocuments(cycleId, resolvedProgramId);
      setPeoDocuments(rows);
      setPeoDocStatus(`${rows.length} file(s) saved for PEO bulk import.`);
    } catch (error) {
      setPeoDocStatus(error?.message || 'Unable to save selected documents.');
    }
  };

  const handlePeoDocumentSelection = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      await handlePeoDocumentFiles(files);
    } catch (error) {
      setPeoDocStatus(error?.message || 'Unable to save selected documents.');
    }
  };

  const handleRemovePeoDocument = async (docId) => {
    if (!docId) return;
    try {
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setPeoDocStatus('No program selected.');
        return;
      }
      await deletePeoDocumentById(docId);
      const rows = await listPeoDocuments(cycleId, resolvedProgramId);
      setPeoDocuments(rows);
      setPeoDocStatus('Document removed.');
    } catch (error) {
      setPeoDocStatus(error?.message || 'Unable to remove document.');
    }
  };

  const handleCourseFieldChange = (field, value) => {
    setNewCourseForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCourse = async () => {
    const code = `${newCourseForm.course_code || ''}`.trim().toUpperCase();
    if (!code) {
      setCoursesError('Course code is required.');
      return;
    }
    try {
      setSavingCourse(true);
      setCoursesError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCoursesError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/courses/`, {
        method: 'POST',
        body: JSON.stringify({
          cycle_id: Number(cycleId),
          course_code: code,
          credits: newCourseForm.credits === '' ? 0 : Number(newCourseForm.credits),
          contact_hours: newCourseForm.contact_hours === '' ? 0 : Number(newCourseForm.contact_hours),
          course_type: newCourseForm.course_type || 'Required',
        }),
      });
      setNewCourseForm({ course_code: '', credits: '', contact_hours: '', course_type: 'Required' });
      setShowAddCourseForm(false);
      await loadCourses();
      window.dispatchEvent(new CustomEvent('courses-updated'));
    } catch (error) {
      setCoursesError(error?.message || 'Unable to create course.');
    } finally {
      setSavingCourse(false);
    }
  };

  const openSectionDraft = (courseId) => {
    setSectionDrafts((prev) => ({
      ...prev,
      [courseId]: {
        open: true,
        faculty_id: prev[courseId]?.faculty_id || '',
        term: prev[courseId]?.term || '',
      }
    }));
  };

  const closeSectionDraft = (courseId) => {
    setSectionDrafts((prev) => ({
      ...prev,
      [courseId]: { open: false, faculty_id: '', term: '' }
    }));
  };

  const updateSectionDraft = (courseId, field, value) => {
    setSectionDrafts((prev) => ({
      ...prev,
      [courseId]: {
        open: true,
        faculty_id: prev[courseId]?.faculty_id || '',
        term: prev[courseId]?.term || '',
        [field]: value,
      }
    }));
  };

  const handleCreateSection = async (courseId) => {
    const draft = sectionDrafts[courseId] || {};
    const term = `${draft.term || ''}`.trim();
    const facultyId = Number(draft.faculty_id || 0);
    if (!term) {
      setCoursesError('Section term is required.');
      return;
    }
    if (!facultyId) {
      setCoursesError('Please select a faculty member for the section.');
      return;
    }
    try {
      setSavingSectionCourseId(courseId);
      setCoursesError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCoursesError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/courses/${courseId}/sections/`, {
        method: 'POST',
        body: JSON.stringify({
          cycle_id: Number(cycleId),
          faculty_id: facultyId,
          term,
        }),
      });
      closeSectionDraft(courseId);
      await loadCourses();
      window.dispatchEvent(new CustomEvent('courses-updated'));
    } catch (error) {
      setCoursesError(error?.message || 'Unable to add section.');
    } finally {
      setSavingSectionCourseId(null);
    }
  };

  const handleDeleteCourse = async () => {
    const courseId = Number(deleteCourseConfirm.courseId || 0);
    if (!courseId) return;
    try {
      setCoursesLoading(true);
      setCoursesError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCoursesError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/courses/${courseId}/?cycle_id=${cycleId}`, { method: 'DELETE' });
      setDeleteCourseConfirm({ open: false, courseId: null, label: '' });
      await loadCourses();
      window.dispatchEvent(new CustomEvent('courses-updated'));
    } catch (error) {
      setCoursesError(error?.message || 'Unable to delete course.');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleDeleteSection = async () => {
    const courseId = Number(deleteSectionConfirm.courseId || 0);
    const syllabusId = Number(deleteSectionConfirm.syllabusId || 0);
    if (!courseId || !syllabusId) return;
    try {
      setCoursesLoading(true);
      setCoursesError('');
      const resolvedProgramId = programId ? Number(programId) : await resolveProgramId();
      if (!resolvedProgramId) {
        setCoursesError('No program selected');
        return;
      }
      await apiRequest(`/programs/${resolvedProgramId}/courses/${courseId}/sections/${syllabusId}/?cycle_id=${cycleId}`, { method: 'DELETE' });
      setDeleteSectionConfirm({ open: false, courseId: null, syllabusId: null, label: '' });
      await loadCourses();
      window.dispatchEvent(new CustomEvent('courses-updated'));
    } catch (error) {
      setCoursesError(error?.message || 'Unable to delete section.');
    } finally {
      setCoursesLoading(false);
    }
  };

  return (
  <div style={{
    position: 'fixed',
    left: sidebarOpen ? 0 : '-420px',
    top: 0,
    width: '420px',
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
    transition: 'left 0.3s ease-in-out',
    zIndex: 1000,
    overflowY: 'auto',
    fontFamily: fontStack
  }}>
    {/* Sidebar Header */}
    <div style={{ backgroundColor: colors.primary, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
      <div>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: '700', letterSpacing: '0.3px' }}>Quick Access</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginTop: '4px', fontWeight: '400' }}>{getActiveContext().subtitle}</div>
      </div>
      <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
        <X size={24} />
      </button>
    </div>

    {/* Sidebar Content */}
    <div style={{ padding: '24px' }}>
      {/* Faculty Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setFacultyExpanded(!facultyExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} color={colors.primary} />
            Faculty Members
          </div>
          {facultyExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {facultyExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>{facultySubtitle}</div>
            {facultyMembers.map((faculty) => (
              <div
                key={faculty.faculty_id}
                onClick={() => setSelectedFaculty(faculty)}
                style={{
                  padding: '12px 16px',
                  marginBottom: '8px',
                  backgroundColor: colors.hover,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  border: `1px solid ${colors.border}`
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.darkGray, marginBottom: '4px' }}>{faculty.full_name}</div>
                <div style={{ fontSize: '12px', color: colors.mediumGray }}>{faculty.academic_rank || 'No rank yet'}</div>
              </div>
            ))}
            <button onClick={handleAddFaculty} style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              backgroundColor: 'white',
              color: colors.primary,
              border: `2px dashed ${colors.primary}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Plus size={16} />
              Add Faculty Member
            </button>
          </div>
        )}
      </div>

      {/* SO Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setSoExpanded(!soExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={20} color={colors.primary} />
            SO
          </div>
          {soExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {soExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>{soSubtitle}</div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', backgroundColor: 'white', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    onClick={openSoDocsModal}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Upload size={13} />
                    Upload Documents
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color={colors.mediumGray} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={soSearchTerm}
                    onChange={(event) => setSoSearchTerm(event.target.value)}
                    placeholder="Search SO by code or description"
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <textarea
                    value={newSoDescription}
                    onChange={(event) => setNewSoDescription(event.target.value)}
                    placeholder="Write a student outcome description, then click Add SO."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateSo}
                    disabled={!newSoDescription.trim()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'white',
                      color: colors.primary,
                      border: `2px dashed ${colors.primary}`,
                      borderRadius: '6px',
                      cursor: !newSoDescription.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: !newSoDescription.trim() ? 0.6 : 1
                    }}
                  >
                    <Plus size={14} />
                    Add SO
                  </button>
                </div>
              </div>
            </div>

            {soError ? (
              <div style={{ marginBottom: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                {soError}
              </div>
            ) : null}

            <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredStudentOutcomes.map((soRow) => {
              const rowId = Number(soRow.so_id);
              const isEditing = Number(editingSoId) === rowId;
              return (
                <div
                  key={rowId}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '8px',
                    backgroundColor: colors.hover,
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: colors.primary, marginBottom: '6px' }}>
                    {soRow.display_code || soRow.so_code}
                  </div>
                  {isEditing ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <textarea
                        value={editingSoDescription}
                        onChange={(event) => setEditingSoDescription(event.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={handleSaveSoEdit}
                          disabled={!editingSoDescription.trim()}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: !editingSoDescription.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            fontWeight: '700',
                            opacity: !editingSoDescription.trim() ? 0.6 : 1
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSoId(null);
                            setEditingSoDescription('');
                          }}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: 'white',
                            color: colors.mediumGray,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '12px', color: colors.darkGray, marginBottom: '8px' }}>{soRow.so_discription}</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSoId(rowId);
                            setEditingSoDescription(soRow.so_discription || '');
                          }}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: 'white',
                            color: colors.primary,
                            border: `1px solid ${colors.primary}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteSoConfirm({ open: true, soId: rowId, label: soRow.display_code || soRow.so_code })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: 'white',
                            color: '#b42318',
                            border: '1px solid #ef9a9a',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            </div>

            {filteredStudentOutcomes.length === 0 ? (
              <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '8px' }}>
                {studentOutcomes.length === 0 ? 'No SOs yet.' : 'No SO matches your search.'}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* PEO Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setCloExpanded(!cloExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={20} color={colors.primary} />
            CLO
          </div>
          {cloExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {cloExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>{cloSubtitle}</div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', backgroundColor: 'white', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    onClick={openCloDocsModal}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Upload size={13} />
                    Upload Documents
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color={colors.mediumGray} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={cloSearchTerm}
                    onChange={(event) => setCloSearchTerm(event.target.value)}
                    placeholder="Search CLO by code or description"
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <textarea
                    value={newCloDescription}
                    onChange={(event) => setNewCloDescription(event.target.value)}
                    placeholder="Write a CLO description, then click Add CLO."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateClo}
                    disabled={!newCloDescription.trim()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'white',
                      color: colors.primary,
                      border: `2px dashed ${colors.primary}`,
                      borderRadius: '6px',
                      cursor: !newCloDescription.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: !newCloDescription.trim() ? 0.6 : 1
                    }}
                  >
                    <Plus size={14} />
                    Add CLO
                  </button>
                </div>
              </div>
            </div>

            {cloError ? (
              <div style={{ marginBottom: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                {cloError}
              </div>
            ) : null}

            <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredClos.map((cloRow) => {
                const rowId = Number(cloRow.clo_id);
                const isEditing = Number(editingCloId) === rowId;
                return (
                  <div
                    key={rowId}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '8px',
                      backgroundColor: colors.hover,
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '800', color: colors.primary, marginBottom: '6px' }}>
                      {cloRow.display_code || cloRow.clo_code}
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <textarea
                          value={editingCloDescription}
                          onChange={(event) => setEditingCloDescription(event.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={handleSaveCloEdit}
                            disabled={!editingCloDescription.trim()}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: colors.primary,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: !editingCloDescription.trim() ? 'not-allowed' : 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              opacity: !editingCloDescription.trim() ? 0.6 : 1
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCloId(null);
                              setEditingCloDescription('');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: 'white',
                              color: colors.mediumGray,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '12px', color: colors.darkGray, marginBottom: '8px' }}>{cloRow.description}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCloId(rowId);
                              setEditingCloDescription(cloRow.description || '');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: 'white',
                              color: colors.primary,
                              border: `1px solid ${colors.primary}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCloConfirm({ open: true, cloId: rowId, label: cloRow.display_code || cloRow.clo_code })}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: 'white',
                              color: '#b42318',
                              border: '1px solid #ef9a9a',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredClos.length === 0 ? (
              <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '8px' }}>
                {clos.length === 0 ? 'No CLOs yet.' : 'No CLO matches your search.'}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* PEO Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setPeoExpanded(!peoExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={20} color={colors.primary} />
            PEO
          </div>
          {peoExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {peoExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>{peoSubtitle}</div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', backgroundColor: 'white', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    onClick={openPeoDocsModal}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Upload size={13} />
                    Upload Documents
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color={colors.mediumGray} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={peoSearchTerm}
                    onChange={(event) => setPeoSearchTerm(event.target.value)}
                    placeholder="Search PEO by code or description"
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <textarea
                    value={newPeoDescription}
                    onChange={(event) => setNewPeoDescription(event.target.value)}
                    placeholder="Write a program educational objective, then click Add PEO."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreatePeo}
                    disabled={!newPeoDescription.trim()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'white',
                      color: colors.primary,
                      border: `2px dashed ${colors.primary}`,
                      borderRadius: '6px',
                      cursor: !newPeoDescription.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: !newPeoDescription.trim() ? 0.6 : 1
                    }}
                  >
                    <Plus size={14} />
                    Add PEO
                  </button>
                </div>
              </div>
            </div>

            {peoError ? (
              <div style={{ marginBottom: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                {peoError}
              </div>
            ) : null}

            <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredPeos.map((peoRow) => {
                const rowId = Number(peoRow.peo_id);
                const isEditing = Number(editingPeoId) === rowId;
                return (
                  <div
                    key={rowId}
                    style={{
                      padding: '10px 12px',
                      marginBottom: '8px',
                      backgroundColor: colors.hover,
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '800', color: colors.primary, marginBottom: '6px' }}>
                      {peoRow.display_code || peoRow.peo_code}
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <textarea
                          value={editingPeoDescription}
                          onChange={(event) => setEditingPeoDescription(event.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={handleSavePeoEdit}
                            disabled={!editingPeoDescription.trim()}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: colors.primary,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: !editingPeoDescription.trim() ? 'not-allowed' : 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              opacity: !editingPeoDescription.trim() ? 0.6 : 1
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPeoId(null);
                              setEditingPeoDescription('');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: 'white',
                              color: colors.mediumGray,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '12px', color: colors.darkGray, marginBottom: '8px' }}>{peoRow.peo_description}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPeoId(rowId);
                              setEditingPeoDescription(peoRow.peo_description || '');
                            }}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: 'white',
                              color: colors.primary,
                              border: `1px solid ${colors.primary}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletePeoConfirm({ open: true, peoId: rowId, label: peoRow.display_code || peoRow.peo_code })}
                            style={{
                              flex: 1,
                              padding: '6px',
                              backgroundColor: 'white',
                              color: '#b42318',
                              border: '1px solid #ef9a9a',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredPeos.length === 0 ? (
              <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '8px' }}>
                {peos.length === 0 ? 'No PEOs yet.' : 'No PEO matches your search.'}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Courses Section */}
      <div style={{ marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
        <button
          onClick={() => setCoursesExpanded(!coursesExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={20} color={colors.primary} />
            Courses
          </div>
          {coursesExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {coursesExpanded && (
          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            {coursesError ? (
              <div style={{ marginBottom: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                {coursesError}
              </div>
            ) : null}

            <div style={{ fontSize: '12px', color: colors.mediumGray, marginBottom: '8px' }}>
              {coursesLoading ? 'Loading...' : `${coursesData.length} course(s)`}
            </div>

            {coursesData.map((course) => {
              const courseId = Number(course.course_id || course.id);
              const draft = sectionDrafts[courseId] || { open: false, faculty_id: '', term: '' };
              const usedFacultyIds = new Set((course.sections || []).map((section) => Number(section.faculty_id || 0)).filter((id) => id > 0));
              const availableFacultyMembers = facultyMembers.filter((faculty) => !usedFacultyIds.has(Number(faculty.faculty_id || 0)));
              return (
                <div key={courseId} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div
                      onClick={() => setExpandedCourse(expandedCourse === courseId ? null : courseId)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: colors.hover,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: colors.primary, marginBottom: '2px' }}>{course.code}</div>
                      <div style={{ fontSize: '12px', color: colors.mediumGray }}>
                        {course.credits} credits • {course.contact_hours} hrs • {course.course_type}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteCourseConfirm({ open: true, courseId, label: course.code })}
                      style={{
                        border: `1px solid ${colors.border}`,
                        backgroundColor: 'white',
                        color: '#b42318',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedCourse(expandedCourse === courseId ? null : courseId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        color: colors.mediumGray
                      }}
                    >
                      {expandedCourse === courseId ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>

                  {expandedCourse === courseId && (
                    <div style={{ marginTop: '8px', marginLeft: '16px', paddingLeft: '16px', borderLeft: `2px solid ${colors.border}` }}>
                      <button
                        type="button"
                        disabled
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginBottom: '8px',
                          fontSize: '11px',
                          backgroundColor: '#eceef2',
                          color: colors.mediumGray,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          cursor: 'not-allowed',
                          fontWeight: '700'
                        }}
                      >
                        Generate Common Syllabus (Course Level)
                      </button>

                      {(course.sections || []).map((section) => (
                        <div
                          key={section.syllabus_id}
                          style={{
                            padding: '10px 12px',
                            marginBottom: '6px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            border: `1px solid ${colors.border}`,
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: colors.darkGray, marginBottom: '2px' }}>{section.faculty_name || `Faculty #${section.faculty_id}`}</div>
                          <div style={{ color: colors.mediumGray, fontSize: '11px', marginBottom: '8px' }}>{section.term}</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedCourse({ ...course, program_id: Number(programId || 0), cycle_id: Number(cycleId || 0) });
                                setSelectedInstructor({
                                  ...section,
                                  name: section.faculty_name,
                                  syllabus_id: section.syllabus_id,
                                  faculty_id: section.faculty_id,
                                  term: section.term,
                                  course_id: courseId,
                                  program_id: Number(programId),
                                  cycle_id: Number(cycleId),
                                });
                                setSyllabusMode('view');
                              }}
                              style={{
                                flex: 1,
                                padding: '6px',
                                fontSize: '11px',
                                backgroundColor: 'white',
                                color: colors.primary,
                                border: `1px solid ${colors.primary}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}>
                              View
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCourse({ ...course, program_id: Number(programId || 0), cycle_id: Number(cycleId || 0) });
                                setSelectedInstructor({
                                  ...section,
                                  name: section.faculty_name,
                                  syllabus_id: section.syllabus_id,
                                  faculty_id: section.faculty_id,
                                  term: section.term,
                                  course_id: courseId,
                                  program_id: Number(programId),
                                  cycle_id: Number(cycleId),
                                });
                                setSyllabusMode('edit');
                              }}
                              style={{
                                flex: 1,
                                padding: '6px',
                                fontSize: '11px',
                                backgroundColor: colors.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteSectionConfirm({ open: true, courseId, syllabusId: section.syllabus_id, label: `${course.code} - ${section.term}` })}
                              style={{
                                width: '40px',
                                padding: '6px',
                                fontSize: '11px',
                                backgroundColor: 'white',
                                color: '#b42318',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {draft.open ? (
                        <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '10px', backgroundColor: '#fafafa', marginTop: '8px' }}>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            <input
                              type="text"
                              value={draft.term}
                              onChange={(event) => updateSectionDraft(courseId, 'term', event.target.value)}
                              placeholder="Term (e.g., Fall 2026)"
                              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                            />
                            <select
                              value={draft.faculty_id}
                              onChange={(event) => updateSectionDraft(courseId, 'faculty_id', event.target.value)}
                              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                            >
                              <option value="">Select Faculty</option>
                              {availableFacultyMembers.map((faculty) => (
                                <option key={faculty.faculty_id} value={faculty.faculty_id}>
                                  {faculty.full_name}
                                </option>
                              ))}
                            </select>
                            {availableFacultyMembers.length === 0 ? (
                              <div style={{ fontSize: '11px', color: colors.mediumGray }}>
                                All faculty members already have a section for this course.
                              </div>
                            ) : null}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleCreateSection(courseId)}
                                disabled={savingSectionCourseId === courseId || availableFacultyMembers.length === 0}
                                style={{
                                  flex: 1,
                                  padding: '7px',
                                  backgroundColor: colors.primary,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: savingSectionCourseId === courseId || availableFacultyMembers.length === 0 ? 'not-allowed' : 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  opacity: savingSectionCourseId === courseId || availableFacultyMembers.length === 0 ? 0.7 : 1
                                }}
                              >
                                {savingSectionCourseId === courseId ? 'Saving...' : 'Save Section'}
                              </button>
                              <button
                                type="button"
                                onClick={() => closeSectionDraft(courseId)}
                                style={{
                                  flex: 1,
                                  padding: '7px',
                                  backgroundColor: 'white',
                                  color: colors.mediumGray,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '700'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSectionDraft(courseId)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '8px',
                            backgroundColor: 'white',
                            color: colors.primary,
                            border: `1px dashed ${colors.primary}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Plus size={14} />
                          Add Section (Faculty Syllabus)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {showAddCourseForm ? (
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '10px', backgroundColor: '#fafafa', marginTop: '12px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <input
                    type="text"
                    value={newCourseForm.course_code}
                    onChange={(event) => handleCourseFieldChange('course_code', event.target.value.toUpperCase())}
                    placeholder="Course code (e.g., EECE 210)"
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      value={newCourseForm.credits}
                      onChange={(event) => handleCourseFieldChange('credits', event.target.value)}
                      placeholder="Credits"
                      style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={newCourseForm.contact_hours}
                      onChange={(event) => handleCourseFieldChange('contact_hours', event.target.value)}
                      placeholder="Contact Hours"
                      style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                    />
                  </div>
                  <select
                    value={newCourseForm.course_type}
                    onChange={(event) => handleCourseFieldChange('course_type', event.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit' }}
                  >
                    <option value="Required">Required</option>
                    <option value="Elective">Elective</option>
                  </select>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleCreateCourse}
                      disabled={savingCourse}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: savingCourse ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        opacity: savingCourse ? 0.7 : 1
                      }}
                    >
                      {savingCourse ? 'Saving...' : 'Save Course'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCourseForm(false);
                        setNewCourseForm({ course_code: '', credits: '', contact_hours: '', course_type: 'Required' });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: 'white',
                        color: colors.mediumGray,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddCourseForm(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '12px',
                  backgroundColor: 'white',
                  color: colors.primary,
                  border: `2px dashed ${colors.primary}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} />
                Add Course
              </button>
            )}
          </div>
        )}
      </div>

      {/* Evidence Library Section */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => {
            setCurrentPage('evidence');
            setSidebarOpen(false);
          }}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '700',
            color: colors.darkGray,
            letterSpacing: '0.2px'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={20} color={colors.primary} />
            Evidence Library
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>

    {deleteSoConfirm.open && (
      <div
        onClick={() => setDeleteSoConfirm({ open: false, soId: null, label: '' })}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '420px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '800', color: colors.darkGray, marginBottom: '8px' }}>
            Delete {deleteSoConfirm.label}?
          </div>
          <div style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '18px' }}>
            This action cannot be undone.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDeleteSoConfirm({ open: false, soId: null, label: '' })}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.border}`,
                color: colors.mediumGray,
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSo}
              style={{
                backgroundColor: '#b42318',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {deleteCloConfirm.open && (
      <div
        onClick={() => setDeleteCloConfirm({ open: false, cloId: null, label: '' })}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '420px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '800', color: colors.darkGray, marginBottom: '8px' }}>
            Delete {deleteCloConfirm.label}?
          </div>
          <div style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '18px' }}>
            This action cannot be undone.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDeleteCloConfirm({ open: false, cloId: null, label: '' })}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.border}`,
                color: colors.mediumGray,
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteClo}
              style={{
                backgroundColor: '#b42318',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {deletePeoConfirm.open && (
      <div
        onClick={() => setDeletePeoConfirm({ open: false, peoId: null, label: '' })}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '420px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '800', color: colors.darkGray, marginBottom: '8px' }}>
            Delete {deletePeoConfirm.label}?
          </div>
          <div style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '18px' }}>
            This action cannot be undone.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDeletePeoConfirm({ open: false, peoId: null, label: '' })}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.border}`,
                color: colors.mediumGray,
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeletePeo}
              style={{
                backgroundColor: '#b42318',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {deleteCourseConfirm.open && (
      <div
        onClick={() => setDeleteCourseConfirm({ open: false, courseId: null, label: '' })}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '440px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '800', color: colors.darkGray, marginBottom: '8px' }}>
            Delete Course {deleteCourseConfirm.label}?
          </div>
          <div style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '18px' }}>
            This will remove the course and all instructor sections under it.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDeleteCourseConfirm({ open: false, courseId: null, label: '' })}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.border}`,
                color: colors.mediumGray,
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCourse}
              style={{
                backgroundColor: '#b42318',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {deleteSectionConfirm.open && (
      <div
        onClick={() => setDeleteSectionConfirm({ open: false, courseId: null, syllabusId: null, label: '' })}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '440px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '800', color: colors.darkGray, marginBottom: '8px' }}>
            Delete Section?
          </div>
          <div style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '18px' }}>
            {deleteSectionConfirm.label}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDeleteSectionConfirm({ open: false, courseId: null, syllabusId: null, label: '' })}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.border}`,
                color: colors.mediumGray,
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSection}
              style={{
                backgroundColor: '#b42318',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '10px 14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {soDocsModalOpen && (
      <div
        onClick={closeSoDocsModal}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '620px',
            backgroundColor: 'white',
            borderRadius: '14px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800' }}>AI Document Import</div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Student Outcomes</div>
            </div>
            <button onClick={closeSoDocsModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
              x
            </button>
          </div>

          <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: colors.mediumGray }}>
              Upload one or more documents that contain SO lists. These files will be used for bulk AI extraction later.
            </div>
            <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
              Select Documents
              <input type="file" multiple onChange={handleSoDocumentSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
            </label>
            <EvidenceLibraryImport
              cycleId={cycleId}
              programId={programId}
              onImportFiles={handleSoDocumentFiles}
            />

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
              <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Selected Files
              </div>
              {soDocuments.length === 0 ? (
                <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
              ) : (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {soDocuments.map((file) => (
                    <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSoDocument(file.id)}
                        style={{
                          backgroundColor: 'white',
                          border: `1px solid ${colors.border}`,
                          color: colors.danger,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {soDocStatus ? (
              <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>
                {soDocStatus}
              </div>
            ) : null}
          </div>

          <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
            <button type="button" onClick={closeSoDocsModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
              Extract with AI
            </button>
          </div>
        </div>
      </div>
    )}

    {cloDocsModalOpen && (
      <div
        onClick={closeCloDocsModal}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '620px',
            backgroundColor: 'white',
            borderRadius: '14px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800' }}>AI Document Import</div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Course Learning Outcomes</div>
            </div>
            <button onClick={closeCloDocsModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
              x
            </button>
          </div>

          <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
            <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
              Select Documents
              <input type="file" multiple onChange={handleCloDocumentSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
            </label>
            <EvidenceLibraryImport
              cycleId={cycleId}
              programId={programId}
              onImportFiles={handleCloDocumentFiles}
            />

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
              <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Selected Files
              </div>
              {cloDocuments.length === 0 ? (
                <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
              ) : (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {cloDocuments.map((file) => (
                    <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCloDocument(file.id)}
                        style={{
                          backgroundColor: 'white',
                          border: `1px solid ${colors.border}`,
                          color: colors.danger,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cloDocStatus ? (
              <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>
                {cloDocStatus}
              </div>
            ) : null}
          </div>

          <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
            <button type="button" onClick={closeCloDocsModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
              Extract with AI
            </button>
          </div>
        </div>
      </div>
    )}

    {peoDocsModalOpen && (
      <div
        onClick={closePeoDocsModal}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 25, 35, 0.52)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1800
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '620px',
            backgroundColor: 'white',
            borderRadius: '14px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '18px 22px', background: `linear-gradient(120deg, ${colors.primaryDark || colors.primary} 0%, ${colors.primary} 100%)`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800' }}>AI Document Import</div>
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>Program Educational Objectives</div>
            </div>
            <button onClick={closePeoDocsModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
              x
            </button>
          </div>

          <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: colors.mediumGray }}>
              Upload one or more documents that contain PEO lists. These files will be used for bulk AI extraction later.
            </div>
            <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
              Select Documents
              <input type="file" multiple onChange={handlePeoDocumentSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
            </label>
            <EvidenceLibraryImport
              cycleId={cycleId}
              programId={programId}
              onImportFiles={handlePeoDocumentFiles}
            />

            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
              <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Selected Files
              </div>
              {peoDocuments.length === 0 ? (
                <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
              ) : (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {peoDocuments.map((file) => (
                    <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePeoDocument(file.id)}
                        style={{
                          backgroundColor: 'white',
                          border: `1px solid ${colors.border}`,
                          color: colors.danger,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {peoDocStatus ? (
              <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>
                {peoDocStatus}
              </div>
            ) : null}
          </div>

          <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
            <button type="button" onClick={closePeoDocsModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" disabled style={{ backgroundColor: '#d8d8dd', border: 'none', color: '#6c757d', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'not-allowed' }}>
              Extract with AI
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Sidebar;
