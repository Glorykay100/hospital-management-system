/* public/js/patients.js */
'use strict';

const Patients = (() => {
  let _data = [];
  let _sortKey = 'fullName';
  let _sortAsc = true;
  let _query = '';

  const GENDER_OPTIONS = [
    { value: 'male',   label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other',  label: 'Other' },
  ];

  function getFields(patient = {}) {
    return [
      { name: 'fullName',    label: 'Full Name',     type: 'text', required: true,  value: patient.fullName,    placeholder: 'e.g. Amara Okafor' },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true,  value: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '' },
      { name: 'gender',      label: 'Gender',        type: 'select', required: true, options: GENDER_OPTIONS, value: patient.gender },
      { name: 'phone',       label: 'Phone',         type: 'tel',  value: patient.phone || '', placeholder: 'e.g. +2348001001001' },
      { name: 'email',       label: 'Email',         type: 'email',value: patient.email || '', placeholder: 'e.g. patient@example.com' },
      { name: 'address',     label: 'Address',       type: 'textarea', value: patient.address || '' },
    ];
  }

  async function load() {
    try {
      const res = await API.patients.list();
      _data = res.data;
      render();
    } catch (err) {
      Toast.error('Failed to load patients: ' + err.message);
    }
  }

  function render() {
    const tbody = document.getElementById('patientsBody');
    let rows = [..._data];

    // Filter
    if (_query) {
      const q = _query.toLowerCase();
      rows = rows.filter((p) =>
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.email    || '').toLowerCase().includes(q) ||
        (p.phone    || '').toLowerCase().includes(q)
      );
    }

    // Sort
    rows.sort((a, b) => {
      const av = (a[_sortKey] || '').toString().toLowerCase();
      const bv = (b[_sortKey] || '').toString().toLowerCase();
      return _sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    if (rows.length === 0) {
      tbody.innerHTML = emptyState('No patients found.');
      return;
    }

    tbody.innerHTML = rows.map((p) => `
      <tr>
        <td>
          <div class="td-name">${escapeHtml(p.fullName)}</div>
        </td>
        <td>${formatDate(p.dateOfBirth)}</td>
        <td><span class="badge badge-discharged">${escapeHtml(p.gender)}</span></td>
        <td>${escapeHtml(p.phone || '—')}</td>
        <td>${escapeHtml(p.email || '—')}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-icon edit"   title="Edit"   data-id="${p.id}" data-action="edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-icon delete" title="Delete" data-id="${p.id}" data-action="delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  }

  function bindEvents() {
    // Add button
    document.getElementById('addPatientBtn').addEventListener('click', () => {
      EntityModal.open({
        title: 'Add Patient',
        fields: getFields(),
        onSubmit: async (data) => {
          await API.patients.create(data);
          Toast.success('Patient added successfully.');
          await load();
        },
      });
    });

    // Search
    document.getElementById('patientSearch').addEventListener('input', (e) => {
      _query = e.target.value.trim();
      render();
    });

    // Sort headers
    document.getElementById('patientsTable').querySelectorAll('th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (_sortKey === key) _sortAsc = !_sortAsc;
        else { _sortKey = key; _sortAsc = true; }
        render();
      });
    });

    // Table row actions (delegation)
    document.getElementById('patientsBody').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id     = parseInt(btn.dataset.id, 10);
      const action = btn.dataset.action;
      const record = _data.find((p) => p.id === id);
      if (!record) return;

      if (action === 'edit') {
        EntityModal.open({
          title: 'Edit Patient',
          fields: getFields(record),
          onSubmit: async (data) => {
            await API.patients.update(id, data);
            Toast.success('Patient updated.');
            await load();
          },
        });
      }

      if (action === 'delete') {
        const confirmed = await ConfirmModal.ask(`Delete patient "${record.fullName}"? This cannot be undone.`);
        if (!confirmed) return;
        try {
          await API.patients.delete(id);
          Toast.success('Patient deleted.');
          await load();
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }

  return { load, bindEvents };
})();
