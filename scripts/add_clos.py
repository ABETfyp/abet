"""Add CLOs (with SO mappings) for the 8 new EECE courses — syllabi 11-18."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db.sqlite3"

# syllabus_id -> list of (description, level, [so_ids that this CLO maps to])
# SO IDs (program 6):
#   1=SO1 problem-solving  2=SO2 design  3=SO3 communication
#   4=SO4 ethics           5=SO5 teamwork 6=SO6 experimentation  7=SO7 lifelong learning
COURSE_CLOS = {
    11: {  # EECE 301 – Electromagnetics
        "clos": [
            ("Apply Maxwell's equations and boundary conditions to solve electrostatic and magnetostatic field problems.", "Introduced", [1]),
            ("Analyze plane wave propagation and transmission lines using phasor methods and validate results experimentally.", "Reinforced", [1, 6]),
            ("Use simulation tools to model electromagnetic field distributions and compare with analytical solutions.", "Introduced", [6]),
        ]
    },
    12: {  # EECE 310 – Digital Signal Processing
        "clos": [
            ("Analyze discrete-time signals and systems using Z-transform and DTFT representations.", "Reinforced", [1]),
            ("Design FIR and IIR digital filters to meet specified frequency-domain performance requirements.", "Mastered", [2]),
            ("Implement DSP algorithms in MATLAB or Python and validate performance against theoretical specifications.", "Reinforced", [6]),
        ]
    },
    13: {  # EECE 340 – Probability and Random Processes
        "clos": [
            ("Apply probability theory and random variable models to analyze uncertainty in engineering systems.", "Introduced", [1]),
            ("Characterize random processes and evaluate their impact on communication system performance metrics.", "Reinforced", [1, 7]),
        ]
    },
    14: {  # EECE 350 – Computer Architecture
        "clos": [
            ("Explain the design of processor datapaths, control units, and pipelining in modern ISA implementations.", "Reinforced", [1]),
            ("Design and implement a digital subsystem on an FPGA and evaluate its timing and resource utilization.", "Mastered", [2, 6]),
            ("Analyze memory hierarchy trade-offs including cache parameters and their impact on program performance.", "Reinforced", [1]),
        ]
    },
    15: {  # EECE 420 – Wireless Communications
        "clos": [
            ("Model wireless channel characteristics and evaluate their effect on signal quality and system capacity.", "Reinforced", [1]),
            ("Design a wireless link budget and evaluate modulation, coding, and diversity schemes against requirements.", "Mastered", [2]),
            ("Communicate engineering trade-offs in wireless system design through technical reports and oral presentations.", "Reinforced", [3]),
        ]
    },
    16: {  # EECE 435 – Operating Systems
        "clos": [
            ("Compare OS scheduling, memory management, and synchronization mechanisms for concurrent systems.", "Reinforced", [1]),
            ("Implement OS-level programming tasks in C on Linux and analyze correctness and performance.", "Mastered", [2, 6]),
            ("Identify OS-level security vulnerabilities and apply appropriate mitigation strategies.", "Introduced", [4]),
        ]
    },
    17: {  # EECE 470 – Network Security
        "clos": [
            ("Analyze common network attack vectors and evaluate the effectiveness of cryptographic and protocol-level defenses.", "Reinforced", [1]),
            ("Apply ethical and legal principles to cybersecurity practice and recognize professional responsibilities.", "Mastered", [4]),
            ("Design and validate network security controls through structured adversarial laboratory exercises.", "Mastered", [2, 6]),
        ]
    },
    18: {  # EECE 480 – Machine Learning for Engineers
        "clos": [
            ("Implement and evaluate supervised and unsupervised ML models on engineering datasets.", "Reinforced", [1, 6]),
            ("Design an end-to-end ML pipeline for a real engineering application and justify design choices with metrics.", "Mastered", [2]),
            ("Apply ML techniques to communications or signal processing problems and interpret results in engineering context.", "Mastered", [7]),
        ]
    },
}


def next_id(cur, table, pk):
    row = cur.execute(f"SELECT COALESCE(MAX({pk}), 0) + 1 FROM {table}").fetchone()
    return int(row[0] or 1)


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for syllabus_id, data in COURSE_CLOS.items():
        for desc, level, so_ids in data["clos"]:
            # Insert CLO
            clo_id = next_id(cur, "CLO", "clo_id")
            cur.execute(
                "INSERT INTO CLO (clo_id, description, level) VALUES (?, ?, ?)",
                (clo_id, desc, level),
            )

            # Link CLO to syllabus
            cur.execute(
                "INSERT OR IGNORE INTO HAS_CLO (clo_id, syllabus_id) VALUES (?, ?)",
                (clo_id, syllabus_id),
            )

            # Map CLO to each SO
            for so_id in so_ids:
                cur.execute(
                    "INSERT OR IGNORE INTO MAPS_TO (so_id, clo_id) VALUES (?, ?)",
                    (so_id, clo_id),
                )
                # Also insert into SYLLABUS_CLO_SO_MAP
                map_id = next_id(cur, "SYLLABUS_CLO_SO_MAP", "map_id")
                cur.execute(
                    "INSERT INTO SYLLABUS_CLO_SO_MAP (map_id, syllabus_id, clo_id, so_id) VALUES (?, ?, ?, ?)",
                    (map_id, syllabus_id, clo_id, so_id),
                )

            print(f"  Syllabus {syllabus_id} | CLO {clo_id} [{level}]: {desc[:60]}…")

    conn.commit()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
