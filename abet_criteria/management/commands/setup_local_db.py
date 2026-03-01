from django.core.management import call_command
from django.core.management.base import BaseCommand

from abet_criteria.db_setup import ensure_local_schema


class Command(BaseCommand):
    help = "Initialize local DB schema (migrations + unmanaged legacy tables)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-migrate",
            action="store_true",
            help="Skip Django migrations and only ensure unmanaged/runtime tables.",
        )

    def handle(self, *args, **options):
        verbosity = options.get("verbosity", 1)
        skip_migrate = options.get("skip_migrate", False)

        if not skip_migrate:
            self.stdout.write("Running migrations...")
            call_command("migrate", interactive=False, verbosity=verbosity)

        self.stdout.write("Ensuring unmanaged and runtime tables...")
        result = ensure_local_schema()

        created = result.get("created_tables", [])
        added_columns = result.get("added_columns", [])
        remaining = result.get("remaining_missing_tables", [])

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created {len(created)} table(s)."))
            for table in created:
                self.stdout.write(f"  - {table}")
        else:
            self.stdout.write(self.style.SUCCESS("No missing tables found."))

        if added_columns:
            self.stdout.write(self.style.SUCCESS(f"Added {len(added_columns)} missing column(s)."))
            for column in added_columns:
                self.stdout.write(f"  - {column}")

        if remaining:
            raise RuntimeError(f"Some tables are still missing: {', '.join(remaining)}")

        self.stdout.write(self.style.SUCCESS("Local DB schema is ready."))
