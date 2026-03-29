import { apiRequest } from './api';

export const extractTextboxSectionWithLocalAi = async ({
  cycleId,
  pageKey,
  sectionTitle,
  currentFields,
  selectedDocuments,
  loadStoredDocById,
}) => {
  const payload = new FormData();
  payload.append('pageKey', pageKey);
  payload.append('sectionTitle', sectionTitle);
  payload.append('currentFields', JSON.stringify(currentFields || {}));

  for (const selectedDocument of selectedDocuments || []) {
    const storedDocument = await loadStoredDocById(selectedDocument.id);
    if (!storedDocument?.fileBlob) continue;
    payload.append('files', storedDocument.fileBlob, storedDocument.name || selectedDocument.name || 'document');
  }

  return apiRequest(`/cycles/${cycleId}/textbox-ai-extract/`, {
    method: 'POST',
    body: payload,
  });
};

export const extractStructuredSectionWithLocalAi = async ({
  cycleId,
  pageKey,
  sectionTitle,
  currentState,
  selectedDocuments,
  loadStoredDocById,
}) => {
  const payload = new FormData();
  payload.append('pageKey', pageKey);
  payload.append('sectionTitle', sectionTitle);
  payload.append('currentState', JSON.stringify(currentState || {}));

  for (const selectedDocument of selectedDocuments || []) {
    const storedDocument = await loadStoredDocById(selectedDocument.id);
    if (!storedDocument?.fileBlob) continue;
    payload.append('files', storedDocument.fileBlob, storedDocument.name || selectedDocument.name || 'document');
  }

  return apiRequest(`/cycles/${cycleId}/textbox-ai-extract/`, {
    method: 'POST',
    body: payload,
  });
};

export const buildTextboxAiStatus = (result, fallbackMessage = 'AI extraction completed.') => {
  const appliedCount = Array.isArray(result?.appliedFields) ? result.appliedFields.length : 0;
  const preservedCount = Array.isArray(result?.preservedFields) ? result.preservedFields.length : 0;
  const notes = `${result?.confidenceNotes || ''}`.trim();
  return [
    appliedCount > 0
      ? `AI added ${appliedCount} field${appliedCount === 1 ? '' : 's'} from the selected evidence.`
      : 'AI did not add new fields because the evidence was limited or the current fields were already filled.',
    preservedCount > 0
      ? `${preservedCount} existing field${preservedCount === 1 ? '' : 's'} were preserved exactly as written.`
      : '',
    notes || fallbackMessage,
  ].filter(Boolean).join('\n\n');
};

export const buildStructuredAiStatus = ({
  addedRows = 0,
  addedFields = 0,
  preservedFields = 0,
  notes = '',
  fallbackMessage = 'Local AI extraction completed.',
}) => {
  return [
    addedRows > 0
      ? `AI added ${addedRows} new row${addedRows === 1 ? '' : 's'} from the selected evidence.`
      : 'AI did not add new rows because the evidence was limited or the extracted rows matched existing entries.',
    addedFields > 0
      ? `AI filled ${addedFields} empty field${addedFields === 1 ? '' : 's'}.`
      : '',
    preservedFields > 0
      ? `${preservedFields} existing field${preservedFields === 1 ? '' : 's'} were preserved exactly as written.`
      : '',
    `${notes || ''}`.trim() || fallbackMessage,
  ].filter(Boolean).join('\n\n');
};
