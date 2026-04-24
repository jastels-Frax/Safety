/* ============================================================
   submissions.js — Submissions viewer
   Depends on: FraxinusDB (window.FraxinusDB from db.js)
   ============================================================ */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const content = $('sub-content');

  // ── Type metadata ────────────────────────────────────────────

  const TYPE_META = {
    toolbox: { label: 'Toolbox Talk',      badge: 'badge-toolbox' },
    jsha:    { label: 'Hazard Assessment', badge: 'badge-jsha'    },
  };

  // ── Utilities ────────────────────────────────────────────────

  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function recordDate(rec) {
    return (rec.data && rec.data.date) ? rec.data.date
         : rec.date                    ? rec.date.slice(0, 10)
         : '—';
  }

  function byTimestampDesc(a, b) { return b.id - a.id; }

  // ── Load and render ──────────────────────────────────────────

  async function loadSubmissions() {
    content.innerHTML = '<p class="sub-loading">Loading…</p>';

    let all;
    try {
      all = await FraxinusDB.getAllSubmissions();
    } catch (err) {
      content.innerHTML = '<p class="sub-error">Could not load submissions.</p>';
      console.error(err);
      return;
    }

    const toolbox = all.filter(r => r.type === 'toolbox').sort(byTimestampDesc);
    const jsha    = all.filter(r => r.type === 'jsha').sort(byTimestampDesc);

    content.innerHTML = '';

    if (!all.length) {
      renderEmpty();
      return;
    }

    if (toolbox.length) renderGroup('Toolbox Talks', toolbox);
    if (jsha.length)    renderGroup('Hazard Assessments', jsha);
  }

  function renderEmpty() {
    content.innerHTML =
      '<div class="sub-empty">' +
        '<svg class="sub-empty-icon" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<rect x="8" y="6" width="36" height="42" rx="4" stroke="#DDD6CC" stroke-width="2"/>' +
          '<line x1="17" y1="18" x2="35" y2="18" stroke="#DDD6CC" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="17" y1="25" x2="35" y2="25" stroke="#DDD6CC" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="17" y1="32" x2="27" y2="32" stroke="#DDD6CC" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>' +
        '<p class="sub-empty-title">No Submissions Yet</p>' +
        '<p class="sub-empty-text">Saved Toolbox Talks and Hazard Assessments will appear here once a form is submitted.</p>' +
      '</div>';
  }

  function renderGroup(title, records) {
    const group = document.createElement('div');
    group.className = 'sub-group';

    const heading = document.createElement('h2');
    heading.className = 'sub-group-title';
    heading.textContent = title;
    group.appendChild(heading);

    records.forEach(rec => group.appendChild(buildCard(rec)));
    content.appendChild(group);
  }

  function buildCard(rec) {
    const meta    = TYPE_META[rec.type] || { label: rec.type, badge: '' };
    const project = (rec.data && rec.data.project) ? rec.data.project : '—';

    const card = document.createElement('article');
    card.className = 'sub-card';
    card.innerHTML =
      '<div class="sub-card-info">' +
        '<div class="sub-card-top">' +
          '<span class="sub-type-badge ' + meta.badge + '">' + esc(meta.label) + '</span>' +
          '<span class="sub-date">' + esc(recordDate(rec)) + '</span>' +
        '</div>' +
        '<p class="sub-project">' + esc(project) + '</p>' +
      '</div>' +
      '<div class="sub-card-actions">' +
        '<button class="sub-btn sub-btn-view"     aria-label="View submission">View</button>' +
        '<button class="sub-btn sub-btn-download" aria-label="Download JSON">Download</button>' +
        '<button class="sub-btn sub-btn-delete"   aria-label="Delete submission">Delete</button>' +
      '</div>';

    card.querySelector('.sub-btn-view')    .addEventListener('click', ()  => openModal(rec));
    card.querySelector('.sub-btn-download').addEventListener('click', ()  => downloadRecord(rec));
    card.querySelector('.sub-btn-delete')  .addEventListener('click', ()  => deleteRecord(rec, card));

    return card;
  }

  // ── View modal ───────────────────────────────────────────────

  const overlay    = $('sub-modal-overlay');
  const modalTitle = $('sub-modal-title');
  const modalBody  = $('sub-modal-body');

  function openModal(rec) {
    const meta = TYPE_META[rec.type] || { label: rec.type };
    const date = rec.data && rec.data.date ? '  ·  ' + rec.data.date : '';
    modalTitle.textContent = meta.label + date;
    modalBody.innerHTML    = formatRecord(rec);
    overlay.hidden         = false;
    overlay.removeAttribute('aria-hidden');
    $('sub-modal-close').focus();
  }

  function closeModal() {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
  }

  $('sub-modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  // ── Format a record as readable HTML ─────────────────────────

  function formatRecord(rec) {
    const d   = rec.data || {};
    const out = [];

    out.push(mField('Date',            d.date));
    out.push(mField('Project',         d.project));
    out.push(mField('Site / Location', d.site));
    out.push(mField('GPS Coordinates', d.gps));

    if (rec.type === 'toolbox') {
      out.push(mField('Field Crew',         d.crew,    true));
      out.push(mField('Scope of Work',      d.scope,   true));
      out.push(mField('Weather Conditions', d.weather));
      out.push(mField('Communication Plan', d.comms,   true));
    }

    if (rec.type === 'jsha') {
      out.push(mField('Scope of Work', d.scope, true));

      if (d.emergencyContacts) {
        const ec = d.emergencyContacts;
        out.push(mSection('Emergency Contacts'));
        out.push(mField('Police / Fire / Ambulance', ec.policeFireAmbulance));
        out.push(mField('Poison Control',            ec.poisonControl));
        out.push(mField('Field Crew Contact',        joinContact(ec.crewContactName,    ec.crewContactPhone)));
        out.push(mField('Project Manager',           joinContact(ec.projectManagerName, ec.projectManagerPhone)));
        out.push(mField('H&S Representative',        ec.healthSafetyRep));
        out.push(mField('Nearest Hospital',          ec.nearestHospital));
      }
    }

    // Hazards
    if (d.hazards && d.hazards.length) {
      out.push(mSection('Hazard Identification'));
      d.hazards.forEach((h, i) => {
        const riskClass = h.risk ? 'risk-' + h.risk.toLowerCase() : '';
        out.push(
          '<div class="modal-hazard-row">' +
            '<span class="modal-hazard-num">' + (i + 1) + '</span>' +
            '<div class="modal-hazard-body">' +
              '<div class="modal-hazard-desc">' + esc(h.hazard || '—') + '</div>' +
              '<div class="modal-hazard-meta">' +
                '<span class="modal-risk-pill ' + riskClass + '">' + esc(h.risk || '—') + '</span>' +
                '<span class="modal-control">' + esc(h.control || '—') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      });
    }

    // PPE
    if (d.ppe && d.ppe.length) {
      out.push(mSection('PPE'));
      out.push(
        '<ul class="modal-ppe-list">' +
        d.ppe.map(item => '<li>' + esc(item) + '</li>').join('') +
        '</ul>'
      );
    }

    // Sign-offs (Toolbox only)
    if (rec.type === 'toolbox' && d.signoffs && d.signoffs.length) {
      out.push(mSection('Sign-Off'));
      out.push('<div class="modal-signoff-table">');
      d.signoffs.forEach(s => {
        out.push(
          '<div class="modal-signoff-row">' +
            '<span class="modal-sig-name">'     + esc(s.name     || '—') + '</span>' +
            '<span class="modal-sig-initials">' + esc(s.initials || '')  + '</span>' +
            '<span class="modal-sig-date">'     + esc(s.date     || '')  + '</span>' +
          '</div>'
        );
      });
      out.push('</div>');
    }

    // Comments (JSHA only)
    if (rec.type === 'jsha' && d.comments) {
      out.push(mSection('Additional Comments'));
      out.push('<p class="modal-comments">' + esc(d.comments) + '</p>');
    }

    return out.join('');
  }

  function mField(label, value, multiline) {
    const raw        = (value != null ? String(value) : '').trim();
    const html       = raw ? esc(raw) : '<span class="modal-empty">—</span>';
    const multiClass = multiline && raw ? ' modal-multiline' : '';
    return (
      '<div class="modal-field">' +
        '<span class="modal-label">' + label + '</span>' +
        '<span class="modal-value' + multiClass + '">' + html + '</span>' +
      '</div>'
    );
  }

  function mSection(title) {
    return '<h3 class="modal-section">' + esc(title) + '</h3>';
  }

  function joinContact(name, phone) {
    return [name, phone].filter(v => v && v.trim()).join(' — ');
  }

  // ── Download ─────────────────────────────────────────────────

  function downloadRecord(rec) {
    const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = (rec.data && rec.data.date) ? rec.data.date
               : new Date(rec.id).toISOString().slice(0, 10);
    a.href     = url;
    a.download = 'fraxinus_' + rec.type + '_' + date + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── Delete ────────────────────────────────────────────────────

  async function deleteRecord(rec, card) {
    if (!confirm('Delete this submission?\nThis cannot be undone.')) return;
    try {
      await FraxinusDB.deleteSubmission(rec.id);
      card.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(-6px)';
      setTimeout(loadSubmissions, 240);
    } catch (err) {
      alert('Delete failed: ' + err.message);
      console.error(err);
    }
  }

  // ── Reload when tab is activated ──────────────────────────────

  const navBtn = $('nav-submissions');
  if (navBtn) navBtn.addEventListener('click', loadSubmissions);

  loadSubmissions();

})();
