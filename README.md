# Sahayata — Mumbai Civic Tech Redressal & Intelligence Platform

Sahayata is an AI-powered civic grievance reporting, anti-deadlock SLA routing, and municipal intelligence platform tailored for the **Brihanmumbai Municipal Corporation (BMC)** and the citizens of Mumbai.

---

## Key Capabilities

### 1. Live Citizen Grievance Portal
- **AI Vision Classification**: Instant categorization of road potholes, garbage heaps, broken streetlights, water leaks, and open drains using Groq Llama 3.3 Vision.
- **Micro-Proximity Duplicate Interception**: Haversine distance (< 50m) and perceptual image hashing (pHash) intercept duplicate grievances at submission time, converting redundant tickets into community endorsements.
- **Anti-Deadlock SLA Engine**: Automated prioritization scoring that dynamically accounts for school/hospital critical zones, high-density bus routes, and overdue SLAs.
- **6-Stage Lifecycle Tracking**: From Citizen Report → Clustered → Prioritized → Contractor Assigned → Physical Fix Upload → Citizen Community Verification.

### 2. BMC Historical Grievance Intelligence Layer (2018–2024)
- **960,000 Real BMC Records**: Fully integrated indexed database across all 24 administrative municipal wards (A to T).
- **35-Field Deep Audit**: Temporal, demographic, contractor quality, infrastructure age, and citizen satisfaction outcome analysis.
- **Sub-50ms Indexed Query Engine**: High-performance SQLite engine querying 960k records in ~20ms.
- **Geographic Ward Aggregations**: Interactive 24-ward choropleth bubbles integrated directly into the civic Leaflet map without fabricating artificial GPS coordinates.

---

## Documentation

- [`BMC_HISTORICAL_DATASET.md`](file:///c:/Users/vagha/OneDrive/Desktop/Sahayata/BMC_HISTORICAL_DATASET.md) — Comprehensive documentation of the 960,000-record BMC dataset, schema, normalization layer, API routes, and architecture.
- [`CREDENTIALS.md`](file:///c:/Users/vagha/OneDrive/Desktop/Sahayata/CREDENTIALS.md) — Pre-configured accounts for Citizen, Ward Engineer, and MLA testing.

---

## Running the Project

### 1. Start the Backend API Server
```bash
cd Backend
node server.js
```
Runs on `http://localhost:5000`.

### 2. Start the Frontend Application
```bash
cd Frontend
npm run dev
```
Accessible at `http://localhost:5173`.

### 3. Run Automated Verification Suite
```bash
cd Backend
node scripts/verify_integration.js
```
Runs the 35-test automated end-to-end integration and regression test suite.
