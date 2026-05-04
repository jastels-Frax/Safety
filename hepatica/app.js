/* ============================================================
   app.js — Hepatica americana survey app
   ============================================================ */

(function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────

  const PATCHES  = ['A', 'B1', 'B2', 'C'];
  const QUADRATS = ['Q1', 'Q2'];
  const TOTAL_STEPS = 4;

  const SPECIES_LIST = [
    'Hepatica americana',
    'Uvularia sessifolia',
    'Maianthemum canadense',
    'Mitchella repens',
    'Thalictrum pubescens',
    'Aralia nudicaulis',
    'Gaultheria procumbens',
    'Ranunculus repens',
    'Viola sp.',
    'Other',
  ];

  const INVASIVES_LIST = [
    'Garlic mustard (Alliaria petiolata)',
    'Dog-strangling vine (Cynanchum rossicum)',
    'Common buckthorn (Rhamnus cathartica)',
    'Glossy buckthorn (Frangula alnus)',
    'Japanese knotweed (Fallopia japonica)',
    'European privet (Ligustrum vulgare)',
    'Phragmites australis',
    'Lily-of-the-valley (Convallaria majalis)',
  ];

  // ── State ────────────────────────────────────────────────────

  const state = {
    screen:   'home',
    year:     String(new Date().getFullYear()),
    patch:    null,
    quadrat:  null,
    step:     1,
    editId:   null,
    form: freshForm(),
  };

  function freshForm() {
    return {
      date:                 todayISO(),
      species:              [],
      hepatica_flowering:   '',
      hepatica_health:      '',
      invasives:            [],
      flood_observed:       false,
      flood_notes:          '',
      ground_cover_notes:   '',
      general_observations: '',
      photo_refs:           '',
    };
  }

  function draftKey() {
    return state.year + '_' + state.patch + '_' + state.quadrat;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── DOM helpers ──────────────────────────────────────────────

  const $ = id => document.getElementById(id);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ── Init ─────────────────────────────────────────────────────

  async function init() {
    // Year selector
    const yearSel = $('sel-year');
    const thisYear = new Date().getFullYear();
    for (let y = thisYear; y >= thisYear - 5; y--) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      yearSel.appendChild(opt);
    }
    yearSel.value = state.year;
    yearSel.addEventListener('change', () => { state.year = yearSel.value; });

    // Patch buttons
    qsa('.patch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('.patch-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.patch = btn.dataset.patch;
        updateStartBtn();
      });
    });

    // Quadrat buttons
    qsa('.quad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('.quad-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.quadrat = btn.dataset.quad;
        updateStartBtn();
      });
    });

    $('btn-start').addEventListener('click', handleStart);
    $('btn-view-records').addEventListener('click', () => showScreen('records'));
    $('btn-back-home').addEventListener('click', () => showScreen('home'));
    $('btn-export-csv').addEventListener('click', exportCSV);
    $('btn-prev').addEventListener('click', prevStep);
    $('btn-next').addEventListener('click', nextStep);
    $('btn-save').addEventListener('click', saveSurvey);
    $('btn-cancel-form').addEventListener('click', cancelForm);
    $('btn-resume').addEventListener('click', resumeDraft);
    $('btn-fresh').addEventListener('click', startFresh);
    $('sort-select').addEventListener('change', () => renderRecords());

    $('detail-close').addEventListener('click', closeDetailModal);
    $('detail-modal').addEventListener('click', e => {
      if (e.target === $('detail-modal')) closeDetailModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('detail-modal').hidden) closeDetailModal();
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/safety/hepatica/service-worker.js', { scope: '/safety/hepatica/' })
        .catch(e => console.warn('SW registration failed:', e));
    }
  }

  function updateStartBtn() {
    $('btn-start').disabled = !(state.patch && state.quadrat);
  }

  // ── Screen navigation ────────────────────────────────────────

  function showScreen(name) {
    state.screen = name;
    qsa('.screen').forEach(s => s.hidden = true);
    $('screen-' + name).hidden = false;

    if (name === 'records') renderRecords();
  }

  // ── Start / resume / draft ───────────────────────────────────

  async function handleStart() {
    const key   = draftKey();
    const draft = await HepaticaDB.getDraft(key);

    if (draft) {
      $('draft-context').textContent =
        'Patch ' + state.patch + ' / ' + state.quadrat + ' — ' + (draft.date || '');
      state.form = draft;
      showScreen('draft');
    } else {
      startFresh();
    }
  }

  function resumeDraft() {
    $('screen-draft').hidden = true;
    openForm();
  }

  function startFresh() {
    $('screen-draft').hidden = true;
    state.form = freshForm();
    state.editId = null;
    openForm();
  }

  function cancelForm() {
    autoSaveDraft();
    showScreen('home');
  }

  function openForm() {
    state.step = 1;
    showScreen('form');
    updateContextBar();
    renderStep(1);
    updateNavButtons();
  }

  // ── Auto-save draft ──────────────────────────────────────────

  let draftTimer = null;

  function scheduleDraftSave() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(autoSaveDraft, 800);
  }

  async function autoSaveDraft() {
    if (!state.patch || !state.quadrat) return;
    collectCurrentStep();
    await HepaticaDB.saveDraft(draftKey(), state.form).catch(() => {});
  }

  // ── Context bar ──────────────────────────────────────────────

  function updateContextBar() {
    $('ctx-patch-quad').textContent = 'Patch ' + state.patch + ' · ' + state.quadrat;
    $('ctx-year').textContent       = state.year;
    $('ctx-step').textContent       = 'Step ' + state.step + ' of ' + TOTAL_STEPS;
  }

  // ── Form step rendering ──────────────────────────────────────

  function renderStep(n) {
    qsa('.step-panel').forEach(p => p.hidden = true);
    const panel = $('step-' + n);
    panel.hidden = false;

    if (n === 1) renderStep1();
    if (n === 2) renderStep2();
    if (n === 3) renderStep3();
    if (n === 4) renderStep4();
  }

  // Step 1: Date + H. americana quick status
  function renderStep1() {
    $('f-date').value = state.form.date;
    $('f-date').addEventListener('change', () => { state.form.date = $('f-date').value; scheduleDraftSave(); });

    setRadio('f-flowering', state.form.hepatica_flowering);
    setRadio('f-health',    state.form.hepatica_health);

    qsa('input[name="f-flowering"]').forEach(r => r.addEventListener('change', () => {
      state.form.hepatica_flowering = r.value; scheduleDraftSave();
    }));
    qsa('input[name="f-health"]').forEach(r => r.addEventListener('change', () => {
      state.form.hepatica_health = r.value; scheduleDraftSave();
    }));
  }

  // Step 2: Species cover
  function renderStep2() {
    const tbody = $('species-tbody');
    tbody.innerHTML = '';

    if (state.form.species.length === 0) {
      addSpeciesRow(tbody, 'Hepatica americana', '', '');
    } else {
      state.form.species.forEach(s => addSpeciesRow(tbody, s.name, s.cover, s.stems, s.other_name));
    }

    $('btn-add-species').onclick = () => {
      addSpeciesRow(tbody, '', '', '');
      scheduleDraftSave();
    };
  }

  function addSpeciesRow(tbody, name, cover, stems, otherName) {
    const tr = document.createElement('tr');
    tr.className = 'species-row';

    const nameOpts = SPECIES_LIST.map(s =>
      `<option value="${s}"${s === name ? ' selected' : ''}>${s}</option>`
    ).join('');

    tr.innerHTML =
      '<td class="td-species">' +
        '<select class="sp-name fld-select">' + nameOpts + '</select>' +
        '<input type="text" class="sp-other fld-input" placeholder="Species name…"' +
          (name === 'Other' ? '' : ' hidden') +
          ' value="' + esc(otherName || '') + '">' +
      '</td>' +
      '<td class="td-cover">' +
        '<input type="number" class="sp-cover fld-input" min="0" max="100" step="1" ' +
          'placeholder="0" value="' + esc(String(cover || '')) + '">' +
        '<span class="unit">%</span>' +
      '</td>' +
      '<td class="td-stems">' +
        '<input type="number" class="sp-stems fld-input" min="0" step="1" ' +
          'placeholder="—" value="' + esc(String(stems || '')) + '">' +
      '</td>' +
      '<td class="td-del">' +
        '<button type="button" class="btn-del-row" aria-label="Remove row">✕</button>' +
      '</td>';

    tr.querySelector('.sp-name').addEventListener('change', function () {
      const otherInput = tr.querySelector('.sp-other');
      otherInput.hidden = this.value !== 'Other';
      scheduleDraftSave();
    });

    tr.querySelector('.btn-del-row').addEventListener('click', () => {
      tr.remove();
      scheduleDraftSave();
    });

    qsa('input, select', tr).forEach(el => el.addEventListener('input', scheduleDraftSave));

    tbody.appendChild(tr);
  }

  // Step 3: Invasive species
  function renderStep3() {
    const list = $('invasives-list');
    list.innerHTML = '';

    INVASIVES_LIST.forEach(inv => {
      const checked = state.form.invasives.includes(inv);
      const item = document.createElement('label');
      item.className = 'inv-item' + (checked ? ' selected' : '');
      item.innerHTML =
        '<input type="checkbox" value="' + esc(inv) + '"' + (checked ? ' checked' : '') + '>' +
        '<span>' + esc(inv) + '</span>';
      item.querySelector('input').addEventListener('change', function () {
        item.classList.toggle('selected', this.checked);
        scheduleDraftSave();
      });
      list.appendChild(item);
    });

    // Custom invasives (already added)
    const customs = state.form.invasives.filter(i => !INVASIVES_LIST.includes(i));
    customs.forEach(name => addCustomInvasiveChip(list, name));

    $('btn-add-invasive').onclick = () => {
      const val = $('inv-custom-input').value.trim();
      if (!val) return;
      addCustomInvasiveChip(list, val);
      $('inv-custom-input').value = '';
      scheduleDraftSave();
    };

    $('inv-custom-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); $('btn-add-invasive').click(); }
    });
  }

  function addCustomInvasiveChip(list, name) {
    const item = document.createElement('label');
    item.className = 'inv-item inv-custom selected';
    item.innerHTML =
      '<input type="checkbox" value="' + esc(name) + '" checked>' +
      '<span>' + esc(name) + '</span>';
    item.querySelector('input').addEventListener('change', function () {
      item.classList.toggle('selected', this.checked);
      scheduleDraftSave();
    });
    list.appendChild(item);
  }

  // Step 4: Site observations
  function renderStep4() {
    const floodCb    = $('f-flood');
    const floodNotes = $('f-flood-notes');

    floodCb.checked         = state.form.flood_observed;
    floodNotes.value        = state.form.flood_notes || '';
    floodNotes.parentElement.hidden = !state.form.flood_observed;

    floodCb.addEventListener('change', () => {
      state.form.flood_observed = floodCb.checked;
      floodNotes.parentElement.hidden = !floodCb.checked;
      scheduleDraftSave();
    });
    floodNotes.addEventListener('input', () => {
      state.form.flood_notes = floodNotes.value;
      scheduleDraftSave();
    });

    $('f-ground-cover').value        = state.form.ground_cover_notes   || '';
    $('f-observations').value        = state.form.general_observations || '';
    $('f-photos').value              = state.form.photo_refs           || '';

    [$('f-ground-cover'), $('f-observations'), $('f-photos')].forEach(el => {
      el.addEventListener('input', scheduleDraftSave);
    });
  }

  // ── Collect current step data ────────────────────────────────

  function collectCurrentStep() {
    if (state.step === 1) collectStep1();
    if (state.step === 2) collectStep2();
    if (state.step === 3) collectStep3();
    if (state.step === 4) collectStep4();
  }

  function collectStep1() {
    state.form.date               = $('f-date').value;
    state.form.hepatica_flowering = getRadio('f-flowering');
    state.form.hepatica_health    = getRadio('f-health');
  }

  function collectStep2() {
    const rows = qsa('.species-row', $('species-tbody'));
    state.form.species = rows.map(tr => {
      const sel   = tr.querySelector('.sp-name');
      const name  = sel.value;
      const other = tr.querySelector('.sp-other').value.trim();
      return {
        name:       name === 'Other' ? (other || 'Other') : name,
        cover:      tr.querySelector('.sp-cover').value,
        stems:      tr.querySelector('.sp-stems').value,
        other_name: name === 'Other' ? other : '',
      };
    }).filter(s => s.name && (s.cover !== '' || s.stems !== ''));
  }

  function collectStep3() {
    state.form.invasives = qsa('#invasives-list input[type="checkbox"]:checked')
      .map(cb => cb.value);
  }

  function collectStep4() {
    state.form.flood_observed       = $('f-flood').checked;
    state.form.flood_notes          = $('f-flood-notes').value.trim();
    state.form.ground_cover_notes   = $('f-ground-cover').value.trim();
    state.form.general_observations = $('f-observations').value.trim();
    state.form.photo_refs           = $('f-photos').value.trim();
  }

  // ── Step navigation ──────────────────────────────────────────

  function nextStep() {
    collectCurrentStep();
    autoSaveDraft();
    if (state.step < TOTAL_STEPS) {
      state.step++;
      renderStep(state.step);
      updateContextBar();
      updateNavButtons();
      window.scrollTo(0, 0);
    }
  }

  function prevStep() {
    collectCurrentStep();
    if (state.step > 1) {
      state.step--;
      renderStep(state.step);
      updateContextBar();
      updateNavButtons();
      window.scrollTo(0, 0);
    } else {
      cancelForm();
    }
  }

  function updateNavButtons() {
    $('btn-prev').textContent = state.step === 1 ? '← Cancel' : '← Back';
    const isLast = state.step === TOTAL_STEPS;
    $('btn-next').hidden = isLast;
    $('btn-save').hidden = !isLast;
  }

  // ── Save survey ──────────────────────────────────────────────

  async function saveSurvey() {
    collectCurrentStep();

    const id = state.editId || Date.now();
    const record = Object.assign({
      id,
      year:    state.year,
      patch:   state.patch,
      quadrat: state.quadrat,
      savedAt: new Date().toISOString(),
    }, state.form);

    try {
      await HepaticaDB.saveSurvey(record);
      await HepaticaDB.clearDraft(draftKey());
      showToast('Survey saved');
      showScreen('records');
    } catch (err) {
      showToast('Save failed: ' + err.message, true);
      console.error(err);
    }
  }

  // ── Records screen ───────────────────────────────────────────

  async function renderRecords() {
    const list = $('records-list');
    list.innerHTML = '<p class="loading-msg">Loading…</p>';

    let records;
    try { records = await HepaticaDB.getAllSurveys(); }
    catch (e) { list.innerHTML = '<p class="err-msg">Could not load records.</p>'; return; }

    const sort = $('sort-select').value;
    records.sort((a, b) => {
      if (sort === 'date-desc') return (b.date || '').localeCompare(a.date || '');
      if (sort === 'date-asc')  return (a.date || '').localeCompare(b.date || '');
      if (sort === 'patch')     return (a.patch + a.quadrat).localeCompare(b.patch + b.quadrat);
      return 0;
    });

    if (!records.length) {
      list.innerHTML = '<p class="empty-msg">No surveys saved yet.</p>';
      return;
    }

    list.innerHTML = '';
    records.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'rec-card';

      const hep = (rec.species || []).find(s => s.name === 'Hepatica americana');
      const hepStr = hep ? hep.cover + '%' + (hep.stems ? ' · ' + hep.stems + ' stems' : '') : '—';

      card.innerHTML =
        '<div class="rec-header">' +
          '<span class="rec-badge">Patch ' + esc(rec.patch) + ' / ' + esc(rec.quadrat) + '</span>' +
          '<span class="rec-date">' + esc(rec.date || '—') + '</span>' +
        '</div>' +
        '<div class="rec-body">' +
          '<span class="rec-year">' + esc(rec.year) + '</span>' +
          '<span class="rec-hep"><em>H. americana</em>: ' + hepStr + '</span>' +
          (rec.hepatica_flowering ? '<span class="rec-meta">' + esc(rec.hepatica_flowering) + '</span>' : '') +
        '</div>' +
        '<div class="rec-actions">' +
          '<button class="btn-rec-view">View</button>' +
          '<button class="btn-rec-del">Delete</button>' +
        '</div>';

      card.querySelector('.btn-rec-view').addEventListener('click', () => showRecordDetail(rec));
      card.querySelector('.btn-rec-del').addEventListener('click', async () => {
        if (!confirm('Delete this survey record? This cannot be undone.')) return;
        await HepaticaDB.deleteSurvey(rec.id);
        renderRecords();
      });

      list.appendChild(card);
    });
  }

  // ── Record detail modal ──────────────────────────────────────

  function closeDetailModal() {
    $('detail-modal').hidden = true;
    $('detail-modal').setAttribute('aria-hidden', 'true');
  }

  function showRecordDetail(rec) {
    const modal = $('detail-modal');
    $('detail-title').textContent = 'Patch ' + rec.patch + ' / ' + rec.quadrat + ' — ' + (rec.date || '');

    const body = $('detail-body');
    const lines = [];

    lines.push(row('Year',    rec.year));
    lines.push(row('Date',    rec.date));
    lines.push(row('Patch',   rec.patch));
    lines.push(row('Quadrat', rec.quadrat));

    if (rec.species && rec.species.length) {
      lines.push('<h3 class="detail-section">Species Cover</h3>');
      rec.species.forEach(s => {
        const stems = s.stems ? ' · ' + s.stems + ' stems' : '';
        lines.push(row(esc(s.name), esc(s.cover) + '%' + stems));
      });
    }

    lines.push('<h3 class="detail-section">H. americana Status</h3>');
    lines.push(row('Flowering', rec.hepatica_flowering || '—'));
    lines.push(row('Health',    rec.hepatica_health    || '—'));

    if (rec.invasives && rec.invasives.length) {
      lines.push('<h3 class="detail-section">Invasive Species</h3>');
      lines.push('<p class="detail-value">' + rec.invasives.map(esc).join('<br>') + '</p>');
    }

    lines.push('<h3 class="detail-section">Site Conditions</h3>');
    lines.push(row('Flood/water observed', rec.flood_observed ? 'Yes' : 'No'));
    if (rec.flood_observed && rec.flood_notes)
      lines.push(row('Flood notes', esc(rec.flood_notes)));
    if (rec.ground_cover_notes)
      lines.push(row('Ground cover', esc(rec.ground_cover_notes)));
    if (rec.general_observations)
      lines.push(row('General observations', esc(rec.general_observations)));
    if (rec.photo_refs)
      lines.push(row('Photo refs', esc(rec.photo_refs)));

    body.innerHTML = lines.join('');
    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
  }

  function row(label, val) {
    return '<div class="detail-row"><span class="detail-label">' + label + '</span>' +
           '<span class="detail-value">' + val + '</span></div>';
  }

  // ── CSV Export ───────────────────────────────────────────────

  async function exportCSV() {
    let records;
    try { records = await HepaticaDB.getAllSurveys(); }
    catch (e) { showToast('Export failed', true); return; }

    if (!records.length) { showToast('No records to export'); return; }

    const headers = [
      'id','year','patch','quadrat','date',
      'hepatica_cover_pct','hepatica_stems',
      'hepatica_flowering','hepatica_health',
      'all_species','invasives',
      'flood_observed','flood_notes',
      'ground_cover_notes','general_observations',
      'photo_refs','saved_at',
    ];

    const rows = records.map(rec => {
      const hep    = (rec.species || []).find(s => s.name === 'Hepatica americana') || {};
      const allSp  = (rec.species || []).map(s => s.name + ':' + s.cover + '%' + (s.stems ? ':' + s.stems : '')).join('; ');
      const invStr = (rec.invasives || []).join('; ');

      return [
        rec.id, rec.year, rec.patch, rec.quadrat, rec.date,
        hep.cover  || '',
        hep.stems  || '',
        rec.hepatica_flowering || '',
        rec.hepatica_health    || '',
        allSp, invStr,
        rec.flood_observed ? 'Yes' : 'No',
        rec.flood_notes          || '',
        rec.ground_cover_notes   || '',
        rec.general_observations || '',
        rec.photo_refs           || '',
        rec.savedAt              || '',
      ].map(csvCell);
    });

    const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'hepatica_surveys_' + todayISO() + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(val) {
    const s = String(val == null ? '' : val);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // ── Toast ────────────────────────────────────────────────────

  let toastTimer;

  function showToast(msg, isError) {
    const t = $('toast');
    clearTimeout(toastTimer);
    t.textContent = msg;
    t.className   = 'toast toast--visible' + (isError ? ' toast--error' : '');
    toastTimer    = setTimeout(() => t.classList.remove('toast--visible'), 3000);
  }

  // ── Radio helpers ────────────────────────────────────────────

  function setRadio(name, value) {
    qsa('input[name="' + name + '"]').forEach(r => { r.checked = r.value === value; });
  }

  function getRadio(name) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  // ── Escape helper ────────────────────────────────────────────

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Boot ─────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', init);

})();
