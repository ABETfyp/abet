import { API_BASE } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseError = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  return fallbackMessage;
};

export const listEvidenceLibraryDocuments = async (cycleId, programId) => {
  const response = await fetch(
    `${API_BASE}/evidence-files/?cycle_id=${encodeURIComponent(cycleId)}&program_id=${encodeURIComponent(programId)}`,
    {
      method: 'GET',
      headers: {
        ...getAuthHeaders()
      }
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to load evidence documents.'));
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
};

export const uploadEvidenceLibraryDocuments = async (cycleId, programId, files) => {
  const uploads = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cycle_id', String(cycleId));
    formData.append('program_id', String(programId));
    formData.append('last_modified', String(file.lastModified || ''));

    const response = await fetch(`${API_BASE}/evidence-files/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(await parseError(response, `Unable to upload ${file.name}.`));
    }

    return response.json();
  });

  return Promise.all(uploads);
};

export const deleteEvidenceLibraryDocument = async (docId) => {
  const response = await fetch(`${API_BASE}/evidence-files/${docId}/`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to delete document.'));
  }
};

export const fetchEvidenceLibraryDocumentBlob = async (docId) => {
  const response = await fetch(`${API_BASE}/evidence-files/${docId}/download/`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to download document.'));
  }

  return response.blob();
};

export const toFileFromEvidenceDocument = async (doc) => {
  if (!doc?.id) return null;
  const blob = await fetchEvidenceLibraryDocumentBlob(doc.id);
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

