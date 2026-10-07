/* ============================================================
   Dashboard — stat cards, occupancy panel, recent assignments
   ============================================================ */

const DASH_ICONS = {
  patients: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  wards:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v11h18V7"/><path d="M3 7l2-3h14l2 3"/><path d="M12 12v6"/><path d="M9 15h6"/></svg>`,
  occupancy:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>`,
  doctors:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><circle cx="12" cy="10" r="2"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
};

async function loadDashboard() {
  const statGrid = $('#statGrid');
  const occList  = $('#occupancyList');
  const recList  = $('#recentList');
  const alerts   = $('#alertsStrip');
  if (!statGrid) return;

  // Loading skeletons
  statGrid.innerHTML = Array.from({ length: 4 }, () =>
    `<div class="stat-card"><div class="skeleton" style="width:60%;height:12px;margin-bottom:10px"></div><div class="skeleton" style="width:40%;height:26px"></div></div>`
  ).join('');
  occList.innerHTML = `<div class="skeleton" style="height:14px;margin-bottom:12px"></div><div class="skeleton" style="height:14px;margin-bottom:12px"></div><div class="skeleton" style="height:14px"></div>`;
  recList.innerHTML = `<div class="skeleton" style="height:44px"></div>`;
  alerts.innerHTML  = '';

  try {
    const [patients, wards, doctors, assignments] = await Promise.all([
      api.getPatients(),
      api.getWards(),
      api.getDoctors(),
      api.getAssignments(),
    ]);

    const p = patients.data || [];
    const w = wards.data || [];
    const d = doctors.data || [];
    const a = assignments.data || [];

    // Stats
    const totalCap = w.reduce((s, x) => s + Number(x.capacity || 0), 0);
    const totalOcc = w.reduce((s, x) => s + Number(x.currentOccupancy || 0), 0);
    const occPct   = totalCap ? Math.round((totalOcc / totalCap) * 100) : 0;
    const active   = a.filter((x) => x.status === 'active');

    statGrid.innerHTML = `
      ${statCard('Registered Patients', p.length, 'All records on file', DASH_ICONS.patients, '')}
      ${statCard('Active Admissions', active.length, 'Patients currently in a ward', DASH_ICONS.wards, '')}
      ${statCard('Bed Occupancy', `${occPct}%`, `${totalOcc} of ${totalCap} beds in use`, DASH_ICONS.occupancy, occPct >= 90 ? 'red' : occPct >= 70 ? 'amber' : 'green')}
      ${statCard('Beds Available', Math.max(totalCap - totalOcc, 0), `Across ${w.length} wards`, DASH_ICONS.wards, '')}
    `;

    // Full ward alert
    const fullWards = w.filter((x) => Number(x.currentOccupancy) >= Number(x.capacity));
    if (fullWards.length) {
      alerts.innerHTML = `
        <div class="alert-strip">
          ${DASH_ICONS.alert}
          <span>${fullWards.length} ward${fullWards.length > 1 ? 's are' : ' is'} at full capacity: ${fullWards.map((x) => esc(x.name)).join(', ')}</span>
        </div>`;
    }

    // Occupancy list
    if (!w.length) {
      occList.innerHTML = emptyState({ title: 'No wards yet', sub: 'Add a ward to start tracking occupancy.', icon: 'bed' });
    } else {
      occList.innerHTML = w.map((ward) => {
        const cap = Number(ward.capacity || 0);
        const cur = Number(ward.currentOccupancy || 0);
        const pct = cap ? Math.min(100, Math.round((cur / cap) * 100)) : 0;
        const color = occupancyColor(cur, cap);
        const isFull = cur >= cap;
        return `
          <div class="occ-item">
            <div class="occ-row">
              <div class="occ-name">
                ${esc(ward.name)}
                <span class="type-badge">${esc(ward.wardType)}</span>
                ${isFull ? `<span class="occ-full-label">${DASH_ICONS.alert}FULL</span>` : ''}
              </div>
              <div class="occ-count">${cur} / ${cap}</div>
            </div>
            <div class="occ-bar">
              <div class="occ-bar-fill ${color}" style="width:${pct}%"></div>
            </div>
          </div>`;
      }).join('');
    }

    // Recent assignments (last 5, sorted by created_at desc)
    const recent = [...a]
      .sort((x, y) => new Date(y.assignedAt || 0) - new Date(x.assignedAt || 0))
      .slice(0, 5);

    if (!recent.length) {
      recList.innerHTML = emptyState({ title: 'No assignments yet', sub: 'Assign a patient to a ward to get started.', icon: 'check' });
    } else {
      recList.innerHTML = recent.map((r) => `
        <div class="recent-item">
          <div class="recent-avatar">${esc(initials(r.patientName || '?'))}</div>
          <div class="recent-body">
            <div class="recent-name">${esc(r.patientName || 'Unknown patient')}</div>
            <div class="recent-meta">${esc(r.wardName || 'Unknown ward')} · ${timeAgo(r.assignedAt)}</div>
          </div>
          ${statusBadge(r.status)}
        </div>
      `).join('');
    }

  } catch (err) {
    statGrid.innerHTML = `<div class="alert-strip error" style="grid-column:1/-1">${DASH_ICONS.alert}<span>Failed to load dashboard: ${esc(err.message)}</span></div>`;
    occList.innerHTML = '';
    recList.innerHTML = '';
  }
}

function statCard(label, value, sub, icon, tone) {
  const toneCls = tone ? ` ${tone}` : '';
  return `
    <div class="stat-card">
      <div class="stat-head">
        <span class="stat-label">${esc(label)}</span>
        <span class="stat-icon${toneCls}">${icon}</span>
      </div>
      <div class="stat-value">${esc(value)}</div>
      <div class="stat-sub">${esc(sub)}</div>
    </div>
  `;
}