import asyncio
import json
import httpx
import websockets

async def test_live():
    print("Testing live running server on 127.0.0.1:5000...")
    async with websockets.connect('ws://127.0.0.1:5000/ws') as cit_ws, websockets.connect('ws://127.0.0.1:5000/ws') as ward_ws:
        async with httpx.AsyncClient() as http_client:
            # 1. Citizen submits report -> Ward receives NEW_REPORT
            res = await http_client.post('http://127.0.0.1:5000/api/reports', json={
                'title': 'Live Server Verification Ticket',
                'category': 'water',
                'categoryLabel': 'Water Supply',
                'coords': [12.98, 77.65],
                'address': 'Indiranagar 100ft Rd'
            })
            assert res.status_code == 200, f"Error: {res.text}"
            ticket = res.json()['data']
            msg1 = json.loads(await ward_ws.recv())
            assert msg1['event'] == 'NEW_REPORT' and msg1['data']['id'] == ticket['id']
            print(f"[LIVE SERVER VERIFIED] Citizen -> Ward: Ward received NEW_REPORT for {ticket['id']}")
            _ = await cit_ws.recv()

            # 2. Ward advances progress -> Citizen receives REPORT_UPDATED
            prog_res = await http_client.post(f"http://127.0.0.1:5000/api/reports/{ticket['id']}/progress", json={})
            assert prog_res.status_code == 200
            msg2 = json.loads(await cit_ws.recv())
            assert msg2['event'] == 'REPORT_UPDATED' and msg2['data']['status'] == 'clustered'
            print(f"[LIVE SERVER VERIFIED] Ward -> Citizen: Citizen received REPORT_UPDATED (Status: {msg2['data']['status']})")
            _ = await ward_ws.recv()

            # 3. Citizen verifies fix -> Ward receives REPORT_UPDATED
            verify_res = await http_client.post(f"http://127.0.0.1:5000/api/reports/{ticket['id']}/verify", json={"action": "confirm"})
            assert verify_res.status_code == 200
            msg3 = json.loads(await ward_ws.recv())
            assert msg3['event'] == 'REPORT_UPDATED' and msg3['data']['status'] == 'verified'
            print(f"[LIVE SERVER VERIFIED] Citizen -> Ward: Ward received REPORT_UPDATED (Status: {msg3['data']['status']})")

    print("[SUCCESS] Live running server verification passed 100%!")

if __name__ == "__main__":
    asyncio.run(test_live())
