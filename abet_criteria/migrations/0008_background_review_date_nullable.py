from django.db import migrations, models


FORWARD_SQL = """
ALTER TABLE BACKGROUND_INFO RENAME TO BACKGROUND_INFO__old;

CREATE TABLE BACKGROUND_INFO (
  background_id_ INT NOT NULL,
  program_contact_name VARCHAR(255) NOT NULL,
  contact_title VARCHAR(255) NOT NULL,
  office_location VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  year_implemented INT NOT NULL,
  last_general_review_date DATE NULL,
  summary_of_major_changes TEXT NOT NULL,
  Cycle_ID INT NOT NULL,
  item_id INT NOT NULL,
  PRIMARY KEY (background_id_),
  FOREIGN KEY (Cycle_ID) REFERENCES ACCREDIATION_CYCLE(Cycle_ID),
  FOREIGN KEY (item_id) REFERENCES CHECKLIST_ITEM(item_id)
);

INSERT INTO BACKGROUND_INFO (
  background_id_,
  program_contact_name,
  contact_title,
  office_location,
  phone_number,
  email_address,
  year_implemented,
  last_general_review_date,
  summary_of_major_changes,
  Cycle_ID,
  item_id
)
SELECT
  background_id_,
  program_contact_name,
  contact_title,
  office_location,
  phone_number,
  email_address,
  year_implemented,
  last_general_review_date,
  summary_of_major_changes,
  Cycle_ID,
  item_id
FROM BACKGROUND_INFO__old;

DROP TABLE BACKGROUND_INFO__old;
"""


REVERSE_SQL = """
ALTER TABLE BACKGROUND_INFO RENAME TO BACKGROUND_INFO__old;

CREATE TABLE BACKGROUND_INFO (
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

INSERT INTO BACKGROUND_INFO (
  background_id_,
  program_contact_name,
  contact_title,
  office_location,
  phone_number,
  email_address,
  year_implemented,
  last_general_review_date,
  summary_of_major_changes,
  Cycle_ID,
  item_id
)
SELECT
  background_id_,
  program_contact_name,
  contact_title,
  office_location,
  phone_number,
  email_address,
  year_implemented,
  COALESCE(last_general_review_date, DATE('now')),
  summary_of_major_changes,
  Cycle_ID,
  item_id
FROM BACKGROUND_INFO__old;

DROP TABLE BACKGROUND_INFO__old;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('abet_criteria', '0007_evidencefile_database_storage'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(FORWARD_SQL, REVERSE_SQL),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='backgroundinfo',
                    name='last_general_review_date',
                    field=models.DateField(blank=True, null=True),
                ),
            ],
        ),
    ]
