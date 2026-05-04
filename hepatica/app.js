/* ============================================================
   app.js — Hepatica americana survey app (v2)
   ============================================================ */

(function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────

  const QUAD_STEPS  = 4;
  const PATCH_STEPS = 2;

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
    screen:      'home',
    year:        String(new Date().getFullYear()),
    surveyRound: 'Spring',
    date:        todayISO(),
    patch:       null,
    quadrat:     null,
    step:        1,
    editId:      null,
    form:        freshForm(),
    patchStep:   1,
    editPatchId: null,
    patchForm:   freshPatchForm(),
  };

  function freshForm() {
    return {
      species:              [],
      hepatica_flowering:   '',
      hepatica_health:      '',
      phenology:            [],
      herbivory:            '',
      invasives:            [],
      disturbance_observed: false,
      disturbance_notes:    '',
      erosion_observed:     false,
      erosion_notes:        '',
      ground_cover_notes:   '',
      general_observations: '',
      photo_refs:           '',
    };
  }

  function freshPatchForm() {
    return {
      canopy_cover:         '',
      canopy_species:       '',
      litter_depth:         '',
      site_health:          '',
      deer_browse:          '',
      soil_moisture:        '',
      competitive_pressure: '',
      patch_notes:          '',
    };
  }

  function draftKey() {
    return state.year + '_' + state.surveyRound + '_' + state.patch + '_' + state.quadrat;
  }

  function patchDraftKey() {
    return 'PATCH_' + state.year + '_' + state.surveyRound + '_' + state.patch;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── DOM helpers ──────────────────────────────────────────────

  const $ = id => document.getElementById(id);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ── Init ─────────────────────────────────────────────────────

  async function init() {
    const yearSel = $('sel-year');
    const thisYear = new Date().getFullYear();
    for (let y = thisYear; y >= thisYear - 5; y--) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      yearSel.appendChild(opt);
    }
    yearSel.value = state.year;
    yearSel.addEventListener('change', () => { state.year = yearSel.value; });

    qsa('input[name="survey-round"]').forEach(r => {
      r.addEventListener('change', () => { state.surveyRound = r.value; });
    });

    const homeDate = $('home-date');
    homeDate.value = state.date;
    homeDate.addEventListener('change', () => {
      state.date = homeDate.value;
      checkSeasonWarning();
    });
    checkSeasonWarning();

    qsa('.patch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('.patch-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.patch = btn.dataset.patch;
        updateHomeButtons();
      });
    });

    qsa('.quad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('.quad-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.quadrat = btn.dataset.quad;
        updateHomeButtons();
      });
    });

    $('btn-start').addEventListener('click', handleStart);
    $('btn-patch-form').addEventListener('click', handlePatchStart);
    $('btn-export-csv').addEventListener('click', exportCSV);
    $('btn-prev').addEventListener('click', prevStep);
    $('btn-next').addEventListener('click', nextStep);
    $('btn-save').addEventListener('click', saveSurvey);
    $('btn-resume').addEventListener('click', resumeDraft);
    $('btn-fresh').addEventListener('click', startFresh);
    $('sort-select').addEventListener('change', () => renderRecords());

    $('btn-patch-prev').addEventListener('click', prevPatchStep);
    $('btn-patch-next').addEventListener('click', nextPatchStep);
    $('btn-patch-save').addEventListener('click', savePatchData);
    $('btn-patch-resume').addEventListener('click', resumePatchDraft);
    $('btn-patch-fresh').addEventListener('click', startPatchFresh);

    $('btn-add-photo-point').addEventListener('click', () => showPhotoForm());
    $('btn-photo-cancel').addEventListener('click', hidePhotoForm);
    $('btn-photo-save').addEventListener('click', savePhotoPoint);

    $('detail-close').addEventListener('click', closeDetailModal);
    $('detail-modal').addEventListener('click', e => {
      if (e.target === $('detail-modal')) closeDetailModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('detail-modal').hidden) closeDetailModal();
    });

    qsa('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => showScreen(tab.dataset.screen));
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/safety/hepatica/service-worker.js', { scope: '/safety/hepatica/' })
        .catch(e => console.warn('SW registration failed:', e));
    }
  }

  function checkSeasonWarning() {
    const month = parseInt((state.date || '').slice(5, 7), 10);
    $('season-warning').hidden = (month >= 5 && month <= 6);
  }

  function updateHomeButtons() {
    $('btn-patch-form').disabled = !state.patch;
    $('btn-start').disabled      = !(state.patch && state.quadrat);
  }

  // ── Screen navigation ────────────────────────────────────────

  const FORM_SCREENS = new Set(['form', 'patch-form', 'draft', 'patch-draft']);

  function showScreen(name) {
    state.screen = name;
    qsa('.screen').forEach(s => s.hidden = true);
    $('screen-' + name).hidden = false;
    $('bottom-nav').hidden = FORM_SCREENS.has(name);

    qsa('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.screen === name);
    });

    if (name === 'records')  renderRecords();
    if (name === 'photos')   renderPhotosScreen();
    if (name === 'register') renderRegisterScreen();
  }

  // ── Quadrat draft / start ────────────────────────────────────

  async function handleStart() {
    const draft = await HepaticaDB.getDraft(draftKey());
    if (draft) {
      $('draft-context').textContent =
        'Patch ' + state.patch + ' / ' + state.quadrat +
        ' — ' + state.surveyRound + ' ' + state.year + ' (' + state.date + ')';
      state.form = draft;
      showScreen('draft');
    } else {
      startFresh();
    }
  }

  function resumeDraft() { openForm(); }

  function startFresh() {
    state.form   = freshForm();
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

  // ── Patch draft / start ──────────────────────────────────────

  async function handlePatchStart() {
    const draft = await HepaticaDB.getDraft(patchDraftKey());
    if (draft) {
      $('patch-draft-context').textContent =
        'Patch ' + state.patch + ' — ' + state.surveyRound + ' ' + state.year;
      state.patchForm = draft;
      showScreen('patch-draft');
    } else {
      startPatchFresh();
    }
  }

  function resumePatchDraft() { openPatchForm(); }

  function startPatchFresh() {
    state.patchForm    = freshPatchForm();
    state.editPatchId  = null;
    openPatchForm();
  }

  function openPatchForm() {
    state.patchStep = 1;
    showScreen('patch-form');
    updatePatchContextBar();
    renderPatchStep(1);
    updatePatchNavButtons();
  }

  // ── Auto-save drafts ─────────────────────────────────────────

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

  let patchDraftTimer = null;

  function schedulePatchDraftSave() {
    clearTimeout(patchDraftTimer);
    patchDraftTimer = setTimeout(autoPatchSaveDraft, 800);
  }

  async function autoPatchSaveDraft() {
    if (!state.patch) return;
    collectCurrentPatchStep();
    await HepaticaDB.saveDraft(patchDraftKey(), state.patchForm).catch(() => {});
  }

  // ── Context bars ─────────────────────────────────────────────

  function updateContextBar() {
    $('ctx-patch-quad').textContent = 'Patch ' + state.patch + ' · ' + state.quadrat;
    $('ctx-year').textContent       = state.surveyRound + ' ' + state.year + ' · ' + state.date;
    $('ctx-step').textContent       = 'Step ' + state.step + ' of ' + QUAD_STEPS;
  }

  function updatePatchContextBar() {
    $('ctx-patch-only').textContent = 'Patch ' + state.patch;
    $('ctx-patch-year').textContent = state.surveyRound + ' ' + state.year + ' · ' + state.date;
    $('ctx-patch-step').textContent = 'Step ' + state.patchStep + ' of ' + PATCH_STEPS;
  }

  // ── Quadrat form rendering ───────────────────────────────────

  function renderStep(n) {
    qsa('#screen-form .step-panel').forEach(p => p.hidden = true);
    $('step-' + n).hidden = false;
    if (n === 1) renderStep1();
    if (n === 2) renderStep2();
    if (n === 3) renderStep3();
    if (n === 4) renderStep4();
  }

  function renderStep1() {
    setRadio('f-flowering', state.form.hepatica_flowering);
    setRadio('f-health',    state.form.hepatica_health);
    setRadio('f-herbivory', state.form.herbivory);

    qsa('input[name="f-flowering"]').forEach(r => r.addEventListener('change', () => {
      state.form.hepatica_flowering = r.value; scheduleDraftSave();
    }));
    qsa('input[name="f-health"]').forEach(r => r.addEventListener('change', () => {
      state.form.hepatica_health = r.value; scheduleDraftSave();
    }));
    qsa('input[name="f-herbivory"]').forEach(r => r.addEventListener('change', () => {
      state.form.herbivory = r.value; scheduleDraftSave();
    }));

    qsa('input[name="f-phenology"]').forEach(cb => {
      cb.checked = state.form.phenology.includes(cb.value);
      cb.addEventListener('change', () => {
        const set = new Set(state.form.phenology);
        if (cb.checked) set.add(cb.value); else set.delete(cb.value);
        state.form.phenology = [...set];
        scheduleDraftSave();
      });
    });
  }

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
      tr.querySelector('.sp-other').hidden = this.value !== 'Other';
      scheduleDraftSave();
    });
    tr.querySelector('.btn-del-row').addEventListener('click', () => {
      tr.remove(); scheduleDraftSave();
    });
    qsa('input, select', tr).forEach(el => el.addEventListener('input', scheduleDraftSave));
    tbody.appendChild(tr);
  }

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

  function renderStep4() {
    const distCb    = $('f-disturbance');
    const distNotes = $('f-disturbance-notes');
    distCb.checked  = state.form.disturbance_observed;
    distNotes.value = state.form.disturbance_notes || '';
    $('disturbance-notes-wrap').hidden = !state.form.disturbance_observed;

    distCb.addEventListener('change', () => {
      state.form.disturbance_observed = distCb.checked;
      $('disturbance-notes-wrap').hidden = !distCb.checked;
      scheduleDraftSave();
    });
    distNotes.addEventListener('input', () => {
      state.form.disturbance_notes = distNotes.value;
      scheduleDraftSave();
    });

    const erosionCb    = $('f-erosion');
    const erosionNotes = $('f-erosion-notes');
    erosionCb.checked  = state.form.erosion_observed;
    erosionNotes.value = state.form.erosion_notes || '';
    $('erosion-notes-wrap').hidden = !state.form.erosion_observed;

    erosionCb.addEventListener('change', () => {
      state.form.erosion_observed = erosionCb.checked;
      $('erosion-notes-wrap').hidden = !erosionCb.checked;
      scheduleDraftSave();
    });
    erosionNotes.addEventListener('input', () => {
      state.form.erosion_notes = erosionNotes.value;
      scheduleDraftSave();
    });

    $('f-ground-cover').value = state.form.ground_cover_notes   || '';
    $('f-observations').value = state.form.general_observations || '';
    $('f-photos').value       = state.form.photo_refs           || '';
    [$('f-ground-cover'), $('f-observations'), $('f-photos')].forEach(el =>
      el.addEventListener('input', scheduleDraftSave)
    );
  }

  // ── Collect quadrat step data ────────────────────────────────

  function collectCurrentStep() {
    if (state.step === 1) collectStep1();
    if (state.step === 2) collectStep2();
    if (state.step === 3) collectStep3();
    if (state.step === 4) collectStep4();
  }

  function collectStep1() {
    state.form.hepatica_flowering = getRadio('f-flowering');
    state.form.hepatica_health    = getRadio('f-health');
    state.form.herbivory          = getRadio('f-herbivory');
    state.form.phenology = qsa('input[name="f-phenology"]:checked').map(cb => cb.value);
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
    state.form.disturbance_observed = $('f-disturbance').checked;
    state.form.disturbance_notes    = $('f-disturbance-notes').value.trim();
    state.form.erosion_observed     = $('f-erosion').checked;
    state.form.erosion_notes        = $('f-erosion-notes').value.trim();
    state.form.ground_cover_notes   = $('f-ground-cover').value.trim();
    state.form.general_observations = $('f-observations').value.trim();
    state.form.photo_refs           = $('f-photos').value.trim();
  }

  // ── Quadrat step navigation ──────────────────────────────────

  function nextStep() {
    collectCurrentStep();
    autoSaveDraft();
    if (state.step < QUAD_STEPS) {
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
    const isLast = state.step === QUAD_STEPS;
    $('btn-next').hidden = isLast;
    $('btn-save').hidden = !isLast;
  }

  // ── Patch form rendering ─────────────────────────────────────

  function renderPatchStep(n) {
    qsa('#screen-patch-form .step-panel').forEach(p => p.hidden = true);
    $('patch-step-' + n).hidden = false;
    if (n === 1) renderPatchStep1();
    if (n === 2) renderPatchStep2();
  }

  function renderPatchStep1() {
    $('p-canopy-cover').value   = state.patchForm.canopy_cover   || '';
    $('p-canopy-species').value = state.patchForm.canopy_species || '';
    $('p-litter-depth').value   = state.patchForm.litter_depth   || '';
    setRadio('p-site-health', state.patchForm.site_health);

    [$('p-canopy-cover'), $('p-canopy-species'), $('p-litter-depth')].forEach(el =>
      el.addEventListener('input', schedulePatchDraftSave)
    );
    qsa('input[name="p-site-health"]').forEach(r => r.addEventListener('change', () => {
      state.patchForm.site_health = r.value; schedulePatchDraftSave();
    }));
  }

  function renderPatchStep2() {
    setRadio('p-deer-browse',   state.patchForm.deer_browse);
    setRadio('p-soil-moisture', state.patchForm.soil_moisture);
    setRadio('p-comp-pressure', state.patchForm.competitive_pressure);
    $('p-patch-notes').value = state.patchForm.patch_notes || '';

    qsa('input[name="p-deer-browse"]').forEach(r => r.addEventListener('change', () => {
      state.patchForm.deer_browse = r.value; schedulePatchDraftSave();
    }));
    qsa('input[name="p-soil-moisture"]').forEach(r => r.addEventListener('change', () => {
      state.patchForm.soil_moisture = r.value; schedulePatchDraftSave();
    }));
    qsa('input[name="p-comp-pressure"]').forEach(r => r.addEventListener('change', () => {
      state.patchForm.competitive_pressure = r.value; schedulePatchDraftSave();
    }));
    $('p-patch-notes').addEventListener('input', schedulePatchDraftSave);
  }

  // ── Collect patch step data ──────────────────────────────────

  function collectCurrentPatchStep() {
    if (state.patchStep === 1) collectPatchStep1();
    if (state.patchStep === 2) collectPatchStep2();
  }

  function collectPatchStep1() {
    state.patchForm.canopy_cover   = $('p-canopy-cover').value;
    state.patchForm.canopy_species = $('p-canopy-species').value.trim();
    state.patchForm.litter_depth   = $('p-litter-depth').value.trim();
    state.patchForm.site_health    = getRadio('p-site-health');
  }

  function collectPatchStep2() {
    state.patchForm.deer_browse           = getRadio('p-deer-browse');
    state.patchForm.soil_moisture         = getRadio('p-soil-moisture');
    state.patchForm.competitive_pressure  = getRadio('p-comp-pressure');
    state.patchForm.patch_notes           = $('p-patch-notes').value.trim();
  }

  // ── Patch step navigation ────────────────────────────────────

  function nextPatchStep() {
    collectCurrentPatchStep();
    autoPatchSaveDraft();
    if (state.patchStep < PATCH_STEPS) {
      state.patchStep++;
      renderPatchStep(state.patchStep);
      updatePatchContextBar();
      updatePatchNavButtons();
      window.scrollTo(0, 0);
    }
  }

  function prevPatchStep() {
    collectCurrentPatchStep();
    if (state.patchStep > 1) {
      state.patchStep--;
      renderPatchStep(state.patchStep);
      updatePatchContextBar();
      updatePatchNavButtons();
      window.scrollTo(0, 0);
    } else {
      autoPatchSaveDraft();
      showScreen('home');
    }
  }

  function updatePatchNavButtons() {
    $('btn-patch-prev').textContent = state.patchStep === 1 ? '← Cancel' : '← Back';
    const isLast = state.patchStep === PATCH_STEPS;
    $('btn-patch-next').hidden = isLast;
    $('btn-patch-save').hidden = !isLast;
  }

  // ── Save patch data ──────────────────────────────────────────

  async function savePatchData() {
    collectCurrentPatchStep();
    const id = state.editPatchId || Date.now();
    const record = Object.assign({
      id,
      year:        state.year,
      surveyRound: state.surveyRound,
      patch:       state.patch,
      date:        state.date,
      savedAt:     new Date().toISOString(),
    }, state.patchForm);

    try {
      await HepaticaDB.savePatchRecord(record);
      await HepaticaDB.clearDraft(patchDraftKey());
      showToast('Patch data saved');
      showScreen('home');
    } catch (err) {
      showToast('Save failed: ' + err.message, true);
      console.error(err);
    }
  }

  // ── Save quadrat survey ──────────────────────────────────────

  async function saveSurvey() {
    collectCurrentStep();
    const id = state.editId || Date.now();
    const record = Object.assign({
      id,
      year:        state.year,
      surveyRound: state.surveyRound,
      patch:       state.patch,
      quadrat:     state.quadrat,
      date:        state.date,
      savedAt:     new Date().toISOString(),
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
      const round = rec.surveyRound ? rec.surveyRound + ' ' : '';

      card.innerHTML =
        '<div class="rec-header">' +
          '<span class="rec-badge">Patch ' + esc(rec.patch) + ' / ' + esc(rec.quadrat) + '</span>' +
          '<span class="rec-date">' + esc(rec.date || '—') + '</span>' +
        '</div>' +
        '<div class="rec-body">' +
          '<span class="rec-year">' + round + esc(rec.year) + '</span>' +
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
    $('detail-title').textContent = 'Patch ' + rec.patch + ' / ' + rec.quadrat + ' — ' + (rec.date || '');
    const body = $('detail-body');
    const lines = [];

    lines.push(row('Year',    rec.surveyRound ? rec.surveyRound + ' ' + rec.year : rec.year));
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
    if (rec.phenology && rec.phenology.length)
      lines.push(row('Phenology', esc(rec.phenology.join(', '))));
    if (rec.herbivory)
      lines.push(row('Herbivory', esc(rec.herbivory)));

    if (rec.invasives && rec.invasives.length) {
      lines.push('<h3 class="detail-section">Invasive Species</h3>');
      lines.push('<p class="detail-value">' + rec.invasives.map(esc).join('<br>') + '</p>');
    }

    lines.push('<h3 class="detail-section">Site Conditions</h3>');
    lines.push(row('Disturbance/flood', rec.disturbance_observed ? 'Yes' : 'No'));
    if (rec.disturbance_observed && rec.disturbance_notes)
      lines.push(row('Disturbance notes', esc(rec.disturbance_notes)));
    lines.push(row('Erosion', rec.erosion_observed ? 'Yes' : 'No'));
    if (rec.erosion_observed && rec.erosion_notes)
      lines.push(row('Erosion notes', esc(rec.erosion_notes)));
    if (rec.ground_cover_notes)
      lines.push(row('Ground cover', esc(rec.ground_cover_notes)));
    if (rec.general_observations)
      lines.push(row('General observations', esc(rec.general_observations)));
    if (rec.photo_refs)
      lines.push(row('Photo refs', esc(rec.photo_refs)));

    body.innerHTML = lines.join('');
    $('detail-modal').hidden = false;
    $('detail-modal').removeAttribute('aria-hidden');
  }

  function row(label, val) {
    return '<div class="detail-row"><span class="detail-label">' + label + '</span>' +
           '<span class="detail-value">' + val + '</span></div>';
  }

  // ── Photo-point management ───────────────────────────────────

  let editPhotoId = null;

  function showPhotoForm(rec) {
    editPhotoId = rec ? rec.id : null;
    $('photo-form-title').textContent = rec ? 'Edit Photo-Point' : 'Add Photo-Point';
    $('pp-id').value        = rec ? rec.pointId   || '' : '';
    $('pp-patch').value     = rec ? rec.patch      || '' : '';
    $('pp-direction').value = rec ? rec.direction  || '' : '';
    $('pp-frame').value     = rec ? rec.frame      || '' : '';
    $('pp-notes').value     = rec ? rec.notes      || '' : '';
    $('photo-point-form').hidden = false;
    $('pp-id').focus();
  }

  function hidePhotoForm() {
    $('photo-point-form').hidden = true;
    editPhotoId = null;
  }

  async function savePhotoPoint() {
    const pointId   = $('pp-id').value.trim();
    const patch     = $('pp-patch').value;
    const direction = $('pp-direction').value;
    const frame     = $('pp-frame').value.trim();
    const notes     = $('pp-notes').value.trim();

    if (!pointId) { showToast('Point ID is required', true); return; }

    const record = {
      id:        editPhotoId || Date.now(),
      pointId,   patch, direction, frame, notes,
      savedAt:   new Date().toISOString(),
    };

    try {
      await HepaticaDB.savePhotoPoint(record);
      showToast('Photo-point saved');
      hidePhotoForm();
      renderPhotosScreen();
    } catch (err) {
      showToast('Save failed: ' + err.message, true);
    }
  }

  async function renderPhotosScreen() {
    const list = $('photo-points-list');
    list.innerHTML = '<p class="loading-msg">Loading…</p>';
    let points;
    try { points = await HepaticaDB.getAllPhotoPoints(); }
    catch (e) { list.innerHTML = '<p class="err-msg">Could not load photo-points.</p>'; return; }

    if (!points.length) {
      list.innerHTML = '<p class="empty-msg">No photo-points saved yet.</p>';
      return;
    }

    points.sort((a, b) => (a.pointId || '').localeCompare(b.pointId || ''));
    list.innerHTML = '';
    points.forEach(pt => {
      const card = document.createElement('div');
      card.className = 'pp-card';
      card.innerHTML =
        '<div class="pp-header">' +
          '<span class="pp-id">' + esc(pt.pointId) + '</span>' +
          '<span class="pp-patch-badge">Patch ' + esc(pt.patch || '—') + '</span>' +
        '</div>' +
        '<div class="pp-meta">' +
          (pt.direction ? '<span>' + esc(pt.direction) + '</span>' : '') +
          (pt.frame     ? '<span>Frame: ' + esc(pt.frame) + '</span>' : '') +
        '</div>' +
        (pt.notes ? '<p class="pp-notes">' + esc(pt.notes) + '</p>' : '') +
        '<div class="rec-actions">' +
          '<button class="btn-rec-view">Edit</button>' +
          '<button class="btn-rec-del">Delete</button>' +
        '</div>';

      card.querySelector('.btn-rec-view').addEventListener('click', () => showPhotoForm(pt));
      card.querySelector('.btn-rec-del').addEventListener('click', async () => {
        if (!confirm('Delete this photo-point? This cannot be undone.')) return;
        await HepaticaDB.deletePhotoPoint(pt.id);
        renderPhotosScreen();
      });
      list.appendChild(card);
    });
  }

  // ── Register screen ──────────────────────────────────────────

  async function renderRegisterScreen() {
    const quadDiv  = $('register-quadrats');
    const photoDiv = $('register-photos');
    quadDiv.innerHTML  = '<p class="loading-msg">Loading…</p>';
    photoDiv.innerHTML = '<p class="loading-msg">Loading…</p>';

    const [surveys, photos] = await Promise.all([
      HepaticaDB.getAllSurveys().catch(() => []),
      HepaticaDB.getAllPhotoPoints().catch(() => []),
    ]);

    if (!surveys.length) {
      quadDiv.innerHTML = '<p class="empty-msg">No surveys recorded.</p>';
    } else {
      surveys.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      quadDiv.innerHTML =
        '<table class="reg-table"><thead><tr>' +
        '<th>Date</th><th>Round</th><th>Patch</th><th>Quad</th><th><em>H.a.</em> Cover</th>' +
        '</tr></thead><tbody>' +
        surveys.map(s => {
          const hep = (s.species || []).find(sp => sp.name === 'Hepatica americana');
          return '<tr>' +
            '<td>' + esc(s.date || '—') + '</td>' +
            '<td>' + esc(s.surveyRound || '—') + '</td>' +
            '<td>' + esc(s.patch || '—') + '</td>' +
            '<td>' + esc(s.quadrat || '—') + '</td>' +
            '<td>' + (hep ? esc(hep.cover) + '%' : '—') + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table>';
    }

    if (!photos.length) {
      photoDiv.innerHTML = '<p class="empty-msg">No photo-points registered.</p>';
    } else {
      photos.sort((a, b) => (a.pointId || '').localeCompare(b.pointId || ''));
      photoDiv.innerHTML =
        '<table class="reg-table"><thead><tr>' +
        '<th>Point ID</th><th>Patch</th><th>Dir.</th><th>Frame</th><th>Notes</th>' +
        '</tr></thead><tbody>' +
        photos.map(p =>
          '<tr>' +
          '<td>' + esc(p.pointId   || '—') + '</td>' +
          '<td>' + esc(p.patch     || '—') + '</td>' +
          '<td>' + esc(p.direction || '—') + '</td>' +
          '<td>' + esc(p.frame     || '—') + '</td>' +
          '<td>' + esc(p.notes     || '') + '</td>' +
          '</tr>'
        ).join('') +
        '</tbody></table>';
    }
  }

  // ── CSV Export ───────────────────────────────────────────────

  async function exportCSV() {
    const [surveys, patchRecs, photos] = await Promise.all([
      HepaticaDB.getAllSurveys().catch(() => []),
      HepaticaDB.getAllPatchRecords().catch(() => []),
      HepaticaDB.getAllPhotoPoints().catch(() => []),
    ]);

    if (!surveys.length && !patchRecs.length && !photos.length) {
      showToast('No records to export'); return;
    }

    const parts = [];

    parts.push('# QUADRAT RECORDS');
    parts.push([
      'id','year','survey_round','patch','quadrat','date',
      'hepatica_cover_pct','hepatica_stems',
      'hepatica_flowering','hepatica_health',
      'phenology','herbivory',
      'all_species','invasives',
      'disturbance_observed','disturbance_notes',
      'erosion_observed','erosion_notes',
      'ground_cover_notes','general_observations',
      'photo_refs','saved_at',
    ].join(','));
    surveys.forEach(rec => {
      const hep   = (rec.species || []).find(s => s.name === 'Hepatica americana') || {};
      const allSp = (rec.species || []).map(s =>
        s.name + ':' + s.cover + '%' + (s.stems ? ':' + s.stems : '')
      ).join('; ');
      parts.push([
        rec.id, rec.year, rec.surveyRound || '', rec.patch, rec.quadrat, rec.date,
        hep.cover || '', hep.stems || '',
        rec.hepatica_flowering || '', rec.hepatica_health || '',
        (rec.phenology || []).join('; '), rec.herbivory || '',
        allSp, (rec.invasives || []).join('; '),
        rec.disturbance_observed ? 'Yes' : 'No', rec.disturbance_notes || '',
        rec.erosion_observed     ? 'Yes' : 'No', rec.erosion_notes     || '',
        rec.ground_cover_notes || '', rec.general_observations || '',
        rec.photo_refs || '', rec.savedAt || '',
      ].map(csvCell).join(','));
    });

    parts.push('');
    parts.push('# PATCH RECORDS');
    parts.push([
      'id','year','survey_round','patch','date',
      'canopy_cover_pct','canopy_species','litter_depth','site_health',
      'deer_browse','soil_moisture','competitive_pressure',
      'patch_notes','saved_at',
    ].join(','));
    patchRecs.forEach(rec => {
      parts.push([
        rec.id, rec.year, rec.surveyRound || '', rec.patch, rec.date,
        rec.canopy_cover || '', rec.canopy_species || '', rec.litter_depth || '',
        rec.site_health || '', rec.deer_browse || '', rec.soil_moisture || '',
        rec.competitive_pressure || '', rec.patch_notes || '', rec.savedAt || '',
      ].map(csvCell).join(','));
    });

    parts.push('');
    parts.push('# PHOTO-POINT RECORDS');
    parts.push(['id','point_id','patch','direction','frame','notes','saved_at'].join(','));
    photos.forEach(pt => {
      parts.push([
        pt.id, pt.pointId || '', pt.patch || '', pt.direction || '',
        pt.frame || '', pt.notes || '', pt.savedAt || '',
      ].map(csvCell).join(','));
    });

    const blob = new Blob([parts.join('\r\n')], { type: 'text/csv' });
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
