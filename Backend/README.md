# Sahayata Backend (FastAPI + Vision AI)

High-performance Python backend service powering Sahayata's civic tech platform.

## Features
- **Multi-Factor Deduplication**: Haversine physical distance ($\le 50\text{m}$) + 64-bit dHash/pHash visual similarity calculation.
- **Anti-Deadlock Dynamic Priority Engine**: Automatically calculates complaint priority based on base severity, citizen endorsement count, school/hospital corridor proximity, traffic density, and elapsed SLA aging.
- **Interactive OpenAPI Documentation**: Built-in Swagger UI at `http://localhost:8000/docs`.
- **RBAC Lifecycle Pipeline**: 6-step lifecycle progression (Reported $\rightarrow$ Clustered $\rightarrow$ Prioritized $\rightarrow$ Assigned $\rightarrow$ Resolved $\rightarrow$ Verified).

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run FastAPI Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Server runs at `http://localhost:8000`

### 3. Open Interactive Swagger UI
Open your browser and visit:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### 4. Run Automated Test Suite
```bash
python test_api.py
```
All 7 REST endpoints are tested and validated.
