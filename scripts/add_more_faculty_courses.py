"""Add more realistic faculty members and courses to the CCE program (ID=6, Cycle=19)."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
PROGRAM_ID = 6
CYCLE_ID = 19

NEW_FACULTY = [
    {
        "full_name": "Dr. Rami Zein",
        "academic_rank": "Associate Professor",
        "appointment_type": "Full-time",
        "email": "rami.zein@aub.edu.lb",
        "office_hours": "Mon/Wed 10:00-12:00",
        "qualification": ("PhD Electrical Engineering", "University of California San Diego", 2009, 5, 13),
        "certifications": ["IEEE Member", "MATLAB Certified Instructor"],
        "memberships": ["IEEE Signal Processing Society - Member (2012)", "EURASIP - Member (2015)"],
        "development": ["Attended IEEE ICASSP pedagogy workshop (2025)", "Completed advanced signal processing curriculum seminar (2024)"],
        "industry": ["Research engineer at Nokia Bell Labs on digital communications signal processing (2009-2012)"],
        "honors": ["Best Paper Award, IEEE ISSPIT (2021)"],
        "services": ["Member, Graduate Admissions Committee (2023-Present)"],
        "publications": [
            "R. Zein et al., 'Adaptive filter design for multi-path channel estimation in OFDM systems,' IEEE Signal Processing Letters, 2023.",
            "R. Zein, 'Project-based learning in undergraduate DSP: a structured design approach,' ASEE Annual Conference, 2022.",
        ],
    },
    {
        "full_name": "Dr. Maya Khouri",
        "academic_rank": "Assistant Professor",
        "appointment_type": "Full-time",
        "email": "maya.khouri@aub.edu.lb",
        "office_hours": "Tue/Thu 13:00-15:00",
        "qualification": ("PhD Computer Engineering", "Carnegie Mellon University", 2019, 2, 5),
        "certifications": ["ARM Certified Engineer", "Intel AI Developer Certification"],
        "memberships": ["IEEE Computer Society - Member (2019)", "ACM SIGARCH - Member (2020)"],
        "development": ["Completed RISC-V processor design workshop (2025)", "Attended CRA Early Career Mentoring Workshop (2024)"],
        "industry": ["FPGA design engineer internship at Intel (2017-2018)"],
        "honors": ["AUB Faculty of Engineering Research Award (2023)"],
        "services": ["Lab safety coordinator, Embedded Systems Lab (2022-Present)"],
        "publications": [
            "M. Khouri et al., 'Energy-efficient approximate computing in FPGA-based accelerators,' ACM TODAES, 2023.",
            "M. Khouri and A. Hassan, 'Hands-on computer architecture lab using RISC-V softcores,' ASEE Annual Conference, 2024.",
        ],
    },
    {
        "full_name": "Dr. Tarek Mansour",
        "academic_rank": "Professor",
        "appointment_type": "Full-time",
        "email": "tarek.mansour@aub.edu.lb",
        "office_hours": "Mon/Thu 09:00-11:00",
        "qualification": ("PhD Electrical Engineering", "Stanford University", 2000, 8, 22),
        "certifications": ["IEEE Fellow", "Professional Engineer (PE) License"],
        "memberships": ["IEEE ComSoc - Senior Member (2010)", "URSI Commission C - Member (2014)"],
        "development": ["IEEE ComSoc Wireless Future Workshop (2025)", "Keynote speaker, AUB Research Symposium (2024)"],
        "industry": ["Senior wireless systems engineer at Qualcomm (2000-2005)", "Consultant for regional mobile operators on 4G/5G deployment (2014-2019)"],
        "honors": ["AUB President's Award for Distinguished Academic Service (2020)", "IEEE Region 8 Outstanding Faculty Advisor Award (2018)"],
        "services": ["Associate Chair for Graduate Studies (2021-Present)", "IEEE Lebanon Section Chair (2019-2022)"],
        "publications": [
            "T. Mansour et al., 'Massive MIMO beamforming for heterogeneous 5G networks in urban environments,' IEEE Transactions on Wireless Communications, 2024.",
            "T. Mansour and R. Zein, 'Cross-layer QoS optimization in next-generation wireless access networks,' IEEE JSAC, 2022.",
        ],
    },
    {
        "full_name": "Dr. Nadia Farhat",
        "academic_rank": "Associate Professor",
        "appointment_type": "Full-time",
        "email": "nadia.farhat@aub.edu.lb",
        "office_hours": "Wed/Fri 11:00-13:00",
        "qualification": ("PhD Computer Science", "ETH Zurich", 2013, 3, 9),
        "certifications": ["Google Cloud Professional ML Engineer", "NVIDIA Deep Learning Institute Certificate"],
        "memberships": ["IEEE Computational Intelligence Society - Member (2016)", "ACM SIGKDD - Member (2017)"],
        "development": ["NeurIPS workshop on responsible AI in education (2025)", "Completed curriculum integration of ML ethics module (2024)"],
        "industry": ["Data scientist at IBM Research Zurich (2013-2016)"],
        "honors": ["Best Teaching Innovation Award, AUB Faculty of Engineering (2022)"],
        "services": ["Co-founder, AUB AI and Data Science Student Club (2021-Present)"],
        "publications": [
            "N. Farhat et al., 'Federated learning with differential privacy for healthcare IoT applications,' IEEE Internet of Things Journal, 2024.",
            "N. Farhat, 'Integrating machine learning projects into undergraduate engineering curricula,' EDUCON, 2023.",
        ],
    },
    {
        "full_name": "Dr. Karim Wehbe",
        "academic_rank": "Assistant Professor",
        "appointment_type": "Full-time",
        "email": "karim.wehbe@aub.edu.lb",
        "office_hours": "Mon/Wed 15:00-17:00",
        "qualification": ("PhD Information Security", "Sorbonne University", 2020, 2, 4),
        "certifications": ["Certified Information Systems Security Professional (CISSP)", "Offensive Security Certified Professional (OSCP)"],
        "memberships": ["IEEE ComSoc - Member (2020)", "USENIX - Member (2021)"],
        "development": ["IEEE Symposium on Security and Privacy doctoral mentorship (2025)", "Attended NDSS workshop on network security education (2024)"],
        "industry": ["Security analyst at Orange Cyberdefense, Paris (2018-2020)"],
        "honors": ["Best Dissertation Award, Sorbonne University School of Engineering (2020)"],
        "services": ["Faculty coordinator, AUB Cybersecurity Awareness Week (2023-Present)"],
        "publications": [
            "K. Wehbe et al., 'Lightweight intrusion detection for resource-constrained IoT networks,' IEEE Transactions on Dependable and Secure Computing, 2024.",
            "K. Wehbe and L. Saab, 'Teaching network security through adversarial lab exercises,' SIGCSE, 2023.",
        ],
    },
]

NEW_COURSES = [
    {
        "code": "EECE 301",
        "name": "Electromagnetics",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "rami.zein@aub.edu.lb",
        "term": "Spring 2027",
        "description": "Electrostatics, magnetostatics, Maxwell's equations, plane wave propagation, transmission lines, and engineering applications including antennas and waveguides.",
        "design_pct": 10,
        "tools": "MATLAB, CST Microwave Studio",
        "prereqs": ["EECE 210", "MATH 202"],
        "assessments": [("Homework and quizzes", 20), ("Midterm exam", 35), ("Final exam", 45)],
    },
    {
        "code": "EECE 310",
        "name": "Digital Signal Processing",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "rami.zein@aub.edu.lb",
        "term": "Fall 2026",
        "description": "Discrete-time signals and systems, Z-transform, DFT, FFT algorithms, FIR and IIR filter design, and spectral analysis with engineering applications.",
        "design_pct": 20,
        "tools": "MATLAB Signal Processing Toolbox, Python (SciPy)",
        "prereqs": ["EECE 210", "EECE 230"],
        "assessments": [("Homework and quizzes", 15), ("Lab reports", 15), ("Midterm exam", 30), ("Final exam", 40)],
    },
    {
        "code": "EECE 340",
        "name": "Probability and Random Processes",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "tarek.mansour@aub.edu.lb",
        "term": "Spring 2027",
        "description": "Probability theory, random variables, probability distributions, stochastic processes, noise modeling, and statistical signal analysis for communication systems.",
        "design_pct": 5,
        "tools": "MATLAB, Python (NumPy, SciPy)",
        "prereqs": ["MATH 201"],
        "assessments": [("Homework", 20), ("Midterm exam", 35), ("Final exam", 45)],
    },
    {
        "code": "EECE 350",
        "name": "Computer Architecture",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "maya.khouri@aub.edu.lb",
        "term": "Fall 2026",
        "description": "Instruction set architectures, processor datapath and control, pipelining, memory hierarchy, caches, I/O systems, and introduction to parallel architectures.",
        "design_pct": 25,
        "tools": "Logisim, RISC-V simulator, Vivado",
        "prereqs": ["EECE 230"],
        "assessments": [("Assignments", 20), ("Lab project", 20), ("Midterm exam", 25), ("Final exam", 35)],
    },
    {
        "code": "EECE 420",
        "name": "Wireless Communications",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "tarek.mansour@aub.edu.lb",
        "term": "Spring 2027",
        "description": "Wireless channel models, modulation techniques, diversity and combining, OFDM, multiple access schemes, cellular system design, and introduction to 5G standards.",
        "design_pct": 30,
        "tools": "MATLAB Communications Toolbox, GNU Radio",
        "prereqs": ["EECE 340", "EECE 455"],
        "assessments": [("Homework and quizzes", 15), ("Lab exercises", 15), ("Midterm exam", 25), ("Design project", 20), ("Final exam", 25)],
    },
    {
        "code": "EECE 435",
        "name": "Operating Systems",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "maya.khouri@aub.edu.lb",
        "term": "Spring 2027",
        "description": "Process management, scheduling, memory management, virtual memory, file systems, concurrency, synchronization, and operating system security fundamentals.",
        "design_pct": 15,
        "tools": "Linux, C/C++, QEMU emulator",
        "prereqs": ["EECE 350", "EECE 230"],
        "assessments": [("Programming assignments", 30), ("Midterm exam", 30), ("Final exam", 40)],
    },
    {
        "code": "EECE 470",
        "name": "Network Security",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "karim.wehbe@aub.edu.lb",
        "term": "Fall 2026",
        "description": "Cryptographic protocols, network attack vectors, intrusion detection, firewalls, VPNs, secure software design, and ethical considerations in cybersecurity practice.",
        "design_pct": 20,
        "tools": "Wireshark, Kali Linux, OpenSSL, Snort",
        "prereqs": ["EECE 455"],
        "assessments": [("Lab exercises", 25), ("Midterm exam", 25), ("Security audit project", 20), ("Final exam", 30)],
    },
    {
        "code": "EECE 480",
        "name": "Machine Learning for Engineers",
        "credits": 3,
        "contact_hours": 3,
        "course_type": "Engineering Topics",
        "faculty_id_key": "nadia.farhat@aub.edu.lb",
        "term": "Spring 2027",
        "description": "Supervised and unsupervised learning, neural networks, deep learning, model evaluation, feature engineering, and ML applications in communications and signal processing.",
        "design_pct": 35,
        "tools": "Python, TensorFlow, PyTorch, Scikit-learn, Jupyter",
        "prereqs": ["EECE 340", "EECE 230"],
        "assessments": [("Programming projects", 35), ("Midterm exam", 25), ("Final project", 20), ("Final exam", 20)],
    },
]


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Insert new faculty
    email_to_id = {}
    for f in NEW_FACULTY:
        fid = next_id(cur, "FACULTY_MEMBER", "Faculty_ID")
        cur.execute(
            """INSERT INTO FACULTY_MEMBER (Faculty_ID, Full_Name, Academic_Rank, Appointment_Type, Email, Office_Hours)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(Faculty_ID) DO UPDATE SET
                 Full_Name=excluded.Full_Name, Academic_Rank=excluded.Academic_Rank,
                 Appointment_Type=excluded.Appointment_Type, Email=excluded.Email,
                 Office_Hours=excluded.Office_Hours""",
            (fid, f["full_name"], f["academic_rank"], f["appointment_type"], f["email"], f["office_hours"]),
        )
        email_to_id[f["email"]] = fid

        # Qualifications
        qid = next_id(cur, "QUALIFICATION", "Qualification_ID")
        degree_field, institution, year, industry_yrs, institution_yrs = f["qualification"]
        cur.execute(
            """INSERT INTO QUALIFICATION (Qualification_ID, Degree_Field, Degree_Institution, Degree_Year,
               Years_Industry_Government, Years_at_Institution, Faculty_ID)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (qid, degree_field, institution, year, industry_yrs, institution_yrs, fid),
        )

        # Certifications
        for cert in f["certifications"]:
            cid = next_id(cur, "CERTIFICATION", "Certification_ID")
            cur.execute("INSERT INTO CERTIFICATION (Certification_ID, Certification_title, Faculty_ID) VALUES (?, ?, ?)", (cid, cert, fid))

        # Memberships
        for mem in f["memberships"]:
            mid = next_id(cur, "PROFESSIONAL_MEMBERSHIP", "Membership_ID")
            cur.execute("INSERT INTO PROFESSIONAL_MEMBERSHIP (Membership_ID, Membership_Description, Faculty_ID) VALUES (?, ?, ?)", (mid, mem, fid))

        # Professional development
        for dev in f["development"]:
            did = next_id(cur, "PROFESSIONAL_DEVELOPMENT", "Development_ID")
            cur.execute("INSERT INTO PROFESSIONAL_DEVELOPMENT (Development_ID, Activity_Description, Faculty_ID) VALUES (?, ?, ?)", (did, dev, fid))

        # Industry experience
        for exp in f["industry"]:
            eid = next_id(cur, "INDUSTRY_EXPERIENCE", "Experience_ID")
            cur.execute("INSERT INTO INDUSTRY_EXPERIENCE (Experience_ID, Experience_discription, Faculty_ID) VALUES (?, ?, ?)", (eid, exp, fid))

        # Honors
        for hon in f["honors"]:
            hid = next_id(cur, "HONOR_AWARD", "Award_ID")
            cur.execute("INSERT INTO HONOR_AWARD (Award_ID, Award_discription, Faculty_ID) VALUES (?, ?, ?)", (hid, hon, fid))

        # Services
        for svc in f["services"]:
            sid = next_id(cur, "SERVICE_ACTIVITY", "Service_ID")
            cur.execute("INSERT INTO SERVICE_ACTIVITY (Service_ID, Service_Description, Faculty_ID) VALUES (?, ?, ?)", (sid, svc, fid))

        # Publications
        for pub in f["publications"]:
            pid = next_id(cur, "PUBLICATION", "Publication_ID")
            cur.execute("INSERT INTO PUBLICATION (Publication_ID, Publication_Discription, Faculty_ID) VALUES (?, ?, ?)", (pid, pub, fid))

        # Assign to program
        cur.execute(
            "INSERT OR IGNORE INTO ASSIGNED_TO (program_id, Faculty_ID) VALUES (?, ?)",
            (PROGRAM_ID, fid),
        )
        print(f"  Added faculty: {f['full_name']} (ID={fid})")

    # Insert new courses
    for c in NEW_COURSES:
        # Create unified syllabus
        usid = next_id(cur, "UNIFIED_SYLLABUS", "unified_syllabus_id")
        cur.execute("INSERT INTO UNIFIED_SYLLABUS (unified_syllabus_id, status) VALUES (?, ?)", (usid, "In Progress"))

        # Create course
        cid = next_id(cur, "COURSE", "Course_ID")
        cur.execute(
            """INSERT INTO COURSE (Course_ID, Course_Code, Credits, Contact_Hours, Course_Type, Cycle_ID, unified_syllabus_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (cid, c["code"], c["credits"], c["contact_hours"], c["course_type"], CYCLE_ID, usid),
        )

        # Create course description
        desc_id = next_id(cur, "COURSE_DISCRIPTION", "description_id")
        cur.execute("INSERT INTO COURSE_DISCRIPTION (description_id, catalog_description) VALUES (?, ?)", (desc_id, c["description"]))

        # Create course outline
        outline_id = next_id(cur, "WEEKLY_TOPIC_OUTLINE", "Outline_ID")
        cur.execute("INSERT INTO WEEKLY_TOPIC_OUTLINE (Outline_ID, Topics_Description) VALUES (?, ?)", (outline_id, c["description"]))

        # Create additional info
        add_id = next_id(cur, "ADDITIONAL_INFORMATION", "Additional_Info_ID")
        cur.execute(
            "INSERT INTO ADDITIONAL_INFORMATION (Additional_Info_ID, Design_Content_Percentage, Software_or_Labs_Tools_Used) VALUES (?, ?, ?)",
            (add_id, c["design_pct"], c["tools"]),
        )

        # Create instructor syllabus
        fac_id = email_to_id.get(c["faculty_id_key"])
        if fac_id:
            sid = next_id(cur, "INSTRUCTOR_SYLLABUS", "Syllabus_ID")
            cur.execute(
                """INSERT INTO INSTRUCTOR_SYLLABUS (Syllabus_ID, Term, Syllabus_Status, Faculty_ID, Course_ID,
                   description_id, outline_id, additional_info_id, unified_syllabus_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (sid, c["term"], "In Progress", fac_id, cid, desc_id, outline_id, add_id, usid),
            )
            # Link faculty teaches course
            cur.execute("INSERT OR IGNORE INTO TEACHES (Faculty_ID, Course_ID) VALUES (?, ?)", (fac_id, cid))

        # Add prerequisites
        for prereq in c["prereqs"]:
            prid = next_id(cur, "PREREQUISITE", "Prerequisite_ID")
            cur.execute("INSERT INTO PREREQUISITE (Prerequisite_ID, Course_Code, Syllabus_ID) VALUES (?, ?, ?)", (prid, prereq, sid))

        # Add assessments
        for atype, weight in c["assessments"]:
            aid = next_id(cur, "ASSESMENT", "assessment_id")
            cur.execute(
                "INSERT INTO ASSESMENT (assessment_id, assesment_type, weight_percentage, syllabus_id) VALUES (?, ?, ?, ?)",
                (aid, atype, weight, sid),
            )

        print(f"  Added course: {c['code']} - {c['name']} (ID={cid})")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
