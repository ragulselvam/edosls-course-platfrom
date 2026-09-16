#!/usr/bin/env python3
"""
Database Management Utility for Multi-Tenant Training & Assessment Platform
Target Database: database.db
"""

import sys
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "database.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_schema():
    """Initializes the database schema from schema.sql if tables do not exist."""
    print(f"[DB] Initializing database at: {DB_PATH}")
    if not SCHEMA_PATH.exists():
        print(f"[Error] Schema file {SCHEMA_PATH} not found!")
        sys.exit(1)
        
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = get_connection()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("[DB] ✅ Schema successfully applied to database.db!")

def inspect_db():
    """Prints a summary of all tables and row counts in database.db."""
    if not DB_PATH.exists():
        print(f"[Error] Database file {DB_PATH} does not exist. Run python init_database.py first.")
        return

    conn = get_connection()
    cur = conn.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
    
    print("\n" + "=" * 60)
    print(f"📊 DATABASE INSPECTION REPORT ({DB_PATH.name})")
    print("=" * 60)
    print(f"Database File Size: {DB_PATH.stat().st_size / 1024:.2f} KB\n")
    print(f"{'Table Name':<25} | {'Row Count':<10}")
    print("-" * 40)
    
    for t in tables:
        tname = t[0]
        cnt = cur.execute(f"SELECT count(*) FROM {tname}").fetchone()[0]
        print(f"{tname:<25} | {cnt:<10}")

    print("-" * 40)
    print("\n🏛️ Active Colleges:")
    colleges = cur.execute("SELECT id, name, code, domain, is_active FROM colleges").fetchall()
    if colleges:
        for c in colleges:
            print(f"  - [{c['code']}] {c['name']} (Domain: {c['domain'] or 'N/A'}, Active: {bool(c['is_active'])})")
    else:
        print("  (No colleges registered yet)")

    print("\n👤 Users / Accounts:")
    users = cur.execute("SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, c.code as college_code FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN colleges c ON u.college_id = c.id").fetchall()
    if users:
        for u in users:
            print(f"  - {u['email']} | {u['first_name']} {u['last_name']} | Role: {u['role']} | College: {u['college_code'] or 'GLOBAL'}")
    else:
        print("  (No users registered yet)")
    print("=" * 60 + "\n")
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("--inspect", "-i", "status", "info"):
        inspect_db()
    elif len(sys.argv) > 1 and sys.argv[1] in ("--seed", "-s"):
        from app.seed import seed_database
        seed_database(force=True)
        inspect_db()
    else:
        init_schema()
        inspect_db()