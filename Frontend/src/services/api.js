/**
 * Sahayata API Client
 * Seamlessly interfaces with FastAPI backend (http://localhost:8000/api)
 * with automatic fallback to local offline mode.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchJurisdiction() {
  try {
    const res = await fetch(`${API_BASE}/jurisdiction`);
    if (!res.ok) throw new Error("Backend unavailable");
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchReports() {
  try {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error("Backend unavailable");
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function submitReportToBackend(payload) {
  try {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 500, error: err.message };
  }
}

export async function endorseReportOnBackend(reportId) {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/endorse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId: 'citizen_session' })
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function progressReportOnBackend(reportId, progressData) {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function verifyReportOnBackend(reportId, vote, note = '') {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote, note })
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}
