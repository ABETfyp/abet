import copy
import json
import os
import re
from urllib import error as urllib_error
from urllib import request as urllib_request


OPENAI_REPORT_MODEL = os.environ.get('OPENAI_REPORT_MODEL', 'gpt-4.1-mini')
OPENAI_REPORT_TIMEOUT_SECONDS = 90
OPENAI_REPORT_BATCH_SIZE = 20


SELF_STUDY_AI_FIELD_GROUPS = {
    'background': {
        'section_title': 'Background Information',
        'fields': {
            'majorChanges': {
                'label': 'Summary of Major Changes Since Last Review',
                'guidance': 'Summarize major changes in curriculum, faculty, facilities, assessment, resources, or student support since the last review.',
            },
        },
    },
    'criterion1': {
        'section_title': 'Criterion 1 - Students',
        'fields': {
            'admission_requirements': {'label': 'Admission Requirements'},
            'admission_process_summary': {'label': 'Admission Process Summary'},
            'transfer_pathways': {'label': 'Transfer Pathways'},
            'pperformance_evaluation_process': {'label': 'Process for Evaluating Academic Performance'},
            'prerequisite_verification_method': {'label': 'How Prerequisites Are Verified'},
            'prerequisite_not_met_action': {'label': 'What Happens When Prerequisites Are Not Met'},
            'transfer_policy_summary': {'label': 'Transfer Policy Summary'},
            'transfer_credit_evaluation_process': {'label': 'Evaluation Process for Transfer Credits'},
            'articulation_agreements': {'label': 'Articulation Agreements'},
            'advising_providers': {'label': 'Who Provides Advising'},
            'advising_frequency': {'label': 'How Often Advising Occurs'},
            'career_guidance_description': {'label': 'Career Guidance Services'},
            'work_in_lieu_policies': {'label': 'Work in Lieu Policies'},
            'work_in_lieu_approval_process': {'label': 'Work in Lieu Approval Process'},
            'essential_courses_categories': {'label': 'Essential Courses or Categories'},
            'transcript_format_explanation': {'label': 'Transcript Format Explanation'},
            'program_name_on_transcript': {'label': 'How the Program Name Appears on the Transcript'},
        },
    },
    'criterion2': {
        'section_title': 'Criterion 2 - Program Educational Objectives',
        'fields': {
            'institutional_mission_statement': {'label': 'Institutional Mission Statement'},
            'program_mission_statement': {'label': 'Program Mission Statement'},
            'peos_mission_alignment_explanation': {'label': 'PEO Alignment with Institutional Mission'},
            'constituencies_list': {'label': 'List of Constituencies'},
            'constituencies_contribution_description': {'label': 'How Constituencies Contribute to PEO Review'},
            'peo_review_frequency': {'label': 'Frequency of PEO Review'},
            'peo_review_participants': {'label': 'PEO Review Participants'},
            'feedback_collection_and_decision_process': {'label': 'Feedback Collection and Decision Process'},
            'changes_since_last_peo_review': {'label': 'Changes Since Last PEO Review'},
        },
    },
    'criterion4': {
        'section_title': 'Criterion 4 - Continuous Improvement',
        'fields': {
            'programNarrative': {'label': 'Program-Level Narrative'},
            'recordsMaintenance': {'label': 'Records and Maintenance'},
        },
    },
    'criterion5': {
        'section_title': 'Criterion 5 - Curriculum',
        'fields': {
            'plan_of_study_description': {'label': 'Plan of Study Description'},
            'curriculum_alignment_description': {'label': 'Curriculum Alignment Description'},
            'prerequisites_support_description': {'label': 'How Prerequisites Support Student Outcomes'},
            'prerequisite_flowchart_description': {'label': 'Prerequisite Flowchart Description'},
            'hours_depth_by_subject_area_description': {'label': 'Hours and Depth by Subject Area'},
            'broad_education_component_description': {'label': 'Broad Education Component'},
            'cooperative_education_description': {'label': 'Cooperative Education'},
            'materials_available_description': {'label': 'Materials Available to Students and Faculty'},
            'culminating_design_experience': {'label': 'Culminating Major Design Experience'},
        },
    },
    'criterion6': {
        'section_title': 'Criterion 6 - Faculty',
        'fields': {
            'faculty_composition_narrative': {'label': 'Faculty Composition Narrative'},
            'faculty_worklaod_expectations_description': {'label': 'Faculty Workload Expectations'},
            'workload_expectations_desciption': {'label': 'Workload Expectations Description'},
            'faculty_size_adequacy_description': {'label': 'Faculty Size Adequacy'},
            'advising_and_student_interaction_description': {'label': 'Advising and Student Interaction'},
            'service_and_industry_engagement_description': {'label': 'Service and Industry Engagement'},
            'course_creation_role_description': {'label': 'Role in Course Creation and Improvement'},
            'peo_ro_role_description': {'label': 'Role in PEOs and Student Outcomes'},
            'leadership_roles_description': {'label': 'Leadership Roles Description'},
        },
    },
    'criterion7': {
        'section_title': 'Criterion 7 - Facilities',
        'fields': {
            'guidance_description': {'label': 'Guidance Description'},
            'maintenance_policy_description': {'label': 'Maintenance Policy Description'},
            'technical_collections_and_journals': {'label': 'Technical Collections and Journals'},
            'electronic_databases_and_eresources': {'label': 'Electronic Databases and E-Resources'},
            'faculty_book_request_process': {'label': 'Faculty Book Request Process'},
            'library_access_hours_and_systems': {'label': 'Library Access Hours and Systems'},
            'facilities_support_student_outcomes': {'label': 'How Facilities Support Student Outcomes'},
            'safety_and_inspection_processes': {'label': 'Safety and Inspection Processes'},
            'compliance_with_university_policy': {'label': 'Compliance with University Policy'},
            'student_availability_details': {'label': 'Student Availability Details'},
        },
    },
    'criterion8': {
        'section_title': 'Criterion 8 - Institutional Support',
        'fields': {
            'leadership_structure_description': {'label': 'Leadership Structure'},
            'leadership_adequacy_description': {'label': 'Leadership Adequacy'},
            'leadership_participation_description': {'label': 'Leadership Participation'},
            'budget_process_continuity': {'label': 'Budget Process and Continuity'},
            'teaching_support_description': {'label': 'Teaching Support'},
            'infrastructure_funding_description': {'label': 'Infrastructure Funding'},
            'resource_adequacy_description': {'label': 'Resource Adequacy'},
            'additional_narrative_on_staffing': {'label': 'Additional Narrative on Staffing'},
            'hiring_process_description': {'label': 'Hiring Process'},
            'retention_strategies_description': {'label': 'Retention Strategies'},
            'professional_development_support_types': {'label': 'Professional Development Support Types'},
            'professional_development_request_process': {'label': 'Professional Development Request Process'},
            'professional_development_funding_details': {'label': 'Professional Development Funding Details'},
        },
    },
    'appendixD': {
        'section_title': 'Appendix D - Institutional Summary',
        'fields': {
            'institutionalAccreditations': {'label': 'Institutional Accreditations'},
            'accreditationEvaluationDates': {'label': 'Accreditation Evaluation Dates'},
            'controlTypeDescription': {'label': 'Type of Control'},
            'administrativeChainDescription': {'label': 'Administrative Chain Description'},
            'creditHourDefinition': {'label': 'Credit Hour Definition'},
            'deviationsFromStandard': {'label': 'Deviations from Standard Credit-Hour Definition'},
        },
    },
}


def _clean_text(value):
    return re.sub(r'\s+', ' ', f'{value or ""}').strip()


def _redact_sensitive_error_text(value):
    cleaned = _clean_text(value)
    if not cleaned:
        return ''
    redacted = re.sub(r'(sk-[A-Za-z0-9_-]{12,})', '[REDACTED_API_KEY]', cleaned)
    redacted = re.sub(r'((?:api[_-]?key|authorization)\s*[:=]\s*)([^\s,;\'"]+)', r'\1[REDACTED_API_KEY]', redacted, flags=re.IGNORECASE)
    redacted = re.sub(r'([?&](?:key|api_key)=)[^&\s]+', r'\1[REDACTED_API_KEY]', redacted, flags=re.IGNORECASE)
    return redacted


def _is_scalar(value):
    return value is None or isinstance(value, (str, int, float, bool))


def _truncate_text(value, limit=700):
    cleaned = _clean_text(value)
    if len(cleaned) <= limit:
        return cleaned
    return f'{cleaned[:limit - 3].rstrip()}...'


def _prettify_label(value):
    raw = f'{value or ""}'.replace('_', ' ')
    raw = re.sub(r'([a-z])([A-Z])', r'\1 \2', raw)
    raw = re.sub(r'\bso\b', 'SO', raw, flags=re.IGNORECASE)
    raw = re.sub(r'\bpeo\b', 'PEO', raw, flags=re.IGNORECASE)
    raw = re.sub(r'\bclo\b', 'CLO', raw, flags=re.IGNORECASE)
    raw = re.sub(r'\s+', ' ', raw).strip()
    if not raw:
        return ''
    return raw[0].upper() + raw[1:]


def _extract_response_text(response_payload):
    direct = _clean_text(response_payload.get('output_text'))
    if direct:
        return direct

    parts = []
    for item in response_payload.get('output') or []:
        for content in item.get('content') or []:
            text_value = content.get('text') or content.get('output_text')
            if text_value:
                parts.append(text_value)
    return _clean_text('\n'.join(parts))


def _run_openai_json_prompt(prompt_text):
    api_key = _clean_text(os.environ.get('OPENAI_API_KEY'))
    if not api_key:
        return None, 'OPENAI_API_KEY is not configured on the backend.'

    request_body = {
        'model': OPENAI_REPORT_MODEL,
        'input': [
            {
                'role': 'system',
                'content': [
                    {
                        'type': 'input_text',
                        'text': (
                            'You rewrite selected ABET self-study report fields in polished formal English. '
                            'Return valid JSON only. Do not fabricate specific names, dates, URLs, accreditation decisions, or numerical facts that are not in the prompt. '
                            'Preserve the original meaning and any program-specific details that are already present.'
                        ),
                    }
                ],
            },
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'input_text',
                        'text': prompt_text,
                    }
                ],
            },
        ],
        'text': {
            'format': {
                'type': 'json_object',
            }
        },
    }

    encoded_body = json.dumps(request_body).encode('utf-8')
    request = urllib_request.Request(
        'https://api.openai.com/v1/responses',
        data=encoded_body,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )

    try:
        with urllib_request.urlopen(request, timeout=OPENAI_REPORT_TIMEOUT_SECONDS) as response:
            raw_payload = response.read().decode('utf-8')
    except urllib_error.HTTPError as exc:
        raw_error = exc.read().decode('utf-8', errors='replace')
        try:
            payload = json.loads(raw_error)
            message = (
                payload.get('error', {}).get('message')
                or payload.get('message')
                or raw_error
            )
        except Exception:
            message = raw_error
        return None, _redact_sensitive_error_text(message) or 'OpenAI request failed.'
    except Exception as exc:
        return None, _redact_sensitive_error_text(str(exc)) or 'OpenAI request failed.'

    try:
        payload = json.loads(raw_payload)
    except json.JSONDecodeError:
        return None, 'OpenAI returned an unreadable response.'

    output_text = _extract_response_text(payload)
    if not output_text:
        return None, 'OpenAI returned an empty response.'

    try:
        return json.loads(output_text), None
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', output_text, flags=re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0)), None
            except json.JSONDecodeError:
                pass
        return None, 'OpenAI returned invalid JSON.'


def _iter_registry_fields():
    for section_id, section_config in SELF_STUDY_AI_FIELD_GROUPS.items():
        for field_key, field_config in (section_config.get('fields') or {}).items():
            yield section_id, section_config, field_key, field_config


def build_self_study_ai_options(payload):
    sections = (payload or {}).get('sections') or {}
    groups = []
    for section_id, section_config in SELF_STUDY_AI_FIELD_GROUPS.items():
        section_payload = sections.get(section_id) or {}
        group_fields = []
        for field_key, field_config in (section_config.get('fields') or {}).items():
            if field_key not in section_payload:
                continue
            if not _is_scalar(section_payload.get(field_key)):
                continue
            group_fields.append({
                'sectionId': section_id,
                'sectionTitle': section_config.get('section_title') or section_id,
                'fieldKey': field_key,
                'label': field_config.get('label') or _prettify_label(field_key),
                'currentValue': _truncate_text(section_payload.get(field_key), limit=240),
            })
        if group_fields:
            groups.append({
                'sectionId': section_id,
                'sectionTitle': section_config.get('section_title') or section_id,
                'fields': group_fields,
            })
    return groups


def _normalize_selected_fields(selected_fields):
    normalized = []
    seen = set()
    for item in selected_fields or []:
        if isinstance(item, str):
            section_id, _, field_key = item.partition('.')
        else:
            section_id = _clean_text((item or {}).get('sectionId'))
            field_key = _clean_text((item or {}).get('fieldKey'))
        if not section_id or not field_key:
            continue
        pair = (section_id, field_key)
        if pair in seen:
            continue
        seen.add(pair)
        normalized.append(pair)
    return normalized


def _build_section_context(section_payload, field_key):
    context = {}
    if not isinstance(section_payload, dict):
        return context
    for key, value in section_payload.items():
        if key == field_key or not _is_scalar(value):
            continue
        if key == 'id' or key.endswith('_id') or key in ('cycle', 'item', 'criterion1_id', 'criterion2_id', 'criterion5_id', 'criterion6_id', 'criterion7_id', 'criterion8_id', 'checklist_item_id'):
            continue
        cleaned = _truncate_text(value, limit=220)
        if not cleaned:
            continue
        context[_prettify_label(key)] = cleaned
        if len(context) >= 6:
            break
    return context


def _build_target_descriptors(payload, selected_pairs):
    sections = (payload or {}).get('sections') or {}
    registry_lookup = {
        (section_id, field_key): {
            'section_title': section_config.get('section_title') or section_id,
            'label': field_config.get('label') or _prettify_label(field_key),
            'guidance': field_config.get('guidance') or '',
        }
        for section_id, section_config, field_key, field_config in _iter_registry_fields()
    }

    valid_targets = []
    invalid_targets = []
    for section_id, field_key in selected_pairs:
        registry_entry = registry_lookup.get((section_id, field_key))
        section_payload = sections.get(section_id) or {}
        if not registry_entry or field_key not in section_payload or not _is_scalar(section_payload.get(field_key)):
            invalid_targets.append({'sectionId': section_id, 'fieldKey': field_key})
            continue
        valid_targets.append({
            'section_id': section_id,
            'section_title': registry_entry['section_title'],
            'field_key': field_key,
            'field_label': registry_entry['label'],
            'guidance': registry_entry['guidance'],
            'current_value': _truncate_text(section_payload.get(field_key), limit=2600),
            'section_context': _build_section_context(section_payload, field_key),
        })
    return valid_targets, invalid_targets


def _build_rewrite_prompt(metadata, targets):
    compact_targets = []
    for target in targets:
        compact_targets.append({
            'section_id': target['section_id'],
            'section_title': target['section_title'],
            'field_key': target['field_key'],
            'field_label': target['field_label'],
            'guidance': target['guidance'],
            'current_value': target['current_value'],
            'nearby_section_context': target['section_context'],
        })

    instructions = {
        'task': 'Rewrite or expand each selected field for an ABET self-study report.',
        'style_rules': [
            'Return one polished field value per target.',
            'Use formal self-study prose suitable for direct insertion into the report.',
            'Keep each field focused on its own topic and avoid repeating unrelated sections.',
            'If the current value is already specific, preserve the facts and improve clarity and completeness.',
            'If details are missing, use careful general wording and do not invent precise facts.',
            'Avoid bullet lists unless the field clearly reads better as a compact list in one paragraph.',
            'Do not add markdown, headings, or field labels inside the rewritten text.',
        ],
        'response_shape': {
            'rewrites': [
                {
                    'section_id': 'section id',
                    'field_key': 'field key',
                    'text': 'rewritten field value',
                }
            ]
        },
        'metadata': {
            'program_name': _clean_text((metadata or {}).get('program_name')),
            'cycle_label': _clean_text((metadata or {}).get('cycle_label')),
        },
        'targets': compact_targets,
    }
    return json.dumps(instructions, ensure_ascii=False, indent=2)


def augment_self_study_payload_with_ai(payload, selected_fields):
    selected_pairs = _normalize_selected_fields(selected_fields)
    if not selected_pairs:
        return copy.deepcopy(payload), [], [], None

    targets, invalid_targets = _build_target_descriptors(payload, selected_pairs)
    if not targets:
        return None, [], invalid_targets, 'None of the selected fields are eligible for AI drafting.'

    augmented_payload = copy.deepcopy(payload)
    applied = []
    valid_lookup = {(target['section_id'], target['field_key']): target for target in targets}
    sections = (augmented_payload or {}).get('sections') or {}
    metadata = (payload or {}).get('metadata') or {}

    for start_index in range(0, len(targets), OPENAI_REPORT_BATCH_SIZE):
        batch_targets = targets[start_index:start_index + OPENAI_REPORT_BATCH_SIZE]
        prompt = _build_rewrite_prompt(metadata, batch_targets)
        parsed_response, error = _run_openai_json_prompt(prompt)
        if error:
            return None, applied, invalid_targets, error

        rewrite_rows = parsed_response.get('rewrites') if isinstance(parsed_response, dict) else None
        if not isinstance(rewrite_rows, list):
            return None, applied, invalid_targets, 'OpenAI did not return the expected rewrite format.'

        for row in rewrite_rows:
            section_id = _clean_text((row or {}).get('section_id'))
            field_key = _clean_text((row or {}).get('field_key'))
            rewritten_text = _clean_text((row or {}).get('text'))
            if not section_id or not field_key or not rewritten_text:
                continue
            if (section_id, field_key) not in valid_lookup:
                continue
            if section_id not in sections or field_key not in sections[section_id]:
                continue
            sections[section_id][field_key] = rewritten_text
            applied.append({
                'sectionId': section_id,
                'fieldKey': field_key,
                'label': valid_lookup[(section_id, field_key)]['field_label'],
            })

    if not applied:
        return None, [], invalid_targets, 'OpenAI did not return usable text for the selected fields.'

    return augmented_payload, applied, invalid_targets, None
