#!/usr/bin/env python3
"""
Pre-computes global statistical aggregations for the 960,000-record BMC dataset
and stores them in Backend/data/bmc_summary.json for sub-millisecond API responses.
"""

import os
import sys
import json
import time
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "bmc_historical.db")
SUMMARY_PATH = os.path.join(DATA_DIR, "bmc_summary.json")

MUMBAI_WARD_COORDS = {
    'A':   {'name': 'Colaba, Fort, Nariman Point', 'coords': [18.927, 72.833], 'zone': 'South Mumbai'},
    'B':   {'name': 'Sandhurst Road, Dongri, Masjid', 'coords': [18.950, 72.838], 'zone': 'South Mumbai'},
    'C':   {'name': 'Marine Lines, Bhuleshwar, Kalbadevi', 'coords': [18.951, 72.825], 'zone': 'South Mumbai'},
    'D':   {'name': 'Malabar Hill, Grant Road, Walkeshwar', 'coords': [18.963, 72.812], 'zone': 'South Mumbai'},
    'E':   {'name': 'Byculla, Mazgaon, Mumbai Central', 'coords': [18.973, 72.830], 'zone': 'South Mumbai'},
    'F/N': {'name': 'Matunga, Wadala, Sion, Hindu Colony', 'coords': [19.030, 72.858], 'zone': 'South Central'},
    'F/S': {'name': 'Parel, Sewri, Naigaon', 'coords': [18.998, 72.842], 'zone': 'South Central'},
    'G/N': {'name': 'Dadar, Mahim, Dharavi', 'coords': [19.025, 72.841], 'zone': 'Western Suburbs'},
    'G/S': {'name': 'Worli, Lower Parel, Prabhadevi', 'coords': [18.995, 72.818], 'zone': 'South Central'},
    'H/E': {'name': 'Santacruz East, Khar East, Vakola', 'coords': [19.075, 72.850], 'zone': 'Western Suburbs'},
    'H/W': {'name': 'Bandra West, Khar West, Bandstand', 'coords': [19.060, 72.835], 'zone': 'Western Suburbs'},
    'K/E': {'name': 'Andheri East, Jogeshwari East, MIDC', 'coords': [19.115, 72.860], 'zone': 'Western Suburbs'},
    'K/W': {'name': 'Andheri West, Juhu, Versova, Lokhandwala', 'coords': [19.125, 72.835], 'zone': 'Western Suburbs'},
    'L':   {'name': 'Kurla, Chunabhatti, Sakinaka', 'coords': [19.070, 72.885], 'zone': 'Eastern Suburbs'},
    'M/E': {'name': 'Govandi, Mankhurd, Shivaji Nagar', 'coords': [19.055, 72.915], 'zone': 'Eastern Suburbs'},
    'M/W': {'name': 'Chembur, Tilak Nagar, Pestom Sagar', 'coords': [19.055, 72.895], 'zone': 'Eastern Suburbs'},
    'N':   {'name': 'Ghatkopar, Vikhroli West, Pant Nagar', 'coords': [19.080, 72.910], 'zone': 'Eastern Suburbs'},
    'P/N': {'name': 'Malad, Marve, Madh Island, Dindoshi', 'coords': [19.185, 72.845], 'zone': 'Western Suburbs'},
    'P/S': {'name': 'Goregaon, Aarey Colony, Bangur Nagar', 'coords': [19.165, 72.845], 'zone': 'Western Suburbs'},
    'R/C': {'name': 'Borivali, Gorai, Eksar', 'coords': [19.225, 72.855], 'zone': 'Western Suburbs'},
    'R/N': {'name': 'Dahisar, Mandapeshwar', 'coords': [19.250, 72.860], 'zone': 'Western Suburbs'},
    'R/S': {'name': 'Kandivali, Charkop, Poisar', 'coords': [19.205, 72.850], 'zone': 'Western Suburbs'},
    'S':   {'name': 'Bhandup, Powai, Kanjurmarg, IIT', 'coords': [19.130, 72.930], 'zone': 'Eastern Suburbs'},
    'T':   {'name': 'Mulund, Nahur', 'coords': [19.175, 72.950], 'zone': 'Eastern Suburbs'}
}

def generate_summary():
    t0 = time.time()
    print("[Summary Generator] Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("[Summary Generator] Calculating global KPIs...")
    cursor.execute("""
        SELECT 
            COUNT(*) AS totalComplaints,
            SUM(CASE WHEN complaint_status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedCount,
            SUM(CASE WHEN complaint_status = 'In Progress' THEN 1 ELSE 0 END) AS inProgressCount,
            SUM(CASE WHEN complaint_status = 'Closed Without Resolution' THEN 1 ELSE 0 END) AS closedCount,
            SUM(CASE WHEN complaint_status = 'Escalated' THEN 1 ELSE 0 END) AS escalatedCount,
            SUM(CASE WHEN complaint_status = 'Reopened' THEN 1 ELSE 0 END) AS reopenedCount,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(CASE work_quality_rating WHEN 'Excellent' THEN 4.0 WHEN 'Good' THEN 3.0 WHEN 'Fair' THEN 2.0 WHEN 'Poor' THEN 1.0 ELSE NULL END), 2) AS avgWorkQualityRating,
            ROUND(AVG(site_inspected) * 100, 2) AS siteInspectionRate,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS citizenSatisfactionRate,
            ROUND(AVG(estimated_cost_inr), 2) AS avgEstimatedCost,
            ROUND(AVG(infrastructure_age_years), 1) AS avgInfrastructureAge,
            ROUND(AVG(months_since_last_maintained), 1) AS avgMaintenanceGapMonths,
            SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints,
            SUM(CASE WHEN repeat_complainant = 1 THEN 1 ELSE 0 END) AS repeatComplaints,
            SUM(CASE WHEN has_photo_evidence = 1 THEN 1 ELSE 0 END) AS photoEvidenceCount,
            SUM(CASE WHEN has_gps_location = 1 THEN 1 ELSE 0 END) AS gpsLocationCount
        FROM bmc_historical_complaints;
    """)
    global_kpis = dict(cursor.fetchone())
    total = global_kpis["totalComplaints"]
    global_kpis["monsoonRate"] = round((global_kpis["monsoonComplaints"] / total) * 100, 1) if total else 0
    global_kpis["resolvedRate"] = round((global_kpis["resolvedCount"] / total) * 100, 1) if total else 0
    global_kpis["repeatRate"] = round((global_kpis["repeatComplaints"] / total) * 100, 1) if total else 0

    print("[Summary Generator] Aggregating categories...")
    cursor.execute("""
        SELECT 
            complaint_category AS category,
            department_assigned AS primaryDepartment,
            COUNT(*) AS totalComplaints,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
            ROUND(AVG(CASE work_quality_rating WHEN 'Excellent' THEN 4.0 WHEN 'Good' THEN 3.0 WHEN 'Fair' THEN 2.0 WHEN 'Poor' THEN 1.0 ELSE NULL END), 2) AS avgWorkQuality,
            ROUND(AVG(estimated_cost_inr), 0) AS avgCost,
            SUM(CASE WHEN severity IN ('High', 'Critical') THEN 1 ELSE 0 END) AS highSeverityCount,
            SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints
        FROM bmc_historical_complaints
        GROUP BY complaint_category
        ORDER BY totalComplaints DESC;
    """)
    categories = [dict(r) for r in cursor.fetchall()]

    print("[Summary Generator] Aggregating 24 wards...")
    cursor.execute("""
        SELECT 
            ward_code AS wardCode,
            ward_area AS wardArea,
            zone,
            ward_type AS wardType,
            MAX(population_density) AS populationDensity,
            MAX(ward_slum_percentage) AS slumPercentage,
            COUNT(*) AS totalComplaints,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
            ROUND(AVG(site_inspected) * 100, 2) AS siteInspectionRate,
            SUM(CASE WHEN complaint_status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedCount,
            SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints
        FROM bmc_historical_complaints
        GROUP BY ward_code
        ORDER BY totalComplaints DESC;
    """)
    raw_wards = [dict(r) for r in cursor.fetchall()]
    wards = []
    for w in raw_wards:
        w_code = w["wardCode"]
        info = MUMBAI_WARD_COORDS.get(w_code, {'name': w["wardArea"], 'coords': [19.0760, 72.8777]})
        w["coords"] = info["coords"]
        w["wardFullName"] = info["name"]
        wards.append(w)

    print("[Summary Generator] Aggregating departments...")
    cursor.execute("""
        SELECT 
            department_assigned AS department,
            COUNT(*) AS totalComplaints,
            ROUND(AVG(num_reassignments), 2) AS avgReassignments,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(CASE work_quality_rating WHEN 'Excellent' THEN 4.0 WHEN 'Good' THEN 3.0 WHEN 'Fair' THEN 2.0 WHEN 'Poor' THEN 1.0 ELSE NULL END), 2) AS avgWorkQuality,
            ROUND(AVG(site_inspected) * 100, 2) AS siteInspectionRate,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
            ROUND(AVG(estimated_cost_inr), 0) AS avgCost
        FROM bmc_historical_complaints
        GROUP BY department_assigned
        ORDER BY totalComplaints DESC;
    """)
    departments = [dict(r) for r in cursor.fetchall()]

    print("[Summary Generator] Aggregating temporal trends...")
    cursor.execute("""
        SELECT 
            year,
            COUNT(*) AS totalComplaints,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
            SUM(CASE WHEN complaint_status = 'Resolved' THEN 1 ELSE 0 END) AS resolvedCount,
            SUM(CASE WHEN is_monsoon_season = 1 THEN 1 ELSE 0 END) AS monsoonComplaints
        FROM bmc_historical_complaints
        GROUP BY year
        ORDER BY year ASC;
    """)
    yearly = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT 
            month,
            COUNT(*) AS totalComplaints,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate
        FROM bmc_historical_complaints
        GROUP BY month
        ORDER BY month ASC;
    """)
    monthly = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT 
            is_monsoon_season AS isMonsoon,
            COUNT(*) AS totalComplaints,
            ROUND(AVG(resolution_days), 2) AS avgResolutionDays,
            ROUND(AVG(citizen_satisfied) * 100, 2) AS satisfactionRate,
            ROUND(AVG(estimated_cost_inr), 0) AS avgCost
        FROM bmc_historical_complaints
        GROUP BY is_monsoon_season;
    """)
    monsoon_rows = [dict(r) for r in cursor.fetchall()]
    monsoon_comp = {
        "monsoon": next((r for r in monsoon_rows if r["isMonsoon"] == 1), None),
        "nonMonsoon": next((r for r in monsoon_rows if r["isMonsoon"] == 0), None)
    }

    print("[Summary Generator] Aggregating severity breakdown...")
    cursor.execute("""
        SELECT severity, COUNT(*) AS count,
               ROUND(AVG(citizen_satisfied) * 100, 1) AS satisfactionRate
        FROM bmc_historical_complaints
        GROUP BY severity
        ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END;
    """)
    severities = [dict(r) for r in cursor.fetchall()]

    # Map Data: Ward summaries with coordinates
    map_data = [{
        "wardCode": w["wardCode"],
        "wardName": w["wardFullName"],
        "zone": w["zone"],
        "coords": w["coords"],
        "totalComplaints": w["totalComplaints"],
        "satisfactionRate": w["satisfactionRate"],
        "avgResolutionDays": w["avgResolutionDays"],
        "slumPercentage": w["slumPercentage"],
        "populationDensity": w["populationDensity"],
        "siteInspectionRate": w["siteInspectionRate"],
        "monsoonComplaints": w["monsoonComplaints"]
    } for w in wards]

    summary_payload = {
        "meta": {
            "dataset": "BMC Mumbai Historical Grievance Redressal (2018-2024)",
            "totalRecords": total,
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "executionTimeSeconds": round(time.time() - t0, 2)
        },
        "stats": {
            **global_kpis,
            "categories": categories,
            "wards": wards,
            "severities": severities
        },
        "categories": categories,
        "wards": wards,
        "departments": departments,
        "trends": {
            "yearly": yearly,
            "monthly": monthly,
            "monsoonComparison": monsoon_comp
        },
        "mapData": map_data
    }

    with open(SUMMARY_PATH, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, indent=2)

    conn.close()
    print(f"\n[Summary Generator] Generated {SUMMARY_PATH} ({os.path.getsize(SUMMARY_PATH) / 1024:.1f} KB) in {time.time() - t0:.2f}s")

if __name__ == "__main__":
    generate_summary()
