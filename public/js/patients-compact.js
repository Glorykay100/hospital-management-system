/* ============================================================
   Patients page — searchable table, add/edit modal, delete
   ============================================================ */

let patientsCache = [];
let patientQuery = '';

async function loadPatients() {
  const wrap = $('#patientsTableWrap');
  if (!wrap) return;
  wrap.innerHTML = tableSkeleton(5, 6);

  try {
    const res = await api.getPatients();
    patientsCache = res.data || [];
    renderPatients();
  } catch (err) {
    wrap.innerHTML = `<div class="alert-strip error" style="margin:20px">${esc(err.message)}</div>`;
  }
}

function renderPatients() {
  const wrap = $('#patientsTableWrap');
  const q = patientQuery.trim().toLowerCase();
  const list = q
    ? patientsCache.filter((patient) =>
        [patient.fullName, patient.email, patient.phone, patient.gender]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      )
    : patientsCache;

  if (!list.length) {
    wrap.innerHTML = q
      ? emptyState({ title: 'No matches', sub: `Nothing found for "${q}"`, icon: 'users' })
      : emptyState({ title: 'No patients yet', sub: 'Add your first patient to get started.', icon: 'users' });
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date of Birth</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>Email</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((patient) => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="recent-avatar" style="width:30px;height:30px;font-size:11px">${esc(initials(patient.fullName))}</div>
                  <span class="cell-primary">${esc(patient.fullName)}</span>
                </div>
              </td>
              <td class="cell-muted">${esc(formatDate(patient.dateOfBirth))}</td>
              <td><span class="badge badge-gray">${esc((patient.gender || '').charAt(0).toUpperCase() + (patient.gender || '').slice(1))}</span></td>
              <td class="cell-muted">${esc(patient.phone || '—')}</td>
              <td class="cell-muted">${esc(patient.email || '—')}</td>
              <td>
                <div class="cell-actions">
                  <button class="btn-icon-sm" title="Edit" data-edit="${patient.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn-icon-sm danger" title="Delete" data-del="${patient.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll('[data-edit]').forEach((button) => {
    button.onclick = () => openPatientModal(Number(button.dataset.edit));
  });
  wrap.querySelectorAll('[data-del]').forEach((button) => {
    button.onclick = () => deletePatient(Number(button.dataset.del));
  });
}

function openPatientModal(id = null) {
  const patient = id ? patientsCache.find((item) => item.id === id) : null;
  const body = `
    <div class="form-field">
      <label>Full Name <span class="req">*</span></label>
      <input type="text" id="pName" value="${esc(patient?.fullName || '')}" placeholder="Jane Doe" required />
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Date of Birth <span class="req">*</span></label>
        <input type="date" id="pDob" value="${patient?.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : ''}" required />
      </div>
      <div class="form-field">
        <label>Gender <span class="req">*</span></label>
        <select id="pGender" required>
          <option value="">Select…</option>
          <option value="male" ${patient?.gender === 'male' ? 'selected' : ''}>Male</option>
          <option value="female" ${patient?.gender === 'female' ? 'selected' : ''}>Female</option>
          <option value="other" ${patient?.gender === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field"><label>Phone</label><input type="tel" id="pPhone" value="${esc(patient?.phone || '')}" /></div>
      <div class="form-field"><label>Email</label><input type="email" id="pEmail" value="${esc(patient?.email || '')}" /></div>
    </div>
    <div class="form-field"><label>Address</label><textarea id="pAddress" rows="2">${esc(patient?.address || '')}</textarea></div>
  `;
  const footer = `
    <button class="btn-secondary" data-cancel>Cancel</button>
    <button class="btn-primary" data-save>${patient ? 'Save Changes' : 'Add Patient'}</button>
  `;
  const modal = openModal({ title: patient ? 'Edit Patient' : 'Add Patient', body, footer });

  modal.querySelector('[data-cancel]').onclick = closeModal;
  modal.querySelector('[data-save]').onclick = async () => {
    const data = {
      fullName: modal.querySelector('#pName').value.trim(),
      dateOfBirth: modal.querySelector('#pDob').value,
      gender: modal.querySelector('#pGender').value,
      phone: modal.querySelector('#pPhone').value.trim() || null,
      email: modal.querySelector('#pEmail').value.trim() || null,
      address: modal.querySelector('#pAddress').value.trim() || null,
    };
    if (!data.fullName || !data.dateOfBirth || !data.gender) {
      return toast('Name, date of birth and gender are required', 'error');
    }
    try {
      if (patient) {
        await api.updatePatient(patient.id, data);
        toast('Patient updated', 'success');
      } else {
        await api.createPatient(data);
        toast('Patient added', 'success');
      }
      closeModal();
      loadPatients();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
}

async function deletePatient(id) {
  const patient = patientsCache.find((item) => item.id === id);
  const ok = await confirmDialog({
    title: 'Delete patient',
    message: `Delete ${patient?.fullName}? This also removes all their assignments. This cannot be undone.`,
    confirmText: 'Delete',
    danger: true,
  });
  if (!ok) return;
  try {
    await api.deletePatient(id);
    toast('Patient deleted', 'success');
    loadPatients();
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('#patientSearch')?.addEventListener('input', (event) => {
    patientQuery = event.target.value;
    renderPatients();
  });
  $('#addPatientBtn')?.addEventListener('click', () => openPatientModal());
});
