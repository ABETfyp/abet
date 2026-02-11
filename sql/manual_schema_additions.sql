CREATE TABLE IF NOT EXISTS FACULTY_MEMBER (
  Faculty_ID INT NOT NULL,
  Full_Name VARCHAR(255) NOT NULL,
  Academic_Rank VARCHAR(100) NOT NULL,
  Appointment_Type VARCHAR(100) NOT NULL,
  Email VARCHAR(255) NOT NULL,
  Office_Hours TEXT,
  PRIMARY KEY (Faculty_ID),
  UNIQUE (Email)
);

CREATE TABLE IF NOT EXISTS QUALIFICATION (
  Qualification_ID INT NOT NULL,
  Degree_Field VARCHAR(255) NOT NULL,
  Degree_Institution VARCHAR(255) NOT NULL,
  Degree_Year INT NOT NULL,
  Years_Industry_Government INT NOT NULL,
  Years_At_Institution INT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Qualification_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS CERTIFICATION (
  Certification_ID INT NOT NULL,
  Certification_title VARCHAR(255) NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Certification_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS PROFESSIONAL_MEMBERSHIP (
  Membership_ID INT NOT NULL,
  Membership_Description TEXT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Membership_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS PROFESSIONAL_DEVELOPMENT (
  Development_ID INT NOT NULL,
  Activity_Description TEXT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Development_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS INDUSTRY_EXPERIENCE (
  Experience_ID INT NOT NULL,
  Experience_discription TEXT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Experience_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS WORKLOAD (
  Workload_ID INT NOT NULL,
  Teaching_Percentage NUMERIC(5,2) NOT NULL,
  Research_Percentage NUMERIC(5,2) NOT NULL,
  Other_Percentage NUMERIC(5,2) NOT NULL,
  Program_Time_Percentage NUMERIC(5,2) NOT NULL,
  Faculty_ID INT NOT NULL,
  Cycle_ID INT NOT NULL,
  PRIMARY KEY (Workload_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID),
  FOREIGN KEY (Cycle_ID) REFERENCES ACCREDIATION_CYCLE(Cycle_ID)
);

CREATE TABLE IF NOT EXISTS HONOR_AWARD (
  Award_ID INT NOT NULL,
  Award_discription TEXT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Award_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS SERVICE_ACTIVITY (
  Service_ID INT NOT NULL,
  Service_Description TEXT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Service_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS PUBLICATION (
  Publication_ID INT NOT NULL,
  Publication_Discription TEXT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (Publication_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS BACKGROUND_INFO (
  background_id_ INT NOT NULL,
  program_contact_name VARCHAR(255) NOT NULL,
  contact_title VARCHAR(255) NOT NULL,
  office_location VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  year_implemented INT NOT NULL,
  last_general_review_date DATE NOT NULL,
  summary_of_major_changes TEXT NOT NULL,
  Cycle_ID INT NOT NULL,
  item_id INT NOT NULL,
  PRIMARY KEY (background_id_),
  FOREIGN KEY (Cycle_ID) REFERENCES ACCREDIATION_CYCLE(Cycle_ID),
  FOREIGN KEY (item_id) REFERENCES CHECKLIST_ITEM(item_id)
);

CREATE TABLE IF NOT EXISTS UNIFIED_SYLLABUS (
  unified_syllabus_id INT NOT NULL,
  status INT NOT NULL,
  PRIMARY KEY (unified_syllabus_id)
);

CREATE TABLE IF NOT EXISTS COURSE (
  Course_ID INT NOT NULL,
  Course_Code VARCHAR(50) NOT NULL,
  Credits INT NOT NULL,
  Contact_Hours INT NOT NULL,
  Course_Type VARCHAR(50) NOT NULL,
  Cycle_ID INT NOT NULL,
  unified_syllabus_id INT NOT NULL,
  PRIMARY KEY (Course_ID),
  FOREIGN KEY (Cycle_ID) REFERENCES ACCREDIATION_CYCLE(Cycle_ID),
  FOREIGN KEY (unified_syllabus_id) REFERENCES UNIFIED_SYLLABUS(unified_syllabus_id)
);

CREATE TABLE IF NOT EXISTS COURSE_DISCRIPTION (
  description_id INT NOT NULL,
  catalog_description TEXT NOT NULL,
  PRIMARY KEY (description_id)
);

CREATE TABLE IF NOT EXISTS WEEKLY_TOPIC_OUTLINE (
  outline_id INT NOT NULL,
  topics_description TEXT NOT NULL,
  PRIMARY KEY (outline_id)
);

CREATE TABLE IF NOT EXISTS ADDITIONAL_INFORMATION (
  additional_info_id INT NOT NULL,
  design_content_percentage NUMERIC(5,2) NOT NULL,
  software_or_labs_tools_used TEXT NOT NULL,
  PRIMARY KEY (additional_info_id)
);

CREATE TABLE IF NOT EXISTS INSTRUCTOR_SYLLABUS (
  syllabus_id INT NOT NULL,
  term VARCHAR(50) NOT NULL,
  syllabus_status INT NOT NULL,
  Faculty_ID INT NOT NULL,
  Course_ID INT NOT NULL,
  description_id INT NOT NULL,
  outline_id INT NOT NULL,
  additional_info_id INT NOT NULL,
  unified_syllabus_id INT NOT NULL,
  PRIMARY KEY (syllabus_id),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID),
  FOREIGN KEY (Course_ID) REFERENCES COURSE(Course_ID),
  FOREIGN KEY (description_id) REFERENCES COURSE_DISCRIPTION(description_id),
  FOREIGN KEY (outline_id) REFERENCES WEEKLY_TOPIC_OUTLINE(outline_id),
  FOREIGN KEY (additional_info_id) REFERENCES ADDITIONAL_INFORMATION(additional_info_id),
  FOREIGN KEY (unified_syllabus_id) REFERENCES UNIFIED_SYLLABUS(unified_syllabus_id)
);

CREATE TABLE IF NOT EXISTS CLO (
  clo_id INT NOT NULL,
  description TEXT NOT NULL,
  level VARCHAR(50) NOT NULL,
  PRIMARY KEY (clo_id)
);

CREATE TABLE IF NOT EXISTS ASSESMENT (
  assessment_id INT NOT NULL,
  assesment_type VARCHAR(100) NOT NULL,
  weight_percentage NUMERIC(5,2) NOT NULL,
  syllabus_id INT NOT NULL,
  PRIMARY KEY (assessment_id),
  FOREIGN KEY (syllabus_id) REFERENCES INSTRUCTOR_SYLLABUS(syllabus_id)
);

CREATE TABLE IF NOT EXISTS SUPPLEMENT_MATERIAL (
  material_id INT NOT NULL,
  material_discription TEXT NOT NULL,
  syllabus_id INT NOT NULL,
  PRIMARY KEY (material_id),
  FOREIGN KEY (syllabus_id) REFERENCES INSTRUCTOR_SYLLABUS(syllabus_id)
);

CREATE TABLE IF NOT EXISTS TEXTBOOK (
  textbook_id INT NOT NULL,
  title_author_year TEXT NOT NULL,
  Attribute TEXT NOT NULL,
  syllabus_id INT NOT NULL,
  PRIMARY KEY (textbook_id),
  FOREIGN KEY (syllabus_id) REFERENCES INSTRUCTOR_SYLLABUS(syllabus_id)
);

CREATE TABLE IF NOT EXISTS PREREQUISITE (
  prerequisite_id INT NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  syllabus_id INT NOT NULL,
  PRIMARY KEY (prerequisite_id),
  FOREIGN KEY (syllabus_id) REFERENCES INSTRUCTOR_SYLLABUS(syllabus_id)
);

CREATE TABLE IF NOT EXISTS COREQUISITE (
  corequisite_id INT NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  syllabus_id INT NOT NULL,
  PRIMARY KEY (corequisite_id),
  FOREIGN KEY (syllabus_id) REFERENCES INSTRUCTOR_SYLLABUS(syllabus_id)
);

CREATE TABLE IF NOT EXISTS STUDENT_OUTCOME (
  so_id INT NOT NULL,
  so_code VARCHAR(20) NOT NULL,
  so_discription TEXT NOT NULL,
  program_id INT NOT NULL,
  PRIMARY KEY (so_id),
  UNIQUE (so_code),
  FOREIGN KEY (program_id) REFERENCES PROGRAM(program_id)
);

CREATE TABLE IF NOT EXISTS PEO (
  peo_id INT NOT NULL,
  peo_code VARCHAR(20) NOT NULL,
  peo_description TEXT NOT NULL,
  program_id INT NOT NULL,
  PRIMARY KEY (peo_id),
  UNIQUE (peo_code),
  FOREIGN KEY (program_id) REFERENCES PROGRAM(program_id)
);

CREATE TABLE IF NOT EXISTS CRITERION_1_STUDENTS (
  criterion1_id INT NOT NULL,
  admission_requirements TEXT NOT NULL,
  admission_process_summary TEXT NOT NULL,
  transfer_pathways TEXT NOT NULL,
  pperformance_evaluation_process TEXT NOT NULL,
  prerequisite_verification_method TEXT NOT NULL,
  prerequisite_not_met_action TEXT NOT NULL,
  transfer_policy_summary TEXT NOT NULL,
  transfer_credit_evaluation_process TEXT NOT NULL,
  articulation_agreements TEXT NOT NULL,
  advising_providers TEXT NOT NULL,
  advising_frequency TEXT NOT NULL,
  career_guidance_description TEXT NOT NULL,
  work_in_lieu_policies TEXT NOT NULL,
  work_in_lieu_approval_process TEXT NOT NULL,
  minimum_required_credits INT NOT NULL,
  required_gpa_or_standing VARCHAR(50) NOT NULL,
  essential_courses_categories TEXT NOT NULL,
  degree_name VARCHAR(255) NOT NULL,
  transcript_format_explanation TEXT NOT NULL,
  program_name_on_transcript VARCHAR(255) NOT NULL,
  Cycle_ID INT NOT NULL,
  item_id INT NOT NULL,
  PRIMARY KEY (criterion1_id),
  FOREIGN KEY (Cycle_ID) REFERENCES ACCREDIATION_CYCLE(Cycle_ID),
  FOREIGN KEY (item_id) REFERENCES CHECKLIST_ITEM(item_id)
);

CREATE TABLE IF NOT EXISTS RESPONSIBLE_FOR (
  user_id INT NOT NULL,
  program_id INT NOT NULL,
  PRIMARY KEY (user_id, program_id),
  FOREIGN KEY (user_id) REFERENCES "USER"(user_id),
  FOREIGN KEY (program_id) REFERENCES PROGRAM(program_id)
);

CREATE TABLE IF NOT EXISTS ASSIGNED_TO (
  program_id INT NOT NULL,
  Faculty_ID INT NOT NULL,
  PRIMARY KEY (program_id, Faculty_ID),
  FOREIGN KEY (program_id) REFERENCES PROGRAM(program_id),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID)
);

CREATE TABLE IF NOT EXISTS TEACHES (
  Faculty_ID INT NOT NULL,
  Course_ID INT NOT NULL,
  PRIMARY KEY (Faculty_ID, Course_ID),
  FOREIGN KEY (Faculty_ID) REFERENCES FACULTY_MEMBER(Faculty_ID),
  FOREIGN KEY (Course_ID) REFERENCES COURSE(Course_ID)
);

CREATE TABLE IF NOT EXISTS HAS_CLO (
  clo_id INT NOT NULL,
  syllabus_id INT NOT NULL,
  PRIMARY KEY (clo_id, syllabus_id),
  FOREIGN KEY (clo_id) REFERENCES CLO(clo_id),
  FOREIGN KEY (syllabus_id) REFERENCES INSTRUCTOR_SYLLABUS(syllabus_id)
);

CREATE TABLE IF NOT EXISTS MAPS_TO (
  so_id INT NOT NULL,
  clo_id INT NOT NULL,
  PRIMARY KEY (so_id, clo_id),
  FOREIGN KEY (so_id) REFERENCES STUDENT_OUTCOME(so_id),
  FOREIGN KEY (clo_id) REFERENCES CLO(clo_id)
);

CREATE TABLE IF NOT EXISTS SUPPORTS_PEO (
  so_id INT NOT NULL,
  peo_id INT NOT NULL,
  PRIMARY KEY (so_id, peo_id),
  FOREIGN KEY (so_id) REFERENCES STUDENT_OUTCOME(so_id),
  FOREIGN KEY (peo_id) REFERENCES PEO(peo_id)
);
