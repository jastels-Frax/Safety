/* ============================================================
   toolbox.js — Daily Toolbox Talk form
   Depends on: FraxinusDB (window.FraxinusDB from db.js)
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const todayISO = () => new Date().toISOString().slice(0, 10);

  // ── Default date ────────────────────────────────────────────

  $('tb-date').value = todayISO();

  // ── GPS capture ─────────────────────────────────────────────

  $('tb-gps-btn').addEventListener('click', function () {
    const field = $('tb-gps');
    const label = $('tb-gps-label');

    if (!navigator.geolocation) {
      field.value = 'Geolocation not supported on this device';
      return;
    }

    this.disabled = true;
    label.textContent = 'Locating…';

    navigator.geolocation.getCurrentPosition(
      pos => {
        field.value = pos.coords.latitude.toFixed(6) + ', ' + pos.coords.longitude.toFixed(6);
        this.disabled = false;
        label.textContent = 'Recapture';
      },
      err => {
        field.value = 'Location unavailable';
        this.disabled = false;
        label.textContent = 'Retry';
        console.warn('Geolocation error:', err.message);
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });

  // ── Hazard table ────────────────────────────────────────────

  const hazardTbody = $('hazard-tbody');

  function applyRiskColor(sel) {
    sel.classList.remove('risk-low', 'risk-med', 'risk-high');
    if (sel.value === 'Low')  sel.classList.add('risk-low');
    if (sel.value === 'Med')  sel.classList.add('risk-med');
    if (sel.value === 'High') sel.classList.add('risk-high');
  }

  function buildHazardRow() {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Describe hazard…" aria-label="Hazard"></td>' +
      '<td><select class="tbl-select risk-select" aria-label="Risk level">' +
        '<option value="">—</option>' +
        '<option value="Low">Low</option>' +
        '<option value="Med">Med</option>' +
        '<option value="High">High</option>' +
      '</select></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Control measure…" aria-label="Control measure"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove hazard row">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    tr.querySelector('.risk-select').addEventListener('change', function () {
      applyRiskColor(this);
    });

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (hazardTbody.rows.length > 1) tr.remove();
    });

    return tr;
  }

  hazardTbody.appendChild(buildHazardRow());

  $('add-hazard-btn').addEventListener('click', () => {
    const row = buildHazardRow();
    hazardTbody.appendChild(row);
    row.querySelector('input').focus();
  });

  // ── PPE custom items ─────────────────────────────────────────

  const ppeCustomList = $('ppe-custom-list');

  $('add-ppe-btn').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'ppe-custom-row';
    row.innerHTML =
      '<input type="checkbox" class="ppe-custom-cb" checked aria-label="Include custom PPE item">' +
      '<input type="text" class="tbl-input ppe-custom-input" placeholder="Custom PPE item…" aria-label="Custom PPE item name">' +
      '<button type="button" class="btn-remove-row" aria-label="Remove custom PPE item">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';

    row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
    ppeCustomList.appendChild(row);
    row.querySelector('.ppe-custom-input').focus();
  });

  // ── Sign-off table ───────────────────────────────────────────

  const signoffTbody = $('signoff-tbody');

  function buildSignoffRow() {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Full name…" aria-label="Name" autocomplete="name"></td>' +
      '<td><input type="text" class="tbl-input initials-input" placeholder="JD" maxlength="5" aria-label="Initials" autocomplete="off"></td>' +
      '<td><input type="date" class="tbl-input" value="' + todayISO() + '" aria-label="Sign-off date"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove sign-off row">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (signoffTbody.rows.length > 1) tr.remove();
    });

    return tr;
  }

  signoffTbody.appendChild(buildSignoffRow());
  signoffTbody.appendChild(buildSignoffRow());

  $('add-signoff-btn').addEventListener('click', () => {
    const row = buildSignoffRow();
    signoffTbody.appendChild(row);
    row.querySelector('input').focus();
  });

  // ── Collect form data ────────────────────────────────────────

  function collectData() {
    const data = {
      date:     $('tb-date').value,
      project:  $('tb-project').value.trim(),
      site:     $('tb-site').value.trim(),
      gps:      $('tb-gps').value.trim(),
      crew:     $('tb-crew').value.trim(),
      scope:    $('tb-scope').value.trim(),
      weather:  $('tb-weather').value.trim(),
      comms:    $('tb-comms').value.trim(),
      hazards:  [],
      ppe:      [],
      signoffs: [],
    };

    // Hazards — skip fully empty rows
    Array.from(hazardTbody.rows).forEach(row => {
      const inputs  = row.querySelectorAll('input, select');
      const hazard  = inputs[0].value.trim();
      const risk    = inputs[1].value;
      const control = inputs[2].value.trim();
      if (hazard || control) data.hazards.push({ hazard, risk, control });
    });

    // Standard PPE
    document.querySelectorAll('#ppe-list input[type="checkbox"]:checked').forEach(cb => {
      data.ppe.push(cb.value);
    });

    // Custom PPE
    ppeCustomList.querySelectorAll('.ppe-custom-row').forEach(row => {
      const checked = row.querySelector('.ppe-custom-cb').checked;
      const label   = row.querySelector('.ppe-custom-input').value.trim();
      if (checked && label) data.ppe.push(label);
    });

    // Sign-offs — skip fully empty rows
    Array.from(signoffTbody.rows).forEach(row => {
      const inputs   = row.querySelectorAll('input');
      const name     = inputs[0].value.trim();
      const initials = inputs[1].value.trim().toUpperCase();
      const date     = inputs[2].value;
      if (name || initials) data.signoffs.push({ name, initials, date });
    });

    return data;
  }

  // ── Toast notification ───────────────────────────────────────

  let toastTimer;

  function showToast(msg, type) {
    const toast = $('tb-toast');
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '') + ' toast--visible';
    toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
  }

  // ── Save to IndexedDB ────────────────────────────────────────

  $('tb-save-btn').addEventListener('click', async () => {
    const btn = $('tb-save-btn');
    btn.disabled = true;
    try {
      await FraxinusDB.saveSubmission('toolbox', collectData());
      showToast('Saved successfully');
    } catch (err) {
      showToast('Save failed — ' + err.message, 'error');
      console.error('saveSubmission:', err);
    } finally {
      btn.disabled = false;
    }
  });

  // ── Export JSON ──────────────────────────────────────────────

  $('tb-export-btn').addEventListener('click', () => {
    const data = collectData();
    const payload = Object.assign({ type: 'toolbox', exportedAt: new Date().toISOString() }, data);
    const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    const slug    = (data.project || 'toolbox').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    a.href        = url;
    a.download    = 'toolbox_' + (data.date || todayISO()) + '_' + slug + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

})();
