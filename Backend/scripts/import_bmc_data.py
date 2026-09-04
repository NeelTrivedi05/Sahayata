#!/usr/bin/env python3
"""
Import script for the official BMC historical complaint dataset.
Imports bmc_train.csv (960,000 records, 35 fields) into a dedicated SQLite
database (Backend/data/bmc_historical.db) with high-performance indexes.

Keeps bmc_train.csv and bmc_data_dictionary.csv strictly read-only and immutable.
"""

import os
import sys
import csv
import time
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "bmc_train.csv")
DICT_PATH = os.path.join(DATA_DIR, "bmc_data_dictionary.csv")
DB_PATH = os.path.join(DATA_DIR, "bmc_historical.db")

EXPECTED_COLUMNS = [
    "complaint_id", "complaint_date", "year", "month", "is_monsoon_season",
    "complaint_time_of_day", "ward_code", "ward_area", "zone", "ward_type",
    "population_density", "ward_slum_percentage", "complaint_category",
    "department_assigned", "complaint_channel", "severity", "has_photo_evidence",
    "has_gps_location", "media_attention", "politically_sensitive",
    "complainant_type", "property_type", "repeat_complainant",
    "prior_complaints_count", "resolution_days", "num_reassignments",
    "complaint_status", "contractor_category", "work_quality_rating",
    "site_inspected", "defect_liability_claim", "estimated_cost_inr",
    "infrastructure_age_years", "months_since_last_maintained", "citizen_satisfied"
]

def parse_int(val, default=0):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default

def parse_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def validate_data_dictionary():
    if not os.path.exists(DICT_PATH):
        print(f"[Warning] Data dictionary not found at {DICT_PATH}")
        return
    with open(DICT_PATH, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fields_in_dict = [row.get("Field") or row.get("field") or row.get("Field Name") for row in reader]
        fields_in_dict = [f.strip() for f in fields_in_dict if f]
        print(f"[Dictionary Verified] {len(fields_in_dict)} fields documented in data dictionary.")

def setup_database(conn):
    cursor = conn.cursor()
    
    # SQLite optimization pragmas
    cursor.execute("PRAGMA synchronous = OFF;")
    cursor.execute("PRAGMA journal_mode = MEMORY;")
    cursor.execute("PRAGMA cache_size = 100000;")
    cursor.execute("PRAGMA temp_store = MEMORY;")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bmc_historical_complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT UNIQUE NOT NULL,
        complaint_date TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        is_monsoon_season INTEGER NOT NULL,
        complaint_time_of_day TEXT,
        ward_code TEXT NOT NULL,
        ward_area TEXT,
        zone TEXT,
        ward_type TEXT,
        population_density TEXT,
        ward_slum_percentage REAL,
        complaint_category TEXT NOT NULL,
        department_assigned TEXT NOT NULL,
        complaint_channel TEXT,
        severity TEXT NOT NULL,
        has_photo_evidence INTEGER,
        has_gps_location INTEGER,
        media_attention INTEGER,
        politically_sensitive INTEGER,
        complainant_type TEXT,
        property_type TEXT,
        repeat_complainant INTEGER,
        prior_complaints_count INTEGER,
        resolution_days INTEGER,
        num_reassignments INTEGER,
        complaint_status TEXT NOT NULL,
        contractor_category TEXT,
        work_quality_rating TEXT,
        site_inspected INTEGER,
        defect_liability_claim INTEGER,
        estimated_cost_inr REAL,
        infrastructure_age_years INTEGER,
        months_since_last_maintained INTEGER,
        citizen_satisfied INTEGER NOT NULL,
        source TEXT DEFAULT 'BMC_HISTORICAL'
    );
    """)
    conn.commit()

def create_indexes(conn):
    print("\n[Indexing] Building high-performance query indexes...")
    cursor = conn.cursor()
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_bmc_cid ON bmc_historical_complaints (complaint_id);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_date ON bmc_historical_complaints (complaint_date);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_year_month ON bmc_historical_complaints (year, month);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_ward ON bmc_historical_complaints (ward_code);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_cat ON bmc_historical_complaints (complaint_category);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_dept ON bmc_historical_complaints (department_assigned);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_status ON bmc_historical_complaints (complaint_status);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_sev ON bmc_historical_complaints (severity);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_sat ON bmc_historical_complaints (citizen_satisfied);",
        "CREATE INDEX IF NOT EXISTS idx_bmc_monsoon ON bmc_historical_complaints (is_monsoon_season);"
    ]
    for idx_sql in indexes:
        cursor.execute(idx_sql)
    conn.commit()
    print("[Indexing] Complete.")

def import_bmc_data():
    start_time = time.time()
    print("=" * 70)
    print("BMC HISTORICAL DATASET IMPORT - SAHAYATA INTELLIGENCE LAYER")
    print("=" * 70)
    print(f"Source file:      {CSV_PATH}")
    print(f"Destination DB:   {DB_PATH}")

    if not os.path.exists(CSV_PATH):
        print(f"[Error] Source dataset not found at {CSV_PATH}")
        sys.exit(1)

    # Connect to SQLite
    conn = sqlite3.connect(DB_PATH)

    force_reimport = "--force" in sys.argv
    if force_reimport:
        print("\n[Notice] --force flag detected. Re-creating table and re-importing all 960,000 records...")
        conn.cursor().execute("DROP TABLE IF EXISTS bmc_historical_complaints;")
        conn.commit()

    setup_database(conn)
    cursor = conn.cursor()

    # Check if data is already imported
    cursor.execute("SELECT COUNT(*) FROM bmc_historical_complaints;")
    existing_count = cursor.fetchone()[0]
    if existing_count >= 960000 and not force_reimport:
        print(f"\n[Info] Database already contains {existing_count:,} records. Skipping re-import.")
        create_indexes(conn)
        conn.close()
        return

    insert_sql = """
    INSERT OR IGNORE INTO bmc_historical_complaints (
        complaint_id, complaint_date, year, month, is_monsoon_season,
        complaint_time_of_day, ward_code, ward_area, zone, ward_type,
        population_density, ward_slum_percentage, complaint_category,
        department_assigned, complaint_channel, severity, has_photo_evidence,
        has_gps_location, media_attention, politically_sensitive,
        complainant_type, property_type, repeat_complainant,
        prior_complaints_count, resolution_days, num_reassignments,
        complaint_status, contractor_category, work_quality_rating,
        site_inspected, defect_liability_claim, estimated_cost_inr,
        infrastructure_age_years, months_since_last_maintained, citizen_satisfied,
        source
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        'BMC_HISTORICAL'
    );
    """

    BATCH_SIZE = 25000
    batch = []
    total_processed = 0
    imported_count = 0
    duplicate_count = 0
    skipped_count = 0

    print("\n[Starting Stream Import] Reading dataset in streaming batches of 25,000...")

    with open(CSV_PATH, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        
        # Verify columns
        csv_headers = set(reader.fieldnames or [])
        missing_cols = set(EXPECTED_COLUMNS) - csv_headers
        if missing_cols:
            print(f"[Error] Missing expected columns in CSV: {missing_cols}")
            sys.exit(1)
        print(f"[Verified] All 35 columns present in CSV.")

        for row in reader:
            total_processed += 1

            cid = row.get("complaint_id", "").strip()
            if not cid:
                skipped_count += 1
                continue

            record = (
                cid,
                row.get("complaint_date", "").strip(),
                parse_int(row.get("year")),
                parse_int(row.get("month")),
                parse_int(row.get("is_monsoon_season")),
                row.get("complaint_time_of_day", "").strip(),
                row.get("ward_code", "").strip(),
                row.get("ward_area", "").strip(),
                row.get("zone", "").strip(),
                row.get("ward_type", "").strip(),
                row.get("population_density", "").strip(),
                parse_float(row.get("ward_slum_percentage")),
                row.get("complaint_category", "").strip(),
                row.get("department_assigned", "").strip(),
                row.get("complaint_channel", "").strip(),
                row.get("severity", "").strip(),
                parse_int(row.get("has_photo_evidence")),
                parse_int(row.get("has_gps_location")),
                parse_int(row.get("media_attention")),
                parse_int(row.get("politically_sensitive")),
                row.get("complainant_type", "").strip(),
                row.get("property_type", "").strip(),
                parse_int(row.get("repeat_complainant")),
                parse_int(row.get("prior_complaints_count")),
                parse_int(row.get("resolution_days")),
                parse_int(row.get("num_reassignments")),
                row.get("complaint_status", "").strip(),
                row.get("contractor_category", "").strip(),
                row.get("work_quality_rating", "").strip(),
                parse_int(row.get("site_inspected")),
                parse_int(row.get("defect_liability_claim")),
                parse_float(row.get("estimated_cost_inr")),
                parse_int(row.get("infrastructure_age_years")),
                parse_int(row.get("months_since_last_maintained")),
                parse_int(row.get("citizen_satisfied")),
            )

            batch.append(record)

            if len(batch) >= BATCH_SIZE:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                imported_count += len(batch)
                batch = []
                elapsed = time.time() - start_time
                rate = total_processed / elapsed if elapsed > 0 else 0
                pct = (total_processed / 960000.0) * 100
                print(f"  [Progress] {total_processed:>7,d} / 960,000 rows ({pct:5.1f}%) | {rate:6.0f} rows/sec")

        if batch:
            cursor.executemany(insert_sql, batch)
            conn.commit()
            imported_count += len(batch)
            batch = []

    # Check for duplicates / actual count in table
    cursor.execute("SELECT COUNT(*) FROM bmc_historical_complaints;")
    final_db_count = cursor.fetchone()[0]
    duplicate_count = total_processed - final_db_count - skipped_count

    # Build indexes
    create_indexes(conn)

    # Vacuum and optimize
    print("[Optimizing] Running PRAGMA optimize...")
    cursor.execute("PRAGMA optimize;")
    conn.commit()
    conn.close()

    total_time = time.time() - start_time
    db_size_mb = os.path.getsize(DB_PATH) / (1024 * 1024) if os.path.exists(DB_PATH) else 0

    print("\n" + "=" * 70)
    print("IMPORT COMPLETE - SUMMARY")
    print("=" * 70)
    print(f"Total rows in CSV:    {total_processed:,}")
    print(f"Imported to DB:       {final_db_count:,}")
    print(f"Skipped / Invalid:    {skipped_count:,}")
    print(f"Duplicate IDs:        {duplicate_count:,}")
    print(f"Database Size:        {db_size_mb:.2f} MB")
    print(f"Total Time Taken:     {total_time:.2f} seconds")
    print("=" * 70)

if __name__ == "__main__":
    import_bmc_data()
