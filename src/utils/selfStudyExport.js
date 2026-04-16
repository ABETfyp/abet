import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const EMPTY_TEXT = 'Not provided.';
const FONT_FAMILY = 'Arial';
const BODY_SIZE = 24;
const SUBTITLE_SIZE = 28;
const BODY_INDENT = 360;
const SUBSECTION_INDENT = 360;
const NESTED_INDENT = 720;
const C5_DOCS_DB_NAME = 'abet-criterion5-documents';
const C5_DOCS_STORE = 'documents';
const C5_FLOWCHART_SECTION = 'A. Program Curriculum - Plan of Study / Flowchart';

const sanitizeText = (value) => `${value ?? ''}`
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
  .replace(/\uFFFD/g, ' ')
  .replace(/\s+\n/g, '\n')
  .replace(/\n\s+/g, '\n')
  .trim();

const asText = (value) => sanitizeText(value);

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return asText(value) !== '';
};

const prettifyLabel = (value) => {
  const raw = `${value || ''}`
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bso\b/gi, 'SO')
    .replace(/\bpeo\b/gi, 'PEO')
    .replace(/\bclo\b/gi, 'CLO')
    .replace(/\bfte\b/gi, 'FTE')
    .replace(/\bft\b/g, 'FT')
    .replace(/\bpt\b/g, 'PT')
    .replace(/\bid\b/gi, 'ID')
    .replace(/discription/gi, 'description')
    .replace(/ececutive/gi, 'executive')
    .replace(/institutiton/gi, 'institution')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const slugify = (value, fallback) => {
  const cleaned = `${value || ''}`
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned || fallback;
};

const formatReportDate = (value) => {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return asText(value) || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const paragraph = (text, options = {}) => {
  const { children, ...rest } = options;
  return new Paragraph({
    indent: options.indent || { left: BODY_INDENT },
    ...rest,
    children: children || [
      new TextRun({
        text: hasValue(text) ? asText(text) : EMPTY_TEXT,
        font: FONT_FAMILY,
        size: BODY_SIZE,
      }),
    ],
  });
};

const sectionTitle = (text) => new Paragraph({
  text: asText(text),
  heading: HeadingLevel.HEADING_1,
  spacing: { after: 200 },
});

const subTitle = (text) => new Paragraph({
  indent: { left: SUBSECTION_INDENT },
  children: [
    new TextRun({
      text: asText(text),
      bold: true,
      font: FONT_FAMILY,
      size: SUBTITLE_SIZE,
    }),
  ],
  spacing: { before: 200, after: 120 },
});

const minorTitle = (text) => new Paragraph({
  indent: { left: NESTED_INDENT },
  children: [
    new TextRun({
      text: asText(text),
      bold: true,
      font: FONT_FAMILY,
      size: SUBTITLE_SIZE,
    }),
  ],
  spacing: { before: 160, after: 100 },
});

const coverParagraph = (text, size, spacing = {}, bold = true) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing,
  children: [
    new TextRun({
      text: asText(text),
      bold,
      font: FONT_FAMILY,
      size,
    }),
  ],
});

const secondPageHeadingBlock = () => ([
  new Paragraph({ text: '', spacing: { after: 220 } }),
  coverParagraph('Program Self-Study Report', 24, { after: 60 }),
  coverParagraph('for', 24, { after: 60 }),
  coverParagraph('EAC of ABET', 24, { after: 60 }),
  coverParagraph('Accreditation or Reaccreditation', 24, { after: 260 }),
]);

const TOC_SUBSECTIONS = {
  background: [
    'A. Contact Information',
    'B. Program History',
  ],
  criterion1: [
    'A. Student Admissions',
    'B. Evaluating Student Performance',
    'C. Transfer Students and Transfer Courses',
    'D. Advising and Career Guidance',
    'E. Work in Lieu of Courses',
    'F. Graduation Requirements',
    'G. Transcripts of Recent Graduates',
  ],
  criterion2: [
    'A. Mission Statement',
    'B. Program Educational Objectives (PEOs)',
    'C. Consistency of PEOs with Institutional Mission',
    'D. Program Constituencies',
    'E. Process for Review of PEOs',
  ],
  criterion3: [
    'A. Student Outcomes',
    'B. Relationship of Student Outcomes to Program Educational Objectives',
  ],
  criterion4: [
    '4A. Assessment',
    '4B. Continuous Improvement',
  ],
  criterion5: [
    'A. Program Curriculum',
    'B. Course Syllabi',
  ],
  criterion6: [
    'A. Faculty Qualifications',
    'B. Faculty Workload',
    'C. Faculty Size',
    'D. Professional Development',
    'E. Authority and Responsibility of Faculty',
  ],
  criterion7: [
    'A. Offices, Classrooms and Laboratories',
    'B. Computing Resources',
    'C. Guidance',
    'D. Maintenance and Upgrading of Facilities',
    'E. Library Services',
    'F. Overall Comments on Facilities',
  ],
  criterion8: [
    'A. Leadership',
    'B. Program Budget and Financial Support',
    'C. Staffing',
    'D. Faculty Hiring and Retention',
    'E. Support of Faculty Professional Development',
  ],
};

const renderTableOfContents = (toc) => {
  const children = [sectionTitle('Table of Contents')];
  if (!Array.isArray(toc) || toc.length === 0) {
    children.push(paragraph('No sections are available.'));
    return children;
  }

  toc.forEach((entry, index) => {
    children.push(new Paragraph({
      indent: { left: BODY_INDENT },
      children: [
        new TextRun({
          text: `${index + 1}. ${asText(entry?.title) || 'Untitled Section'}`,
          font: FONT_FAMILY,
          size: BODY_SIZE,
        }),
      ],
      spacing: { after: 100 },
    }));
    const subsections = TOC_SUBSECTIONS[entry?.id] || [];
    subsections.forEach((subsection) => {
      children.push(new Paragraph({
        indent: { left: NESTED_INDENT },
        children: [
          new TextRun({
            text: asText(subsection),
            font: FONT_FAMILY,
            size: BODY_SIZE,
          }),
        ],
        spacing: { after: 70 },
      }));
    });
  });

  return children;
};

const keyValueParagraph = (label, value) => new Paragraph({
  indent: { left: BODY_INDENT },
  children: [
    new TextRun({ text: sanitizeText(label), bold: true, font: FONT_FAMILY, size: BODY_SIZE }),
    new TextRun({ text: hasValue(value) ? sanitizeText(`: ${value}`) : `: ${EMPTY_TEXT}`, font: FONT_FAMILY, size: BODY_SIZE }),
  ],
  spacing: { after: 100 },
});

const bulletParagraphs = (items) => {
  const rows = (Array.isArray(items) ? items : []).filter((item) => hasValue(item));
  if (rows.length === 0) {
    return [paragraph(EMPTY_TEXT)];
  }
  return rows.map((item) => new Paragraph({
    indent: { left: NESTED_INDENT, hanging: 180 },
    children: [
      new TextRun({
        text: sanitizeText(item),
        font: FONT_FAMILY,
        size: BODY_SIZE,
      }),
    ],
    bullet: { level: 0 },
    spacing: { after: 80 },
  }));
};

const extractNamedAttachment = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return sanitizeText(
      value.file_name
      || value.name
      || value.filename
      || value.originalName
      || value.original_name
      || ''
    );
  }
  if (typeof value !== 'string') return '';

  const raw = value.trim();
  if (!raw.startsWith('{') || !raw.endsWith('}')) return '';
  try {
    const parsed = JSON.parse(raw);
    return extractNamedAttachment(parsed);
  } catch (_error) {
    return '';
  }
};

const toDisplayValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return sanitizeText(`${value}`);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return sanitizeText(value.map((item) => toDisplayValue(item)).filter(Boolean).join(', '));
  const attachmentName = extractNamedAttachment(value);
  if (attachmentName) return attachmentName;
  if (typeof value === 'object') return sanitizeText(JSON.stringify(value));
  return sanitizeText(`${value}`);
};

const tableCell = (value, bold = false, widthPct = 10) => new TableCell({
  width: { size: widthPct, type: WidthType.PERCENTAGE },
  children: [
    new Paragraph({
      children: [new TextRun({ text: hasValue(value) ? sanitizeText(`${value}`) : '', bold, font: FONT_FAMILY, size: BODY_SIZE })],
    }),
  ],
});

const buildSimpleTable = (headers, rows) => {
  const columnCount = Math.max(headers.length, 1);
  const widthPct = Number((100 / columnCount).toFixed(2));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((header) => tableCell(header, true, widthPct)),
        tableHeader: true,
      }),
      ...rows.map((row) => new TableRow({
        children: row.map((cell) => tableCell(cell, false, widthPct)),
      })),
    ],
  });
};

const appendDivider = (children) => {
  children.push(new Paragraph({
    spacing: { before: 80, after: 80 },
    border: {
      bottom: {
        color: 'D0D5DD',
        space: 1,
        style: 'single',
        size: 4,
      },
    },
  }));
};

const textListParagraph = (title, lines) => {
  const normalized = (Array.isArray(lines) ? lines : []).map((item) => sanitizeText(item)).filter(Boolean);
  return [
    minorTitle(title),
    paragraph(normalized.length ? normalized.join('\n') : 'No entries are available.', {
      indent: { left: NESTED_INDENT },
    }),
  ];
};

const normalizeProfileEntry = (entry) => {
  if (!entry) return '';
  if (typeof entry === 'string') return sanitizeText(entry);
  if (typeof entry !== 'object') return sanitizeText(`${entry}`);
  return Object.entries(entry)
    .filter(([key, value]) => key !== 'id' && !/_id$/i.test(key) && hasValue(value))
    .map(([key, value]) => `${prettifyLabel(key)}: ${sanitizeText(value)}`)
    .join(' | ');
};

const objectTable = (items, preferredOrder = []) => {
  const normalizedItems = Array.isArray(items) ? items.filter((item) => item && typeof item === 'object') : [];
  if (normalizedItems.length === 0) return null;

  const allKeys = new Set();
  normalizedItems.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (/_id$/i.test(key) || key === 'id' || /^criterion\d*$/i.test(key)) return;
      allKeys.add(key);
    });
  });
  const trailingKeys = [...allKeys].filter((key) => !preferredOrder.includes(key));
  const orderedKeys = [...preferredOrder.filter((key) => allKeys.has(key)), ...trailingKeys];
  return buildSimpleTable(
    orderedKeys.map(prettifyLabel),
    normalizedItems.map((item) => orderedKeys.map((key) => toDisplayValue(item?.[key]))),
  );
};

const primitiveFieldParagraphs = (payload, orderedKeys = [], excludedKeys = []) => {
  const excludeSet = new Set(excludedKeys);
  const inferredKeys = Object.keys(payload || {}).filter((key) => {
    if (excludeSet.has(key)) return false;
    const value = payload?.[key];
    return !Array.isArray(value) && (typeof value !== 'object' || value === null);
  });
  const seen = new Set();
  const keys = [...orderedKeys, ...inferredKeys].filter((key) => {
    if (seen.has(key) || excludeSet.has(key)) return false;
    seen.add(key);
    return true;
  });
  return keys
    .filter((key) => !/_id$/i.test(key) && key !== 'item' && key !== 'cycle')
    .map((key) => keyValueParagraph(prettifyLabel(key), toDisplayValue(payload?.[key])));
};

const appendBlock = (children, extra) => {
  if (Array.isArray(extra)) {
    children.push(...extra);
    return;
  }
  children.push(extra);
};

const isRenderableDocxImage = (doc) => {
  const type = `${doc?.type || ''}`.toLowerCase();
  const name = `${doc?.name || ''}`.toLowerCase();
  return (
    ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'].some((candidate) => type.includes(candidate))
    || ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].some((ext) => name.endsWith(ext))
  );
};

const openCriterion5DocsDb = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    reject(new Error('IndexedDB is not available.'));
    return;
  }
  const request = window.indexedDB.open(C5_DOCS_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(C5_DOCS_STORE)) {
      const store = db.createObjectStore(C5_DOCS_STORE, { keyPath: 'id' });
      store.createIndex('by_cycle_section', ['cycleId', 'sectionTitle'], { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Unable to open Criterion 5 document storage.'));
});

const listCriterion5SectionDocs = async (cycleId, sectionTitle) => {
  const db = await openCriterion5DocsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(C5_DOCS_STORE, 'readonly');
    const store = tx.objectStore(C5_DOCS_STORE);
    const index = store.index('by_cycle_section');
    const query = index.getAll(IDBKeyRange.only([String(cycleId), sectionTitle]));
    query.onsuccess = () => resolve(query.result || []);
    query.onerror = () => reject(query.error || new Error('Unable to read Criterion 5 stored documents.'));
  });
};

const loadCriterion5FlowchartDoc = async (cycleId) => {
  try {
    const docs = await listCriterion5SectionDocs(cycleId, C5_FLOWCHART_SECTION);
    return Array.isArray(docs) && docs.length > 0 ? docs[0] : null;
  } catch (_error) {
    return null;
  }
};

const renderCriterion5Flowchart = async (cycleId) => {
  const flowchartDoc = await loadCriterion5FlowchartDoc(cycleId);
  if (!flowchartDoc) {
    return [paragraph('No flowchart file is available.')];
  }

  const children = [
    keyValueParagraph('Flowchart File', flowchartDoc?.name || ''),
  ];

  if (!flowchartDoc?.fileBlob || !isRenderableDocxImage(flowchartDoc)) {
    children.push(paragraph('The uploaded flowchart file is not an embeddable image in the report.'));
    return children;
  }

  const imageBuffer = await flowchartDoc.fileBlob.arrayBuffer();
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [
      new ImageRun({
        data: imageBuffer,
        transformation: {
          width: 520,
          height: 360,
        },
      }),
    ],
  }));
  return children;
};

const buildCriterion3SoPeoTable = (criterion3) => {
  const studentOutcomes = Array.isArray(criterion3?.student_outcomes) ? criterion3.student_outcomes : [];
  const peos = Array.isArray(criterion3?.peos) ? criterion3.peos : [];
  const mappings = new Set(
    (Array.isArray(criterion3?.so_peo_mappings) ? criterion3.so_peo_mappings : [])
      .map((row) => `${row?.so_id}::${row?.peo_id}`),
  );

  if (studentOutcomes.length === 0 || peos.length === 0) return null;

  return buildSimpleTable(
    ['Student Outcomes', ...peos.map((peo) => peo.display_code || peo.peo_code || `PEO ${peo.peo_id}`)],
    studentOutcomes.map((so) => [
      `${so.display_code || so.so_code || `SO ${so.so_id}`}: ${so.so_discription || ''}`.trim(),
      ...peos.map((peo) => (mappings.has(`${so.so_id}::${peo.peo_id}`) ? 'X' : '')),
    ]),
  );
};

const buildCriterion3CourseCoverageTable = (criterion3) => {
  const studentOutcomes = Array.isArray(criterion3?.student_outcomes) ? criterion3.student_outcomes : [];
  const coverageRows = Array.isArray(criterion3?.so_course_links) ? criterion3.so_course_links : [];

  const courseMap = new Map();
  coverageRows.forEach((row) => {
    const linked = Array.isArray(row?.linked_courses) ? row.linked_courses : [];
    linked.forEach((course) => {
      const key = `${course?.course_id || course?.course_code || ''}`;
      if (!key) return;
      if (!courseMap.has(key)) {
        courseMap.set(key, course?.course_code || `Course ${course?.course_id}`);
      }
    });
  });

  const courses = [...courseMap.entries()].map(([courseKey, courseCode]) => ({ courseKey, courseCode }));
  if (studentOutcomes.length === 0 || courses.length === 0) return null;

  const bySoId = new Map(
    coverageRows.map((row) => [
      Number(row?.so_id || 0),
      new Set((Array.isArray(row?.linked_courses) ? row.linked_courses : []).map((course) => `${course?.course_id || course?.course_code || ''}`)),
    ]),
  );

  return buildSimpleTable(
    ['Student Outcomes', ...courses.map((course) => course.courseCode)],
    studentOutcomes.map((so) => {
      const linkedSet = bySoId.get(Number(so?.so_id || 0)) || new Set();
      return [
        `${so.display_code || so.so_code || `SO ${so.so_id}`}: ${so.so_discription || ''}`.trim(),
        ...courses.map((course) => (linkedSet.has(course.courseKey) ? 'X' : '')),
      ];
    }),
  );
};

const renderCriterion3 = (criterion3) => {
  const children = [sectionTitle('Criterion 3 - Student Outcomes')];
  const soPeoTable = buildCriterion3SoPeoTable(criterion3);
  const courseCoverageTable = buildCriterion3CourseCoverageTable(criterion3);

  children.push(subTitle('Table 3-1. Student Outcome to PEO Mapping'));
  if (soPeoTable) {
    children.push(soPeoTable);
  } else {
    children.push(paragraph('No SO-PEO mapping rows are available.'));
  }

  children.push(subTitle('Table 3-2. Student Outcome to Course Coverage'));
  if (courseCoverageTable) {
    children.push(courseCoverageTable);
  } else {
    children.push(paragraph('No course coverage rows are available.'));
  }

  return children;
};

const renderCriterion4 = (criterion4) => {
  const children = [sectionTitle('Criterion 4 - Continuous Improvement')];

  children.push(subTitle('Program-Level Narrative'));
  children.push(paragraph(criterion4?.programNarrative));
  children.push(subTitle('Records and Maintenance'));
  children.push(paragraph(criterion4?.recordsMaintenance));

  const tableSpecs = [
    ['Performance Indicators', criterion4?.pis],
    ['Results Log', criterion4?.results],
    ['Improvement Actions', criterion4?.loops],
    ['Meetings', criterion4?.meetings],
    ['Assessment Instruments', criterion4?.instruments],
  ];

  tableSpecs.forEach(([title, rows]) => {
    const table = objectTable(rows);
    children.push(subTitle(title));
    if (table) {
      children.push(table);
    } else {
      children.push(paragraph('No rows are available.'));
    }
  });

  return children;
};

const renderBackgroundSection = (background) => {
  const children = [sectionTitle('Background Information')];

  children.push(subTitle('A. Contact Information'));
  children.push(keyValueParagraph('Program Contact Name', background?.contactName));
  children.push(keyValueParagraph('Position / Title', background?.positionTitle));
  children.push(keyValueParagraph('Office Location', background?.officeLocation));
  children.push(keyValueParagraph('Phone Number', background?.phoneNumber));
  children.push(keyValueParagraph('Email Address', background?.emailAddress));

  children.push(subTitle('B. Program History'));
  children.push(keyValueParagraph('Year Implemented', background?.yearImplemented));
  children.push(keyValueParagraph('Date of Last General Review', background?.lastReviewDate));
  children.push(keyValueParagraph('Summary of Major Changes Since Last Review', background?.majorChanges));

  return children;
};

const renderCriterion1Section = (criterion1) => {
  const children = [sectionTitle('Criterion 1 - Students')];
  const sectionGroups = [
    {
      title: 'A. Student Admissions',
      fields: ['admission_requirements', 'admission_process_summary', 'transfer_pathways'],
    },
    {
      title: 'B. Evaluating Student Performance',
      fields: ['pperformance_evaluation_process', 'prerequisite_verification_method', 'prerequisite_not_met_action'],
    },
    {
      title: 'C. Transfer Students and Transfer Courses',
      fields: ['transfer_policy_summary', 'transfer_credit_evaluation_process', 'articulation_agreements'],
    },
    {
      title: 'D. Advising and Career Guidance',
      fields: ['advising_providers', 'advising_frequency', 'career_guidance_description'],
    },
    {
      title: 'E. Work in Lieu of Courses',
      fields: ['work_in_lieu_policies', 'work_in_lieu_approval_process'],
    },
    {
      title: 'F. Graduation Requirements',
      fields: ['minimum_required_credits', 'required_gpa_or_standing', 'essential_courses_categories', 'degree_name'],
    },
    {
      title: 'G. Transcripts of Recent Graduates',
      fields: ['transcript_format_explanation', 'program_name_on_transcript'],
    },
  ];

  sectionGroups.forEach(({ title, fields }) => {
    children.push(subTitle(title));
    fields.forEach((field) => {
      children.push(keyValueParagraph(prettifyLabel(field), toDisplayValue(criterion1?.[field])));
    });
  });

  return children;
};

const splitLines = (value) => sanitizeText(value)
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const buildPeoRows = (criterion2) => {
  const peoCodes = splitLines(criterion2?.peos_list);
  const peoDescriptions = splitLines(criterion2?.peos_short_descriptions);
  const rowCount = Math.max(peoCodes.length, peoDescriptions.length);
  return Array.from({ length: rowCount }, (_, index) => [
    peoCodes[index] || '',
    peoDescriptions[index] || '',
  ]).filter(([peo, description]) => hasValue(peo) || hasValue(description));
};

const renderCriterion2Section = (criterion2) => {
  const children = [sectionTitle('Criterion 2 - Program Educational Objectives')];

  children.push(subTitle('A. Mission Statement'));
  children.push(keyValueParagraph('Institutional Mission Statement', criterion2?.institutional_mission_statement));
  children.push(keyValueParagraph('Program Mission Statement', criterion2?.program_mission_statement));
  children.push(keyValueParagraph('Mission Source Link', criterion2?.mission_source_link));

  children.push(subTitle('B. Program Educational Objectives (PEOs)'));
  const peoRows = buildPeoRows(criterion2);
  if (peoRows.length > 0) {
    children.push(buildSimpleTable(['PEO', 'Description'], peoRows));
  } else {
    children.push(paragraph('No PEO rows are available.'));
  }
  children.push(keyValueParagraph('Where PEOs Are Published', criterion2?.peos_publication_location));

  children.push(subTitle('C. Consistency of PEOs with Institutional Mission'));
  children.push(keyValueParagraph('How Program Objectives Align with the Institutional Mission', criterion2?.peos_mission_alignment_explanation));

  children.push(subTitle('D. Program Constituencies'));
  children.push(keyValueParagraph('Constituencies List', criterion2?.constituencies_list));
  children.push(keyValueParagraph('How Constituencies Contribute to PEO Development and Review', criterion2?.constituencies_contribution_description));

  children.push(subTitle('E. Process for Review of PEOs'));
  children.push(keyValueParagraph('Review Frequency', criterion2?.peo_review_frequency));
  children.push(keyValueParagraph('Review Participants', criterion2?.peo_review_participants));
  children.push(keyValueParagraph('Feedback Collection and Decision Process', criterion2?.feedback_collection_and_decision_process));
  children.push(keyValueParagraph('Changes Since Last PEO Review', criterion2?.changes_since_last_peo_review));

  return children;
};

const renderGenericSection = (title, payload, config = {}) => {
  const children = [sectionTitle(title)];
  const orderedFields = config.orderedFields || [];
  const excludedFields = config.excludedFields || [];
  const tableFields = config.tableFields || [];

  appendBlock(children, primitiveFieldParagraphs(payload, orderedFields, excludedFields));

  tableFields.forEach(({ key, title: tableTitle, order }) => {
    children.push(subTitle(tableTitle || prettifyLabel(key)));
    const table = objectTable(payload?.[key], order || []);
    if (table) {
      children.push(table);
    } else {
      children.push(paragraph('No rows are available.'));
    }
  });

  return children;
};

const renderAppendixA = (appendixA) => {
  const children = [sectionTitle('Appendix A - Course Syllabi')];
  const courses = Array.isArray(appendixA?.courses) ? appendixA.courses : [];
  if (courses.length === 0) {
    children.push(paragraph('No course syllabi are available.'));
    return children;
  }

  courses.forEach((course) => {
    const sections = Array.isArray(course?.all_sections) ? course.all_sections : [];
    const syllabus = course?.syllabus_preview;
    const syllabusBlock = syllabus?.syllabus || {};
    const availableClos = Array.isArray(syllabus?.available_clos) ? syllabus.available_clos : [];
    const availableSos = Array.isArray(syllabus?.available_sos) ? syllabus.available_sos : [];
    const assessments = Array.isArray(syllabusBlock?.assessments) ? syllabusBlock.assessments : [];
    const prerequisites = Array.isArray(syllabusBlock?.prerequisites) ? syllabusBlock.prerequisites : [];
    const corequisites = Array.isArray(syllabusBlock?.corequisites) ? syllabusBlock.corequisites : [];
    const textbooks = Array.isArray(syllabusBlock?.textbooks) ? syllabusBlock.textbooks : [];
    const supplements = Array.isArray(syllabusBlock?.supplements) ? syllabusBlock.supplements : [];

    children.push(new Paragraph({
      pageBreakBefore: children.length > 1,
      indent: { left: SUBSECTION_INDENT },
      children: [
        new TextRun({
          text: `${course?.code || course?.course_code || 'Course'}${asText(course?.name) ? ` - ${course.name}` : ''}`,
          bold: true,
          font: FONT_FAMILY,
          size: SUBTITLE_SIZE,
        }),
      ],
      spacing: { before: 200, after: 120 },
    }));
    children.push(paragraph(`${Number(course?.credits || 0)} credits - ${Number(course?.contact_hours || 0)} hours - ${course?.course_type || 'Required'}`, {
      indent: { left: SUBSECTION_INDENT },
    }));
    appendDivider(children);

    if (sections.length > 1) {
      appendBlock(children, textListParagraph(
        'Covered Sections and Instructors',
        sections.map((section) => {
          const term = section?.term || 'Unknown term';
          const facultyName = section?.faculty_name || 'Unassigned instructor';
          return `${term} - ${facultyName}`;
        })
      ));
    } else {
      children.push(keyValueParagraph('Instructor', sections[0]?.faculty_name || ''));
      children.push(keyValueParagraph('Term', sections[0]?.term || ''));
    }

    children.push(minorTitle('Catalog Description'));
    children.push(paragraph(syllabusBlock?.catalog_description || 'No catalog description entered.', { indent: { left: NESTED_INDENT } }));

    appendBlock(children, textListParagraph(
      'CLO List',
      availableClos.map((clo) => `${clo.display_code || clo.clo_code || `CLO-${clo.clo_id}`}: ${clo.description || '-'}`)
    ));
    appendBlock(children, textListParagraph(
      'SO List',
      availableSos.map((so) => `${so.display_code || so.so_code || `SO-${so.so_id}`}: ${so.so_discription || so.description || '-'}`)
    ));

    children.push(minorTitle('Weekly Topics'));
    if (hasValue(syllabusBlock?.weekly_topics)) {
      children.push(paragraph(syllabusBlock.weekly_topics, { indent: { left: NESTED_INDENT } }));
    } else {
      children.push(paragraph('No weekly topics entered.', { indent: { left: NESTED_INDENT } }));
    }

    children.push(keyValueParagraph('Prerequisites', prerequisites.length ? prerequisites.map((item) => sanitizeText(item?.course_code || item)).filter(Boolean).join(', ') : 'None listed.'));
    children.push(keyValueParagraph('Corequisites', corequisites.length ? corequisites.map((item) => sanitizeText(item?.course_code || item)).filter(Boolean).join(', ') : 'None listed.'));
    children.push(keyValueParagraph('Software / Lab Tools', syllabusBlock?.software_or_labs_tools_used || 'No tools listed.'));

    appendBlock(children, textListParagraph(
      'Textbooks',
      textbooks.map((row) => normalizeProfileEntry(row))
    ));
    appendBlock(children, textListParagraph(
      'Supplemental Materials',
      supplements.map((row) => normalizeProfileEntry(row))
    ));
    appendBlock(children, textListParagraph(
      'Assessment Plan',
      assessments.map((row) => {
        if (row && typeof row === 'object') {
          return `${row.assessment_type || '-'} (${Number(row.weight_percentage || 0)}%)`;
        }
        return `${row}`;
      })
    ));
  });

  return children;
};

const renderAppendixB = (appendixB) => {
  const children = [sectionTitle('Appendix B - Faculty Vitae')];
  const facultyRows = Array.isArray(appendixB?.faculty) ? appendixB.faculty : [];
  if (facultyRows.length === 0) {
    children.push(paragraph('No faculty vitae are available.'));
    return children;
  }

  facultyRows.forEach((faculty) => {
    const profile = faculty?.profile || {};
    const qualification = profile?.qualification || {};
    const academicRank = faculty?.academic_rank || faculty?.rank || '-';
    const appointmentType = faculty?.appointment_type || '-';

    children.push(new Paragraph({
      pageBreakBefore: children.length > 1,
      indent: { left: SUBSECTION_INDENT },
      children: [
        new TextRun({
          text: faculty?.full_name || faculty?.name || 'Faculty Member',
          bold: true,
          font: FONT_FAMILY,
          size: SUBTITLE_SIZE,
        }),
      ],
      spacing: { before: 200, after: 120 },
    }));
    children.push(paragraph(`${academicRank} - ${appointmentType}`, { indent: { left: SUBSECTION_INDENT } }));
    children.push(keyValueParagraph('Email', faculty?.email || ''));
    children.push(keyValueParagraph('Office Hours', faculty?.office_hours || ''));

    children.push(minorTitle('Education & Qualification'));
    children.push(paragraph(
      `Field: ${qualification?.degree_field || '-'}\nInstitution: ${qualification?.degree_institution || '-'}\nYear: ${qualification?.degree_year || '-'}\nIndustry Years: ${qualification?.years_industry_government || '-'}\nInstitution Years: ${qualification?.years_at_institution || '-'}`,
      { indent: { left: NESTED_INDENT } }
    ));

    [
      ['Professional Certifications', profile?.certifications],
      ['Professional Memberships', profile?.memberships],
      ['Professional Development', profile?.development_activities],
      ['Consulting / Industry Experience', profile?.industry_experience],
      ['Honors & Awards', profile?.honors],
      ['Service Activities', profile?.services],
      ['Publications', profile?.publications],
    ].forEach(([titleText, items]) => {
      appendBlock(children, textListParagraph(titleText, (Array.isArray(items) ? items : []).map((item) => normalizeProfileEntry(item))));
    });
  });

  return children;
};

const renderCriterion5Section = async (criterion5, metadata = {}) => {
  const children = [sectionTitle('Criterion 5 - Curriculum')];

  appendBlock(children, primitiveFieldParagraphs(criterion5, [], [
    'criterion5_id',
    'checklist_item_id',
    'table_5_1_rows',
    'design_project_rows',
  ]));

  children.push(subTitle('Table 5-1. Curriculum'));
  const curriculumTable = objectTable(criterion5?.table_5_1_rows);
  if (curriculumTable) {
    children.push(curriculumTable);
  } else {
    children.push(paragraph('No rows are available.'));
  }

  children.push(subTitle('Flowchart Preview'));
  appendBlock(children, await renderCriterion5Flowchart(metadata?.cycle_id));

  children.push(subTitle('Design Project Rows'));
  const designProjectsTable = objectTable(criterion5?.design_project_rows);
  if (designProjectsTable) {
    children.push(designProjectsTable);
  } else {
    children.push(paragraph('No rows are available.'));
  }

  return children;
};

const buildSectionChildren = async (sectionId, sectionPayload, metadata = {}) => {
  switch (sectionId) {
    case 'background':
      return [
        ...secondPageHeadingBlock(),
        ...renderBackgroundSection(sectionPayload),
      ];
    case 'criterion1':
      return renderCriterion1Section(sectionPayload);
    case 'criterion2':
      return renderCriterion2Section(sectionPayload);
    case 'criterion3':
      return renderCriterion3(sectionPayload);
    case 'criterion4':
      return renderCriterion4(sectionPayload);
    case 'criterion5':
      return renderCriterion5Section(sectionPayload, metadata);
    case 'criterion6':
      return renderGenericSection('Criterion 6 - Faculty', sectionPayload, {
        excludedFields: ['criterion6_id', 'cycle', 'item', 'faculty_options', 'faculty_name_lookup'],
        tableFields: [
          { key: 'qualification_rows', title: 'Table 6-1. Faculty Qualifications' },
          { key: 'workload_rows', title: 'Table 6-2. Faculty Workload Summary' },
          { key: 'professional_development_rows', title: 'Professional Development' },
        ],
      });
    case 'criterion7':
      return renderGenericSection('Criterion 7 - Facilities', sectionPayload, {
        excludedFields: ['criterion7_id', 'cycle', 'is_complete'],
        tableFields: [
          { key: 'classrooms', title: 'Classrooms' },
          { key: 'laboratories', title: 'Laboratories' },
          { key: 'computing_resources', title: 'Computing Resources' },
          { key: 'upgrading_facilities', title: 'Upgrading Facilities' },
        ],
      });
    case 'criterion8':
      return renderGenericSection('Criterion 8 - Institutional Support', sectionPayload, {
        excludedFields: ['criterion8_id', 'cycle', 'item'],
        tableFields: [
          { key: 'staffing_rows', title: 'Staffing Rows' },
        ],
      });
    case 'appendixA':
      return renderAppendixA(sectionPayload);
    case 'appendixB':
      return renderAppendixB(sectionPayload);
    case 'appendixC':
      return renderGenericSection('Appendix C - Equipment', sectionPayload?.appendix || {}, {
        excludedFields: ['appendix_c_id', 'cycle'],
        tableFields: [],
      }).concat([
        subTitle('Equipment Rows'),
        objectTable(sectionPayload?.equipment_rows, ['equipment_name', 'category', 'quantity', 'location_lab', 'instructional_use', 'last_service_date', 'evidence_link']) || paragraph('No equipment rows are available.'),
      ]);
    case 'appendixD':
      return renderGenericSection('Appendix D - Institutional Summary', sectionPayload, {
        excludedFields: ['appendix_d_id'],
        tableFields: [
          { key: 'academicSupportUnits', title: 'Academic Support Units' },
          { key: 'nonacademicSupportUnits', title: 'Nonacademic Support Units' },
          { key: 'enrollmentRecords', title: 'Table D-1. Program Enrollment and Degree Data' },
          { key: 'personnelRecords', title: 'Table D-2. Personnel' },
        ],
      });
    default:
      return renderGenericSection(prettifyLabel(sectionId), sectionPayload);
  }
};

export const buildSelfStudyDocument = async (payload) => {
  const metadata = payload?.metadata || {};
  const sections = payload?.sections || {};
  const toc = Array.isArray(payload?.toc) ? payload.toc : [];
  const programName = asText(metadata.program_name) || 'Program Name';
  const reportDate = formatReportDate(metadata.generated_at);

  const documentSections = [
    {
      children: [
        new Paragraph({
          text: '',
          spacing: { after: 420 },
        }),
        coverParagraph('ABET', 40, { after: 80 }),
        coverParagraph('Self-Study Report', 40, { after: 240 }),
        coverParagraph('for the', 24, { after: 180 }),
        coverParagraph(programName, 40, { after: 220 }),
        coverParagraph('at', 24, { after: 180 }),
        coverParagraph('American University of Beirut', 40, { after: 180 }),
        coverParagraph('Beirut', 40, { after: 520 }),
        coverParagraph(reportDate, 24, { after: 700 }),
        coverParagraph('CONFIDENTIAL', 24, { after: 180 }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'The information supplied in this Self-Study Report is for the confidential use of ABET and its authorized agents and will not be disclosed without authorization of the institution concerned, except for summary data not identifiable to a specific institution.',
              font: 'Arial',
              size: 24,
            }),
          ],
        }),
      ],
    },
    {
      children: renderTableOfContents(toc),
    },
  ];

  for (const entry of toc) {
    const sectionId = entry?.id;
    if (!sectionId || !sections[sectionId]) continue;
    const properties = sectionId === 'criterion3'
      ? {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
            width: 15840,
            height: 12240,
          },
        },
      }
      : {};
    documentSections.push({
      properties,
      children: await buildSectionChildren(sectionId, sections[sectionId], metadata),
    });
  }

  return new Document({ sections: documentSections });
};

export const exportSelfStudyReport = async (payload, options = {}) => {
  const { allowSavePicker = true } = options;
  const metadata = payload?.metadata || {};
  const doc = await buildSelfStudyDocument(payload);
  const blob = await Packer.toBlob(doc);
  const buffer = await blob.arrayBuffer();
  const safeProgram = slugify(metadata.program_name, 'program');
  const safeCycle = slugify(metadata.cycle_label, 'cycle');
  const fileName = `self-study-${safeProgram}-${safeCycle}.docx`;
  const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (allowSavePicker && typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Word Document',
            accept: {
              [mimeType]: ['.docx'],
            },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(buffer);
      await writable.close();
      return;
    } catch (error) {
      const message = `${error?.message || ''}`.toLowerCase();
      const fallbackAllowed = (
        error?.name === 'AbortError'
        || message.includes('user gesture')
        || message.includes('show a file picker')
      );
      if (!fallbackAllowed) {
        throw error;
      }
    }
  }

  const downloadBlob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(downloadBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Keep the blob URL alive long enough for the browser download manager to finish reading it.
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};
