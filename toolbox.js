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
      initials: $('tb-initials').value.trim().toUpperCase(),
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

  // ── Export PDF ───────────────────────────────────────────────

  $('tb-pdf-btn').addEventListener('click', () => {
    const data = collectData();
    const doc  = buildToolboxPDF(data);
    doc.save(pdfFilename('ToolboxTalk', data));
  });

  function pdfFilename(type, data) {
    const date = data.date || todayISO();
    const proj = (data.project || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const init = (data.initials || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    const parts = ['Fraxinus', type, date];
    if (proj) parts.push(proj);
    if (init) parts.push(init);
    return parts.join('_') + '.pdf';
  }

  function buildToolboxPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc);

    ctx.docHeader('Daily Toolbox Talk');

    ctx.section('Site Information');
    ctx.field('Date',                  d.date);
    ctx.field('Project Name / Number', d.project);
    ctx.field('Site / Location',       d.site);
    ctx.field('GPS Coordinates',       d.gps);

    ctx.section('Crew & Operations');
    ctx.field('Field Crew',            d.crew);
    ctx.field('Scope of Work',         d.scope);
    ctx.field('Weather Conditions',    d.weather);
    ctx.field('Communication Plan',    d.comms);

    ctx.section('Hazard Identification');
    ctx.hazardTable(d.hazards);

    ctx.section('PPE Checklist');
    ctx.ppeGrid(d.ppe);

    ctx.section('Sign-Off');
    ctx.signoffTable(d.signoffs);

    ctx.pageFooters();
    return doc;
  }

  function pdfCtx(doc) {
    const W  = doc.internal.pageSize.getWidth();
    const H  = doc.internal.pageSize.getHeight();
    const ML = 15, MR = 15, MB = 20;
    const CW = W - ML - MR;

    const ORANGE = [232, 115, 26];
    const DARK   = [28,  26,  22];
    const DGRAY  = [107, 100, 87];
    const LGRAY  = [200, 195, 188];
    const BGRAY  = [242, 239, 235];

    let y = 20;
    let firstSection = true;

    function guard(need) {
      if (y + need > H - MB) { doc.addPage(); y = 15; }
    }

    return {
      docHeader(formTitle) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(...ORANGE);
        doc.text('Fraxinus Environmental & Geomatics', ML, y);
        y += 9;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        doc.setTextColor(...DARK);
        doc.text(formTitle, ML, y);
        y += 5;

        doc.setDrawColor(...ORANGE);
        doc.setLineWidth(0.6);
        doc.line(ML, y, W - MR, y);
        y += 9;
      },

      section(title) {
        if (firstSection) { firstSection = false; } else { y += 5; }
        guard(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...DGRAY);
        doc.text(title.toUpperCase(), ML, y);
        doc.setDrawColor(...LGRAY);
        doc.setLineWidth(0.25);
        doc.line(ML, y + 1.5, W - MR, y + 1.5);
        y += 7;
      },

      field(label, value) {
        const val   = (value == null || value === '') ? '—' : String(value);
        const LW    = 58;
        const lines = doc.splitTextToSize(val, CW - LW);
        const rowH  = Math.max(lines.length * 4.5, 5);
        guard(rowH + 3);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...DGRAY);
        doc.text(label, ML, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text(lines, ML + LW, y);

        y += rowH + 1.5;
      },

      hazardTable(hazards) {
        if (!hazards || !hazards.length) {
          guard(6);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(...DGRAY);
          doc.text('No hazards recorded', ML, y);
          y += 6;
          return;
        }

        const C1 = 14, C2 = 100, C3 = 136, W3 = 60;
        const ROW_H = 14;
        guard(ROW_H + 4);

        doc.setFillColor(230, 230, 230);
        doc.rect(C1, y - 5, (C3 + W3) - C1, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        doc.text('Hazard',          C1 + 2, y);
        doc.text('Risk Level',      C2 + 2, y);
        doc.text('Control Measure', C3 + 2, y);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.25);
        doc.line(C1, y + 2, C3 + W3, y + 2);
        y += ROW_H;

        hazards.forEach(h => {
          guard(ROW_H);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(h.hazard || '—', C1 + 2, y);

          const risk = h.risk || '';
          const rc   = risk === 'High' ? [204,   0,   0]
                     : risk === 'Med'  ? [232, 115,  26]
                     : risk === 'Low'  ? [ 74, 124,  89]
                     : DARK;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...rc);
          doc.text(risk || '—', C2 + 2, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          doc.text(h.control || '—', C3 + 2, y);

          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.15);
          doc.line(C1, y + 2, C3 + W3, y + 2);
          y += ROW_H;
        });

        y += 2;
      },

      ppeGrid(ppe) {
        if (!ppe || !ppe.length) {
          guard(6);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(...DGRAY);
          doc.text('No PPE items selected', ML, y);
          y += 6;
          return;
        }

        const colX = [14, 80, 146];
        let col = 0;

        ppe.forEach(item => {
          if (col === 0) guard(10);
          const x = colX[col];
          doc.setDrawColor(100, 100, 100);
          doc.setLineWidth(0.3);
          doc.rect(x, y - 3, 4, 4);
          doc.line(x,     y - 3, x + 4, y + 1);
          doc.line(x + 4, y - 3, x,     y + 1);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...DARK);
          doc.text(item, x + 7, y);
          col++;
          if (col >= 3) { col = 0; y += 10; }
        });
        if (col > 0) y += 10;
        y += 2;
      },

      signoffTable(signoffs) {
        if (!signoffs || !signoffs.length) {
          guard(6);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(...DGRAY);
          doc.text('No sign-offs recorded', ML, y);
          y += 6;
          return;
        }

        const cols = [CW * 0.50, CW * 0.18, CW * 0.32];
        const hdrs = ['Name', 'Initials', 'Date'];
        guard(10);

        doc.setFillColor(...BGRAY);
        doc.rect(ML, y - 4, CW, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        let x = ML;
        hdrs.forEach((h, i) => { doc.text(h, x + 2, y); x += cols[i]; });
        doc.setDrawColor(...LGRAY);
        doc.setLineWidth(0.25);
        doc.line(ML, y + 2, ML + CW, y + 2);
        y += 6;

        signoffs.forEach(s => {
          guard(6);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(s.name     || '—', x + 2, y); x += cols[0];
          doc.text(s.initials || '—', x + 2, y); x += cols[1];
          doc.text(s.date     || '—', x + 2, y);
          y += 5.5;
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, y - 0.5, ML + CW, y - 0.5);
        });

        y += 2;
      },

      pageFooters() {
        const n = doc.internal.getNumberOfPages();
        for (let i = 1; i <= n; i++) {
          doc.setPage(i);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...DGRAY);
          doc.text('Fraxinus Environmental & Geomatics', ML, H - 9);
          doc.text(
            'Page ' + i + ' of ' + n + '  •  ' + new Date().toLocaleDateString(),
            W - MR, H - 9, { align: 'right' }
          );
        }
      },
    };
  }

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
