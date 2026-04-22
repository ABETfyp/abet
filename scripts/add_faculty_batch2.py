"""Add 5 more real faculty members, assign to program 6, populate C6 qualification/workload rows."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
PROGRAM_ID = 6
CYCLE_ID = 19
C6_ID = 1   # criterion6_id for cycle 19

# Course IDs already in DB (for workload rows)
# 1=EECE210, 2=EECE230, 3=EECE455, 9=EECE301, 10=EECE310
# 11=EECE340, 12=EECE350, 13=EECE420, 14=EECE435, 15=EECE470, 16=EECE480

NEW_FACULTY = [
    {
        "full_name": "Dr. Rola Naja",
        "academic_rank": "Professor",
        "appointment_type": "Full-time",
        "email": "rola.naja@aub.edu.lb",
        "office_hours": "Mon/Wed 11:00-13:00",
        "qualification": ("PhD Electrical Engineering", "Université Pierre et Marie Curie (Sorbonne)", 2001, 7, 21),
        "certifications": ["IEEE Senior Member", "PMP – Project Management Professional"],
        "memberships": [
            "IEEE Vehicular Technology Society – Senior Member (2008)",
            "ACM – Member (2010)",
        ],
        "development": [
            "IEEE VTC workshop on next-generation vehicular networks (2025)",
            "Completed AUB Center for Teaching and Learning active-learning faculty program (2024)",
        ],
        "industry": [
            "Research engineer at France Télécom R&D on wireless QoS and mobility management (2001–2005)",
            "Consultant on LTE network planning for regional mobile operators (2012–2016)",
        ],
        "honors": [
            "AUB Provost Award for Research Excellence (2019)",
            "Best Paper Award, IEEE WCNC (2015)",
        ],
        "services": [
            "Director, Computational and Networking Research Laboratory (2018–Present)",
            "Member, AUB Faculty Senate (2022–Present)",
        ],
        "publications": [
            "R. Naja et al., 'Mobility-aware resource management in multi-tier heterogeneous vehicular networks,' IEEE Transactions on Vehicular Technology, 2024.",
            "R. Naja and T. Mansour, 'Cross-layer optimization for delay-sensitive services in wireless mesh networks,' Computer Networks, 2022.",
        ],
        "c6_qualification": {
            "highest_degree_field": "PhD Electrical Engineering",
            "highest_degree_year": 2001,
            "academic_rank": "Professor",
            "academic_appointment": "Full-time",
            "full_time_or_part_time": "Full-time",
            "years_gov_industry": 7,
            "years_teaching": 21,
            "years_at_institution": 19,
            "professional_registration": "IEEE Senior Member, PMP",
        },
        "c6_workload": [
            {"classes": "EECE 340 Probability and Random Processes; EECE 420 Wireless Communications", "term": "Spring", "year": 2027, "course_id": 13},
        ],
    },
    {
        "full_name": "Dr. Hassan Artail",
        "academic_rank": "Professor",
        "appointment_type": "Full-time",
        "email": "hassan.artail@aub.edu.lb",
        "office_hours": "Tue/Thu 09:00-11:00",
        "qualification": ("PhD Computer Engineering", "Wayne State University", 2002, 5, 20),
        "certifications": ["IEEE Senior Member", "Oracle Certified Professional – Java SE"],
        "memberships": [
            "IEEE Computer Society – Senior Member (2007)",
            "ACM SIGCOMM – Member (2009)",
        ],
        "development": [
            "ACM SIGCOMM workshop on distributed ledger applications in networking (2025)",
            "Participated in NSF-funded faculty exchange on cloud-native systems design (2024)",
        ],
        "industry": [
            "Software architect at Inacom Corp., Detroit on distributed enterprise systems (2002–2004)",
            "Technical advisor for fintech startup on blockchain-based identity management (2019–2021)",
        ],
        "honors": [
            "AUB Distinguished Teaching Award (2016)",
            "AUB Research Incentive Award (2020)",
        ],
        "services": [
            "Program Director, Computer and Communications Engineering (2020–2023)",
            "Member, AUB IT Governance Committee (2021–Present)",
        ],
        "publications": [
            "H. Artail et al., 'Decentralized trust management for IoT-enabled smart city services using blockchain,' IEEE Internet of Things Journal, 2024.",
            "H. Artail and L. Saab, 'Adaptive caching strategies for latency-sensitive content delivery in mobile edge networks,' IEEE Transactions on Network and Service Management, 2023.",
        ],
        "c6_qualification": {
            "highest_degree_field": "PhD Computer Engineering",
            "highest_degree_year": 2002,
            "academic_rank": "Professor",
            "academic_appointment": "Full-time",
            "full_time_or_part_time": "Full-time",
            "years_gov_industry": 5,
            "years_teaching": 20,
            "years_at_institution": 20,
            "professional_registration": "IEEE Senior Member",
        },
        "c6_workload": [
            {"classes": "EECE 455 Computer Communication Networks; EECE 435 Operating Systems", "term": "Fall", "year": 2026, "course_id": 3},
        ],
    },
    {
        "full_name": "Dr. Mariette Awad",
        "academic_rank": "Associate Professor",
        "appointment_type": "Full-time",
        "email": "mariette.awad@aub.edu.lb",
        "office_hours": "Wed/Fri 10:00-12:00",
        "qualification": ("PhD Computer Science", "Virginia Tech", 2007, 4, 15),
        "certifications": ["NVIDIA Deep Learning Institute Certificate", "Google Cloud Professional Data Engineer"],
        "memberships": [
            "IEEE Computational Intelligence Society – Senior Member (2014)",
            "ACM SIGKDD – Member (2012)",
        ],
        "development": [
            "NeurIPS tutorial on large language model fine-tuning for domain-specific applications (2025)",
            "NSF-sponsored workshop on responsible AI curriculum integration (2024)",
        ],
        "industry": [
            "Research scientist at IBM T.J. Watson Research Center on machine learning for network anomaly detection (2007–2009)",
            "Data science consultant for regional healthcare analytics initiative (2017–2019)",
        ],
        "honors": [
            "L'Oréal-UNESCO For Women in Science Middle East Award (2018)",
            "AUB Faculty Research Award (2021)",
        ],
        "services": [
            "Co-director, AUB Artificial Intelligence and Data Science Initiative (2022–Present)",
            "Editorial board member, Pattern Recognition Letters (2020–Present)",
        ],
        "publications": [
            "M. Awad et al., 'Efficient Machine Learning, 2nd ed.,' Springer, 2023.",
            "M. Awad and N. Farhat, 'Interpretable ensemble methods for fault diagnosis in industrial communication networks,' Engineering Applications of Artificial Intelligence, 2024.",
        ],
        "c6_qualification": {
            "highest_degree_field": "PhD Computer Science",
            "highest_degree_year": 2007,
            "academic_rank": "Associate Professor",
            "academic_appointment": "Full-time",
            "full_time_or_part_time": "Full-time",
            "years_gov_industry": 4,
            "years_teaching": 15,
            "years_at_institution": 15,
            "professional_registration": "IEEE Senior Member, Google Cloud Professional Data Engineer",
        },
        "c6_workload": [
            {"classes": "EECE 480 Machine Learning for Engineers; EECE 340 Probability and Random Processes", "term": "Spring", "year": 2027, "course_id": 16},
        ],
    },
    {
        "full_name": "Dr. Fadi Karameh",
        "academic_rank": "Associate Professor",
        "appointment_type": "Full-time",
        "email": "fadi.karameh@aub.edu.lb",
        "office_hours": "Mon/Thu 14:00-16:00",
        "qualification": ("PhD Electrical Engineering and Computer Science", "MIT", 2004, 3, 18),
        "certifications": ["IEEE Member", "MATLAB Certified Instructor"],
        "memberships": [
            "IEEE Engineering in Medicine and Biology Society – Member (2006)",
            "Society for Neuroscience – Member (2010)",
        ],
        "development": [
            "IEEE EMBC workshop on neural signal processing and brain-computer interfaces (2025)",
            "AUB research leadership and grant writing seminar (2024)",
        ],
        "industry": [
            "Research affiliate at MIT Research Laboratory of Electronics (2004–2006)",
            "Biomedical signal processing consultant for medical device startup (2015–2017)",
        ],
        "honors": [
            "AUB University Research Board Award (2017)",
            "Best Paper Award, IEEE EMBC (2013)",
        ],
        "services": [
            "Coordinator, Biomedical Engineering minor program (2019–Present)",
            "Member, University Research Ethics Committee (2021–Present)",
        ],
        "publications": [
            "F. Karameh et al., 'State-space modeling of neural dynamics for closed-loop neuromodulation systems,' Journal of Neural Engineering, 2024.",
            "F. Karameh and R. Zein, 'Adaptive signal processing algorithms for EEG artifact suppression in wearable devices,' IEEE Transactions on Biomedical Engineering, 2023.",
        ],
        "c6_qualification": {
            "highest_degree_field": "PhD Electrical Engineering and Computer Science",
            "highest_degree_year": 2004,
            "academic_rank": "Associate Professor",
            "academic_appointment": "Full-time",
            "full_time_or_part_time": "Full-time",
            "years_gov_industry": 3,
            "years_teaching": 18,
            "years_at_institution": 18,
            "professional_registration": "IEEE Member",
        },
        "c6_workload": [
            {"classes": "EECE 310 Digital Signal Processing; EECE 301 Electromagnetics", "term": "Fall", "year": 2026, "course_id": 10},
        ],
    },
    {
        "full_name": "Dr. Samer Saab",
        "academic_rank": "Assistant Professor",
        "appointment_type": "Full-time",
        "email": "samer.saab@aub.edu.lb",
        "office_hours": "Tue/Fri 11:00-13:00",
        "qualification": ("PhD Electrical and Computer Engineering", "University of Toronto", 2021, 2, 3),
        "certifications": ["IEEE Member", "Certified LabVIEW Developer (NI)"],
        "memberships": [
            "IEEE Control Systems Society – Member (2021)",
            "IEEE Industrial Electronics Society – Member (2022)",
        ],
        "development": [
            "IEEE CDC workshop on data-driven control for cyber-physical systems (2025)",
            "Completed AUB New Faculty Orientation and Teaching Excellence Program (2023)",
        ],
        "industry": [
            "Systems engineer at MDA Space on satellite attitude determination and control (2019–2021)",
        ],
        "honors": [
            "AUB Early Career Research Fellowship (2023)",
            "Best Student Paper Award, IEEE CCECE (2020)",
        ],
        "services": [
            "Faculty mentor, AUB IEEE Student Branch (2023–Present)",
            "Member, Department Safety and Facilities Committee (2022–Present)",
        ],
        "publications": [
            "S. Saab et al., 'Robust iterative learning control for uncertain multi-agent systems with communication delays,' IEEE Transactions on Automatic Control, 2024.",
            "S. Saab and F. Karameh, 'Learning-based trajectory optimization for energy-constrained embedded platforms,' IEEE Control Systems Letters, 2023.",
        ],
        "c6_qualification": {
            "highest_degree_field": "PhD Electrical and Computer Engineering",
            "highest_degree_year": 2021,
            "academic_rank": "Assistant Professor",
            "academic_appointment": "Full-time",
            "full_time_or_part_time": "Full-time",
            "years_gov_industry": 2,
            "years_teaching": 3,
            "years_at_institution": 3,
            "professional_registration": "IEEE Member, Certified LabVIEW Developer",
        },
        "c6_workload": [
            {"classes": "EECE 210 Electric Circuits; EECE 350 Computer Architecture", "term": "Fall", "year": 2026, "course_id": 1},
        ],
    },
]


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for f in NEW_FACULTY:
        fid = next_id(cur, "FACULTY_MEMBER", "Faculty_ID")

        # --- FACULTY_MEMBER ---
        cur.execute(
            """INSERT INTO FACULTY_MEMBER (Faculty_ID, Full_Name, Academic_Rank, Appointment_Type, Email, Office_Hours)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(Faculty_ID) DO UPDATE SET
                 Full_Name=excluded.Full_Name, Academic_Rank=excluded.Academic_Rank,
                 Appointment_Type=excluded.Appointment_Type, Email=excluded.Email,
                 Office_Hours=excluded.Office_Hours""",
            (fid, f["full_name"], f["academic_rank"], f["appointment_type"], f["email"], f["office_hours"]),
        )

        # --- QUALIFICATION ---
        qid = next_id(cur, "QUALIFICATION", "Qualification_ID")
        degree_field, institution, year, industry_yrs, institution_yrs = f["qualification"]
        cur.execute(
            """INSERT INTO QUALIFICATION (Qualification_ID, Degree_Field, Degree_Institution, Degree_Year,
               Years_Industry_Government, Years_At_Institution, Faculty_ID) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (qid, degree_field, institution, year, industry_yrs, institution_yrs, fid),
        )

        for cert in f["certifications"]:
            cid = next_id(cur, "CERTIFICATION", "Certification_ID")
            cur.execute("INSERT INTO CERTIFICATION (Certification_ID, Certification_title, Faculty_ID) VALUES (?, ?, ?)", (cid, cert, fid))

        for mem in f["memberships"]:
            mid = next_id(cur, "PROFESSIONAL_MEMBERSHIP", "Membership_ID")
            cur.execute("INSERT INTO PROFESSIONAL_MEMBERSHIP (Membership_ID, Membership_Description, Faculty_ID) VALUES (?, ?, ?)", (mid, mem, fid))

        for dev in f["development"]:
            did = next_id(cur, "PROFESSIONAL_DEVELOPMENT", "Development_ID")
            cur.execute("INSERT INTO PROFESSIONAL_DEVELOPMENT (Development_ID, Activity_Description, Faculty_ID) VALUES (?, ?, ?)", (did, dev, fid))

        for exp in f["industry"]:
            eid = next_id(cur, "INDUSTRY_EXPERIENCE", "Experience_ID")
            cur.execute("INSERT INTO INDUSTRY_EXPERIENCE (Experience_ID, Experience_discription, Faculty_ID) VALUES (?, ?, ?)", (eid, exp, fid))

        for hon in f["honors"]:
            hid = next_id(cur, "HONOR_AWARD", "Award_ID")
            cur.execute("INSERT INTO HONOR_AWARD (Award_ID, Award_discription, Faculty_ID) VALUES (?, ?, ?)", (hid, hon, fid))

        for svc in f["services"]:
            sid = next_id(cur, "SERVICE_ACTIVITY", "Service_ID")
            cur.execute("INSERT INTO SERVICE_ACTIVITY (Service_ID, Service_Description, Faculty_ID) VALUES (?, ?, ?)", (sid, svc, fid))

        for pub in f["publications"]:
            pid = next_id(cur, "PUBLICATION", "Publication_ID")
            cur.execute("INSERT INTO PUBLICATION (Publication_ID, Publication_Discription, Faculty_ID) VALUES (?, ?, ?)", (pid, pub, fid))

        # --- ASSIGNED_TO (sidebar + appendix B) ---
        cur.execute("INSERT OR IGNORE INTO ASSIGNED_TO (program_id, Faculty_ID) VALUES (?, ?)", (PROGRAM_ID, fid))

        # --- CRITERION 6: qualification row ---
        q = f["c6_qualification"]
        qrid = next_id(cur, "FACULTY_QUALIFICATION_ROW", "faculty_qualification_row_id")
        cur.execute(
            """INSERT INTO FACULTY_QUALIFICATION_ROW
               (faculty_qualification_row_id, highest_degree_field, highest_degree_year, academic_rank,
                academic_appointment, full_time_or_part_time, years_gov_industry, years_teaching,
                years_at_institution, professional_registration, criterion6_id, Faculty_ID)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (qrid, q["highest_degree_field"], q["highest_degree_year"], q["academic_rank"],
             q["academic_appointment"], q["full_time_or_part_time"], q["years_gov_industry"],
             q["years_teaching"], q["years_at_institution"], q["professional_registration"],
             C6_ID, fid),
        )

        # --- CRITERION 6: workload rows ---
        for wl in f["c6_workload"]:
            wid = next_id(cur, "FACULTY_WORKLOAD_ROW", "faculty_workload_row_id")
            cur.execute(
                """INSERT INTO FACULTY_WORKLOAD_ROW
                   (faculty_workload_row_id, fill_tie_or_part_time, classes_taught_description,
                    term, year, criterion6_id, Faculty_ID, Course_ID)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (wid, q["full_time_or_part_time"], wl["classes"], wl["term"], wl["year"],
                 C6_ID, fid, wl["course_id"]),
            )

        print(f"  Added: {f['full_name']} (ID={fid})")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
