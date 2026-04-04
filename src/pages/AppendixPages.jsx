import React, { useEffect, useState } from 'react';
import { Clock, Cog, Cpu, Database, Download, Eye, FileText, FlaskConical, Plus, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import AppendicesABLivePage from '../components/appendices/AppendicesABLivePage';
import { colors, fontStack } from '../styles/theme';
import { apiRequest } from '../utils/api';
import { getActiveContext } from '../utils/activeContext';
import EvidenceLibraryImport from '../components/shared/EvidenceLibraryImport';
import {
  buildStructuredAiStatus,
  buildTextboxAiStatus,
  extractStructuredSectionWithLocalAi,
  extractTextboxSectionWithLocalAi
} from '../utils/textboxAi';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';

const C1_DOCS_DB_NAME = 'abet-criterion1-documents';
const C1_DOCS_STORE = 'documents';

const openCriterion1DocsDb = () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(C1_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(C1_DOCS_STORE)) {
      const store = db.createObjectStore(C1_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_section', ['cycleId', 'sectionTitle'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open document storage.'));
});

const listCriterion1SectionDocs = async (cycleId, sectionTitle) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readonly');
    const store = tx.objectStore(C1_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));
    query.onsuccess = () => resolve(query.result || []);
    query.onerror = () => reject(query.error || new Error('Unable to read stored documents.'));
  });
};

const appendCriterion1SectionDocs = async (cycleId, sectionTitle, files) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readwrite');
    const store = tx.objectStore(C1_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const existingReq = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`));
      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${sectionTitle}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          sectionTitle,
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString(),
        });
      });
    };
    existingReq.onerror = () => reject(existingReq.error || new Error('Unable to store documents.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to store documents.'));
  });
};

const deleteCriterion1DocById = async (docId) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readwrite');
    tx.objectStore(C1_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Unable to remove document.'));
  });
};

const getCriterion1DocById = async (docId) => {
  const db = await openCriterion1DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C1_DOCS_STORE, 'readonly');
    const req = tx.objectStore(C1_DOCS_STORE).get(docId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Unable to load document.'));
  });
};

const APPENDIX_D_TEXTBOX_SECTION_FIELDS = {
  Institution: [
    'institutionName',
    'institutionAddress',
    'chiefExecutiveName',
    'chiefExecutiveTitle',
    'selfStudySubmitterName',
    'selfStudySubmitterTitle',
    'institutionalAccreditations',
    'accreditationEvaluationDates',
  ],
  'Type of Control': ['controlTypeDescription'],
  'Organization Chart': ['administrativeChainDescription'],
};

const normalizeAppendixAiKey = (value) => `${value ?? ''}`.trim().toLowerCase();
const APPENDIXC_EXCEL_ONLY_STRUCTURED_SECTIONS = new Set(['Inventory Sheet']);
const isAppendixCExcelOnlyStructuredSection = (sectionTitle) => APPENDIXC_EXCEL_ONLY_STRUCTURED_SECTIONS.has(sectionTitle);
const isSpreadsheetFile = (file) => Boolean(`${file?.name ?? ''}`.toLowerCase().match(/\.(xlsx|xlsm)$/));
const appendixRowHasAnyValue = (row, fieldNames) => (fieldNames || []).some((fieldName) => `${row?.[fieldName] ?? ''}`.trim() !== '');
const APPENDIX_C_EQUIPMENT_COLUMN_DEFINITIONS = [
  { column: 'Equipment (Name/Desc.)', description: 'Name and brief description of the item' },
  { column: 'Manufacturer/Model', description: 'Vendor and model number (or software version)' },
  { column: 'Quantity', description: 'Number of identical units available' },
  { column: 'Location', description: 'Building and room (e.g. "Engr Building Rm 215")' },
  { column: 'Course(s)', description: 'Course codes or names where item is used' },
  { column: 'Outcomes (supported)', description: 'IDs of student outcomes supported (if tracked)' },
  { column: 'Condition', description: 'Working condition or notes (e.g. "Operational, Calibrated")' },
  { column: 'Last Calibration (Date)', description: 'Date of most recent calibration or inspection (if any)' },
  { column: 'Maintenance/Safety Notes', description: 'Free-form notes on maintenance actions or safety status' },
];

  const AppendixCPage = ({ onToggleSidebar, onBack, setCurrentPage }) => {
    const { subtitle } = getActiveContext();
    const programId = localStorage.getItem('currentProgramId') || 1;
    const [equipmentRows, setEquipmentRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [labsCoveredCount, setLabsCoveredCount] = useState(0);
    const [highValueAssetsCount, setHighValueAssetsCount] = useState(0);
    const [lastUpdatedLabel, setLastUpdatedLabel] = useState('-');
    const [appendixCDocModal, setAppendixCDocModal] = useState({ open: false, sectionTitle: '' });
    const [appendixCDocs, setAppendixCDocs] = useState([]);
    const [appendixCDocStatus, setAppendixCDocStatus] = useState('');
    const [appendixCDocLoading, setAppendixCDocLoading] = useState(false);
    const [appendixCTableExpanded, setAppendixCTableExpanded] = useState(false);
    const cycleId = localStorage.getItem('currentCycleId') || 1;

    useEffect(() => {
      fetchAppendixCData();
    }, [cycleId]);

    const fetchAppendixCData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest(`/cycles/${cycleId}/appendixc/`);
        const rows = Array.isArray(result?.equipment_rows) ? result.equipment_rows : [];
        setEquipmentRows(rows.map((row) => ({
          id: row.equipment_id || Date.now() + Math.random(),
          name: row.equipment_name || '',
          cat: row.category || '',
          qty: String(row.quantity ?? ''),
          loc: row.location_lab || '',
          use: row.instructional_use || '',
          outcomes: row.outcomes || '',
          condition: row.condition || '',
          service: row.last_service_date || '',
          maintenance_notes: row.maintenance_notes || row.evidence_link || '',
          evidence: row.evidence_link || '',
        })));

        const appendix = result?.appendix || {};
        setLabsCoveredCount(appendix.labs_covered_count ?? 0);
        setHighValueAssetsCount(appendix.high_value_assets_count ?? 0);
        if (appendix.last_updated_date) {
          const date = new Date(appendix.last_updated_date);
          setLastUpdatedLabel(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }
      } catch (err) {
        setError(err.message || 'Failed to load Appendix C data.');
      } finally {
        setLoading(false);
      }
    };

    const parseValidDate = (value) => {
      const text = `${value || ''}`.trim();
      if (!text) return null;
      const parsed = new Date(text);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    };

    const validateAppendixCForm = () => {
      if (!Number.isInteger(Number(labsCoveredCount)) || Number(labsCoveredCount) < 0) {
        return 'Labs Covered must be a number greater than or equal to 0.';
      }
      if (!Number.isInteger(Number(highValueAssetsCount)) || Number(highValueAssetsCount) < 0) {
        return 'High-Value Assets must be a number greater than or equal to 0.';
      }
      const today = new Date();
      for (let index = 0; index < equipmentRows.length; index += 1) {
        const row = equipmentRows[index];
        const rowNumber = index + 1;
        if (!`${row.name || ''}`.trim()) return `Row ${rowNumber}: Equipment name is required.`;
        if (!`${row.cat || ''}`.trim()) return `Row ${rowNumber}: Category is required.`;
        if (!`${row.loc || ''}`.trim()) return `Row ${rowNumber}: Location / Lab is required.`;
        if (!`${row.use || ''}`.trim()) return `Row ${rowNumber}: Instructional use is required.`;

        const quantity = Number.parseInt(row.qty, 10);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          return `Row ${rowNumber}: Quantity must be a positive integer.`;
        }

        const parsedServiceDate = parseValidDate(row.service);
        if (!parsedServiceDate) {
          return `Row ${rowNumber}: Last service must be a valid date.`;
        }
        if (parsedServiceDate > today) {
          return `Row ${rowNumber}: Last service cannot be in the future.`;
        }
      }

      return '';
    };

    const handleSaveAppendixC = async () => {
      setSaving(true);
      setError(null);
      setSuccess(false);
      try {
        const validationError = validateAppendixCForm();
        if (validationError) {
          setError(validationError);
          return;
        }

        const payload = {
          labs_covered_count: labsCoveredCount,
          high_value_assets_count: highValueAssetsCount,
          equipment_rows: equipmentRows.map((row) => ({
            equipment_name: row.name || '',
            category: row.cat || '',
            quantity: Number.parseInt(row.qty, 10) || 0,
            location_lab: row.loc || '',
            instructional_use: row.use || '',
            last_service_date: row.service || null,
            evidence_link: row.evidence || '',
          })),
        };

        const result = await apiRequest(`/cycles/${cycleId}/appendixc/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        const rows = Array.isArray(result?.equipment_rows) ? result.equipment_rows : [];
        setEquipmentRows(rows.map((row) => ({
          id: row.equipment_id || Date.now() + Math.random(),
          name: row.equipment_name || '',
          cat: row.category || '',
          qty: String(row.quantity ?? ''),
          loc: row.location_lab || '',
          use: row.instructional_use || '',
          outcomes: row.outcomes || '',
          condition: row.condition || '',
          service: row.last_service_date || '',
          maintenance_notes: row.maintenance_notes || row.evidence_link || '',
          evidence: row.evidence_link || '',
        })));

        const appendix = result?.appendix || {};
        setLabsCoveredCount(appendix.labs_covered_count ?? 0);
        setHighValueAssetsCount(appendix.high_value_assets_count ?? 0);
        if (appendix.last_updated_date) {
          const date = new Date(appendix.last_updated_date);
          setLastUpdatedLabel(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }

        localStorage.setItem('checklistNeedsRefresh', 'true');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err) {
        setError(err.message || 'Failed to save Appendix C data.');
      } finally {
        setSaving(false);
      }
    };

    const handleAddEquipment = () => {
      setEquipmentRows((prevRows) => [
        ...prevRows,
        {
          id: Date.now(),
          name: '',
          cat: '',
          qty: '',
          loc: '',
          use: '',
          outcomes: '',
          condition: '',
          service: '',
          maintenance_notes: '',
          evidence: '',
        }
      ]);
    };

    const handleEquipmentChange = (id, field, value) => {
      setEquipmentRows((prevRows) =>
        prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
      );
    };

    const handleRemoveEquipment = (id) => {
      setEquipmentRows((prevRows) => prevRows.filter((row) => row.id !== id));
    };
    const handleRemoveEquipmentRowByIndex = (index) => {
      setEquipmentRows((prev) => prev.filter((_, i) => i !== index));
    };
    const getEquipmentFieldByIndex = (index) => {
      switch (index) {
        case 0: return 'name';
        case 1: return 'cat';
        case 2: return 'qty';
        case 3: return 'loc';
        case 4: return 'use';
        case 5: return 'outcomes';
        case 6: return 'condition';
        case 7: return 'service';
        case 8: return 'maintenance_notes';
        default: return null;
      }
    };

    const getEquipmentCellValue = (row, index) => {
      const field = getEquipmentFieldByIndex(index);
      return field ? (row[field] || '') : '';
    };

    const handleEquipmentCellChange = (id, index, value) => {
      const field = getEquipmentFieldByIndex(index);
      if (!field) return;
      handleEquipmentChange(id, field, value);
    };

    const openAppendixCUploadModal = async (sectionTitle) => {
      setAppendixCDocStatus('');
      setAppendixCDocModal({ open: true, sectionTitle });
      try {
        const docs = await listCriterion1SectionDocs(cycleId, `AppendixC:${sectionTitle}`);
        setAppendixCDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
      } catch (err) {
        setAppendixCDocs([]);
        setAppendixCDocStatus(err?.message || 'Unable to load documents.');
      }
    };

    const closeAppendixCUploadModal = () => {
      setAppendixCDocModal({ open: false, sectionTitle: '' });
      setAppendixCDocs([]);
      setAppendixCDocStatus('');
      setAppendixCDocLoading(false);
    };

    const handleAppendixCDocFiles = async (files) => {
      if (!appendixCDocModal.sectionTitle) return;
      if (!Array.isArray(files) || files.length === 0) return;
      const requiresExcelOnly = isAppendixCExcelOnlyStructuredSection(appendixCDocModal.sectionTitle);
      if (requiresExcelOnly) {
        const invalidFiles = files.filter((file) => !isSpreadsheetFile(file));
        if (invalidFiles.length > 0) {
          setAppendixCDocStatus('This table extractor supports Excel files only (.xlsx or .xlsm).');
          return;
        }
      }
      try {
        await appendCriterion1SectionDocs(cycleId, `AppendixC:${appendixCDocModal.sectionTitle}`, files);
        const docs = await listCriterion1SectionDocs(cycleId, `AppendixC:${appendixCDocModal.sectionTitle}`);
        setAppendixCDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
        setAppendixCDocStatus(
          requiresExcelOnly
            ? `${docs.length} Excel file(s) saved for ${appendixCDocModal.sectionTitle}.`
            : `${docs.length} file(s) saved for ${appendixCDocModal.sectionTitle}.`
        );
      } catch (err) {
        setAppendixCDocStatus(err?.message || 'Unable to save documents.');
      }
    };

    const handleAppendixCDocSelection = (event) => {
      const files = Array.from(event.target.files || []);
      handleAppendixCDocFiles(files);
    };

    const handleAppendixCRemoveDoc = (docId) => {
      deleteCriterion1DocById(docId)
        .then(() => listCriterion1SectionDocs(cycleId, `AppendixC:${appendixCDocModal.sectionTitle}`))
        .then((docs) => {
          setAppendixCDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
          setAppendixCDocStatus('Document removed.');
        })
        .catch((err) => setAppendixCDocStatus(err?.message || 'Unable to remove document.'));
    };

    const handleExtractAppendixCWithAi = async () => {
      if (appendixCDocLoading) return;
      if (appendixCDocs.length === 0) {
        setAppendixCDocStatus('Upload at least one document before running Extract with AI.');
        return;
      }
      if (isAppendixCExcelOnlyStructuredSection(appendixCDocModal.sectionTitle)) {
        const invalidDocs = appendixCDocs.filter((doc) => !`${doc?.name ?? ''}`.toLowerCase().match(/\.(xlsx|xlsm)$/));
        if (invalidDocs.length > 0) {
          setAppendixCDocStatus('This table extractor supports Excel files only (.xlsx or .xlsm).');
          return;
        }
      }

      try {
        setAppendixCDocLoading(true);
        setAppendixCDocStatus('Reading the selected spreadsheets and extracting equipment rows...');
        const result = await extractStructuredSectionWithLocalAi({
          cycleId,
          pageKey: 'appendixc',
          sectionTitle: appendixCDocModal.sectionTitle,
          currentState: {
            fields: {},
            rows: equipmentRows,
          },
          selectedDocuments: appendixCDocs,
          loadStoredDocById: getCriterion1DocById,
        });

        const seenKeys = new Set(
          (equipmentRows || [])
            .filter((row) => !(!appendixRowHasAnyValue(row, ['name', 'cat', 'qty', 'loc', 'use', 'outcomes', 'condition', 'service', 'maintenance_notes', 'evidence'])))
            .map((row) => `${normalizeAppendixAiKey(row?.name)}||${normalizeAppendixAiKey(row?.loc)}`)
            .filter((value) => value && value !== '||')
        );
        let addedRows = 0;
        const appendedRows = [...equipmentRows];
        const emptyRowIndexes = appendedRows
          .map((row, index) => (
            appendixRowHasAnyValue(row, ['name', 'cat', 'qty', 'loc', 'use', 'outcomes', 'condition', 'service', 'maintenance_notes', 'evidence'])
              ? -1
              : index
          ))
          .filter((index) => index >= 0);
        (result?.rows || []).forEach((row) => {
          const key = `${normalizeAppendixAiKey(row?.name)}||${normalizeAppendixAiKey(row?.loc)}`;
          if (!key || key === '||' || seenKeys.has(key)) return;
          seenKeys.add(key);
          const nextRow = {
            id: Date.now() + Math.floor(Math.random() * 1000) + addedRows,
            name: `${row?.name ?? ''}`,
            cat: `${row?.cat ?? ''}`,
            qty: `${row?.qty ?? ''}`,
            loc: `${row?.loc ?? ''}`,
            use: `${row?.use ?? ''}`,
            outcomes: `${row?.outcomes ?? ''}`,
            condition: `${row?.condition ?? ''}`,
            service: `${row?.service ?? ''}`,
            maintenance_notes: `${row?.maintenance_notes ?? ''}`,
            evidence: '',
          };
          if (emptyRowIndexes.length > 0) {
            const targetIndex = emptyRowIndexes.shift();
            appendedRows[targetIndex] = {
              ...appendedRows[targetIndex],
              ...nextRow,
              id: appendedRows[targetIndex]?.id ?? nextRow.id,
            };
          } else {
            appendedRows.push(nextRow);
          }
          addedRows += 1;
        });
        setEquipmentRows(appendedRows);
        setAppendixCDocStatus(buildStructuredAiStatus({
          addedRows,
          notes: result?.confidenceNotes,
        }));
      } catch (err) {
        setAppendixCDocStatus(err?.message || 'AI extraction failed.');
      } finally {
        setAppendixCDocLoading(false);
      }
    };

    const renderAppendixCTable = () => (
      <div style={{ marginTop: '16px', overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>
        <table style={{ width: 'max-content', minWidth: `${Math.max(1200, APPENDIX_C_EQUIPMENT_COLUMN_DEFINITIONS.length * 230)}px`, borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
              {APPENDIX_C_EQUIPMENT_COLUMN_DEFINITIONS.map((columnDef, index) => (
                <th
                  key={`column-header-${index}`}
                  style={{
                    padding: '8px',
                    textAlign: 'left',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    fontWeight: '700',
                    position: index === 0 ? 'sticky' : 'static',
                    left: index === 0 ? 0 : 'auto',
                    zIndex: index === 0 ? 4 : 2,
                    backgroundColor: colors.primary,
                    minWidth: '220px',
                  }}
                >
                  <div style={{ padding: '8px', fontWeight: '700' }}>{columnDef.column}</div>
                </th>
              ))}
            </tr>
              <tr style={{ backgroundColor: '#f8fafc', color: colors.mediumGray }}>
                {APPENDIX_C_EQUIPMENT_COLUMN_DEFINITIONS.map((columnDef, index) => (
                  <th
                    key={`desc-${index}`}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      borderBottom: `1px solid ${colors.border}`,
                      fontWeight: '600',
                      fontSize: '12px',
                      position: index === 0 ? 'sticky' : 'static',
                      left: index === 0 ? 0 : 'auto',
                      zIndex: index === 0 ? 3 : 1,
                      backgroundColor: '#f8fafc',
                      minWidth: '220px',
                    }}
                  >
                    <div style={{ padding: '8px', color: colors.darkGray, fontWeight: '500', fontSize: '12px', lineHeight: 1.45 }}>
                      {columnDef.description}
                    </div>
                  </th>
                ))}
              </tr>
          </thead>
          <tbody>
                {equipmentRows.map((row, rowIndex) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {APPENDIX_C_EQUIPMENT_COLUMN_DEFINITIONS.map((columnDef, index) => (
                      <td
                        key={`readonly-cell-${rowIndex}-${index}`}
                    style={{
                      padding: '8px',
                      position: index === 0 ? 'sticky' : 'static',
                      left: index === 0 ? 0 : 'auto',
                      zIndex: index === 0 ? 2 : 1,
                      backgroundColor: index === 0 ? '#f9fafb' : 'white',
                        minWidth: '220px',
                      }}
                    >
                      {index === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            value={getEquipmentCellValue(row, index)}
                            onChange={(event) => handleEquipmentCellChange(row.id, index, event.target.value)}
                            style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px', backgroundColor: 'white', color: colors.darkGray }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipmentRowByIndex(rowIndex)}
                            style={{ border: `1px solid ${colors.border}`, backgroundColor: '#fff1f1', color: '#b42318', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            title="Delete row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <input
                          value={getEquipmentCellValue(row, index)}
                          onChange={(event) => handleEquipmentCellChange(row.id, index, event.target.value)}
                          style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '8px', fontSize: '13px', backgroundColor: 'white', color: colors.darkGray }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );

  return (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Appendix C - Equipment" subtitle={subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Major Equipment Inventory</div>
                <span style={{ color: colors.primary, fontSize: '13px', fontWeight: '700', letterSpacing: '0.1px' }}>
                  Last Updated: {lastUpdatedLabel}
                </span>
              </div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                List major pieces of equipment used by the program in support of instruction.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <button
                onClick={handleSaveAppendixC}
                disabled={saving}
                style={{ backgroundColor: saving ? '#6c757d' : colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}
              >

                <Save size={16} />

                {saving ? 'Saving...' : 'Save Draft'}

              </button>

              <button
                onClick={() => setCurrentPage && setCurrentPage('appendices')}
                style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Database size={16} />
                Back to Appendices
              </button>

            </div>

          </div>

          {success ? (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', color: '#155724', fontSize: '14px' }}>
              Saved successfully!
            </div>
          ) : null}

        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>
          {loading ? (
            <div style={{ color: colors.mediumGray, fontSize: '14px', fontWeight: '600' }}>Loading equipment data...</div>
          ) : null}
          {error ? (
            <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', color: '#721c24', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Equipment List</h3>
              <span style={{ color: colors.primary, fontSize: '13px', fontWeight: '700', letterSpacing: '0.1px' }}>
                Last Updated: {lastUpdatedLabel}
              </span>
            </div>

            <div>
              <p style={{ color: colors.mediumGray, margin: 0, fontSize: '14px' }}>
                Include location, instructional use, and maintenance status for major equipment.
              </p>
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>

              <button
                type="button"
                onClick={handleAddEquipment}
                style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <Plus size={16} />
                Add Row
              </button>

              <button
                type="button"
                onClick={() => setAppendixCTableExpanded(true)}
                style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <Eye size={16} />
                Expand Table
              </button>

              <button type="button" onClick={() => openAppendixCUploadModal('Inventory Sheet')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>

                <Upload size={16} />

                Upload Inventory Sheet

              </button>
              </div>
            </div>
          </div>



          {renderAppendixCTable()}



          <div style={{ marginTop: '12px', color: colors.mediumGray, fontSize: '12px', fontWeight: '700' }}>
            
          </div>

        </div>

        {appendixCDocModal.open && (
          <div
            onClick={closeAppendixCUploadModal}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 25, 35, 0.52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1700
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
                  <div style={{ fontSize: '17px', fontWeight: '800' }}>Document Upload</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{appendixCDocModal.sectionTitle}</div>
                </div>
                <button onClick={closeAppendixCUploadModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                  x
                </button>
              </div>

              <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                  {isAppendixCExcelOnlyStructuredSection(appendixCDocModal.sectionTitle) ? 'Select Excel Files' : 'Select Documents'}
                  <input
                    type="file"
                    multiple
                    accept={isAppendixCExcelOnlyStructuredSection(appendixCDocModal.sectionTitle) ? '.xlsx,.xlsm' : undefined}
                    onChange={handleAppendixCDocSelection}
                    style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }}
                  />
                </label>
                <EvidenceLibraryImport
                  cycleId={cycleId}
                  programId={programId}
                  onImportFiles={handleAppendixCDocFiles}
                />

                <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Selected Files
                  </div>
                  {appendixCDocs.length === 0 ? (
                    <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {appendixCDocs.map((file) => (
                        <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleAppendixCRemoveDoc(file.id)}
                            style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {appendixCDocStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{appendixCDocStatus}</div> : null}
              </div>

              <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
                <button type="button" onClick={closeAppendixCUploadModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExtractAppendixCWithAi}
                  disabled={appendixCDocLoading || appendixCDocs.length === 0}
                  style={{
                    backgroundColor: appendixCDocLoading || appendixCDocs.length === 0 ? '#d8d8dd' : colors.primary,
                    border: 'none',
                    color: appendixCDocLoading || appendixCDocs.length === 0 ? '#6c757d' : 'white',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: '700',
                    cursor: appendixCDocLoading || appendixCDocs.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {appendixCDocLoading ? 'Extracting...' : 'Extract with AI'}
                </button>
              </div>
            </div>
          </div>
        )}

        {appendixCTableExpanded ? (
          <div
            onClick={() => setAppendixCTableExpanded(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 25, 35, 0.52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1800
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '98vw',
                height: '92vh',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: colors.darkGray }}>Appendix C Equipment Table</div>
                <button
                  type="button"
                  onClick={() => setAppendixCTableExpanded(false)}
                  style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '8px 12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
              <div style={{ padding: '14px', flex: 1, minHeight: 0 }}>
                {renderAppendixCTable()}
              </div>
            </div>
          </div>
        ) : null}

      </div>

    </div>

  );
};



  // Appendix D Page

  const AppendixDPage = ({ onToggleSidebar, onBack, setCurrentPage }) => {
  const { subtitle } = getActiveContext();
  const cycleId = localStorage.getItem('currentCycleId') || 1;
  const programId = localStorage.getItem('currentProgramId') || 1;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [appendixDDocModal, setAppendixDDocModal] = useState({ open: false, sectionTitle: '' });
  const [appendixDDocs, setAppendixDDocs] = useState([]);
  const [appendixDDocStatus, setAppendixDDocStatus] = useState('');
  const [appendixDDocLoading, setAppendixDDocLoading] = useState(false);
  const [showAppendixDTableErrors, setShowAppendixDTableErrors] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionAddress: '',
    chiefExecutiveName: '',
    chiefExecutiveTitle: '',
    selfStudySubmitterName: '',
    selfStudySubmitterTitle: '',
    institutionalAccreditations: '',
    accreditationEvaluationDates: '',
    controlTypeDescription: '',
    administrativeChainDescription: '',
    organizationChartFileReference: '',
    creditHourDefinition: '',
    deviationsFromStandard: '',
  });
  const [academicSupportUnits, setAcademicSupportUnits] = useState([]);
  const [nonacademicSupportUnits, setNonacademicSupportUnits] = useState([]);
  const [enrollmentRecords, setEnrollmentRecords] = useState([]);
  const [personnelRecords, setPersonnelRecords] = useState([]);
  const PERSONNEL_PART_TIME_FTE_RATIO = 0.5;
  const academicYearPattern = /^(\d{4})-(\d{4})$/;
  const sanitizeNonNegativeIntegerInput = (value) => `${value ?? ''}`.replace(/[^\d]/g, '');
  const sanitizeAcademicYearInput = (value) => `${value ?? ''}`.replace(/[^\d-]/g, '').slice(0, 9);
  const sanitizeStudentTypeInput = (value) => `${value ?? ''}`.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  const getAcademicYearStartYear = () => {
    const cycleLabel = `${localStorage.getItem('currentCycleLabel') || ''}`;
    const match = cycleLabel.match(/(20\d{2})\D+(20\d{2})/);
    if (match) {
      const start = Number.parseInt(match[1], 10);
      const end = Number.parseInt(match[2], 10);
      if (Number.isFinite(start) && Number.isFinite(end) && end === start + 1) {
        return start;
      }
    }
    const today = new Date();
    return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  };
  const defaultAcademicYears = Array.from({ length: 3 }, (_, index) => {
    const start = getAcademicYearStartYear() - index;
    return `${start}-${start + 1}`;
  });
  const getFallbackAcademicYear = (index = 0) => defaultAcademicYears[index] || defaultAcademicYears[0] || '';
  const normalizeAcademicYearValue = (value, fallbackIndex = 0) => {
    const text = `${value ?? ''}`.trim();
    if (!text) return '';
    if (text === 'Current') return getFallbackAcademicYear(0);
    if (text === '1') return getFallbackAcademicYear(1);
    if (/^\d{4}$/.test(text)) {
      const start = Number.parseInt(text, 10);
      return `${start}-${start + 1}`;
    }
    return text;
  };
  const isValidAcademicYear = (value) => {
    const match = `${value ?? ''}`.trim().match(academicYearPattern);
    if (!match) return false;
    return Number.parseInt(match[2], 10) === Number.parseInt(match[1], 10) + 1;
  };
  const toNumber = (value) => {
    const parsed = Number.parseInt(`${value ?? ''}`, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };
  const formatCalculatedNumber = (value) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  };
  const calculateEnrollmentTotalUg = (row) => (
    toNumber(row.year1_count ?? row.y1) +
    toNumber(row.year2_count ?? row.y2) +
    toNumber(row.year3_count ?? row.y3) +
    toNumber(row.year4_count ?? row.y4) +
    toNumber(row.year5_count ?? row.y5)
  );
  const calculatePersonnelFteNumber = (row) => (
    toNumber(row.full_time_count ?? row.ft) + (toNumber(row.part_time_count ?? row.pt) * PERSONNEL_PART_TIME_FTE_RATIO)
  );
  const createEnrollmentRow = (overrides = {}) => ({
    academic_year: '',
    student_type: '',
    year1_count: '0',
    year2_count: '0',
    year3_count: '0',
    year4_count: '0',
    year5_count: '0',
    total_undergraduate: '0',
    total_graduate: '0',
    associates_awarded: '0',
    bachelors_awarded: '0',
    masters_awarded: '0',
    doctorates_awarded: '0',
    is_template: false,
    ...overrides,
  });
  const createPersonnelRow = (overrides = {}) => ({
    employment_category: '',
    full_time_count: '0',
    part_time_count: '0',
    fte_count: '0',
    is_template: false,
    ...overrides,
  });
  const normalizeEnrollmentRow = (row, index = 0) => {
    const normalized = createEnrollmentRow({
      ...row,
      academic_year: normalizeAcademicYearValue(row?.academic_year ?? row?.year ?? '', Math.floor(index / 2)),
      student_type: sanitizeStudentTypeInput(row?.student_type ?? row?.type ?? ''),
      year1_count: sanitizeNonNegativeIntegerInput(row?.year1_count ?? row?.y1 ?? ''),
      year2_count: sanitizeNonNegativeIntegerInput(row?.year2_count ?? row?.y2 ?? ''),
      year3_count: sanitizeNonNegativeIntegerInput(row?.year3_count ?? row?.y3 ?? ''),
      year4_count: sanitizeNonNegativeIntegerInput(row?.year4_count ?? row?.y4 ?? ''),
      year5_count: sanitizeNonNegativeIntegerInput(row?.year5_count ?? row?.y5 ?? ''),
      total_graduate: sanitizeNonNegativeIntegerInput(row?.total_graduate ?? row?.grad ?? ''),
      associates_awarded: sanitizeNonNegativeIntegerInput(row?.associates_awarded ?? row?.a ?? ''),
      bachelors_awarded: sanitizeNonNegativeIntegerInput(row?.bachelors_awarded ?? row?.b ?? ''),
      masters_awarded: sanitizeNonNegativeIntegerInput(row?.masters_awarded ?? row?.m ?? ''),
      doctorates_awarded: sanitizeNonNegativeIntegerInput(row?.doctorates_awarded ?? row?.d ?? ''),
      is_template: false,
    });
    return {
      ...normalized,
      total_undergraduate: `${calculateEnrollmentTotalUg(normalized)}`,
    };
  };
  const normalizePersonnelRow = (row) => {
    const normalized = createPersonnelRow({
      ...row,
      employment_category: `${row?.employment_category ?? row?.cat ?? ''}`,
      full_time_count: sanitizeNonNegativeIntegerInput(row?.full_time_count ?? row?.ft ?? ''),
      part_time_count: sanitizeNonNegativeIntegerInput(row?.part_time_count ?? row?.pt ?? ''),
      is_template: false,
    });
    return {
      ...normalized,
      fte_count: formatCalculatedNumber(calculatePersonnelFteNumber(normalized)),
    };
  };
  const defaultEnrollmentRows = defaultAcademicYears.flatMap((academicYear) => (
    ['FT', 'PT'].map((studentType) => normalizeEnrollmentRow(createEnrollmentRow({ academic_year: academicYear, student_type: studentType })))
  ));
  const defaultPersonnelRows = [
    'Administrative',
    'Faculty (tenure-track)',
    'Other Faculty (excluding student assistants)',
    'Student Teaching Assistants',
    'Technicians/Specialists',
    'Office/Clerical Employees',
    'Others',
  ].map((employmentCategory) => normalizePersonnelRow(createPersonnelRow({ employment_category: employmentCategory })));

  useEffect(() => {
    const fetchAppendixD = async () => {
      try {
        setLoading(true);
        setSaveError('');
        const result = await apiRequest(`/cycles/${cycleId}/appendixd/`, { method: 'GET' });
        setFormData((prev) => ({
          ...prev,
          institutionName: `${result?.institutionName ?? ''}`,
          institutionAddress: `${result?.institutionAddress ?? ''}`,
          chiefExecutiveName: `${result?.chiefExecutiveName ?? ''}`,
          chiefExecutiveTitle: `${result?.chiefExecutiveTitle ?? ''}`,
          selfStudySubmitterName: `${result?.selfStudySubmitterName ?? ''}`,
          selfStudySubmitterTitle: `${result?.selfStudySubmitterTitle ?? ''}`,
          institutionalAccreditations: `${result?.institutionalAccreditations ?? ''}`,
          accreditationEvaluationDates: `${result?.accreditationEvaluationDates ?? ''}`,
          controlTypeDescription: `${result?.controlTypeDescription ?? ''}`,
          administrativeChainDescription: `${result?.administrativeChainDescription ?? ''}`,
          organizationChartFileReference: `${result?.organizationChartFileReference ?? ''}`,
          creditHourDefinition: `${result?.creditHourDefinition ?? ''}`,
          deviationsFromStandard: `${result?.deviationsFromStandard ?? ''}`,
        }));
        setAcademicSupportUnits(Array.isArray(result?.academicSupportUnits) ? result.academicSupportUnits : []);
        setNonacademicSupportUnits(Array.isArray(result?.nonacademicSupportUnits) ? result.nonacademicSupportUnits : []);
        const loadedEnrollment = Array.isArray(result?.enrollmentRecords) ? result.enrollmentRecords : [];
        const loadedPersonnel = Array.isArray(result?.personnelRecords) ? result.personnelRecords : [];
        setEnrollmentRecords(loadedEnrollment.length > 0 ? loadedEnrollment.map((row, index) => normalizeEnrollmentRow(row, index)) : defaultEnrollmentRows.map((row) => ({ ...row })));
        setPersonnelRecords(loadedPersonnel.length > 0 ? loadedPersonnel.map((row) => normalizePersonnelRow(row)) : defaultPersonnelRows.map((row) => ({ ...row })));
      } catch (error) {
        setSaveError(`Unable to load Appendix D: ${error?.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchAppendixD();
  }, [cycleId]);

  useEffect(() => {
    const fetchFacultyOptions = async () => {
      try {
        const result = await apiRequest(`/programs/${programId}/faculty-members/`, { method: 'GET' });
        const options = Array.isArray(result) ? result : [];
        setFacultyOptions(options.map((item) => ({
          faculty_id: item.faculty_id,
          full_name: item.full_name || '',
          academic_rank: item.academic_rank || '',
          email: item.email || '',
        })));
      } catch (error) {
        setFacultyOptions([]);
      }
    };
    fetchFacultyOptions();
  }, [programId]);

  const isNonNegativeIntegerText = (value) => /^\d+$/.test(`${value ?? ''}`.trim());
  const isValidEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(`${value ?? ''}`.trim());
  const isNumericPhone = (value) => /^\+?\d+$/.test(`${value ?? ''}`.replace(/[\s\-\(\)]/g, ''));
  const appendixDTableValidation = (() => {
    const enrollment = {};
    const personnel = {};
    const duplicateEnrollmentKeys = new Map();

    enrollmentRecords.forEach((currentRow, index) => {
      const row = normalizeEnrollmentRow(currentRow, index);
      const rowErrors = {};
      const academicYear = `${row.academic_year ?? ''}`.trim();
      const studentType = `${row.student_type ?? ''}`.trim().toUpperCase();
      const editableNumericFields = [
        ['year1_count', '1st year enrollment'],
        ['year2_count', '2nd year enrollment'],
        ['year3_count', '3rd year enrollment'],
        ['year4_count', '4th year enrollment'],
        ['year5_count', '5th year enrollment'],
        ['total_graduate', 'Total Grad'],
        ['associates_awarded', 'Associates'],
        ['bachelors_awarded', 'Bachelors'],
        ['masters_awarded', 'Masters'],
        ['doctorates_awarded', 'Doctorates'],
      ];
      const hasAny = academicYear || studentType || editableNumericFields.some(([field]) => `${row[field] ?? ''}`.trim() !== '');
      if (!hasAny) return;

      if (!academicYear) {
        rowErrors.academic_year = 'Required.';
      } else if (!isValidAcademicYear(academicYear)) {
        rowErrors.academic_year = 'Use YYYY-YYYY.';
      }

      if (!studentType) {
        rowErrors.student_type = 'Required.';
      } else if (!['FT', 'PT'].includes(studentType)) {
        rowErrors.student_type = 'Use FT or PT.';
      }

      editableNumericFields.forEach(([field, label]) => {
        const text = `${row[field] ?? ''}`.trim();
        if (text === '') {
          rowErrors[field] = 'Required.';
        } else if (!isNonNegativeIntegerText(text)) {
          rowErrors[field] = `${label} must be a non-negative integer.`;
        }
      });

      if (!rowErrors.academic_year && !rowErrors.student_type) {
        const duplicateKey = `${academicYear}::${studentType}`;
        if (duplicateEnrollmentKeys.has(duplicateKey)) {
          rowErrors.academic_year = 'Duplicate Academic Year + FT/PT.';
          rowErrors.student_type = 'Duplicate Academic Year + FT/PT.';
          const previousIndex = duplicateEnrollmentKeys.get(duplicateKey);
          enrollment[previousIndex] = {
            ...(enrollment[previousIndex] || {}),
            academic_year: 'Duplicate Academic Year + FT/PT.',
            student_type: 'Duplicate Academic Year + FT/PT.',
          };
        } else {
          duplicateEnrollmentKeys.set(duplicateKey, index);
        }
      }

      if (Object.keys(rowErrors).length > 0) {
        enrollment[index] = rowErrors;
      }
    });

    personnelRecords.forEach((currentRow, index) => {
      const row = normalizePersonnelRow(currentRow);
      const rowErrors = {};
      const employmentCategory = `${row.employment_category ?? ''}`.trim();
      const hasAny = employmentCategory || `${row.full_time_count ?? ''}`.trim() || `${row.part_time_count ?? ''}`.trim();
      if (!hasAny) return;

      if (!employmentCategory) {
        rowErrors.employment_category = 'Required.';
      }

      [
        ['full_time_count', 'FT'],
        ['part_time_count', 'PT'],
      ].forEach(([field, label]) => {
        const text = `${row[field] ?? ''}`.trim();
        if (text === '') {
          rowErrors[field] = 'Required.';
        } else if (!isNonNegativeIntegerText(text)) {
          rowErrors[field] = `${label} must be a non-negative integer.`;
        }
      });

      if (Object.keys(rowErrors).length > 0) {
        personnel[index] = rowErrors;
      }
    });

    return {
      enrollment,
      personnel,
      hasErrors: Object.keys(enrollment).length > 0 || Object.keys(personnel).length > 0,
    };
  })();
  const validateAppendixDForm = () => {
    for (let index = 0; index < academicSupportUnits.length; index += 1) {
      const row = academicSupportUnits[index] || {};
      const rowNumber = index + 1;
      const unit = `${row.unit_name ?? row.unit ?? ''}`.trim();
      const name = `${row.responsible_person_name ?? row.name ?? ''}`.trim();
      const title = `${row.responsible_person_title ?? row.title ?? ''}`.trim();
      const email = `${row.contact_email ?? ''}`.trim();
      const phone = `${row.contact_phone ?? row.contact ?? ''}`.trim();
      const hasAny = unit || name || title || email || phone;
      if (!hasAny) continue;
      if (email && !isValidEmail(email)) return `Academic Unit row ${rowNumber}: Email must be valid.`;
      if (phone && !isNumericPhone(phone)) {
        return `Academic Unit row ${rowNumber}: Phone must contain only numbers.`;
      }
    }

    for (let index = 0; index < nonacademicSupportUnits.length; index += 1) {
      const row = nonacademicSupportUnits[index] || {};
      const rowNumber = index + 1;
      const unit = `${row.unit_name ?? row.unit ?? ''}`.trim();
      const name = `${row.responsible_person_name ?? row.name ?? ''}`.trim();
      const title = `${row.responsible_person_title ?? row.title ?? ''}`.trim();
      const email = `${row.contact_email ?? ''}`.trim();
      const phone = `${row.contact_phone ?? row.contact ?? ''}`.trim();
      const hasAny = unit || name || title || email || phone;
      if (!hasAny) continue;
      if (email && !isValidEmail(email)) return `Non-academic Unit row ${rowNumber}: Email must be valid.`;
      if (phone && !isNumericPhone(phone)) {
        return `Non-academic Unit row ${rowNumber}: Phone must contain only numbers.`;
      }
    }

    for (let index = 0; index < enrollmentRecords.length; index += 1) {
      const row = normalizeEnrollmentRow(enrollmentRecords[index] || {}, index);
      const rowNumber = index + 1;
      const academicYear = `${row.academic_year ?? row.year ?? ''}`.trim();
      const studentType = `${row.student_type ?? row.type ?? ''}`.trim().toUpperCase();
      const numericFields = [
        [row.year1_count ?? row.y1, '1st year enrollment'],
        [row.year2_count ?? row.y2, '2nd year enrollment'],
        [row.year3_count ?? row.y3, '3rd year enrollment'],
        [row.year4_count ?? row.y4, '4th year enrollment'],
        [row.year5_count ?? row.y5, '5th year enrollment'],
        [row.total_graduate ?? row.grad, 'Total Grad'],
        [row.associates_awarded ?? row.a, 'Associates'],
        [row.bachelors_awarded ?? row.b, 'Bachelors'],
        [row.masters_awarded ?? row.m, 'Masters'],
        [row.doctorates_awarded ?? row.d, 'Doctorates'],
      ];
      const hasAny = academicYear || studentType || numericFields.some(([value]) => `${value ?? ''}`.trim() !== '');
      if (!hasAny) continue;
      if (!academicYear) return `Enrollment row ${rowNumber}: Academic Year is required.`;
      if (!isValidAcademicYear(academicYear)) return `Enrollment row ${rowNumber}: Academic Year must use YYYY-YYYY.`;
      if (!studentType) return `Enrollment row ${rowNumber}: FT/PT is required.`;
      if (studentType && !['FT', 'PT'].includes(studentType)) return `Enrollment row ${rowNumber}: FT/PT must be either FT or PT.`;
      for (const [value, label] of numericFields) {
        const text = `${value ?? ''}`.trim();
        if (!text) {
          return `Enrollment row ${rowNumber}: ${label} is required.`;
        }
        if (!isNonNegativeIntegerText(text)) {
          return `Enrollment row ${rowNumber}: ${label} must be a non-negative integer.`;
        }
      }
    }

    for (let index = 0; index < personnelRecords.length; index += 1) {
      const row = normalizePersonnelRow(personnelRecords[index] || {});
      const rowNumber = index + 1;
      const employmentCategory = `${row.employment_category ?? row.cat ?? ''}`.trim();
      const hasAny = employmentCategory || `${row.full_time_count ?? row.ft ?? ''}`.trim() || `${row.part_time_count ?? row.pt ?? ''}`.trim();
      if (!hasAny) continue;
      if (!employmentCategory) return `Personnel row ${rowNumber}: Employment Category is required.`;
      const numericFields = [
        [row.full_time_count ?? row.ft, 'FT'],
        [row.part_time_count ?? row.pt, 'PT'],
      ];
      for (const [value, label] of numericFields) {
        const text = `${value ?? ''}`.trim();
        if (!text) {
          return `Personnel row ${rowNumber}: ${label} is required.`;
        }
        if (!isNonNegativeIntegerText(text)) {
          return `Personnel row ${rowNumber}: ${label} must be a non-negative integer.`;
        }
      }
    }

    if (appendixDTableValidation.hasErrors) {
      return 'Appendix D tables contain invalid or duplicate values.';
    }

    return '';
  };

  const setField = (field) => (event) => setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  const updateAcademicUnit = (index, field, value) => setAcademicSupportUnits((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const updateNonacademicUnit = (index, field, value) => setNonacademicSupportUnits((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const updateEnrollment = (index, field, value) => setEnrollmentRecords((prev) => prev.map((row, i) => {
    if (i !== index) return row;
    const nextValue = field === 'academic_year'
      ? sanitizeAcademicYearInput(value)
      : field === 'student_type'
        ? sanitizeStudentTypeInput(value)
        : field === 'total_undergraduate'
          ? row.total_undergraduate
          : sanitizeNonNegativeIntegerInput(value);
    return normalizeEnrollmentRow({ ...row, [field]: nextValue }, index);
  }));
  const updatePersonnel = (index, field, value) => setPersonnelRecords((prev) => prev.map((row, i) => {
    if (i !== index) return row;
    const nextValue = field === 'fte_count' ? row.fte_count : (
      field === 'employment_category' ? value : sanitizeNonNegativeIntegerInput(value)
    );
    return normalizePersonnelRow({ ...row, [field]: nextValue });
  }));
  const addEnrollmentRecord = () => setEnrollmentRecords((prev) => [...prev, normalizeEnrollmentRow(createEnrollmentRow(), prev.length)]);
  const addPersonnelRecord = () => setPersonnelRecords((prev) => [...prev, normalizePersonnelRow(createPersonnelRow())]);
  const removeAcademicUnit = (index) => setAcademicSupportUnits((prev) => prev.filter((_, i) => i !== index));
  const removeNonacademicUnit = (index) => setNonacademicSupportUnits((prev) => prev.filter((_, i) => i !== index));
  const removeEnrollmentRecord = (index) => setEnrollmentRecords((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index).map((row, rowIndex) => normalizeEnrollmentRow(row, rowIndex))));
  const removePersonnelRecord = (index) => setPersonnelRecords((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index).map((row) => normalizePersonnelRow(row))));
  const addAcademicUnit = () => setAcademicSupportUnits((prev) => [...prev, { unit_name: '', responsible_person_name: '', responsible_person_title: '', contact_email: '', contact_phone: '' }]);
  const getAppendixDTableFieldError = (tableName, rowIndex, field) => {
    if (!showAppendixDTableErrors) return '';
    return tableName === 'enrollment'
      ? appendixDTableValidation.enrollment[rowIndex]?.[field] || ''
      : appendixDTableValidation.personnel[rowIndex]?.[field] || '';
  };
  const addAcademicUnitFromFaculty = () => {
    const selectedId = Number.parseInt(selectedFacultyId, 10);
    if (!Number.isInteger(selectedId)) return;
    const faculty = facultyOptions.find((item) => Number(item.faculty_id) === selectedId);
    if (!faculty) return;
    setAcademicSupportUnits((prev) => [
      ...prev,
      {
        unit_name: '',
        responsible_person_name: faculty.full_name || '',
        responsible_person_title: faculty.academic_rank || '',
        contact_email: faculty.email || '',
        contact_phone: '',
      },
    ]);
    setSelectedFacultyId('');
  };
  const addNonacademicUnit = () => setNonacademicSupportUnits((prev) => [...prev, { unit_name: '', responsible_person_name: '', responsible_person_title: '', contact_email: '', contact_phone: '' }]);
  const setSupportContact = (updateFn, index, value) => {
    const text = `${value ?? ''}`.trim();
    if (text.includes('@')) {
      updateFn(index, 'contact_email', text);
      updateFn(index, 'contact_phone', '');
      return;
    }
    updateFn(index, 'contact_phone', text);
    updateFn(index, 'contact_email', '');
  };
  const openAppendixDUploadModal = async (sectionTitle) => {
    setAppendixDDocStatus('');
    setAppendixDDocModal({ open: true, sectionTitle });
    try {
      const docs = await listCriterion1SectionDocs(cycleId, `AppendixD:${sectionTitle}`);
      setAppendixDDocs(docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type })));
    } catch (err) {
      setAppendixDDocs([]);
      setAppendixDDocStatus(err?.message || 'Unable to load documents.');
    }
  };

  const closeAppendixDUploadModal = () => {
    setAppendixDDocModal({ open: false, sectionTitle: '' });
    setAppendixDDocs([]);
    setAppendixDDocStatus('');
  };

  const handleAppendixDSectionDocFiles = async (sectionTitle, files) => {
    if (!sectionTitle) return;
    if (!Array.isArray(files) || files.length === 0) return;
    try {
      await appendCriterion1SectionDocs(cycleId, `AppendixD:${sectionTitle}`, files);
      const docs = await listCriterion1SectionDocs(cycleId, `AppendixD:${sectionTitle}`);
      const normalizedDocs = docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type }));
      if (appendixDDocModal.sectionTitle === sectionTitle) {
        setAppendixDDocs(normalizedDocs);
        setAppendixDDocStatus(`${docs.length} file(s) saved for ${sectionTitle}.`);
      }
      if (sectionTitle === 'Organization Chart') {
        setFormData((prev) => ({ ...prev, organizationChartFileReference: normalizedDocs.map((doc) => doc.name).join(', ') }));
      }
    } catch (err) {
      if (appendixDDocModal.sectionTitle === sectionTitle) {
        setAppendixDDocStatus(err?.message || 'Unable to save documents.');
      }
    }
  };

  const handleAppendixDDocFiles = async (files) => {
    if (!appendixDDocModal.sectionTitle) return;
    await handleAppendixDSectionDocFiles(appendixDDocModal.sectionTitle, files);
  };

  const handleAppendixDDocSelection = (event) => {
    const files = Array.from(event.target.files || []);
    handleAppendixDDocFiles(files);
  };

  const handleAppendixDRemoveDoc = (docId) => {
    deleteCriterion1DocById(docId)
      .then(() => listCriterion1SectionDocs(cycleId, `AppendixD:${appendixDDocModal.sectionTitle}`))
      .then((docs) => {
        const normalizedDocs = docs.map((row) => ({ id: row.id, name: row.name, size: row.size, type: row.type }));
        setAppendixDDocs(normalizedDocs);
        setAppendixDDocStatus('Document removed.');
        if (appendixDDocModal.sectionTitle === 'Organization Chart') {
          setFormData((prev) => ({ ...prev, organizationChartFileReference: normalizedDocs.map((doc) => doc.name).join(', ') }));
        }
      })
      .catch((err) => setAppendixDDocStatus(err?.message || 'Unable to remove document.'));
  };

  const handleExtractAppendixDWithAi = async () => {
    if (appendixDDocLoading) return;
    const eligibleFields = APPENDIX_D_TEXTBOX_SECTION_FIELDS[appendixDDocModal.sectionTitle];
    if (!eligibleFields) {
      setAppendixDDocStatus('Local AI extraction is not enabled for this section.');
      return;
    }
    if (appendixDDocs.length === 0) {
      setAppendixDDocStatus('Upload at least one document before running Extract with AI.');
      return;
    }

    try {
      setAppendixDDocLoading(true);
      setAppendixDDocStatus('Reading the selected documents and extracting ABET-relevant information for this section...');
      const currentFields = eligibleFields.reduce((accumulator, field) => ({
        ...accumulator,
        [field]: `${formData?.[field] ?? ''}`,
      }), {});

      const result = await extractTextboxSectionWithLocalAi({
        cycleId,
        pageKey: 'appendixd',
        sectionTitle: appendixDDocModal.sectionTitle,
        currentFields,
        selectedDocuments: appendixDDocs,
        loadStoredDocById: getCriterion1DocById,
      });

      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          eligibleFields.map((field) => [field, `${result?.mergedFields?.[field] ?? prev?.[field] ?? ''}`])
        ),
      }));
      setAppendixDDocStatus(buildTextboxAiStatus(result, 'AI extraction completed.'));
    } catch (err) {
      setAppendixDDocStatus(err?.message || 'AI extraction failed.');
    } finally {
      setAppendixDDocLoading(false);
    }
  };

  const buildAppendixDPayload = () => ({
    ...formData,
    institutionAddress: `${formData.institutionAddress ?? ''}`.trim() || `${formData.institutionName ?? ''}`.trim(),
    academicSupportUnits: academicSupportUnits.map((row) => {
      const contactValue = `${row.contact_phone || row.contact_email || row.contact || ''}`.trim();
      const isEmail = contactValue.includes('@');
      return {
        unit_name: row.unit_name || row.unit || '',
        responsible_person_name: row.responsible_person_name || row.name || '',
        responsible_person_title: row.responsible_person_title || row.title || '',
        contact_email: isEmail ? contactValue : (row.contact_email || ''),
        contact_phone: isEmail ? '' : (contactValue || row.contact_phone || ''),
      };
    }),
    nonacademicSupportUnits: nonacademicSupportUnits.map((row) => {
      const contactValue = `${row.contact_phone || row.contact_email || row.contact || ''}`.trim();
      const isEmail = contactValue.includes('@');
      return {
        unit_name: row.unit_name || row.unit || '',
        responsible_person_name: row.responsible_person_name || row.name || '',
        responsible_person_title: row.responsible_person_title || row.title || '',
        contact_email: isEmail ? contactValue : (row.contact_email || ''),
        contact_phone: isEmail ? '' : (contactValue || row.contact_phone || ''),
      };
    }),
    enrollmentRecords: enrollmentRecords.map((row, index) => {
      const normalized = normalizeEnrollmentRow(row, index);
      return {
        academic_year: normalized.academic_year,
        student_type: normalized.student_type,
        year1_count: toNumber(normalized.year1_count),
        year2_count: toNumber(normalized.year2_count),
        year3_count: toNumber(normalized.year3_count),
        year4_count: toNumber(normalized.year4_count),
        year5_count: toNumber(normalized.year5_count),
        total_undergraduate: calculateEnrollmentTotalUg(normalized),
        total_graduate: toNumber(normalized.total_graduate),
        associates_awarded: toNumber(normalized.associates_awarded),
        bachelors_awarded: toNumber(normalized.bachelors_awarded),
        masters_awarded: toNumber(normalized.masters_awarded),
        doctorates_awarded: toNumber(normalized.doctorates_awarded),
      };
    }),
    personnelRecords: personnelRecords.map((row) => {
      const normalized = normalizePersonnelRow(row);
      return {
        employment_category: normalized.employment_category ?? normalized.cat ?? '',
        full_time_count: toNumber(normalized.full_time_count),
        part_time_count: toNumber(normalized.part_time_count),
        fte_count: calculatePersonnelFteNumber(normalized),
      };
    }),
  });

  const handleExportAppendixD = async () => {
    try {
      setExporting(true);
      setSaveError('');

      const payload = buildAppendixDPayload();
      const exportPayload = {
        metadata: {
          program_name: localStorage.getItem('currentProgramName') || '',
          cycle_label: localStorage.getItem('currentCycleLabel') || '',
          cycle_id: Number(cycleId),
          exported_at: new Date().toISOString(),
        },
        appendix_d: payload,
      };
      const paragraphRow = (label, value) => new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun(`${value ?? ''}`),
        ],
      });
      const tableCell = (text, bold = false) => new TableCell({
        width: { size: 100 / 4, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: `${text ?? ''}`, bold })] })],
      });
      const tableCellWide = (text, bold = false) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `${text ?? ''}`, bold })] })],
      });

      const academicUnitRows = [
        new TableRow({
          children: [
            tableCellWide('Support Unit', true),
            tableCellWide('Responsible Person', true),
            tableCellWide('Title', true),
            tableCellWide('Email / Phone', true),
          ],
        }),
        ...exportPayload.appendix_d.academicSupportUnits.map((row) => new TableRow({
          children: [
            tableCellWide(row.unit_name || ''),
            tableCellWide(row.responsible_person_name || ''),
            tableCellWide(row.responsible_person_title || ''),
            tableCellWide(row.contact_email || row.contact_phone || ''),
          ],
        })),
      ];
      const nonAcademicUnitRows = [
        new TableRow({
          children: [
            tableCellWide('Support Unit', true),
            tableCellWide('Responsible Person', true),
            tableCellWide('Title', true),
            tableCellWide('Email / Phone', true),
          ],
        }),
        ...exportPayload.appendix_d.nonacademicSupportUnits.map((row) => new TableRow({
          children: [
            tableCellWide(row.unit_name || ''),
            tableCellWide(row.responsible_person_name || ''),
            tableCellWide(row.responsible_person_title || ''),
            tableCellWide(row.contact_email || row.contact_phone || ''),
          ],
        })),
      ];
      const enrollmentRows = [
        new TableRow({
          children: [
            tableCellWide('Academic Year', true),
            tableCellWide('FT/PT', true),
            tableCellWide('1st', true),
            tableCellWide('2nd', true),
            tableCellWide('3rd', true),
            tableCellWide('4th', true),
            tableCellWide('5th', true),
            tableCellWide('Total UG', true),
            tableCellWide('Total Grad', true),
            tableCellWide('Associates', true),
            tableCellWide('Bachelors', true),
            tableCellWide('Masters', true),
            tableCellWide('Doctorates', true),
          ],
        }),
        ...exportPayload.appendix_d.enrollmentRecords.map((row) => new TableRow({
          children: [
            tableCellWide(row.academic_year || ''),
            tableCellWide(row.student_type || ''),
            tableCellWide(row.year1_count),
            tableCellWide(row.year2_count),
            tableCellWide(row.year3_count),
            tableCellWide(row.year4_count),
            tableCellWide(row.year5_count),
            tableCellWide(row.total_undergraduate),
            tableCellWide(row.total_graduate),
            tableCellWide(row.associates_awarded),
            tableCellWide(row.bachelors_awarded),
            tableCellWide(row.masters_awarded),
            tableCellWide(row.doctorates_awarded),
          ],
        })),
      ];
      const personnelRows = [
        new TableRow({
          children: [
            tableCell('Employment Category', true),
            tableCell('FT', true),
            tableCell('PT', true),
            tableCell('FTE', true),
          ],
        }),
        ...exportPayload.appendix_d.personnelRecords.map((row) => new TableRow({
          children: [
            tableCell(row.employment_category || ''),
            tableCell(row.full_time_count),
            tableCell(row.part_time_count),
            tableCell(row.fte_count),
          ],
        })),
      ];
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: 'Appendix D - Institutional Summary', heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT }),
            paragraphRow('Program', exportPayload.metadata.program_name),
            paragraphRow('Cycle', exportPayload.metadata.cycle_label),
            paragraphRow('Exported At', exportPayload.metadata.exported_at),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '1. The Institution', heading: HeadingLevel.HEADING_2 }),
            paragraphRow('Institution Name', payload.institutionName),
            paragraphRow('Institution Address', payload.institutionAddress),
            paragraphRow('Chief Executive Name', payload.chiefExecutiveName),
            paragraphRow('Chief Executive Title', payload.chiefExecutiveTitle),
            paragraphRow('Self Study Submitter Name', payload.selfStudySubmitterName),
            paragraphRow('Self Study Submitter Title', payload.selfStudySubmitterTitle),
            paragraphRow('Institutional Accreditations', payload.institutionalAccreditations),
            paragraphRow('Accreditation Evaluation Dates', payload.accreditationEvaluationDates),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '2. Type of Control', heading: HeadingLevel.HEADING_2 }),
            new Paragraph(payload.controlTypeDescription || ''),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '3. Educational Unit', heading: HeadingLevel.HEADING_2 }),
            new Paragraph(payload.administrativeChainDescription || ''),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '4. Academic Support Units', heading: HeadingLevel.HEADING_2 }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: academicUnitRows }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '5. Non-academic Support Units', heading: HeadingLevel.HEADING_2 }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: nonAcademicUnitRows }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '6. Credit Unit', heading: HeadingLevel.HEADING_2 }),
            paragraphRow('Credit Hour Definition', payload.creditHourDefinition),
            paragraphRow('Deviations From Standard', payload.deviationsFromStandard),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '7. Tables', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: 'Table D-1. Program Enrollment and Degree Data', heading: HeadingLevel.HEADING_3 }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: enrollmentRows }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Table D-2. Personnel', heading: HeadingLevel.HEADING_3 }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: personnelRows }),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const safeProgram = `${localStorage.getItem('currentProgramName') || 'program'}`.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
      const safeCycle = `${localStorage.getItem('currentCycleLabel') || 'cycle'}`.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
      anchor.href = url;
      anchor.download = `appendix_d_${safeProgram}_${safeCycle}.docx`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        anchor.remove();
      }, 1000);
    } catch (error) {
      setSaveError(`Export failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveAppendixD = async () => {
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess(false);
      setShowAppendixDTableErrors(true);
      const validationError = validateAppendixDForm();
      if (validationError) {
        setSaveError(validationError);
        return;
      }
      const payload = buildAppendixDPayload();
      const result = await apiRequest(`/cycles/${cycleId}/appendixd/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setFormData((prev) => ({
        ...prev,
        institutionName: `${result?.institutionName ?? ''}`,
        institutionAddress: `${result?.institutionAddress ?? ''}`,
        chiefExecutiveName: `${result?.chiefExecutiveName ?? ''}`,
        chiefExecutiveTitle: `${result?.chiefExecutiveTitle ?? ''}`,
        selfStudySubmitterName: `${result?.selfStudySubmitterName ?? ''}`,
        selfStudySubmitterTitle: `${result?.selfStudySubmitterTitle ?? ''}`,
        institutionalAccreditations: `${result?.institutionalAccreditations ?? ''}`,
        accreditationEvaluationDates: `${result?.accreditationEvaluationDates ?? ''}`,
        controlTypeDescription: `${result?.controlTypeDescription ?? ''}`,
        administrativeChainDescription: `${result?.administrativeChainDescription ?? ''}`,
        organizationChartFileReference: `${result?.organizationChartFileReference ?? ''}`,
        creditHourDefinition: `${result?.creditHourDefinition ?? ''}`,
        deviationsFromStandard: `${result?.deviationsFromStandard ?? ''}`,
      }));
      setAcademicSupportUnits(Array.isArray(result?.academicSupportUnits) ? result.academicSupportUnits : []);
      setNonacademicSupportUnits(Array.isArray(result?.nonacademicSupportUnits) ? result.nonacademicSupportUnits : []);
      const savedEnrollment = Array.isArray(result?.enrollmentRecords) ? result.enrollmentRecords : [];
      const savedPersonnel = Array.isArray(result?.personnelRecords) ? result.personnelRecords : [];
      setEnrollmentRecords(savedEnrollment.length > 0 ? savedEnrollment.map((row, index) => normalizeEnrollmentRow(row, index)) : defaultEnrollmentRows.map((row) => ({ ...row })));
      setPersonnelRecords(savedPersonnel.length > 0 ? savedPersonnel.map((row) => normalizePersonnelRow(row)) : defaultPersonnelRows.map((row) => ({ ...row })));
      localStorage.setItem('checklistNeedsRefresh', 'true');
      setSaveSuccess(true);
      setShowAppendixDTableErrors(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(`Save failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  return (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Appendix D - Institutional Summary" subtitle={subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Institutional Summary</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>

                Provide institutional details, administrative structure, support units, credit policy, and required tables.

              </p>

            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              <button
                onClick={handleSaveAppendixD}
                disabled={saving}
                style={{ backgroundColor: saving ? '#6c757d' : colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}
              >

                <Save size={16} />

                {saving ? 'Saving...' : 'Save Draft'}

              </button>

              <button onClick={handleExportAppendixD} disabled={exporting} style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}>

                <Download size={16} />

                {exporting ? 'Exporting...' : 'Export Appendix D'}

              </button>

              <button
                onClick={() => setCurrentPage && setCurrentPage('appendices')}
                style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Database size={16} />
                Back to Appendices
              </button>

            </div>

          </div>

          {saveSuccess ? (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', color: '#155724', fontSize: '14px' }}>
              Saved successfully!
            </div>
          ) : null}
          {saveError ? (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#721c24', fontSize: '14px' }}>
              {saveError}
            </div>
          ) : null}
          {loading ? (
            <div style={{ marginTop: '12px', color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>
              Loading Appendix D...
            </div>
          ) : null}

        </div>



        {/* 1. The Institution */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>1. The Institution</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Provide institutional identity, leadership, and accreditation history.

              </p>

            </div>

            <button
              type="button"
              onClick={() => openAppendixDUploadModal('Institution')}
              style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Upload size={16} />
              Upload Documents
            </button>

          </div>



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '14px' }}>

            <textarea value={formData.institutionName} onChange={setField('institutionName')} placeholder="1a. Name and address of the institution" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea value={`${formData.chiefExecutiveName}${formData.chiefExecutiveTitle ? ` (${formData.chiefExecutiveTitle})` : ''}`} onChange={(event) => setFormData((prev) => ({ ...prev, chiefExecutiveName: event.target.value }))} placeholder="1b. Chief executive officer (name and title)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea value={`${formData.selfStudySubmitterName}${formData.selfStudySubmitterTitle ? ` (${formData.selfStudySubmitterTitle})` : ''}`} onChange={(event) => setFormData((prev) => ({ ...prev, selfStudySubmitterName: event.target.value }))} placeholder="1c. Person submitting the Self-Study (name and title)" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

            <textarea value={`${formData.institutionalAccreditations}\n${formData.accreditationEvaluationDates}`.trim()} onChange={(event) => { const [first, ...rest] = event.target.value.split('\n'); setFormData((prev) => ({ ...prev, institutionalAccreditations: first || '', accreditationEvaluationDates: rest.join('\n') || '' })); }} placeholder="1d. Institutional accreditations and evaluation dates" style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px' }} />

          </div>

        </div>



        {/* 2. Type of Control */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>2. Type of Control</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Managerial control (private/non-profit, public, denominational, etc.).</p>

            </div>

            <button
              type="button"
              onClick={() => openAppendixDUploadModal('Type of Control')}
              style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Upload size={16} />
              Upload Documents
            </button>

          </div>

          <textarea value={formData.controlTypeDescription} onChange={setField('controlTypeDescription')} placeholder="Describe the type of control for the institution." style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

        </div>



        {/* 3. Educational Unit */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>3. Educational Unit</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                Describe administrative chain of responsibility; include org chart if available.

              </p>

            </div>

            <button type="button" onClick={() => openAppendixDUploadModal('Organization Chart')} style={{ backgroundColor: colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>

              <Upload size={16} />

              Upload Organization Chart

            </button>

          </div>



          <textarea value={formData.administrativeChainDescription} onChange={setField('administrativeChainDescription')} placeholder="Administrative chain (program director -> dean -> provost -> CEO)" style={{ width: '100%', minHeight: '130px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

        </div>



        {/* 4. Academic Support Units */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>4. Academic Support Units</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                List responsible individuals for units teaching required courses (e.g., Math, Physics).

              </p>

            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>

              <select
                value={selectedFacultyId}
                onChange={(event) => setSelectedFacultyId(event.target.value)}
                style={{ minWidth: '220px', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: 'white' }}
              >
                <option value="">Select Faculty Member</option>
                {facultyOptions.map((faculty) => (
                  <option key={`faculty-${faculty.faculty_id}`} value={faculty.faculty_id}>
                    {faculty.full_name}
                  </option>
                ))}
              </select>

              <button onClick={addAcademicUnitFromFaculty} style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>

                <Plus size={16} />

                Add Faculty User

              </button>

              <button onClick={addAcademicUnit} style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>

                <Plus size={16} />

                Add Unit

              </button>

            </div>

          </div>



          <div style={{ marginTop: '12px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Support Unit', 'Responsible Person', 'Title', 'Email / Phone', 'Actions'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {academicSupportUnits.map((row, index) => (
                  <tr key={`academic-${index}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '8px' }}>
                      <input value={row.unit_name || ''} onChange={(event) => updateAcademicUnit(index, 'unit_name', event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input value={row.responsible_person_name || ''} onChange={(event) => updateAcademicUnit(index, 'responsible_person_name', event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input value={row.responsible_person_title || ''} onChange={(event) => updateAcademicUnit(index, 'responsible_person_title', event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input value={row.contact_phone || row.contact_email || ''} onChange={(event) => setSupportContact(updateAcademicUnit, index, event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => removeAcademicUnit(index)}
                        style={{ backgroundColor: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>



        {/* 5. Non-academic Support Units */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>5. Non-academic Support Units</h3>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

                List responsible individuals for library, computing, placement, tutoring, etc.

              </p>

            </div>

            <button onClick={addNonacademicUnit} style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>

              <Plus size={16} />

              Add Unit

            </button>

          </div>



          <div style={{ marginTop: '12px', overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  {['Support Unit', 'Responsible Person', 'Title', 'Email / Phone', 'Actions'].map((h) => (

                    <th key={h} style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {nonacademicSupportUnits.map((row, index) => (
                  <tr key={`nonacademic-${index}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '8px' }}>
                      <input value={row.unit_name || ''} onChange={(event) => updateNonacademicUnit(index, 'unit_name', event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input value={row.responsible_person_name || ''} onChange={(event) => updateNonacademicUnit(index, 'responsible_person_name', event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input value={row.responsible_person_title || ''} onChange={(event) => updateNonacademicUnit(index, 'responsible_person_title', event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input value={row.contact_phone || row.contact_email || ''} onChange={(event) => setSupportContact(updateNonacademicUnit, index, event.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px' }} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => removeNonacademicUnit(index)}
                        style={{ backgroundColor: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>



        {/* 6. Credit Unit */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>6. Credit Unit</h3>

          <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

            Indicate credit hour definition if different from standard semester/quarter assumptions.

          </p>

          <textarea value={`${formData.creditHourDefinition}${formData.deviationsFromStandard ? `\n${formData.deviationsFromStandard}` : ''}`} onChange={(event) => { const [first, ...rest] = event.target.value.split('\n'); setFormData((prev) => ({ ...prev, creditHourDefinition: first || '', deviationsFromStandard: rest.join('\n') || '' })); }} placeholder="Describe credit hour definitions and any deviations from standard assumptions." style={{ width: '100%', minHeight: '120px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: '14px', marginTop: '12px' }} />

        </div>



        {/* 7. Tables */}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '26px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ marginBottom: '16px' }}>

            <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>7. Tables</h3>

            <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>

              Complete the enrollment and personnel tables for the program undergoing evaluation.

            </p>

          </div>



          {/* Table D-1 */}

          <div style={{ marginBottom: '18px', overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: '800', color: colors.darkGray }}>Table D-1. Program Enrollment and Degree Data</div>
                <button
                  onClick={addEnrollmentRecord}
                  style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Academic Year</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FT/PT</th>

                  <th colSpan={5} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Enrollment Year</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Total UG</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Total Grad</th>

                  <th colSpan={4} style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Degrees Awarded</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Actions</th>

                </tr>

                <tr style={{ backgroundColor: colors.lightGray, color: colors.darkGray }}>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  {['1st', '2nd', '3rd', '4th', '5th'].map((h) => (

                    <th key={h} style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                  {['Associates', 'Bachelors', 'Masters', 'Doctorates'].map((h) => (

                    <th key={h} style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>{h}</th>

                  ))}
                  <th style={{ padding: '8px', borderBottom: `1px solid ${colors.border}` }}></th>

                </tr>

              </thead>

              <tbody>

                {enrollmentRecords.map((row, index) => (
                  <tr key={`enrollment-${index}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {[
                      ['academic_year', row.academic_year ?? row.year ?? '', 'Academic Year'],
                      ['student_type', row.student_type ?? row.type ?? '', 'FT/PT'],
                      ['year1_count', row.year1_count ?? row.y1 ?? '', '1st year enrollment'],
                      ['year2_count', row.year2_count ?? row.y2 ?? '', '2nd year enrollment'],
                      ['year3_count', row.year3_count ?? row.y3 ?? '', '3rd year enrollment'],
                      ['year4_count', row.year4_count ?? row.y4 ?? '', '4th year enrollment'],
                      ['year5_count', row.year5_count ?? row.y5 ?? '', '5th year enrollment'],
                      ['total_undergraduate', row.total_undergraduate ?? row.ug ?? '', 'Total UG'],
                      ['total_graduate', row.total_graduate ?? row.grad ?? '', 'Total Grad'],
                      ['associates_awarded', row.associates_awarded ?? row.a ?? '', 'Associates'],
                      ['bachelors_awarded', row.bachelors_awarded ?? row.b ?? '', 'Bachelors'],
                      ['masters_awarded', row.masters_awarded ?? row.m ?? '', 'Masters'],
                      ['doctorates_awarded', row.doctorates_awarded ?? row.d ?? '', 'Doctorates'],
                    ].map(([field, value, label], cellIndex) => (
                      <td key={`${field}-${cellIndex}`} style={{ padding: '8px' }}>
                        {(() => {
                          const fieldError = getAppendixDTableFieldError('enrollment', index, field);
                          const isCalculatedField = field === 'total_undergraduate';
                          const isNumericField = !['academic_year', 'student_type'].includes(field);
                          return (
                            <>
                        <input
                          value={value}
                          onChange={(event) => updateEnrollment(index, field, event.target.value)}
                          readOnly={isCalculatedField}
                          aria-label={`Table D-1 row ${index + 1} ${label}`}
                          inputMode={isNumericField ? 'numeric' : 'text'}
                          style={{
                            width: '100%',
                            padding: '7px',
                            border: fieldError ? '1px solid #dc2626' : `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            textAlign: 'center',
                            backgroundColor: isCalculatedField ? '#f3f4f6' : 'white',
                            color: isCalculatedField ? colors.mediumGray : colors.darkGray,
                          }}
                        />
                              {fieldError ? (
                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#b42318', lineHeight: 1.3 }}>
                                  {fieldError}
                                </div>
                              ) : null}
                            </>
                          );
                        })()}
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => removeEnrollmentRecord(index)}
                        disabled={enrollmentRecords.length <= 1}
                        style={{ backgroundColor: enrollmentRecords.length <= 1 ? '#f3f4f6' : '#fff5f5', color: enrollmentRecords.length <= 1 ? '#9ca3af' : '#dc2626', border: enrollmentRecords.length <= 1 ? '1px solid #e5e7eb' : '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: enrollmentRecords.length <= 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>



          {/* Table D-2 */}

          <div style={{ overflowX: 'auto', border: `1px solid ${colors.border}`, borderRadius: '10px' }}>

            <div style={{ padding: '14px', backgroundColor: colors.lightGray, borderBottom: `1px solid ${colors.border}` }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: '800', color: colors.darkGray }}>Table D-2. Personnel</div>
                <button
                  onClick={addPersonnelRecord}
                  style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>

            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>

              <thead>

                <tr style={{ backgroundColor: 'white', color: colors.darkGray }}>

                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>Employment Category</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FT</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>PT</th>

                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>FTE</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` }}>Actions</th>

                </tr>

              </thead>

              <tbody>

                {personnelRecords.map((row, index) => (
                  <tr key={`personnel-${index}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {[
                      ['employment_category', row.employment_category ?? row.cat ?? '', 'Employment Category'],
                      ['full_time_count', row.full_time_count ?? row.ft ?? '', 'FT'],
                      ['part_time_count', row.part_time_count ?? row.pt ?? '', 'PT'],
                      ['fte_count', row.fte_count ?? row.fte ?? '', 'FTE'],
                    ].map(([field, value, label], cellIndex) => (
                      <td key={`${field}-${cellIndex}`} style={{ padding: '8px' }}>
                        {(() => {
                          const fieldError = getAppendixDTableFieldError('personnel', index, field);
                          const isCalculatedField = field === 'fte_count';
                          const isNumericField = field !== 'employment_category';
                          return (
                            <>
                        <input
                          value={value}
                          onChange={(event) => updatePersonnel(index, field, event.target.value)}
                          readOnly={isCalculatedField}
                          aria-label={`Table D-2 row ${index + 1} ${label}`}
                          inputMode={isNumericField ? 'numeric' : 'text'}
                          style={{
                            width: '100%',
                            padding: '7px',
                            border: fieldError ? '1px solid #dc2626' : `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            textAlign: 'center',
                            backgroundColor: isCalculatedField ? '#f3f4f6' : 'white',
                            color: isCalculatedField ? colors.mediumGray : colors.darkGray,
                          }}
                        />
                              {fieldError ? (
                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#b42318', lineHeight: 1.3 }}>
                                  {fieldError}
                                </div>
                              ) : null}
                            </>
                          );
                        })()}
                      </td>
                    ))}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => removePersonnelRecord(index)}
                        disabled={personnelRecords.length <= 1}
                        style={{ backgroundColor: personnelRecords.length <= 1 ? '#f3f4f6' : '#fff5f5', color: personnelRecords.length <= 1 ? '#9ca3af' : '#dc2626', border: personnelRecords.length <= 1 ? '1px solid #e5e7eb' : '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: personnelRecords.length <= 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {appendixDDocModal.open && (
        <div
          onClick={closeAppendixDUploadModal}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 25, 35, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1700
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
                <div style={{ fontSize: '17px', fontWeight: '800' }}>Document Upload</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{appendixDDocModal.sectionTitle}</div>
              </div>
              <button onClick={closeAppendixDUploadModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }} aria-label="Close">
                x
              </button>
            </div>

            <div style={{ padding: '22px', display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px', color: colors.darkGray, fontSize: '13px', fontWeight: '700' }}>
                Select Documents
                <input type="file" multiple onChange={handleAppendixDDocSelection} style={{ padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px' }} />
              </label>
              <EvidenceLibraryImport
                cycleId={cycleId}
                programId={programId}
                onImportFiles={handleAppendixDDocFiles}
              />

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Selected Files
                </div>
                {appendixDDocs.length === 0 ? (
                  <div style={{ fontSize: '13px', color: colors.mediumGray }}>No files selected.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {appendixDDocs.map((file) => (
                      <div key={file.id} style={{ fontSize: '13px', color: colors.darkGray, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleAppendixDRemoveDoc(file.id)}
                          style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.danger, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {appendixDDocStatus ? <div style={{ color: colors.mediumGray, fontSize: '13px', fontWeight: '700' }}>{appendixDDocStatus}</div> : null}
            </div>

            <div style={{ padding: '16px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `1px solid ${colors.border}` }}>
              <button type="button" onClick={closeAppendixDUploadModal} style={{ backgroundColor: 'white', border: `1px solid ${colors.border}`, color: colors.mediumGray, borderRadius: '8px', padding: '10px 14px', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtractAppendixDWithAi}
                disabled={appendixDDocLoading || appendixDDocs.length === 0 || !APPENDIX_D_TEXTBOX_SECTION_FIELDS[appendixDDocModal.sectionTitle]}
                style={{
                  backgroundColor: appendixDDocLoading || appendixDDocs.length === 0 || !APPENDIX_D_TEXTBOX_SECTION_FIELDS[appendixDDocModal.sectionTitle] ? '#d8d8dd' : colors.primary,
                  border: 'none',
                  color: appendixDDocLoading || appendixDDocs.length === 0 || !APPENDIX_D_TEXTBOX_SECTION_FIELDS[appendixDDocModal.sectionTitle] ? '#6c757d' : 'white',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: '700',
                  cursor: appendixDDocLoading || appendixDDocs.length === 0 || !APPENDIX_D_TEXTBOX_SECTION_FIELDS[appendixDDocModal.sectionTitle] ? 'not-allowed' : 'pointer'
                }}
              >
                {appendixDDocLoading ? 'Extracting...' : 'Extract with AI'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
};



  // Appendices Page

  const LegacyAppendicesPage = ({ setCurrentPage, onToggleSidebar, onBack }) => {
  const { subtitle } = getActiveContext();
  return (

    <div style={{ minHeight: '100vh', backgroundColor: colors.lightGray, fontFamily: fontStack }}>

      <GlobalHeader title="Appendices A & B" subtitle={subtitle} showBackButton={true} onToggleSidebar={onToggleSidebar} onBack={onBack} />



      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            <div>

              <div style={{ color: colors.darkGray, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Appendix Dashboard</div>

              <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Course syllabi pull from the Courses sidebar; faculty vitae pull from Faculty Members.</p>

            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

              <button style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Download size={16} />

                Export All

              </button>

              <button

                onClick={() => setCurrentPage('appendixC')}

                style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}

              >

                <Database size={16} />

                Appendix C - Equipment

              </button>

              <button

                onClick={() => setCurrentPage('appendixD')}

                style={{ backgroundColor: 'white', color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.primary}`, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}

              >

                <FileText size={16} />

                Appendix D - Institutional Summary

              </button>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>

                <Sparkles size={16} />

                Auto-Gather Evidence

              </button>

            </div>

          </div>

        </div>



        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

              <div>

                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix A – Course Syllabi</h3>

                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>Auto-generated from unified syllabi; CLO→SO mapping imported from Criterion 3.</p>

              </div>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Eye size={16} /> Preview PDF

              </button>

            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {courses.map((course) => (

                <div key={course.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px', backgroundColor: colors.lightGray }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    <div>

                      <div style={{ fontWeight: '800', color: colors.darkGray }}>{course.code} – {course.name}</div>

                      <div style={{ color: colors.mediumGray, fontSize: '13px' }}>Credits & contact hours imported from course record; topics extracted from syllabi uploads.</div>

                    </div>

                    <button style={{ backgroundColor: 'white', color: colors.primary, border: `1px dashed ${colors.primary}`, padding: '8px 10px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                      <Sparkles size={14} /> Generate 2-page layout

                    </button>

                  </div>

                </div>

              ))}

            </div>

          </div>



          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${colors.border}` }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

              <div>

                <h3 style={{ margin: 0, color: colors.darkGray, fontSize: '18px', fontWeight: '800' }}>Appendix B – Faculty Vitae</h3>

                <p style={{ color: colors.mediumGray, margin: '6px 0 0 0', fontSize: '14px' }}>CV uploads from the Faculty Members sidebar feed the 10 ABET sections automatically.</p>

              </div>

              <button style={{ backgroundColor: colors.lightGray, color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>

                <Download size={16} /> Generate All Vitae

              </button>

            </div>

            <div style={{ marginTop: '12px', border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>

                <thead>

                  <tr style={{ backgroundColor: colors.primary, color: 'white' }}>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Faculty Name</th>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Vitae Status</th>

                    <th style={{ padding: '12px', textAlign: 'left' }}>Last Updated</th>

                  </tr>

                </thead>

                <tbody>

                  {facultyMembers.map((faculty) => (

                    <tr key={faculty.id} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: 'white' }}>

                      <td style={{ padding: '12px', fontWeight: '700', color: colors.darkGray }}>{faculty.name}</td>

                      <td style={{ padding: '12px', color: colors.mediumGray }}>{faculty.rank}</td>

                      <td style={{ padding: '12px', color: colors.success, fontWeight: '700' }}>Ready</td>

                      <td style={{ padding: '12px', color: colors.mediumGray }}>Oct 2025</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
};



  // Evidence Library Page


const AppendicesPage = (props) => <AppendicesABLivePage {...props} />;

export { AppendicesPage, AppendixCPage, AppendixDPage };
