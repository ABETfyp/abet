-- Conformance patch from current project schema to the posted "final" schema.
-- Apply carefully in a migration window and test after each section.
-- Assumes PostgreSQL-compatible syntax.

BEGIN;

-- 1) ACCREDIATION_CYCLE: add missing final FKs
ALTER TABLE "ACCREDIATION_CYCLE"
  ADD COLUMN IF NOT EXISTS "criterion5_id" INT,
  ADD COLUMN IF NOT EXISTS "appendixA_id" INT;

-- 2) CHECKLIST_ITEM: add missing final FK columns
ALTER TABLE "CHECKLIST_ITEM"
  ADD COLUMN IF NOT EXISTS "criterion5_id" INT,
  ADD COLUMN IF NOT EXISTS "criterion6_id" INT,
  ADD COLUMN IF NOT EXISTS "appendixA_id" INT,
  ADD COLUMN IF NOT EXISTS "appendix_c_id" INT;

-- 3) CRITERION_7_FACILITIES: final schema does not include is_complete
ALTER TABLE "CRITERION_7_FACILITIES"
  DROP COLUMN IF EXISTS "is_complete";

-- 4) Add missing core tables referenced by final FKs (if absent)
CREATE TABLE IF NOT EXISTS "CRITERION_5_CURRICULUM"
(
  "criterion5_id" INT PRIMARY KEY,
  "academic_calender_type" VARCHAR(50) NOT NULL,
  "curriculum_alignment_description" TEXT NOT NULL,
  "prerequisites_support_description" TEXT NOT NULL,
  "hours_depth_by_subject_area_description" TEXT NOT NULL,
  "broad_education_component_description" TEXT NOT NULL,
  "cooperative_education_description" TEXT NOT NULL,
  "materials_available_description" TEXT NOT NULL,
  "culminating_design_experience" TEXT NOT NULL,
  "Curricular_paths" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "APPENIXA"
(
  "appendixA_id" INT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "CRITERION_6_FACULTY"
(
  "criterion6_id" INT PRIMARY KEY,
  "faculty_composition_narrative" TEXT NOT NULL,
  "faculty_worklaod_expectations_description" TEXT NOT NULL,
  "workload_expectations_desciption" TEXT NOT NULL,
  "faculty_size_adequacy_description" TEXT NOT NULL,
  "advising_and_student_interaction_description" TEXT NOT NULL,
  "service_and_industry_engagement_description" TEXT NOT NULL,
  "course_creation_role_description" TEXT NOT NULL,
  "peo_ro_role_description" TEXT NOT NULL,
  "leadership_roles_description" TEXT NOT NULL,
  "Cycle_ID" INT NOT NULL
);

CREATE TABLE IF NOT EXISTS "APPENDIX_C_EQUIPMENT"
(
  "appendix_c_id" INT PRIMARY KEY,
  "last_updated_date" DATE NOT NULL,
  "labs_covered_count" INT NOT NULL,
  "equipment_items_count" INT NOT NULL,
  "high_value_assets_count" INT NOT NULL,
  "Cycle_ID" INT NOT NULL
);

-- 5) Add FK constraints (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cycle_criterion5'
  ) THEN
    ALTER TABLE "ACCREDIATION_CYCLE"
      ADD CONSTRAINT "fk_cycle_criterion5"
      FOREIGN KEY ("criterion5_id") REFERENCES "CRITERION_5_CURRICULUM"("criterion5_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cycle_appendixa'
  ) THEN
    ALTER TABLE "ACCREDIATION_CYCLE"
      ADD CONSTRAINT "fk_cycle_appendixa"
      FOREIGN KEY ("appendixA_id") REFERENCES "APPENIXA"("appendixA_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_checklist_criterion5'
  ) THEN
    ALTER TABLE "CHECKLIST_ITEM"
      ADD CONSTRAINT "fk_checklist_criterion5"
      FOREIGN KEY ("criterion5_id") REFERENCES "CRITERION_5_CURRICULUM"("criterion5_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_checklist_criterion6'
  ) THEN
    ALTER TABLE "CHECKLIST_ITEM"
      ADD CONSTRAINT "fk_checklist_criterion6"
      FOREIGN KEY ("criterion6_id") REFERENCES "CRITERION_6_FACULTY"("criterion6_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_checklist_appendixa'
  ) THEN
    ALTER TABLE "CHECKLIST_ITEM"
      ADD CONSTRAINT "fk_checklist_appendixa"
      FOREIGN KEY ("appendixA_id") REFERENCES "APPENIXA"("appendixA_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_checklist_appendixc'
  ) THEN
    ALTER TABLE "CHECKLIST_ITEM"
      ADD CONSTRAINT "fk_checklist_appendixc"
      FOREIGN KEY ("appendix_c_id") REFERENCES "APPENDIX_C_EQUIPMENT"("appendix_c_id");
  END IF;
END $$;

COMMIT;
