"""
TASK 1: Add missing SO5->EECE490 link via a new teamwork CLO.
         All other SO-course links already exist in SYLLABUS_CLO_SO_MAP.

TASK 2: Add one indirect (Survey) PI per SO, and one direct (Rubric) PI for
         SO5 which currently only has a Survey PI.
"""
import sqlite3, json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
CYCLE_ID   = 19
C4_ID      = 3       # criterion4_id for cycle 19
PROGRAM_ID = 6
EECE490_SYLLABUS_ID = 4   # syllabus_id for EECE 490


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


def combo_exists(cur, syllabus_id, clo_id, so_id):
    return bool(cur.execute(
        "SELECT 1 FROM SYLLABUS_CLO_SO_MAP WHERE syllabus_id=? AND clo_id=? AND so_id=?",
        (syllabus_id, clo_id, so_id)
    ).fetchone())


# ─────────────────────────────────────────────────────────────────────────────
# TASK 2: New PIs  (course ids reference the Criterion 4 JSON courses array)
# JSON courses: 1=EECE210, 2=EECE230, 3=EECE455, 4=EECE310, 5=EECE350,
#               6=EECE420, 7=EECE435, 8=EECE470, 9=EECE480, 10=EECE490,
#               11=EECE301, 12=EECE340
# ─────────────────────────────────────────────────────────────────────────────
NEW_DIRECT_PI = {
    "id": "PI-8",
    "codeMode": "auto",
    "code": "PI-8",
    "soId": "SO5",
    "type": "Direct",
    "desc": "Capstone Team Role Contribution and Peer Evaluation Rubric",
    "supplementalDetail": (
        "Assessed twice in EECE 490 using a structured peer-evaluation rubric: once at the "
        "project midpoint and once at the final presentation. Each team member rates peers on "
        "five dimensions — task completion, communication within the team, initiative, "
        "reliability, and support for teammates — using a 4-point scale. Faculty advisors "
        "also complete an independent observer rating. Scores are aggregated to produce an "
        "individual teamwork attainment percentage for each student."
    ),
    "instrument": "Rubric",
    "freq": "Every semester",
    "threshold": 70,
    "assessedCourseIds": [10],   # EECE 490
    "file": "",
}

NEW_SURVEY_PIS = [
    {
        "id": "PI-9",
        "codeMode": "auto",
        "code": "PI-9",
        "soId": "SO1",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Problem-Solving Competency Survey",
        "supplementalDetail": (
            "End-of-semester survey administered in EECE 310 in which students rate their own "
            "confidence and proficiency across five problem-solving dimensions: problem "
            "identification, mathematical formulation, method selection, solution execution, "
            "and result validation. Responses are collected on a 5-point Likert scale and "
            "aggregated per item; the proportion of students rating themselves at 4 or 5 "
            "must reach the 70% threshold."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [4],   # EECE 310
        "file": "",
    },
    {
        "id": "PI-10",
        "codeMode": "auto",
        "code": "PI-10",
        "soId": "SO2",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Engineering Design Process Competency Survey",
        "supplementalDetail": (
            "End-of-semester survey administered in EECE 350 asking students to reflect on "
            "their experience with the full design cycle: requirements analysis, alternative "
            "generation, constraint-aware evaluation, implementation, and testing. Students "
            "rate perceived growth in each design stage on a 5-point scale. Results are "
            "disaggregated by design-cycle stage to identify curriculum gaps."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [5],   # EECE 350
        "file": "",
    },
    {
        "id": "PI-11",
        "codeMode": "auto",
        "code": "PI-11",
        "soId": "SO3",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Technical Communication Effectiveness Survey",
        "supplementalDetail": (
            "Survey deployed in EECE 455 at the conclusion of the design project. Students "
            "self-rate their effectiveness in written technical reporting, visual data "
            "presentation, oral delivery, and responding to audience questions. The survey "
            "also captures perceived improvement between the project proposal and final "
            "report stages to track within-semester growth."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [3],   # EECE 455
        "file": "",
    },
    {
        "id": "PI-12",
        "codeMode": "auto",
        "code": "PI-12",
        "soId": "SO4",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Ethical Awareness and Professional Responsibility Survey",
        "supplementalDetail": (
            "Anonymous survey administered in EECE 470 after the ethics module. Students "
            "rate their confidence in recognizing ethical dilemmas, applying professional "
            "codes of conduct, weighing societal impacts of security decisions, and "
            "communicating ethical reasoning to stakeholders. Open-ended items capture "
            "qualitative reflections used to refine the ethics case studies for subsequent terms."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [8],   # EECE 470
        "file": "",
    },
    {
        "id": "PI-13",
        "codeMode": "auto",
        "code": "PI-13",
        "soId": "SO5",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Teamwork and Collaborative Leadership Survey",
        "supplementalDetail": (
            "End-of-capstone survey administered in EECE 490 in which students reflect on "
            "their experience working in a multidisciplinary project team. Items cover "
            "goal-setting, task delegation, conflict resolution, inclusive participation, "
            "and meeting shared deadlines. Students also rate the overall team climate "
            "and identify one teamwork practice they would strengthen in a future project."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [10],  # EECE 490
        "file": "",
    },
    {
        "id": "PI-14",
        "codeMode": "auto",
        "code": "PI-14",
        "soId": "SO6",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Experimental Reasoning and Data Interpretation Survey",
        "supplementalDetail": (
            "Survey deployed in EECE 310 at the end of the laboratory sequence. Students "
            "rate their proficiency in designing experiments, selecting measurement methods, "
            "collecting and processing data, identifying sources of error, and drawing "
            "evidence-based conclusions. Results are compared across lab sections to flag "
            "instructional inconsistencies and calibration needs."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [4],   # EECE 310
        "file": "",
    },
    {
        "id": "PI-15",
        "codeMode": "auto",
        "code": "PI-15",
        "soId": "SO7",
        "type": "Indirect",
        "desc": "Student Self-Assessment of Independent Learning and Knowledge Transfer Survey",
        "supplementalDetail": (
            "Survey administered in EECE 480 at the conclusion of the final project. Students "
            "reflect on their ability to independently identify knowledge gaps, locate and "
            "evaluate resources, teach themselves new ML techniques beyond course content, "
            "and transfer that knowledge to an engineering application. Items are scored on "
            "a 5-point scale; faculty use aggregated results to calibrate the open-ended "
            "project scope each semester."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [9],   # EECE 480
        "file": "",
    },
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── TASK 1: Add SO5 → EECE 490 link ──────────────────────────────────────
    print("=== TASK 1: SO-course links ===")

    # Create teamwork CLO for EECE 490
    new_clo_id = next_id(cur, "CLO", "clo_id")
    cur.execute(
        "INSERT INTO CLO (clo_id, description, level) VALUES (?, ?, ?)",
        (
            new_clo_id,
            "Contribute effectively to a multidisciplinary capstone team by fulfilling "
            "individual role responsibilities, coordinating with team members, and "
            "supporting collaborative goal achievement.",
            "P6-CLO31",
        ),
    )
    print(f"  Created CLO {new_clo_id} (P6-CLO31) for SO5 teamwork")

    # Link CLO to EECE 490 syllabus
    cur.execute(
        "INSERT OR IGNORE INTO HAS_CLO (clo_id, syllabus_id) VALUES (?, ?)",
        (new_clo_id, EECE490_SYLLABUS_ID),
    )

    # Map CLO to SO5 in MAPS_TO
    cur.execute(
        "INSERT OR IGNORE INTO MAPS_TO (so_id, clo_id) VALUES (?, ?)",
        (5, new_clo_id),
    )

    # Add to SYLLABUS_CLO_SO_MAP
    if not combo_exists(cur, EECE490_SYLLABUS_ID, new_clo_id, 5):
        map_id = next_id(cur, "SYLLABUS_CLO_SO_MAP", "map_id")
        cur.execute(
            "INSERT INTO SYLLABUS_CLO_SO_MAP (map_id, syllabus_id, clo_id, so_id) VALUES (?, ?, ?, ?)",
            (map_id, EECE490_SYLLABUS_ID, new_clo_id, 5),
        )
        print(f"  Added SYLLABUS_CLO_SO_MAP: syllabus={EECE490_SYLLABUS_ID} CLO={new_clo_id} SO5 -> EECE 490")
    else:
        print("  SO5->EECE490 link already exists, skipped.")

    # Confirm all other required links
    required = [
        # (syllabus_id, clo_id, so_id, label)
        (11, 9,  1, "EECE301->SO1"), (11, 10, 1, "EECE301->SO1"), (11, 10, 6, "EECE301->SO6"),
        (11, 11, 6, "EECE301->SO6"),
        (12, 12, 1, "EECE310->SO1"), (12, 13, 2, "EECE310->SO2"), (12, 14, 6, "EECE310->SO6"),
        (13, 15, 1, "EECE340->SO1"), (13, 16, 1, "EECE340->SO1"), (13, 16, 7, "EECE340->SO7"),
        (14, 17, 1, "EECE350->SO1"), (14, 19, 1, "EECE350->SO1"), (14, 18, 2, "EECE350->SO2"),
        (14, 18, 6, "EECE350->SO6"),
        (15, 20, 1, "EECE420->SO1"), (15, 21, 2, "EECE420->SO2"), (15, 22, 3, "EECE420->SO3"),
        (16, 23, 1, "EECE435->SO1"), (16, 24, 2, "EECE435->SO2"), (16, 24, 6, "EECE435->SO6"),
        (16, 25, 4, "EECE435->SO4"),
        (17, 26, 1, "EECE470->SO1"), (17, 28, 2, "EECE470->SO2"), (17, 27, 4, "EECE470->SO4"),
        (17, 28, 6, "EECE470->SO6"),
        (18, 29, 1, "EECE480->SO1"), (18, 30, 2, "EECE480->SO2"), (18, 29, 6, "EECE480->SO6"),
        (18, 31, 7, "EECE480->SO7"),
        (1,  3,  2, "EECE210->SO2"), (1,  4,  7, "EECE210->SO7"),
        (2,  5,  2, "EECE230->SO2"), (2,  6,  4, "EECE230->SO4"),
        (3,  7,  2, "EECE455->SO2"), (3,  8,  3, "EECE455->SO3"),
    ]
    missing = [(s, c, o, l) for s, c, o, l in required if not combo_exists(cur, s, c, o)]
    if missing:
        for s, c, o, label in missing:
            mid = next_id(cur, "SYLLABUS_CLO_SO_MAP", "map_id")
            cur.execute(
                "INSERT INTO SYLLABUS_CLO_SO_MAP (map_id, syllabus_id, clo_id, so_id) VALUES (?, ?, ?, ?)",
                (mid, s, c, o),
            )
            print(f"  Added missing link: {label}")
    else:
        print("  All other SO-course links already present.")

    # ── TASK 2: PIs ──────────────────────────────────────────────────────────
    print("\n=== TASK 2: PIs ===")
    row = cur.execute(
        "SELECT assessment_processes_description FROM CRITERION_4 WHERE criterion4_id=?",
        (C4_ID,)
    ).fetchone()
    data = json.loads(row[0])
    existing_pis = data.get("pis", [])
    existing_ids = {pi["id"] for pi in existing_pis}

    all_new = [NEW_DIRECT_PI] + NEW_SURVEY_PIS
    added = 0
    for pi in all_new:
        if pi["id"] not in existing_ids:
            existing_pis.append(pi)
            print(f"  Added {pi['id']} ({pi['soId']}, {pi['instrument']}): {pi['desc'][:55]}")
            added += 1
        else:
            print(f"  {pi['id']} already exists, skipped.")

    data["pis"] = existing_pis
    cur.execute(
        "UPDATE CRITERION_4 SET assessment_processes_description=? WHERE criterion4_id=?",
        (json.dumps(data), C4_ID)
    )
    print(f"\n  Total PIs now: {len(existing_pis)} ({added} newly added)")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
