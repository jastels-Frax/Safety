/* ============================================================
   incident.js — Incident Report form
   Depends on: FraxinusDB (window.FraxinusDB from db.js)
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const todayISO    = () => new Date().toISOString().slice(0, 10);
  const nowDatetime = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                              .toISOString().slice(0, 16);

  $('inc-datetime').value = nowDatetime();

  // ── State ────────────────────────────────────────────────────

  const DRAFT_KEY   = 'fraxinus_draft_incident';
  let draftRestored = false;
  let draftTimer    = null;
  let currentEditId = null;

  // ── GPS capture ──────────────────────────────────────────────

  $('inc-gps-btn').addEventListener('click', function () {
    const field = $('inc-gps');
    const label = $('inc-gps-label');

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

  // ── Persons Involved table ───────────────────────────────────

  const personsTbody = $('inc-persons-tbody');

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

  $('inc-add-person-btn').addEventListener('click', () => {
    const row = buildPersonRow();
    personsTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Witnesses table ──────────────────────────────────────────

  const witnessesTbody = $('inc-witnesses-tbody');

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

  $('inc-add-witness-btn').addEventListener('click', () => {
    const row = buildWitnessRow();
    witnessesTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Corrective actions table ─────────────────────────────────

  const correctiveTbody = $('inc-corrective-tbody');

  function buildCorrectiveRow(action, responsible, targetDate) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" class="tbl-input" placeholder="Describe action required…" aria-label="Action required" autocomplete="off"></td>' +
      '<td><input type="text" class="tbl-input" placeholder="Name or role…" aria-label="Responsible person" autocomplete="off"></td>' +
      '<td><input type="date" class="tbl-input" aria-label="Target completion date"></td>' +
      '<td><button type="button" class="btn-remove-row" aria-label="Remove corrective action">' +
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

  $('inc-add-corrective-btn').addEventListener('click', () => {
    const row = buildCorrectiveRow();
    correctiveTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Sign-off table ───────────────────────────────────────────

  const signoffTbody = $('inc-signoff-tbody');

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

  $('inc-add-signoff-btn').addEventListener('click', () => {
    const row = buildSignoffRow();
    signoffTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── "Other" factor checkbox toggles ─────────────────────────

  ['env', 'human', 'equip', 'org'].forEach(g => {
    const cb  = $('inc-factor-' + g + '-other-cb');
    const txt = $('inc-factor-' + g + '-other-txt');
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
    const vals = checkedValues(groupSelector);
    const otherTxt = $(otherTxtId);
    if (vals.includes('Other') && otherTxt && otherTxt.value.trim()) {
      return vals.map(v => v === 'Other' ? 'Other: ' + otherTxt.value.trim() : v);
    }
    return vals;
  }

  function writeDraft() {
    const draft = {
      datetime:         $('inc-datetime').value,
      project:          $('inc-project').value,
      site:             $('inc-site').value,
      gps:              $('inc-gps').value,
      type:             $('inc-type').value,
      reporter:         $('inc-reporter').value,
      supervisor:       $('inc-supervisor').value,
      activity:         $('inc-activity').value,
      description:      $('inc-description').value,
      conditions:       $('inc-conditions').value,
      injuryNature:     $('inc-injury-nature').value,
      bodyPart:         $('inc-body-part').value,
      medicalTreatment: $('inc-medical-treatment').value,
      wcbReportable:    $('inc-wcb').value,
      damageDesc:       $('inc-damage-desc').value,
      damageCost:       $('inc-damage-cost').value,
      immediateActions: $('inc-actions').value,
      additionalNotes:  $('inc-additional-notes').value,
      factors: {
        env:   factorValues('#inc-factors-env   input[type="checkbox"]', 'inc-factor-env-other-txt'),
        human: factorValues('#inc-factors-human input[type="checkbox"]', 'inc-factor-human-other-txt'),
        equip: factorValues('#inc-factors-equip input[type="checkbox"]', 'inc-factor-equip-other-txt'),
        org:   factorValues('#inc-factors-org   input[type="checkbox"]', 'inc-factor-org-other-txt'),
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
        const i = row.querySelectorAll('input');
        return { action: i[0].value, responsible: i[1].value, targetDate: i[2].value };
      }),
      signOffs: Array.from(signoffTbody.rows).map(row => {
        const i = row.querySelectorAll('input');
        return { name: i[0].value, initials: i[1].value, date: i[2].value };
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
    $('inc-draft-banner-text').textContent = text;
    $('inc-draft-banner').hidden = false;
  }

  function hideDraftBanner() {
    $('inc-draft-banner').hidden = true;
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
    if (draft.datetime         !== undefined) $('inc-datetime').value          = draft.datetime;
    if (draft.project          !== undefined) $('inc-project').value           = draft.project;
    if (draft.site             !== undefined) $('inc-site').value              = draft.site;
    if (draft.gps              !== undefined) $('inc-gps').value               = draft.gps;
    if (draft.type             !== undefined) $('inc-type').value              = draft.type;
    if (draft.reporter         !== undefined) $('inc-reporter').value          = draft.reporter;
    if (draft.supervisor       !== undefined) $('inc-supervisor').value        = draft.supervisor;
    if (draft.activity         !== undefined) $('inc-activity').value          = draft.activity;
    if (draft.description      !== undefined) $('inc-description').value       = draft.description;
    if (draft.conditions       !== undefined) $('inc-conditions').value        = draft.conditions;
    if (draft.injuryNature     !== undefined) $('inc-injury-nature').value     = draft.injuryNature;
    if (draft.bodyPart         !== undefined) $('inc-body-part').value         = draft.bodyPart;
    if (draft.medicalTreatment !== undefined) $('inc-medical-treatment').value = draft.medicalTreatment;
    if (draft.wcbReportable    !== undefined) $('inc-wcb').value               = draft.wcbReportable;
    if (draft.damageDesc       !== undefined) $('inc-damage-desc').value       = draft.damageDesc;
    if (draft.damageCost       !== undefined) $('inc-damage-cost').value       = draft.damageCost;
    if (draft.immediateActions !== undefined) $('inc-actions').value           = draft.immediateActions;
    if (draft.additionalNotes  !== undefined) $('inc-additional-notes').value  = draft.additionalNotes;

    if (draft.factors) {
      restoreCheckboxGroup('#inc-factors-env   input[type="checkbox"]', draft.factors.env);
      restoreCheckboxGroup('#inc-factors-human input[type="checkbox"]', draft.factors.human);
      restoreCheckboxGroup('#inc-factors-equip input[type="checkbox"]', draft.factors.equip);
      restoreCheckboxGroup('#inc-factors-org   input[type="checkbox"]', draft.factors.org);
      restoreOtherInput('inc-factor-env-other-cb',   'inc-factor-env-other-txt',   draft.factors.env);
      restoreOtherInput('inc-factor-human-other-cb', 'inc-factor-human-other-txt', draft.factors.human);
      restoreOtherInput('inc-factor-equip-other-cb', 'inc-factor-equip-other-txt', draft.factors.equip);
      restoreOtherInput('inc-factor-org-other-cb',   'inc-factor-org-other-txt',   draft.factors.org);
    }

    function restoreTable(tbody, rows, buildFn) {
      if (!Array.isArray(rows) || !rows.length) return;
      while (tbody.rows.length) tbody.deleteRow(0);
      rows.forEach(r => tbody.appendChild(buildFn(...Object.values(r))));
      if (!tbody.rows.length) tbody.appendChild(buildFn());
    }

    restoreTable(personsTbody,   draft.persons,           (n, j, c, ct) => buildPersonRow(n, j, c, ct));
    restoreTable(witnessesTbody, draft.witnesses,         (n, c)        => buildWitnessRow(n, c));
    restoreTable(correctiveTbody,draft.correctiveActions, (a, r, t)     => buildCorrectiveRow(a, r, t));
    restoreTable(signoffTbody,   draft.signOffs,          (n, i, d)     => buildSignoffRow(n, i, d));
  }

  function clearAllBanners() {
    localStorage.removeItem(DRAFT_KEY);
    hideDraftBanner();
    $('inc-edit-banner').hidden = true;
    $('inc-save-label').textContent = 'Save Submission';
  }

  function isDraftMeaningful(draft) {
    return !!(draft.project || draft.site || draft.description || draft.reporter);
  }

  function resetForm() {
    ['inc-datetime', 'inc-project', 'inc-site', 'inc-gps', 'inc-type', 'inc-reporter',
     'inc-supervisor', 'inc-activity', 'inc-description', 'inc-conditions',
     'inc-injury-nature', 'inc-body-part', 'inc-medical-treatment', 'inc-wcb',
     'inc-damage-desc', 'inc-damage-cost', 'inc-actions', 'inc-additional-notes']
      .forEach(id => { const el = $(id); if (el) el.value = id === 'inc-datetime' ? nowDatetime() : ''; });

    $('inc-gps-label').textContent = 'Capture';

    document.querySelectorAll(
      '#inc-factors-env input[type="checkbox"], #inc-factors-human input[type="checkbox"], ' +
      '#inc-factors-equip input[type="checkbox"], #inc-factors-org input[type="checkbox"]'
    ).forEach(cb => { cb.checked = false; });

    ['env', 'human', 'equip', 'org'].forEach(g => {
      const txt = $('inc-factor-' + g + '-other-txt');
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

  $('inc-clear-draft-btn').addEventListener('click', resetForm);

  // ── Collect form data ────────────────────────────────────────

  function collectData() {
    const data = {
      datetime:         $('inc-datetime').value,
      project:          $('inc-project').value.trim(),
      site:             $('inc-site').value.trim(),
      gps:              $('inc-gps').value.trim(),
      type:             $('inc-type').value,
      reporter:         $('inc-reporter').value.trim(),
      supervisor:       $('inc-supervisor').value.trim(),
      activity:         $('inc-activity').value.trim(),
      description:      $('inc-description').value.trim(),
      conditions:       $('inc-conditions').value.trim(),
      injuryNature:     $('inc-injury-nature').value.trim(),
      bodyPart:         $('inc-body-part').value.trim(),
      medicalTreatment: $('inc-medical-treatment').value,
      wcbReportable:    $('inc-wcb').value,
      damageDesc:       $('inc-damage-desc').value.trim(),
      damageCost:       $('inc-damage-cost').value.trim(),
      immediateActions: $('inc-actions').value.trim(),
      additionalNotes:  $('inc-additional-notes').value.trim(),
      factors: {
        env:   factorValues('#inc-factors-env   input[type="checkbox"]', 'inc-factor-env-other-txt'),
        human: factorValues('#inc-factors-human input[type="checkbox"]', 'inc-factor-human-other-txt'),
        equip: factorValues('#inc-factors-equip input[type="checkbox"]', 'inc-factor-equip-other-txt'),
        org:   factorValues('#inc-factors-org   input[type="checkbox"]', 'inc-factor-org-other-txt'),
      },
      persons:           [],
      witnesses:         [],
      correctiveActions: [],
      signOffs:          [],
    };

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

    Array.from(correctiveTbody.rows).forEach(row => {
      const i = row.querySelectorAll('input');
      const action = i[0].value.trim(), responsible = i[1].value.trim(), targetDate = i[2].value;
      if (action || responsible) data.correctiveActions.push({ action, responsible, targetDate });
    });

    Array.from(signoffTbody.rows).forEach(row => {
      const i = row.querySelectorAll('input');
      const name = i[0].value.trim(), initials = i[1].value.trim().toUpperCase(), date = i[2].value;
      if (name || initials) data.signOffs.push({ name, initials, date });
    });

    return data;
  }

  // ── Edit mode ────────────────────────────────────────────────

  function enterEditMode(rec) {
    const d = rec.data || {};
    currentEditId = rec.id;

    $('inc-datetime').value          = d.datetime         || '';
    $('inc-project').value           = d.project          || '';
    $('inc-site').value              = d.site             || '';
    $('inc-gps').value               = d.gps              || '';
    $('inc-type').value              = d.type             || '';
    $('inc-reporter').value          = d.reporter         || '';
    $('inc-supervisor').value        = d.supervisor       || '';
    $('inc-activity').value          = d.activity         || '';
    $('inc-description').value       = d.description      || '';
    $('inc-conditions').value        = d.conditions       || '';
    $('inc-injury-nature').value     = d.injuryNature     || '';
    $('inc-body-part').value         = d.bodyPart         || '';
    $('inc-medical-treatment').value = d.medicalTreatment || '';
    $('inc-wcb').value               = d.wcbReportable    || '';
    $('inc-damage-desc').value       = d.damageDesc       || '';
    $('inc-damage-cost').value       = d.damageCost       || '';
    $('inc-actions').value           = d.immediateActions || '';
    $('inc-additional-notes').value  = d.additionalNotes  || '';

    const factors = d.factors || {};
    restoreCheckboxGroup('#inc-factors-env   input[type="checkbox"]', factors.env   || []);
    restoreCheckboxGroup('#inc-factors-human input[type="checkbox"]', factors.human || []);
    restoreCheckboxGroup('#inc-factors-equip input[type="checkbox"]', factors.equip || []);
    restoreCheckboxGroup('#inc-factors-org   input[type="checkbox"]', factors.org   || []);
    restoreOtherInput('inc-factor-env-other-cb',   'inc-factor-env-other-txt',   factors.env   || []);
    restoreOtherInput('inc-factor-human-other-cb', 'inc-factor-human-other-txt', factors.human || []);
    restoreOtherInput('inc-factor-equip-other-cb', 'inc-factor-equip-other-txt', factors.equip || []);
    restoreOtherInput('inc-factor-org-other-cb',   'inc-factor-org-other-txt',   factors.org   || []);

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

    $('inc-edit-banner-text').textContent =
      'Editing saved submission from ' + (d.datetime ? d.datetime.slice(0, 10) : '—') +
      ' — ' + (d.project || '—') + '. Save will overwrite the original.';
    $('inc-edit-banner').hidden    = false;
    $('inc-save-label').textContent = 'Save Changes';

    document.getElementById('main-content').scrollTop = 0;
  }

  window.IncidentForm = { loadForEdit: enterEditMode };

  // ── Toast ────────────────────────────────────────────────────

  let toastTimer;

  function showToast(msg, type) {
    if (!msg || !msg.trim()) return;
    const toast = $('inc-toast');
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '') + ' toast--visible';
    toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
  }

  // ── Save ─────────────────────────────────────────────────────

  $('inc-save-btn').addEventListener('click', async () => {
    const btn = $('inc-save-btn');
    btn.disabled = true;
    try {
      const data = collectData();
      if (currentEditId !== null) {
        await FraxinusDB.updateSubmission(currentEditId, data);
        showToast('Submission updated successfully');
        resetForm();
        document.querySelector('[data-tab="submissions"]').click();
      } else {
        await FraxinusDB.saveSubmission('incident', data);
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

  $('inc-pdf-btn').addEventListener('click', () => {
    const data = collectData();
    buildIncidentPDF(data).save(pdfFilename(data));
  });

  function pdfFilename(data) {
    const dt   = (data.datetime || todayISO()).slice(0, 10);
    const proj = (data.project || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const parts = ['Fraxinus', 'Incident', dt];
    if (proj) parts.push(proj);
    return parts.join('_') + '.pdf';
  }

  function buildIncidentPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc);

    ctx.docHeader('Incident Report');

    ctx.section('Incident Details');
    ctx.field('Date & Time',          d.datetime ? d.datetime.replace('T', '  ') : '');
    ctx.field('Project Name / No.',   d.project);
    ctx.field('Site / Location',      d.site);
    ctx.field('GPS Coordinates',      d.gps);
    ctx.field('Incident Type',        d.type);
    ctx.field('Reported By',          d.reporter);
    ctx.field('Supervisor / Lead',    d.supervisor);

    if (d.persons && d.persons.length) {
      ctx.section('Person(s) Involved');
      ctx.personsTable(d.persons);
    }

    ctx.section('Incident Description');
    ctx.field('Activity at Time',     d.activity);
    ctx.field('What Happened',        d.description);
    ctx.field('Conditions at Time',   d.conditions);

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

    const factors = d.factors || {};
    const allFactors = [...(factors.env||[]), ...(factors.human||[]), ...(factors.equip||[]), ...(factors.org||[])];
    if (allFactors.length) {
      ctx.section('Contributing Factors');
      if (factors.env   && factors.env.length)   ctx.bulletGroup('Environmental',  factors.env);
      if (factors.human && factors.human.length) ctx.bulletGroup('Human Factors',  factors.human);
      if (factors.equip && factors.equip.length) ctx.bulletGroup('Equipment',      factors.equip);
      if (factors.org   && factors.org.length)   ctx.bulletGroup('Organizational', factors.org);
    }

    if (d.witnesses && d.witnesses.length) {
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

  function pdfCtx(doc) {
    const W  = doc.internal.pageSize.getWidth();
    const H  = doc.internal.pageSize.getHeight();
    const ML = 15, MR = 15, MB = 20;
    const CW = W - ML - MR;

    const ORANGE  = [232, 115,  26];
    const MAROON  = [123,  36,  28];
    const DARK    = [ 28,  26,  22];
    const DGRAY   = [107, 100,  87];
    const LGRAY   = [200, 195, 188];
    const BGRAY   = [242, 239, 235];

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
        y += 3;
        doc.setFillColor(...MAROON);
        doc.rect(ML, y, W - MR - ML, 1.2, 'F');
        y += 8;
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

  $('inc-export-btn').addEventListener('click', () => {
    const data    = collectData();
    const payload = Object.assign({ type: 'incident', exportedAt: new Date().toISOString() }, data);
    const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    const slug    = (data.project || 'incident').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    a.href        = url;
    a.download    = 'incident_' + (data.datetime || todayISO()).slice(0, 10) + '_' + slug + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ── Form-level auto-save delegation ─────────────────────────

  $('inc-form').addEventListener('input',  scheduleDraftSave);
  $('inc-form').addEventListener('change', scheduleDraftSave);

  // ── Restore draft on form activation ────────────────────────

  document.addEventListener('fraxinus-form-activate', e => {
    if (e.detail && e.detail.form === 'incident') maybeRestoreDraft();
  });

})();
