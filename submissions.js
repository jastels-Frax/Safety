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
        '<button class="sub-btn sub-btn-view"   aria-label="View submission">View</button>' +
        '<button class="sub-btn sub-btn-pdf"    aria-label="Export PDF">Export PDF</button>' +
        '<button class="sub-btn sub-btn-delete" aria-label="Delete submission">Delete</button>' +
      '</div>';

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

  // ── Export PDF ────────────────────────────────────────────────

  function exportPDF(rec) {
    const d    = rec.data || {};
    const date = d.date || new Date(rec.id).toISOString().slice(0, 10);
    let doc;
    if (rec.type === 'toolbox') {
      doc = buildToolboxPDF(d);
      doc.save('Fraxinus_ToolboxTalk_' + date + '.pdf');
    } else if (rec.type === 'jsha') {
      doc = buildJSHAPDF(d);
      doc.save('Fraxinus_HazardAssessment_' + date + '.pdf');
    }
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

    ctx.pageFooters();
    return doc;
  }

  function pdfCtx(doc) {
    const W  = doc.internal.pageSize.getWidth();
    const H  = doc.internal.pageSize.getHeight();
    const ML = 15, MR = 15, MB = 20;
    const CW = W - ML - MR;

    const ORANGE = [232, 115,  26];
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
