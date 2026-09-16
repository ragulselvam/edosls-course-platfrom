#!/usr/bin/env python3
"""
Multi-Tenant Platform Database Migration Script: SQLite -> Supabase PostgreSQL
Usage:
    python migrate_to_supabase.py [--dry-run] [--sqlite-path database.db] [--postgres-url postgresql://...]
"""

import sys
import os
import sqlite3
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load local environment
load_dotenv()

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Error: 'psycopg2' is required. Run 'pip install psycopg2-binary'")
    sys.exit(1)

# Ordered tables respecting foreign key constraints
TABLE_SEQUENCE = [
    "colleges",
    "roles",
    "users",
    "college_admins",
    "students",
    "courses",
    "course_modules",
    "course_contents",
    "enrollments",
    "progress",
    "assignments",
    "assignment_submissions",
    "assessments",
    "assessment_questions",
    "assessment_attempts",
    "certificates",
    "notifications",
    "audit_logs",
    "python_sandbox_runs",
    "jetbot_simulations",
    "course_announcements",
    "discussions"
]

def migrate_database(sqlite_path: str, pg_url: str, dry_run: bool = False):
    print("=" * 70)
    print("🚀 SUPABASE DATA MIGRATION UTILITY")
    print("=" * 70)
    print(f"Source SQLite:    {sqlite_path}")
    print(f"Target Supabase:  {pg_url.split('@')[-1] if '@' in pg_url else 'PostgreSQL'}")
    print(f"Dry Run Mode:     {'ENABLED (No changes will be written)' if dry_run else 'DISABLED'}")
    print("-" * 70)

    if not Path(sqlite_path).exists():
        print(f"❌ Error: SQLite file '{sqlite_path}' does not exist.")
        sys.exit(1)

    # 1. Connect to SQLite
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # 2. Connect to PostgreSQL
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)

    try:
        pg_conn = psycopg2.connect(pg_url)
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"❌ Failed to connect to Supabase PostgreSQL: {e}")
        print("\nPlease check your DATABASE_URL in .env or provide --postgres-url")
        sys.exit(1)

    total_migrated = 0

    for table in TABLE_SEQUENCE:
        # Check if table exists in SQLite
        sqlite_cur.execute(f"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='{table}'")
        if sqlite_cur.fetchone()[0] == 0:
            print(f"⏩ Skipping '{table}': Table not present in source SQLite.")
            continue

        # Fetch all rows from SQLite
        sqlite_cur.execute(f"SELECT * FROM {table}")
        rows = sqlite_cur.fetchall()
        if not rows:
            print(f"⚪ Table '{table}': 0 rows to migrate.")
            continue

        columns = rows[0].keys()
        col_names = ", ".join([f'"{c}"' for c in columns])
        placeholders = ", ".join(["%s"] * len(columns))

        data = [tuple(r[c] for c in columns) for r in rows]

        print(f"📦 Migrating '{table}': {len(data)} records...", end=" ")

        if dry_run:
            print("✓ [DRY-RUN OK]")
            continue

        try:
            # Check if Postgres table exists
            pg_cur.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = '{table}'
                );
            """)
            if not pg_cur.fetchone()[0]:
                print(f"\n⚠️ Postgres table '{table}' does not exist yet. Please run 'supabase_schema.sql' in Supabase SQL editor.")
                continue

            # Upsert records
            insert_query = f"""
                INSERT INTO "{table}" ({col_names})
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING;
            """
            pg_cur.executemany(insert_query, data)
            pg_conn.commit()

            # Sync sequence ID
            if "id" in columns:
                try:
                    pg_cur.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), coalesce(max(id), 1)) FROM {table};")
                    pg_conn.commit()
                except Exception:
                    pg_conn.rollback()

            total_migrated += len(data)
            print(f"✅ Transferred ({len(data)} rows)")

        except Exception as err:
            pg_conn.rollback()
            print(f"❌ Failed: {err}")

    sqlite_conn.close()
    pg_conn.close()

    print("-" * 70)
    print(f"🎉 MIGRATION COMPLETED! Total records transferred: {total_migrated}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="Migrate platform database to Supabase PostgreSQL")
    parser.add_argument("--dry-run", action="store_true", help="Simulate migration without writing to PostgreSQL")
    parser.add_argument("--sqlite-path", default=os.environ.get("DATABASE_PATH", "database.db"), help="Path to SQLite DB")
    parser.add_argument("--postgres-url", default=os.environ.get("DATABASE_URL", ""), help="Supabase PostgreSQL connection string")
    
    args = parser.parse_args()

    if not args.postgres_url:
        print("❌ Error: PostgreSQL connection string required. Set DATABASE_URL in .env or pass --postgres-url")
        sys.exit(1)

    migrate_database(args.sqlite_path, args.postgres_url, args.dry_run)

if __name__ == "__main__":
    main()