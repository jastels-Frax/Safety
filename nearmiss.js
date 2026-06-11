/* ============================================================
   nearmiss.js — Combined Safety Report (Near-Miss / Incident)
   Depends on: FraxinusDB (window.FraxinusDB from db.js)
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const todayISO    = () => new Date().toISOString().slice(0, 10);
  const nowDatetime = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                              .toISOString().slice(0, 16);

  $('sr-datetime').value = nowDatetime();

  // ── State ────────────────────────────────────────────────────

  const DRAFT_KEY   = 'fraxinus_draft_safety_report';
  let draftRestored = false;
  let draftTimer    = null;
  let currentEditId = null;

  // ── Report type toggle ───────────────────────────────────────

  const srForm = $('sr-form');

  function setReportType(type) {
    srForm.dataset.reportType = type;
    const nmRadio  = $('sr-type-nearmiss');
    const incRadio = $('sr-type-incident');
    if (nmRadio)  nmRadio.checked  = (type === 'nearmiss');
    if (incRadio) incRadio.checked = (type === 'incident');
  }

  setReportType('nearmiss');

  document.querySelectorAll('input[name="reportType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) { setReportType(radio.value); scheduleDraftSave(); }
    });
  });

  // ── GPS capture ──────────────────────────────────────────────

  $('sr-gps-btn').addEventListener('click', function () {
    const field = $('sr-gps');
    const label = $('sr-gps-label');

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

  // ── Person(s) Involved table ─────────────────────────────────

  const personsTbody = $('sr-persons-tbody');

  function buildPersonRow(name, jobTitle, company, contact) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Full name…" aria-label="Name" autocomplete="name"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Role…" aria-label="Job title or role" autocomplete="off"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Company…" aria-label="Company" autocomplete="off"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Phone or email…" aria-label="Contact" autocomplete="off"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove person">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    const inputs = tr.querySelectorAll('input');
    if (name     !== undefined) inputs[0].value = name;
    if (jobTitle !== undefined) inputs[1].value = jobTitle;
    if (company  !== undefined) inputs[2].value = company;
    if (contact  !== undefined) inputs[3].value = contact;

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (personsTbody.rows.length > 1) { tr.remove(); scheduleDraftSave(); }
    });

    return tr;
  }

  personsTbody.appendChild(buildPersonRow());
  personsTbody.appendChild(buildPersonRow());

  $('sr-add-person-btn').addEventListener('click', () => {
    const row = buildPersonRow();
    personsTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Witnesses table ──────────────────────────────────────────

  const witnessesTbody = $('sr-witnesses-tbody');

  function buildWitnessRow(name, contact) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Full name…" aria-label="Witness name" autocomplete="name"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Phone or email…" aria-label="Witness contact" autocomplete="off"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove witness">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    const inputs = tr.querySelectorAll('input');
    if (name    !== undefined) inputs[0].value = name;
    if (contact !== undefined) inputs[1].value = contact;

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (witnessesTbody.rows.length > 1) { tr.remove(); scheduleDraftSave(); }
    });

    return tr;
  }

  witnessesTbody.appendChild(buildWitnessRow());

  $('sr-add-witness-btn').addEventListener('click', () => {
    const row = buildWitnessRow();
    witnessesTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Corrective actions table ─────────────────────────────────

  const correctiveTbody = $('sr-corrective-tbody');

  function buildCorrectiveRow(action, responsible, targetDate) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Describe action required…" aria-label="Action required" autocomplete="off"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Name or role…" aria-label="Responsible person" autocomplete="off"></td>' +
      '<td><input type="date" class="tbl-input" aria-label="Target completion date"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove corrective action row">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></td>';

    const inputs = tr.querySelectorAll('input');
    if (action      !== undefined) inputs[0].value = action;
    if (responsible !== undefined) inputs[1].value = responsible;
    if (targetDate  !== undefined) inputs[2].value = targetDate;

    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (correctiveTbody.rows.length > 1) { tr.remove(); scheduleDraftSave(); }
    });

    return tr;
  }

  correctiveTbody.appendChild(buildCorrectiveRow());
  correctiveTbody.appendChild(buildCorrectiveRow());

  $('sr-add-corrective-btn').addEventListener('click', () => {
    const row = buildCorrectiveRow();
    correctiveTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Sign-off table ───────────────────────────────────────────

  const signoffTbody = $('sr-signoff-tbody');

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

  $('sr-add-signoff-btn').addEventListener('click', () => {
    const row = buildSignoffRow();
    signoffTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── "Other" factor checkbox toggles ─────────────────────────

  ['env', 'human', 'equip', 'org'].forEach(g => {
    const cb  = $('sr-factor-' + g + '-other-cb');
    const txt = $('sr-factor-' + g + '-other-txt');
    if (cb && txt) {
      cb.addEventListener('change', () => {
        txt.hidden = !cb.checked;
        if (!cb.checked) txt.value = '';
        scheduleDraftSave();
      });
    }
  });

  // ── Draft helpers ────────────────────────────────────────────

  function checkedValues(selector) {
    return Array.from(document.querySelectorAll(selector))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }

  function factorValues(groupSelector, otherTxtId) {
    const vals     = checkedValues(groupSelector);
    const otherTxt = $(otherTxtId);
    if (vals.includes('Other') && otherTxt && otherTxt.value.trim()) {
      return vals.map(v => v === 'Other' ? 'Other: ' + otherTxt.value.trim() : v);
    }
    return vals;
  }

  function getReportType() {
    return srForm.dataset.reportType || 'nearmiss';
  }

  function writeDraft() {
    const draft = {
      reportType:       getReportType(),
      datetime:         $('sr-datetime').value,
      project:          $('sr-project').value,
      site:             $('sr-site').value,
      gps:              $('sr-gps').value,
      reporter:         $('sr-reporter').value,
      supervisor:       $('sr-supervisor').value,
      incidentType:     $('sr-incident-type').value,
      nearMissType:     $('sr-nearmiss-type').value,
      activity:         $('sr-activity').value,
      description:      $('sr-description').value,
      conditions:       $('sr-conditions').value,
      severity:         $('sr-severity').value,
      potentialHarm:    $('sr-potential-harm').value,
      injuryNature:     $('sr-injury-nature').value,
      bodyPart:         $('sr-body-part').value,
      medicalTreatment: $('sr-medical-treatment').value,
      wcbReportable:    $('sr-wcb').value,
      damageDesc:       $('sr-damage-desc').value,
      damageCost:       $('sr-damage-cost').value,
      immediateActions: $('sr-actions').value,
      additionalNotes:  $('sr-additional-notes').value,
      factors: {
        env:   factorValues('#sr-factors-env   input[type="checkbox"]', 'sr-factor-env-other-txt'),
        human: factorValues('#sr-factors-human input[type="checkbox"]', 'sr-factor-human-other-txt'),
        equip: factorValues('#sr-factors-equip input[type="checkbox"]', 'sr-factor-equip-other-txt'),
        org:   factorValues('#sr-factors-org   input[type="checkbox"]', 'sr-factor-org-other-txt'),
      },
      persons: Array.from(personsTbody.rows).map(row => {
        const i = row.querySelectorAll('input');
        return { name: i[0].value, jobTitle: i[1].value, company: i[2].value, contact: i[3].value };
      }),
      witnesses: Array.from(witnessesTbody.rows).map(row => {
        const i = row.querySelectorAll('input');
        return { name: i[0].value, contact: i[1].value };
      }),
      correctiveActions: Array.from(correctiveTbody.rows).map(row => {
        const inp = row.querySelectorAll('input');
        return { action: inp[0].value, responsible: inp[1].value, targetDate: inp[2].value };
      }),
      signOffs: Array.from(signoffTbody.rows).map(row => {
        const inp = row.querySelectorAll('input');
        return { name: inp[0].value, initials: inp[1].value, date: inp[2].value };
      }),
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* quota */ }
  }

  function scheduleDraftSave() {
    if (currentEditId !== null) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 500);
  }

  function showDraftBanner(text) {
    $('sr-draft-banner-text').textContent = text;
    $('sr-draft-banner').hidden = false;
  }

  function hideDraftBanner() {
    $('sr-draft-banner').hidden = true;
  }

  function restoreCheckboxGroup(selector, values) {
    if (!Array.isArray(values)) return;
    document.querySelectorAll(selector).forEach(cb => {
      if (cb.value === 'Other') {
        cb.checked = values.some(v => v === 'Other' || v.startsWith('Other: '));
      } else {
        cb.checked = values.includes(cb.value);
      }
    });
  }

  function restoreOtherInput(cbId, txtId, values) {
    const cb = $(cbId), txt = $(txtId);
    if (!cb || !txt || !Array.isArray(values)) return;
    const otherVal = values.find(v => v.startsWith('Other: '));
    if (otherVal) {
      cb.checked = true; txt.value = otherVal.slice(7); txt.hidden = false;
    } else if (values.includes('Other')) {
      cb.checked = true; txt.hidden = false;
    } else {
      txt.hidden = true; txt.value = '';
    }
  }

  function restoreDraft(draft) {
    if (draft.reportType      !== undefined) setReportType(draft.reportType);
    if (draft.datetime        !== undefined) $('sr-datetime').value          = draft.datetime;
    if (draft.project         !== undefined) $('sr-project').value           = draft.project;
    if (draft.site            !== undefined) $('sr-site').value              = draft.site;
    if (draft.gps             !== undefined) $('sr-gps').value               = draft.gps;
    if (draft.reporter        !== undefined) $('sr-reporter').value          = draft.reporter;
    if (draft.supervisor      !== undefined) $('sr-supervisor').value        = draft.supervisor;
    if (draft.incidentType    !== undefined) $('sr-incident-type').value     = draft.incidentType;
    if (draft.nearMissType    !== undefined) $('sr-nearmiss-type').value     = draft.nearMissType;
    if (draft.activity        !== undefined) $('sr-activity').value          = draft.activity;
    if (draft.description     !== undefined) $('sr-description').value       = draft.description;
    if (draft.conditions      !== undefined) $('sr-conditions').value        = draft.conditions;
    if (draft.severity        !== undefined) $('sr-severity').value          = draft.severity;
    if (draft.potentialHarm   !== undefined) $('sr-potential-harm').value    = draft.potentialHarm;
    if (draft.injuryNature    !== undefined) $('sr-injury-nature').value     = draft.injuryNature;
    if (draft.bodyPart        !== undefined) $('sr-body-part').value         = draft.bodyPart;
    if (draft.medicalTreatment !== undefined) $('sr-medical-treatment').value = draft.medicalTreatment;
    if (draft.wcbReportable   !== undefined) $('sr-wcb').value               = draft.wcbReportable;
    if (draft.damageDesc      !== undefined) $('sr-damage-desc').value       = draft.damageDesc;
    if (draft.damageCost      !== undefined) $('sr-damage-cost').value       = draft.damageCost;
    if (draft.immediateActions !== undefined) $('sr-actions').value          = draft.immediateActions;
    if (draft.additionalNotes  !== undefined) $('sr-additional-notes').value = draft.additionalNotes;

    if (draft.factors) {
      restoreCheckboxGroup('#sr-factors-env   input[type="checkbox"]', draft.factors.env);
      restoreCheckboxGroup('#sr-factors-human input[type="checkbox"]', draft.factors.human);
      restoreCheckboxGroup('#sr-factors-equip input[type="checkbox"]', draft.factors.equip);
      restoreCheckboxGroup('#sr-factors-org   input[type="checkbox"]', draft.factors.org);
      restoreOtherInput('sr-factor-env-other-cb',   'sr-factor-env-other-txt',   draft.factors.env);
      restoreOtherInput('sr-factor-human-other-cb', 'sr-factor-human-other-txt', draft.factors.human);
      restoreOtherInput('sr-factor-equip-other-cb', 'sr-factor-equip-other-txt', draft.factors.equip);
      restoreOtherInput('sr-factor-org-other-cb',   'sr-factor-org-other-txt',   draft.factors.org);
    }

    function restoreTable(tbody, rows, buildFn, defaultCount) {
      if (!Array.isArray(rows) || !rows.length) return;
      while (tbody.rows.length) tbody.deleteRow(0);
      rows.forEach(r => tbody.appendChild(buildFn(...Object.values(r))));
      if (!tbody.rows.length) {
        for (let i = 0; i < defaultCount; i++) tbody.appendChild(buildFn());
      }
    }

    restoreTable(personsTbody,    draft.persons,           (n, j, c, ct) => buildPersonRow(n, j, c, ct),   2);
    restoreTable(witnessesTbody,  draft.witnesses,         (n, c)        => buildWitnessRow(n, c),          1);
    restoreTable(correctiveTbody, draft.correctiveActions, (a, r, t)     => buildCorrectiveRow(a, r, t),    2);
    restoreTable(signoffTbody,    draft.signOffs,          (n, i, d)     => buildSignoffRow(n, i, d),       2);
  }

  function clearAllBanners() {
    localStorage.removeItem(DRAFT_KEY);
    hideDraftBanner();
    $('sr-edit-banner').hidden = true;
    $('sr-save-label').textContent = 'Save Submission';
  }

  function isDraftMeaningful(draft) {
    return !!(draft.project || draft.site || draft.description || draft.reporter);
  }

  function resetForm() {
    setReportType('nearmiss');
    $('sr-datetime').value          = nowDatetime();
    $('sr-project').value           = '';
    $('sr-site').value              = '';
    $('sr-gps').value               = '';
    $('sr-gps-label').textContent   = 'Capture';
    $('sr-reporter').value          = '';
    $('sr-supervisor').value        = '';
    $('sr-incident-type').value     = '';
    $('sr-nearmiss-type').value     = '';
    $('sr-activity').value          = '';
    $('sr-description').value       = '';
    $('sr-conditions').value        = '';
    $('sr-severity').value          = '';
    $('sr-potential-harm').value    = '';
    $('sr-injury-nature').value     = '';
    $('sr-body-part').value         = '';
    $('sr-medical-treatment').value = '';
    $('sr-wcb').value               = '';
    $('sr-damage-desc').value       = '';
    $('sr-damage-cost').value       = '';
    $('sr-actions').value           = '';
    $('sr-additional-notes').value  = '';

    document.querySelectorAll(
      '#sr-factors-env input[type="checkbox"], #sr-factors-human input[type="checkbox"], ' +
      '#sr-factors-equip input[type="checkbox"], #sr-factors-org input[type="checkbox"]'
    ).forEach(cb => { cb.checked = false; });

    ['env', 'human', 'equip', 'org'].forEach(g => {
      const txt = $('sr-factor-' + g + '-other-txt');
      if (txt) { txt.value = ''; txt.hidden = true; }
    });

    while (personsTbody.rows.length)    personsTbody.deleteRow(0);
    personsTbody.appendChild(buildPersonRow());
    personsTbody.appendChild(buildPersonRow());

    while (witnessesTbody.rows.length)  witnessesTbody.deleteRow(0);
    witnessesTbody.appendChild(buildWitnessRow());

    while (correctiveTbody.rows.length) correctiveTbody.deleteRow(0);
    correctiveTbody.appendChild(buildCorrectiveRow());
    correctiveTbody.appendChild(buildCorrectiveRow());

    while (signoffTbody.rows.length)    signoffTbody.deleteRow(0);
    signoffTbody.appendChild(buildSignoffRow());
    signoffTbody.appendChild(buildSignoffRow());

    currentEditId = null;
    clearAllBanners();
    draftRestored = false;

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
      if (!isDraftMeaningful(draft)) { localStorage.removeItem(DRAFT_KEY); return; }
      restoreDraft(draft);
      showDraftBanner('Draft restored — tap Clear Draft to discard');
    } catch (e) { localStorage.removeItem(DRAFT_KEY); }
  }

  $('sr-clear-draft-btn').addEventListener('click', resetForm);

  // ── Collect form data ────────────────────────────────────────

  function collectData() {
    const rt   = getReportType();
    const data = {
      reportType:       rt,
      datetime:         $('sr-datetime').value,
      project:          $('sr-project').value.trim(),
      site:             $('sr-site').value.trim(),
      gps:              $('sr-gps').value.trim(),
      reporter:         $('sr-reporter').value.trim(),
      supervisor:       $('sr-supervisor').value.trim(),
      activity:         $('sr-activity').value.trim(),
      description:      $('sr-description').value.trim(),
      conditions:       $('sr-conditions').value.trim(),
      immediateActions: $('sr-actions').value.trim(),
      additionalNotes:  $('sr-additional-notes').value.trim(),
      factors: {
        env:   factorValues('#sr-factors-env   input[type="checkbox"]', 'sr-factor-env-other-txt'),
        human: factorValues('#sr-factors-human input[type="checkbox"]', 'sr-factor-human-other-txt'),
        equip: factorValues('#sr-factors-equip input[type="checkbox"]', 'sr-factor-equip-other-txt'),
        org:   factorValues('#sr-factors-org   input[type="checkbox"]', 'sr-factor-org-other-txt'),
      },
      correctiveActions: [],
      signOffs:          [],
    };

    if (rt === 'nearmiss') {
      data.type          = $('sr-nearmiss-type').value;
      data.severity      = $('sr-severity').value;
      data.potentialHarm = $('sr-potential-harm').value.trim();
    } else {
      data.type             = $('sr-incident-type').value;
      data.injuryNature     = $('sr-injury-nature').value.trim();
      data.bodyPart         = $('sr-body-part').value.trim();
      data.medicalTreatment = $('sr-medical-treatment').value;
      data.wcbReportable    = $('sr-wcb').value;
      data.damageDesc       = $('sr-damage-desc').value.trim();
      data.damageCost       = $('sr-damage-cost').value.trim();
      data.persons          = [];
      data.witnesses        = [];

      Array.from(personsTbody.rows).forEach(row => {
        const i = row.querySelectorAll('input');
        const name = i[0].value.trim(), jobTitle = i[1].value.trim(),
              company = i[2].value.trim(), contact = i[3].value.trim();
        if (name || jobTitle) data.persons.push({ name, jobTitle, company, contact });
      });

      Array.from(witnessesTbody.rows).forEach(row => {
        const i = row.querySelectorAll('input');
        const name = i[0].value.trim(), contact = i[1].value.trim();
        if (name) data.witnesses.push({ name, contact });
      });
    }

    Array.from(correctiveTbody.rows).forEach(row => {
      const inputs      = row.querySelectorAll('input');
      const action      = inputs[0].value.trim();
      const responsible = inputs[1].value.trim();
      const targetDate  = inputs[2].value;
      if (action || responsible) data.correctiveActions.push({ action, responsible, targetDate });
    });

    Array.from(signoffTbody.rows).forEach(row => {
      const inputs   = row.querySelectorAll('input');
      const name     = inputs[0].value.trim();
      const initials = inputs[1].value.trim().toUpperCase();
      const date     = inputs[2].value;
      if (name || initials) data.signOffs.push({ name, initials, date });
    });

    return data;
  }

  // ── Edit mode ────────────────────────────────────────────────

  function enterEditMode(rec) {
    const d  = rec.data || {};
    const rt = d.reportType || rec.type || 'nearmiss';
    currentEditId = rec.id;

    setReportType(rt);

    $('sr-datetime').value         = d.datetime         || '';
    $('sr-project').value          = d.project          || '';
    $('sr-site').value             = d.site             || '';
    $('sr-gps').value              = d.gps              || '';
    $('sr-reporter').value         = d.reporter         || '';
    $('sr-supervisor').value       = d.supervisor       || '';
    $('sr-activity').value         = d.activity         || '';
    $('sr-description').value      = d.description      || '';
    $('sr-conditions').value       = d.conditions       || '';
    $('sr-actions').value          = d.immediateActions || '';
    $('sr-additional-notes').value = d.additionalNotes  || '';

    $('sr-nearmiss-type').value    = (rt === 'nearmiss') ? (d.type || '') : '';
    $('sr-incident-type').value    = (rt === 'incident') ? (d.type || '') : '';
    $('sr-severity').value         = d.severity         || '';
    $('sr-potential-harm').value   = d.potentialHarm    || '';
    $('sr-injury-nature').value    = d.injuryNature     || '';
    $('sr-body-part').value        = d.bodyPart         || '';
    $('sr-medical-treatment').value = d.medicalTreatment || '';
    $('sr-wcb').value              = d.wcbReportable    || '';
    $('sr-damage-desc').value      = d.damageDesc       || '';
    $('sr-damage-cost').value      = d.damageCost       || '';

    const factors = d.factors || {};
    restoreCheckboxGroup('#sr-factors-env   input[type="checkbox"]', factors.env   || []);
    restoreCheckboxGroup('#sr-factors-human input[type="checkbox"]', factors.human || []);
    restoreCheckboxGroup('#sr-factors-equip input[type="checkbox"]', factors.equip || []);
    restoreCheckboxGroup('#sr-factors-org   input[type="checkbox"]', factors.org   || []);
    restoreOtherInput('sr-factor-env-other-cb',   'sr-factor-env-other-txt',   factors.env   || []);
    restoreOtherInput('sr-factor-human-other-cb', 'sr-factor-human-other-txt', factors.human || []);
    restoreOtherInput('sr-factor-equip-other-cb', 'sr-factor-equip-other-txt', factors.equip || []);
    restoreOtherInput('sr-factor-org-other-cb',   'sr-factor-org-other-txt',   factors.org   || []);

    personsTbody.innerHTML = '';
    const persons = (d.persons && d.persons.length) ? d.persons : [{}, {}];
    persons.forEach(p => personsTbody.appendChild(buildPersonRow(p.name || '', p.jobTitle || '', p.company || '', p.contact || '')));

    witnessesTbody.innerHTML = '';
    const witnesses = (d.witnesses && d.witnesses.length) ? d.witnesses : [{}];
    witnesses.forEach(w => witnessesTbody.appendChild(buildWitnessRow(w.name || '', w.contact || '')));

    correctiveTbody.innerHTML = '';
    const corrective = (d.correctiveActions && d.correctiveActions.length) ? d.correctiveActions : [{}, {}];
    corrective.forEach(c => correctiveTbody.appendChild(buildCorrectiveRow(c.action || '', c.responsible || '', c.targetDate || '')));

    signoffTbody.innerHTML = '';
    const signoffs = (d.signOffs && d.signOffs.length) ? d.signOffs : [{}, {}];
    signoffs.forEach(s => signoffTbody.appendChild(buildSignoffRow(s.name || '', s.initials || '', s.date || '')));

    $('sr-edit-banner-text').textContent =
      'Editing saved submission from ' + (d.datetime ? d.datetime.slice(0, 10) : '—') +
      ' — ' + (d.project || '—') + '. Save will overwrite the original.';
    $('sr-edit-banner').hidden     = false;
    $('sr-save-label').textContent = 'Save Changes';

    document.getElementById('main-content').scrollTop = 0;
  }

  window.SafetyReportForm = { loadForEdit: enterEditMode };

  // ── Toast ────────────────────────────────────────────────────

  let toastTimer;

  function showToast(msg, type) {
    if (!msg || !msg.trim()) return;
    const toast = $('sr-toast');
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '') + ' toast--visible';
    toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
  }

  // ── Save ─────────────────────────────────────────────────────

  $('sr-save-btn').addEventListener('click', async () => {
    const btn = $('sr-save-btn');
    btn.disabled = true;
    try {
      const data   = collectData();
      const dbType = data.reportType;
      if (currentEditId !== null) {
        await FraxinusDB.updateSubmission(currentEditId, data);
        showToast('Submission updated successfully');
        resetForm();
        document.querySelector('[data-tab="submissions"]').click();
      } else {
        await FraxinusDB.saveSubmission(dbType, data);
        resetForm();
        showToast('Saved successfully');
      }
    } catch (err) {
      showToast('Save failed — ' + err.message, 'error');
      console.error('saveSubmission:', err);
    } finally {
      btn.disabled = false;
    }
  });

  // ── Export PDF ───────────────────────────────────────────────

  $('sr-pdf-btn').addEventListener('click', () => {
    const data = collectData();
    buildSafetyPDF(data).save(pdfFilename(data));
  });

  function pdfFilename(data) {
    const dt    = (data.datetime || todayISO()).slice(0, 10);
    const proj  = (data.project || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const label = data.reportType === 'incident' ? 'Incident' : 'NearMiss';
    const parts = ['Fraxinus', label, dt];
    if (proj) parts.push(proj);
    return parts.join('_') + '.pdf';
  }

  function buildSafetyPDF(d) {
    const isIncident  = d.reportType === 'incident';
    const { jsPDF }   = window.jspdf;
    const doc         = new jsPDF({ unit: 'mm', format: 'letter' });
    const RULE_COLOR  = isIncident ? [123, 36, 28] : [192, 57, 43];
    const ctx         = pdfCtx(doc, RULE_COLOR);

    ctx.docHeader(isIncident ? 'Incident Report' : 'Near-Miss Report');

    ctx.section('Incident Details');
    ctx.field('Date & Time',          d.datetime ? d.datetime.replace('T', '  ') : '');
    ctx.field('Project Name / No.',   d.project);
    ctx.field('Site / Location',      d.site);
    ctx.field('GPS Coordinates',      d.gps);
    if (isIncident) ctx.field('Incident Type', d.type);
    ctx.field('Reported By',          d.reporter);
    ctx.field('Supervisor / Lead',    d.supervisor);

    if (isIncident && d.persons && d.persons.length) {
      ctx.section('Person(s) Involved');
      ctx.personsTable(d.persons);
    }

    ctx.section('Incident Description');
    if (!isIncident) ctx.field('Near-Miss Type', d.type);
    ctx.field('Activity at Time',     d.activity);
    ctx.field('What Happened',        d.description);
    ctx.field('Conditions at Time',   d.conditions);

    if (!isIncident) {
      ctx.section('Potential Consequences');
      ctx.field('Potential Severity',   d.severity);
      ctx.field('Potential Harm',       d.potentialHarm);
    }

    if (isIncident) {
      const hasInjury = d.injuryNature || d.bodyPart || d.medicalTreatment || d.wcbReportable;
      if (hasInjury) {
        ctx.section('Injury / Illness Details');
        ctx.field('Nature of Injury',   d.injuryNature);
        ctx.field('Body Part(s)',        d.bodyPart);
        ctx.field('Medical Treatment',   d.medicalTreatment);
        ctx.field('WorkSafe BC',         d.wcbReportable);
      }

      if (d.damageDesc || d.damageCost) {
        ctx.section('Property / Equipment Damage');
        ctx.field('Description',         d.damageDesc);
        ctx.field('Estimated Cost',      d.damageCost);
      }
    }

    const factors    = d.factors || {};
    const allFactors = [...(factors.env||[]), ...(factors.human||[]), ...(factors.equip||[]), ...(factors.org||[])];
    if (allFactors.length) {
      ctx.section('Contributing Factors');
      if (factors.env   && factors.env.length)   ctx.bulletGroup('Environmental',  factors.env);
      if (factors.human && factors.human.length) ctx.bulletGroup('Human Factors',  factors.human);
      if (factors.equip && factors.equip.length) ctx.bulletGroup('Equipment',      factors.equip);
      if (factors.org   && factors.org.length)   ctx.bulletGroup('Organizational', factors.org);
    }

    if (isIncident && d.witnesses && d.witnesses.length) {
      ctx.section('Witnesses');
      ctx.witnessTable(d.witnesses);
    }

    if (d.immediateActions) {
      ctx.section('Immediate Actions Taken');
      ctx.field('', d.immediateActions);
    }

    if (d.correctiveActions && d.correctiveActions.length) {
      ctx.section('Corrective / Preventive Actions');
      ctx.correctiveTable(d.correctiveActions);
    }

    if (d.additionalNotes) {
      ctx.section('Additional Notes');
      ctx.field('', d.additionalNotes);
    }

    if (d.signOffs && d.signOffs.length) {
      ctx.section('Sign-Off');
      ctx.signoffTable(d.signOffs);
    }

    ctx.pageFooters();
    return doc;
  }

  function pdfCtx(doc, ruleColor) {
    const W  = doc.internal.pageSize.getWidth();
    const H  = doc.internal.pageSize.getHeight();
    const ML = 15, MR = 15, MB = 20;
    const CW = W - ML - MR;

    const ORANGE = [232, 115,  26];
    const RULE   = ruleColor || ORANGE;
    const DARK   = [ 28,  26,  22];
    const DGRAY  = [107, 100,  87];
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

        doc.setDrawColor(...RULE);
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

        if (label) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...DGRAY);
          doc.text(label, ML, y);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text(lines, label ? ML + LW : ML, y);
        y += rowH + 1.5;
      },

      bulletGroup(groupLabel, items) {
        guard(8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...DGRAY);
        doc.text(groupLabel, ML + 2, y);
        y += 5;

        items.forEach(item => {
          guard(5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text('•  ' + item, ML + 6, y);
          y += 5;
        });
        y += 1;
      },

      personsTable(rows) {
        const cols = [CW * 0.28, CW * 0.22, CW * 0.22, CW * 0.28];
        const hdrs = ['Name', 'Job Title / Role', 'Company', 'Contact'];
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
        rows.forEach(r => {
          guard(7);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(r.name     || '—', x + 2, y); x += cols[0];
          doc.text(r.jobTitle || '—', x + 2, y); x += cols[1];
          doc.text(r.company  || '—', x + 2, y); x += cols[2];
          doc.text(r.contact  || '—', x + 2, y);
          y += 6;
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, y, ML + CW, y);
          y += 1;
        });
        y += 2;
      },

      witnessTable(rows) {
        const cols = [CW * 0.55, CW * 0.45];
        const hdrs = ['Name', 'Contact'];
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
        rows.forEach(r => {
          guard(7);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(r.name    || '—', x + 2, y); x += cols[0];
          doc.text(r.contact || '—', x + 2, y);
          y += 6;
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, y, ML + CW, y);
          y += 1;
        });
        y += 2;
      },

      correctiveTable(rows) {
        const cols = [CW * 0.48, CW * 0.32, CW * 0.20];
        const hdrs = ['Action Required', 'Responsible', 'Target Date'];
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

        rows.forEach(r => {
          guard(7);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          const actionLines = doc.splitTextToSize(r.action || '—', cols[0] - 4);
          const rowH = Math.max(actionLines.length * 5, 6);
          guard(rowH + 2);
          doc.text(actionLines, x + 2, y);               x += cols[0];
          doc.text(r.responsible || '—', x + 2, y);      x += cols[1];
          doc.text(r.targetDate  || '—', x + 2, y);
          y += rowH;
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, y, ML + CW, y);
          y += 1;
        });

        y += 2;
      },

      signoffTable(signoffs) {
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
          guard(7);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(s.name     || '—', x + 2, y); x += cols[0];
          doc.text(s.initials || '',   x + 2, y); x += cols[1];
          doc.text(s.date     || '',   x + 2, y);
          y += 6;
          doc.setDrawColor(...LGRAY);
          doc.setLineWidth(0.15);
          doc.line(ML, y, ML + CW, y);
          y += 1;
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

  $('sr-export-btn').addEventListener('click', () => {
    const data    = collectData();
    const payload = Object.assign({ type: data.reportType, exportedAt: new Date().toISOString() }, data);
    const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    const label   = data.reportType === 'incident' ? 'incident' : 'nearmiss';
    const slug    = (data.project || label).replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    a.href        = url;
    a.download    = label + '_' + (data.datetime || todayISO()).slice(0, 10) + '_' + slug + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ── Form-level auto-save delegation ─────────────────────────

  $('sr-form').addEventListener('input',  scheduleDraftSave);
  $('sr-form').addEventListener('change', scheduleDraftSave);

  // ── Restore draft on first tab activation ────────────────────

  document.addEventListener('fraxinus-form-activate', e => {
    if (e.detail && e.detail.form === 'safety-report') maybeRestoreDraft();
  });

})();
