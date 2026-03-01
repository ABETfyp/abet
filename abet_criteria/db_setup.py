from django.apps import apps
from django.db import connection


SUPPORTS_PEO_SQL = """
CREATE TABLE IF NOT EXISTS SUPPORTS_PEO (
    so_id INTEGER NOT NULL,
    peo_id INTEGER NOT NULL,
    PRIMARY KEY (so_id, peo_id)
)
"""

SYLLABUS_CLO_SO_MAP_SQL = """
CREATE TABLE IF NOT EXISTS SYLLABUS_CLO_SO_MAP (
    map_id INTEGER PRIMARY KEY AUTOINCREMENT,
    syllabus_id INT NOT NULL,
    clo_id INT NOT NULL,
    so_id INT NOT NULL,
    UNIQUE (syllabus_id, clo_id, so_id)
)
"""

REQUIRED_COLUMNS = {
    "PROFESSIONAL_DEVELOPMENT": {
        "criterion6_id": "INTEGER",
    },
    "COURSE": {
        "curr_course_row_id": "INTEGER",
        "criterion5_id": "INTEGER",
    },
}


def _missing_unmanaged_models():
    existing_tables = set(connection.introspection.table_names())
    models = list(apps.get_app_config("abet_criteria").get_models())
    return [
        model
        for model in models
        if not model._meta.managed and model._meta.db_table not in existing_tables
    ]


def _table_columns(table_name):
    with connection.cursor() as cursor:
        columns = connection.introspection.get_table_description(cursor, table_name)
    return {column.name for column in columns}


def _ensure_required_columns():
    existing_tables = set(connection.introspection.table_names())
    added_columns = []
    qn = connection.ops.quote_name

    with connection.cursor() as cursor:
        for table_name, columns in REQUIRED_COLUMNS.items():
            if table_name not in existing_tables:
                continue

            existing_columns = {name.lower() for name in _table_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name.lower() in existing_columns:
                    continue
                cursor.execute(
                    f"ALTER TABLE {qn(table_name)} ADD COLUMN {qn(column_name)} {column_type} NULL"
                )
                added_columns.append(f"{table_name}.{column_name}")
                existing_columns.add(column_name.lower())

    return added_columns


def _ensure_runtime_tables():
    with connection.cursor() as cursor:
        cursor.execute(SUPPORTS_PEO_SQL)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_supports_peo_so ON SUPPORTS_PEO (so_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_supports_peo_peo ON SUPPORTS_PEO (peo_id)")

        cursor.execute(SYLLABUS_CLO_SO_MAP_SQL)
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_syllabus_clo_so_map_syllabus ON SYLLABUS_CLO_SO_MAP (syllabus_id)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_syllabus_clo_so_map_clo ON SYLLABUS_CLO_SO_MAP (clo_id)"
        )


def ensure_local_schema():
    """
    Ensure unmanaged legacy tables and raw-SQL support tables exist.

    Returns:
        dict: {
            "created_tables": [str, ...],
            "remaining_missing_tables": [str, ...],
        }
    """
    created_tables = []
    added_columns = []
    last_missing_count = None
    errors = {}

    while True:
        missing = _missing_unmanaged_models()
        if not missing:
            break

        if last_missing_count == len(missing):
            break
        last_missing_count = len(missing)

        with connection.schema_editor() as schema_editor:
            for model in missing:
                table_name = model._meta.db_table
                try:
                    schema_editor.create_model(model)
                except Exception as exc:  # noqa: BLE001 - best-effort bootstrap
                    errors[table_name] = str(exc)
                    continue
                created_tables.append(table_name)

    _ensure_runtime_tables()
    added_columns = _ensure_required_columns()

    remaining_missing = [model._meta.db_table for model in _missing_unmanaged_models()]
    if remaining_missing and errors:
        details = ", ".join(f"{table}: {errors.get(table, 'unknown error')}" for table in remaining_missing)
        raise RuntimeError(f"Failed to create legacy tables: {details}")

    return {
        "created_tables": sorted(set(created_tables)),
        "added_columns": sorted(set(added_columns)),
        "remaining_missing_tables": sorted(remaining_missing),
    }
