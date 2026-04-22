"""Populate Criterion 7 (Facilities) for CCE program, Cycle 19, criterion7_id=7."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
C7_ID = 7


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


CLASSROOMS = [
    {
        "room": "Bechtel 202",
        "capacity": 32,
        "multimedia": "Single projector, interactive whiteboard, document camera",
        "internet": "Campus Wi-Fi and wired instructor station",
        "typical_use": "Small-group problem-solving sessions and recitations",
        "adequacy": "Well-suited for interactive and flipped-classroom formats",
    },
    {
        "room": "Bechtel 310",
        "capacity": 72,
        "multimedia": "Dual projectors, 4K display, lecture capture, microphone system",
        "internet": "Campus Wi-Fi, wired instructor and TA stations",
        "typical_use": "Large-enrollment lectures for EECE 210, EECE 230, EECE 340",
        "adequacy": "Adequate for large sections; seating recently replaced (2024)",
    },
    {
        "room": "Engineering Building A-105",
        "capacity": 24,
        "multimedia": "Wall-mounted display, wireless screen sharing, whiteboard walls",
        "internet": "Campus Wi-Fi with guest VLAN",
        "typical_use": "Capstone design team meetings and project reviews",
        "adequacy": "Excellent for collaborative design work; flexible furniture layout",
    },
    {
        "room": "Bechtel Auditorium",
        "capacity": 150,
        "multimedia": "Dual screens, broadcast audio system, lecture capture, video conferencing",
        "internet": "Campus Wi-Fi and hardwired AV control desk",
        "typical_use": "Program orientation, departmental seminars, and external speaker events",
        "adequacy": "Reserved for large events; not used for regular course instruction",
    },
]

LABS = [
    {
        "name": "Computer Communication Networks Laboratory",
        "room": "Bechtel B14",
        "category": "Networking and Communications",
        "hardware": "Cisco routers (ISR 4321), managed switches (Catalyst 2960), patch panels, rack enclosures, network analyzer, spectrum analyzer",
        "software": "Cisco IOS, Wireshark, GNS3, Cisco Packet Tracer, Python networking libraries",
        "open_hours": "Mon–Fri 08:00–20:00, Sat 09:00–14:00",
        "courses": "EECE 455, EECE 470",
    },
    {
        "name": "Wireless and RF Systems Laboratory",
        "room": "Bechtel B16",
        "category": "Wireless Communications",
        "hardware": "Software-defined radio platforms (USRP N210), signal generators, spectrum analyzers, anechoic test chamber, vector network analyzer, RF cables and antenna kits",
        "software": "GNU Radio, MATLAB Communications Toolbox, LabVIEW",
        "open_hours": "Mon–Fri 09:00–18:00",
        "courses": "EECE 420, EECE 301",
    },
    {
        "name": "Software Engineering and AI Laboratory",
        "room": "Engineering Building A-110",
        "category": "Computing and Artificial Intelligence",
        "hardware": "High-performance workstations (Intel Core i9, 64 GB RAM, NVIDIA RTX 4080), dual-monitor setups, NAS storage server",
        "software": "Python, TensorFlow, PyTorch, Scikit-learn, Jupyter, Docker, Git, VS Code",
        "open_hours": "Mon–Fri 08:00–22:00, Sat–Sun 10:00–18:00",
        "courses": "EECE 480, EECE 435, EECE 230",
    },
    {
        "name": "Electronic Circuits and Measurement Laboratory",
        "room": "Bechtel B10",
        "category": "Electronics and Instrumentation",
        "hardware": "Bench power supplies, digital multimeters, oscilloscopes (4-channel, 200 MHz), function generators, soldering stations, breadboard kits, component inventory",
        "software": "Multisim, LTspice, MATLAB",
        "open_hours": "Mon–Fri 08:00–18:00",
        "courses": "EECE 210",
    },
]

COMPUTING = [
    {
        "name": "Departmental Linux Compute Server",
        "location": "Faculty of Engineering server room, Bechtel basement",
        "notes": "Provides CPU-intensive simulation and compilation resources; accessible via SSH from campus and VPN",
        "hours": "24/7 with scheduled maintenance windows on Sundays 02:00–06:00",
        "access_type": "Remote access via SSH and VPN; managed accounts for enrolled students",
    },
    {
        "name": "Cloud Computing Allocation (AWS Academy)",
        "location": "Cloud-based; managed through AWS Academy Educator program",
        "notes": "Provides elastic compute, storage, and managed ML services for capstone and research projects; credits allocated each semester",
        "hours": "Continuous availability; credit quotas managed per course section",
        "access_type": "Browser-based AWS Management Console with academic credentials",
    },
    {
        "name": "GPU Cluster for Deep Learning",
        "location": "Engineering Building A-112, secured compute room",
        "notes": "4-node cluster with NVIDIA A100 GPUs; shared among EECE 480 and graduate research; job scheduler (SLURM) ensures fair access",
        "hours": "Mon–Fri 07:00–23:00; weekend access with faculty approval",
        "access_type": "SLURM job scheduler with user accounts; remote submission supported",
    },
]

UPGRADES = [
    {
        "name": "Computer Communication Networks Laboratory",
        "next_upgrade": "2026-08-01",
        "last_upgrade": "2023-07-20",
        "notes": "Next cycle will replace aging Cisco ISR 2900 routers with ISR 4321 units and add SDN-capable switches for software-defined networking experiments",
        "staff": "Network lab engineer and department IT coordinator",
    },
    {
        "name": "Wireless and RF Systems Laboratory",
        "next_upgrade": "2027-01-15",
        "last_upgrade": "2024-06-01",
        "notes": "Spectrum analyzer replaced in 2024; next upgrade targets additional USRP units and mmWave antenna test equipment for 5G experiments",
        "staff": "RF lab technician and Dr. Tarek Mansour",
    },
    {
        "name": "Classroom AV Systems – Bechtel 310",
        "next_upgrade": "2026-05-30",
        "last_upgrade": "2022-09-01",
        "notes": "Projector lamps and HDMI switching matrices due for replacement; lecture capture system firmware update scheduled",
        "staff": "AUB Information Technology – AV Services team",
    },
    {
        "name": "GPU Cluster for Deep Learning",
        "next_upgrade": "2028-06-01",
        "last_upgrade": "2025-01-10",
        "notes": "Cluster installed in 2025 with A100 GPUs; next planned expansion adds two additional compute nodes and upgrades shared storage to NVMe",
        "staff": "Department IT administrator and Dr. Nadia Farhat",
    },
    {
        "name": "Software Engineering and AI Laboratory",
        "next_upgrade": "2027-08-01",
        "last_upgrade": "2024-08-01",
        "notes": "Workstations refreshed in 2024; next cycle will upgrade RAM to 128 GB and add additional GPU cards to support expanded AI coursework",
        "staff": "Department IT coordinator and Dr. Maya Khouri",
    },
]

C7_FIELDS = {
    "total_number_of_offices": 28,
    "average_workspace_size": 15.2,
    "guidance_description": (
        "All students receive a facilities and safety orientation at the start of each academic year covering laboratory access procedures, "
        "equipment checkout policies, emergency exits, and computing resource acceptable-use guidelines. Laboratory-intensive courses "
        "include a mandatory safety briefing in the first class session. Undergraduate teaching assistants and lab engineers are present "
        "during scheduled open-lab hours to provide additional guidance."
    ),
    "responsible_faculty_name": "Dr. Lina Saab",
    "maintenance_policy_description": (
        "Teaching spaces are inspected at the start and end of each semester. Laboratory equipment follows a preventive maintenance "
        "schedule managed by the departmental lab engineer; high-use instruments are calibrated annually or as required by manufacturer "
        "specifications. Failure reports are submitted through an online work-order system to the Facilities Management office, with "
        "priority assigned based on instructional impact. Major equipment purchases and replacements are planned through the annual "
        "departmental budget cycle with input from course coordinators."
    ),
    "technical_collections_and_journals": (
        "AUB Libraries maintain comprehensive print and electronic collections in electrical engineering, computer engineering, "
        "communications, signal processing, and computer science. Holdings include IEEE and ACM standards, major textbooks, "
        "and reference works. The Jafet Library engineering reading room provides dedicated study space adjacent to the engineering collection."
    ),
    "electronic_databases_and_eresources": (
        "Students and faculty have authenticated access to IEEE Xplore, ACM Digital Library, ScienceDirect (Elsevier), Springer Link, "
        "Web of Science, Scopus, and JSTOR. Remote access is available through the AUB Libraries VPN and EZproxy gateway. "
        "MATLAB Campus License, Wolfram Mathematica, and AutoCAD are available through software licensing agreements."
    ),
    "faculty_book_request_process": (
        "Faculty submit acquisition requests through the AUB Libraries online request form or directly to the engineering subject librarian. "
        "Requests are reviewed for budget availability and curriculum relevance; approved purchases are typically received within four to six weeks. "
        "Rush orders for items supporting imminent course use are accommodated when stock is available."
    ),
    "library_access_hours_and_systems": (
        "Jafet Library is open Sunday through Thursday 08:00–24:00, Friday 14:00–24:00, and Saturday 09:00–17:00 during the academic year. "
        "Electronic resources and the library catalog are accessible 24/7 through campus networks and authenticated remote access. "
        "Document delivery and interlibrary loan services are available for materials not held locally."
    ),
    "facilities_support_student_outcomes": (
        "The program's classrooms, laboratories, and computing infrastructure are designed to support all ABET student outcomes. "
        "Design-oriented courses are supported by project rooms and the software engineering lab. Experimental and measurement skills "
        "are developed in the electronics, embedded systems, and RF laboratories. Communication and teamwork outcomes are supported by "
        "collaborative workspaces and presentation-capable classrooms. Computing resources provide the capacity needed for signal processing, "
        "networking, and machine learning coursework across the curriculum."
    ),
    "safety_and_inspection_processes": (
        "The Department of Electrical and Computer Engineering coordinates with the AUB Environmental Health and Safety (EHS) office "
        "to conduct annual safety inspections of all instructional laboratories. Laboratory safety data sheets are maintained for all "
        "chemicals and hazardous materials. Fire extinguishers, first-aid kits, and emergency eye-wash stations are inspected monthly "
        "by lab engineers. Students complete a safety quiz before gaining unsupervised access to laboratory areas. Incident reports "
        "are filed with EHS within 24 hours of any reportable event."
    ),
    "compliance_with_university_policy": (
        "All instructional spaces comply with AUB policies on accessibility, information technology acceptable use, data privacy, "
        "procurement, and environmental health and safety. Classrooms and laboratories meet Lebanese fire safety code requirements "
        "and AUB building standards. Equipment procurement follows the university purchasing policy, including competitive bidding "
        "thresholds and supplier due-diligence requirements."
    ),
    "student_availability_details": (
        "Faculty maintain posted office hours of at least four hours per week during the academic term. Additional appointments "
        "are available by request and are commonly offered during midterm and final examination periods. The department administrative "
        "office provides scheduling assistance. Graduate teaching assistants hold recitation sections and supplemental help sessions "
        "for core undergraduate courses. Academic advising is available from the program coordinator and the Faculty of Engineering "
        "advising center on a walk-in and appointment basis."
    ),
}


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Update the main Criterion 7 record
    cur.execute(
        """UPDATE CRITERION_7_FACILITIES SET
            total_number_of_offices=?, average_workspace_size=?, guidance_description=?,
            responsible_faculty_name=?, maintenance_policy_description=?,
            technical_collections_and_journals=?, electronic_databases_and_eresources=?,
            faculty_book_request_process=?, library_access_hours_and_systems=?,
            facilities_support_student_outcomes=?, safety_and_inspection_processes=?,
            compliance_with_university_policy=?, student_availability_details=?,
            is_complete=1
           WHERE criterion7_id=?""",
        (
            C7_FIELDS["total_number_of_offices"],
            C7_FIELDS["average_workspace_size"],
            C7_FIELDS["guidance_description"],
            C7_FIELDS["responsible_faculty_name"],
            C7_FIELDS["maintenance_policy_description"],
            C7_FIELDS["technical_collections_and_journals"],
            C7_FIELDS["electronic_databases_and_eresources"],
            C7_FIELDS["faculty_book_request_process"],
            C7_FIELDS["library_access_hours_and_systems"],
            C7_FIELDS["facilities_support_student_outcomes"],
            C7_FIELDS["safety_and_inspection_processes"],
            C7_FIELDS["compliance_with_university_policy"],
            C7_FIELDS["student_availability_details"],
            C7_ID,
        ),
    )
    print("Updated main Criterion 7 record.")

    # Clear existing child rows for C7_ID and re-insert
    cur.execute("DELETE FROM CLASSROOMS WHERE criterion7_id=?", (C7_ID,))
    cur.execute("DELETE FROM LABORATORIES WHERE criterion7_id=?", (C7_ID,))
    cur.execute("DELETE FROM COMPUTING_RESOURCES WHERE criterion7_id=?", (C7_ID,))
    cur.execute("DELETE FROM UPGRADING_FACILITES WHERE criterion7_id=?", (C7_ID,))

    for c in CLASSROOMS:
        cid = next_id(cur, "CLASSROOMS", "classroom_id")
        cur.execute(
            """INSERT INTO CLASSROOMS (classroom_id, classroom_room, classroom_capacity, classroom_multimedia,
               classroom_internet_access, classroom_typical_use, classroom_adequacy_comments, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (cid, c["room"], c["capacity"], c["multimedia"], c["internet"], c["typical_use"], c["adequacy"], C7_ID),
        )
        print(f"  Added classroom: {c['room']}")

    for lab in LABS:
        lid = next_id(cur, "LABORATORIES", "lab_id")
        cur.execute(
            """INSERT INTO LABORATORIES (lab_id, lab_name, lab_room, lab_category, lab_hardware_list,
               lab_software_list, lab_open_hours, lab_courses_using_lab, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (lid, lab["name"], lab["room"], lab["category"], lab["hardware"], lab["software"], lab["open_hours"], lab["courses"], C7_ID),
        )
        print(f"  Added lab: {lab['name']}")

    for res in COMPUTING:
        rid = next_id(cur, "COMPUTING_RESOURCES", "computing_resources_id")
        cur.execute(
            """INSERT INTO COMPUTING_RESOURCES (computing_resources_id, computing_resource_name, computing_resource_location,
               computing_adequacy_notes, computing_hours_available, computing_access_type, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (rid, res["name"], res["location"], res["notes"], res["hours"], res["access_type"], C7_ID),
        )
        print(f"  Added computing resource: {res['name']}")

    for upg in UPGRADES:
        uid = next_id(cur, "UPGRADING_FACILITES", "facility_id")
        cur.execute(
            """INSERT INTO UPGRADING_FACILITES (facility_id, facility_name, next_scheduled_upgrade, last_upgrade_date,
               maintenance_notes, responsible_staff, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (uid, upg["name"], upg["next_upgrade"], upg["last_upgrade"], upg["notes"], upg["staff"], C7_ID),
        )
        print(f"  Added upgrade plan: {upg['name']}")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
