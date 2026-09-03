const API_BASE = 'http://localhost:5000/api';

/**
 * Robust fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}: Request failed`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Jurisdiction
  getJurisdiction: () => request('/jurisdiction'),

  // Reports
  getReports: () => request('/reports'),
  createReport: (reportData) => request('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  }),
  endorseReport: (id) => request(`/reports/${id}/endorse`, {
    method: 'POST'
  }),
  progressReport: (id, { afterImage } = {}) => request(`/reports/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify({ afterImage })
  }),
  verifyReport: (id, action) => request(`/reports/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ action }) // 'confirm' or 'dispute'
  }),

  // Auth
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  signup: (userData) => request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
};
