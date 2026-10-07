/* ============================================================
   Assignments page — assign form, active/history tabs, actions
   ============================================================ */

let assignmentsCache = [];
let activeTab = 'active';
let patientsLookup = [];
let wardsLookup = [];
let doctorsLookup = [];

async function loadAssignments() {
  const wrap = $('#assignmentsTableWrap');
  if (!wrap) return;
  wrap.innerHTML = tableSkeleton(6, 5);

  try {
    const [assignRes, pRes, wRes, dRes] = await Promise.all([
      api.getAssignments(),
      api.getPatients(),
      api.getWards(),
      api.getDoctors(),
    ]);

    assignmentsCache = assignRes.data || [];
    patientsLookup   = pRes.data || [];
    wardsLookup      = wRes.data || [];
    doctorsLookup    = dRes.data || [];

    populateAssignForm();
    renderAssignments();
  } catch (err) {
    wrap.innerHTML = `<div class="alert-strip error" style="margin:20px">${esc(err.message)}</div>`;
  }
}

function populateAssignForm() {
  const pSelect = $('#assignPatient');
  const wSelect = $('#assignWard');
  const dSelect = $('#assignDoctor');
  if (!pSelect || !wSelect || !dSelect) return;

  const pCur = pSelect.value;
  const wCur = wSelect.value;
  const dCur = dSelect.value;

  pSelect.innerHTML = `<option value="">Select patient…</option>` +
    patientsLookup.map((p) =>
      `<option value="${p.id}">${esc(p.fullName)}</option>`
    ).join('');

  // Wards: mark full ones as disabled
  wSelect.innerHTML = `<option value="">Select ward…</option>` +
    wardsLookup.map((w) => {
      const cap = Number(w.capacity || 0);
      const cur = Number(w.currentOccupancy || 0);
      const avail = Math.max(0, cap - cur);
      const full = avail === 0;
      const label = `${w.name} — ${avail} of ${cap} bed${cap === 1 ? '' : 's'} available${full ? ' (FULL)' : ''}`;
      return `<option value="${w.id}" ${full ? 'disabled' : ''}>${esc(label)}</option>`;
    }).join('');

  dSelect.innerHTML = `<option value="">No doctor</option>` +
    doctorsLookup.map((d) =>
      `<option value="${d.id}">${esc(d.fullName)} — ${esc(d.specialization)}</option>`
    ).join('');

  if (pCur) pSelect.value = pCur;
  if (wCur) wSelect.value = wCur;
  if (dCur) dSelect.value = dCur;
}

function renderAssignments() {
  const wrap = $('#assignmentsTableWrap');
  const filtered = activeTab === 'active'
    ? assignmentsCache.filter((a) => a.status === 'active')
    : assignmentsCache.filter((a) => a.status !== 'active');

  if (!filtered.length) {
    wrap.innerHTML = activeTab === 'active'
      ? emptyState({ title: 'No active assignments', sub: 'Assign a ward to a patient using the form above.', icon: 'check' })
      : emptyState({ title: 'No assignment history', sub: 'Discharged and transferred assignments will show up here.', icon: 'inbox' });
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Ward</th>
            <th>Doctor</th>
            <th>Assigned</th>
            <th>Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((a) => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="recent-avatar" style="width:30px;height:30px;font-size:11px">${esc(initials(a.patientName || '?'))}</div>
                  <span class="cell-primary">${esc(a.patientName || 'Unknown')}</span>
                </div>
              </td>
              <td><span class="cell-primary">${esc(a.wardName || '—')}</span></td>
              <td class="cell-muted">${esc(a.doctorName || '—')}</td>
              <td class="cell-muted">${timeAgo(a.assignedAt)}</td>
              <td>${statusBadge(a.status)}</td>
              <td>
                <div class="cell-actions">
                  ${a.status === 'active' ? `
                    <button class="btn-icon-sm" title="Discharge" data-discharge="${a.id}">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                    </button>
                  ` : ''}
                  <button class="btn-icon-sm danger" title="Delete" data-del="${a.id}">
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

  wrap.querySelectorAll('[data-discharge]').forEach((b) => b.onclick = () => dischargeAssignment(Number(b.dataset.discharge)));
  wrap.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteAssignment(Number(b.dataset.del)));
}

async function submitAssignment(e) {
  e.preventDefault();
  const btn = $('#assignSubmitBtn');
  const patientId = Number($('#assignPatient').value);
  const wardId    = Number($('#assignWard').value);
  const doctorId  = Number($('#assignDoctor').value) || null;
  const notes      = $('#assignNotes').value.trim() || null;

  if (!patientId) return toast('Please select a patient', 'error');
  if (!wardId)    return toast('Please select a ward', 'error');

  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> Assigning…`;

  try {
    await api.createAssignment({ patientId, wardId, doctorId, notes });
    toast('Ward assigned successfully', 'success');
    $('#assignForm').reset();
    loadAssignments();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

async function dischargeAssignment(id) {
  const a = assignmentsCache.find((x) => x.id === id);
  const ok = await confirmDialog({
    title: 'Discharge patient',
    message: `Discharge ${a?.patientName} from ${a?.wardName}? This frees up one bed.`,
    confirmText: 'Discharge',
  });
  if (!ok) return;

  try {
    await api.updateAssignment(id, { status: 'discharged' });
    toast('Patient discharged', 'success');
    loadAssignments();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteAssignment(id) {
  const a = assignmentsCache.find((x) => x.id === id);
  const ok = await confirmDialog({
    title: 'Delete assignment',
    message: `Delete this assignment for ${a?.patientName}? ${a?.status === 'active' ? 'The bed will be freed.' : ''}`,
    confirmText: 'Delete',
    danger: true,
  });
  if (!ok) return;

  try {
    await api.deleteAssignment(id);
    toast('Assignment deleted', 'success');
    loadAssignments();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------- Wire page ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#assignForm')?.addEventListener('submit', submitAssignment);

  $$('#assignTabs .tab').forEach((t) => {
    t.onclick = () => {
      $$('#assignTabs .tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      activeTab = t.dataset.tab;
      renderAssignments();
    };
  });
});
