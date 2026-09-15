<div align="center">

<img src="Frontend/public/sahayata-logo.jpg" alt="Sahayata Logo" width="120" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

# Sahayata (CivicCare)
### **Civic Action, Resolved.**

**Municipal Grievance Redressal, Spatial Intelligence & Closed-Loop Accountability Platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_4-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-960k_Indexed-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS_1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

*Reference Jurisdiction: Brihanmumbai Municipal Corporation (BMC / MCGM) — 24 Administrative Wards (A through T), Mumbai*

</div>

---

## 📋 Table of Contents

- [Overview & Municipal Problem Statement](#-overview--municipal-problem-statement)
- [Key Innovations & Algorithmic Engines](#-key-innovations--algorithmic-engines)
  - [1. Multi-Factor Geospatial & Vision Deduplication](#1-multi-factor-geospatial--vision-deduplication)
  - [2. Anti-Deadlock Dynamic SLA Escalation Engine](#2-anti-deadlock-dynamic-sla-escalation-engine)
  - [3. Closed-Loop Citizen Verification & Geo-Fence Audit](#3-closed-loop-citizen-verification--geo-fence-audit)
  - [4. High-Performance Zero-API-Key GIS Radar](#4-high-performance-zero-api-key-gis-radar)
  - [5. BMC Historical Grievance Intelligence Layer (960,000 Records)](#5-bmc-historical-grievance-intelligence-layer-960000-records)
- [Three Stakeholder Portals (RBAC)](#-three-stakeholder-portals-rbac)
- [6-Stage Grievance Lifecycle Pipeline](#-6-stage-grievance-lifecycle-pipeline)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started & Installation](#-getting-started--installation)
  - [Prerequisites](#prerequisites)
  - [1. Frontend Setup (React + Vite)](#1-frontend-setup-react--vite)
  - [2. Node.js Express Backend Setup](#2-nodejs-express-backend-setup)
  - [3. Run Automated Verification Suite](#3-run-automated-verification-suite)
  - [4. Python FastAPI Vision Engine Setup](#4-python-fastapi-vision-engine-setup)
- [Documentation & Credentials](#-documentation--credentials)
- [Design System & Typography](#-design-system--typography)
- [Contributing & Development Guidelines](#-contributing--development-guidelines)
- [License](#-license)

---

## 🏛️ Overview & Municipal Problem Statement

Traditional urban civic complaint portals and call centers suffer from four systemic points of failure:

1. **Duplicate Flooding**: When an arterial road develops a crater pothole, dozens of citizens file separate complaints. Dashboards are overwhelmed with redundant tickets, dispersing manpower and obscuring true severity.
2. **Bureaucratic Deadlocks**: Complaints with low initial priority or disputed inter-departmental jurisdiction (e.g., PWD road vs. stormwater drain vs. electrical duct) sit unattended indefinitely without automated escalation.
3. **Unilateral "Ghost" Closures**: Field contractors or junior staff frequently mark complaints as "Resolved" in database records without performing quality work, leaving citizens frustrated when the hazard persists.
4. **Static, Non-Spatial Interfaces**: Portals present text tables without live geographic context, making route optimization, cluster detection, and spatial hazard prioritization impossible.

**Sahayata solves this through an end-to-end civic operating system**:
- **Multi-Factor Deduplication**: Clusters incoming reports using Haversine physical distance ($\le 50\text{m}$) and 64-bit perceptual image hashing (`dHash`/`pHash`) before duplicate work orders are issued.
- **Deterministic Anti-Deadlock Aging**: An automated mathematical scoring engine escalates priority points for every hour a ticket remains overdue.
- **Closed-Loop Verification**: A ticket cannot be closed unilaterally. Field engineers must submit photo proof validated against a 100m GPS geo-fence, and citizens must verify resolution using an interactive Before/After split comparison slider.
- **Live GIS Everywhere**: Sub-millisecond raster Leaflet mapping across all screens with zero third-party API keys required.
- **960,000-Record BMC Historical Archive**: Ingested and indexed across all 24 administrative municipal wards (A through T) with sub-20ms indexed queries.

---

## ⚡ Key Innovations & Algorithmic Engines

### 1. Multi-Factor Geospatial & Vision Deduplication
When a citizen snaps a photo of a hazard, Sahayata intercepts duplicate creation before dispatch:
- **Geographic Proximity**: Calculates spherical distance via Haversine formula against active complaints:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Perceptual Image Hashing**: Downsamples images to $8\times8$ grayscale gradients, computing 64-bit difference hashes (`dHash`). If Hamming distance $\le 10$ and distance $\le 50\text{m}$, the system identifies a duplicate match.
- **Community Endorsement**: Instead of generating duplicate tickets, the citizen's report automatically endorses the primary ticket, boosting its community urgency score and awarding Civic Karma to the contributor.

### 2. Anti-Deadlock Dynamic SLA Escalation Engine
Every ticket's priority score ($0-100$) is computed dynamically in real time:

$$\text{Priority Score} = \min\left(100, \, \text{Base} + \text{DupBonus} + \text{ZoneBonus} + \text{TrafficBonus} + \text{AgingEscalator}\right)$$

| Parameter | Weight / Formula | Description |
|---|---|---|
| **Base Severity** | $20 - 40\text{ pts}$ | Initial category hazard rating (Pothole = 35, Wire = 40, Garbage = 20) |
| **Citizen Endorsements** | $\min(20, \, (\text{Count} - 1) \times 5)$ | Up to $+20\text{ pts}$ based on citizen endorsements in the cluster |
| **Critical Zone Proximity** | $+15\text{ to }+20\text{ pts}$ | Proximity to schools, hospitals, or transit nodes (Lilavati Hospital, National College) |
| **Traffic Density** | $+5\text{ to }+10\text{ pts}$ | Arterial road corridor weighting (Linking Road, Carter Road, S.V. Road) |
| **Anti-Deadlock Aging** | $+2\text{ pts / hour overdue}$ | **Automatic anti-deadlock escalator** past 48h SLA deadline |

### 3. Closed-Loop Citizen Verification & Geo-Fence Audit
Municipal work orders cannot be resolved by administrative decree:
1. **Field Proof Capture**: Ward engineers must upload an on-site resolution photo.
2. **100m Geo-Fence Audit**: Browser/device HTML5 GPS coordinates are compared against the original ticket coordinates. If deviation exceeds $100\text{m}$, an audit alert is flagged.
3. **Interactive Split-Slider**: Citizens receive a split Before/After comparison slider to visually inspect bitumen filling, trench patching, or debris clearance.
4. **Confirm or Dispute**: The citizen officially marks the ticket `Verified Fixed` (releasing full contractor credit) or `Disputed` (reopening the work order with high-priority escalation).

### 4. High-Performance Zero-API-Key GIS Radar
- Uses persistent Leaflet layer groups with zero map flashing on filter/search changes.
- Multi-basemap selector:
  - 🗺️ **Daylight Streets** (OpenStreetMap Raster Cartography)
  - 🌙 **Command Dark** (CartoDB Dark Matter)
  - 🛰️ **Satellite Aerial** (Esri World Imagery High-Resolution)
- Interactive 100m impact radius circles, live incident markers with severity badges, and instant hot-spot jumping.

### 5. BMC Historical Grievance Intelligence Layer (960,000 Records)
- **Real BMC Historical Dataset (2018–2024)**: Ingested 960,000 real municipal complaint records across all 24 administrative municipal wards (A to T).
- **Sub-20ms Query Latency**: Powered by a 407 MB SQLite database (`Backend/data/bmc_historical.db`) with 9 B-Tree indexes and a precomputed summary snapshot (`Backend/data/bmc_summary.json`).
- **35-Field Deep Audit**: Explores temporal patterns, demographic densities, contractor work quality, material costs, and citizen satisfaction ratings.
- **Geographic Ward Aggregates**: Interactive Leaflet ward aggregate bubble layer rendering complaint volumes, SLA averages, and satisfaction rates using official Mumbai ward centroids without polluting maps with 960k individual point markers.

---

## 👥 Three Stakeholder Portals (RBAC)

Sahayata enforces strict Role-Based Access Control across three distinct user roles:

```
                          ┌─────────────────────────────┐
                          │   Role Select Landing Page  │
                          └──────────────┬──────────────┘
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
     ┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
     │    CITIZEN PORTAL     │ │ WARD ENGINEER DESK│ │  MLA OVERSIGHT RADAR  │
     ├───────────────────────┤ ├───────────────────┤ ├───────────────────────┤
     │ • One-Click Camera    │ │ • Live Priority Q │ │ • Constituency Radar  │
     │ • AI Issue Classifier │ │ • SLA Timers (48h)│ │ • Hotspot Clusters    │
     │ • Duplicate Alert     │ │ • Geo-Fence Audit │ │ • Direct Escalation   │
     │ • Civic Karma Points  │ │ • Material Dispatch│ │ • Contractor Audits   │
     │ • Split-Slider Verify │ │ • Field Resolution│ │ • SLA Breach Alerts   │
     │ • BMC 960k Intel Tab  │ │ • BMC 960k Intel  │ │ • BMC 960k Intel      │
     └───────────────────────┘ └───────────────────┘ └───────────────────────┘
```

---

## 🔄 6-Stage Grievance Lifecycle Pipeline

Every ticket traverses a transparent, accountable six-stage lifecycle:

```
[Stage 1: Intake] ──> [Stage 2: Clustered] ──> [Stage 3: Prioritized]
  Citizen Report        Duplicate Match           Dynamic Scoring
  AI Category           Geo-Fence Check           SLA Timer Starts
        │                     │                         │
        ▼                     ▼                         ▼
[Stage 4: Dispatched] ─> [Stage 5: Proof Upload] ─> [Stage 6: Verified]
  Ward Engineer           Field Photo Upload        Citizen Slider Verify
  Contractor Assigned     Geo-Audit Validated       Closed & Karma Awarded
```

---

## 🛠️ System Architecture & Tech Stack

| Layer | Technologies | Role & Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS v4, Lucide React | SPA UI, camera capture, split-slider verification |
| **Mapping / GIS** | Leaflet 1.9, CartoDB, OpenStreetMap, Esri | Zero-API-key mapping, ward aggregate layers |
| **Primary Backend** | Node.js, Express.js 4, SQLite, `ws` (WebSockets) | REST API, JSON store, 960k-record SQLite engine |
| **Historical Data** | SQLite 3, Python 3, Pandas/CSV streaming | 960,000 complaints, 9 B-Tree indexes, <20ms queries |
| **Vision & AI** | Groq Llama 3.3 Vision, Python OpenCV, ImageHash | Multimodal image classification, 64-bit dHash |

---

## 📁 Repository Structure

```
Sahayata/
├── BMC_HISTORICAL_DATASET.md      # Comprehensive documentation for 960k BMC dataset
├── CREDENTIALS.md                 # Role-based test login credentials
├── README.md                      # Primary project documentation
│
├── Frontend/                      # React + Vite Client Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # AuthCard, RoleSelectLanding, Signup/Login forms
│   │   │   ├── common/            # WebcamCaptureModal & reusable UI controls
│   │   │   ├── historical/        # HistoricalBmcView (5 sub-tabs, 35-field drawer)
│   │   │   ├── map/               # InteractiveCivicMap, MiniMaps, Ward overlays
│   │   │   ├── priority/          # PriorityQueueView & dynamic score inspection
│   │   │   └── ward/              # WardDashboardView & municipal engineering desk
│   │   ├── data/
│   │   │   └── civicData.js       # Geographic boundaries, hotspots & presets
│   │   └── utils/
│   │       ├── deduplication.js   # Client-side Haversine clustering algorithms
│   │       └── validators.js      # Form validation rules & test suites
│   └── package.json
│
└── Backend/                       # Backend Services
    ├── server.js                  # Express.js REST API & 8 BMC Historical endpoints
    ├── bmcHistoricalService.js    # SQLite query engine for 960,000 records
    ├── scripts/
    │   ├── import_bmc_data.py     # Streaming batch importer (960k rows in 103s)
    │   ├── generate_bmc_summary.py# Analytical pre-computation engine
    │   └── verify_integration.js  # 35-test automated verification suite
    ├── data/
    │   ├── bmc_data_dictionary.csv# Official BMC 35-column metadata definition
    │   ├── bmc_summary.json       # Precomputed macro analytics snapshot (52 KB)
    │   ├── reports.json           # Live grievance tickets datastore
    │   └── users.json             # Seed user accounts & role profiles
    └── package.json
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher
- **Git**: For version control

---

### 1. Frontend Setup (React + Vite)

```bash
# Navigate to the frontend directory
cd Frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at: **`http://localhost:5173`**

To verify a production build:
```bash
npm run build
```

---

### 2. Node.js Express Backend Setup

```bash
# Open a new terminal and navigate to the backend directory
cd Backend

# Install Node dependencies
npm install

# Start the Express server
node server.js
```

The Express API will run on: **`http://localhost:5000`**

---

### 3. Run Automated Verification Suite

Validate end-to-end integration, API contracts, source separation, and query latency:
```bash
cd Backend
node scripts/verify_integration.js
```
*Expected: 35 / 35 tests passed (100%).*

---

### 4. Python FastAPI Vision Engine Setup (Optional)

```bash
cd Backend
pip install -r requirements.txt
python main.py
```
Runs the optional auxiliary OpenCV/FastAPI image deduplication engine on `http://localhost:8000`.

---

## 📖 Documentation & Credentials

- **[`BMC_HISTORICAL_DATASET.md`](BMC_HISTORICAL_DATASET.md)**: Full 35-field data dictionary, SQLite database schema, normalization architecture, and analytical queries.
- **[`CREDENTIALS.md`](CREDENTIALS.md)**: Authenticated credentials for Citizen, Ward Engineer, and MLA testing.

---

## 🎨 Design System & Typography

### 1. Typography Tokens
```css
:root {
  --font-display: 'Space Grotesk', -apple-system, sans-serif;
  --font-sans: 'IBM Plex Sans', -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```
- **Display (`Space Grotesk`)**: Brand wordmarks, page headings (`h1`–`h3`), stat counters, and navigation tabs.
- **Body (`IBM Plex Sans`)**: Form controls, descriptions, tables, and modal dialog copy.
- **Data & Metadata (`IBM Plex Mono`)**: Ticket IDs, SLA countdown timers, GPS coordinates, and technical badges.

### 2. Zero-Emoji Standard
All raw font emojis have been eliminated from the UI in favor of crisply aligned **Lucide React SVG icons** (`<AlertTriangle />`, `<MapPin />`, `<Clock />`, `<Check />`, `<Database />`, `<Bell />`), ensuring uniform cross-platform rendering across Windows, macOS, Android, and iOS.

---

## 🤝 Contributing & Development Guidelines

1. **Strict UI Non-Destruction**: Do not modify existing flex/grid containers, responsive breakpoints, or component hierarchies without architectural review.
2. **State & Backend Preservation**: Maintain backwards-compatible API contracts across both Express and SQLite services.
3. **Typography Compliance**: Always apply `var(--font-mono)` for technical identifiers/timestamps and `var(--font-display)` for titles and major metrics.
4. **SVG Icons Only**: Never introduce raw font emojis into user-facing copy or UI components.
5. **Validation**: Always run `npm run build` in `Frontend/` and `node Backend/scripts/verify_integration.js` before submitting pull requests.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Sahayata — Civic Action, Resolved.**  
*Built for the citizens, engineers, and public representatives of Mumbai.*

</div>
