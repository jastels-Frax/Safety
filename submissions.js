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
    toolbox:  { label: 'Toolbox Talk',      badge: 'badge-toolbox'  },
    jsha:     { label: 'Hazard Assessment', badge: 'badge-jsha'     },
    nearmiss: { label: 'Near-Miss Report',  badge: 'badge-nearmiss' },
    incident: { label: 'Incident Report',   badge: 'badge-incident' },
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
    const d = rec.data || {};
    if (d.date)     return d.date;
    if (d.datetime) return d.datetime.slice(0, 10);
    return rec.date ? rec.date.slice(0, 10) : '—';
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

    const toolbox  = all.filter(r => r.type === 'toolbox').sort(byTimestampDesc);
    const jsha     = all.filter(r => r.type === 'jsha').sort(byTimestampDesc);
    const nearmiss = all.filter(r => r.type === 'nearmiss').sort(byTimestampDesc);
    const incident = all.filter(r => r.type === 'incident').sort(byTimestampDesc);

    content.innerHTML = '';

    if (!all.length) {
      renderEmpty();
      return;
    }

    if (toolbox.length)  renderGroup('Toolbox Talks', toolbox);
    if (jsha.length)     renderGroup('Hazard Assessments', jsha);
    if (nearmiss.length) renderGroup('Near-Miss Reports', nearmiss);
    if (incident.length) renderGroup('Incident Reports', incident);
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
    const editBtnHTML = (rec.type === 'toolbox' || rec.type === 'jsha' || rec.type === 'nearmiss' || rec.type === 'incident')
      ? '<button class="sub-btn sub-btn-edit" aria-label="Edit submission">Edit</button>'
      : '';

    card.innerHTML =
      '<div class="sub-card-info">' +
        '<div class="sub-card-top">' +
          '<span class="sub-type-badge ' + meta.badge + '">' + esc(meta.label) + '</span>' +
          '<span class="sub-date">' + esc(recordDate(rec)) + '</span>' +
        '</div>' +
        '<p class="sub-project">' + esc(project) + '</p>' +
      '</div>' +
      '<div class="sub-card-actions">' +
        editBtnHTML +
        '<button class="sub-btn sub-btn-view"   aria-label="View submission">View</button>' +
        '<button class="sub-btn sub-btn-pdf"    aria-label="Export PDF">Export PDF</button>' +
        '<button class="sub-btn sub-btn-delete" aria-label="Delete submission">Delete</button>' +
      '</div>';

    if (rec.type === 'toolbox') {
      card.querySelector('.sub-btn-edit').addEventListener('click', () => {
        window.openFormPanel('toolbox');
        if (window.ToolboxForm) window.ToolboxForm.loadForEdit(rec);
      });
    }
    if (rec.type === 'jsha') {
      card.querySelector('.sub-btn-edit').addEventListener('click', () => {
        window.openFormPanel('hazard');
        if (window.JSHAForm) window.JSHAForm.loadForEdit(rec);
      });
    }
    if (rec.type === 'nearmiss' || rec.type === 'incident') {
      card.querySelector('.sub-btn-edit').addEventListener('click', () => {
        window.openFormPanel('safety-report');
        if (window.SafetyReportForm) window.SafetyReportForm.loadForEdit(rec);
      });
    }
    card.querySelector('.sub-btn-view')  .addEventListener('click', () => openModal(rec));
    card.querySelector('.sub-btn-pdf')   .addEventListener('click', () => exportPDF(rec));
    card.querySelector('.sub-btn-delete').addEventListener('click', () => deleteRecord(rec, card));

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

    // Sign-offs
    const signoffsData = rec.type === 'jsha' ? d.jshaSignOffs : d.signoffs;
    if (signoffsData && signoffsData.length) {
      out.push(mSection('Sign-Off'));
      out.push('<div class="modal-signoff-table">');
      signoffsData.forEach(s => {
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

    // External sign-ons
    if (d.externalSignOns && d.externalSignOns.length) {
      out.push(mSection('External / Contractor Sign-On'));
      out.push('<div class="modal-signoff-table">');
      d.externalSignOns.forEach(s => {
        out.push(
          '<div class="modal-signoff-row">' +
            '<span class="modal-sig-name">'     + esc(s.name     || '—') + '</span>' +
            '<span class="modal-sig-initials">' + esc(s.company  || '')  + '</span>' +
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

    // Near-miss specific sections
    if (rec.type === 'nearmiss') {
      out.push(mField('Date & Time',       d.datetime ? d.datetime.replace('T', '  ') : ''));
      out.push(mField('Reported By',       d.reporter));
      out.push(mField('Supervisor / Lead', d.supervisor));

      out.push(mSection('Incident Description'));
      out.push(mField('Near-Miss Type',    d.type));
      out.push(mField('Activity at Time',  d.activity));
      out.push(mField('What Happened',     d.description,   true));
      out.push(mField('Conditions',        d.conditions,    true));

      out.push(mSection('Potential Consequences'));
      out.push(mField('Potential Severity', d.severity));
      out.push(mField('Potential Harm',     d.potentialHarm, true));

      const factors = d.factors || {};
      const allFactors = [
        ...(factors.env   || []),
        ...(factors.human || []),
        ...(factors.equip || []),
        ...(factors.org   || []),
      ];
      if (allFactors.length) {
        out.push(mSection('Contributing Factors'));
        out.push('<ul class="modal-ppe-list">' + allFactors.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>');
      }

      if (d.immediateActions) {
        out.push(mSection('Immediate Actions'));
        out.push('<p class="modal-comments">' + esc(d.immediateActions) + '</p>');
      }

      if (d.correctiveActions && d.correctiveActions.length) {
        out.push(mSection('Corrective / Preventive Actions'));
        out.push('<div class="modal-signoff-table">');
        d.correctiveActions.forEach(c => {
          out.push(
            '<div class="modal-signoff-row">' +
              '<span class="modal-sig-name">'     + esc(c.action      || '—') + '</span>' +
              '<span class="modal-sig-initials">' + esc(c.responsible || '')  + '</span>' +
              '<span class="modal-sig-date">'     + esc(c.targetDate  || '')  + '</span>' +
            '</div>'
          );
        });
        out.push('</div>');
      }

      if (d.additionalNotes) {
        out.push(mSection('Additional Notes'));
        out.push('<p class="modal-comments">' + esc(d.additionalNotes) + '</p>');
      }

      if (d.signOffs && d.signOffs.length) {
        out.push(mSection('Sign-Off'));
        out.push('<div class="modal-signoff-table">');
        d.signOffs.forEach(s => {
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
    }

    if (rec.type === 'incident') {
      out.push(
        '<div class="modal-meta-grid">' +
          '<span><b>Date/Time:</b> ' + esc(d.datetime || '—') + '</span>' +
          '<span><b>Project:</b> '   + esc(d.project  || '—') + '</span>' +
          '<span><b>Site:</b> '      + esc(d.site     || '—') + '</span>' +
          '<span><b>Type:</b> '      + esc(d.type     || '—') + '</span>' +
          '<span><b>Reporter:</b> '  + esc(d.reporter || '—') + '</span>' +
          '<span><b>Supervisor:</b> '+ esc(d.supervisor|| '—') + '</span>' +
        '</div>'
      );

      if (d.persons && d.persons.length) {
        out.push(mSection('Person(s) Involved'));
        out.push('<div class="modal-signoff-table">');
        d.persons.forEach(p => {
          out.push(
            '<div class="modal-signoff-row">' +
              '<span class="modal-sig-name">'     + esc(p.name     || '—') + '</span>' +
              '<span class="modal-sig-initials">' + esc(p.jobTitle || '') + '</span>' +
              '<span class="modal-sig-date">'     + esc(p.company  || '') + '</span>' +
            '</div>'
          );
        });
        out.push('</div>');
      }

      if (d.description) {
        out.push(mSection('What Happened'));
        out.push('<p class="modal-comments">' + esc(d.description) + '</p>');
      }

      const hasInjury = d.injuryNature || d.bodyPart || d.medicalTreatment || d.wcbReportable;
      if (hasInjury) {
        out.push(mSection('Injury / Illness'));
        if (d.injuryNature)     out.push('<p class="modal-comments"><b>Nature:</b> '   + esc(d.injuryNature)     + '</p>');
        if (d.bodyPart)         out.push('<p class="modal-comments"><b>Body Part:</b> '+ esc(d.bodyPart)         + '</p>');
        if (d.medicalTreatment) out.push('<p class="modal-comments"><b>Treatment:</b> '+ esc(d.medicalTreatment) + '</p>');
        if (d.wcbReportable)    out.push('<p class="modal-comments"><b>WorkSafe BC:</b> '+ esc(d.wcbReportable)  + '</p>');
      }

      if (d.damageDesc || d.damageCost) {
        out.push(mSection('Property / Equipment Damage'));
        if (d.damageDesc) out.push('<p class="modal-comments">' + esc(d.damageDesc) + '</p>');
        if (d.damageCost) out.push('<p class="modal-comments"><b>Est. cost:</b> ' + esc(d.damageCost) + '</p>');
      }

      const factors = d.factors || {};
      const allFactors = [...(factors.env||[]), ...(factors.human||[]), ...(factors.equip||[]), ...(factors.org||[])];
      if (allFactors.length) {
        out.push(mSection('Contributing Factors'));
        out.push('<ul class="modal-ppe-list">' + allFactors.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>');
      }

      if (d.witnesses && d.witnesses.length) {
        out.push(mSection('Witnesses'));
        out.push('<ul class="modal-ppe-list">' + d.witnesses.map(w => '<li>' + esc(w.name || '—') + (w.contact ? ' — ' + esc(w.contact) : '') + '</li>').join('') + '</ul>');
      }

      if (d.immediateActions) {
        out.push(mSection('Immediate Actions'));
        out.push('<p class="modal-comments">' + esc(d.immediateActions) + '</p>');
      }

      if (d.correctiveActions && d.correctiveActions.length) {
        out.push(mSection('Corrective / Preventive Actions'));
        out.push('<div class="modal-signoff-table">');
        d.correctiveActions.forEach(c => {
          out.push(
            '<div class="modal-signoff-row">' +
              '<span class="modal-sig-name">'     + esc(c.action      || '—') + '</span>' +
              '<span class="modal-sig-initials">' + esc(c.responsible || '')  + '</span>' +
              '<span class="modal-sig-date">'     + esc(c.targetDate  || '')  + '</span>' +
            '</div>'
          );
        });
        out.push('</div>');
      }

      if (d.additionalNotes) {
        out.push(mSection('Additional Notes'));
        out.push('<p class="modal-comments">' + esc(d.additionalNotes) + '</p>');
      }

      if (d.signOffs && d.signOffs.length) {
        out.push(mSection('Sign-Off'));
        out.push('<div class="modal-signoff-table">');
        d.signOffs.forEach(s => {
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

  // ── Export PDF ────────────────────────────────────────────────

  function pdfFilename(type, d) {
    const date = d.date || new Date().toISOString().slice(0, 10);
    const proj = (d.project || '').replace(/\b\d{4}(-\d{2}(-\d{2})?)?\b/g, '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const init = (d.initials || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
    const parts = ['Fraxinus', type, date];
    if (proj) parts.push(proj);
    if (init) parts.push(init);
    return parts.join('_') + '.pdf';
  }

  function exportPDF(rec) {
    const d = rec.data || {};
    if (rec.type === 'toolbox') {
      buildToolboxPDF(d).save(pdfFilename('ToolboxTalk', d));
    } else if (rec.type === 'jsha') {
      buildJSHAPDF(d).save(pdfFilename('HazardAssessment', d));
    } else if (rec.type === 'nearmiss') {
      buildNearMissPDF(d).save(nmPdfFilename(d));
    } else if (rec.type === 'incident') {
      buildIncidentPDF(d).save(incPdfFilename(d));
    }
  }

  function nmPdfFilename(d) {
    const dt   = (d.datetime || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const proj = (d.project || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const parts = ['Fraxinus', 'NearMiss', dt];
    if (proj) parts.push(proj);
    return parts.join('_') + '.pdf';
  }

  function incPdfFilename(d) {
    const dt   = (d.datetime || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const proj = (d.project || '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
    const parts = ['Fraxinus', 'Incident', dt];
    if (proj) parts.push(proj);
    return parts.join('_') + '.pdf';
  }

  function buildIncidentPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc, [123, 36, 28]);

    ctx.docHeader('Incident Report');

    ctx.section('Incident Details');
    ctx.field('Date & Time',         d.datetime ? d.datetime.replace('T', '  ') : '');
    ctx.field('Project Name / No.',  d.project);
    ctx.field('Site / Location',     d.site);
    ctx.field('GPS Coordinates',     d.gps);
    ctx.field('Incident Type',       d.type);
    ctx.field('Reported By',         d.reporter);
    ctx.field('Supervisor / Lead',   d.supervisor);

    if (d.persons && d.persons.length) {
      ctx.section('Person(s) Involved');
      ctx.personsTable(d.persons);
    }

    ctx.section('Incident Description');
    ctx.field('Activity at Time',    d.activity);
    ctx.field('What Happened',       d.description);
    ctx.field('Conditions at Time',  d.conditions);

    const hasInjury = d.injuryNature || d.bodyPart || d.medicalTreatment || d.wcbReportable;
    if (hasInjury) {
      ctx.section('Injury / Illness Details');
      ctx.field('Nature of Injury',  d.injuryNature);
      ctx.field('Body Part(s)',       d.bodyPart);
      ctx.field('Medical Treatment',  d.medicalTreatment);
      ctx.field('WorkSafe BC',        d.wcbReportable);
    }

    if (d.damageDesc || d.damageCost) {
      ctx.section('Property / Equipment Damage');
      ctx.field('Description',        d.damageDesc);
      ctx.field('Estimated Cost',     d.damageCost);
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

  function buildToolboxPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc);

    ctx.docHeader('Daily Toolbox Talk');

    ctx.section('Site Information');
    ctx.field('Date',             d.date);
    ctx.field('Project',          d.project);
    ctx.field('Site / Location',  d.site);
    ctx.field('GPS Coordinates',  d.gps);

    ctx.section('Crew & Operations');
    ctx.field('Field Crew',         d.crew);
    ctx.field('Scope of Work',      d.scope);
    ctx.field('Weather Conditions', d.weather);
    ctx.field('Communication Plan', d.comms);

    ctx.section('Hazard Identification');
    ctx.hazardTable(d.hazards);

    ctx.section('PPE Checklist');
    ctx.ppeGrid(d.ppe);

    if (d.signoffs && d.signoffs.length) {
      ctx.section('Sign-Off');
      ctx.signoffTable(d.signoffs);
    }

    if (d.externalSignOns && d.externalSignOns.length) {
      ctx.section('External / Contractor Sign-On');
      ctx.extSignonTable(d.externalSignOns);
    }

    ctx.pageFooters();
    return doc;
  }

  function buildJSHAPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc);
    const ec  = d.emergencyContacts || {};

    ctx.docHeader('Job Specific Hazard Assessment');

    ctx.section('Site Information');
    ctx.field('Date',                  d.date);
    ctx.field('Project Name / Number', d.project);
    ctx.field('Site / Location',       d.site);
    ctx.field('GPS Coordinates',       d.gps);
    ctx.field('Scope of Work',         d.scope);

    ctx.section('Emergency Contacts');
    ctx.field('Police / Fire / Ambulance', '911');
    ctx.field('Poison Control',            '1-800-565-8161');
    ctx.field('Field Crew Contact',        [ec.crewContactName,    ec.crewContactPhone].filter(Boolean).join(' — '));
    ctx.field('Project Manager',           [ec.projectManagerName, ec.projectManagerPhone].filter(Boolean).join(' — '));
    ctx.field('Health & Safety Rep',       ec.healthSafetyRep);
    ctx.field('Nearest Hospital',          ec.nearestHospital);

    ctx.section('Hazard Identification');
    ctx.hazardTable(d.hazards);

    ctx.section('PPE Checklist');
    ctx.ppeGrid(d.ppe);

    if (d.comments) {
      ctx.section('Additional Comments');
      ctx.field('', d.comments);
    }

    if (d.jshaSignOffs && d.jshaSignOffs.length) {
      ctx.section('Sign-Off');
      ctx.signoffTable(d.jshaSignOffs);
    }

    if (d.externalSignOns && d.externalSignOns.length) {
      ctx.section('External / Contractor Sign-On');
      ctx.extSignonTable(d.externalSignOns);
    }

    ctx.pageFooters();
    return doc;
  }

  function buildNearMissPDF(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const ctx = pdfCtx(doc);

    ctx.docHeader('Near-Miss Report');

    ctx.section('Incident Details');
    ctx.field('Date & Time',         d.datetime ? d.datetime.replace('T', '  ') : '');
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

    function simpleTable(hdrs, colWidths, rows, cellFn) {
      guard(10);
      doc.setFillColor(...BGRAY);
      doc.rect(ML, y - 4, CW, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      let x = ML;
      hdrs.forEach((h, i) => { doc.text(h, x + 2, y); x += colWidths[i]; });
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
        cellFn(r, colWidths, x);
        y += 6;
        doc.setDrawColor(...LGRAY);
        doc.setLineWidth(0.15);
        doc.line(ML, y, ML + CW, y);
        y += 1;
      });
      y += 2;
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
          if (col === 0) guard(6);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...DARK);
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
        simpleTable(
          ['Name', 'Job Title / Role', 'Company', 'Contact'], cols, rows,
          (r, c, x0) => {
            let x = x0;
            doc.text(r.name     || '—', x + 2, y); x += c[0];
            doc.text(r.jobTitle || '—', x + 2, y); x += c[1];
            doc.text(r.company  || '—', x + 2, y); x += c[2];
            doc.text(r.contact  || '—', x + 2, y);
          }
        );
      },

      witnessTable(rows) {
        const cols = [CW * 0.55, CW * 0.45];
        simpleTable(
          ['Name', 'Contact'], cols, rows,
          (r, c, x0) => {
            doc.text(r.name    || '—', x0 + 2,      y);
            doc.text(r.contact || '—', x0 + c[0] + 2, y);
          }
        );
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
          const actionLines = doc.splitTextToSize(r.action || '—', cols[0] - 4);
          const rowH = Math.max(actionLines.length * 5, 6);
          guard(rowH + 2);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
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
        if (!signoffs || !signoffs.length) return;

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

        rows.forEach(s => {
          guard(6);
          x = ML;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...DARK);
          doc.text(s.name     || '—', x + 2, y); x += cols[0];
          doc.text(s.company  || '—', x + 2, y); x += cols[1];
          doc.text(s.initials || '—', x + 2, y); x += cols[2];
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
