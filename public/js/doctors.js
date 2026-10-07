/* ============================================================
   Doctors page — searchable table, add/edit modal, delete
   ============================================================ */

let doctorsCache = [];
let doctorQuery = '';

async function loadDoctors() {
  const wrap = $('#doctorsTableWrap');
  if (!wrap) return;
  wrap.innerHTML = tableSkeleton(5, 6);

  try {
    const res = await api.getDoctors();
    doctorsCache = res.data || [];
    renderDoctors();
  } catch (err) {
    wrap.innerHTML = `<div class="alert-strip error" style="margin:20px">${esc(err.message)}</div>`;
  }
}

function renderDoctors() {
  const wrap = $('#doctorsTableWrap');
  const q = doctorQuery.trim().toLowerCase();
  const list = q
    ? doctorsCache.filter((d) =>
        [d.fullName, d.specialization, d.email, d.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    : doctorsCache;

  if (!list.length) {
    wrap.innerHTML = q
      ? emptyState({ title: 'No matches', sub: `Nothing found for "${q}"`, icon: 'users' })
      : emptyState({ title: 'No doctors yet', sub: 'Add your first doctor to get started.', icon: 'users' });
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialization</th>
            <th>Email</th>
            <th>Phone</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((d) => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="recent-avatar" style="width:30px;height:30px;font-size:11px">${esc(initials(d.fullName))}</div>
                  <span class="cell-primary">${esc(d.fullName)}</span>
                </div>
              </td>
              <td><span class="badge badge-blue">${esc(d.specialization)}</span></td>
              <td class="cell-muted">${esc(d.email || '—')}</td>
              <td class="cell-muted">${esc(d.phone || '—')}</td>
              <td>
                <div class="cell-actions">
                  <button class="btn-icon-sm" title="Edit" data-edit="${d.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn-icon-sm danger" title="Delete" data-del="${d.id}">
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

  wrap.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openDoctorModal(Number(b.dataset.edit)));
  wrap.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteDoctor(Number(b.dataset.del)));
}

function openDoctorModal(id = null) {
  const d = id ? doctorsCache.find((x) => x.id === id) : null;
  const title = d ? 'Edit Doctor' : 'Add Doctor';
  const body = `
    <div class="form-field">
      <label>Full Name <span class="req">*</span></label>
      <input type="text" id="dName" value="${esc(d?.fullName || '')}" placeholder="Dr. John Smith" required />
    </div>
    <div class="form-field">
      <label>Specialization <span class="req">*</span></label>
      <input type="text" id="dSpec" value="${esc(d?.specialization || '')}" placeholder="Cardiology, Pediatrics…" required />
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Email</label>
        <input type="email" id="dEmail" value="${esc(d?.email || '')}" placeholder="dr.smith@hospital.com" />
      </div>
      <div class="form-field">
        <label>Phone</label>
        <input type="tel" id="dPhone" value="${esc(d?.phone || '')}" placeholder="+234 800 000 0000" />
      </div>
    </div>
  `;
  const footer = `
    <button class="btn-secondary" data-cancel>Cancel</button>
    <button class="btn-primary" data-save>${d ? 'Save Changes' : 'Add Doctor'}</button>
  `;
  const modal = openModal({ title, body, footer });

  modal.querySelector('[data-cancel]').onclick = closeModal;
  modal.querySelector('[data-save]').onclick = async () => {
    const data = {
      fullName:       modal.querySelector('#dName').value.trim(),
      specialization: modal.querySelector('#dSpec').value.trim(),
      email:          modal.querySelector('#dEmail').value.trim() || null,
      phone:          modal.querySelector('#dPhone').value.trim() || null,
    };
    if (!data.fullName || !data.specialization) {
      return toast('Name and specialization are required', 'error');
    }
    try {
      if (d) {
        await api.updateDoctor(d.id, data);
        toast('Doctor updated', 'success');
      } else {
        await api.createDoctor(data);
        toast('Doctor added', 'success');
      }
      closeModal();
      loadDoctors();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
}

async function deleteDoctor(id) {
  const d = doctorsCache.find((x) => x.id === id);
  const ok = await confirmDialog({
    title: 'Delete doctor',
    message: `Delete ${d?.fullName}? Any assignments to this doctor will be unset.`,
    confirmText: 'Delete',
    danger: true,
  });
  if (!ok) return;
  try {
    await api.deleteDoctor(id);
    toast('Doctor deleted', 'success');
    loadDoctors();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------- Wire toolbar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#doctorSearch')?.addEventListener('input', (e) => {
    doctorQuery = e.target.value;
    renderDoctors();
  });
  $('#addDoctorBtn')?.addEventListener('click', () => openDoctorModal());
});