/* ============================================================
   UI helpers — toasts, modals, formatting, DOM builders
   Loaded before any page script.
   ============================================================ */

/* ---------- DOM shortcuts ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Escape HTML ---------- */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* ---------- Formatting ---------- */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
}

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function numberFmt(n) {
  return Number(n || 0).toLocaleString('en-GB');
}

/* ---------- Toasts ---------- */
const ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
};

function toast(message, type = 'info', ms = 3200) {
  const host = $('#toastHost');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${ICONS[type] || ICONS.info}<div>${esc(message)}</div>`;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 180);
  }, ms);
}

/* ---------- Modal ---------- */
function openModal({ title, subtitle = '', body, footer }) {
  const host = $('#modalHost');
  host.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-header">
      <div>
        <h3>${esc(title)}</h3>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
      </div>
      <button class="icon-btn" data-close aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">${body}</div>
    <div class="modal-footer">${footer}</div>
  `;
  host.appendChild(modal);
  host.hidden = false;

  const close = () => closeModal();
  host.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
  host.onclick = (e) => { if (e.target === host) close(); };
  document.addEventListener('keydown', escHandler, { once: true });
  function escHandler(e) { if (e.key === 'Escape') closeModal(); }

  return modal;
}

function closeModal() {
  const host = $('#modalHost');
  if (!host) return;
  host.hidden = true;
  host.innerHTML = '';
}

/* ---------- Confirm dialog ---------- */
function confirmDialog({ title, message, confirmText = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const modal = openModal({
      title,
      body: `<p style="font-size:13.5px;color:#334155">${esc(message)}</p>`,
      footer: `
        <button class="btn-secondary" data-cancel>Cancel</button>
        <button class="${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${esc(confirmText)}</button>
      `,
    });
    modal.querySelector('[data-cancel]').onclick = () => { closeModal(); resolve(false); };
    modal.querySelector('[data-confirm]').onclick = () => { closeModal(); resolve(true); };
  });
}

/* ---------- Skeleton loader for tables ---------- */
function tableSkeleton(cols = 5, rows = 5) {
  const cells = Array.from({ length: cols }, (_, i) =>
    `<div class="skeleton" style="flex:${i === 0 ? 1.4 : 1};height:14px"></div>`
  ).join('');
  return `<div>${Array.from({ length: rows }, () => `<div class="skeleton-row">${cells}</div>`).join('')}</div>`;
}

/* ---------- Empty state ---------- */
function emptyState({ title, sub = '', icon = 'inbox' }) {
  const paths = {
    inbox: `<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`,
    users: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    bed:   `<path d="M3 7v11h18V7"/><path d="M3 7l2-3h14l2 3"/>`,
    check: `<path d="M20 6L9 17l-5-5"/>`,
  };
  return `
    <div class="empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        ${paths[icon] || paths.inbox}
      </svg>
      <div class="empty-title">${esc(title)}</div>
      ${sub ? `<div class="empty-sub">${esc(sub)}</div>` : ''}
    </div>
  `;
}

/* ---------- Status badge ---------- */
function statusBadge(status) {
  const map = {
    active:      { cls: 'badge-blue',  label: 'Active' },
    discharged:  { cls: 'badge-gray',  label: 'Discharged' },
    transferred: { cls: 'badge-amber', label: 'Transferred' },
  };
  const m = map[status] || { cls: 'badge-gray', label: status };
  return `<span class="badge ${m.cls}"><span class="dot"></span>${esc(m.label)}</span>`;
}

/* ---------- Occupancy colour ---------- */
function occupancyColor(current, capacity) {
  if (capacity === 0) return 'green';
  const pct = current / capacity;
  if (current >= capacity) return 'red';
  if (pct >= 0.7) return 'amber';
  return 'green';
}