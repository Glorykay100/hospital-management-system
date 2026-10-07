/* ============================================================
   App shell — navigation, page routing, keyboard shortcuts
   ============================================================ */

const PAGES = {
  dashboard:   { title: 'Dashboard',   subtitle: 'Patient flow and ward readiness' },
  patients:    { title: 'Patients',    subtitle: 'Manage registered patients' },
  wards:       { title: 'Wards',       subtitle: 'Ward capacity and occupancy' },
  doctors:     { title: 'Doctors',     subtitle: 'Medical staff directory' },
  assignments: { title: 'Admissions',  subtitle: 'Coordinate placement and patient transfers' },
};

let currentPage = 'dashboard';

function navigateTo(page) {
  if (!PAGES[page]) return;
  currentPage = page;

  // Update sidebar
  $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.page === page));

  // Update pages
  $$('.page').forEach((p) => p.classList.toggle('active', p.id === `page-${page}`));

  // Update topbar title
  const meta = PAGES[page];
  $('#pageTitle').textContent = meta.title;
  $('#pageSubtitle').textContent = meta.subtitle;

  // Close mobile sidebar
  $('#sidebar')?.classList.remove('open');

  // Lazy-load page data
  switch (page) {
    case 'dashboard':   loadDashboard();     break;
    case 'patients':    loadPatients();      break;
    case 'wards':       loadWards();         break;
    case 'doctors':     loadDoctors();       break;
    case 'assignments': loadAssignments();   break;
  }
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar nav
  $$('.nav-item').forEach((item) => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // "View all" buttons on dashboard
  document.addEventListener('click', (e) => {
    const goto = e.target.closest('[data-goto]');
    if (goto) navigateTo(goto.dataset.goto);
  });

  // Mobile menu toggle
  $('#menuToggle')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('open');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore when typing
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';

    // "/" focuses the current page's search box
    if (e.key === '/' && !typing) {
      e.preventDefault();
      const search = $(`.page.active input[type="text"]`);
      search?.focus();
    }
  });

  // Start on dashboard
  navigateTo('dashboard');
});