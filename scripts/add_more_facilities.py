"""Add more classrooms, labs, computing resources, and upgrade plans to Criterion 7 (criterion7_id=7)."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
C7_ID = 7


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


NEW_CLASSROOMS = [
    {
        "room": "Bechtel 101",
        "capacity": 55,
        "multimedia": "Dual projectors, document camera, motorized screen, lecture capture system",
        "internet": "Campus Wi-Fi and wired instructor podium with HDMI/VGA switching",
        "typical_use": "Core EECE lectures: EECE 210, EECE 301, EECE 340",
        "adequacy": "Adequate for mid-size sections; recently upgraded projectors and seating (2023)",
    },
    {
        "room": "Bechtel 205",
        "capacity": 20,
        "multimedia": "85-inch 4K interactive display, wireless screen mirroring, whiteboard walls",
        "internet": "Campus Wi-Fi with dedicated VLAN for classroom devices",
        "typical_use": "Graduate seminars, senior elective courses, and oral defense sessions",
        "adequacy": "Ideal for discussion-based and seminar-style instruction; flexible seating",
    },
    {
        "room": "Engineering Building B-201",
        "capacity": 28,
        "multimedia": "Wall-mounted dual displays, document camera, digital annotation tablet",
        "internet": "Campus Wi-Fi and wired connection at instructor station",
        "typical_use": "Tutorial sessions, recitations, and small-group assessments",
        "adequacy": "Well-suited for interactive problem-solving sessions and TA-led recitations",
    },
    {
        "room": "Engineering Building C-103",
        "capacity": 40,
        "multimedia": "Single laser projector, screen, HDMI and wireless AirPlay connectivity",
        "internet": "Campus Wi-Fi; portable hotspot available for backup",
        "typical_use": "Multi-purpose: lectures, workshops, department meetings, and poster sessions",
        "adequacy": "Flexible layout supports both lecture and workshop configurations",
    },
    {
        "room": "Bechtel 320",
        "capacity": 30,
        "multimedia": "Projector, document camera, SMART Board, lecture capture",
        "internet": "Campus Wi-Fi and wired instructor station",
        "typical_use": "EECE 435, EECE 470, and selective elective courses",
        "adequacy": "Good fit for advanced electives with moderate enrollment",
    },
]

NEW_LABS = [
    {
        "name": "Control Systems and Robotics Laboratory",
        "room": "Engineering Building A-115",
        "category": "Control Engineering and Robotics",
        "hardware": "QNET rotary pendulum boards, DC motor control kits, NI myRIO embedded controllers, robotic arm platforms, servo drives, PLC training stations, oscilloscopes",
        "software": "MATLAB/Simulink, LabVIEW, NI DAQmx, ROS (Robot Operating System)",
        "open_hours": "Mon–Fri 09:00–18:00",
        "courses": "EECE 210, capstone design projects",
    },
    {
        "name": "PCB Design and Hardware Prototyping Laboratory",
        "room": "Bechtel B18",
        "category": "Hardware Design and Fabrication",
        "hardware": "PCB milling machine (LPKF ProtoMat), reflow oven, hot air rework stations, SMD component storage, soldering stations (×16), ESD-safe workbenches, microscopes",
        "software": "Altium Designer, KiCad, Autodesk Eagle",
        "open_hours": "Mon–Fri 09:00–17:00 (supervised); after-hours access with faculty approval",
        "courses": "EECE 350, EECE 480, capstone design projects",
    },
    {
        "name": "Graduate Research Laboratory",
        "room": "Engineering Building A-118",
        "category": "Research Computing and Experimentation",
        "hardware": "High-performance workstations (AMD Threadripper, 128 GB RAM), multi-screen setups, network-attached storage (80 TB NAS), oscilloscopes, spectrum analyzer",
        "software": "MATLAB, Python, TensorFlow, PyTorch, ns-3, Vivado, custom research tools",
        "open_hours": "24/7 access for enrolled graduate students and research assistants",
        "courses": "Graduate research, senior capstone projects supervised by faculty",
    },
]

NEW_COMPUTING = [
    {
        "name": "Virtual Desktop Infrastructure (VDI)",
        "location": "AUB Information Technology data center; accessed via campus network and VPN",
        "notes": "Provides persistent virtual desktops with pre-installed engineering software for students without high-spec personal machines; supports MATLAB, Vivado, and Python environments",
        "hours": "24/7 availability; maintenance windows communicated via AUB IT portal",
        "access_type": "Browser-based and VMware Horizon client; authenticated with AUB credentials",
    },
    {
        "name": "High-Performance Storage and Backup Server",
        "location": "Faculty of Engineering server room, Bechtel basement",
        "notes": "Centralized 80 TB NAS for research data, course project submissions, and evidence file storage; automated nightly backups with 90-day retention",
        "hours": "Continuous availability; monitored 24/7 by AUB IT infrastructure team",
        "access_type": "SMB/NFS share with role-based access; VPN required for off-campus access",
    },
]

NEW_UPGRADES = [
    {
        "name": "Bechtel 101 Classroom Renovation",
        "next_upgrade": "2027-05-30",
        "last_upgrade": "2023-06-01",
        "notes": "Planned upgrade includes replacement of fixed seating with flexible tablet-arm chairs, addition of secondary display for back rows, and installation of improved acoustic panels",
        "staff": "AUB Facilities Management and AV Services team",
    },
    {
        "name": "Control Systems and Robotics Laboratory",
        "next_upgrade": "2027-08-01",
        "last_upgrade": "2024-05-15",
        "notes": "Next cycle targets additional NI myRIO units to increase student-to-equipment ratio and replacement of legacy pendulum boards nearing end of manufacturer support",
        "staff": "Laboratory engineer and Dr. Samer Saab",
    },
    {
        "name": "PCB Design and Hardware Prototyping Laboratory",
        "next_upgrade": "2026-08-01",
        "last_upgrade": "2022-09-01",
        "notes": "LPKF milling machine due for spindle replacement and software upgrade; reflow oven thermocouple calibration scheduled; additional SMD component inventory planned",
        "staff": "Department technical staff and Dr. Maya Khouri",
    },
    {
        "name": "Faculty Office Wing – Bechtel 4th Floor",
        "next_upgrade": "2028-01-01",
        "last_upgrade": "2021-08-01",
        "notes": "Long-term renovation plan for 14 offices on the 4th floor: upgraded HVAC, new workstation furniture, improved soundproofing, and wired gigabit ethernet at every desk",
        "staff": "AUB Facilities Management",
    },
]

# Updated narrative fields for the main C7 record
UPDATED_FIELDS = {
    "total_number_of_offices": 28,
    "average_workspace_size": 15.2,
    "guidance_description": (
        "All students receive a facilities and safety orientation at the start of each academic year covering laboratory access "
        "procedures, equipment checkout policies, emergency exits, and computing resource acceptable-use guidelines. "
        "Laboratory-intensive courses include a mandatory safety briefing in the first class session. Undergraduate teaching "
        "assistants and lab engineers are present during scheduled open-lab hours to provide guidance.\n\n"
        "Faculty Offices: The department maintains 28 private or shared faculty offices distributed across three buildings. "
        "Bechtel Hall (4th floor) houses 14 offices for tenured and tenure-track faculty, each averaging 15–18 m² with a "
        "workstation, bookshelves, and a guest seating area for student meetings. Engineering Building A (2nd floor) hosts "
        "8 offices used by visiting, part-time, and research faculty (12–14 m² average). Engineering Building B (3rd floor) "
        "provides 6 shared offices for postdoctoral researchers and full-time lecturers (10–12 m² per occupant). All offices "
        "have wired and wireless network connectivity and access to shared departmental printing and copying facilities on "
        "each floor. A faculty lounge and small conference room are available on the Bechtel 4th floor for informal meetings "
        "and collaborative work."
    ),
}


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for c in NEW_CLASSROOMS:
        cid = next_id(cur, "CLASSROOMS", "classroom_id")
        cur.execute(
            """INSERT INTO CLASSROOMS (classroom_id, classroom_room, classroom_capacity, classroom_multimedia,
               classroom_internet_access, classroom_typical_use, classroom_adequacy_comments, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (cid, c["room"], c["capacity"], c["multimedia"], c["internet"], c["typical_use"], c["adequacy"], C7_ID),
        )
        print(f"  Classroom: {c['room']} ({c['capacity']} seats)")

    for lab in NEW_LABS:
        lid = next_id(cur, "LABORATORIES", "lab_id")
        cur.execute(
            """INSERT INTO LABORATORIES (lab_id, lab_name, lab_room, lab_category, lab_hardware_list,
               lab_software_list, lab_open_hours, lab_courses_using_lab, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (lid, lab["name"], lab["room"], lab["category"], lab["hardware"],
             lab["software"], lab["open_hours"], lab["courses"], C7_ID),
        )
        print(f"  Lab: {lab['name']}")

    for res in NEW_COMPUTING:
        rid = next_id(cur, "COMPUTING_RESOURCES", "computing_resources_id")
        cur.execute(
            """INSERT INTO COMPUTING_RESOURCES (computing_resources_id, computing_resource_name,
               computing_resource_location, computing_adequacy_notes, computing_hours_available,
               computing_access_type, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (rid, res["name"], res["location"], res["notes"], res["hours"], res["access_type"], C7_ID),
        )
        print(f"  Computing: {res['name']}")

    for upg in NEW_UPGRADES:
        uid = next_id(cur, "UPGRADING_FACILITES", "facility_id")
        cur.execute(
            """INSERT INTO UPGRADING_FACILITES (facility_id, facility_name, next_scheduled_upgrade,
               last_upgrade_date, maintenance_notes, responsible_staff, criterion7_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (uid, upg["name"], upg["next_upgrade"], upg["last_upgrade"],
             upg["notes"], upg["staff"], C7_ID),
        )
        print(f"  Upgrade plan: {upg['name']}")

    # Update main C7 narrative with office details
    cur.execute(
        "UPDATE CRITERION_7_FACILITIES SET total_number_of_offices=?, average_workspace_size=?, guidance_description=? WHERE criterion7_id=?",
        (UPDATED_FIELDS["total_number_of_offices"], UPDATED_FIELDS["average_workspace_size"],
         UPDATED_FIELDS["guidance_description"], C7_ID),
    )
    print("\n  Updated main C7 office narrative.")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
