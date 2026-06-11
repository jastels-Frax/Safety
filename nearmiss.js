/* ============================================================
   nearmiss.js — Near-Miss Report form
   Depends on: FraxinusDB (window.FraxinusDB from db.js)
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const todayISO    = () => new Date().toISOString().slice(0, 10);
  const nowDatetime = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                              .toISOString().slice(0, 16);

  // ── Default date/time ────────────────────────────────────────

  $('nm-datetime').value = nowDatetime();

  // ── State ────────────────────────────────────────────────────

  const DRAFT_KEY   = 'fraxinus_draft_nearmiss';
  let draftRestored = false;
  let draftTimer    = null;
  let currentEditId = null;

  // ── GPS capture ──────────────────────────────────────────────

  $('nm-gps-btn').addEventListener('click', function () {
    const field = $('nm-gps');
    const label = $('nm-gps-label');

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

  // ── Corrective actions table ─────────────────────────────────

  const correctiveTbody = $('nm-corrective-tbody');

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

  $('nm-add-corrective-btn').addEventListener('click', () => {
    const row = buildCorrectiveRow();
    correctiveTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── Sign-off table ───────────────────────────────────────────

  const signoffTbody = $('nm-signoff-tbody');

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

  $('nm-add-signoff-btn').addEventListener('click', () => {
    const row = buildSignoffRow();
    signoffTbody.appendChild(row);
    row.querySelector('input').focus();
    scheduleDraftSave();
  });

  // ── "Other" factor checkbox toggles ─────────────────────────

  ['env', 'human', 'equip', 'org'].forEach(g => {
    const cb  = $('nm-factor-' + g + '-other-cb');
    const txt = $('nm-factor-' + g + '-other-txt');
    if (cb && txt) {
      cb.addEventListener('change', () => {
        txt.hidden = !cb.checked;
        if (!cb.checked) txt.value = '';
        scheduleDraftSave();
      });
    }
  });

  // ── Draft helpers ────────────────────────────────────────────

  function writeDraft() {
    const draft = {
      datetime:        $('nm-datetime').value,
      project:         $('nm-project').value,
      site:            $('nm-site').value,
      gps:             $('nm-gps').value,
      reporter:        $('nm-reporter').value,
      supervisor:      $('nm-supervisor').value,
      type:            $('nm-type').value,
      activity:        $('nm-activity').value,
      description:     $('nm-description').value,
      conditions:      $('nm-conditions').value,
      severity:        $('nm-severity').value,
      potentialHarm:   $('nm-potential-harm').value,
      immediateActions: $('nm-actions').value,
      additionalNotes: $('nm-additional-notes').value,
      factors: {
        env:   factorValues('#nm-factors-env   input[type="checkbox"]', 'nm-factor-env-other-txt'),
        human: factorValues('#nm-factors-human input[type="checkbox"]', 'nm-factor-human-other-txt'),
        equip: factorValues('#nm-factors-equip input[type="checkbox"]', 'nm-factor-equip-other-txt'),
        org:   factorValues('#nm-factors-org   input[type="checkbox"]', 'nm-factor-org-other-txt'),
      },
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

  function scheduleDraftSave() {
    if (currentEditId !== null) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 500);
  }

  function showDraftBanner(text) {
    $('nm-draft-banner-text').textContent = text;
    $('nm-draft-banner').hidden = false;
  }

  function hideDraftBanner() {
    $('nm-draft-banner').hidden = true;
  }

  function restoreDraft(draft) {
    if (draft.datetime        !== undefined) $('nm-datetime').value       = draft.datetime;
    if (draft.project         !== undefined) $('nm-project').value        = draft.project;
    if (draft.site            !== undefined) $('nm-site').value           = draft.site;
    if (draft.gps             !== undefined) $('nm-gps').value            = draft.gps;
    if (draft.reporter        !== undefined) $('nm-reporter').value       = draft.reporter;
    if (draft.supervisor      !== undefined) $('nm-supervisor').value     = draft.supervisor;
    if (draft.type            !== undefined) $('nm-type').value           = draft.type;
    if (draft.activity        !== undefined) $('nm-activity').value       = draft.activity;
    if (draft.description     !== undefined) $('nm-description').value    = draft.description;
    if (draft.conditions      !== undefined) $('nm-conditions').value     = draft.conditions;
    if (draft.severity        !== undefined) $('nm-severity').value       = draft.severity;
    if (draft.potentialHarm   !== undefined) $('nm-potential-harm').value = draft.potentialHarm;
    if (draft.immediateActions !== undefined) $('nm-actions').value          = draft.immediateActions;
    if (draft.additionalNotes  !== undefined) $('nm-additional-notes').value = draft.additionalNotes;

    if (draft.factors) {
      restoreCheckboxGroup('#nm-factors-env   input[type="checkbox"]', draft.factors.env);
      restoreCheckboxGroup('#nm-factors-human input[type="checkbox"]', draft.factors.human);
      restoreCheckboxGroup('#nm-factors-equip input[type="checkbox"]', draft.factors.equip);
      restoreCheckboxGroup('#nm-factors-org   input[type="checkbox"]', draft.factors.org);
      restoreOtherInput('nm-factor-env-other-cb',   'nm-factor-env-other-txt',   draft.factors.env);
      restoreOtherInput('nm-factor-human-other-cb', 'nm-factor-human-other-txt', draft.factors.human);
      restoreOtherInput('nm-factor-equip-other-cb', 'nm-factor-equip-other-txt', draft.factors.equip);
      restoreOtherInput('nm-factor-org-other-cb',   'nm-factor-org-other-txt',   draft.factors.org);
    }

    if (Array.isArray(draft.correctiveActions) && draft.correctiveActions.length) {
      while (correctiveTbody.rows.length) correctiveTbody.deleteRow(0);
      draft.correctiveActions.forEach(c => {
        correctiveTbody.appendChild(buildCorrectiveRow(c.action, c.responsible, c.targetDate));
      });
      if (!correctiveTbody.rows.length) {
        correctiveTbody.appendChild(buildCorrectiveRow());
        correctiveTbody.appendChild(buildCorrectiveRow());
      }
    }

    if (Array.isArray(draft.signOffs) && draft.signOffs.length) {
      while (signoffTbody.rows.length) signoffTbody.deleteRow(0);
      draft.signOffs.forEach(s => {
        signoffTbody.appendChild(buildSignoffRow(s.name, s.initials, s.date));
      });
      if (!signoffTbody.rows.length) {
        signoffTbody.appendChild(buildSignoffRow());
        signoffTbody.appendChild(buildSignoffRow());
      }
    }
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

  function clearAllBanners() {
    localStorage.removeItem(DRAFT_KEY);
    hideDraftBanner();
    $('nm-edit-banner').hidden = true;
    $('nm-save-label').textContent = 'Save Submission';
  }

  function isDraftMeaningful(draft) {
    return !!(draft.project || draft.site || draft.description || draft.reporter);
  }

  function resetForm() {
    $('nm-datetime').value       = nowDatetime();
    $('nm-project').value        = '';
    $('nm-site').value           = '';
    $('nm-gps').value            = '';
    $('nm-gps-label').textContent = 'Capture';
    $('nm-reporter').value       = '';
    $('nm-supervisor').value     = '';
    $('nm-type').value           = '';
    $('nm-activity').value       = '';
    $('nm-description').value    = '';
    $('nm-conditions').value     = '';
    $('nm-severity').value       = '';
    $('nm-potential-harm').value = '';
    $('nm-actions').value        = '';

    document.querySelectorAll('#nm-factors-env input[type="checkbox"], #nm-factors-human input[type="checkbox"], #nm-factors-equip input[type="checkbox"], #nm-factors-org input[type="checkbox"]')
      .forEach(cb => { cb.checked = false; });

    ['env', 'human', 'equip', 'org'].forEach(g => {
      const txt = $('nm-factor-' + g + '-other-txt');
      if (txt) { txt.value = ''; txt.hidden = true; }
    });

    $('nm-additional-notes').value = '';

    while (correctiveTbody.rows.length) correctiveTbody.deleteRow(0);
    correctiveTbody.appendChild(buildCorrectiveRow());
    correctiveTbody.appendChild(buildCorrectiveRow());

    while (signoffTbody.rows.length) signoffTbody.deleteRow(0);
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

  $('nm-clear-draft-btn').addEventListener('click', resetForm);

  // ── Collect form data ────────────────────────────────────────

  function collectData() {
    const data = {
      datetime:         $('nm-datetime').value,
      project:          $('nm-project').value.trim(),
      site:             $('nm-site').value.trim(),
      gps:              $('nm-gps').value.trim(),
      reporter:         $('nm-reporter').value.trim(),
      supervisor:       $('nm-supervisor').value.trim(),
      type:             $('nm-type').value,
      activity:         $('nm-activity').value.trim(),
      description:      $('nm-description').value.trim(),
      conditions:       $('nm-conditions').value.trim(),
      severity:         $('nm-severity').value,
      potentialHarm:    $('nm-potential-harm').value.trim(),
      immediateActions: $('nm-actions').value.trim(),
      additionalNotes:  $('nm-additional-notes').value.trim(),
      factors: {
        env:   factorValues('#nm-factors-env   input[type="checkbox"]', 'nm-factor-env-other-txt'),
        human: factorValues('#nm-factors-human input[type="checkbox"]', 'nm-factor-human-other-txt'),
        equip: factorValues('#nm-factors-equip input[type="checkbox"]', 'nm-factor-equip-other-txt'),
        org:   factorValues('#nm-factors-org   input[type="checkbox"]', 'nm-factor-org-other-txt'),
      },
      correctiveActions: [],
      signOffs:          [],
    };

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
    const d = rec.data || {};
    currentEditId = rec.id;

    $('nm-datetime').value        = d.datetime         || '';
    $('nm-project').value         = d.project          || '';
    $('nm-site').value            = d.site             || '';
    $('nm-gps').value             = d.gps              || '';
    $('nm-reporter').value        = d.reporter         || '';
    $('nm-supervisor').value      = d.supervisor       || '';
    $('nm-type').value            = d.type             || '';
    $('nm-activity').value        = d.activity         || '';
    $('nm-description').value     = d.description      || '';
    $('nm-conditions').value      = d.conditions       || '';
    $('nm-severity').value        = d.severity         || '';
    $('nm-potential-harm').value  = d.potentialHarm    || '';
    $('nm-actions').value          = d.immediateActions  || '';
    $('nm-additional-notes').value = d.additionalNotes   || '';

    const factors = d.factors || {};
    restoreCheckboxGroup('#nm-factors-env   input[type="checkbox"]', factors.env   || []);
    restoreCheckboxGroup('#nm-factors-human input[type="checkbox"]', factors.human || []);
    restoreCheckboxGroup('#nm-factors-equip input[type="checkbox"]', factors.equip || []);
    restoreCheckboxGroup('#nm-factors-org   input[type="checkbox"]', factors.org   || []);
    restoreOtherInput('nm-factor-env-other-cb',   'nm-factor-env-other-txt',   factors.env   || []);
    restoreOtherInput('nm-factor-human-other-cb', 'nm-factor-human-other-txt', factors.human || []);
    restoreOtherInput('nm-factor-equip-other-cb', 'nm-factor-equip-other-txt', factors.equip || []);
    restoreOtherInput('nm-factor-org-other-cb',   'nm-factor-org-other-txt',   factors.org   || []);

    correctiveTbody.innerHTML = '';
    const corrective = (d.correctiveActions && d.correctiveActions.length) ? d.correctiveActions : [{}, {}];
    corrective.forEach(c => {
      correctiveTbody.appendChild(buildCorrectiveRow(c.action || '', c.responsible || '', c.targetDate || ''));
    });

    signoffTbody.innerHTML = '';
    const signoffs = (d.signOffs && d.signOffs.length) ? d.signOffs : [{}, {}];
    signoffs.forEach(s => {
      signoffTbody.appendChild(buildSignoffRow(s.name || '', s.initials || '', s.date || ''));
    });

    $('nm-edit-banner-text').textContent =
      'Editing saved submission from ' + (d.datetime ? d.datetime.slice(0, 10) : '—') +
      ' — ' + (d.project || '—') + '. Save will overwrite the original.';
    $('nm-edit-banner').hidden    = false;
    $('nm-save-label').textContent = 'Save Changes';

    document.getElementById('main-content').scrollTop = 0;
  }

  window.NearMissForm = { loadForEdit: enterEditMode };

  // ── Toast ────────────────────────────────────────────────────

  let toastTimer;

  function showToast(msg, type) {
    if (!msg || !msg.trim()) return;
    const toast = $('nm-toast');
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '') + ' toast--visible';
    toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3200);
  }

  // ── Save ─────────────────────────────────────────────────────

  $('nm-save-btn').addEventListener('click', async () => {
    const btn = $('nm-save-btn');
    btn.disabled = true;
    try {
      const data = collectData();
      if (currentEditId !== null) {
        await FraxinusDB.updateSubmission(currentEditId, data);
        showToast('Submission updated successfully');
        resetForm();
        document.querySelector('[data-tab="submissions"]').click();
      } else {
        await FraxinusDB.saveSubmission('nearmiss', data);
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

  $('nm-pdf-btn').addEventListener('click', () => {
    const data = collectData();
    buildNearMissPDF(data).save(pdfFilename(data));
  });

  function pdfFilename(data) {
    const dt   = (data.datetime || todayISO()).slice(0, 10);
    const proj = (data.project || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const parts = ['Fraxinus', 'NearMiss', dt];
    if (proj) parts.push(proj);
    return parts.join('_') + '.pdf';
  }

  function buildNearMissPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc);

    ctx.docHeader('Near-Miss Report');

    ctx.section('Incident Details');
    ctx.field('Date & Time',         d.datetime   ? d.datetime.replace('T', '  ') : '');
    ctx.field('Project Name / No.',  d.project);
    ctx.field('Site / Location',     d.site);
    ctx.field('GPS Coordinates',     d.gps);
    ctx.field('Reported By',         d.reporter);
    ctx.field('Supervisor / Lead',   d.supervisor);

    ctx.section('Incident Description');
    ctx.field('Near-Miss Type',      d.type);
    ctx.field('Activity at Time',    d.activity);
    ctx.field('What Happened',       d.description);
    ctx.field('Conditions at Time',  d.conditions);

    ctx.section('Potential Consequences');
    ctx.field('Potential Severity',  d.severity);
    ctx.field('Potential Harm',      d.potentialHarm);

    const factors = d.factors || {};
    const allFactors = [
      ...(factors.env   || []),
      ...(factors.human || []),
      ...(factors.equip || []),
      ...(factors.org   || []),
    ];
    if (allFactors.length) {
      ctx.section('Contributing Factors');
      if (factors.env   && factors.env.length)   ctx.bulletGroup('Environmental',  factors.env);
      if (factors.human && factors.human.length) ctx.bulletGroup('Human Factors',  factors.human);
      if (factors.equip && factors.equip.length) ctx.bulletGroup('Equipment',      factors.equip);
      if (factors.org   && factors.org.length)   ctx.bulletGroup('Organizational', factors.org);
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

    const ORANGE = [232, 115,  26];
    const RED    = [192,  57,  43];
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
        y += 3;

        doc.setFillColor(...RED);
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

  $('nm-export-btn').addEventListener('click', () => {
    const data    = collectData();
    const payload = Object.assign({ type: 'nearmiss', exportedAt: new Date().toISOString() }, data);
    const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    const slug    = (data.project || 'nearmiss').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    a.href        = url;
    a.download    = 'nearmiss_' + (data.datetime || todayISO()).slice(0, 10) + '_' + slug + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ── Form-level auto-save delegation ─────────────────────────

  $('nm-form').addEventListener('input',  scheduleDraftSave);
  $('nm-form').addEventListener('change', scheduleDraftSave);

  // ── Restore draft on first tab activation ────────────────────

  document.getElementById('nav-nearmiss').addEventListener('click', maybeRestoreDraft);

})();
