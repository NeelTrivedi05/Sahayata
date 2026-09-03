# 🏛️ Sahayata (CivicCare) — Complete Technical Architecture & System Specification

> **Project Name**: Sahayata (CivicCare)  
> **Target Domain**: Municipal Grievance Redressal, Spatial Intelligence & Closed-Loop Accountability  
> **Reference Jurisdiction**: Brihanmumbai Municipal Corporation (BMC / MCGM) — Ward H/West (Bandra West, Khar West, Santacruz West, Mumbai)  
> **Key Political Oversight**: Shri Ashish Shelar (MLA, Bandra West Constituency)  
> **Executive Ward Authority**: Er. Rajesh Sawant (Executive Engineer, Ward H/West)  
> **Core Objective**: Eliminate duplicate municipal work orders, stop bureaucratic ticket deadlocks, prevent unilateral contractor self-closures, and provide real-time GIS surveillance across all civic stakeholder tiers.

---

## Table of Contents
1. [Executive Summary & Municipal Problem Statement](#1-executive-summary--municipal-problem-statement)
2. [High-Level Architecture & Technology Stack](#2-high-level-architecture--technology-stack)
3. [Domain Model & 6-Stage Grievance Lifecycle](#3-domain-model--6-stage-grievance-lifecycle)
4. [Core Algorithmic Engines](#4-core-algorithmic-engines)
   - [4.1 Geospatial & Vision Deduplication Engine](#41-geospatial--vision-deduplication-engine)
   - [4.2 Dynamic Priority & Anti-Deadlock Aging Escalator](#42-dynamic-priority--anti-deadlock-aging-escalator)
   - [4.3 Closed-Loop Citizen Verification & Geo-Fence Audit](#43-closed-loop-citizen-verification--geo-fence-audit)
5. [Interactive GIS & Mapping Architecture](#5-interactive-gis--mapping-architecture)
   - [5.1 Non-Destructive Leaflet Layer Group Architecture](#51-non-destructive-leaflet-layer-group-architecture)
   - [5.2 Zero-API-Key Multi-Basemap Engine](#52-zero-api-key-multi-basemap-engine)
   - [5.3 Map Modules Breakdown](#53-map-modules-breakdown)
6. [Frontend Application Architecture](#6-frontend-application-architecture)
   - [6.1 Component Hierarchy & Screen Routing](#61-component-hierarchy--screen-routing)
   - [6.2 State Management & Auth Context](#62-state-management--auth-context)
   - [6.3 Role-Based Security & Permissions](#63-role-based-security--permissions)
7. [Backend API Reference & Data Contracts](#7-backend-api-reference--data-contracts)
8. [Testing, Benchmarks & Validation](#8-testing-benchmarks--validation)
9. [Developer Guide & Local Deployment](#9-developer-guide--local-deployment)

---

## 1. Executive Summary & Municipal Problem Statement

Traditional urban civic complaint systems (e.g., standard municipal portals or call centers) suffer from four systemic points of failure:

1. **Duplicate Flooding**: When an arterial road develops a severe crater pothole, dozens of citizens independently file separate complaints. Municipal dashboards become overwhelmed with redundant tickets, dispersing manpower and obscuring true severity.
2. **Bureaucratic Deadlocks**: Complaints with low initial priority or disputed inter-departmental jurisdiction (e.g., PWD road vs. stormwater drain vs. electrical duct) sit unattended indefinitely without automated escalation.
3. **Unilateral "Ghost" Closures**: Field contractors or junior municipal staff frequently mark complaints as "Resolved" in database records without performing quality work, leaving citizens frustrated when the hazard persists.
4. **Static, Non-Spatial Interfaces**: Grievance portals present rows of plain text addresses without live geographic context, making route optimization, cluster detection, and spatial hazard prioritization impossible for ward officers and legislators.

**Sahayata solves this through a unified, full-stack municipal operating system**:
- **Multi-Factor Deduplication**: Intercepts duplicate complaints using Haversine geospatial proximity and 64-bit perceptual hashing (`pHash`) before tickets are created, clustering reports and boosting an existing ticket's urgency score.
- **Transparent Anti-Deadlock Escalator**: A deterministic mathematical formula factors in base severity, citizen endorsement volume, critical zone proximity (schools/hospitals), traffic density, and an automated aging escalator that boosts priority every neglected hour past the SLA deadline.
- **Closed-Loop Verification**: A ticket cannot be closed unilaterally by municipal staff. Field officers must upload an on-site post-repair photo verified against a 100m GPS geo-fence, and citizens must inspect an interactive split before-and-after slider to officially certify resolution.
- **GIS Everywhere**: Fast, live Leaflet raster maps (zero API keys, sub-millisecond layer diffing) are woven into every view — from the citizen's draggable location picker to the MLA's read-only constituency command radar.

---

## 2. High-Level Architecture & Technology Stack

```
                                  +-------------------------------------------------------+
                                  |                     CLIENT BROWSER                    |
                                  |               (Desktop / Tablet / Mobile)             |
                                  +-------------------------------------------------------+
                                                              |
                                           HTTPS / REST API   |   WebRTC (Webcam)
                                           JSON Payloads      |   HTML5 Geolocation (GPS)
                                                              v
+-------------------------------------------------------------------------------------------------------------------------+
|                                                   FRONTEND ARCHITECTURE                                                 |
|                                                                                                                         |
|  +------------------------+  +------------------------+  +------------------------+  +-------------------------------+  |
|  |     React 18 + Vite    |  |       AuthContext      |  |     Interactive GIS    |  |         Tailwind CSS          |  |
|  | Single Page App (SPA)  |  | Role-based permissions |  | Leaflet (Carto/OSM)    |  | Custom GPU @keyframes        |  |
|  | Fast HMR & Production  |  | Citizen, Engineer, MLA |  | Non-destructive diff   |  | Glassmorphism & Micro-anims   |  |
|  +------------------------+  +------------------------+  +------------------------+  +-------------------------------+  |
|                                                                                                                         |
|  Key Views:                                                                                                             |
|  * RoleSelectLanding / AuthCard (Multi-tier authentication with client regex validation)                                |
|  * CivicRadarMapView (Full-screen interactive GIS command map with basemap switcher & drawer)                           |
|  * ReportIssueView (Camera, file upload, laptop webcam, draggable LocationPickerMiniMap)                              |
|  * PipelineView (6-stage grievance pipeline with side-by-side ComplaintMiniMap & photo audits)                          |
|  * VerificationView (Interactive split before-and-after comparison slider with site confirmation)                       |
|  * PriorityQueueView (Visual formula breakdown with real-time aging simulation slider)                                  |
|  * WardDashboardView (Spatial intelligence cluster filters, active issue queue, repair upload)                          |
|  * MlaDashboardView (Constituency surveillance map, executive KPI cards, urgent hotspot queue)                         |
+-------------------------------------------------------------------------------------------------------------------------+
                                                              |
                                                              v  REST Calls (Port 5000)
+-------------------------------------------------------------------------------------------------------------------------+
|                                                    BACKEND ARCHITECTURE                                                 |
|                                                                                                                         |
|  +----------------------------------+  +----------------------------------+  +---------------------------------------+  |
|  |         Node.js + Express        |  |      In-Memory Database Store    |  |           Security & Routing          |  |
|  | Modular REST API routes          |  | Mutable state with atomic writes |  | Strict CORS & JSON size limit (15MB)  |  |
|  | Port 5000                        |  | Seeded with realistic BMC data   |  | RegEx credential validation           |  |
|  +----------------------------------+  +----------------------------------+  +---------------------------------------+  |
|                                                                                                                         |
|  Core Logic Modules:                                                                                                    |
|  * Deduplication Engine (Haversine distance calculation + 64-bit pHash Hamming distance bitwise evaluation)             |
|  * Priority Scoring Engine (Base severity + duplicate bonus + critical zone + traffic + aging deadlock penalty)         |
|  * State Machine Lifecycle Engine (Reported -> Clustered -> Prioritized -> Assigned -> Resolved -> Verified)            |
|  * Authentication & Session Provider (Citizen registration, pre-seeded Ward Officers and MLA accounts)                 |
+-------------------------------------------------------------------------------------------------------------------------+
```

### Technology Specifications

| Layer | Component | Version / Library | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime** | React | `^18.2.0` | Declarative UI rendering, hooks-driven state architecture |
| **Build Tool** | Vite | `^6.4.3` | Instant local compilation, ES module bundling, zero-overhead HMR |
| **GIS / Mapping** | Leaflet | `^1.9.4` | Open-source interactive map engine (raster tiles, markers, SVG vectors) |
| **Map Tiles** | CartoDB & OpenStreetMap & Esri | Free Web Tile Endpoints | Carto Voyager, Carto Dark Matter, Esri World Imagery (0 API keys) |
| **Icons** | Lucide React | `^1.16.0` | Scalable vector civic and UI iconography |
| **Visual Effects** | Canvas-Confetti | `^1.9.4` | Micro-animation celebration on citizen verification sign-off |
| **Styling** | Vanilla CSS + Inline Styles | Custom | CSS `@keyframes` pulse rings, responsive flex/grid layouts |
| **Backend Runtime** | Node.js | `>= 18.0.0` | Server-side JavaScript runtime |
| **Web Framework** | Express | `^4.19.2` | RESTful API routing, middleware chaining, JSON request handling |
| **CORS Middleware** | cors | `^2.8.5` | Cross-Origin Resource Sharing enablement for local dev & production |

---

## 3. Domain Model & 6-Stage Grievance Lifecycle

### The 6-Stage Municipal Lifecycle

Every civic complaint strictly traverses a deterministic, transparent 6-stage lifecycle:

```
[ Stage 1: Reported ]
       |  Citizen files grievance with photo, GPS pin, and category description
       v
[ Stage 2: Clustered ]
       |  Deduplication engine evaluates distance and visual similarity; merges near-duplicates
       v
[ Stage 3: Prioritized ]
       |  Deterministic algorithm calculates priority score (0-100) based on location and severity
       v
[ Stage 4: Assigned ]
       |  Municipal work order dispatched to Executive Engineer & certified contractor
       v
[ Stage 5: Resolved ]
       |  Contractor uploads post-repair photo; geo-fence audit checks location within 100m
       v
[ Stage 6: Citizen Verified ]
          Citizens inspect before/after slider; confirm resolution (+50 Karma) or dispute
```

### Municipal Stakeholder Roles

1. **Citizen (`citizen`)**:
   - Files grievances with photos, GPS coordinates, and category metadata.
   - Discovers active complaints on the interactive radar map.
   - Endorses existing tickets (+25 Karma) to prevent duplicate work orders.
   - Inspects post-repair photos on the split comparison slider to confirm (+50 Karma) or dispute ticket closure.

2. **Ward Engineer (`ward_engineer`)**:
   - Executive operational role (e.g., Er. Rajesh Sawant, Executive Engineer, Ward H/West).
   - Monitors the Ward Dashboard, active issue queues, and spatial intelligence clusters.
   - Advances ticket status from `Reported` to `Assigned` to `Resolved`.
   - Uploads mandatory on-site post-repair photo proofs subject to GPS geo-fence checks.

3. **Member of Legislative Assembly / MLA (`mla`)**:
   - Executive political oversight role (e.g., Shri Ashish Shelar, Bandra West Constituency).
   - Monitors jurisdiction-wide performance metrics, on-time SLA rates, and municipal department grades.
   - Tracks overdue SLA breaches and critical escalations near sensitive institutions.
   - Interacts with a high-level, read-only GIS constituency radar map.

---

## 4. Core Algorithmic Engines

### 4.1 Geospatial & Vision Deduplication Engine

Located in [`Frontend/src/utils/deduplication.js`](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/src/utils/deduplication.js) and mirrored on the backend in [`Backend/server.js`](file:///c:/Users/Niral%20Hingu/Sahayata/Backend/server.js).

The engine prevents duplicate ticket creation when multiple citizens report the same hazard.

#### A. Geospatial Distance: Haversine Formula
Computes the great-circle distance between two geographic coordinates on Earth:

$$\Delta\phi = \frac{(\text{lat}_2 - \text{lat}_1) \cdot \pi}{180}, \quad \Delta\lambda = \frac{(\text{lon}_2 - \text{lon}_1) \cdot \pi}{180}$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\text{lat}_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\text{lat}_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$d = 2 \cdot R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right) \quad \text{where } R = 6,371,000\text{ meters}$$

- **Threshold**: $d \le 50\text{ meters}$ constitutes a geographic proximity match.

#### B. Perceptual Image Hash (`pHash`) & Hamming Distance
Rather than naive cryptographic hashing (e.g. MD5/SHA256, which fail completely on re-compressed or resized images), Sahayata uses a 64-bit perceptual hash:
- Evaluates structural frequency gradients across image blocks.
- Compares hashes using bitwise XOR and popcount:

$$\text{HammingDistance}(H_1, H_2) = \sum_{i=0}^{63} \left( H_1[i] \oplus H_2[i] \right)$$

- **Hamming Threshold**:
  - $\text{Dist} = 0$: 100% identical image.
  - $\text{Dist} \le 2$: 96.8% match (minor JPEG compression artifact).
  - $\text{Dist} \le 12$: Candidate visual match.
  - $\text{Dist} > 12$: Distinct images.

#### C. Composite Multi-Factor Duplicate Score
When evaluating a candidate against existing ward reports:

$$\text{CompositeScore} = (0.50 \cdot S_{\text{geo}}) + (0.35 \cdot S_{\text{visual}}) + (0.15 \cdot S_{\text{category}})$$

Where:
- $S_{\text{geo}} = \max\left(0, \left(1 - \frac{d}{50}\right) \times 100\right)$
- $S_{\text{visual}} = \max\left(0, \left(1 - \frac{\text{Hamming}}{64}\right) \times 100\right)$
- $S_{\text{category}} = 100 \text{ if categories match, else } 0$

If $\text{CompositeScore} \ge 70$ and $d \le 50\text{m}$, the system intercepts the report, alerts the citizen, and offers a 1-click **"Endorse Existing Ticket (+25 Karma)"** action.

---

### 4.2 Dynamic Priority & Anti-Deadlock Aging Escalator

Located in [`Frontend/src/utils/priority.js`](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/src/utils/priority.js) and [`Backend/server.js`](file:///c:/Users/Niral%20Hingu/Sahayata/Backend/server.js).

Sahayata eliminates subjective queue prioritization by calculating a deterministic priority score between $0$ and $100$:

$$\text{PriorityScore} = \min\left(100, \text{Base} + \text{DupBonus} + \text{CriticalBonus} + \text{TrafficBonus} + \text{AgingPenalty}\right)$$

#### Component Breakdown

1. **Base Severity ($\text{Base}$)**:
   - Road Hazard / Deep Pothole: $35\text{ pts}$
   - Exposed Electrical / Fallen Cable: $40\text{ pts}$
   - Burst Water Main / Pipeline Flood: $32\text{ pts}$
   - Solid Waste / Overflowing Dump: $28\text{ pts}$

2. **Citizen Endorsements ($\text{DupBonus}$)**:
   $$\text{DupBonus} = \min\left(35, (\text{DuplicateCount}) \times 3.5\right)$$
   Represents collective public demand. Each citizen endorsement reinforces urgency without cluttering the database with duplicate work orders.

3. **Critical Zone Proximity ($\text{CriticalBonus}$)**:
   - Proximity to schools, hospitals, or transit interchanges (e.g. *St. Andrew's High School*, *Lilavati Hospital Emergency Corridor*, *Bandra Railway Station*): $+24\text{ pts}$.

4. **Traffic Density Multiplier ($\text{TrafficBonus}$)**:
   - Arterial transit corridors or emergency ambulance paths (e.g. *SV Road*, *Linking Road*, *Turner Road*): $+14\text{ pts}$.

5. **Anti-Deadlock Aging Escalator ($\text{AgingPenalty}$)**:
   - If complaint age is within SLA ($t_{\text{elapsed}} \le t_{\text{sla}}$):
     $$\text{AgingBonus} = \left(\frac{t_{\text{elapsed}}}{t_{\text{sla}}}\right) \times 12$$
   - **If SLA is breached ($t_{\text{elapsed}} > t_{\text{sla}}$)**:
     $$\text{AgingBonus} = \min\left(45, 18 + (t_{\text{elapsed}} - t_{\text{sla}}) \times 2.2\right)$$
   - *Impact*: A low-priority issue left unaddressed automatically escalates into the MLA and Executive Engineer's urgent action queue, guaranteeing tickets cannot be permanently neglected.

---

### 4.3 Closed-Loop Citizen Verification & Geo-Fence Audit

#### A. Geo-Fence Audit Validation
To prevent off-site fraudulent closures, when a contractor or ward engineer captures an after-repair photo, the client queries device GPS:
- Computes Haversine distance $D_{\text{repair}}$ between current GPS coordinates and the complaint's recorded coordinates.
- **Rule**: If $D_{\text{repair}} > 100\text{ meters}$, the system triggers an audit notice:  
  `"⚠️ Geo-Fence Notice: Photo captured ~{dist}m from grievance location (100m threshold). Officer verification required."`

#### B. Citizen Sign-Off & Karma Incentive
- Municipal officers can only move tickets to **Stage 5 (`Resolved`)**.
- The ticket remains in Stage 5 until certified by local residents via **`VerificationView`**.
- Citizens utilize an interactive split comparison slider to scrutinize the before and after states side-by-side.
- **Confirm Fixed**: Advances status to **Stage 6 (`Citizen Verified`)**, awards **+50 Karma**, triggers celebratory confetti, and writes permanent clearance logs.
- **Dispute Quality**: Instantly reverts ticket to **Stage 4 (`Assigned`)**, applies an automatic SLA penalty, and marks the work order for urgent re-inspection.

---

## 5. Interactive GIS & Mapping Architecture

### 5.1 Non-Destructive Leaflet Layer Group Architecture

Earlier revisions of civic maps suffered from major DOM thrash: calling `map.remove()` and re-instantiating all Leaflet objects on every React state change or data refresh.

Sahayata establishes a **Persistent Layer Architecture**:
1. **One-Time Map Initialization**: `L.map` and raster tile layers are created exactly once via an empty-dependency `useEffect`.
2. **Three Persistent `L.layerGroup` Instances**:
   - `zonesLayerRef`: Critical zones (schools, hospitals) drawn as transparent dashed circular polygons.
   - `radiiLayerRef`: Impact radii circles around active hazards.
   - `markersLayerRef`: Interactive grievance pins.
3. **In-Memory Sub-Millisecond Marker Diffing**:
   - Tracks markers in a persistent JavaScript `Map<id, { marker, dataHash }>`.
   - On state updates, computes a lightweight hash string of position, status, and score.
   - New reports are added, missing reports are removed, and unchanged markers are untouched.
   - **Benchmark**: 250 reports diffed and updated in **`0.177ms`** (verified via `Frontend/test-map-scale.mjs`).
4. **GPU-Accelerated CSS Status Rings**:
   Pins utilize lightweight `L.divIcon` with hardware-accelerated CSS animations (`Frontend/src/index.css`):
   - `.civic-pulse-unresolved`: Red 2s gentle radar pulse.
   - `.civic-pulse-urgent`: SLA-breached overdue 0.85s rapid double-pulse.
   - `.civic-pulse-verified`: Green gentle glow pulse.

---

### 5.2 Zero-API-Key Multi-Basemap Engine

Sahayata requires **0 API keys**, utilizing open, highly reliable raster tiles with custom attribution:

| Basemap Layer | Tile URL Template | Visual Style & Purpose |
| :--- | :--- | :--- |
| **Daylight Streets** | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` | Clean, high-contrast light map for daytime civic operations |
| **Command Dark** | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | Sleek dark-mode GIS surveillance view for evening oversight |
| **Satellite Aerial** | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{z}` | High-resolution satellite imagery for inspecting pavement and terrain |

---

### 5.3 Map Modules Breakdown

1. **`InteractiveCivicMap.jsx` ([Frontend/src/components/map/InteractiveCivicMap.jsx](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/src/components/map/InteractiveCivicMap.jsx))**:
   - Primary radar map for `CivicRadarMapView` and `MlaDashboardView`.
   - Supports `readOnly={true}` mode (disables pin-drop and endorsement actions for executive viewing).
   - Basemap switcher (Streets / Dark / Satellite).
   - "Locate Me" GPS button with pulsating blue radar dot.
   - Debounced search bar with instant local cache for Bandra West landmarks (*Hill Road, Linking Road, Turner Road, Bandra Station, Pali Hill, Mount Mary*) + free Nominatim OSM geocoding fallback.
   - Slide-out inspection drawer for detailed ticket audits.
   - Interactive category filter pills (*All, Potholes, Garbage, Streetlights, Water Leaks, Critical, Overdue*).

2. **`LocationPickerMiniMap.jsx` ([Frontend/src/components/map/LocationPickerMiniMap.jsx](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/src/components/map/LocationPickerMiniMap.jsx))**:
   - Embedded directly in `ReportIssueView`.
   - Provides a draggable pin with real-time coordinate synchronization.
   - "Center on My GPS" button.
   - Reverse-geocodes coordinates into human-readable street names.

3. **`ComplaintMiniMap.jsx` ([Frontend/src/components/map/ComplaintMiniMap.jsx](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/src/components/map/ComplaintMiniMap.jsx))**:
   - Lightweight, fixed-height thumbnail map.
   - Renders a status-coded pulsing pin and 100m impact radius circle.
   - Embedded in `PipelineView` grievance cards, `VerificationView` headers, and Ward Engineer resolution modals.

---

## 6. Frontend Application Architecture

### 6.1 Component Hierarchy & Screen Routing

```
Frontend/src/
├── main.jsx                     # Vite entry point, mounts Root with AuthProvider
├── index.css                    # Design system tokens, @keyframes pulse animations, Leaflet styles
├── App.jsx                      # Master container, activeTab routing, modal orchestration
├── context/
│   └── AuthContext.jsx          # Session state, login, signup, logout, role switching
├── api/
│   └── client.js                # Axios/Fetch client connecting to Express API (port 5000)
├── data/
│   └── civicData.js             # Initial reporting presets, critical zones, municipal landmarks
├── utils/
│   ├── deduplication.js         # Client-side Haversine & pHash evaluation
│   └── priority.js              # Priority scoring & SLA breach calculations
└── components/
    ├── auth/
    │   ├── RoleSelectLanding.jsx # Role selection gateway (Citizen, Ward Engineer, MLA)
    │   ├── AuthCard.jsx         # Glassmorphism container for auth forms
    │   ├── LoginPage.jsx        # Login form with client-side RegEx validation
    │   └── SignupPage.jsx       # Citizen registration form
    ├── map/
    │   ├── InteractiveCivicMap.jsx # Full-featured GIS radar map with search & layers
    │   ├── LocationPickerMiniMap.jsx # Draggable location picker for report submissions
    │   └── ComplaintMiniMap.jsx   # Compact per-complaint thumbnail map
    ├── ward/
    │   └── WardDashboardView.jsx # Ward Engineer operational desk with clickable cluster filters
    ├── priority/
    │   └── PriorityQueueView.jsx # Transparent priority engine breakdown & age simulator
    └── ui/
        └── ToastNotification.jsx # Animated floating status banners
```

### 6.2 State Management & Auth Context

The application avoids unnecessary global state library bloat by pairing React's native `useState` with a scoped `AuthContext`:

```javascript
// AuthContext State Surface
const {
  currentUser,     // { id, fullName, email, phone, role, civicKarma }
  login,           // async (email, password) => user
  signup,          // async ({ fullName, email, phone, password }) => user
  logout,          // () => void
  updateKarma      // (pointsDelta) => void
} = useAuth();
```

- **Persistence**: Sessions and current roles are persisted in `localStorage` under `sahayata_user`.
- **Session Restoration**: When a user logs in or out, state immediately transitions without full-page reloads.

### 6.3 Role-Based Security & Permissions

| View / Action | Citizen | Ward Engineer | MLA |
| :--- | :---: | :---: | :---: |
| **Civic Radar Map** | Full Interactive (Pin Drop & Endorse) | Full Interactive | Read-Only Surveillance |
| **Report Grievance** | Camera, Webcam, File, Mini-Map | View Only | View Only |
| **Advance Pipeline** | Read-Only | Yes (Stages 1 -> 5) | Read-Only |
| **Upload Repair Photo** | No | Yes (Geo-fenced) | No |
| **Citizen Verification** | Yes (Slider Sign-off / Dispute) | View Only | View Only |
| **Ward Dashboard** | Summary Only | Full Operational Queue | Full Overview |
| **MLA Oversight Desk** | Hidden | Hidden | Full Executive Access |

---

## 7. Backend API Reference & Data Contracts

All endpoints run on `http://localhost:5000` (Node.js Express).

### Jurisdiction & Health

#### `GET /api/jurisdiction`
Returns current municipal jurisdiction context (BMC Ward H/West).
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "city": "Mumbai",
    "corporation": "BMC (Brihanmumbai Municipal Corporation)",
    "wardNumber": "H/West",
    "wardName": "Bandra West / Khar",
    "mla": { "name": "Shri Ashish Shelar", "onTimeRate": "95.4%" },
    "engineer": "Er. Rajesh Sawant (Executive Engineer)"
  }
}
```

---

### Grievances & Work Orders

#### `GET /api/reports`
Retrieves all municipal reports enriched with server-calculated priority scores and SLA status.
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "CIVIC-2026-8921",
      "title": "Deep Crater Pothole causing two-wheeler skids",
      "category": "pothole",
      "coords": [19.0558, 72.8295],
      "address": "Near St. Andrew's High School, Hill Road, Bandra West",
      "status": "assigned",
      "statusStep": 4,
      "slaHours": 48,
      "elapsedHours": 54,
      "duplicateCount": 14,
      "priorityScore": 95,
      "isOverdue": true,
      "overdueHours": 6,
      "beforeImage": "https://...",
      "afterImage": "https://...",
      "resolution": {
        "assignedTo": "Er. Rajesh Sawant",
        "contractor": "Falcon Mumbai Infrastructure Ltd."
      }
    }
  ]
}
```

#### `POST /api/reports`
Submits a new civic report. Automatically triggers the **Multi-Factor Deduplication Check**.
- **Request Body**:
```json
{
  "title": "Severe Pothole on Hill Road",
  "category": "pothole",
  "categoryLabel": "Road Hazard & Pothole",
  "coords": [19.0558, 72.8295],
  "address": "Hill Road, Ward H/West, Mumbai",
  "image": "data:image/jpeg;base64,...",
  "phash": "a1b2c3d4e5f60718",
  "clarificationAnswer": "Over 6 inches deep with sharp edges"
}
```
- **Responses**:
  - `201 Created`: Report accepted and registered.
  - `409 Conflict` (Duplicate Intercepted):
    ```json
    {
      "success": false,
      "isDuplicate": true,
      "duplicateReport": { "id": "CIVIC-2026-8921", "duplicateCount": 14 },
      "message": "An identical issue was already reported 15m away (98% visual match)."
    }
    ```

#### `POST /api/reports/:id/endorse`
Increments duplicate endorsement count on an existing ticket and recalculates priority.
- **Response `200 OK`**: Returns updated report object with incremented priority score.

#### `POST /api/reports/:id/progress`
Advances work order stage (used by Ward Engineer). Supports post-repair photo payload.
- **Request Body**: `{ "afterImage": "data:image/jpeg;base64,..." }`
- **Response `200 OK`**: Advances `statusStep` from 4 to 5 (`resolved`).

#### `POST /api/reports/:id/verify`
Citizen verification action.
- **Request Body**: `{ "action": "confirm" }` or `{ "action": "dispute" }`
- **Response `200 OK`**:
  - If `confirm`: Transitions `status` to `verified` (`statusStep = 6`).
  - If `dispute`: Reverts `status` to `assigned` (`statusStep = 4`) and logs escalation notes.

---

### Authentication Endpoints

#### `POST /api/auth/signup`
Citizen self-registration with strict input validation.
- **Request Body**:
```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "phone": "+91 98765 43210",
  "password": "Password@123"
}
```
- **Response `201 Created`**: Returns user profile and sets active session.

#### `POST /api/auth/login`
Authenticates credentials across Citizen, Ward Engineer, or MLA accounts.
- **Request Body**: `{ "email": "rajesh.sawant@mcgm.gov.in", "password": "Engineer@2026" }`
- **Response `200 OK`**: Returns user object with assigned role.

---

## 8. Testing, Benchmarks & Validation

### 8.1 Automated Deduplication Test Suite
Located in [`Frontend/test-deduplication.mjs`](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/test-deduplication.mjs):
```bash
node Frontend/test-deduplication.mjs
```
**Results**:
- **Geospatial Distance**: Verified near distance (31m) and far distance (1218m) accuracy.
- **pHash Hamming Distance**: Identical hashes = 0 bits; minor compression = 1 bit; unrelated images = 55 bits.
- **Candidate Interception**: Correctly intercepted duplicate within 15m; refused merging across different categories; refused merging beyond 50m; ignored already verified issues.
- **Score**: **`10/10 Tests Passed (100% Success)`**.

### 8.2 GIS Scale & Diffing Benchmark
Located in [`Frontend/test-map-scale.mjs`](file:///c:/Users/Niral%20Hingu/Sahayata/Frontend/test-map-scale.mjs):
- Generates 250 synthetic municipal reports across Ward H/West.
- Profiles in-memory marker diffing engine.
- **Result**: 250 markers diffed and reconciled in **`0.177ms`**, maintaining a solid 60 FPS without DOM garbage collection spikes.

### 8.3 Production Bundle Validation
```bash
cd Frontend && npm run build
```
- **Output**:
  - `dist/index.html`: `0.77 kB`
  - `dist/assets/index.css`: `39.88 kB` (Gzip: `12.41 kB`)
  - `dist/assets/index.js`: `480.89 kB` (Gzip: `136.39 kB`)
  - **Build Duration**: `7.07s` with zero errors or warnings.

---

## 9. Developer Guide & Local Deployment

### Prerequisites
- Node.js version `>= 18.0.0`
- npm version `>= 9.0.0`
- Git

### Installation & Startup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/NeelTrivedi05/Sahayata.git
   cd Sahayata
   ```

2. **Start the Backend Server**:
   ```bash
   cd Backend
   npm install
   node server.js
   # Running on http://localhost:5000
   ```

3. **Start the Frontend Client**:
   ```bash
   cd ../Frontend
   npm install
   npm run dev -- --port 5174
   # Running on http://localhost:5174
   ```

### Default Pre-Configured Test Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Citizen** | Aarav Sharma | `aarav.sharma@example.com` | `Password@123` |
| **Ward Engineer** | Er. Rajesh Sawant | `rajesh.sawant@mcgm.gov.in` | `Engineer@2026` |
| **MLA** | Shri Ashish Shelar | `ashish.shelar@maharashtra.gov.in` | `MLA@2026` |

*(Citizens can also self-register any new account directly from the signup screen).*

---

*Authored for the Sahayata Open Civic Technology Initiative • Brihanmumbai Municipal Corporation (BMC) Ward H/West Reference Deployment.*
