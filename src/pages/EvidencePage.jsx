import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Search, FileText, Eye, Trash2 } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import { colors, fontStack } from '../styles/theme';
import { getActiveContext } from '../utils/activeContext';
import {
  deleteEvidenceLibraryDocument,
  fetchEvidenceLibraryDocumentBlob,
  listEvidenceLibraryDocuments,
  uploadEvidenceLibraryDocuments
} from '../utils/evidenceLibrary';

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
      const rows = await listEvidenceLibraryDocuments(cycleId, programId);
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
      await uploadEvidenceLibraryDocuments(cycleId, programId, files);
      await loadDocuments();
      setStatusMessage(`${files.length} file(s) uploaded successfully.`);
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to upload selected files.');
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      const blob = await fetchEvidenceLibraryDocumentBlob(doc?.id);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      setStatusMessage(error?.message || 'Unable to open this file.');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteEvidenceLibraryDocument(docId);
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
