/* ============================================================
   API client — thin wrapper around fetch
   All requests go to relative /api/* so the same code works
   locally and on Render.
   ============================================================ */

const API_BASE = '/api';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // 204 No Content (DELETE)
  if (res.status === 204) return null;

  let payload = null;
  try { payload = await res.json(); } catch (_) { /* not JSON */ }

  if (!res.ok) {
    const msg = payload?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = payload?.errors || payload?.details || null;
    throw err;
  }
  return payload;
}

const api = {
  // Health
  health: () => apiRequest('/health'),

  // Patients
  getPatients:    ()      => apiRequest('/patients'),
  getPatient:     (id)    => apiRequest(`/patients/${id}`),
  createPatient:  (data)  => apiRequest('/patients',      { method: 'POST',   body: JSON.stringify(data) }),
  updatePatient:  (id, d) => apiRequest(`/patients/${id}`,{ method: 'PUT',    body: JSON.stringify(d) }),
  deletePatient:  (id)    => apiRequest(`/patients/${id}`,{ method: 'DELETE' }),

  // Wards
  getWards:    ()      => apiRequest('/wards'),
  getWard:     (id)    => apiRequest(`/wards/${id}`),
  createWard:  (data)  => apiRequest('/wards',      { method: 'POST',   body: JSON.stringify(data) }),
  updateWard:  (id, d) => apiRequest(`/wards/${id}`,{ method: 'PUT',    body: JSON.stringify(d) }),
  deleteWard:  (id)    => apiRequest(`/wards/${id}`,{ method: 'DELETE' }),

  // Doctors
  getDoctors:   ()      => apiRequest('/doctors'),
  getDoctor:    (id)    => apiRequest(`/doctors/${id}`),
  createDoctor: (data)  => apiRequest('/doctors',      { method: 'POST',   body: JSON.stringify(data) }),
  updateDoctor: (id, d) => apiRequest(`/doctors/${id}`,{ method: 'PUT',    body: JSON.stringify(d) }),
  deleteDoctor: (id)    => apiRequest(`/doctors/${id}`,{ method: 'DELETE' }),

  // Assignments
  getAssignments:   ()      => apiRequest('/assignments'),
  getAssignment:    (id)    => apiRequest(`/assignments/${id}`),
  createAssignment: (data)  => apiRequest('/assignments',      { method: 'POST',   body: JSON.stringify(data) }),
  updateAssignment: (id, d) => apiRequest(`/assignments/${id}`,{ method: 'PUT',    body: JSON.stringify(d) }),
  deleteAssignment: (id)    => apiRequest(`/assignments/${id}`,{ method: 'DELETE' }),
};