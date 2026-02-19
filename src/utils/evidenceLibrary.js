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

export const listEvidenceLibraryDocuments = async (cycleId, programId) => {
  const db = await openEvidenceDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EVIDENCE_STORE, 'readonly');
    const store = tx.objectStore(EVIDENCE_STORE);
    const index = store.index('by_cycle_program');
    const req = index.getAll(IDBKeyRange.only([String(cycleId), String(programId)]));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error('Unable to load evidence documents.'));
  });
};

export const toFileFromEvidenceDocument = (doc) => {
  const blob = doc?.fileBlob;
  if (!blob) return null;
  if (blob instanceof File) return blob;
  try {
    return new File(
      [blob],
      doc?.name || 'evidence-file',
      {
        type: doc?.type || blob?.type || 'application/octet-stream',
        lastModified: Number(doc?.lastModified || Date.now())
      }
    );
  } catch (_error) {
    return null;
  }
};

