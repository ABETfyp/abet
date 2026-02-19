import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Search, FileText, Eye, Trash2 } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { getActiveContext } from '../utils/activeContext';

const EVIDENCE_DB_NAME = 'abet-evidence-library-documents';
const EVIDENCE_STORE = 'documents';

const openEvidenceDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(EVIDENCE_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(EVIDENCE_STORE)) {
      const store = db.createObjectStore(EVIDENCE_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_program', ['cycleId', 'programId'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open evidence library storage.'));
});

const listEvidenceDocuments = async (cycleId, programId) => {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVIDENCE_STORE, 'readonly');
    const store = tx.objectStore(EVIDENCE_STORE);
    const index = store.index('by_cycle_program');
    const req = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));
    req.onsuccess = () => {
      const rows = req.result || [];
      rows.sort((a, b) => `${b.uploadedAt || ''}`.localeCompare(`${a.uploadedAt || ''}`));
      resolve(rows);
    };
    req.onerror = () => reject(req.error || new Error('Unable to read evidence documents.'));
  });
};

const appendEvidenceDocuments = async (cycleId, programId, files, uploadedBy) => {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVIDENCE_STORE, 'readwrite');
    const store = tx.objectStore(EVIDENCE_STORE);
    const index = store.index('by_cycle_program');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));
      files.forEach((file, idx) => {
        const key = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(key)) return;
        store.put({
          id: `${cycleId}-${programId}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          programId: String(programId),
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
          fileBlob: file
        });
      });
    };

    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to save evidence documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to save evidence documents.'));
  });
};

const deleteEvidenceDocumentById = async (docId) => {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVIDENCE_STORE, 'readwrite');
    tx.objectStore(EVIDENCE_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to delete evidence document.'));
  });
};

const decodeUserEmailFromToken = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return 'Faculty Admin';
    const payloadRaw = token.split('.')[1];
    if (!payloadRaw) return 'Faculty Admin';
    const normalized = payloadRaw.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload?.email || 'Faculty Admin';
  } catch (_error) {
    return 'Faculty Admin';
  }
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
};

const EvidencePage = ({ onToggleSidebar, onBack }) => {
  const { subtitle } = getActiveContext();
  const cycleId = localStorage.getItem('currentCycleId') || '1';
  const programId = localStorage.getItem('currentProgramId') || '1';
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((row) => `${row.name || ''}`.toLowerCase().includes(query));
  }, [documents, searchTerm]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const rows = await listEvidenceDocuments(cycleId, programId);
      setDocuments(rows);
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to load evidence documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [cycleId, programId]);

  const handleChooseFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      const uploader = decodeUserEmailFromToken();
      await appendEvidenceDocuments(cycleId, programId, files, uploader);
      await loadDocuments();
      setStatusMessage(`${files.length} file(s) uploaded successfully.`);
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to upload selected files.');
    }
  };

  const handleViewDocument = (doc) => {
    if (!doc?.fileBlob) {
      setStatusMessage('Unable to open this file.');
      return;
    }
    const objectUrl = URL.createObjectURL(doc.fileBlob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteEvidenceDocumentById(docId);
      await loadDocuments();
      setStatusMessage('Document deleted.');
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to delete document.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>
      <GlobalHeader title="Evidence Library" subtitle={subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />

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

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center', border: `2px dashed ${colors.border}` }}>
          <Upload size={56} color={colors.primary} style={{ marginBottom: '20px' }} />
          <h3 style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.2px' }}>Upload Evidence Files</h3>
          <p style={{ color: colors.mediumGray, fontSize: '15px', marginBottom: '24px', fontWeight: '500' }}>Drag & drop your files here or click to browse</p>

          <button
            onClick={handleChooseFilesClick}
            style={{ backgroundColor: colors.primary, color: 'white', padding: '14px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
          >
            Choose Files
          </button>
          <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />

          <div style={{ color: colors.mediumGray, fontSize: '13px', marginTop: '16px', fontWeight: '500' }}>
            Supported formats: PDF, Word, Excel, Images (PNG, JPG)
          </div>
          {statusMessage ? (
            <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: '700', color: colors.mediumGray }}>
              {statusMessage}
            </div>
          ) : null}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by file name..."
              style={{ width: '100%', padding: '12px 12px 12px 48px', border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: colors.darkGray, fontSize: '20px', fontWeight: '700', marginBottom: '24px', letterSpacing: '-0.2px' }}>
            Uploaded Files {loading ? '(Loading...)' : `(${filteredDocuments.length})`}
          </h3>

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
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={22} color={colors.primary} />
                        <span style={{ color: colors.darkGray, fontSize: '14px', fontWeight: '600' }}>{doc.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>{doc.uploadedBy || 'Faculty Admin'}</td>
                    <td style={{ padding: '16px', color: colors.mediumGray, fontSize: '14px', fontWeight: '500' }}>{formatDate(doc.uploadedAt)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        style={{ color: colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvidencePage;
