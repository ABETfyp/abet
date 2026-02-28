import React, { useEffect, useMemo, useState } from "react";
import {
  Upload,
  Save,
  Check,
  ClipboardList,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import GlobalHeader from "../components/layout/GlobalHeader";
import EvidenceLibraryImport from "../components/shared/EvidenceLibraryImport";
import { colors, fontStack } from "../styles/theme";
import { apiRequest } from "../utils/api";
import { getActiveContext } from "../utils/activeContext";

const C5_TRACKED_FIELDS = [
  "academic_calender_type",
  "plan_of_study_description",
  "curricular_paths",
  "curriculum_alignment_description",
  "prerequisites_support_description",
  "prerequisite_flowchart_description",
  "hours_depth_by_subject_area_description",
  "broad_education_component_description",
  "culminating_design_experience",
  "cooperative_education_description",
  "materials_available_description",
];

const C5_DOCS_DB_NAME = "abet-criterion5-documents";
const C5_DOCS_STORE = "documents";
const C5_FLOWCHART_SECTION = "A. Program Curriculum - Plan of Study / Flowchart";

const isPdfFile = (doc) => {
  const type = `${doc?.type || ""}`.toLowerCase();
  const name = `${doc?.name || ""}`.toLowerCase();
  return type.includes("pdf") || name.endsWith(".pdf");
};

const isImageFile = (doc) => {
  const type = `${doc?.type || ""}`.toLowerCase();
  const name = `${doc?.name || ""}`.toLowerCase();
  return (
    type.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"].some((ext) =>
      name.endsWith(ext),
    )
  );
};

const openCriterion5DocsDb = () =>
  new Promise((resolve, reject) => {
    const request = window.indexedDB.open(C5_DOCS_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(C5_DOCS_STORE)) {
        const store = db.createObjectStore(C5_DOCS_STORE, { keyPath: "id" });
        store.createIndex("by_cycle_section", ["cycleId", "sectionTitle"], {
          unique: false,
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Unable to open document storage."));
  });

const listCriterion5SectionDocs = async (cycleId, sectionTitle) => {
  const db = await openCriterion5DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C5_DOCS_STORE, "readonly");
    const store = tx.objectStore(C5_DOCS_STORE);
    const index = store.index("by_cycle_section");
    const query = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));
    query.onsuccess = () => resolve(query.result || []);
    query.onerror = () =>
      reject(query.error || new Error("Unable to read stored documents."));
  });
};

const appendCriterion5SectionDocs = async (cycleId, sectionTitle, files) => {
  const db = await openCriterion5DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C5_DOCS_STORE, "readwrite");
    const store = tx.objectStore(C5_DOCS_STORE);
    const index = store.index("by_cycle_section");
    const existingReq = index.getAll(
      IDBKeyRange.only([String(cycleId), sectionTitle]),
    );

    existingReq.onsuccess = () => {
      const existing = existingReq.result || [];
      const existingKeySet = new Set(
        existing.map((row) => `${row.name}::${row.lastModified}::${row.size}`),
      );
      files.forEach((file, idx) => {
        const uniqueKey = `${file.name}::${file.lastModified}::${file.size}`;
        if (existingKeySet.has(uniqueKey)) return;
        store.put({
          id: `${cycleId}-${sectionTitle}-${file.name}-${file.lastModified}-${idx}`,
          cycleId: String(cycleId),
          sectionTitle,
          name: file.name,
          type: file.type || "Unknown",
          size: file.size,
          lastModified: file.lastModified,
          fileBlob: file,
          createdAt: new Date().toISOString(),
        });
      });
    };
    existingReq.onerror = () =>
      reject(existingReq.error || new Error("Unable to store documents."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Unable to store documents."));
  });
};

const deleteCriterion5DocById = async (docId) => {
  const db = await openCriterion5DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C5_DOCS_STORE, "readwrite");
    tx.objectStore(C5_DOCS_STORE).delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Unable to remove document."));
  });
};

const getCriterion5DocById = async (docId) => {
  const db = await openCriterion5DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C5_DOCS_STORE, "readonly");
    const query = tx.objectStore(C5_DOCS_STORE).get(docId);
    query.onsuccess = () => resolve(query.result || null);
    query.onerror = () =>
      reject(query.error || new Error("Unable to load document."));
  });
};

const newTableRow = () => ({
  local_id: Date.now() + Math.floor(Math.random() * 1000),
  recommended_schedule: "",
  course_label: "",
  r_se_category: "R",
  math_basic_sciences_credits: "",
  engineering_topics_credits: "",
  other_credits: "",
  last_two_terms_offered: "",
  max_section_enrollment: "",
});

const newProjectRow = () => ({
  local_id: Date.now() + Math.floor(Math.random() * 1000),
  project_title: "",
  team_identifier: "",
  year: "",
});

const normalizeTableRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [newTableRow()];
  return rows.map((row, index) => ({
    ...newTableRow(),
    ...row,
    local_id: Date.now() + index,
  }));
};

const normalizeProjectRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [newProjectRow()];
  return rows.map((row, index) => ({
    ...newProjectRow(),
    ...row,
    local_id: Date.now() + 5000 + index,
  }));
};

const calculateCompletion = (payload) => {
  const scalarCompleted = C5_TRACKED_FIELDS.filter(
    (field) => `${payload?.[field] ?? ""}`.trim() !== "",
  ).length;
  const hasRows =
    Array.isArray(payload?.table_5_1_rows) &&
    payload.table_5_1_rows.some((row) =>
      [
        "recommended_schedule",
        "course_label",
        "last_two_terms_offered",
        "max_section_enrollment",
      ].every((field) => `${row?.[field] ?? ""}`.trim() !== ""),
    );
  const hasProjects =
    Array.isArray(payload?.design_project_rows) &&
    payload.design_project_rows.some((row) =>
      ["project_title", "team_identifier", "year"].every(
        (field) => `${row?.[field] ?? ""}`.trim() !== "",
      ),
    );
  const totalRequired = C5_TRACKED_FIELDS.length + 2;
  const completed = scalarCompleted + (hasRows ? 1 : 0) + (hasProjects ? 1 : 0);
  return Math.round((completed / totalRequired) * 100);
};

const hasFilledValue = (value) => `${value ?? ""}`.trim() !== "";

const countFilledRows = (rows = [], ignoredKeys = ["local_id"]) =>
  rows.filter((row) =>
    Object.entries(row || {}).some(
      ([key, value]) => !ignoredKeys.includes(key) && hasFilledValue(value),
    ),
  ).length;

const Criterion5PageImpl = ({ onToggleSidebar, onBack }) => {
  const { subtitle, programName, cycleLabel } = getActiveContext();
  const cycleId = localStorage.getItem("currentCycleId") || 1;
  const programId = localStorage.getItem("currentProgramId") || 1;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [uploadModal, setUploadModal] = useState({
    open: false,
    sectionTitle: "",
  });
  const [criterion5Docs, setCriterion5Docs] = useState([]);
  const [criterion5DocStatus, setCriterion5DocStatus] = useState("");
  const [flowchartDocs, setFlowchartDocs] = useState([]);
  const [selectedFlowchartDocId, setSelectedFlowchartDocId] = useState(null);
  const [flowchartPreviewUrl, setFlowchartPreviewUrl] = useState("");
  const [data, setData] = useState({
    academic_calender_type: "Semester",
    plan_of_study_description: "",
    curricular_paths: "General Track",
    curriculum_alignment_description: "",
    prerequisites_support_description: "",
    prerequisite_flowchart_description: "",
    hours_depth_by_subject_area_description: "",
    broad_education_component_description: "",
    culminating_design_experience: "",
    cooperative_education_description: "",
    materials_available_description: "",
    table_5_1_rows: [newTableRow()],
    design_project_rows: [newProjectRow()],
  });

  const refreshFlowchartDocs = async () => {
    try {
      const docs = await listCriterion5SectionDocs(cycleId, C5_FLOWCHART_SECTION);
      setFlowchartDocs(docs);
      setSelectedFlowchartDocId((prev) => {
        if (!docs.length) return null;
        return docs.some((doc) => doc.id === prev) ? prev : docs[0].id;
      });
    } catch (_error) {
      setFlowchartDocs([]);
      setSelectedFlowchartDocId(null);
    }
  };

  const selectedFlowchartDoc =
    flowchartDocs.find((doc) => doc.id === selectedFlowchartDocId) || null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await apiRequest(`/cycles/${cycleId}/criterion5/`);
        setData((prev) => ({
          ...prev,
          ...result,
          academic_calender_type: result?.academic_calender_type || "Semester",
          table_5_1_rows: normalizeTableRows(result?.table_5_1_rows),
          design_project_rows: normalizeProjectRows(
            result?.design_project_rows,
          ),
        }));
      } catch (error) {
        setSaveError(
          `Unable to load Criterion 5: ${error?.message || "Unknown error."}`,
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cycleId]);

  useEffect(() => {
    refreshFlowchartDocs();
  }, [cycleId]);

  useEffect(() => {
    if (!selectedFlowchartDoc?.fileBlob) {
      setFlowchartPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(selectedFlowchartDoc.fileBlob);
    setFlowchartPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFlowchartDoc]);

  const handleField = (field) => (event) => {
    const value = event?.target?.value ?? "";
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const paths = `${data.curricular_paths || ""}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const tableTotals = useMemo(
    () =>
      data.table_5_1_rows.reduce(
        (acc, row) => ({
          math: acc.math + Number(row.math_basic_sciences_credits || 0),
          engineering:
            acc.engineering + Number(row.engineering_topics_credits || 0),
          other: acc.other + Number(row.other_credits || 0),
        }),
        { math: 0, engineering: 0, other: 0 },
      ),
    [data.table_5_1_rows],
  );

  const completion = useMemo(() => calculateCompletion(data), [data]);

  const filledCourseRows = useMemo(
    () => countFilledRows(data.table_5_1_rows, ["local_id", "r_se_category"]),
    [data.table_5_1_rows],
  );

  const filledProjectRows = useMemo(
    () => countFilledRows(data.design_project_rows),
    [data.design_project_rows],
  );

  const totalCredits =
    tableTotals.math + tableTotals.engineering + tableTotals.other;

  const surfaceCardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: "18px",
    padding: "clamp(18px, 2vw, 28px)",
    boxShadow: "0 16px 34px rgba(33, 37, 41, 0.08)",
    border: `1px solid rgba(139, 21, 56, 0.14)`,
  };

  const mutedBlockStyle = {
    marginTop: "16px",
    border: `1px solid rgba(139, 21, 56, 0.16)`,
    borderRadius: "14px",
    padding: "18px",
    background:
      "linear-gradient(135deg, rgba(139, 21, 56, 0.06) 0%, rgba(248, 249, 250, 0.95) 55%)",
  };

  const requirementBlockStyle = {
    display: "grid",
    gap: "6px",
    marginBottom: "8px",
  };

  const requirementBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "4px 9px",
    borderRadius: "999px",
    backgroundColor: "rgba(139, 21, 56, 0.12)",
    color: colors.primary,
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  const requirementTitleStyle = {
    color: colors.darkGray,
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: 1.45,
  };

  const requirementHintStyle = {
    color: colors.mediumGray,
    fontSize: "12px",
    lineHeight: 1.4,
  };

  const openCriterion5UploadModal = async (sectionTitle) => {
    setCriterion5DocStatus("");
    setUploadModal({ open: true, sectionTitle });
    try {
      const docs = await listCriterion5SectionDocs(cycleId, sectionTitle);
      setCriterion5Docs(
        docs.map((row) => ({
          id: row.id,
          name: row.name,
          size: row.size,
          type: row.type,
        })),
      );
    } catch (error) {
      setCriterion5Docs([]);
      setCriterion5DocStatus(error?.message || "Unable to load documents.");
    }
  };

  const closeCriterion5UploadModal = () => {
    setUploadModal({ open: false, sectionTitle: "" });
    setCriterion5Docs([]);
    setCriterion5DocStatus("");
  };

  const handleCriterion5DocFiles = async (files) => {
    if (!uploadModal.sectionTitle) return;
    if (!Array.isArray(files) || files.length === 0) return;
    try {
      await appendCriterion5SectionDocs(cycleId, uploadModal.sectionTitle, files);
      const docs = await listCriterion5SectionDocs(cycleId, uploadModal.sectionTitle);
      setCriterion5Docs(
        docs.map((row) => ({
          id: row.id,
          name: row.name,
          size: row.size,
          type: row.type,
        })),
      );
      setCriterion5DocStatus(
        `${docs.length} file(s) saved for ${uploadModal.sectionTitle}.`,
      );
      if (uploadModal.sectionTitle === C5_FLOWCHART_SECTION) {
        await refreshFlowchartDocs();
      }
    } catch (error) {
      setCriterion5DocStatus(error?.message || "Unable to save documents.");
    }
  };

  const handleCriterion5DocSelection = (event) => {
    const files = Array.from(event.target.files || []);
    handleCriterion5DocFiles(files);
  };

  const handleCriterion5RemoveDoc = async (docId) => {
    try {
      await deleteCriterion5DocById(docId);
      const docs = await listCriterion5SectionDocs(cycleId, uploadModal.sectionTitle);
      setCriterion5Docs(
        docs.map((row) => ({
          id: row.id,
          name: row.name,
          size: row.size,
          type: row.type,
        })),
      );
      setCriterion5DocStatus("Document removed.");
      if (uploadModal.sectionTitle === C5_FLOWCHART_SECTION) {
        await refreshFlowchartDocs();
      }
    } catch (error) {
      setCriterion5DocStatus(error?.message || "Unable to remove document.");
    }
  };

  const handleCriterion5DownloadDoc = async (docId) => {
    try {
      const doc = await getCriterion5DocById(docId);
      if (!doc?.fileBlob) {
        setCriterion5DocStatus("Selected file is not available.");
        return;
      }
      const objectUrl = URL.createObjectURL(doc.fileBlob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = doc.name || "document";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      setCriterion5DocStatus(error?.message || "Unable to download document.");
    }
  };

  const save = async (markComplete = false) => {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const payload = {
        ...data,
        table_5_1_rows: data.table_5_1_rows
          .filter((row) =>
            Object.values(row).some((value) => `${value ?? ""}`.trim() !== ""),
          )
          .map((row) => ({
            recommended_schedule: `${row.recommended_schedule ?? ""}`.trim(),
            course_label: `${row.course_label ?? ""}`.trim(),
            r_se_category: `${row.r_se_category ?? ""}`.trim() || "R",
            math_basic_sciences_credits: Number(
              row.math_basic_sciences_credits || 0,
            ),
            engineering_topics_credits: Number(
              row.engineering_topics_credits || 0,
            ),
            other_credits: Number(row.other_credits || 0),
            last_two_terms_offered:
              `${row.last_two_terms_offered ?? ""}`.trim(),
            max_section_enrollment: Number(row.max_section_enrollment || 0),
          })),
        design_project_rows: data.design_project_rows
          .filter((row) =>
            Object.values(row).some((value) => `${value ?? ""}`.trim() !== ""),
          )
          .map((row) => ({
            project_title: `${row.project_title ?? ""}`.trim(),
            team_identifier: `${row.team_identifier ?? ""}`.trim(),
            year: Number(row.year || 0),
          })),
      };

      const result = await apiRequest(`/cycles/${cycleId}/criterion5/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const normalizedData = {
        ...data,
        ...result,
        table_5_1_rows: normalizeTableRows(result?.table_5_1_rows),
        design_project_rows: normalizeProjectRows(result?.design_project_rows),
      };
      setData(normalizedData);

      const completionPercentage = markComplete
        ? 100
        : calculateCompletion(payload);
      const checklistResult = await apiRequest(
        `/cycles/${cycleId}/checklist/`,
        { method: "GET" },
      );
      const item = checklistResult?.items?.find(
        (row) => Number(row?.criterion_number) === 5,
      );
      const checklistItemId = result?.checklist_item_id ?? item?.item_id;
      if (checklistItemId) {
        const checklistItem = await apiRequest(
          `/checklist-items/${checklistItemId}/`,
          { method: "GET" },
        );
        await apiRequest(`/checklist-items/${checklistItemId}/`, {
          method: "PUT",
          body: JSON.stringify({
            ...checklistItem,
            status: completionPercentage >= 100 ? 1 : 0,
            completion_percentage: completionPercentage,
          }),
        });
      }

      setSaveSuccess(true);
      localStorage.setItem("checklistNeedsRefresh", "true");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(`Save failed: ${error?.message || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: colors.mediumGray,
        }}
      >
        Loading Criterion 5 data...
      </div>
    );
  }

  return (
    <div
      className="criterion5-page"
      style={{
        minHeight: "100vh",
        fontFamily: fontStack,
      }}
    >
      <GlobalHeader
        title="Criterion 5 - Curriculum"
        subtitle={subtitle}
        showBackButton={true}
        onToggleSidebar={onToggleSidebar}
        onBack={onBack}
      />
      <div
        className="criterion5-main"
        style={{
          padding: "clamp(20px, 4vw, 48px)",
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        <div
          className="criterion5-hero-card criterion5-reveal"
          style={{
            ...surfaceCardStyle,
            marginBottom: "20px",
            background:
              "linear-gradient(130deg, rgba(139, 21, 56, 0.11) 0%, rgba(255, 255, 255, 0.98) 50%)",
            border: `1px solid rgba(139, 21, 56, 0.22)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: colors.darkGray,
                  fontSize: "clamp(22px, 2.4vw, 30px)",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                }}
              >
                Program Curriculum and Evidence
              </div>
              <p
                style={{
                  color: colors.mediumGray,
                  margin: "8px 0 0 0",
                  fontSize: "15px",
                  maxWidth: "760px",
                  lineHeight: 1.45,
                }}
              >
                Complete Table 5-1, document alignment with PEOs and SOs, and
                attach curriculum evidence.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  border: `1px solid rgba(139, 21, 56, 0.18)`,
                  color: colors.darkGray,
                  fontWeight: "700",
                  fontSize: "13px",
                  boxShadow: "0 8px 18px rgba(139, 21, 56, 0.08)",
                }}
              >
                Program:{" "}
                <span style={{ color: colors.primary }}>{programName}</span> -
                Cycle:{" "}
                <span style={{ color: colors.primary }}>{cycleLabel}</span>
              </div>
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="criterion5-action-button"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139, 21, 56, 1) 0%, rgba(107, 15, 42, 1) 100%)",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: "0 12px 24px rgba(107, 15, 42, 0.28)",
                }}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="criterion5-action-button"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(40, 167, 69, 1) 0%, rgba(34, 139, 58, 1) 100%)",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: "0 12px 24px rgba(34, 139, 58, 0.22)",
                }}
              >
                <Check size={16} />
                Mark Complete
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "10px",
            }}
          >
            <div
              className="criterion5-stat-card"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                border: `1px solid rgba(139, 21, 56, 0.16)`,
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: colors.mediumGray,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Completion
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: colors.primary,
                }}
              >
                {completion}%
              </div>
            </div>
            <div
              className="criterion5-stat-card"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                border: `1px solid rgba(139, 21, 56, 0.16)`,
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: colors.mediumGray,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Course Rows
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: colors.primary,
                }}
              >
                {filledCourseRows}
              </div>
            </div>
            <div
              className="criterion5-stat-card"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                border: `1px solid rgba(139, 21, 56, 0.16)`,
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: colors.mediumGray,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Total Credits
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: colors.primary,
                }}
              >
                {totalCredits}
              </div>
            </div>
            <div
              className="criterion5-stat-card"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                border: `1px solid rgba(139, 21, 56, 0.16)`,
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: colors.mediumGray,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Design Projects
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: colors.primary,
                }}
              >
                {filledProjectRows}
              </div>
            </div>
          </div>
          <div style={{ marginTop: "14px" }}>
            <div
              className="criterion5-progress-track"
              style={{
                width: "100%",
                height: "10px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.75)",
                border: `1px solid rgba(139, 21, 56, 0.18)`,
                overflow: "hidden",
              }}
            >
              <div
                className="criterion5-progress-fill"
                style={{
                  height: "100%",
                  width: `${completion}%`,
                  background:
                    "linear-gradient(90deg, rgba(139, 21, 56, 1) 0%, rgba(107, 15, 42, 0.86) 100%)",
                  borderRadius: "999px",
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
          {saveSuccess ? (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 16px",
                backgroundColor: "#d4edda",
                border: "1px solid #9fd6aa",
                borderRadius: "10px",
                color: "#155724",
                fontSize: "14px",
              }}
            >
              Saved successfully!
            </div>
          ) : null}
          {saveError ? (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 16px",
                backgroundColor: "#fce2e4",
                border: "1px solid #efb7be",
                borderRadius: "10px",
                color: "#721c24",
                fontSize: "14px",
              }}
            >
              {saveError}
            </div>
          ) : null}
        </div>

        <div
          className="criterion5-surface criterion5-reveal"
          style={{
            ...surfaceCardStyle,
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: colors.darkGray,
                  fontSize: "22px",
                  fontWeight: "800",
                  letterSpacing: "-0.015em",
                }}
              >
                A. Program Curriculum
              </h3>
              <p
                style={{
                  color: colors.mediumGray,
                  margin: "8px 0 0 0",
                  fontSize: "14px",
                  lineHeight: 1.45,
                }}
              >
                Provide the plan of study, assessment of curriculum alignment,
                prerequisite flowchart, and curriculum evidence.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => openCriterion5UploadModal(C5_FLOWCHART_SECTION)}
                className="criterion5-action-button"
                style={{
                  backgroundColor: "white",
                  color: colors.primary,
                  border: `1px dashed rgba(139, 21, 56, 0.8)`,
                  padding: "9px 13px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Upload size={16} />
                Upload Plan of Study / Flowchart
              </button>
              <button
                type="button"
                className="criterion5-action-button"
                style={{
                  backgroundColor: "rgba(139, 21, 56, 0.08)",
                  color: colors.primary,
                  border: "none",
                  padding: "9px 13px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={16} />
                AI Extract curriculum data
              </button>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            <div style={requirementBlockStyle}>
              <span style={requirementBadgeStyle}>Requirement 1</span>
              <div style={requirementTitleStyle}>
                Complete Table 5-1 and describe plan of study details by year/term.
              </div>
              <div style={requirementHintStyle}>
                Includes calendar type (semester/quarter), curricular paths/options,
                and maximum section enrollments for the last two terms offered.
              </div>
            </div>
            <textarea
              value={data.plan_of_study_description}
              onChange={handleField("plan_of_study_description")}
              placeholder="A1. Plan of study narrative: recommended schedule by year/term and section enrollment context."
              style={{
                width: "100%",
                minHeight: "90px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            />
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.darkGray,
                }}
              >
                <input
                  type="radio"
                  checked={data.academic_calender_type === "Semester"}
                  onChange={() =>
                    setData((prev) => ({
                      ...prev,
                      academic_calender_type: "Semester",
                    }))
                  }
                />
                Semester
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.darkGray,
                }}
              >
                <input
                  type="radio"
                  checked={data.academic_calender_type === "Quarter"}
                  onChange={() =>
                    setData((prev) => ({
                      ...prev,
                      academic_calender_type: "Quarter",
                    }))
                  }
                />
                Quarter
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {paths.map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      curricular_paths: paths
                        .filter((item) => item !== path)
                        .join(", "),
                    }))
                  }
                  style={{
                    backgroundColor: "white",
                    color: colors.primary,
                    border: `1px solid ${colors.primary}`,
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "12px",
                  }}
                >
                  {path} x
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                value={newPath}
                onChange={(event) => setNewPath(event.target.value)}
                placeholder="Add path (e.g., AI Track)"
                style={{
                  flex: 1,
                  minWidth: "220px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`,
                  fontSize: "12px",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newPath.trim();
                  if (!trimmed) return;
                  const next = [...paths, trimmed];
                  setData((prev) => ({
                    ...prev,
                    curricular_paths: next.join(", "),
                  }));
                  setNewPath("");
                }}
                className="criterion5-action-button"
                style={{
                  backgroundColor: "white",
                  color: colors.primary,
                  border: `1px dashed rgba(139, 21, 56, 0.76)`,
                  padding: "7px 11px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={12} />
                Add Path
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: "12px",
              overflowX: "auto",
              border: `1px solid rgba(139, 21, 56, 0.18)`,
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.94)",
            }}
          >
            <div
              style={{
                ...requirementBlockStyle,
                padding: "10px 12px 0 12px",
              }}
            >
              <span style={requirementBadgeStyle}>Requirement 1 - Table 5-1</span>
              <div style={requirementHintStyle}>
                Recommended schedule by term, course offerings, credits, and
                maximum section enrollment for recent terms.
              </div>
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "rgba(139, 21, 56, 0.06)",
                    color: colors.darkGray,
                  }}
                >
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Recommended Schedule
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Course
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    R/E/SE
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Math
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Eng
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Other
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Last Two Terms
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Max Enroll
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.table_5_1_rows.map((row) => (
                  <tr
                    key={row.local_id}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    <td style={{ padding: "8px" }}>
                      <input
                        value={row.recommended_schedule}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? {
                                    ...item,
                                    recommended_schedule: e.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "140px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        value={row.course_label}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? { ...item, course_label: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "180px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <select
                        value={row.r_se_category}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? { ...item, r_se_category: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "70px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <option value="R">R</option>
                        <option value="E">E</option>
                        <option value="SE">SE</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.math_basic_sciences_credits}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? {
                                    ...item,
                                    math_basic_sciences_credits: e.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "60px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.engineering_topics_credits}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? {
                                    ...item,
                                    engineering_topics_credits: e.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "60px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.other_credits}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? { ...item, other_credits: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "60px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        value={row.last_two_terms_offered}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? {
                                    ...item,
                                    last_two_terms_offered: e.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "180px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.max_section_enrollment}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows: prev.table_5_1_rows.map((item) =>
                              item.local_id === row.local_id
                                ? {
                                    ...item,
                                    max_section_enrollment: e.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        style={{
                          width: "80px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            table_5_1_rows:
                              prev.table_5_1_rows.length > 1
                                ? prev.table_5_1_rows.filter(
                                    (item) => item.local_id !== row.local_id,
                                  )
                                : prev.table_5_1_rows,
                          }))
                        }
                        className="criterion5-action-button"
                        style={{
                          border: `1px solid ${colors.border}`,
                          borderRadius: "8px",
                          backgroundColor: "white",
                          color: colors.primary,
                          padding: "6px 8px",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "rgba(139, 21, 56, 0.06)" }}>
                  <td style={{ padding: "10px", fontWeight: "700" }}>Totals</td>
                  <td></td>
                  <td></td>
                  <td style={{ textAlign: "center", fontWeight: "700" }}>
                    {tableTotals.math}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "700" }}>
                    {tableTotals.engineering}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "700" }}>
                    {tableTotals.other}
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  table_5_1_rows: [...prev.table_5_1_rows, newTableRow()],
                }))
              }
              className="criterion5-action-button"
              style={{
                backgroundColor: "white",
                color: colors.primary,
                border: `1px dashed rgba(139, 21, 56, 0.8)`,
                padding: "9px 13px",
                borderRadius: "8px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={14} />
              Add Course Row
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={requirementBadgeStyle}>Requirement 2</span>
              <div style={requirementHintStyle}>
                Describe how the curriculum aligns with the program educational
                objectives.
              </div>
              <textarea
                value={data.curriculum_alignment_description}
                onChange={handleField("curriculum_alignment_description")}
                placeholder="A2. Curriculum alignment with PEOs"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={requirementBadgeStyle}>Requirement 3</span>
              <div style={requirementHintStyle}>
                Describe how the curriculum and prerequisite structure support
                attainment of student outcomes.
              </div>
              <textarea
                value={data.prerequisites_support_description}
                onChange={handleField("prerequisites_support_description")}
                placeholder="A3. Curriculum and prerequisite structure support of SOs"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={requirementBadgeStyle}>Requirement 5</span>
              <div style={requirementHintStyle}>
                Explain hours and depth of study by subject area (Math/Basic
                Sciences and Engineering Topics).
              </div>
              <textarea
                value={data.hours_depth_by_subject_area_description}
                onChange={handleField("hours_depth_by_subject_area_description")}
                placeholder="A5. Hours and depth by subject area"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={requirementBadgeStyle}>Requirement 6</span>
              <div style={requirementHintStyle}>
                Describe the broad education component and how it complements
                technical curriculum content.
              </div>
              <textarea
                value={data.broad_education_component_description}
                onChange={handleField("broad_education_component_description")}
                placeholder="A6. Broad education component and complement to technical content"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div
            className="criterion5-subsurface"
            style={{
              ...mutedBlockStyle,
            }}
          >
            <div style={requirementBlockStyle}>
              <span style={requirementBadgeStyle}>Requirement 4</span>
              <div style={requirementHintStyle}>
                Attach or describe the flowchart/worksheet that shows the
                prerequisite structure for required courses.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <FileText size={18} color={colors.primary} />
              <div style={{ fontWeight: "800", color: colors.darkGray }}>
                A4. Prerequisite Flowchart / Worksheet
              </div>
            </div>
            <textarea
              value={data.prerequisite_flowchart_description}
              onChange={handleField("prerequisite_flowchart_description")}
              placeholder="Describe prerequisite flowchart/worksheet and where it is available."
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            />
            <div
              style={{
                marginTop: "16px",
                border: `1px solid rgba(139, 21, 56, 0.22)`,
                borderRadius: "14px",
                background:
                  "linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 249, 250, 0.95) 100%)",
                padding: "14px",
                boxShadow: "0 14px 28px rgba(33, 37, 41, 0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: "2px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: colors.darkGray,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Flowchart Preview
                  </div>
                  <div style={{ fontSize: "13px", color: colors.mediumGray }}>
                    Preview uploaded prerequisite flowchart files directly here.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => openCriterion5UploadModal(C5_FLOWCHART_SECTION)}
                    className="criterion5-action-button"
                    style={{
                      backgroundColor: "white",
                      color: colors.primary,
                      border: `1px dashed rgba(139, 21, 56, 0.8)`,
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontWeight: "700",
                      fontSize: "13px",
                    }}
                  >
                    Upload / Manage Files
                  </button>
                  {selectedFlowchartDoc ? (
                    <button
                      type="button"
                      onClick={() => handleCriterion5DownloadDoc(selectedFlowchartDoc.id)}
                      className="criterion5-action-button"
                      style={{
                        backgroundColor: "white",
                        color: colors.primary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontWeight: "700",
                        fontSize: "13px",
                      }}
                    >
                      Download Current
                    </button>
                  ) : null}
                </div>
              </div>

              {flowchartDocs.length === 0 ? (
                <div
                  style={{
                    marginTop: "10px",
                    borderRadius: "10px",
                    border: `1px dashed ${colors.border}`,
                    padding: "22px",
                    color: colors.mediumGray,
                    fontSize: "14px",
                    textAlign: "center",
                  }}
                >
                  No flowchart file uploaded yet.
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "10px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      border: `1px solid rgba(139, 21, 56, 0.16)`,
                      borderRadius: "12px",
                      padding: "10px",
                      display: "grid",
                      gap: "10px",
                      alignContent: "start",
                      maxHeight: "520px",
                      overflowY: "auto",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,248,250,1) 100%)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: colors.mediumGray,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 2px 0 2px",
                      }}
                    >
                      Uploaded Files
                    </div>
                    {flowchartDocs.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedFlowchartDocId(doc.id)}
                        className="criterion5-action-button"
                        style={{
                          textAlign: "left",
                          border:
                            selectedFlowchartDocId === doc.id
                              ? `1px solid ${colors.primary}`
                              : `1px solid ${colors.border}`,
                          borderRadius: "8px",
                          backgroundColor:
                            selectedFlowchartDocId === doc.id
                              ? "rgba(139, 21, 56, 0.12)"
                              : "white",
                          padding: "10px 12px",
                          color: colors.darkGray,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "800",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {doc.name}
                        </div>
                        <div style={{ fontSize: "12px", color: colors.mediumGray }}>
                          {doc.type || "Unknown"} -{" "}
                          {Math.max(1, Math.round(Number(doc.size || 0) / 1024))} KB
                        </div>
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      border: `1px solid rgba(139, 21, 56, 0.16)`,
                      borderRadius: "12px",
                      backgroundColor: "white",
                      minHeight: "520px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "44px",
                        padding: "0 12px",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: `1px solid ${colors.border}`,
                        backgroundColor: "rgba(248, 249, 250, 0.9)",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: colors.darkGray,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedFlowchartDoc
                        ? selectedFlowchartDoc.name
                        : "Select a file to preview"}
                    </div>
                    {selectedFlowchartDoc && flowchartPreviewUrl ? (
                      isImageFile(selectedFlowchartDoc) ? (
                        <div
                          style={{
                            height: "476px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f7f8fa",
                          }}
                        >
                          <img
                            src={flowchartPreviewUrl}
                            alt={selectedFlowchartDoc.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      ) : isPdfFile(selectedFlowchartDoc) ? (
                        <iframe
                          title={`Flowchart preview ${selectedFlowchartDoc.name}`}
                          src={flowchartPreviewUrl}
                          style={{
                            width: "100%",
                            height: "476px",
                            border: "none",
                            backgroundColor: "white",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: "476px",
                            display: "grid",
                            placeItems: "center",
                            padding: "18px",
                            textAlign: "center",
                            color: colors.mediumGray,
                            fontSize: "14px",
                          }}
                        >
                          Preview is not supported for this file type. Use
                          "Download Current" to open it.
                        </div>
                      )
                    ) : (
                      <div
                        style={{
                          height: "476px",
                          display: "grid",
                          placeItems: "center",
                          color: colors.mediumGray,
                          fontSize: "14px",
                        }}
                      >
                        Select a file to preview.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="criterion5-subsurface"
            style={{
              ...mutedBlockStyle,
            }}
          >
            <div style={requirementBlockStyle}>
              <span style={requirementBadgeStyle}>Requirement 7</span>
              <div style={requirementHintStyle}>
                Describe the culminating design experience and list project
                titles/team identifiers for the most recent graduating class.
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <ClipboardList size={18} color={colors.primary} />
              <div style={{ fontWeight: "800", color: colors.darkGray }}>
                A7. Culminating Major Design Experience
              </div>
            </div>
            <textarea
              value={data.culminating_design_experience}
              onChange={handleField("culminating_design_experience")}
              placeholder="Describe the culminating design experience, standards used, and constraints."
              style={{
                width: "100%",
                minHeight: "110px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            />
            <div style={{ marginTop: "10px", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.84)" }}>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Project Title
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Team / Identifier
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Year
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.design_project_rows.map((row) => (
                    <tr
                      key={row.local_id}
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                    >
                      <td style={{ padding: "8px" }}>
                        <input
                          value={row.project_title}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              design_project_rows: prev.design_project_rows.map(
                                (item) =>
                                  item.local_id === row.local_id
                                    ? { ...item, project_title: e.target.value }
                                    : item,
                              ),
                            }))
                          }
                          style={{
                            width: "220px",
                            padding: "6px",
                            borderRadius: "6px",
                            border: `1px solid ${colors.border}`,
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          value={row.team_identifier}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              design_project_rows: prev.design_project_rows.map(
                                (item) =>
                                  item.local_id === row.local_id
                                    ? {
                                        ...item,
                                        team_identifier: e.target.value,
                                      }
                                    : item,
                              ),
                            }))
                          }
                          style={{
                            width: "150px",
                            padding: "6px",
                            borderRadius: "6px",
                            border: `1px solid ${colors.border}`,
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="number"
                          min="2000"
                          value={row.year}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              design_project_rows: prev.design_project_rows.map(
                                (item) =>
                                  item.local_id === row.local_id
                                    ? { ...item, year: e.target.value }
                                    : item,
                              ),
                            }))
                          }
                          style={{
                            width: "90px",
                            padding: "6px",
                            borderRadius: "6px",
                            border: `1px solid ${colors.border}`,
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <button
                          type="button"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              design_project_rows:
                                prev.design_project_rows.length > 1
                                  ? prev.design_project_rows.filter(
                                      (item) => item.local_id !== row.local_id,
                                    )
                                  : prev.design_project_rows,
                            }))
                          }
                          className="criterion5-action-button"
                          style={{
                            border: `1px solid ${colors.border}`,
                            borderRadius: "8px",
                            backgroundColor: "white",
                            color: colors.primary,
                            padding: "6px 8px",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  design_project_rows: [
                    ...prev.design_project_rows,
                    newProjectRow(),
                  ],
                }))
              }
              className="criterion5-action-button"
              style={{
                marginTop: "10px",
                backgroundColor: "white",
                color: colors.primary,
                border: `1px dashed rgba(139, 21, 56, 0.8)`,
                padding: "9px 13px",
                borderRadius: "8px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={14} />
              Add Project Title
            </button>
          </div>

          <div
            style={{
              marginTop: "12px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={requirementBadgeStyle}>Requirement 8</span>
              <div style={requirementHintStyle}>
                If cooperative education is used for curricular requirements,
                describe the academic component and faculty evaluation process.
              </div>
              <textarea
                value={data.cooperative_education_description}
                onChange={handleField("cooperative_education_description")}
                placeholder="A8. Cooperative education: academic component and evaluation by faculty (if applicable)"
                style={{
                  width: "100%",
                  minHeight: "110px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={requirementBadgeStyle}>Requirement 9</span>
              <div style={requirementHintStyle}>
                Describe materials available before/during the visit to
                demonstrate achievement for Criterion 5.
              </div>
              <textarea
                value={data.materials_available_description}
                onChange={handleField("materials_available_description")}
                placeholder="A9. Materials available for review during/prior to visit"
                style={{
                  width: "100%",
                  minHeight: "110px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        </div>

        {uploadModal.open ? (
          <div
            onClick={closeCriterion5UploadModal}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(20, 25, 35, 0.52)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1700,
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "760px",
                borderRadius: "14px",
                backgroundColor: "white",
                boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
                  color: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "17px", fontWeight: "800" }}>
                    Document Upload
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.9,
                      marginTop: "2px",
                    }}
                  >
                    {uploadModal.sectionTitle}
                  </div>
                </div>
                <button
                  onClick={closeCriterion5UploadModal}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: "700",
                  }}
                  aria-label="Close"
                >
                  x
                </button>
              </div>

              <div style={{ padding: "16px 20px", display: "grid", gap: "12px" }}>
                <input
                  type="file"
                  multiple
                  onChange={handleCriterion5DocSelection}
                  style={{
                    padding: "10px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                  }}
                />
                <EvidenceLibraryImport
                  cycleId={cycleId}
                  programId={programId}
                  onImportFiles={handleCriterion5DocFiles}
                />

                <div
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {criterion5Docs.length === 0 ? (
                    <div style={{ color: colors.mediumGray, fontSize: "13px" }}>
                      No documents uploaded yet.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "8px" }}>
                      {criterion5Docs.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                color: colors.darkGray,
                                fontWeight: "700",
                                fontSize: "13px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {file.name}
                            </div>
                            <div
                              style={{
                                color: colors.mediumGray,
                                fontSize: "12px",
                              }}
                            >
                              {file.type || "Unknown"} -{" "}
                              {Math.max(
                                1,
                                Math.round(Number(file.size || 0) / 1024),
                              )}{" "}
                              KB
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => handleCriterion5DownloadDoc(file.id)}
                              style={{
                                border: `1px solid ${colors.border}`,
                                backgroundColor: "white",
                                color: colors.primary,
                                borderRadius: "6px",
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontWeight: "700",
                                fontSize: "12px",
                              }}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCriterion5RemoveDoc(file.id)}
                              style={{
                                border: `1px solid ${colors.border}`,
                                backgroundColor: "white",
                                color: colors.mediumGray,
                                borderRadius: "6px",
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontWeight: "700",
                                fontSize: "12px",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {criterion5DocStatus ? (
                  <div
                    style={{
                      color: colors.mediumGray,
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    {criterion5DocStatus}
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closeCriterion5UploadModal}
                    style={{
                      backgroundColor: "white",
                      border: `1px solid ${colors.border}`,
                      color: colors.mediumGray,
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Criterion5PageImpl;
