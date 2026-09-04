"""
Verification Script: Bidirectional Live Synchronization between Citizen Portal and Ward Officer Portal
Simulates two distinct devices/browsers connected over WebSockets to the Sahayata backend.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_bidirectional_verification():
    print("=" * 70)
    print("SAHAYATA 2-WAY LIVE SYNCHRONIZATION VERIFICATION: CITIZEN <-> WARD")
    print("=" * 70)

    # Establish two concurrent WebSocket connections simulating 2 laptops
    with client.websocket_connect("/ws") as citizen_ws, client.websocket_connect("/ws") as ward_ws:
        print("[CONNECTED] Laptop 1: Citizen Portal WebSocket connected to /ws")
        print("[CONNECTED] Laptop 2: Ward Officer Portal WebSocket connected to /ws")

        # Test heartbeat on both
        citizen_ws.send_text("ping")
        assert citizen_ws.receive_text() == "pong"
        ward_ws.send_text("ping")
        assert ward_ws.receive_text() == "pong"
        print("[OK] Heartbeat ping-pong verified on both Citizen & Ward sockets.")

        # ----------------------------------------------------------------------
        # TEST 1: CITIZEN -> WARD (Citizen submits grievance on Laptop 1)
        # ----------------------------------------------------------------------
        print("\n--- TEST 1: CITIZEN -> WARD (New Grievance Creation) ---")
        new_complaint = {
            "title": "Severe Water Main Rupture flooding 12th Main Road",
            "category": "water",
            "categoryLabel": "Water Supply & Pipeline Leak",
            "coords": [12.9780, 77.6420],
            "address": "12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru",
            "phash": "1a2b3c4d5e6f7a8b",
            "clarificationAnswer": "High pressure drinking water pipe burst"
        }
        res1 = client.post("/api/reports", json=new_complaint)
        assert res1.status_code == 200, f"Error: {res1.text}"
        ticket_id = res1.json()["data"]["id"]
        print(f"[ACTION] Citizen filed ticket: {ticket_id}")

        # Verify Laptop 2 (Ward Officer) receives live broadcast
        ward_msg1 = ward_ws.receive_json()
        assert ward_msg1["event"] == "NEW_REPORT"
        assert ward_msg1["data"]["id"] == ticket_id
        assert ward_msg1["data"]["category"] == "water"
        assert "priority" in ward_msg1["data"]
        print(f"[VERIFIED] Ward Officer Portal received live 'NEW_REPORT' for {ticket_id}")
        print(f"           - Title: {ward_msg1['data']['title']}")
        print(f"           - Priority Score: {ward_msg1['data']['priority']['finalScore']}/100")

        # Drain message on citizen socket
        citizen_msg1 = citizen_ws.receive_json()
        assert citizen_msg1["event"] == "NEW_REPORT"

        # ----------------------------------------------------------------------
        # TEST 2: WARD -> CITIZEN (Ward Officer advances work order on Laptop 2)
        # ----------------------------------------------------------------------
        print("\n--- TEST 2: WARD -> CITIZEN (Status Progression: Clustered -> Prioritized -> Assigned -> Resolved) ---")
        # Step 2: Ward advances to Clustered
        res2 = client.post(f"/api/reports/{ticket_id}/progress", json={})
        assert res2.status_code == 200
        assert res2.json()["data"]["status"] == "clustered"
        assert res2.json()["data"]["statusStep"] == 2

        # Verify Citizen Laptop receives live update
        cit_msg2 = citizen_ws.receive_json()
        assert cit_msg2["event"] == "REPORT_UPDATED"
        assert cit_msg2["data"]["id"] == ticket_id
        assert cit_msg2["data"]["status"] == "clustered"
        assert cit_msg2["data"]["statusStep"] == 2
        print(f"[VERIFIED] Citizen Portal received live 'REPORT_UPDATED': Status = {cit_msg2['data']['status']} (Step {cit_msg2['data']['statusStep']})")
        # Drain ward socket
        _ = ward_ws.receive_json()

        # Step 3: Ward advances to Prioritized
        res3 = client.post(f"/api/reports/{ticket_id}/progress", json={})
        assert res3.status_code == 200
        cit_msg3 = citizen_ws.receive_json()
        assert cit_msg3["data"]["status"] == "prioritized"
        print(f"[VERIFIED] Citizen Portal received live 'REPORT_UPDATED': Status = {cit_msg3['data']['status']} (Step {cit_msg3['data']['statusStep']})")
        _ = ward_ws.receive_json()

        # Step 4: Ward advances to Assigned
        res4 = client.post(f"/api/reports/{ticket_id}/progress", json={})
        assert res4.status_code == 200
        cit_msg4 = citizen_ws.receive_json()
        assert cit_msg4["data"]["status"] == "assigned"
        print(f"[VERIFIED] Citizen Portal received live 'REPORT_UPDATED': Status = {cit_msg4['data']['status']} (Step {cit_msg4['data']['statusStep']})")
        _ = ward_ws.receive_json()

        # Step 5: Ward resolves ticket and uploads after-repair photo
        after_photo_url = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"
        res5 = client.post(f"/api/reports/{ticket_id}/progress", json={"afterImage": after_photo_url})
        assert res5.status_code == 200
        cit_msg5 = citizen_ws.receive_json()
        assert cit_msg5["data"]["status"] == "resolved"
        assert cit_msg5["data"]["statusStep"] == 5
        assert cit_msg5["data"]["afterImage"] == after_photo_url
        print(f"[VERIFIED] Citizen Portal received live 'REPORT_UPDATED': Status = {cit_msg5['data']['status']} (Step 5 - Resolved)")
        print(f"           - After Image Uploaded: {cit_msg5['data']['afterImage']}")
        print(f"           - Inspection Status: {cit_msg5['data']['resolution']['inspectionStatus']}")
        _ = ward_ws.receive_json()

        # ----------------------------------------------------------------------
        # TEST 3: CITIZEN -> WARD (Citizen Confirms Resolution / Verification)
        # ----------------------------------------------------------------------
        print("\n--- TEST 3: CITIZEN -> WARD (Citizen Verifies Resolution) ---")
        res6 = client.post(f"/api/reports/{ticket_id}/verify", json={"action": "confirm"})
        assert res6.status_code == 200
        ward_msg6 = ward_ws.receive_json()
        assert ward_msg6["event"] == "REPORT_UPDATED"
        assert ward_msg6["data"]["status"] == "verified"
        assert ward_msg6["data"]["statusStep"] == 6
        print(f"[VERIFIED] Ward Officer Portal received live 'REPORT_UPDATED': Status = {ward_msg6['data']['status']} (Step 6 - Verified)")
        _ = citizen_ws.receive_json()

        # ----------------------------------------------------------------------
        # TEST 4: CITIZEN -> WARD (Citizen Disputes Substandard Fix)
        # ----------------------------------------------------------------------
        print("\n--- TEST 4: CITIZEN -> WARD (Citizen Disputes & Reopens Ticket) ---")
        res7 = client.post(f"/api/reports/{ticket_id}/verify", json={"action": "dispute", "note": "Water is still leaking around collar."})
        assert res7.status_code == 200
        ward_msg7 = ward_ws.receive_json()
        assert ward_msg7["event"] == "REPORT_UPDATED"
        assert ward_msg7["data"]["status"] == "assigned"
        assert ward_msg7["data"]["statusStep"] == 4
        assert "rejected" in ward_msg7["data"]["resolution"]["note"].lower() or "leaking" in ward_msg7["data"]["resolution"]["note"].lower()
        print(f"[VERIFIED] Ward Officer Portal received live 'REPORT_UPDATED': Status = {ward_msg7['data']['status']} (Reopened to Step 4)")
        print(f"           - Dispute Note: {ward_msg7['data']['resolution']['note']}")
        _ = citizen_ws.receive_json()

        # ----------------------------------------------------------------------
        # TEST 5: MLA ESCALATION (Notify Ward Escalation Broadcast)
        # ----------------------------------------------------------------------
        print("\n--- TEST 5: 2-WAY BROADCAST (MLA Escalation / Notify Ward) ---")
        res8 = client.post(f"/api/reports/{ticket_id}/notify-ward")
        assert res8.status_code == 200
        cit_msg8 = citizen_ws.receive_json()
        ward_msg8 = ward_ws.receive_json()
        assert cit_msg8["data"]["mlaEscalated"] is True
        assert ward_msg8["data"]["mlaEscalated"] is True
        print(f"[VERIFIED] Both Citizen and Ward Portals received live 'REPORT_UPDATED' with mlaEscalated=True")

    print("\n" + "=" * 70)
    print("[ALL CHECKS PASSED] BIDIRECTIONAL LIVE SYNCHRONIZATION VERIFIED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_bidirectional_verification()
