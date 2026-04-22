import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
PROGRAM_ID = 6
CYCLE_ID = 19


COURSE_TITLES = {
    "EECE 210": "Electric Circuits",
    "EECE 230": "Introduction to Programming and Problem Solving",
    "EECE 455": "Computer Communication Networks",
}

FACULTY = [
    {
        "id": 5,
        "full_name": "Dr. Imad Moukadem",
        "academic_rank": "Professor",
        "appointment_type": "Full-time",
        "email": "imad.moukadem@aub.edu.lb",
        "office_hours": "Mon/Wed 13:00-15:00",
        "qualification": ("PhD Electrical and Computer Engineering", "University of Michigan", 2004, 6, 18),
        "certifications": ["IEEE Senior Member", "ABET Program Evaluator Training"],
        "memberships": ["Institute of Electrical and Electronics Engineers (IEEE) - Senior Member (2016)", "ASEE Middle East Section - Member (2019)"],
        "development": ["Completed ABET outcomes assessment workshop (2025)", "Attended IEEE EDUCON on engineering pedagogy (2024)"],
        "industry": ["Technical consultant on embedded systems and communications projects with regional telecom and automation partners (2014-2018)"],
        "honors": ["Faculty Teaching Excellence Award (2023)"],
        "services": ["Chair, Department Curriculum Committee (2024-Present)"],
        "publications": [
            "I. Moukadem et al., 'Low-power embedded platforms for edge sensing applications,' IEEE Access, 2024.",
            "I. Moukadem and collaborators, 'Assessment-informed redesign of introductory circuits laboratories,' ASEE Annual Conference, 2023.",
        ],
    },
    {
        "id": 6,
        "full_name": "Dr. Lina Saab",
        "academic_rank": "Associate Professor",
        "appointment_type": "Full-time",
        "email": "lina.saab@aub.edu.lb",
        "office_hours": "Tue/Thu 10:00-12:00",
        "qualification": ("PhD Computer Engineering", "Georgia Institute of Technology", 2011, 4, 11),
        "certifications": ["Cisco Certified Network Associate (academic)", "ABET Program Assessment Workshop Certificate"],
        "memberships": ["IEEE Communications Society - Member (2017)", "ACM - Member (2018)"],
        "development": ["Completed advanced training in outcomes-based accreditation assessment (2025)", "Participated in cybersecurity curriculum development workshop (2024)"],
        "industry": ["Collaborated with communications and networking startups on applied network performance studies (2016-2019)"],
        "honors": ["Outstanding Advising Recognition (2022)"],
        "services": ["Coordinator, Undergraduate Assessment and Continuous Improvement Committee (2023-Present)"],
        "publications": [
            "L. Saab et al., 'Traffic-aware routing strategies for campus-scale networks,' IEEE Transactions on Network and Service Management, 2024.",
            "L. Saab, 'Integrating communication systems experiments into undergraduate networking labs,' EDUCON, 2023.",
        ],
    },
    {
        "id": 7,
        "full_name": "Dr. Ali Hassan",
        "academic_rank": "Assistant Professor",
        "appointment_type": "Full-time",
        "email": "ali.hassan@aub.edu.lb",
        "office_hours": "Wed 14:00-17:00",
        "qualification": ("PhD Computer and Communications Engineering", "Imperial College London", 2018, 3, 6),
        "certifications": ["Cisco DevNet Associate"],
        "memberships": ["IEEE - Member (2020)", "Internet Society - Member (2021)"],
        "development": ["Attended wireless systems laboratory modernization workshop (2025)", "Completed inclusive teaching in engineering seminar (2024)"],
        "industry": ["Worked on applied network simulation and protocol evaluation with industry collaborators (2018-2020)"],
        "honors": ["Early Career Research Award (2024)"],
        "services": ["Faculty advisor for communications engineering student competition teams (2024-Present)"],
        "publications": [
            "A. Hassan et al., 'QoS-aware edge offloading for communication-intensive applications,' Computer Networks, 2024.",
        ],
    },
]

COURSE_SECTIONS = {
    1: {
        "term": "Fall 2026",
        "faculty_id": 5,
        "description": "Analysis of dc and ac electric circuits, circuit laws and theorems, first-order and second-order transient response, operational amplifiers, and laboratory-supported problem solving.",
        "outline": "Week 1: Electrical variables, units, and circuit elements\nWeek 2: Kirchhoff laws and equivalent circuits\nWeek 3: Nodal and mesh analysis\nWeek 4: Source transformations and network theorems\nWeek 5: Operational amplifiers and ideal models\nWeek 6: First-order RC and RL circuits\nWeek 7: Midterm review and problem session\nWeek 8: Natural and forced response of first-order circuits\nWeek 9: Second-order circuits and transient behavior\nWeek 10: Sinusoidal steady-state analysis\nWeek 11: Phasors, impedance, and admittance\nWeek 12: AC power and power factor\nWeek 13: Frequency response concepts\nWeek 14: Integrated design-oriented laboratory exercises\nWeek 15: Final review and attainment reflection",
        "design_pct": 15,
        "tools": "MATLAB, Multisim, oscilloscope, function generator",
        "textbooks": [("Fundamentals of Electric Circuits, Alexander & Sadiku, 2021", "Primary"), ("Engineering Circuit Analysis, Hayt, Kemmerly & Durbin, 2019", "Reference")],
        "supplements": ["Laboratory handouts for circuit measurements and op-amp experiments", "Problem-solving worksheets and MATLAB examples"],
        "prereqs": ["MATH 201"],
        "coreqs": [],
        "assessments": [("Homework and quizzes", 15), ("Laboratory reports", 15), ("Midterm exam", 30), ("Final exam", 40)],
        "clo_defs": [
            ("Analyze dc and ac circuits using appropriate laws, theorems, and computational methods.", "Introduced", 2),
            ("Interpret laboratory measurements and compare experimental data with theoretical circuit models.", "Reinforced", 7),
        ],
    },
    2: {
        "term": "Fall 2026",
        "faculty_id": 5,
        "description": "Introduction to algorithmic thinking, structured programming, functions, data structures, file handling, and debugging using engineering problem-solving examples.",
        "outline": "Week 1: Computational thinking and program structure\nWeek 2: Variables, expressions, and input/output\nWeek 3: Selection and iteration constructs\nWeek 4: Modular design with functions\nWeek 5: Lists, strings, and dictionaries\nWeek 6: Problem decomposition and algorithm design\nWeek 7: Midterm review and coding practice\nWeek 8: Files and exception handling\nWeek 9: Introductory object-oriented programming concepts\nWeek 10: Testing and debugging strategies\nWeek 11: Numerical computing for engineering applications\nWeek 12: Data visualization and reporting\nWeek 13: Small-team programming project workshops\nWeek 14: Project integration and peer review\nWeek 15: Final demonstrations and reflection",
        "design_pct": 20,
        "tools": "Python, Jupyter, Git, VS Code",
        "textbooks": [("Python for Engineers and Scientists, Navidi, 2022", "Primary"), ("Think Python, Downey, 2024", "Reference")],
        "supplements": ["Programming lab exercises", "Version control quick-start guide"],
        "prereqs": [],
        "coreqs": [],
        "assessments": [("Programming assignments", 30), ("Laboratory participation", 10), ("Midterm exam", 25), ("Final project", 15), ("Final exam", 20)],
        "clo_defs": [
            ("Develop correct and readable Python programs for introductory engineering problems.", "Introduced", 2),
            ("Communicate algorithm choices, test evidence, and results effectively in code documentation and reports.", "Reinforced", 4),
        ],
    },
    3: {
        "term": "Fall 2026",
        "faculty_id": 6,
        "description": "Principles of data communications and computer networks including layered architectures, transmission media, switching, routing, congestion control, and performance evaluation.",
        "outline": "Week 1: Networked systems overview and layered models\nWeek 2: Physical media and digital transmission concepts\nWeek 3: Data link protocols and framing\nWeek 4: Error detection, flow control, and medium access\nWeek 5: Switching and LAN technologies\nWeek 6: IP addressing and subnetting\nWeek 7: Midterm review and packet analysis lab\nWeek 8: Routing fundamentals and path selection\nWeek 9: Transport protocols and congestion control\nWeek 10: Application-layer protocols and services\nWeek 11: Wireless and mobile networking overview\nWeek 12: Network performance metrics and measurement\nWeek 13: Security fundamentals for communication networks\nWeek 14: Design case studies for campus and enterprise networks\nWeek 15: Final project presentations and review",
        "design_pct": 25,
        "tools": "Wireshark, Cisco Packet Tracer, Python network scripts",
        "textbooks": [("Computer Networking: A Top-Down Approach, Kurose & Ross, 2021", "Primary"), ("Data and Computer Communications, Stallings, 2021", "Reference")],
        "supplements": ["Packet capture laboratory manual", "Network design case-study briefs"],
        "prereqs": ["EECE 230"],
        "coreqs": [],
        "assessments": [("Homework and quizzes", 15), ("Laboratory exercises", 15), ("Midterm exam", 25), ("Design project", 20), ("Final exam", 25)],
        "clo_defs": [
            ("Explain and evaluate the behavior of layered communication protocols and network architectures.", "Reinforced", 2),
            ("Design and justify a small-scale network solution using appropriate technical, economic, and performance considerations.", "Mastered", 3),
        ],
    },
    10: {
        "term": "Fall 2027",
        "faculty_id": 6,
        "description": "Continuation offering of Electric Circuits with harmonized learning outcomes, laboratory exercises, and attainment assessment across course sections.",
        "outline": "Week 1: Course orientation and review of electrical quantities\nWeek 2: Resistive circuit analysis methods\nWeek 3: Equivalent circuits and superposition\nWeek 4: Operational amplifier applications\nWeek 5: First-order transient analysis\nWeek 6: Second-order circuit response\nWeek 7: Midterm review\nWeek 8: Sinusoidal steady-state fundamentals\nWeek 9: Phasor analysis and impedance\nWeek 10: AC power calculations\nWeek 11: Frequency response and filters\nWeek 12: Laboratory measurement interpretation\nWeek 13: Integrated problem-solving workshop\nWeek 14: Design applications in circuits\nWeek 15: Final review",
        "design_pct": 15,
        "tools": "MATLAB, Multisim, oscilloscope, function generator",
        "textbooks": [("Fundamentals of Electric Circuits, Alexander & Sadiku, 2021", "Primary")],
        "supplements": ["Common lab rubrics and measurement worksheets"],
        "prereqs": ["MATH 201"],
        "coreqs": [],
        "assessments": [("Homework and quizzes", 15), ("Laboratory reports", 15), ("Midterm exam", 30), ("Final exam", 40)],
        "clo_defs": [
            ("Analyze dc and ac circuits using appropriate laws, theorems, and computational methods.", "Introduced", 2),
            ("Interpret laboratory measurements and compare experimental data with theoretical circuit models.", "Reinforced", 7),
        ],
    },
}


def next_id(cur, table, pk):
    value = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()[0]
    return int(value or 1)


def replace_children(cur, table, pk, parent_col, parent_id, rows):
    cur.execute(f"DELETE FROM {table} WHERE {parent_col} = ?", (parent_id,))
    next_pk = next_id(cur, table, pk)
    return next_pk


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("UPDATE PROGRAM SET program_name = ?, program_level = ? WHERE program_id = ?", ("Computer and Communications Engineering", "Undergraduate", PROGRAM_ID))
    cur.execute("UPDATE ACCREDIATION_CYCLE SET Start_year = ?, End_year = ?, Overall_Progress_Percentage = ? WHERE Cycle_ID = ?", (2026, 2028, 68.0, CYCLE_ID))

    cur.execute("DELETE FROM ASSIGNED_TO WHERE program_id = ?", (PROGRAM_ID,))
    for faculty in FACULTY:
        cur.execute(
            """
            INSERT INTO FACULTY_MEMBER (Faculty_ID, Full_Name, Academic_Rank, Appointment_Type, Email, Office_Hours)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(Faculty_ID) DO UPDATE SET
              Full_Name=excluded.Full_Name,
              Academic_Rank=excluded.Academic_Rank,
              Appointment_Type=excluded.Appointment_Type,
              Email=excluded.Email,
              Office_Hours=excluded.Office_Hours
            """,
            (faculty["id"], faculty["full_name"], faculty["academic_rank"], faculty["appointment_type"], faculty["email"], faculty["office_hours"]),
        )
        cur.execute("INSERT INTO ASSIGNED_TO (program_id, Faculty_ID) VALUES (?, ?)", (PROGRAM_ID, faculty["id"]))

        cur.execute("DELETE FROM QUALIFICATION WHERE Faculty_ID = ?", (faculty["id"],))
        qual_id = next_id(cur, "QUALIFICATION", "Qualification_ID")
        degree_field, degree_inst, degree_year, industry_years, institution_years = faculty["qualification"]
        cur.execute(
            """
            INSERT INTO QUALIFICATION (Qualification_ID, Degree_Field, Degree_Institution, Degree_Year, Years_Industry_Government, Years_At_Institution, Faculty_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (qual_id, degree_field, degree_inst, degree_year, industry_years, institution_years, faculty["id"]),
        )

        for table, pk, col, values in [
            ("CERTIFICATION", "Certification_ID", "Certification_title", faculty["certifications"]),
            ("PROFESSIONAL_MEMBERSHIP", "Membership_ID", "Membership_Description", faculty["memberships"]),
            ("INDUSTRY_EXPERIENCE", "Experience_ID", "Experience_discription", faculty["industry"]),
            ("HONOR_AWARD", "Award_ID", "Award_discription", faculty["honors"]),
            ("SERVICE_ACTIVITY", "Service_ID", "Service_Description", faculty["services"]),
            ("PUBLICATION", "Publication_ID", "Publication_Discription", faculty["publications"]),
        ]:
            cur.execute(f"DELETE FROM {table} WHERE Faculty_ID = ?", (faculty["id"],))
            start = next_id(cur, table, pk)
            for offset, value in enumerate(values):
                cur.execute(
                    f"INSERT INTO {table} ({pk}, {col}, Faculty_ID) VALUES (?, ?, ?)",
                    (start + offset, value, faculty["id"]),
                )

    criterion1_id = cur.execute("SELECT criterion1_id FROM CRITERION_1_STUDENTS WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE CRITERION_1_STUDENTS
        SET admission_requirements = ?,
            admission_process_summary = ?,
            transfer_pathways = ?,
            pperformance_evaluation_process = ?,
            prerequisite_verification_method = ?,
            prerequisite_not_met_action = ?,
            transfer_policy_summary = ?,
            transfer_credit_evaluation_process = ?,
            articulation_agreements = ?,
            advising_providers = ?,
            advising_frequency = ?,
            career_guidance_description = ?,
            work_in_lieu_policies = ?,
            work_in_lieu_approval_process = ?,
            minimum_required_credits = ?,
            required_gpa_or_standing = ?,
            essential_courses_categories = ?,
            degree_name = ?,
            transcript_format_explanation = ?,
            program_name_on_transcript = ?
        WHERE criterion1_id = ?
        """,
        (
            "Applicants to the BE in Computer and Communications Engineering must satisfy AUB undergraduate admission requirements and demonstrate strong preparation in mathematics, physics, and problem solving.",
            "Applications are reviewed through the university admissions process and the Faculty of Engineering and Architecture. Academic preparation, school performance, and readiness for the engineering curriculum are considered before admission decisions are finalized.",
            "Transfer students from recognized institutions may enter the program after transcript evaluation and departmental review of course equivalencies.",
            "Student performance is monitored each semester through course grades, progression checks, probation rules, advising interventions, and graduation audits.",
            "Prerequisites are verified using the registration system, departmental advising review, and syllabus-based course sequencing rules before advanced enrollment is approved.",
            "Students who do not satisfy prerequisites are required to revise their schedules with an academic advisor and complete the missing background before progressing.",
            "Transfer credit is accepted only for courses with satisfactory grades and content comparable to AUB program requirements.",
            "The department reviews prior syllabi, credit hours, and learning outcomes before recommending transfer equivalency to the Registrar.",
            "The program uses case-by-case transfer evaluation and approved institutional arrangements where applicable to support student mobility while maintaining curriculum integrity.",
            "Academic advising is provided by assigned faculty advisors, the department chair, and faculty academic support staff.",
            "Students are formally advised during each registration cycle and additionally whenever they are on probation, changing plans of study, or preparing for graduation.",
            "Career guidance includes faculty mentoring, capstone and internship support, employer engagement sessions, and access to university career services resources.",
            "Approved transfer credit, exchange-study equivalencies, and other formally documented academic substitutions may satisfy requirements only when learning outcomes and rigor are equivalent.",
            "Requests are reviewed by the department and the Registrar and approved only after documentation shows alignment with course outcomes and curriculum expectations.",
            145,
            "2.0",
            "Mathematics and basic sciences, engineering topics, computing and communications courses, general education, and capstone design.",
            "Bachelor of Engineering in Computer and Communications Engineering",
            "Official transcripts list all attempted and earned credits, grades, cumulative indicators, and the awarded degree according to the Registrar format.",
            "Bachelor of Engineering in Computer and Communications Engineering",
            criterion1_id,
        ),
    )

    criterion2_id = cur.execute("SELECT criterion2_id FROM ACCREDIATION_CYCLE WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE CRITERION_2_PEOS
        SET institutional_mission_statement = ?,
            program_mission_statement = ?,
            mission_source_link = ?,
            peos_list = ?,
            peos_short_descriptions = ?,
            peos_publication_location = ?,
            peos_mission_alignment_explanation = ?,
            constituencies_list = ?,
            constituencies_contribution_description = ?,
            peo_review_frequency = ?,
            peo_review_participants = ?,
            feedback_collection_and_decision_process = ?,
            changes_since_last_peo_review = ?
        WHERE criterion2_id = ?
        """,
        (
            "AUB advances learning, discovery, and service through high-quality education, research, and engagement with Lebanon, the region, and the wider world.",
            "The program prepares graduates for engineering practice and advanced study in computer and communications engineering through strong technical foundations, design competence, ethical responsibility, and lifelong learning.",
            "https://www.aub.edu.lb/",
            "PEO-1\nPEO-2\nPEO-3\nPEO-4",
            "PEO-1: Build successful careers in computer and communications engineering and related fields.\nPEO-2: Pursue graduate study, professional certifications, or specialized technical development when aligned with career goals.\nPEO-3: Lead and contribute effectively in multidisciplinary and multicultural engineering environments.\nPEO-4: Practice engineering responsibly with commitment to ethics, innovation, and lifelong learning.",
            "Published in departmental assessment documents, advising resources, and the accreditation evidence repository.",
            "The program educational objectives align with AUB’s mission by emphasizing technical excellence, critical inquiry, service, ethical responsibility, and leadership in a rapidly evolving engineering profession.",
            "Current students, alumni, employers, faculty, capstone sponsors, and the industrial advisory board.",
            "Constituencies provide feedback through surveys, advisory-board discussions, capstone reviews, internship observations, and faculty assessment meetings.",
            "Every 3 years, with interim discussions when major curriculum or market changes occur.",
            "Department faculty, program coordinator, advisory board members, selected alumni, and employer representatives.",
            "Assessment and advisory feedback are reviewed by the departmental assessment committee and faculty, and resulting recommendations are incorporated into objective review and curriculum planning.",
            "The latest review clarified graduate-study language, strengthened emphasis on responsible engineering practice, and aligned publication locations across advising and accreditation materials.",
            criterion2_id,
        ),
    )

    cur.execute("DELETE FROM PEO WHERE program_id = ?", (PROGRAM_ID,))
    peo_start = next_id(cur, "PEO", "peo_id")
    peos = [
        ("P6-PEO1", "Graduates will establish successful careers in computer and communications engineering and related fields."),
        ("P6-PEO2", "Graduates will pursue advanced study, professional growth, or specialized certifications as appropriate to their goals."),
        ("P6-PEO3", "Graduates will contribute effectively as team members and emerging leaders in diverse technical environments."),
        ("P6-PEO4", "Graduates will practice engineering ethically and continue lifelong learning in response to evolving technologies."),
    ]
    for idx, (code, desc) in enumerate(peos):
        cur.execute("INSERT INTO PEO (peo_id, peo_code, peo_description, program_id) VALUES (?, ?, ?, ?)", (peo_start + idx, code, desc, PROGRAM_ID))

    cur.execute("DELETE FROM STUDENT_OUTCOME WHERE program_id = ?", (PROGRAM_ID,))
    so_start = next_id(cur, "STUDENT_OUTCOME", "so_id")
    sos = [
        ("P6-SO1", "Ability to identify, formulate, and solve complex engineering problems by applying principles of engineering, science, and mathematics."),
        ("P6-SO2", "Ability to apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, and welfare, as well as global, cultural, social, environmental, and economic factors."),
        ("P6-SO3", "Ability to communicate effectively with a range of audiences."),
        ("P6-SO4", "Ability to recognize ethical and professional responsibilities in engineering situations and make informed judgments that consider the impact of engineering solutions in global, economic, environmental, and societal contexts."),
        ("P6-SO5", "Ability to function effectively on a team whose members together provide leadership, create a collaborative and inclusive environment, establish goals, plan tasks, and meet objectives."),
        ("P6-SO6", "Ability to develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions."),
        ("P6-SO7", "Ability to acquire and apply new knowledge as needed, using appropriate learning strategies."),
    ]
    so_ids = {}
    for idx, (code, desc) in enumerate(sos):
        so_id = so_start + idx
        so_ids[code] = so_id
        cur.execute("INSERT INTO STUDENT_OUTCOME (so_id, so_code, so_discription, program_id) VALUES (?, ?, ?, ?)", (so_id, code, desc, PROGRAM_ID))

    criterion5_id = cur.execute("SELECT criterion5_id FROM ACCREDIATION_CYCLE WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE CRITERION_5_CURRICULUM
        SET academic_calender_type = ?,
            plan_of_study_description = ?,
            curriculum_alignment_description = ?,
            prerequisites_support_description = ?,
            prerequisite_flowchart_description = ?,
            hours_depth_by_subject_area_description = ?,
            broad_education_component_description = ?,
            cooperative_education_description = ?,
            materials_available_description = ?,
            culminating_design_experience = ?,
            Curricular_paths = ?
        WHERE criterion5_id = ?
        """,
        (
            "Semester",
            "The plan of study progresses from mathematics, programming, circuits, and basic sciences into digital systems, communications, embedded computing, and a culminating capstone design sequence.",
            "Required courses and electives are mapped to ABET student outcomes and program educational objectives through regular curriculum review and syllabus-level CLO/SO alignment.",
            "Prerequisite chains ensure students develop mathematical, programming, and hardware foundations before entering advanced communications, systems, and capstone courses.",
            "A documented prerequisite flowchart is maintained by the department and used during advising and registration planning.",
            "The curriculum includes sufficient mathematics and science, engineering topics, computing content, and design depth to support the BE degree in computer and communications engineering.",
            "General education coursework in communication, humanities, social sciences, and ethics complements the technical curriculum and broadens professional preparation.",
            "Students may complete internship and practical training experiences that reinforce classroom learning and expose them to professional engineering environments.",
            "Students and faculty have access to current textbooks, laboratory manuals, licensed software, network simulation platforms, and shared technical infrastructure supporting the curriculum.",
            "The culminating design sequence requires teams to define requirements, evaluate alternatives, apply standards and constraints, build prototypes or validated designs, and communicate results.",
            "Communications and Networking Focus; Embedded and Computer Systems Focus",
            criterion5_id,
        ),
    )

    cur.execute(
        """
        UPDATE BACKGROUND_INFO
        SET program_contact_name = ?, contact_title = ?, office_location = ?, phone_number = ?, email_address = ?,
            year_implemented = ?, last_general_review_date = ?, summary_of_major_changes = ?
        WHERE Cycle_ID = ?
        """,
        (
            "Dr. Lina Saab",
            "Program Coordinator",
            "Bechtel Engineering Building, Room 512",
            "+961 1 350000",
            "lina.saab@aub.edu.lb",
            2002,
            "2025-06-15",
            "Recent improvements include refreshed networking laboratory equipment, stronger CLO/SO alignment in core EECE courses, revised assessment rubrics for communication and design outcomes, expanded employer engagement in capstone review, and improved evidence organization within the Accreditation Data Management System.",
            CYCLE_ID,
        ),
    )

    criterion6_id = cur.execute("SELECT criterion6_id FROM CRITERION_6_FACULTY WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE CRITERION_6_FACULTY
        SET faculty_composition_narrative = ?,
            faculty_worklaod_expectations_description = ?,
            workload_expectations_desciption = ?,
            faculty_size_adequacy_description = ?,
            advising_and_student_interaction_description = ?,
            service_and_industry_engagement_description = ?,
            course_creation_role_description = ?,
            peo_ro_role_description = ?,
            leadership_roles_description = ?
        WHERE criterion6_id = ?
        """,
        (
            "The faculty supporting the program combine expertise in circuits, programming, networking, embedded systems, and engineering design, with a mix of scholarly activity, teaching experience, and professional engagement relevant to the curriculum.",
            "Faculty workload assignments balance teaching, assessment, research, advising, and service responsibilities while preserving capacity for curriculum development and student mentorship.",
            "Faculty workload assignments balance teaching, assessment, research, advising, and service responsibilities while preserving capacity for curriculum development and student mentorship.",
            "Current faculty size is adequate to deliver the curriculum, supervise laboratories and capstone teams, advise students, and support continuous improvement activities.",
            "Faculty hold regular office hours, advise students during registration and probation periods, and provide sustained mentoring through projects, internships, and capstone design.",
            "Faculty contribute through university committees, outreach, professional societies, and selected collaborations with industry and external stakeholders.",
            "Faculty lead course design, review syllabi and CLO alignment, update assessment methods, and refine content in response to outcome attainment evidence and disciplinary developments.",
            "Faculty participate in defining, reviewing, and evaluating PEOs and student outcomes through assessment committee work, curriculum discussions, and documented continuous improvement meetings.",
            "Faculty serve as program coordinators, committee chairs, and assessment leads, and collaborate with departmental and faculty leadership on planning and resource prioritization.",
            criterion6_id,
        ),
    )

    cur.execute("DELETE FROM FACULTY_QUALIFICATION_ROW WHERE criterion6_id = ?", (criterion6_id,))
    fq_id = next_id(cur, "FACULTY_QUALIFICATION_ROW", "faculty_qualification_row_id")
    qualification_rows = [
        (faculty["id"], faculty["qualification"][0], faculty["qualification"][2], faculty["academic_rank"], faculty["appointment_type"], "Full-time", faculty["qualification"][3], 12 if faculty["id"] == 5 else 8 if faculty["id"] == 6 else 6, faculty["qualification"][4], ", ".join(faculty["certifications"][:2]))
        for faculty in FACULTY
    ]
    for offset, row in enumerate(qualification_rows):
        cur.execute(
            """
            INSERT INTO FACULTY_QUALIFICATION_ROW
            (faculty_qualification_row_id, highest_degree_field, highest_degree_year, academic_rank, academic_appointment,
             full_time_or_part_time, years_gov_industry, years_teaching, years_at_institution, professional_registration, criterion6_id, Faculty_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (fq_id + offset, row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], criterion6_id, row[0]),
        )

    cur.execute("DELETE FROM FACULTY_WORKLOAD_ROW WHERE criterion6_id = ?", (criterion6_id,))
    fw_id = next_id(cur, "FACULTY_WORKLOAD_ROW", "faculty_workload_row_id")
    workload_rows = [
        (5, "Full-time", "EECE 210 Electric Circuits; EECE 230 Introduction to Programming and Problem Solving", "Fall", 2026, 1),
        (6, "Full-time", "EECE 455 Computer Communication Networks; EECE 210 Electric Circuits", "Fall", 2027, 3),
        (7, "Full-time", "Supports advanced networking and embedded systems electives; contributes to capstone supervision", "Spring", 2027, 3),
    ]
    for offset, row in enumerate(workload_rows):
        cur.execute(
            """
            INSERT INTO FACULTY_WORKLOAD_ROW
            (faculty_workload_row_id, fill_tie_or_part_time, classes_taught_description, term, year, criterion6_id, Faculty_ID, Course_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (fw_id + offset, row[1], row[2], row[3], row[4], criterion6_id, row[0], row[5]),
        )

    cur.execute("DELETE FROM PROFESSIONAL_DEVELOPMENT WHERE criterion6_id = ?", (criterion6_id,))
    pd_id = next_id(cur, "PROFESSIONAL_DEVELOPMENT", "Development_ID")
    pd_rows = [
        (5, "ABET assessment and rubric calibration workshop for engineering faculty"),
        (5, "IEEE engineering education conference participation"),
        (6, "Networking laboratory modernization training"),
        (7, "Inclusive teaching and mentoring workshop for engineering courses"),
    ]
    for offset, row in enumerate(pd_rows):
        cur.execute(
            "INSERT INTO PROFESSIONAL_DEVELOPMENT (Development_ID, Activity_Description, Faculty_ID, criterion6_id) VALUES (?, ?, ?, ?)",
            (pd_id + offset, row[1], row[0], criterion6_id),
        )

    criterion7_id = cur.execute("SELECT criterion7_id FROM CRITERION_7_FACILITIES WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE CRITERION_7_FACILITIES
        SET total_number_of_offices = ?, average_workspace_size = ?, guidance_description = ?, responsible_faculty_name = ?,
            maintenance_policy_description = ?, technical_collections_and_journals = ?, electronic_databases_and_eresources = ?,
            faculty_book_request_process = ?, library_access_hours_and_systems = ?, facilities_support_student_outcomes = ?,
            safety_and_inspection_processes = ?, compliance_with_university_policy = ?, student_availability_details = ?, is_complete = ?
        WHERE criterion7_id = ?
        """,
        (
            24,
            14.5,
            "Students receive orientation on laboratories, computing access, equipment checkout, and safety procedures at the start of each term. Refresher guidance is provided in lab-intensive courses and capstone design.",
            "Dr. Lina Saab",
            "Teaching spaces are reviewed each semester, lab equipment is maintained on a preventive schedule, and high-use instructional platforms are upgraded through annual budgeting and departmental planning.",
            "AUB Libraries provide engineering monographs, standards references, and journal collections supporting electrical, computer, and communications engineering instruction.",
            "Students and faculty have access to major engineering databases and publisher platforms through campus networks and approved remote-access services.",
            "Faculty submit requests through library acquisition channels and department planning meetings; requests are prioritized based on curriculum relevance and student demand.",
            "Library spaces operate on extended academic hours, and electronic catalogs, databases, and authentication services are available to authorized users throughout the week.",
            "Classrooms, laboratories, and computing resources support experimentation, design, teamwork, communication, and professional practice across the curriculum.",
            "Laboratory safety briefings, equipment logs, periodic inspections, and incident-reporting procedures are coordinated with departmental staff and university safety offices.",
            "All instructional spaces operate under university policies for safety, procurement, accessibility, information technology use, and scheduled maintenance.",
            "Faculty office hours are posted each semester, advising meetings are available during registration and probation periods, and departmental support staff provide weekday assistance.",
            1,
            criterion7_id,
        ),
    )

    for table in ["CLASSROOMS", "LABORATORIES", "COMPUTING_RESOURCES", "UPGRADING_FACILITES"]:
        cur.execute(f"DELETE FROM {table} WHERE criterion7_id = ?", (criterion7_id,))

    cur.execute("INSERT INTO CLASSROOMS (classroom_id, classroom_room, classroom_capacity, classroom_multimedia, classroom_internet_access, classroom_typical_use, classroom_adequacy_comments, criterion7_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (next_id(cur, "CLASSROOMS", "classroom_id"), "Bechtel 201", 48, "Dual-display projector, lecture capture, document camera", "Campus Wi-Fi and wired instructor station", "Core EECE lectures and seminars", "Adequate for medium-size sections with hybrid presentation support", criterion7_id))
    cur.execute("INSERT INTO LABORATORIES (lab_id, lab_name, lab_room, lab_category, lab_hardware_list, lab_software_list, lab_open_hours, lab_courses_using_lab, criterion7_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (next_id(cur, "LABORATORIES", "lab_id"), "Embedded and Digital Systems Laboratory", "Bechtel B12", "Computer and Communications Engineering", "Oscilloscopes, logic analyzers, FPGA boards, microcontroller kits", "MATLAB, Vivado, Quartus, Python toolchains", "Mon-Fri 08:00-18:00", "EECE 210, EECE 230, EECE 455", criterion7_id))
    cur.execute("INSERT INTO COMPUTING_RESOURCES (computing_resources_id, computing_resource_name, computing_resource_location, computing_adequacy_notes, computing_hours_available, computing_access_type, criterion7_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (next_id(cur, "COMPUTING_RESOURCES", "computing_resources_id"), "Engineering Instructional Computing Cluster", "Faculty of Engineering and Architecture networked labs", "Capacity supports simulation, programming, and capstone workflows", "Extended daily access; remote services available after hours", "On-campus access with approved remote/VPN services", criterion7_id))
    cur.execute("INSERT INTO UPGRADING_FACILITES (facility_id, facility_name, last_upgrade_date, next_scheduled_upgrade, responsible_staff, maintenance_notes, criterion7_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (next_id(cur, "UPGRADING_FACILITES", "facility_id"), "Embedded and Digital Systems Laboratory", "2025-08-15", "2027-06-01", "Department laboratory engineer and IT support team", "Bench instrumentation calibrated before each academic year; development boards refreshed on a rolling cycle", criterion7_id))

    criterion8_id = cur.execute("SELECT criterion8_id FROM CRITERION_8_INSTITUTIONAL_SUPPORT WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE CRITERION_8_INSTITUTIONAL_SUPPORT
        SET leadership_structure_description = ?, leadership_adequacy_description = ?, leadership_participation_description = ?,
            budget_process_continuity = ?, teaching_support_description = ?, infrastructure_funding_description = ?,
            resource_adequacy_description = ?, hiring_process_description = ?, retention_strategies_description = ?,
            professional_development_support_types = ?, professional_development_request_process = ?,
            professional_development_funding_details = ?, Additional_narrative_on_staffing = ?
        WHERE criterion8_id = ?
        """,
        (
            "Program leadership is exercised through the department chair, program coordinator, assessment committee, and faculty committees, with academic oversight by the dean and provost.",
            "The leadership structure provides continuity for curriculum planning, assessment follow-up, faculty coordination, and resource prioritization across the accreditation cycle.",
            "Department leadership reviews curriculum changes, faculty assignments, assessment findings, and strategic resource requests through scheduled committee and faculty meetings.",
            "Budget planning follows the annual university process, with departmental priorities consolidated and submitted through faculty leadership to support instruction, laboratories, and assessment activities.",
            "Teaching support includes laboratory engineers, technical staff, software licensing, classroom technology services, and scheduling support coordinated through the faculty and central units.",
            "Instructional infrastructure is funded through recurring operating budgets, targeted equipment renewals, and strategic capital requests tied to curriculum and lab needs.",
            "Current financial and staffing support is adequate to sustain the curriculum, maintain essential laboratories, and address routine upgrades associated with student outcomes.",
            "Faculty searches are conducted through approved search committees, international advertising, peer review, dean-level endorsement, and university approval workflows.",
            "Retention is supported through mentoring, annual review, recognition of teaching and research performance, professional growth opportunities, and balanced workload planning.",
            "Conference travel support, pedagogy workshops, research leave, technical training, certification support, and internal grants for teaching enhancement.",
            "Faculty submit requests through department and faculty approval channels with documented alignment to teaching, research, service, or accreditation needs.",
            "Support is reviewed annually and allocated according to budget availability, strategic relevance, participation history, and expected impact on instruction or scholarship.",
            "Staffing levels for administrative, technical, and instructional support are reviewed with department leadership to ensure continuity of laboratory operation, student support, and accreditation evidence management.",
            criterion8_id,
        ),
    )
    cur.execute("DELETE FROM STAFFING_ROW WHERE criterion8_id = ?", (criterion8_id,))
    staff_id = next_id(cur, "STAFFING_ROW", "staffing_row_id")
    staff_rows = [
        ("Administrative", 4, "Student records coordination, scheduling support, purchasing follow-up, and accreditation documentation support", "Cross-training on registrar workflows, document management, and handover procedures"),
        ("Technical", 6, "Laboratory setup, equipment maintenance, software deployment, and safety compliance support", "Annual safety refreshers, vendor-specific equipment training, and documented maintenance procedures"),
        ("Instructional Assistants", 10, "Lab supervision, tutorial support, grading assistance, and student project mentoring", "Pre-semester orientation, rubric calibration, and faculty supervision for TA assignments"),
    ]
    for offset, row in enumerate(staff_rows):
        cur.execute("INSERT INTO STAFFING_ROW (staffing_row_id, category, number_of_staff, primary_role, training_retention_practices, criterion8_id) VALUES (?, ?, ?, ?, ?, ?)",
                    (staff_id + offset, row[0], row[1], row[2], row[3], criterion8_id))

    appendix_d_id = cur.execute("SELECT appendix_d_id FROM APPENDIX_D_INSTITUTION WHERE Cycle_ID = ?", (CYCLE_ID,)).fetchone()[0]
    cur.execute(
        """
        UPDATE APPENDIX_D_INSTITUTION
        SET institution_name = ?, institutiton_address = ?, chief_executive_name = ?, chief_ececutive_title = ?,
            self_study_submitter_name = ?, self_study_submitter_title = ?, institutional_accreditations = ?,
            accreditation_evalutaion_dates = ?, control_type_description = ?, administrative_chain_description = ?,
            organization_chart_file_reference = ?, credit_hour_definition = ?, deviations_from_standard = ?
        WHERE appendix_d_id = ?
        """,
        (
            "American University of Beirut, Faculty of Engineering and Architecture",
            "Riad El Solh, Beirut 1107 2020, Lebanon",
            "Fadlo R. Khuri",
            "President",
            "Dr. Lina Saab",
            "Program Coordinator",
            "American University of Beirut is institutionally accredited by the Middle States Commission on Higher Education (MSCHE).",
            "Most recent MSCHE reaffirmation and follow-up activity are documented in the institutional accreditation archive maintained by the Office of the Provost.",
            "Private, non-profit, independent university operating under a charter granted by the New York State Board of Regents and governed by the AUB Board of Trustees.",
            "Program Coordinator -> Chair, Department of Electrical and Computer Engineering -> Dean, Faculty of Engineering and Architecture -> Provost -> President.",
            "AUB leadership and Faculty of Engineering and Architecture organizational charts maintained by the Office of the Provost.",
            "One credit hour for lecture-based instruction typically represents one 50-minute contact period per week over a regular semester, together with associated out-of-class student work.",
            "Laboratories, capstone design, and project-based courses may use extended scheduled contact periods approved through the regular curriculum review process.",
            appendix_d_id,
        ),
    )
    cur.execute("DELETE FROM ACADEMIC_SUPPORT_UNIT WHERE appendix_d_id = ?", (appendix_d_id,))
    cur.execute("DELETE FROM NONACADEMIC_SUPPORT_UNIT WHERE appendix_d_id = ?", (appendix_d_id,))
    cur.execute("DELETE FROM ENROLLMENT_RECORD WHERE appendix_d_id = ?", (appendix_d_id,))
    cur.execute("DELETE FROM PERSONNEL_RECORD WHERE appendix_d_id = ?", (appendix_d_id,))
    asu_id = next_id(cur, "ACADEMIC_SUPPORT_UNIT", "support_unit_id")
    academic_units = [
        ("Office of the Registrar", "Registrar", "University Registrar", "registrar@aub.edu.lb", "+961 1 350000"),
        ("AUB Libraries", "University Librarian", "Dean of Libraries", "library@aub.edu.lb", "+961 1 350000"),
        ("Academic and Student Services", "Director, Academic and Student Services", "Director", "student.services@aub.edu.lb", "+961 1 350000"),
    ]
    for offset, row in enumerate(academic_units):
        cur.execute("INSERT INTO ACADEMIC_SUPPORT_UNIT (support_unit_id, unit_name, responsible_person_name, responsible_person_title, contact_email, contact_phone, appendix_d_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (asu_id + offset, *row, appendix_d_id))
    nasu_id = next_id(cur, "NONACADEMIC_SUPPORT_UNIT", "nonacademic_support_unit_id")
    nonacademic_units = [
        ("Information Technology", "Director of Information Technology", "Director", "it.support@aub.edu.lb", "+961 1 350000"),
        ("Facilities Management and Campus Services", "Director of Facilities Management", "Director", "facilities@aub.edu.lb", "+961 1 350000"),
        ("Environmental Health, Safety and Risk Management", "EHSRM Manager", "Manager", "ehsrm@aub.edu.lb", "+961 1 350000"),
    ]
    for offset, row in enumerate(nonacademic_units):
        cur.execute("INSERT INTO NONACADEMIC_SUPPORT_UNIT (nonacademic_support_unit_id, unit_name, responsible_person_name, responsible_person_title, contact_email, contact_phone, appendix_d_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (nasu_id + offset, *row, appendix_d_id))
    er_id = next_id(cur, "ENROLLMENT_RECORD", "enrollment_record_id")
    enrollment_rows = [
        ("2025-2026", "FT", 84, 78, 73, 69, 14, 318, 18, 0, 58, 7, 0),
        ("2025-2026", "PT", 8, 6, 5, 4, 1, 24, 2, 0, 0, 0, 0),
        ("2024-2025", "FT", 78, 73, 69, 66, 13, 299, 17, 0, 55, 6, 0),
        ("2024-2025", "PT", 9, 7, 6, 5, 1, 28, 2, 0, 0, 0, 0),
        ("2023-2024", "FT", 72, 68, 65, 61, 12, 278, 16, 0, 51, 5, 0),
        ("2023-2024", "PT", 10, 8, 6, 5, 2, 31, 3, 0, 0, 0, 0),
    ]
    for offset, row in enumerate(enrollment_rows):
        cur.execute("INSERT INTO ENROLLMENT_RECORD (enrollment_record_id, academic_year, student_type, year1_count, year2_count, year3_count, year4_count, year5_count, total_undergraduate, total_graduate, associates_awarded, bachelors_awarded, masters_awarded, doctorates_awarded, appendix_d_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (er_id + offset, *row, appendix_d_id))
    pr_id = next_id(cur, "PERSONNEL_RECORD", "personnel_record_id")
    personnel_rows = [
        ("Administrative", 5, 0, 5),
        ("Faculty (tenure-track)", 18, 0, 18),
        ("Other Faculty (excluding student assistants)", 6, 4, 8),
        ("Student Teaching Assistants", 10, 12, 16),
        ("Technicians/Specialists", 7, 1, 7),
        ("Office/Clerical Employees", 4, 0, 4),
        ("Others", 2, 1, 2),
    ]
    for offset, row in enumerate(personnel_rows):
        cur.execute("INSERT INTO PERSONNEL_RECORD (personnel_record_id, employment_category, full_time_count, part_time_count, fte_count, appendix_d_id) VALUES (?, ?, ?, ?, ?, ?)",
                    (pr_id + offset, *row, appendix_d_id))

    cur.execute("UPDATE COURSE SET Course_Code=?, Credits=?, Contact_Hours=?, Course_Type=? WHERE Course_ID=1", ("EECE 210", 3, 3, "Required"))
    cur.execute("UPDATE COURSE SET Course_Code=?, Credits=?, Contact_Hours=?, Course_Type=? WHERE Course_ID=2", ("EECE 230", 3, 3, "Required"))
    cur.execute("UPDATE COURSE SET Course_Code=?, Credits=?, Contact_Hours=?, Course_Type=? WHERE Course_ID=3", ("EECE 455", 3, 3, "Required"))

    cur.execute("DELETE FROM HAS_CLO WHERE syllabus_id IN (1,2,3,10)")
    cur.execute("DELETE FROM SYLLABUS_CLO_SO_MAP WHERE syllabus_id IN (1,2,3,10)")
    clo_start = next_id(cur, "CLO", "clo_id")
    created_clos = {}
    for syllabus_id, payload in COURSE_SECTIONS.items():
        cur.execute("UPDATE INSTRUCTOR_SYLLABUS SET term=?, Faculty_ID=? WHERE syllabus_id=?", (payload["term"], payload["faculty_id"], syllabus_id))
        desc_id, outline_id, add_id = cur.execute("SELECT description_id, outline_id, additional_info_id FROM INSTRUCTOR_SYLLABUS WHERE syllabus_id=?", (syllabus_id,)).fetchone()
        cur.execute("UPDATE COURSE_DISCRIPTION SET catalog_description=? WHERE description_id=?", (payload["description"], desc_id))
        cur.execute("UPDATE WEEKLY_TOPIC_OUTLINE SET topics_description=? WHERE outline_id=?", (payload["outline"], outline_id))
        cur.execute("UPDATE ADDITIONAL_INFORMATION SET design_content_percentage=?, software_or_labs_tools_used=? WHERE additional_info_id=?", (payload["design_pct"], payload["tools"], add_id))

        for table, pk in [("TEXTBOOK", "textbook_id"), ("SUPPLEMENT_MATERIAL", "material_id"), ("PREREQUISITE", "prerequisite_id"), ("COREQUISITE", "corequisite_id"), ("ASSESMENT", "assessment_id")]:
            cur.execute(f"DELETE FROM {table} WHERE syllabus_id=?", (syllabus_id,))
        t_id = next_id(cur, "TEXTBOOK", "textbook_id")
        for offset, row in enumerate(payload["textbooks"]):
            cur.execute("INSERT INTO TEXTBOOK (textbook_id, title_author_year, Attribute, syllabus_id) VALUES (?, ?, ?, ?)", (t_id + offset, row[0], row[1], syllabus_id))
        s_id = next_id(cur, "SUPPLEMENT_MATERIAL", "material_id")
        for offset, text in enumerate(payload["supplements"]):
            cur.execute("INSERT INTO SUPPLEMENT_MATERIAL (material_id, material_discription, syllabus_id) VALUES (?, ?, ?)", (s_id + offset, text, syllabus_id))
        p_id = next_id(cur, "PREREQUISITE", "prerequisite_id")
        for offset, code in enumerate(payload["prereqs"]):
            cur.execute("INSERT INTO PREREQUISITE (prerequisite_id, course_code, syllabus_id) VALUES (?, ?, ?)", (p_id + offset, code, syllabus_id))
        c_id = next_id(cur, "COREQUISITE", "corequisite_id")
        for offset, code in enumerate(payload["coreqs"]):
            cur.execute("INSERT INTO COREQUISITE (corequisite_id, course_code, syllabus_id) VALUES (?, ?, ?)", (c_id + offset, code, syllabus_id))
        a_id = next_id(cur, "ASSESMENT", "assessment_id")
        for offset, row in enumerate(payload["assessments"]):
            cur.execute("INSERT INTO ASSESMENT (assessment_id, assesment_type, weight_percentage, syllabus_id) VALUES (?, ?, ?, ?)", (a_id + offset, row[0], row[1], syllabus_id))

        for clo_desc, level, so_number in payload["clo_defs"]:
            key = (clo_desc, level)
            if key not in created_clos:
                clo_id = next_id(cur, "CLO", "clo_id")
                cur.execute("INSERT INTO CLO (clo_id, description, level) VALUES (?, ?, ?)", (clo_id, clo_desc, level))
                created_clos[key] = clo_id
            clo_id = created_clos[key]
            cur.execute("INSERT INTO HAS_CLO (clo_id, syllabus_id) VALUES (?, ?)", (clo_id, syllabus_id))
            so_id = so_ids[f"P6-SO{so_number}"]
            cur.execute("INSERT INTO SYLLABUS_CLO_SO_MAP (syllabus_id, clo_id, so_id) VALUES (?, ?, ?)", (syllabus_id, clo_id, so_id))

    for clo_id in set(created_clos.values()):
        cur.execute("DELETE FROM MAPS_TO WHERE clo_id=?", (clo_id,))
    for (desc, level), clo_id in created_clos.items():
        matching_so_ids = [row[2] for row in cur.execute("SELECT syllabus_id, clo_id, so_id FROM SYLLABUS_CLO_SO_MAP WHERE clo_id=?", (clo_id,)).fetchall()]
        for so_id in sorted(set(matching_so_ids)):
            cur.execute("INSERT INTO MAPS_TO (so_id, clo_id) VALUES (?, ?)", (so_id, clo_id))

    conn.commit()
    conn.close()
    print("Seeded realistic AUB/ABET demo data for program 6 / cycle 19.")


if __name__ == "__main__":
    main()
