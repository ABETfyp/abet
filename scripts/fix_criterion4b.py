"""Fix Criterion 4B loops:
TASK 1 - Fix duplicate course names ("EECE 455 - EECE 455") in coursesText.
TASK 2 - Replace all placeholder loops with realistic CI content for all 7 SOs.
Also patches the courses array in the JSON to carry proper full names.
"""
import sqlite3, json, time
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"
C4_ID   = 3

# Full course names for the JSON courses array (id -> name)
COURSE_NAMES = {
    1:  "Electric Circuits",
    2:  "Introduction to Programming and Problem Solving",
    3:  "Computer Communication Networks",
    4:  "Digital Signal Processing",
    5:  "Computer Architecture",
    6:  "Wireless Communications",
    7:  "Operating Systems",
    8:  "Network Security",
    9:  "Machine Learning for Engineers",
    10: "Capstone Design II",
    11: "Electromagnetics",
    12: "Probability and Random Processes",
}

# Helper to build a loop entry.
# courseId = JSON courses array id (int)
# coursesText built from COURSE_NAMES
def loop(loop_id, so_id, course_id, impl_term, impl_year,
         meeting_date, finding, action, plan,
         loop_type="Curriculum change", status="open"):
    course_name = COURSE_NAMES.get(course_id, "")
    course_code = {
        1: "EECE 210", 2: "EECE 230", 3: "EECE 455",
        4: "EECE 310", 5: "EECE 350", 6: "EECE 420",
        7: "EECE 435", 8: "EECE 470", 9: "EECE 480",
        10: "EECE 490", 11: "EECE 301", 12: "EECE 340",
    }.get(course_id, "")
    courses_text = f"{course_code} - {course_name}"
    # Parse date for display  (YYYY-MM-DD -> MM/DD/YYYY)
    y, m, d = meeting_date.split("-")
    meeting_display = f"Faculty Curriculum Committee - {m}/{d}/{y}"
    return {
        "id": loop_id,
        "soId": so_id,
        "type": loop_type,
        "customType": "",
        "status": status,
        "courseId": course_id,
        "coursesText": courses_text,
        "implSemester": f"{impl_term} {impl_year}",
        "implSemesterTerm": impl_term,
        "implSemesterYear": str(impl_year),
        "decisionMeeting": meeting_display,
        "decisionMeetingName": "Faculty Curriculum Committee",
        "decisionMeetingDate": meeting_date,
        "finding": finding,
        "action": action,
        "plan": plan,
        "title": loop_type,
        "sos": [so_id],
        "semester": f"{impl_term} {impl_year}",
        "meeting": meeting_display,
        # reassessment fields — empty for open loops
        "reassessmentSemester": "",
        "reassessmentSemesterTerm": "",
        "reassessmentSemesterYear": "",
        "reassessmentPct": "",
        "reassessmentOutcome": "",
        "reassessmentNarrative": "",
    }


NEW_LOOPS = [
    # ── SO1: 78% (PI-1/EECE 210) and 73% (PI-9/EECE 310) — above threshold ──
    loop(
        loop_id="L-1776324081814",
        so_id="SO1",
        course_id=1,                       # EECE 210
        impl_term="Fall", impl_year=2024,
        meeting_date="2024-05-15",
        finding=(
            "78% of students met the circuit analysis rubric threshold in EECE 210, "
            "exceeding the 70% target. Assessment data identified a recurring gap in "
            "Thevenin equivalent analysis for multi-source networks, with approximately "
            "22% of students losing partial credit on that specific rubric criterion."
        ),
        action=(
            "Added a dedicated in-class problem set in Week 4 of EECE 210 targeting "
            "Thevenin and Norton equivalents in multi-source networks. Updated the "
            "MATLAB verification component of the final exam to require explicit "
            "numerical validation of all derived equivalent circuits."
        ),
        plan=(
            "Monitor both the rubric score and the Thevenin sub-criterion specifically "
            "in Fall 2025. If overall attainment drops below 75% or the sub-criterion "
            "remains below 70%, escalate to a full exam-problem revision review."
        ),
    ),
    loop(
        loop_id="L-1776323954642",
        so_id="SO1",
        course_id=4,                       # EECE 310
        impl_term="Spring", impl_year=2025,
        meeting_date="2024-09-18",
        finding=(
            "73% of students rated themselves at or above proficiency on the "
            "problem-solving self-assessment survey in EECE 310, meeting the 70% "
            "threshold. The result-validation dimension had the lowest sub-score, "
            "with roughly 30% of respondents rating themselves below proficiency in "
            "verifying and interpreting computed results."
        ),
        action=(
            "Incorporated guided error-analysis exercises into Weeks 10 and 12 of "
            "the EECE 310 laboratory sequence, requiring students to compare measured "
            "results against theoretical predictions and explain observed discrepancies. "
            "Restructured the Week 12 recitation to focus exclusively on result-validation "
            "strategies and common sources of measurement error."
        ),
        plan=(
            "Re-administer the self-assessment survey in Spring 2026 and track the "
            "result-validation sub-item score separately. Target overall attainment "
            "above 76% with the result-validation dimension above 72%."
        ),
    ),

    # ── SO2: 72% (PI-2/EECE 350) and 70% (PI-10/EECE 350) — borderline above ──
    loop(
        loop_id="L-1776324163562",
        so_id="SO2",
        course_id=5,                       # EECE 350
        impl_term="Fall", impl_year=2025,
        meeting_date="2024-03-20",
        finding=(
            "72% of student teams met the FPGA processor design rubric threshold and "
            "70% met the design process self-assessment threshold in EECE 350, both "
            "at or just above the 70% target. Timing closure in pipelined designs "
            "was the most frequently missed direct rubric criterion, and students "
            "reported the lowest confidence in constraint-aware evaluation of "
            "design alternatives on the self-assessment survey."
        ),
        action=(
            "Added a structured timing-analysis lab exercise in Week 8 of EECE 350 "
            "that requires students to profile critical-path lengths and adjust "
            "pipeline stage boundaries to meet a target clock frequency. Expanded "
            "the trade-off exercise in Week 11 to include explicit evaluation of "
            "pipeline depth versus clock-frequency constraints under area budgets."
        ),
        plan=(
            "Reassess both measures in Spring 2026. Target at least 75% on the "
            "rubric (with timing-closure criterion above 70%) and at least 73% "
            "on the self-assessment. If either measure regresses below 70%, convene "
            "an emergency curriculum review before the next course offering."
        ),
    ),

    # ── SO3: 75% (PI-3/EECE 455) and 77% (PI-11/EECE 455) — above threshold ──
    loop(
        loop_id="L-1776324101056",
        so_id="SO3",
        course_id=3,                       # EECE 455
        impl_term="Fall", impl_year=2024,
        meeting_date="2023-11-08",
        finding=(
            "75% of students met the technical report and oral presentation rubric "
            "threshold and 77% met the communication self-assessment threshold in "
            "EECE 455, both above the 70% target. Written report quality was "
            "consistently strong; oral delivery and Q&A handling showed greater "
            "variability, with roughly 25% of students scoring below the rubric "
            "threshold on the oral presentation component."
        ),
        action=(
            "Introduced a structured practice presentation session one week before "
            "the final oral defense in EECE 455. Students deliver a 5-minute "
            "practice talk and receive structured peer feedback using a standardized "
            "oral delivery rubric covering clarity, pacing, visual aids, and Q&A "
            "responsiveness. Faculty observe and provide written formative feedback "
            "before the graded final presentation."
        ),
        plan=(
            "Continue monitoring both measures in Fall 2025. Target 80% on the "
            "rubric overall and specifically 75% or above on the oral-delivery "
            "sub-criterion. Expand the practice session to two rounds if the oral "
            "sub-criterion does not improve by at least 3 percentage points."
        ),
    ),

    # ── SO4: 80% (PI-4/EECE 470) and 75% (PI-12/EECE 470) — above threshold ──
    loop(
        loop_id="L-1776324181641",
        so_id="SO4",
        course_id=8,                       # EECE 470
        impl_term="Spring", impl_year=2025,
        meeting_date="2024-01-17",
        finding=(
            "80% of students exceeded the cybersecurity ethics exam threshold and "
            "75% met the ethical awareness self-assessment threshold in EECE 470, "
            "both well above the 70% target. Students demonstrated strong "
            "understanding of responsible disclosure and domestic professional codes. "
            "However, open-ended survey responses revealed uncertainty around "
            "international privacy law applicability in cross-border security scenarios."
        ),
        action=(
            "Added a comparative international privacy law case study to the EECE 470 "
            "ethics module, covering GDPR, CCPA, and relevant MENA regional frameworks "
            "alongside the existing ACM/IEEE code of ethics analysis. The case study "
            "requires students to analyze a multi-jurisdiction security incident and "
            "justify the appropriate ethical and legal response for each jurisdiction."
        ),
        plan=(
            "Continue monitoring both measures in Spring 2026. Maintain overall "
            "attainment above 75% on both instruments and track the international "
            "privacy law sub-item on the self-assessment specifically. If the "
            "sub-item score remains below 70%, expand the case study to include "
            "a guest lecture from a practicing legal professional."
        ),
    ),

    # ── SO5: 68% (PI-5), 71% (PI-8), 69% (PI-13) — BELOW threshold, corrective ──
    loop(
        loop_id="L-4000000000001",
        so_id="SO5",
        course_id=10,                      # EECE 490
        impl_term="Fall", impl_year=2025,
        meeting_date="2024-10-09",
        finding=(
            "All three SO5 measures in EECE 490 fell at or below the 70% threshold: "
            "the capstone team collaboration survey (68%), the peer evaluation rubric "
            "(71%), and the teamwork self-assessment survey (69%). Qualitative "
            "feedback from 490 sections identified cross-functional task delegation, "
            "mid-project conflict resolution, and managing remote collaboration as "
            "the primary challenges. Two teams required faculty advisor intervention "
            "to resolve workload imbalances at the project midpoint."
        ),
        action=(
            "Restructured the EECE 490 team project sequence with three targeted "
            "interventions: (1) A mandatory team charter assignment in Week 1 "
            "requiring teams to define individual roles, decision-making protocols, "
            "communication norms, and meeting cadences before beginning any technical "
            "work. (2) A formal mid-semester peer evaluation in Week 7 using a "
            "standardized five-dimension rubric (task completion, communication, "
            "initiative, reliability, team support) followed by a 30-minute faculty "
            "advisor debrief session with each team. (3) A conflict-resolution and "
            "collaborative leadership workshop in Week 4, facilitated by the "
            "university's student success office, covering negotiation, inclusive "
            "participation, and remote coordination strategies. Faculty advisors "
            "will also conduct bi-weekly 15-minute team check-ins throughout the "
            "semester to catch delegation issues early."
        ),
        plan=(
            "Reassess all three SO5 measures in Fall 2025 immediately after the "
            "restructured sequence runs for the first time. Target all three "
            "measures above 75%. If the collaboration survey score remains below "
            "70% after one full cycle of the new interventions, escalate to a "
            "comprehensive capstone curriculum review in Spring 2026 and consider "
            "expanding the teamwork development activities to EECE 480 as a "
            "preparatory course."
        ),
    ),

    # ── SO6: 76% (PI-6/EECE 310) and 74% (PI-14/EECE 310) — above threshold ──
    loop(
        loop_id="L-4000000000002",
        so_id="SO6",
        course_id=4,                       # EECE 310
        impl_term="Spring", impl_year=2025,
        meeting_date="2024-06-05",
        finding=(
            "76% of students met the DSP laboratory report rubric threshold and "
            "74% met the experimental reasoning self-assessment threshold in "
            "EECE 310, both above the 70% target. Interpretation of spectral "
            "leakage artifacts in FFT-based measurements was the weakest direct "
            "rubric criterion; the error-identification dimension had the lowest "
            "self-assessment sub-score, consistent with observed lab report performance."
        ),
        action=(
            "Added a dedicated spectral analysis discussion to the EECE 310 "
            "pre-lab reading for the frequency-response measurement lab, covering "
            "windowing functions and the practical effects of spectral leakage on "
            "filter characterization. Redesigned the Week 10 lab session to include "
            "structured uncertainty quantification tasks where students must identify, "
            "quantify, and document at least two sources of measurement error in "
            "their experimental setup before collecting data."
        ),
        plan=(
            "Continue monitoring both measures in Spring 2026. Target 80% on the "
            "lab report rubric and 77% on the self-assessment, with specific "
            "improvement targets on the spectral-analysis and error-identification "
            "sub-items. Compare lab report error-analysis section scores across "
            "sections to identify any instructional inconsistencies."
        ),
    ),

    # ── SO7: 74% (PI-7/EECE 480) and 72% (PI-15/EECE 480) — above threshold ──
    loop(
        loop_id="L-1776453150258",
        so_id="SO7",
        course_id=9,                       # EECE 480
        impl_term="Fall", impl_year=2024,
        meeting_date="2024-04-24",
        finding=(
            "74% of students met the independent learning rubric threshold and "
            "72% met the independent learning self-assessment threshold in EECE 480, "
            "both above the 70% target. Students demonstrated strong ability to "
            "identify knowledge gaps and locate relevant resources. Critical "
            "evaluation of source quality and judgment of knowledge transferability "
            "were the weakest dimensions on both the rubric and the self-assessment."
        ),
        action=(
            "Added a source evaluation and knowledge-transfer workshop to the "
            "EECE 480 project kickoff session. The 90-minute workshop introduces "
            "a structured framework for assessing resource credibility, recency, "
            "and domain applicability, and guides students through a worked example "
            "of adapting a published ML technique to a new engineering context. "
            "A source-evaluation log was added as a required project deliverable "
            "so that faculty can assess transferability reasoning directly."
        ),
        plan=(
            "Continue monitoring both measures in Fall 2025. Target 77% on the "
            "rubric and 75% on the self-assessment, with particular focus on "
            "the source-evaluation and transferability sub-items. Review the "
            "source-evaluation log deliverables to calibrate the rubric criteria "
            "if inter-rater reliability is below 80%."
        ),
        loop_type="Curriculum change",
    ),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    row  = cur.execute(
        "SELECT assessment_processes_description FROM CRITERION_4 WHERE criterion4_id=?",
        (C4_ID,)
    ).fetchone()
    data = json.loads(row[0])

    # ── TASK 1 + 2: Fix courses array names ──────────────────────────────────
    for c in data.get("courses", []):
        cid = c.get("id")
        if cid in COURSE_NAMES:
            c["name"] = COURSE_NAMES[cid]
    print(f"Updated names for {len(data['courses'])} courses in JSON array.")

    # ── Replace loops entirely ────────────────────────────────────────────────
    old_count = len(data.get("loops", []))
    data["loops"] = NEW_LOOPS

    cur.execute(
        "UPDATE CRITERION_4 SET assessment_processes_description=? WHERE criterion4_id=?",
        (json.dumps(data), C4_ID)
    )
    conn.commit()
    conn.close()

    print(f"Replaced {old_count} old loop(s) with {len(NEW_LOOPS)} new loops.\n")
    so_pcts = {
        "SO1": "78% / 73% (above)",
        "SO2": "72% / 70% (borderline above)",
        "SO3": "75% / 77% (above)",
        "SO4": "80% / 75% (above)",
        "SO5": "68% / 71% / 69% (BELOW — corrective action)",
        "SO6": "76% / 74% (above)",
        "SO7": "74% / 72% (above)",
    }
    for lp in NEW_LOOPS:
        print(
            f"  {lp['soId']:4}  {lp['implSemester']:<12}  "
            f"course={lp['coursesText']:<40}  "
            f"results={so_pcts.get(lp['soId'], '')}"
        )
    print("\nFile modified: db.sqlite3  (CRITERION_4, criterion4_id=3)")


if __name__ == "__main__":
    main()
