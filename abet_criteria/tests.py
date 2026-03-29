from pathlib import Path
from io import BytesIO
from datetime import timedelta
from unittest.mock import patch
import zipfile
import zlib

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from django.utils import timezone

from .serializers import Criterion1StudentsSerializer
from .textbox_ai import SECTION_REGISTRY, _build_background_program_history_llm_text, _build_gemini_background_file_parts, _extract_text_from_docx_bytes, _extract_text_from_pdf_bytes, _run_background_textbox_gemini, _run_textbox_gemini, extract_structured_section, extract_textbox_section, _run_ollama_command
from .views import _validate_background_review_date


class AiExtractionSafetyTests(SimpleTestCase):
    def test_docx_text_extraction_preserves_contact_fields(self):
        buffer = BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive:
            archive.writestr(
                'word/document.xml',
                '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:body>
                    <w:p><w:r><w:t>Program Contact Information - American University of Beirut (AUB)</w:t></w:r></w:p>
                    <w:p>
                      <w:r><w:t>Program Contact Name: </w:t></w:r>
                      <w:r><w:t>Dr. Karim Haddad</w:t></w:r>
                    </w:p>
                    <w:p>
                      <w:r><w:t>Position / Title: </w:t></w:r>
                      <w:r><w:t>Program Coordinator</w:t></w:r>
                    </w:p>
                    <w:p><w:r><w:t>Office Location: Engineering Building, Room 301</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Phone Number: +9611123456</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Email Address: coordinator@aub.edu.lb</w:t></w:r></w:p>
                  </w:body>
                </w:document>'''
            )
            archive.writestr(
                'word/styles.xml',
                '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"/></w:styles>'
            )

        extracted = _extract_text_from_docx_bytes(buffer.getvalue())

        self.assertIn('Program Contact Name: Dr. Karim Haddad', extracted)
        self.assertIn('Position / Title: Program Coordinator', extracted)
        self.assertIn('Office Location: Engineering Building, Room 301', extracted)
        self.assertIn('Phone Number: +9611123456', extracted)
        self.assertIn('Email Address: coordinator@aub.edu.lb', extracted)
        self.assertNotIn('styleId', extracted)

    def test_pdf_text_extraction_preserves_contact_fields(self):
        content_stream = (
            b'BT\n'
            b'/F1 12 Tf\n'
            b'72 720 Td\n'
            b'(Program Contact Name: Dr. Karim Haddad) Tj\n'
            b'0 -14 Td\n'
            b'(Position / Title: Program Coordinator) Tj\n'
            b'0 -14 Td\n'
            b'(Office Location: Engineering Building, Room 301) Tj\n'
            b'0 -14 Td\n'
            b'(Phone Number: +9611123456) Tj\n'
            b'0 -14 Td\n'
            b'(Email Address: coordinator@aub.edu.lb) Tj\n'
            b'ET'
        )
        compressed_stream = zlib.compress(content_stream)
        pdf_bytes = (
            b'%PDF-1.4\n'
            b'1 0 obj\n'
            b'<< /Length ' + str(len(compressed_stream)).encode('ascii') + b' /Filter /FlateDecode >>\n'
            b'stream\n' + compressed_stream + b'\nendstream\n'
            b'endobj\n'
        )

        extracted = _extract_text_from_pdf_bytes(pdf_bytes)

        self.assertIn('Program Contact Name: Dr. Karim Haddad', extracted)
        self.assertIn('Position / Title: Program Coordinator', extracted)
        self.assertIn('Office Location: Engineering Building, Room 301', extracted)
        self.assertIn('Phone Number: +9611123456', extracted)
        self.assertIn('Email Address: coordinator@aub.edu.lb', extracted)

    def test_gemini_background_file_parts_include_pdf_inline_data(self):
        upload = SimpleUploadedFile(
            'program_history.pdf',
            b'%PDF-1.4 sample pdf bytes',
            content_type='application/pdf',
        )

        parts = _build_gemini_background_file_parts([upload])

        self.assertEqual(len(parts), 1)
        self.assertEqual(parts[0]['inline_data']['mime_type'], 'application/pdf')
        self.assertTrue(parts[0]['inline_data']['data'])

    def test_run_ollama_command_uses_utf8_with_safe_fallback(self):
        with patch('abet_criteria.textbox_ai.subprocess.run') as mock_run:
            _run_ollama_command('prompt body', timeout=123, model_name='llama3.1:8b')

        _, kwargs = mock_run.call_args
        self.assertEqual(kwargs['encoding'], 'utf-8')
        self.assertEqual(kwargs['errors'], 'replace')
        self.assertTrue(kwargs['text'])
        self.assertTrue(kwargs['capture_output'])
        self.assertEqual(kwargs['timeout'], 123)

    def test_all_ollama_call_sites_use_shared_helper(self):
        repo_root = Path(__file__).resolve().parent.parent
        textbox_ai_source = (repo_root / 'abet_criteria' / 'textbox_ai.py').read_text(encoding='utf-8')
        views_source = (repo_root / 'abet_criteria' / 'views.py').read_text(encoding='utf-8')

        self.assertEqual(textbox_ai_source.count('subprocess.run('), 1)
        self.assertNotIn('subprocess.run(', views_source)
        self.assertNotIn('_run_criterion1_student_admissions_llama', textbox_ai_source)
        self.assertNotIn('timeout=TEXTBOX_LLAMA_TIMEOUT_SECONDS', textbox_ai_source)
        self.assertIn('_run_ollama_command(prompt, timeout=STRUCTURED_LLAMA_TIMEOUT_SECONDS)', textbox_ai_source)
        self.assertIn('_run_ollama_command(prompt, timeout=90, model_name=model_name)', views_source)

    def test_textbox_section_skips_gemini_when_fields_are_already_filled(self):
        current_fields = {
            'admission_requirements': 'Existing requirements',
            'admission_process_summary': 'Existing process',
            'transfer_pathways': 'Existing transfer pathways',
        }
        upload = SimpleUploadedFile('admissions.txt', b'Admission requirements and process details.')

        with patch('abet_criteria.textbox_ai._run_textbox_gemini') as mock_gemini:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                current_fields,
                [upload],
            )

        self.assertIsNone(error)
        self.assertFalse(mock_gemini.called)
        self.assertEqual(result['appliedFields'], [])
        self.assertEqual(set(result['preservedFields']), set(current_fields))
        self.assertIn('already filled', result['confidenceNotes'])

    def test_textbox_section_uses_gemini_when_available(self):
        evidence = (
            b'Admission requirements include a secondary school certificate, strong mathematics grades, '
            b'and a program entrance exam. Applicants must submit transcripts and complete the official form.\n\n'
            b'The admission process begins with an online application, document review by the admissions office, '
            b'faculty evaluation, and a final decision notice sent to applicants.\n\n'
            b'Transfer pathways allow students from partner colleges to transfer approved credits after syllabus review, '
            b'academic advising, and department approval.'
        )
        upload = SimpleUploadedFile('admissions.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=({
                'admission_requirements': 'Secondary school certificate, strong mathematics grades, entrance exam, and transcript submission.',
                'admission_process_summary': 'The process includes an online application, admissions office review, faculty evaluation, and a final decision notice.',
                'transfer_pathways': 'Partner-college transfers may receive approved credits after syllabus review and academic advising.',
                'confidenceNotes': 'Gemini separated the admissions evidence across all three fields.',
            }, '')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(set(result['appliedFields']), {
            'admission_requirements',
            'admission_process_summary',
            'transfer_pathways',
        })
        self.assertIn('Gemini', result['confidenceNotes'])

    def test_criterion1_admissions_fast_path_handles_partial_short_evidence_without_gemini(self):
        evidence = (
            b'Admission requirements: secondary school certificate, math preparation, and transcript submission.\n'
            b'Admission process: online application, faculty review, and final admission decision.\n'
        )
        upload = SimpleUploadedFile('admissions-short.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertIn('admission_requirements', result['appliedFields'])
        self.assertIn('admission_process_summary', result['appliedFields'])
        self.assertEqual(result['mergedFields']['transfer_pathways'], '')
        self.assertIn('Gemini was not used', result['confidenceNotes'])
        self.assertNotIn('Local LLaMA was not used', result['confidenceNotes'])

    def test_criterion1_admissions_mixed_content_is_split_by_field_when_gemini_fails(self):
        evidence = (
            b'Mixed Academic Narrative - AUB Engineering Program '
            b'The process of admission often includes application review, academic evaluation, and in some cases interviews or standardized testing. '
            b'Admission into the engineering program generally requires strong performance in mathematics and science subjects, along with demonstrated analytical thinking. '
            b'Students transferring from other institutions may follow structured transfer pathways if course equivalencies are satisfied.'
        )
        upload = SimpleUploadedFile('abet_mixed_short.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ) as mock_gemini:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertIn('mathematics and science subjects', result['mergedFields']['admission_requirements'])
        self.assertIn('application review', result['mergedFields']['admission_process_summary'])
        self.assertIn('transfer pathways', result['mergedFields']['transfer_pathways'])
        self.assertNotEqual(result['mergedFields']['admission_requirements'], result['mergedFields']['admission_process_summary'])
        self.assertNotIn('File:', result['mergedFields']['admission_requirements'])
        self.assertNotIn('Mixed Academic Narrative', result['mergedFields']['admission_requirements'])

    def test_criterion1_admissions_collects_multiple_relevant_points_per_field_when_gemini_fails(self):
        evidence = (
            b'Mixed Narrative on Student Admissions (Test Document)\n'
            b'Admission into the engineering program generally requires strong performance in mathematics and science subjects.\n'
            b'The admission process typically involves application review and academic evaluation.\n'
            b'Course equivalencies must be evaluated before transfer admission is granted.\n'
            b'Holistic evaluation may consider extracurricular activities and personal statements.\n'
            b'Students transferring from other institutions may follow structured transfer pathways.\n'
            b'A solid academic background in physics and calculus is often considered essential.\n'
            b'Transfer applicants are assessed based on prior coursework and academic standing.\n'
            b'Some programs include interviews or standardized testing as part of the selection process.\n'
            b'Applicants are expected to demonstrate analytical thinking and problem-solving skills.\n'
        )
        upload = SimpleUploadedFile('admissions-rich.txt', evidence)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ) as mock_gemini:
            result, error = extract_textbox_section(
                'criterion1',
                'A. Student Admissions',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertIn('mathematics and science subjects', result['mergedFields']['admission_requirements'])
        self.assertIn('physics and calculus', result['mergedFields']['admission_requirements'])
        self.assertIn('analytical thinking', result['mergedFields']['admission_requirements'])
        self.assertIn('application review', result['mergedFields']['admission_process_summary'])
        self.assertIn('Holistic evaluation', result['mergedFields']['admission_process_summary'])
        self.assertIn('interviews or standardized testing', result['mergedFields']['admission_process_summary'])
        self.assertIn('structured transfer pathways', result['mergedFields']['transfer_pathways'])
        self.assertIn('Course equivalencies', result['mergedFields']['transfer_pathways'])
        self.assertIn('prior coursework and academic standing', result['mergedFields']['transfer_pathways'])

    def test_criterion1_transcripts_prompt_rejects_irrelevant_mixed_text(self):
        prompts = []

        def fake_gemini(prompt, model_name='gemini-2.5-flash', timeout=30, extra_parts=None):
            prompts.append(prompt)
            return ({
                'transcript_format_explanation': '',
                'program_name_on_transcript': '',
                'confidenceNotes': 'No transcript-specific evidence was found.',
            }, '')

        mixed_text = (
            'Mixed Academic Narrative - Criteria 1 Test '
            'C. Transfer Students and Transfer Courses: Transfer policies allow students to join from other institutions. '
            'Transfer credits are evaluated through detailed course equivalency checks. '
            'B. Evaluating Student Performance: Student progress is tracked through continuous assessment, exams, and coursework. '
            'Prerequisites are verified using official transcripts and academic records. '
            'A. Student Admissions: The program admits students based on strong academic performance in mathematics and science.'
        )

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', side_effect=fake_gemini):
            result, error = _run_textbox_gemini(
                'criterion1',
                'G. Transcripts of Recent Graduates',
                SECTION_REGISTRY['criterion1']['G. Transcripts of Recent Graduates'],
                mixed_text,
                {},
            )

        self.assertEqual(error, '')
        self.assertEqual(result['transcript_format_explanation'], '')
        self.assertEqual(result['program_name_on_transcript'], '')
        self.assertIn('No strong section-specific evidence was found', prompts[0])
        self.assertNotIn('Extracted document text:', prompts[0])

    def test_criterion1_transcripts_fallback_ignores_irrelevant_mixed_text(self):
        mixed_text = (
            b'Mixed Academic Narrative - Criteria 1 Test '
            b'C. Transfer Students and Transfer Courses: Transfer policies allow students to join from other institutions. '
            b'Transfer credits are evaluated through detailed course equivalency checks. '
            b'B. Evaluating Student Performance: Student progress is tracked through continuous assessment, exams, and coursework. '
            b'Prerequisites are verified using official transcripts and academic records. '
            b'A. Student Admissions: The program admits students based on strong academic performance in mathematics and science.'
        )
        upload = SimpleUploadedFile('criterion1g-mixed.txt', mixed_text)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ):
            result, error = extract_textbox_section(
                'criterion1',
                'G. Transcripts of Recent Graduates',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(result['mergedFields']['transcript_format_explanation'], '')
        self.assertEqual(result['mergedFields']['program_name_on_transcript'], '')
        self.assertEqual(result['appliedFields'], [])
        self.assertIn('Fields without clear evidence were left blank.', result['confidenceNotes'])

    def test_criterion1_transcripts_fallback_uses_explicit_transcript_evidence(self):
        transcript_text = (
            b'Official transcripts for recent graduates are issued by the Registrar and show each semester, '
            b'course titles, grades, credit hours, and cumulative GPA. '
            b'The degree appears on the transcript as Bachelor of Engineering in Mechanical Engineering.'
        )
        upload = SimpleUploadedFile('criterion1g-transcript.txt', transcript_text)

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ):
            result, error = extract_textbox_section(
                'criterion1',
                'G. Transcripts of Recent Graduates',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertIn('issued by the Registrar', result['mergedFields']['transcript_format_explanation'])
        self.assertIn('course titles', result['mergedFields']['transcript_format_explanation'])
        self.assertIn('Bachelor of Engineering', result['mergedFields']['program_name_on_transcript'])
        self.assertEqual(set(result['appliedFields']), {'transcript_format_explanation', 'program_name_on_transcript'})

    def test_generic_narrative_section_leaves_fields_blank_when_gemini_is_unavailable(self):
        upload = SimpleUploadedFile(
            'criterion2-alignment.txt',
            b'The PEOs align with the institutional mission by supporting lifelong learning, leadership, and service.'
        )

        with patch(
            'abet_criteria.textbox_ai._run_textbox_gemini',
            return_value=(None, 'Gemini request timed out')
        ):
            result, error = extract_textbox_section(
                'criterion2',
                'C. Consistency of PEOs with Institutional Mission',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertEqual(result['mergedFields']['peos_mission_alignment_explanation'], '')
        self.assertEqual(result['appliedFields'], [])
        self.assertIn('safe rule-based fallback is disabled', result['confidenceNotes'])

    def test_criterion1_serializer_rejects_non_numeric_gpa(self):
        serializer = Criterion1StudentsSerializer(
            data={'required_gpa_or_standing': 'good standing'},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('required_gpa_or_standing', serializer.errors)

    def test_criterion1_serializer_accepts_decimal_gpa(self):
        serializer = Criterion1StudentsSerializer(
            data={'required_gpa_or_standing': '2.0'},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['required_gpa_or_standing'], '2.0')

    def test_background_section_uses_gemini_when_available(self):
        upload = SimpleUploadedFile('history.txt', b'The program was implemented in 2018 and reviewed on 2024-03-10.')

        with patch(
            'abet_criteria.textbox_ai._run_background_textbox_gemini',
            return_value=({
                'yearImplemented': '2018',
                'lastReviewDate': '2024-03-10',
                'majorChanges': 'The curriculum and facilities were updated after the last review.',
                'confidenceNotes': 'Gemini separated the background history fields from the uploaded evidence.',
            }, '')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'background',
                'B. Program History',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertEqual(set(result['appliedFields']), {'yearImplemented', 'lastReviewDate', 'majorChanges'})
        self.assertIn('Gemini', result['confidenceNotes'])

    def test_background_section_never_falls_back_to_ollama_when_gemini_fails(self):
        upload = SimpleUploadedFile(
            'history.txt',
            b'The program was implemented in 2018. The last general review occurred on 2024-03-10. Since the last review, laboratory facilities were upgraded and digital learning platforms were integrated.'
        )

        with patch(
            'abet_criteria.textbox_ai._run_background_textbox_gemini',
            return_value=(None, 'Gemini API key is not configured.')
        ) as mock_gemini, patch('abet_criteria.textbox_ai._run_ollama_command') as mock_ollama:
            result, error = extract_textbox_section(
                'background',
                'B. Program History',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertFalse(mock_ollama.called)
        self.assertIn('Gemini was not used', result['confidenceNotes'])
        self.assertNotIn('Local LLaMA was not used', result['confidenceNotes'])

    def test_background_program_history_gemini_prompt_requests_long_major_changes_paragraph(self):
        prompts = []
        file_parts = []

        def fake_gemini(prompt, model_name='gemini-2.5-flash', timeout=30, extra_parts=None):
            prompts.append(prompt)
            file_parts.append(extra_parts or [])
            return ({
                'yearImplemented': '2018',
                'lastReviewDate': '2024-03-10',
                'majorChanges': 'Since the last review, the program updated the curriculum, expanded laboratory infrastructure, introduced new assessment workflows, strengthened industry engagement, and revised advising and review practices to support continuous improvement.',
                'confidenceNotes': 'Gemini extracted the program history fields from the uploaded evidence.',
            }, '')

        with patch('abet_criteria.textbox_ai._run_gemini_json_prompt', side_effect=fake_gemini):
            result, error = _run_background_textbox_gemini(
                SECTION_REGISTRY['background']['B. Program History'],
                'The program was implemented in 2018. The last general review occurred on 2024-03-10. Since the last review, the curriculum was revised, new laboratories were added, advising was strengthened, and assessment workflows were updated.',
                {},
            )

        self.assertEqual(error, '')
        self.assertEqual(result['yearImplemented'], '2018')
        self.assertEqual(result['lastReviewDate'], '2024-03-10')
        self.assertIn('substantial paragraph', prompts[0])
        self.assertIn('Evidence excerpt:', prompts[0])
        self.assertIn('Include multiple relevant changes when they exist', prompts[0])
        self.assertEqual(file_parts[0], [])

    def test_background_program_history_evidence_excerpt_focuses_on_real_changes(self):
        text = (
            'The engineering program was officially implemented in 1995, marking the beginning of its formal academic structure. '
            'The cafeteria offers a variety of international cuisines catering to diverse student preferences. '
            'A major general review of the program was conducted on March 28, 2026, focusing on curriculum alignment and accreditation standards. '
            'Laboratory facilities have been upgraded with new equipment to support advanced experimentation and research. '
            'Digital learning platforms have been integrated into the program to support hybrid and remote learning environments. '
            'Faculty recruitment has expanded, bringing in professionals with both academic and industry experience. '
            'Weather conditions throughout the year range from mild winters to warm summers.'
        )

        excerpt = _build_background_program_history_llm_text(text)

        self.assertIn('Implementation evidence:', excerpt)
        self.assertIn('Review-date evidence:', excerpt)
        self.assertIn('Major-changes evidence:', excerpt)
        self.assertIn('officially implemented in 1995', excerpt)
        self.assertIn('March 28, 2026', excerpt)
        self.assertIn('Laboratory facilities have been upgraded', excerpt)
        self.assertIn('Digital learning platforms have been integrated', excerpt)
        self.assertIn('Faculty recruitment has expanded', excerpt)
        self.assertNotIn('international cuisines', excerpt)
        self.assertNotIn('Weather conditions', excerpt)

    def test_background_contact_info_gemini_requires_direct_values(self):
        upload = SimpleUploadedFile(
            'contact.txt',
            b'Program Contact Name: Dr. Karim Haddad\nPosition / Title: Program Coordinator\nOffice Location: Engineering Building, Room 301\nPhone Number: +9611123456\nEmail Address: coordinator@aub.edu.lb'
        )

        with patch(
            'abet_criteria.textbox_ai._run_background_textbox_gemini',
            return_value=({
                'contactName': 'Dr. Karim Haddad',
                'positionTitle': 'Program Coordinator',
                'officeLocation': 'Engineering Building, Room 301',
                'phoneNumber': '+9611123456',
                'emailAddress': 'coordinator@aub.edu.lb',
                'confidenceNotes': 'Gemini extracted the direct contact fields from the uploaded evidence.',
            }, '')
        ) as mock_gemini:
            result, error = extract_textbox_section(
                'background',
                'A. Contact Information',
                {},
                [upload],
            )

        self.assertIsNone(error)
        self.assertTrue(mock_gemini.called)
        self.assertEqual(set(result['appliedFields']), {'contactName', 'positionTitle', 'officeLocation', 'phoneNumber', 'emailAddress'})
        self.assertEqual(result['mergedFields']['contactName'], 'Dr. Karim Haddad')
        self.assertEqual(result['mergedFields']['positionTitle'], 'Program Coordinator')

    def test_structured_fields_only_section_skips_llama_when_fields_are_already_filled(self):
        current_state = {
            'fields': {
                'total_number_of_offices': '12',
                'average_workspace_size': '18.5',
                'student_availability_details': 'Faculty office hours are posted weekly.',
            },
            'rows': [],
        }
        upload = SimpleUploadedFile('offices.txt', b'Office information.')

        with patch('abet_criteria.textbox_ai._run_ollama_command') as mock_run:
            result, error = extract_structured_section(
                'criterion7',
                'A. Offices',
                current_state,
                [upload],
            )

        self.assertIsNone(error)
        self.assertFalse(mock_run.called)
        self.assertEqual(result['rows'], [])
        self.assertEqual(result['extractedFields'], current_state['fields'])
        self.assertIn('already filled', result['confidenceNotes'])

    def test_background_review_date_allows_today(self):
        today = timezone.localdate()

        parsed, error = _validate_background_review_date(today.isoformat())

        self.assertIsNone(error)
        self.assertEqual(parsed, today)

    def test_background_review_date_allows_blank(self):
        parsed, error = _validate_background_review_date('')

        self.assertIsNone(parsed)
        self.assertIsNone(error)

    def test_background_review_date_rejects_future_dates(self):
        future_date = timezone.localdate() + timedelta(days=1)

        parsed, error = _validate_background_review_date(future_date.isoformat())

        self.assertIsNone(parsed)
        self.assertEqual(error, 'Date of Last General Review cannot be in the future.')
