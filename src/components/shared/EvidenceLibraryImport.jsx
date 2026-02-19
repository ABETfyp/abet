import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { colors } from '../../styles/theme';
import { listEvidenceLibraryDocuments, toFileFromEvidenceDocument } from '../../utils/evidenceLibrary';

const EvidenceLibraryImport = ({ cycleId, programId, onImportFiles }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedDocs = useMemo(
    () => docs.filter((doc) => selectedIds.includes(doc.id)),
    [docs, selectedIds]
  );

  const loadDocs = async () => {
    try {
      setLoading(true);
      setError('');
      const rows = await listEvidenceLibraryDocuments(cycleId, programId);
      setDocs(rows);
    } catch (err) {
      setDocs([]);
      setError(err?.message || 'Unable to load evidence documents.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setSelectedIds([]);
    setOpen(true);
    await loadDocs();
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedIds([]);
    setError('');
  };

  const toggleSelected = (docId) => {
    setSelectedIds((prev) => (
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    ));
  };

  const handleImport = async () => {
    try {
      const files = selectedDocs
        .map((doc) => toFileFromEvidenceDocument(doc))
        .filter(Boolean);
      if (files.length === 0) {
        setError('No valid documents selected.');
        return;
      }
      await onImportFiles(files);
      closeModal();
    } catch (err) {
      setError(err?.message || 'Unable to import selected documents.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        style={{
          width: 'fit-content',
          padding: '8px 12px',
          border: `1px dashed ${colors.primary}`,
          borderRadius: '7px',
          backgroundColor: 'white',
          color: colors.primary,
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Plus size={14} />
        Add From Evidence Library
      </button>

      {open && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 35, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 2300
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '660px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '800', color: colors.darkGray, fontSize: '16px' }}>Select From Evidence Library</div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: colors.mediumGray, fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>
                x
              </button>
            </div>

            <div style={{ padding: '16px 18px', maxHeight: '360px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ color: colors.mediumGray, fontSize: '13px' }}>Loading documents...</div>
              ) : docs.length === 0 ? (
                <div style={{ color: colors.mediumGray, fontSize: '13px' }}>No documents found in Evidence Library for this program/cycle.</div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {docs.map((doc) => (
                    <label
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => toggleSelected(doc.id)}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: colors.darkGray, fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.mediumGray }}>
                          {doc.type || 'Unknown'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {error ? (
                <div style={{ marginTop: '10px', color: '#b42318', fontSize: '13px', fontWeight: '700' }}>
                  {error}
                </div>
              ) : null}
            </div>

            <div style={{ padding: '14px 18px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${colors.border}`,
                  color: colors.mediumGray,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={selectedIds.length === 0}
                style={{
                  backgroundColor: colors.primary,
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontWeight: '700',
                  cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedIds.length === 0 ? 0.7 : 1
                }}
              >
                Import Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EvidenceLibraryImport;

