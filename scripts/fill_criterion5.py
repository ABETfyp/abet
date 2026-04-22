"""Populate Criterion 5 (Curriculum) for CCE program, Cycle 19, criterion5_id=4."""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
C5_ID = 4


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


# Table 5-1: full CCE plan of study
# r_se_category: R=Required, SE=Selective Elective, E=Elective
# Credits split: math_basic_sciences | engineering_topics | other
TABLE_5_1 = [
    # Year 1 — Fall
    {"course_label": "MATH 201 – Calculus I",            "recommended_schedule": "Year 1 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 40},
    {"course_label": "PHYS 211 – General Physics I",     "recommended_schedule": "Year 1 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 40},
    {"course_label": "CHEM 201 – General Chemistry",     "recommended_schedule": "Year 1 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "ENGL 203 – Technical Writing",     "recommended_schedule": "Year 1 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 25},
    # Year 1 — Spring
    {"course_label": "MATH 202 – Calculus II",           "recommended_schedule": "Year 1 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 40},
    {"course_label": "PHYS 212 – General Physics II",    "recommended_schedule": "Year 1 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 40},
    {"course_label": "EECE 230 – Intro to Programming",  "recommended_schedule": "Year 1 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "ENGR 201 – Engineering & Society", "recommended_schedule": "Year 1 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 45},
    # Year 2 — Fall
    {"course_label": "MATH 301 – Differential Equations","recommended_schedule": "Year 2 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "EECE 210 – Electric Circuits",     "recommended_schedule": "Year 2 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 40},
    {"course_label": "EECE 240 – Digital Logic Design",  "recommended_schedule": "Year 2 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "MATH 302 – Linear Algebra",        "recommended_schedule": "Year 2 – Fall",   "r_se_category": "R",  "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    # Year 2 — Spring
    {"course_label": "EECE 340 – Probability & Random Processes", "recommended_schedule": "Year 2 – Spring", "r_se_category": "R", "math_basic_sciences_credits": 3, "engineering_topics_credits": 0, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "EECE 301 – Electromagnetics",      "recommended_schedule": "Year 2 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "EECE 350 – Computer Architecture", "recommended_schedule": "Year 2 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 32},
    {"course_label": "HUMN 201 – Humanities Elective",   "recommended_schedule": "Year 2 – Spring", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 30},
    # Year 3 — Fall
    {"course_label": "EECE 310 – Digital Signal Processing",      "recommended_schedule": "Year 3 – Fall", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 32},
    {"course_label": "EECE 360 – Microelectronics",               "recommended_schedule": "Year 3 – Fall", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall",        "max_section_enrollment": 30},
    {"course_label": "EECE 435 – Operating Systems",              "recommended_schedule": "Year 3 – Fall", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 32},
    {"course_label": "ENGR 301 – Engineering Ethics & Law",       "recommended_schedule": "Year 3 – Fall", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 40},
    # Year 3 — Spring
    {"course_label": "EECE 455 – Computer Communication Networks","recommended_schedule": "Year 3 – Spring","r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 35},
    {"course_label": "EECE 420 – Wireless Communications",        "recommended_schedule": "Year 3 – Spring","r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Spring",      "max_section_enrollment": 30},
    {"course_label": "EECE 470 – Network Security",               "recommended_schedule": "Year 3 – Spring","r_se_category": "SE", "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 28},
    {"course_label": "SSCI 301 – Social Science Elective",        "recommended_schedule": "Year 3 – Spring","r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 30},
    # Year 4 — Fall
    {"course_label": "EECE 480 – Machine Learning for Engineers", "recommended_schedule": "Year 4 – Fall", "r_se_category": "SE", "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Spring",      "max_section_enrollment": 28},
    {"course_label": "EECE 490 – Capstone Design I",              "recommended_schedule": "Year 4 – Fall", "r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 2, "other_credits": 0, "last_two_terms_offered": "Fall",        "max_section_enrollment": 24},
    {"course_label": "EECE Technical Elective I",                 "recommended_schedule": "Year 4 – Fall", "r_se_category": "SE", "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 28},
    {"course_label": "Free Elective",                             "recommended_schedule": "Year 4 – Fall", "r_se_category": "E",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 30},
    # Year 4 — Spring
    {"course_label": "EECE 499 – Capstone Design II",             "recommended_schedule": "Year 4 – Spring","r_se_category": "R",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Spring",      "max_section_enrollment": 24},
    {"course_label": "EECE Technical Elective II",                "recommended_schedule": "Year 4 – Spring","r_se_category": "SE", "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 28},
    {"course_label": "EECE Technical Elective III",               "recommended_schedule": "Year 4 – Spring","r_se_category": "SE", "math_basic_sciences_credits": 0, "engineering_topics_credits": 3, "other_credits": 0, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 28},
    {"course_label": "Free Elective",                             "recommended_schedule": "Year 4 – Spring","r_se_category": "E",  "math_basic_sciences_credits": 0, "engineering_topics_credits": 0, "other_credits": 3, "last_two_terms_offered": "Fall, Spring", "max_section_enrollment": 30},
]

DESIGN_PROJECTS = [
    {
        "project_title": "Adaptive Beamforming Array for 5G Indoor Coverage",
        "team_identifier": "Team A – 2025",
        "year": 2025,
        "project_description": "Designed and simulated a 4-element adaptive antenna array using MATLAB and GNU Radio to improve indoor 5G signal coverage. The team evaluated beam steering algorithms, implemented a prototype using USRP hardware, and validated performance against ITU-R indoor channel models.",
    },
    {
        "project_title": "Federated Learning Framework for Intrusion Detection in IoT Networks",
        "team_identifier": "Team B – 2025",
        "year": 2025,
        "project_description": "Developed a privacy-preserving intrusion detection system using federated learning across simulated IoT nodes. The team implemented the FL aggregation server, evaluated detection accuracy under non-IID data distributions, and compared the approach against a centralized baseline on the KDD Cup 99 dataset.",
    },
    {
        "project_title": "RISC-V Soft Processor with Custom Cryptographic Accelerator",
        "team_identifier": "Team C – 2025",
        "year": 2025,
        "project_description": "Implemented a RISC-V RV32I soft-core processor on an FPGA development board and extended it with a hardware AES-128 encryption accelerator. Performance benchmarks demonstrated a 14× throughput improvement over software AES for bulk data encryption tasks.",
    },
    {
        "project_title": "Software-Defined Networking Controller for Campus Traffic Management",
        "team_identifier": "Team D – 2026",
        "year": 2026,
        "project_description": "Designed an OpenFlow-based SDN controller using the Ryu framework to dynamically manage bandwidth allocation and QoS policies in a simulated campus network topology. The project included a web dashboard for real-time traffic visualization and policy configuration.",
    },
    {
        "project_title": "Edge-Deployed Gesture Recognition System for Accessibility Applications",
        "team_identifier": "Team E – 2026",
        "year": 2026,
        "project_description": "Built a low-latency hand gesture recognition pipeline using a lightweight CNN model quantized and deployed on an ARM Cortex-M microcontroller. The system achieved 91% classification accuracy at under 40 ms inference time, meeting real-time accessibility application requirements.",
    },
]

C5_FIELDS = {
    "academic_calender_type": "Semester",
    "plan_of_study_description": (
        "The Bachelor of Engineering in Computer and Communications Engineering is a 145-credit, eight-semester program. "
        "The first two years establish foundations in mathematics (calculus, differential equations, linear algebra), basic sciences "
        "(physics, chemistry), programming, and core electrical engineering. The third year introduces communications theory, "
        "digital signal processing, computer architecture, operating systems, and networks. The fourth year includes advanced "
        "elective tracks, professional development, and a two-semester capstone design sequence. "
        "Students follow one of two curricular paths: Communications and Networking Focus or Embedded and Computer Systems Focus, "
        "each fulfilled through a defined set of selective electives."
    ),
    "curriculum_alignment_description": (
        "All required and selective elective courses are mapped to ABET student outcomes and program educational objectives through "
        "the department's CLO-SO matrix. Each syllabus identifies which outcomes are introduced (I), reinforced (R), or mastered (M) "
        "in that course. The curriculum map is reviewed annually by the Curriculum Committee to ensure balanced outcome coverage "
        "and to identify redundancies or gaps. Syllabi are updated each cycle to reflect assessment findings from Criterion 4."
    ),
    "prerequisites_support_description": (
        "The prerequisite structure ensures students develop the mathematical and foundational engineering skills required before "
        "progressing to advanced topics. MATH 201–202 precede all engineering analysis courses. EECE 230 is prerequisite to "
        "computer architecture, operating systems, and networking. EECE 210 and EECE 340 are prerequisites for communications "
        "and signal processing courses. EECE 455 and EECE 420 are prerequisites for the network security and wireless design electives. "
        "The prerequisite chain is enforced through the university registrar system; waivers require written approval from the "
        "program coordinator."
    ),
    "prerequisite_flowchart_description": (
        "A prerequisite flowchart is maintained in the departmental advising handbook and published on the program website. "
        "The chart is organized by semester and shows directed prerequisite edges between all required and selective elective courses. "
        "It is reviewed and updated each academic year in conjunction with catalog revisions."
    ),
    "hours_depth_by_subject_area_description": (
        "The curriculum provides 30 credit hours in mathematics and basic sciences (calculus I–II, differential equations, linear algebra, "
        "probability and random processes, physics I–II, chemistry), exceeding the ABET minimum. Engineering topics total 56 credit hours "
        "covering circuits, digital systems, electromagnetics, signal processing, computer architecture, operating systems, communications "
        "networks, and the capstone design sequence. Other coursework (general education, technical writing, ethics, free electives) "
        "accounts for 24 credit hours. The total of 110 hours in required and selective elective coursework, plus 35 hours of general "
        "education and free electives, meets the 145-credit degree requirement."
    ),
    "broad_education_component_description": (
        "The program requires 18 credit hours of non-technical coursework distributed across technical writing (3 cr), engineering and "
        "society (3 cr), engineering ethics and law (3 cr), humanities elective (3 cr), social science elective (3 cr), and a free elective "
        "(3 cr). These courses develop students' ability to communicate in professional contexts, understand the societal and ethical "
        "implications of engineering decisions, and appreciate diverse human perspectives. The ethics requirement specifically addresses "
        "ABET student outcome 4 (ethical responsibility and professional judgment)."
    ),
    "cooperative_education_description": (
        "Students may complete an optional supervised internship (ENGR 390, 0 credit, pass/fail) between the third and fourth years. "
        "Internship placements in regional telecommunications companies, technology firms, and research institutions are coordinated "
        "through the AUB Career and Placement Services office. Participating students submit a structured report evaluated by the "
        "program coordinator. Internship experience does not substitute for required coursework but is recognized on the academic record."
    ),
    "materials_available_description": (
        "Course materials are distributed through the university learning management system (Moodle). Textbooks are available through "
        "AUB Libraries in print and electronic formats. Licensed software tools including MATLAB, Multisim, Vivado, Cisco Packet Tracer, "
        "and Python-based toolchains are available on campus computing resources and, where licensing allows, through remote access. "
        "Laboratory manuals, design project briefs, and supplemental problem sets are maintained by course coordinators and updated "
        "each semester."
    ),
    "culminating_design_experience": (
        "The two-semester capstone design sequence (EECE 490 and EECE 499) constitutes the program's culminating design experience. "
        "Student teams of three to four members define a problem with a real client or faculty sponsor, conduct a literature and "
        "technology review, develop and evaluate design alternatives against explicit requirements and constraints (economic, safety, "
        "environmental, ethical, and societal), implement and test a prototype or validated design, and present results in a formal "
        "public showcase. Projects span both curricular tracks and address student outcomes 1–7. Faculty advisors provide weekly "
        "mentorship; external reviewers evaluate the final presentations. All teams submit a written final report meeting departmental "
        "formatting and documentation standards."
    ),
    "Curricular_paths": (
        "Communications and Networking Focus: Students complete EECE 420 (Wireless Communications), EECE 470 (Network Security), "
        "and one additional communications or networking elective. This path prepares graduates for careers in telecommunications, "
        "network engineering, and wireless systems design.\n\n"
        "Embedded and Computer Systems Focus: Students complete EECE 435 (Operating Systems), EECE 480 (Machine Learning for Engineers), "
        "and one additional embedded or computing elective. This path prepares graduates for careers in embedded software, computer "
        "architecture, and intelligent systems development."
    ),
}


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Update main Criterion 5 record
    cur.execute(
        """UPDATE CRITERION_5_CURRICULUM SET
            academic_calender_type=?,
            plan_of_study_description=?,
            curriculum_alignment_description=?,
            prerequisites_support_description=?,
            prerequisite_flowchart_description=?,
            hours_depth_by_subject_area_description=?,
            broad_education_component_description=?,
            cooperative_education_description=?,
            materials_available_description=?,
            culminating_design_experience=?,
            Curricular_paths=?,
            table_5_1_rows=?,
            design_project_rows=?
           WHERE criterion5_id=?""",
        (
            C5_FIELDS["academic_calender_type"],
            C5_FIELDS["plan_of_study_description"],
            C5_FIELDS["curriculum_alignment_description"],
            C5_FIELDS["prerequisites_support_description"],
            C5_FIELDS["prerequisite_flowchart_description"],
            C5_FIELDS["hours_depth_by_subject_area_description"],
            C5_FIELDS["broad_education_component_description"],
            C5_FIELDS["cooperative_education_description"],
            C5_FIELDS["materials_available_description"],
            C5_FIELDS["culminating_design_experience"],
            C5_FIELDS["Curricular_paths"],
            json.dumps(TABLE_5_1),
            json.dumps(DESIGN_PROJECTS),
            C5_ID,
        ),
    )
    print("Updated main Criterion 5 record.")

    # Clear and re-insert CURRICULUM_COURSE_ROW
    cur.execute("DELETE FROM CURRICULUM_COURSE_ROW WHERE criterion5_id=?", (C5_ID,))
    for row in TABLE_5_1:
        rid = next_id(cur, "CURRICULUM_COURSE_ROW", "curr_course_row_id")
        cur.execute(
            """INSERT INTO CURRICULUM_COURSE_ROW
               (curr_course_row_id, r_se_category, math_basic_sciences_credits, engineering_topics_credits,
                other_credits, last_two_terms_offered, max_section_enrollment, criterion5_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (rid, row["r_se_category"], row["math_basic_sciences_credits"],
             row["engineering_topics_credits"], row["other_credits"],
             row["last_two_terms_offered"], row["max_section_enrollment"], C5_ID),
        )
    print(f"  Inserted {len(TABLE_5_1)} curriculum course rows.")

    # Clear and re-insert DESIGN_PROJECT_ROW
    cur.execute("DELETE FROM DESIGN_PROJECT_ROW WHERE criterion5_id=?", (C5_ID,))
    for proj in DESIGN_PROJECTS:
        pid = next_id(cur, "DESIGN_PROJECT_ROW", "design_project_row_id")
        cur.execute(
            """INSERT INTO DESIGN_PROJECT_ROW (design_project_row_id, project_title, team_identifier, year, criterion5_id)
               VALUES (?, ?, ?, ?, ?)""",
            (pid, proj["project_title"], proj["team_identifier"], proj["year"], C5_ID),
        )
        print(f"  Added project: {proj['project_title'][:60]}…")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
