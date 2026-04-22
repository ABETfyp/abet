"""Replace the two placeholder results and add realistic logged attainment
results for all 15 PIs in CRITERION_4 (criterion4_id=3, cycle 19)."""
import sqlite3, json
from pathlib import Path

DB_PATH  = Path(__file__).resolve().parents[1] / "db.sqlite3"
C4_ID    = 3

# courseId strings match the 'id' field in the JSON courses array:
# 1=EECE210  2=EECE230  3=EECE455  4=EECE310  5=EECE350  6=EECE420
# 7=EECE435  8=EECE470  9=EECE480  10=EECE490 11=EECE301 12=EECE340

RESULTS = [
    {
        "id": "R-2000000000001",
        "soId": "SO1", "piId": "PI-1",
        "courseId": "1",                    # EECE 210
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 34, "pct": 78,
        "interpretation": (
            "78% of students met the circuit analysis rubric threshold, demonstrating solid "
            "proficiency in Kirchhoff's laws and nodal analysis. A subset struggled with "
            "Thevenin equivalents in multi-source networks; a targeted workshop will be "
            "added in Week 4 of the next offering to address this gap."
        ),
    },
    {
        "id": "R-2000000000002",
        "soId": "SO2", "piId": "PI-2",
        "courseId": "5",                    # EECE 350
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 30, "pct": 72,
        "interpretation": (
            "72% of student teams met the FPGA processor design rubric threshold. Most "
            "teams implemented the basic datapath correctly but had difficulty closing "
            "timing constraints in the pipelined version. A structured timing-analysis "
            "lab exercise will be added mid-semester to address this in the next cycle."
        ),
    },
    {
        "id": "R-2000000000003",
        "soId": "SO3", "piId": "PI-3",
        "courseId": "3",                    # EECE 455
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 32, "pct": 75,
        "interpretation": (
            "75% of students met the technical report and oral presentation rubric "
            "threshold. Written reports were generally strong; oral delivery and Q&A "
            "handling showed more variability. A structured practice session before "
            "final presentations will be introduced in the next offering."
        ),
    },
    {
        "id": "R-2000000000004",
        "soId": "SO4", "piId": "PI-4",
        "courseId": "8",                    # EECE 470
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 28, "pct": 80,
        "interpretation": (
            "80% of students exceeded the ethics exam threshold, reflecting strong "
            "engagement with the responsible disclosure and professional conduct modules. "
            "The 20% who did not meet the threshold had difficulty reasoning through "
            "multi-stakeholder scenarios; additional scenario-based practice will be added."
        ),
    },
    {
        "id": "R-2000000000005",
        "soId": "SO5", "piId": "PI-5",
        "courseId": "10",                   # EECE 490
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 36, "pct": 68,
        "interpretation": (
            "68% of students met the capstone team collaboration survey threshold, "
            "falling just below the 70% target. Qualitative responses identified "
            "cross-functional task delegation and mid-project conflict resolution as "
            "primary challenges. A structured team charter process will be introduced "
            "at the start of the capstone sequence in the next cycle."
        ),
    },
    {
        "id": "R-2000000000006",
        "soId": "SO6", "piId": "PI-6",
        "courseId": "4",                    # EECE 310
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 31, "pct": 76,
        "interpretation": (
            "76% of students met the DSP lab report rubric threshold. Filter design and "
            "frequency-response measurements were well executed; interpretation of "
            "spectral leakage artifacts in FFT data was a recurring weakness. A dedicated "
            "spectral analysis discussion will be added to the lab manual."
        ),
    },
    {
        "id": "R-2000000000007",
        "soId": "SO7", "piId": "PI-7",
        "courseId": "9",                    # EECE 480
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 29, "pct": 74,
        "interpretation": (
            "74% of students met the independent learning rubric threshold. Most teams "
            "successfully self-directed their study of novel ML techniques. Depth of "
            "critical evaluation of model limitations varied considerably; a structured "
            "evaluation framework will be added to the project guidelines."
        ),
    },
    {
        "id": "R-2000000000008",
        "soId": "SO5", "piId": "PI-8",
        "courseId": "10",                   # EECE 490
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 36, "pct": 71,
        "interpretation": (
            "71% of students met the peer evaluation rubric threshold for individual "
            "team contribution. Mid-semester evaluations identified two teams with "
            "uneven task distribution; faculty advisor intervention resolved the "
            "imbalance, and final evaluation scores improved notably for those teams."
        ),
    },
    {
        "id": "R-2000000000009",
        "soId": "SO1", "piId": "PI-9",
        "courseId": "4",                    # EECE 310
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 31, "pct": 73,
        "interpretation": (
            "73% of students rated themselves at or above proficiency on the problem-"
            "solving self-assessment survey. Students felt most confident in method "
            "selection and least confident in result validation, which aligns with "
            "observed lab report scores and will guide the next course revision."
        ),
    },
    {
        "id": "R-2000000000010",
        "soId": "SO2", "piId": "PI-10",
        "courseId": "5",                    # EECE 350
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 30, "pct": 70,
        "interpretation": (
            "70% of students met the design process self-assessment threshold, exactly "
            "at target. Students reported strong confidence in requirements analysis but "
            "lower confidence in constraint-aware evaluation of design alternatives; "
            "the trade-off exercise in Week 8 will be expanded in the next offering."
        ),
    },
    {
        "id": "R-2000000000011",
        "soId": "SO3", "piId": "PI-11",
        "courseId": "3",                    # EECE 455
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 32, "pct": 77,
        "interpretation": (
            "77% of students met the communication self-assessment threshold. Students "
            "reported noticeable improvement in written report clarity between the "
            "project proposal and final report stages, validating the iterative "
            "feedback approach used throughout the course."
        ),
    },
    {
        "id": "R-2000000000012",
        "soId": "SO4", "piId": "PI-12",
        "courseId": "8",                    # EECE 470
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 28, "pct": 75,
        "interpretation": (
            "75% of students rated themselves proficient on ethical awareness survey "
            "items. Open-ended responses highlighted strong understanding of responsible "
            "disclosure but uncertainty around international privacy law applicability; "
            "a comparative law case study will be added to address this gap."
        ),
    },
    {
        "id": "R-2000000000013",
        "soId": "SO5", "piId": "PI-13",
        "courseId": "10",                   # EECE 490
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 36, "pct": 69,
        "interpretation": (
            "69% of students met the teamwork self-assessment threshold, slightly below "
            "the 70% target. The most common challenges cited were aligning work "
            "schedules across disciplines and managing remote collaboration. Revised "
            "team formation guidelines will be implemented in the next cycle."
        ),
    },
    {
        "id": "R-2000000000014",
        "soId": "SO6", "piId": "PI-14",
        "courseId": "4",                    # EECE 310
        "semester": "Spring 2025", "semesterTerm": "Spring", "semesterYear": "2025",
        "n": 31, "pct": 74,
        "interpretation": (
            "74% of students met the experimental reasoning self-assessment threshold. "
            "Students rated data processing and error identification as areas of lower "
            "confidence, consistent with observed lab performance on filter "
            "characterization tasks; guided error analysis exercises will be added."
        ),
    },
    {
        "id": "R-2000000000015",
        "soId": "SO7", "piId": "PI-15",
        "courseId": "9",                    # EECE 480
        "semester": "Fall 2024", "semesterTerm": "Fall", "semesterYear": "2024",
        "n": 29, "pct": 72,
        "interpretation": (
            "72% of students met the independent learning survey threshold. Students "
            "reported high confidence in identifying knowledge gaps and locating "
            "resources, but lower confidence in critically evaluating source quality "
            "and judging transferability; a source evaluation workshop will be added "
            "to the project kickoff session."
        ),
    },
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    row  = cur.execute(
        "SELECT assessment_processes_description FROM CRITERION_4 WHERE criterion4_id=?",
        (C4_ID,)
    ).fetchone()
    data = json.loads(row[0])

    # Replace results entirely with the 15 realistic entries
    old_count = len(data.get("results", []))
    data["results"] = RESULTS

    cur.execute(
        "UPDATE CRITERION_4 SET assessment_processes_description=? WHERE criterion4_id=?",
        (json.dumps(data), C4_ID)
    )
    conn.commit()
    conn.close()

    print(f"Replaced {old_count} old result(s) with {len(RESULTS)} new results.")
    print()
    for r in RESULTS:
        status = "Meeting target" if r["pct"] >= 70 else "Near target"
        print(f"  {r['piId']:5} {r['soId']}  {r['semester']:<12}  n={r['n']}  {r['pct']}%  {status}")

    print()
    print("File modified: db.sqlite3  (CRITERION_4, criterion4_id=3, column assessment_processes_description)")


if __name__ == "__main__":
    main()
