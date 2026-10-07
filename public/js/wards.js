/* ============================================================
   Wards page — card grid with occupancy bars, add/edit modal
   ============================================================ */

let wardsCache = [];

async function loadWards() {
  const grid = $('#wardGrid');
  const summary = $('#wardsSummary');
  if (!grid) return;

  grid.innerHTML = Array.from({ length: 4 }, () =>
    `<div class="ward-card"><div class="skeleton" style="width:50%;height:16px;margin-bottom:12px"></div><div class="skeleton" style="height:8px"></div></div>`
  ).join('');

  try {
    const res = await api.getWards();
    wardsCache = res.data || [];

    const totalCap = wardsCache.reduce((s, w) => s + Number(w.capacity || 0), 0);
    const totalOcc = wardsCache.reduce((s, w) => s + Number(w.currentOccupancy || 0), 0);
    const availableBeds = totalCap - totalOcc;
    summary.textContent = `${wardsCache.length} ward${wardsCache.length === 1 ? '' : 's'} · ${totalOcc}/${totalCap} beds used · ${availableBeds} available`;

    renderWards();
  } catch (err) {
    grid.innerHTML = `<div class="alert-strip error" style="grid-column:1/-1">${esc(err.message)}</div>`;
  }
}

function renderWards() {
  const grid = $('#wardGrid');
  if (!wardsCache.length) {
    grid.innerHTML = emptyState({ title: 'No wards yet', sub: 'Add your first ward to start assigning patients.', icon: 'bed' });
    return;
  }

  grid.innerHTML = wardsCache.map((w) => {
    const cap = Number(w.capacity || 0);
    const cur = Number(w.currentOccupancy || 0);
    const avail = Math.max(0, cap - cur);
    const pct = cap ? Math.min(100, Math.round((cur / cap) * 100)) : 0;
    const color = occupancyColor(cur, cap);
    const isFull = avail === 0;
    const availCls = isFull ? 'full' : avail <= 2 ? 'warn' : 'ok';

    return `
      <div class="ward-card ${isFull ? 'is-full' : ''}">
        <div class="ward-head">
          <div>
            <div class="ward-name">${esc(w.name)}</div>
            <div class="ward-type">${esc(w.wardType)}</div>
          </div>
          ${isFull
            ? `<span class="badge badge-red"><span class="dot"></span>Full</span>`
            : `<span class="badge badge-green"><span class="dot"></span>Available</span>`}
        </div>

        <div class="ward-stats">
          <div class="ward-count">${cur} <span class="of">/ ${cap}</span></div>
          <div class="ward-available ${availCls}">
            ${avail} bed${avail === 1 ? '' : 's'} available
          </div>
        </div>

        <div class="occ-bar">
          <div class="occ-bar-fill ${color}" style="width:${pct}%"></div>
        </div>

        <div class="ward-actions">
          <button class="btn-icon-sm" title="Edit" data-edit="${w.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-sm danger" title="Delete" data-del="${w.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openWardModal(Number(b.dataset.edit)));
  grid.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteWard(Number(b.dataset.del)));
}

function openWardModal(id = null) {
  const w = id ? wardsCache.find((x) => x.id === id) : null;
  const title = w ? 'Edit Ward' : 'Add Ward';
  const body = `
    <div class="form-field">
      <label>Ward Name <span class="req">*</span></label>
      <input type="text" id="wName" value="${esc(w?.name || '')}" placeholder="Ward A" required />
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Type <span class="req">*</span></label>
        <select id="wType" required>
          <option value="">Select…</option>
          <option value="General"   ${w?.wardType === 'General'   ? 'selected' : ''}>General</option>
          <option value="ICU"       ${w?.wardType === 'ICU'       ? 'selected' : ''}>ICU</option>
          <option value="Maternity" ${w?.wardType === 'Maternity' ? 'selected' : ''}>Maternity</option>
          <option value="Pediatric" ${w?.wardType === 'Pediatric' ? 'selected' : ''}>Pediatric</option>
        </select>
      </div>
      <div class="form-field">
        <label>Capacity <span class="req">*</span></label>
        <input type="number" id="wCap" min="1" value="${w?.capacity || ''}" placeholder="10" required />
      </div>
    </div>
    <p class="muted" style="font-size:12px">
      Note: Current occupancy is managed automatically by assignments and can't be edited here.
    </p>
  `;
  const footer = `
    <button class="btn-secondary" data-cancel>Cancel</button>
    <button class="btn-primary" data-save>${w ? 'Save Changes' : 'Add Ward'}</button>
  `;
  const modal = openModal({ title, body, footer });

  modal.querySelector('[data-cancel]').onclick = closeModal;
  modal.querySelector('[data-save]').onclick = async () => {
    const data = {
      name:      modal.querySelector('#wName').value.trim(),
      wardType: modal.querySelector('#wType').value,
      capacity:  Number(modal.querySelector('#wCap').value),
    };
    if (!data.name || !data.wardType || !data.capacity || data.capacity < 1) {
      return toast('Name, type and a capacity ≥ 1 are required', 'error');
    }
    try {
      if (w) {
        await api.updateWard(w.id, data);
        toast('Ward updated', 'success');
      } else {
        await api.createWard(data);
        toast('Ward added', 'success');
      }
      closeModal();
      loadWards();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
}

async function deleteWard(id) {
  const w = wardsCache.find((x) => x.id === id);
  const ok = await confirmDialog({
    title: 'Delete ward',
    message: `Delete "${w?.name}"? Wards with active assignments can't be deleted.`,
    confirmText: 'Delete',
    danger: true,
  });
  if (!ok) return;
  try {
    await api.deleteWard(id);
    toast('Ward deleted', 'success');
    loadWards();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------- Wire toolbar ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#addWardBtn')?.addEventListener('click', () => openWardModal());
});