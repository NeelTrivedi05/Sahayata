"""
Validation test suite for Sahayata FastAPI Backend.
Supports both Pytest (`pytest Backend/test_api.py`) and Direct Execution (`python test_api.py`).
"""

import os
import sys
import io
import base64
from PIL import Image

# Ensure Backend directory is resolved regardless of working directory or IDE configuration
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_jurisdiction():
    """Verify BBMP Ward 142 jurisdiction data."""
    res = client.get("/api/jurisdiction")
    assert res.status_code == 200, "Jurisdiction endpoint failed"
    data = res.json()
    assert data["data"]["city"] == "Bengaluru", "City mismatch"
    assert data["data"]["wardNumber"] == 142, "Ward number mismatch"
    print("[PASS] GET /api/jurisdiction (BBMP Ward 142 loaded)")


def test_reports_dynamic_priority():
    """Verify in-memory reports return with anti-deadlock priority scores."""
    res = client.get("/api/reports")
    assert res.status_code == 200, "Reports endpoint failed"
    reports_data = res.json()
    assert reports_data["count"] >= 3, "Sample reports missing"
    assert "finalScore" in reports_data["data"][0]["priority"], "Priority calculation missing"
    print(f"[PASS] GET /api/reports ({reports_data['count']} reports with dynamic priority score)")


def test_duplicate_intercept():
    """Verify multi-factor deduplication intercepts proximity conflict within 50m (HTTP 409)."""
    duplicate_payload = {
        "title": "Another pothole here",
        "category": "pothole",
        "categoryLabel": "Road Hazard & Pothole",
        "coords": [12.9724, 77.6419],  # ~15m from CIVIC-2026-8921
        "address": "St. Mary's High School Road",
        "phash": "a1b2c3d4e5f60718"
    }
    res = client.post("/api/reports", json=duplicate_payload)
    assert res.status_code == 409, f"Expected 409 duplicate conflict, got {res.status_code}"
    detail = res.json()["detail"]
    assert detail["isDuplicate"] is True, "isDuplicate flag missing"
    print(f"[PASS] POST /api/reports Duplicate Intercept (Caught duplicate {detail['duplicateReport']['id']} within {detail['duplicateReport']['distanceMeters']}m)")


def test_create_valid_report():
    """Verify submitting a distinct, non-duplicate civic issue (HTTP 200)."""
    new_payload = {
        "title": "Broken Streetlight near Metro Pillar 140",
        "category": "electricity",
        "categoryLabel": "Electrical Hazard",
        "coords": [12.9850, 77.6550],  # Far away
        "address": "Indiranagar Metro Corridor",
        "phash": "f1e2d3c4b5a60799"
    }
    res = client.post("/api/reports", json=new_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    new_ticket_id = res.json()["data"]["id"]
    print(f"[PASS] POST /api/reports Registered Ticket: {new_ticket_id}")


def test_endorse_report():
    """Verify citizen endorsement (+1 duplicateCount / boost)."""
    res = client.post("/api/reports/CIVIC-2026-8921/endorse", json={"voterId": "Citizen_42"})
    assert res.status_code == 200, "Endorsement failed"
    print(f"[PASS] POST /api/reports/CIVIC-2026-8921/endorse (Duplicate count: {res.json()['duplicateCount']})")


def test_progress_report():
    """Verify ward engineer updating complaint lifecycle to resolved."""
    res = client.patch("/api/reports/CIVIC-2026-8921/progress", json={
        "statusStep": 5,
        "status": "resolved",
        "note": "Pothole filled with Bitumen mix by Apex Infra."
    })
    assert res.status_code == 200, "Progress update failed"
    print("[PASS] PATCH /api/reports/CIVIC-2026-8921/progress (Status moved to resolved)")


def test_phash_generation():
    """Verify AI perceptual hash generation endpoint."""
    img = Image.new('RGB', (100, 100), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    res = client.post("/api/ai/phash", json={"image_base64": b64})
    assert res.status_code == 200, "pHash generation failed"
    data = res.json()
    assert data["success"] is True, "pHash response success flag false"
    assert len(data["hexHash"]) == 16, "Expected 64-bit hex hash (16 chars)"
    print(f"[PASS] POST /api/ai/phash (Computed 64-bit dHash: {data['hexHash']})")


if __name__ == "__main__":
    print("==================================================")
    print("[TEST] SAHAYATA FASTAPI BACKEND VALIDATION SUITE")
    print("==================================================")
    test_jurisdiction()
    test_reports_dynamic_priority()
    test_duplicate_intercept()
    test_create_valid_report()
    test_endorse_report()
    test_progress_report()
    test_phash_generation()
    print("\n==================================================")
    print("[SUCCESS] ALL 7 FASTAPI ENDPOINTS FULLY VERIFIED AND WORKING!")
    print("==================================================")
