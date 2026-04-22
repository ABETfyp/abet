"""Update Criterion 4 JSON for cycle 19: fix PI-1, update PI-2, add PI-3 through PI-7,
and expand the courses array so all assessed courses are referenceable."""
import sqlite3, json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
CYCLE_ID = 19

# Courses to add to the JSON courses array (id = position in JSON list, course_id = DB id)
EXTRA_COURSES = [
    {"id": 4,  "course_id": 10, "code": "EECE 310"},   # Digital Signal Processing
    {"id": 5,  "course_id": 12, "code": "EECE 350"},   # Computer Architecture
    {"id": 6,  "course_id": 13, "code": "EECE 420"},   # Wireless Communications
    {"id": 7,  "course_id": 14, "code": "EECE 435"},   # Operating Systems
    {"id": 8,  "course_id": 15, "code": "EECE 470"},   # Network Security
    {"id": 9,  "course_id": 16, "code": "EECE 480"},   # Machine Learning
    {"id": 10, "course_id": 8,  "code": "EECE 490"},   # Capstone Design II
    {"id": 11, "course_id": 9,  "code": "EECE 301"},   # Electromagnetics
    {"id": 12, "course_id": 11, "code": "EECE 340"},   # Probability & Random Processes
]

# Full PI definitions — one per SO
# assessedCourseIds reference the JSON courses array `id` field
NEW_PIS = [
    {
        "id": "PI-1",
        "codeMode": "auto",
        "code": "PI-1",
        "soId": "SO1",
        "type": "Direct",
        "desc": "Circuit Analysis and Computational Problem-Solving Rubric",
        "supplementalDetail": (
            "Assessed via a graded design problem on the EECE 210 midterm and final exams; "
            "students must apply Kirchhoff's laws, nodal/mesh analysis, and Thevenin equivalents "
            "to a multi-element circuit and verify results computationally using MATLAB. "
            "Faculty score responses using a shared four-criterion rubric aligned to SO1."
        ),
        "instrument": "Rubric",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [1],   # EECE 210
        "file": "",
    },
    {
        "id": "PI-2",
        "codeMode": "auto",
        "code": "PI-2",
        "soId": "SO2",
        "type": "Direct",
        "desc": "FPGA-Based Processor Design Project Rubric",
        "supplementalDetail": (
            "Assessed via the EECE 350 semester-long design project in which student teams "
            "specify, implement, and test a pipelined RISC-V datapath on an FPGA development board. "
            "The rubric evaluates requirement traceability, design justification, timing closure, "
            "and consideration of resource, power, and correctness constraints."
        ),
        "instrument": "Rubric",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [5],   # EECE 350
        "file": "",
    },
    {
        "id": "PI-3",
        "codeMode": "auto",
        "code": "PI-3",
        "soId": "SO3",
        "type": "Direct",
        "desc": "Network Design Project Technical Report and Oral Presentation Rubric",
        "supplementalDetail": (
            "Assessed via the EECE 455 design project deliverables: a formal written report "
            "and a 15-minute oral presentation with Q&A. Faculty evaluate clarity of problem "
            "framing, logical structure of the solution narrative, quality of figures and tables, "
            "and ability to communicate technical trade-offs to a mixed technical audience."
        ),
        "instrument": "Rubric",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [3],   # EECE 455
        "file": "",
    },
    {
        "id": "PI-4",
        "codeMode": "auto",
        "code": "PI-4",
        "soId": "SO4",
        "type": "Direct",
        "desc": "Cybersecurity Ethics and Professional Responsibility Exam",
        "supplementalDetail": (
            "Assessed via a dedicated exam section in EECE 470 covering responsible disclosure, "
            "legal boundaries of penetration testing, privacy obligations, and the ACM/IEEE "
            "Software Engineering Code of Ethics. Students must analyze a realistic scenario "
            "and justify the ethically and legally appropriate course of action with reasoning."
        ),
        "instrument": "Exam",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [8],   # EECE 470
        "file": "",
    },
    {
        "id": "PI-5",
        "codeMode": "auto",
        "code": "PI-5",
        "soId": "SO5",
        "type": "Indirect",
        "desc": "Capstone Team Collaboration and Leadership Survey",
        "supplementalDetail": (
            "Assessed via a validated peer-and-self evaluation survey administered at the midpoint "
            "and conclusion of EECE 490. Team members rate each other and themselves on goal-setting, "
            "task distribution, conflict resolution, inclusivity, and meeting commitments. "
            "Faculty advisors also complete an independent observer rating for each team."
        ),
        "instrument": "Survey",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [10],  # EECE 490
        "file": "",
    },
    {
        "id": "PI-6",
        "codeMode": "auto",
        "code": "PI-6",
        "soId": "SO6",
        "type": "Direct",
        "desc": "DSP Laboratory Data Collection, Analysis, and Validation Rubric",
        "supplementalDetail": (
            "Assessed via the EECE 310 laboratory reports in which students design a digital filter, "
            "collect frequency-response measurements using MATLAB, compare results to theoretical "
            "predictions, and interpret discrepancies using engineering judgment. "
            "Reports are scored on experimental design, data presentation, analysis depth, and conclusions."
        ),
        "instrument": "Rubric",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [4],   # EECE 310
        "file": "",
    },
    {
        "id": "PI-7",
        "codeMode": "auto",
        "code": "PI-7",
        "soId": "SO7",
        "type": "Direct",
        "desc": "Machine Learning Independent Study and Novel Application Rubric",
        "supplementalDetail": (
            "Assessed via the EECE 480 final project in which student teams independently select "
            "an engineering problem outside the course syllabus, self-direct their learning of a "
            "relevant ML technique not covered in lectures, implement a working solution, and "
            "present a critical evaluation of model performance, limitations, and transferability."
        ),
        "instrument": "Rubric",
        "freq": "Every semester",
        "threshold": 70,
        "assessedCourseIds": [9],   # EECE 480
        "file": "",
    },
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    row = cur.execute(
        "SELECT criterion4_id, assessment_processes_description FROM CRITERION_4 WHERE Cycle_ID=?",
        (CYCLE_ID,)
    ).fetchone()

    c4_id, raw = row
    data = json.loads(raw) if raw else {}

    # ── 1. Expand courses array ──────────────────────────────────────────────
    existing_ids = {c["id"] for c in data.get("courses", [])}
    for ec in EXTRA_COURSES:
        if ec["id"] not in existing_ids:
            data.setdefault("courses", []).append(ec)
    print(f"Courses in JSON: {len(data['courses'])}")

    # ── 2. Replace PI list entirely ──────────────────────────────────────────
    data["pis"] = NEW_PIS
    print(f"PIs written: {len(NEW_PIS)}")
    for pi in NEW_PIS:
        print(f"  {pi['code']} ({pi['soId']}): {pi['desc'][:55]}")

    # ── 3. Save back ─────────────────────────────────────────────────────────
    cur.execute(
        "UPDATE CRITERION_4 SET assessment_processes_description=? WHERE criterion4_id=?",
        (json.dumps(data), c4_id)
    )
    conn.commit()
    conn.close()
    print(f"\nSaved to CRITERION_4.assessment_processes_description (criterion4_id={c4_id})")
    print("File modified: db.sqlite3  (table CRITERION_4, row criterion4_id=3)")


if __name__ == "__main__":
    main()
