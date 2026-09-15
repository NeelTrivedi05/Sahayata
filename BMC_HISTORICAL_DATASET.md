# Brihanmumbai Municipal Corporation (BMC) Historical Grievance Intelligence Layer

This document describes the integration of the real 2018–2024 historical complaint dataset from the **Brihanmumbai Municipal Corporation (BMC)** into the **Sahayata** civic tech application.

---

## 1. Dataset Overview

- **Dataset Name**: BMC Historical Grievance Redressal Dataset (2018–2024)
- **Source**: Municipal Corporation of Greater Mumbai (Brihanmumbai Municipal Corporation / BMC)
- **Dataset Files**:
  - `Backend/data/bmc_train.csv` (226 MB, 960,000 records, 35 columns) — *Immutable source*
  - `Backend/data/bmc_data_dictionary.csv` (35 documented fields)
- **Temporal Coverage**: January 1, 2018 to December 31, 2024 (~136,000–138,000 records per year)
- **Spatial Coverage**: 24 administrative municipal wards of Mumbai (Wards A through T)
- **Total Records**: 960,000
- **Integrity**: 0 missing values, 0 duplicate IDs, 100% verified against the official data dictionary.

---

## 2. 35-Field Data Dictionary & Schema

| # | Field Name | Type | Description |
|---|---|---|---|
| 1 | `complaint_id` | `TEXT UNIQUE` | Unique complaint ID (e.g. `BMC20240716953`) |
| 2 | `complaint_date` | `TEXT` | Filing date (`YYYY-MM-DD`) |
| 3 | `year` | `INTEGER` | Filing year (2018–2024) |
| 4 | `month` | `INTEGER` | Filing month (1–12) |
| 5 | `is_monsoon_season` | `INTEGER` | 1 if filed between June and September (Mumbai monsoon) |
| 6 | `complaint_time_of_day` | `TEXT` | Time band (Morning, Afternoon, Evening, Night) |
| 7 | `ward_code` | `TEXT` | BMC municipal administrative ward code (A to T) |
| 8 | `ward_area` | `TEXT` | Locality area name (e.g. Bandra West, Andheri East, Colaba) |
| 9 | `zone` | `TEXT` | BMC Zone (City, Western Suburbs, Eastern Suburbs) |
| 10 | `ward_type` | `TEXT` | Geographic sector (South, Central, Suburban) |
| 11 | `population_density` | `TEXT` | Ward population density class (Low, Medium, High, Very High) |
| 12 | `ward_slum_percentage` | `REAL` | Percentage of ward categorized as slum/chawl settlements |
| 13 | `complaint_category` | `TEXT` | Civic grievance classification (13 categories) |
| 14 | `department_assigned` | `TEXT` | Responsible municipal department |
| 15 | `complaint_channel` | `TEXT` | Filing medium (Helpline 1916, Mobile App, Portal, Ward Office) |
| 16 | `severity` | `TEXT` | Reported severity (`Low`, `Medium`, `High`, `Critical`) |
| 17 | `has_photo_evidence` | `INTEGER` | 1 if citizen attached photographic proof |
| 18 | `has_gps_location` | `INTEGER` | 1 if GPS availability was recorded |
| 19 | `media_attention` | `INTEGER` | 1 if highlighted in news or public media |
| 20 | `politically_sensitive` | `INTEGER` | 1 if marked for political or sensitive oversight |
| 21 | `complainant_type` | `TEXT` | Individual, ALM / RWA, Commercial, NGO |
| 22 | `property_type` | `TEXT` | Residential, Commercial, Industrial, Public Road |
| 23 | `repeat_complainant` | `INTEGER` | 1 if complainant previously filed grievances |
| 24 | `prior_complaints_count`| `INTEGER` | Number of past complaints from the same citizen profile |
| 25 | `resolution_days` | `INTEGER` | Actual turnaround time to mark resolution (days) |
| 26 | `num_reassignments` | `INTEGER` | Inter-departmental reassignments before resolution |
| 27 | `complaint_status` | `TEXT` | Resolved, In Progress, Closed Without Resolution, Escalated, Reopened |
| 28 | `contractor_category` | `TEXT` | Contractor classification tier (Tier 1, Tier 2, etc.) |
| 29 | `work_quality_rating` | `TEXT` | Contractor inspection grade (Poor, Fair, Good, Excellent) |
| 30 | `site_inspected` | `INTEGER` | 1 if physical field engineer inspection was conducted |
| 31 | `defect_liability_claim`| `INTEGER` | 1 if contractor defect liability period was invoked |
| 32 | `estimated_cost_inr` | `REAL` | Estimated financial expenditure in Indian Rupees (INR) |
| 33 | `infrastructure_age_years`| `INTEGER` | Age of affected municipal infrastructure |
| 34 | `months_since_last_maintained`| `INTEGER` | Maintenance gap (months) |
| 35 | `citizen_satisfied` | `INTEGER` | **TARGET OUTCOME**: 1 if citizen rated satisfied, 0 otherwise |

---

## 3. Strict Source Separation

To prevent confusion between historical archives and real-time citizen grievance reporting, Sahayata enforces three explicit source tags:

| Source Tag | Description | Behavior |
|---|---|---|
| `BMC_HISTORICAL` | The 960,000 real BMC records (2018–2024). | Read-only historical intelligence layer. Preserves all 35 original fields. Never masquerades as a live citizen report. |
| `SAHAYATA_LIVE` | New citizen grievances submitted via Sahayata. | Routes through Groq vision classification, Haversine duplicate interception, priority scoring, and 6-stage resolution workflow. |
| `DEMO` | Initial offline bootstrap records. | Used exclusively for fallback/offline testing. |

---

## 4. Normalization Layer Architecture

The normalization layer in `Backend/bmcHistoricalService.js` transforms raw database rows into a dual-model structure:

```json
{
  "source": "BMC_HISTORICAL",
  "historicalData": {
    "complaint_id": "BMC20240716953",
    "complaint_date": "2024-07-16",
    "year": 2024,
    "month": 7,
    "is_monsoon_season": true,
    "ward_code": "E",
    "ward_area": "Byculla",
    "severity": "Critical",
    "citizen_satisfied": true
  },
  "sahayata": {
    "id": "BMC20240716953",
    "title": "Drainage/Sewage grievance in Ward E",
    "category": "drainage",
    "categoryLabel": "Drainage/Sewage",
    "status": "resolved",
    "address": "Byculla, Ward E, Mumbai",
    "ward": "E",
    "coords": [18.973, 72.830],
    "isHistorical": true
  }
}
```

---

## 5. Import Instructions & Database Layer

### High-Performance Streaming Import
Run the batch import script from `Backend/`:
```bash
python scripts/import_bmc_data.py
```
To force a clean re-import and re-indexing:
```bash
python scripts/import_bmc_data.py --force
```

### Pre-Compute Analytical Summary
To generate the sub-millisecond summary snapshot:
```bash
python scripts/generate_bmc_summary.py
```

### SQLite Database
- Database file: `Backend/data/bmc_historical.db` (git-ignored, ~407 MB).
- Summary cache: `Backend/data/bmc_summary.json` (git-ignored, ~52 KB).
- High-Performance Indexes:
  - `idx_bmc_cid` ON `complaint_id` (Unique)
  - `idx_bmc_date` ON `complaint_date`
  - `idx_bmc_year_month` ON (`year`, `month`)
  - `idx_bmc_ward` ON `ward_code`
  - `idx_bmc_cat` ON `complaint_category`
  - `idx_bmc_dept` ON `department_assigned`
  - `idx_bmc_status` ON `complaint_status`
  - `idx_bmc_sev` ON `severity`
  - `idx_bmc_sat` ON `citizen_satisfied`
  - `idx_bmc_monsoon` ON `is_monsoon_season`

---

## 6. Backend API Endpoints

All endpoints are served from `http://localhost:5000/api/historical/bmc/*`:

| Endpoint | Method | Parameters | Description |
|---|---|---|---|
| `/api/historical/bmc/stats` | `GET` | `ward_code`, `year`, `month`, `category`, `department`, `severity` | Global or filtered KPIs (Total volume, resolved %, SLA, satisfaction rate, monsoon index). |
| `/api/historical/bmc/complaints` | `GET` | `page`, `pageSize`, `ward_code`, `category`, `severity`, `status`, `year`, `search` | Paginated complaint explorer across 960k records (20ms query latency). |
| `/api/historical/bmc/complaints/:id` | `GET` | `id` (path) | Single complaint lookup returning all 35 original fields. |
| `/api/historical/bmc/categories` | `GET` | None | Breakdown of all 13 civic categories (volume, SLA, cost, satisfaction). |
| `/api/historical/bmc/wards` | `GET` | None | Demographic & operational profiles across all 24 Mumbai municipal wards. |
| `/api/historical/bmc/departments` | `GET` | None | Department efficiency metrics (reassignments, contractor rating, resolution SLA). |
| `/api/historical/bmc/trends` | `GET` | None | 7-year longitudinal trend (2018–2024), 12 months, and Monsoon comparison. |
| `/api/historical/bmc/map` | `GET` | None | 24-Ward centroid coordinates and volume metrics for Leaflet map integration. |

---

## 7. Geographic Integration & Zero Fabrication Guarantee

The BMC dataset contains a boolean `has_gps_location` field and ward identifiers (`ward_code`, `ward_area`), but **no raw latitude/longitude coordinates**.
- Coordinates are **never fabricated** for individual historical records.
- Geographic map integration operates on **official Mumbai 24-ward municipal centroids**.
- Leaflet map supports a 3-way toggle:
  - `[All Data]`: Displays both live reports and ward historical bubbles.
  - `[🚨 Live Reports]`: Displays only live pinpointed complaints.
  - `[🏛️ BMC Wards]`: Displays only 24-ward aggregate bubbles.

---

## 8. Data Limitations & Future ML Opportunities

1. **Target Outcome Field (`citizen_satisfied`)**:
   - The dataset contains `citizen_satisfied` (1 = Yes, 0 = No).
   - This field enables predictive machine learning models to forecast whether a grievance of a particular severity, department, infrastructure age, and resolution time is likely to lead to citizen dissatisfaction.
2. **Infrastructure Risk Modeling**:
   - `infrastructure_age_years` combined with `months_since_last_maintained` and `repeat_complainant` allows proactive predictive maintenance algorithms for Mumbai wards before major monsoon failures occur.
