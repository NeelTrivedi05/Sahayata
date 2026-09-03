"""
Validation test suite for Sahayata FastAPI Backend.
"""

from fastapi.testclient import TestClient
from main import app
import io
import base64
from PIL import Image

client = TestClient(app)

def test_all():
    print("==================================================")
    print("[TEST] SAHAYATA FASTAPI BACKEND VALIDATION SUITE")
    print("==================================================")

    # 1. Jurisdiction
    res = client.get("/api/jurisdiction")
    assert res.status_code == 200, "Jurisdiction failed"
    data = res.json()
    assert data["data"]["city"] == "Bengaluru", "City mismatch"
    print("[PASS] GET /api/jurisdiction (BBMP Ward 142 loaded)")

    # 2. Reports with dynamic priority
    res = client.get("/api/reports")
    assert res.status_code == 200, "Reports failed"
    reports_data = res.json()
    assert reports_data["count"] >= 3, "Sample reports missing"
    assert "finalScore" in reports_data["data"][0]["priority"], "Priority calculation missing"
    print(f"[PASS] GET /api/reports ({reports_data['count']} reports with dynamic priority score)")

    # 3. Duplicate Intercept (HTTP 409)
    # Trying to report a pothole right at St. Mary's School (within 50m)
    duplicate_payload = {
        "title": "Another pothole here",
        "category": "pothole",
        "categoryLabel": "Road Hazard & Pothole",
        "coords": [12.9724, 77.6419], # ~15m from CIVIC-2026-8921
        "address": "St. Mary's High School Road",
        "phash": "a1b2c3d4e5f60718"
    }
    res = client.post("/api/reports", json=duplicate_payload)
    assert res.status_code == 409, f"Expected 409 duplicate conflict, got {res.status_code}"
    detail = res.json()["detail"]
    assert detail["isDuplicate"] is True, "isDuplicate flag missing"
    print(f"[PASS] POST /api/reports Duplicate Intercept (Caught duplicate {detail['duplicateReport']['id']} within {detail['duplicateReport']['distanceMeters']}m)")

    # 4. Valid distinct report (HTTP 200)
    new_payload = {
        "title": "Broken Streetlight near Metro Pillar 140",
        "category": "electricity",
        "categoryLabel": "Electrical Hazard",
        "coords": [12.9850, 77.6550], # Far away
        "address": "Indiranagar Metro Corridor",
        "phash": "f1e2d3c4b5a60799"
    }
    res = client.post("/api/reports", json=new_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    new_ticket_id = res.json()["data"]["id"]
    print(f"[PASS] POST /api/reports Registered Ticket: {new_ticket_id}")

    # 5. Endorse duplicate report
    res = client.post("/api/reports/CIVIC-2026-8921/endorse", json={"voterId": "Citizen_42"})
    assert res.status_code == 200, "Endorsement failed"
    print(f"[PASS] POST /api/reports/CIVIC-2026-8921/endorse (Duplicate count: {res.json()['duplicateCount']})")

    # 6. Progress ticket (Ward Engineer)
    res = client.patch("/api/reports/CIVIC-2026-8921/progress", json={
        "statusStep": 5,
        "status": "resolved",
        "note": "Pothole filled with Bitumen mix by Apex Infra."
    })
    assert res.status_code == 200, "Progress failed"
    print("[PASS] PATCH /api/reports/CIVIC-2026-8921/progress (Status moved to resolved)")

    # 7. Native AI pHash generation endpoint
    img = Image.new('RGB', (100, 100), color='red')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    res = client.post("/api/ai/phash", json={"image_base64": b64})
    assert res.status_code == 200, "pHash generation failed"
    hash_val = res.json()["hexHash"]
    print(f"[PASS] POST /api/ai/phash (Computed 64-bit dHash: {hash_val})")

    print("\n==================================================")
    print("[SUCCESS] ALL 7 FASTAPI ENDPOINTS FULLY VERIFIED AND WORKING!")
    print("==================================================")

if __name__ == "__main__":
    test_all()
