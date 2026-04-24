/* ============================================================
   jsha.js — Job Specific Hazard Assessment form
   Depends on: FraxinusDB (window.FraxinusDB from db.js)
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const todayISO = () => new Date().toISOString().slice(0, 10);

  // ── Default date ────────────────────────────────────────────

  $('jsha-date').value = todayISO();

  // ── GPS capture ─────────────────────────────────────────────

  $('jsha-gps-btn').addEventListener('click', function () {
    const field = $('jsha-gps');
    const label = $('jsha-gps-label');

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

  // ── Hazard table ─────────────────────────────────────────────

  const hazardTbody = $('jsha-hazard-tbody');

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

  $('jsha-add-hazard-btn').addEventListener('click', () => {
    const row = buildHazardRow();
    hazardTbody.appendChild(row);
    row.querySelector('input').focus();
  });

  // ── PPE custom items ─────────────────────────────────────────

  const ppeCustomList = $('jsha-ppe-custom-list');

  $('jsha-add-ppe-btn').addEventListener('click', () => {
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

  // ── Collect form data ────────────────────────────────────────

  function collectData() {
    const data = {
      date:    $('jsha-date').value,
      project: $('jsha-project').value.trim(),
      site:    $('jsha-site').value.trim(),
      gps:     $('jsha-gps').value.trim(),
      scope:   $('jsha-scope').value.trim(),

      emergencyContacts: {
        policeFireAmbulance:   '911',
        poisonControl:         '1-800-565-8161',
        crewContactName:       $('jsha-crew-name').value.trim(),
        crewContactPhone:      $('jsha-crew-phone').value.trim(),
        projectManagerName:    $('jsha-pm-name').value.trim(),
        projectManagerPhone:   $('jsha-pm-phone').value.trim(),
        healthSafetyRep:       $('jsha-hs-rep').value.trim(),
        nearestHospital:       $('jsha-hospital').value.trim(),
      },

      hazards:  [],
      ppe:      [],
      comments: $('jsha-comments').value.trim(),
    };

    // Hazard rows — skip fully empty
    Array.from(hazardTbody.rows).forEach(row => {
      const inputs  = row.querySelectorAll('input, select');
      const hazard  = inputs[0].value.trim();
      const risk    = inputs[1].value;
      const control = inputs[2].value.trim();
      if (hazard || control) data.hazards.push({ hazard, risk, control });
    });

    // Standard PPE
    document.querySelectorAll('#jsha-ppe-list input[type="checkbox"]:checked').forEach(cb => {
      data.ppe.push(cb.value);
    });

    // Custom PPE
    ppeCustomList.querySelectorAll('.ppe-custom-row').forEach(row => {
      const checked = row.querySelector('.ppe-custom-cb').checked;
      const label   = row.querySelector('.ppe-custom-input').value.trim();
      if (checked && label) data.ppe.push(label);
    });

    return data;
  }

  // ── Toast ────────────────────────────────────────────────────

  let toastTimer;

  function showToast(msg, type) {
    const toast = $('jsha-toast');
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '') + ' toast--visible';
    toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
  }

  // ── Save to IndexedDB ────────────────────────────────────────

  $('jsha-save-btn').addEventListener('click', async () => {
    const btn = $('jsha-save-btn');
    btn.disabled = true;
    try {
      await FraxinusDB.saveSubmission('jsha', collectData());
      showToast('Saved successfully');
    } catch (err) {
      showToast('Save failed — ' + err.message, 'error');
      console.error('saveSubmission:', err);
    } finally {
      btn.disabled = false;
    }
  });

  // ── Export PDF ───────────────────────────────────────────────

  $('jsha-pdf-btn').addEventListener('click', () => {
    const view = buildPrintView('Job Specific Hazard Assessment', buildJSHAContent(collectData()));
    document.body.appendChild(view);
    window.print();
    view.remove();
  });

  function pvEsc(s) {
    if (s == null || s === '') return '<em class="pv-empty">—</em>';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  function buildPrintView(title, contentHtml) {
    const div = document.createElement('div');
    div.id = 'print-view';
    div.innerHTML =
      '<div class="pv-letterhead">' +
        '<div class="pv-company">Fraxinus Environmental &amp; Geomatics</div>' +
        '<div class="pv-form-title">' + title + '</div>' +
      '</div>' +
      contentHtml +
      '<div class="pv-footer">Printed: ' + new Date().toLocaleString() + '</div>';
    return div;
  }

  function buildJSHAContent(d) {
    const ec = d.emergencyContacts;

    let html =
      '<section class="pv-section">' +
        '<h2>Site Information</h2>' +
        '<dl class="pv-dl">' +
          '<dt>Date</dt><dd>' + pvEsc(d.date) + '</dd>' +
          '<dt>Project Name / Number</dt><dd>' + pvEsc(d.project) + '</dd>' +
          '<dt>Site / Location</dt><dd>' + pvEsc(d.site) + '</dd>' +
          '<dt>GPS Coordinates</dt><dd>' + pvEsc(d.gps) + '</dd>' +
          '<dt>Scope of Work</dt><dd>' + pvEsc(d.scope) + '</dd>' +
        '</dl>' +
      '</section>';

    const crewEntry  = ec.crewContactName  + (ec.crewContactPhone  ? ' — ' + ec.crewContactPhone  : '');
    const pmEntry    = ec.projectManagerName + (ec.projectManagerPhone ? ' — ' + ec.projectManagerPhone : '');

    html +=
      '<section class="pv-section">' +
        '<h2>Emergency Contacts</h2>' +
        '<dl class="pv-dl">' +
          '<dt>Police / Fire / Ambulance</dt><dd>911</dd>' +
          '<dt>Poison Control</dt><dd>1-800-565-8161</dd>' +
          '<dt>Field Crew Contact</dt><dd>' + pvEsc(crewEntry || '') + '</dd>' +
          '<dt>Project Manager</dt><dd>' + pvEsc(pmEntry || '') + '</dd>' +
          '<dt>Health &amp; Safety Rep</dt><dd>' + pvEsc(ec.healthSafetyRep) + '</dd>' +
          '<dt>Nearest Hospital</dt><dd>' + pvEsc(ec.nearestHospital) + '</dd>' +
        '</dl>' +
      '</section>';

    html += '<section class="pv-section"><h2>Hazard Identification</h2>';
    if (d.hazards.length) {
      html += '<table class="pv-table"><thead><tr><th>Hazard</th><th>Risk Level</th><th>Control Measure</th></tr></thead><tbody>';
      d.hazards.forEach(h => {
        const riskClass = 'pv-risk-' + (h.risk || 'none').toLowerCase();
        html += '<tr><td>' + pvEsc(h.hazard) + '</td>' +
                '<td class="pv-risk ' + riskClass + '">' + pvEsc(h.risk || '—') + '</td>' +
                '<td>' + pvEsc(h.control) + '</td></tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<p class="pv-empty">No hazards recorded.</p>';
    }
    html += '</section>';

    html += '<section class="pv-section"><h2>PPE Checklist</h2>';
    if (d.ppe.length) {
      html += '<ul class="pv-ppe">';
      d.ppe.forEach(item => { html += '<li>' + pvEsc(item) + '</li>'; });
      html += '</ul>';
    } else {
      html += '<p class="pv-empty">No PPE items selected.</p>';
    }
    html += '</section>';

    if (d.comments) {
      html += '<section class="pv-section"><h2>Additional Comments</h2><p>' + pvEsc(d.comments) + '</p></section>';
    }

    return html;
  }

  // ── Export JSON ──────────────────────────────────────────────

  $('jsha-export-btn').addEventListener('click', () => {
    const data    = collectData();
    const payload = Object.assign({ type: 'jsha', exportedAt: new Date().toISOString() }, data);
    const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    const slug    = (data.project || 'jsha').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    a.href        = url;
    a.download    = 'jsha_' + (data.date || todayISO()) + '_' + slug + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

})();
