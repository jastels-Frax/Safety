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

  // ── Draft persistence ────────────────────────────────────────

  const DRAFT_KEY = 'fraxinus_draft_toolbox';
  let draftRestored = false;
  let draftTimer = null;

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
        scheduleDraftSave();
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
      if (hazardTbody.rows.length > 1) { tr.remove(); scheduleDraftSave(); }
    });

    return tr;
  }

  hazardTbody.appendChild(buildHazardRow());

  $('add-hazard-btn').addEventListener('click', () => {
    const row = buildHazardRow();
    hazardTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── PPE custom items ─────────────────────────────────────────

  const ppeCustomList = $('ppe-custom-list');

  function buildPPECustomRow(label, checked) {
    const row = document.createElement('div');
    row.className = 'ppe-custom-row';
    row.innerHTML =
      '<input type="checkbox" class="ppe-custom-cb" aria-label="Include custom PPE item">' +
      '<input type="text" class="tbl-input ppe-custom-input" placeholder="Custom PPE item…" aria-label="Custom PPE item name">' +
      '<button type="button" class="btn-remove-row" aria-label="Remove custom PPE item">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';
    row.querySelector('.ppe-custom-cb').checked = (checked !== false);
    if (label) row.querySelector('.ppe-custom-input').value = label;
    row.querySelector('.btn-remove-row').addEventListener('click', () => { row.remove(); scheduleDraftSave(); });
    return row;
  }

  $('add-ppe-btn').addEventListener('click', () => {
    const row = buildPPECustomRow();
    ppeCustomList.appendChild(row);
    row.querySelector('.ppe-custom-input').focus();
    scheduleDraftSave();
  });

  // ── Sign-off table ───────────────────────────────────────────

  const signoffTbody = $('signoff-tbody');

  function buildSignoffRow(name, initials, date) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Full name…" aria-label="Name" autocomplete="name"></td>' +
      '<td><input type="text" class="tbl-input initials-input" placeholder="JD" maxlength="5" aria-label="Initials" autocomplete="off"></td>' +
      '<td><input type="date" class="tbl-input" value="' + todayISO() + '" aria-label="Sign-off date"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove sign-off row">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    const inputs = tr.querySelectorAll('input');
    if (name     !== undefined) inputs[0].value = name;
    if (initials !== undefined) inputs[1].value = initials;
    if (date     !== undefined) inputs[2].value = date;

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (signoffTbody.rows.length > 1) { tr.remove(); scheduleDraftSave(); }
    });

    return tr;
  }

  signoffTbody.appendChild(buildSignoffRow());
  signoffTbody.appendChild(buildSignoffRow());

  $('add-signoff-btn').addEventListener('click', () => {
    const row = buildSignoffRow();
    signoffTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Draft helpers ────────────────────────────────────────────

  function writeDraft() {
    const draft = {
      date:    $('tb-date').value,
      project: $('tb-project').value,
      initials: $('tb-initials').value,
      site:    $('tb-site').value,
      gps:     $('tb-gps').value,
      crew:    $('tb-crew').value,
      scope:   $('tb-scope').value,
      weather: $('tb-weather').value,
      comms:   $('tb-comms').value,
      hazards: Array.from(hazardTbody.rows).map(row => {
        const inp = row.querySelectorAll('input, select');
        return { hazard: inp[0].value, risk: inp[1].value, control: inp[2].value };
      }),
      stdPPE: Array.from(document.querySelectorAll('#ppe-list input[type="checkbox"]')).map(cb => ({
        value: cb.value, checked: cb.checked,
      })),
      customPPE: Array.from(ppeCustomList.querySelectorAll('.ppe-custom-row')).map(row => ({
        checked: row.querySelector('.ppe-custom-cb').checked,
        label:   row.querySelector('.ppe-custom-input').value,
      })),
      signoffs: Array.from(signoffTbody.rows).map(row => {
        const inp = row.querySelectorAll('input');
        return { name: inp[0].value, initials: inp[1].value, date: inp[2].value };
      }),
      extSignOns: Array.from(extSignonTbody.rows).map(row => {
        const inp = row.querySelectorAll('input');
        return { name: inp[0].value, company: inp[1].value, initials: inp[2].value, date: inp[3].value };
      }),
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* storage quota */ }
  }

  function scheduleDraftSave() {
    if (currentEditId !== null) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 500);
  }

  function showDraftBanner(text) {
    $('tb-draft-banner-text').textContent = text;
    $('tb-draft-banner').hidden = false;
  }

  function hideDraftBanner() {
    $('tb-draft-banner').hidden = true;
  }

  function restoreDraft(draft) {
    if (draft.date     !== undefined) $('tb-date').value     = draft.date;
    if (draft.project  !== undefined) $('tb-project').value  = draft.project;
    if (draft.initials !== undefined) $('tb-initials').value = draft.initials;
    if (draft.site     !== undefined) $('tb-site').value     = draft.site;
    if (draft.gps      !== undefined) $('tb-gps').value      = draft.gps;
    if (draft.crew     !== undefined) $('tb-crew').value     = draft.crew;
    if (draft.scope    !== undefined) $('tb-scope').value    = draft.scope;
    if (draft.weather  !== undefined) $('tb-weather').value  = draft.weather;
    if (draft.comms    !== undefined) $('tb-comms').value    = draft.comms;

    if (Array.isArray(draft.hazards) && draft.hazards.length) {
      while (hazardTbody.rows.length) hazardTbody.deleteRow(0);
      draft.hazards.forEach(h => {
        const row = buildHazardRow();
        const inp = row.querySelectorAll('input, select');
        inp[0].value = h.hazard  || '';
        inp[1].value = h.risk    || '';
        inp[2].value = h.control || '';
        applyRiskColor(inp[1]);
        hazardTbody.appendChild(row);
      });
      if (!hazardTbody.rows.length) hazardTbody.appendChild(buildHazardRow());
    }

    if (Array.isArray(draft.stdPPE)) {
      draft.stdPPE.forEach(item => {
        const cb = document.querySelector('#ppe-list input[value="' + item.value.replace(/"/g, '\\"') + '"]');
        if (cb) cb.checked = item.checked;
      });
    }

    if (Array.isArray(draft.customPPE)) {
      while (ppeCustomList.firstChild) ppeCustomList.removeChild(ppeCustomList.firstChild);
      draft.customPPE.forEach(item => {
        ppeCustomList.appendChild(buildPPECustomRow(item.label, item.checked));
      });
    }

    if (Array.isArray(draft.signoffs) && draft.signoffs.length) {
      while (signoffTbody.rows.length) signoffTbody.deleteRow(0);
      draft.signoffs.forEach(s => {
        signoffTbody.appendChild(buildSignoffRow(s.name, s.initials, s.date));
      });
      if (!signoffTbody.rows.length) {
        signoffTbody.appendChild(buildSignoffRow());
        signoffTbody.appendChild(buildSignoffRow());
      }
    }

    if (Array.isArray(draft.extSignOns)) {
      while (extSignonTbody.rows.length) extSignonTbody.deleteRow(0);
      draft.extSignOns.forEach(e => {
        const row = buildExtSignonRow();
        const inp = row.querySelectorAll('input');
        inp[0].value = e.name     || '';
        inp[1].value = e.company  || '';
        inp[2].value = e.initials || '';
        inp[3].value = e.date     || '';
        extSignonTbody.appendChild(row);
      });
      if (!extSignonTbody.rows.length) {
        extSignonTbody.appendChild(buildExtSignonRow());
        extSignonTbody.appendChild(buildExtSignonRow());
      }
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    hideDraftBanner();
  }

  function clearAllFormBanners() {
    currentEditId = null;
    localStorage.removeItem(DRAFT_KEY);
    hideDraftBanner();
    const editBanner = $('tb-edit-banner');
    if (editBanner) editBanner.hidden = true;
    const saveLabel = $('tb-save-label');
    if (saveLabel) saveLabel.textContent = 'Save Submission';
  }

  function isDraftMeaningful(draft) {
    return !!(draft.project || draft.site || draft.crew || draft.scope);
  }

  function resetToolboxForm() {
    // Fields
    $('tb-date').value     = todayISO();
    $('tb-project').value  = '';
    $('tb-initials').value = '';
    $('tb-site').value     = '';
    $('tb-gps').value      = '';
    $('tb-crew').value     = '';
    $('tb-scope').value    = '';
    $('tb-weather').value  = '';
    $('tb-comms').value    = '';
    $('tb-gps-label').textContent = 'Capture';

    // Hazard table — 1 blank row, Risk defaulting to Low
    while (hazardTbody.rows.length) hazardTbody.deleteRow(0);
    const blankHazard = buildHazardRow();
    const riskSel = blankHazard.querySelector('.risk-select');
    riskSel.value = 'Low';
    applyRiskColor(riskSel);
    hazardTbody.appendChild(blankHazard);

    // PPE
    while (ppeCustomList.firstChild) ppeCustomList.removeChild(ppeCustomList.firstChild);
    document.querySelectorAll('#ppe-list input[type="checkbox"]').forEach(cb => { cb.checked = false; });

    // Sign-off — 2 blank rows with empty dates
    while (signoffTbody.rows.length) signoffTbody.deleteRow(0);
    signoffTbody.appendChild(buildSignoffRow('', '', ''));
    signoffTbody.appendChild(buildSignoffRow('', '', ''));

    // Ext sign-on — 2 blank rows
    while (extSignonTbody.rows.length) extSignonTbody.deleteRow(0);
    extSignonTbody.appendChild(buildExtSignonRow());
    extSignonTbody.appendChild(buildExtSignonRow());

    // Clear banners, edit state, draft
    clearAllFormBanners();

    // Allow draft to be re-restored on next tab visit
    draftRestored = false;

    // Scroll to top of form
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  function maybeRestoreDraft() {
    if (draftRestored) return;
    draftRestored = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!isDraftMeaningful(draft)) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      restoreDraft(draft);
      showDraftBanner('Draft restored — tap Clear Draft to discard');
    } catch (e) { localStorage.removeItem(DRAFT_KEY); }
  }

  $('tb-clear-draft-btn').addEventListener('click', () => {
    resetToolboxForm();
  });

  // ── External / Contractor Sign-On table ──────────────────────

  const extSignonTbody = $('ext-signon-tbody');

  function buildExtSignonRow() {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Full name…" aria-label="Name" autocomplete="name"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Company…" aria-label="Company" autocomplete="organization"></td>' +
      '<td><input type="text" class="tbl-input initials-input" placeholder="JD" maxlength="5" aria-label="Initials" autocomplete="off"></td>' +
      '<td><input type="date" class="tbl-input" value="' + todayISO() + '" aria-label="Sign-on date"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove row">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (extSignonTbody.rows.length > 1) { tr.remove(); scheduleDraftSave(); }
    });

    return tr;
  }

  extSignonTbody.appendChild(buildExtSignonRow());
  extSignonTbody.appendChild(buildExtSignonRow());

  $('add-ext-signon-btn').addEventListener('click', () => {
    const row = buildExtSignonRow();
    extSignonTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Collect form data ────────────────────────────────────────

  function collectData() {
    const data = {
      date:             $('tb-date').value,
      project:          $('tb-project').value.trim(),
      initials:         $('tb-initials').value.trim().toUpperCase(),
      site:             $('tb-site').value.trim(),
      gps:              $('tb-gps').value.trim(),
      crew:             $('tb-crew').value.trim(),
      scope:            $('tb-scope').value.trim(),
      weather:          $('tb-weather').value.trim(),
      comms:            $('tb-comms').value.trim(),
      hazards:          [],
      ppe:              [],
      signoffs:         [],
      externalSignOns:  [],
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

    // External sign-ons — skip fully empty rows
    Array.from(extSignonTbody.rows).forEach(row => {
      const inputs   = row.querySelectorAll('input');
      const name     = inputs[0].value.trim();
      const company  = inputs[1].value.trim();
      const initials = inputs[2].value.trim().toUpperCase();
      const date     = inputs[3].value;
      if (name || company || initials) data.externalSignOns.push({ name, company, initials, date });
    });

    return data;
  }

  // ── Edit mode ────────────────────────────────────────────────

  let currentEditId = null;

  const editBanner     = $('tb-edit-banner');
  const editBannerText = $('tb-edit-banner-text');
  const saveLabel      = $('tb-save-label');

  const STD_PPE = new Set(
    Array.from(document.querySelectorAll('#ppe-list input[type="checkbox"]')).map(cb => cb.value)
  );

  function enterEditMode(rec) {
    const d = rec.data || {};
    currentEditId = rec.id;

    // Populate text fields
    $('tb-date').value     = d.date     || '';
    $('tb-project').value  = d.project  || '';
    $('tb-initials').value = d.initials || '';
    $('tb-site').value     = d.site     || '';
    $('tb-gps').value      = d.gps      || '';
    $('tb-crew').value     = d.crew     || '';
    $('tb-scope').value    = d.scope    || '';
    $('tb-weather').value  = d.weather  || '';
    $('tb-comms').value    = d.comms    || '';

    // Rebuild hazard table
    hazardTbody.innerHTML = '';
    const hazards = (d.hazards && d.hazards.length) ? d.hazards : [{}];
    hazards.forEach(h => {
      const row = buildHazardRow();
      const inputs = row.querySelectorAll('input, select');
      inputs[0].value = h.hazard  || '';
      inputs[1].value = h.risk    || '';
      inputs[2].value = h.control || '';
      applyRiskColor(inputs[1]);
      hazardTbody.appendChild(row);
    });

    // Standard PPE checkboxes
    document.querySelectorAll('#ppe-list input[type="checkbox"]').forEach(cb => {
      cb.checked = Array.isArray(d.ppe) && d.ppe.includes(cb.value);
    });

    // Custom PPE
    ppeCustomList.innerHTML = '';
    (Array.isArray(d.ppe) ? d.ppe : [])
      .filter(item => !STD_PPE.has(item))
      .forEach(item => {
        const row = buildPPECustomRow(item);
        ppeCustomList.appendChild(row);
      });

    // Sign-off rows
    signoffTbody.innerHTML = '';
    const signoffs = (d.signoffs && d.signoffs.length) ? d.signoffs : [{}, {}];
    signoffs.forEach(s => {
      const row = buildSignoffRow();
      const inputs = row.querySelectorAll('input');
      inputs[0].value = s.name     || '';
      inputs[1].value = s.initials || '';
      inputs[2].value = s.date     || '';
      signoffTbody.appendChild(row);
    });

    // External sign-on rows
    extSignonTbody.innerHTML = '';
    const extRows = (d.externalSignOns && d.externalSignOns.length) ? d.externalSignOns : [{}, {}];
    extRows.forEach(e => {
      const row = buildExtSignonRow();
      const inputs = row.querySelectorAll('input');
      inputs[0].value = e.name     || '';
      inputs[1].value = e.company  || '';
      inputs[2].value = e.initials || '';
      inputs[3].value = e.date     || '';
      extSignonTbody.appendChild(row);
    });

    // Banner and button
    editBannerText.textContent =
      'Editing saved submission from ' + (d.date || '—') + ' — ' + (d.project || '—') +
      '. Save Submission will overwrite the original.';
    editBanner.hidden    = false;
    saveLabel.textContent = 'Save Changes';

    document.getElementById('main-content').scrollTop = 0;
  }

  function exitEditMode() {
    currentEditId         = null;
    editBanner.hidden     = true;
    saveLabel.textContent = 'Save Submission';
  }

  // Expose so submissions.js can call it
  window.ToolboxForm = { loadForEdit: enterEditMode };

  // ── Toast notification ───────────────────────────────────────

  let toastTimer;

  function showToast(msg, type) {
    if (!msg || !msg.trim()) return;
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
      const data = collectData();
      if (currentEditId !== null) {
        await FraxinusDB.updateSubmission(currentEditId, data);
        showToast('Submission updated successfully');
        resetToolboxForm();
        document.querySelector('[data-tab="submissions"]').click();
      } else {
        await FraxinusDB.saveSubmission('toolbox', data);
        resetToolboxForm();
        showToast('Saved successfully');
      }
    } catch (err) {
      showToast('Save failed — ' + err.message, 'error');
      console.error('save:', err);
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
    const proj = (data.project || '').replace(/\b\d{4}(-\d{2}(-\d{2})?)?\b/g, '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
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

    if (d.externalSignOns && d.externalSignOns.length) {
      ctx.section('External / Contractor Sign-On');
      ctx.extSignonTable(d.externalSignOns);
    }

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
          if (!h.hazard && !h.control) return;
          guard(ROW_H);
          const textY = y + 9;
          const lineY = y + ROW_H;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(h.hazard || '', C1 + 2, textY);

          const risk = h.risk || '';
          const rc   = risk === 'High' ? [204,   0,   0]
                     : risk === 'Med'  ? [232, 115,  26]
                     : risk === 'Low'  ? [ 74, 124,  89]
                     : DARK;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...rc);
          doc.text(risk, C2 + 2, textY);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          doc.text(h.control || '', C3 + 2, textY);

          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(C1, lineY, C3 + W3, lineY);
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

        const ROW_H = 14;
        signoffs.forEach(s => {
          if (!s.name && !s.initials) return;
          guard(ROW_H);
          const textY = y + 9;
          const lineY = y + ROW_H;
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(s.name     || '', x + 2, textY); x += cols[0];
          doc.text(s.initials || '', x + 2, textY); x += cols[1];
          doc.text(s.date     || '', x + 2, textY);
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, lineY, ML + CW, lineY);
          y += ROW_H;
        });

        y += 2;
      },

      extSignonTable(rows) {
        if (!rows || !rows.length) return;

        const cols = [CW * 0.36, CW * 0.30, CW * 0.14, CW * 0.20];
        const hdrs = ['Name', 'Company', 'Initials', 'Date'];
        guard(10);

        doc.setFillColor(210, 210, 210);
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

        const ROW_H = 14;

        rows.forEach(s => {
          if (!s.name && !s.company) return;
          guard(ROW_H);
          const textY = y + 9;
          const lineY = y + ROW_H;
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(s.name     || '', x + 2, textY); x += cols[0];
          doc.text(s.company  || '', x + 2, textY); x += cols[1];
          doc.text(s.initials || '', x + 2, textY); x += cols[2];
          doc.text(s.date     || '', x + 2, textY);
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, lineY, ML + CW, lineY);
          y += ROW_H;
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

  // ── Form-level auto-save delegation ─────────────────────────

  const tbForm = $('toolbox-form');
  tbForm.addEventListener('input',  scheduleDraftSave);
  tbForm.addEventListener('change', scheduleDraftSave);

  // ── Restore draft on form activation ────────────────────────

  document.addEventListener('fraxinus-form-activate', e => {
    if (e.detail && e.detail.form === 'toolbox') maybeRestoreDraft();
  });

})();
