/* ============================================================
   documents.js — Document Library Data + Renderer
   Fraxinus Environmental & Geomatics
   Add new documents by appending entries to the DOCUMENTS array.
   highlight: true  → orange left border on that section.
   placeholder: true → ⚠ Needs Company Input badge on that section.
   ============================================================ */

const DOCUMENTS = [
  {
    category: "SOPs / Field Procedures",
    id: "swp-001",
    title: "Safe Work Practice #1 — General Environmental Fieldwork",
    description: "Minimum health and safety requirements for all environmental fieldwork. All task-specific SWPs must be read in conjunction with this document.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This Safe Work Practice (SWP) establishes the minimum health and safety requirements for conducting environmental fieldwork. It applies to all employees, contractors, and volunteers engaged in activities including, but not limited to: vegetation and botanical surveys, wetland and watercourse assessments, wildlife surveys and habitat assessments, electrofishing, and general field data collection.",
        subsections: [
          {
            heading: "Work Environments",
            content: "Forested terrain, wetlands and waterbodies, remote/backcountry locations, and roadside/right-of-way areas."
          }
        ],
        highlight: false
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "",
        subsections: [
          {
            heading: "2.1 Worker Rights",
            content: "All workers have the following rights under the Internal Responsibility System (IRS):\n• Right to Know — Be informed of known or reasonably foreseeable hazards.\n• Right to Participate — Contribute to decisions affecting health and safety.\n• Right to Refuse Unsafe Work — Refuse work that presents a reasonable danger. If refusing: immediately report to a supervisor and move to a safe location.",
            highlight: true
          },
          {
            heading: "2.2 Worker Responsibilities",
            content: "All workers are responsible for:\n• Hazard Reporting — Report hazards, near-misses, and injuries immediately.\n• Following Procedures — Adhere to all SWPs, site-specific safety plans, and supervisor direction.\n• Fitness for Duty — Report to work physically and mentally fit. Working under the influence of drugs, alcohol, or extreme fatigue is prohibited.\n• Use of PPE — Properly wear and maintain required PPE at all times.",
            highlight: true
          }
        ]
      },
      {
        heading: "3. Personal Protective Equipment (PPE)",
        content: "Minimum PPE requirements include:",
        subsections: [
          {
            heading: "Footwear",
            content: "Sturdy, closed-toe footwear with ankle support. Must be appropriate for terrain (e.g., hiking boots, rubber boots)."
          },
          {
            heading: "Clothing",
            content: "Weather-appropriate layers. Long pants and sleeves recommended to reduce exposure to cuts, insects, and vegetation."
          },
          {
            heading: "High-Visibility Apparel",
            content: "Required when working near roads, equipment, or during hunting seasons.",
            highlight: true
          },
          {
            heading: "Eye Protection",
            content: "Safety glasses or sunglasses where exposure risk exists."
          },
          {
            heading: "Task-Specific PPE",
            content: "Additional PPE may be required depending on the activity. Refer to task-specific SWPs."
          }
        ]
      },
      {
        heading: "4. General Field Hazards",
        content: "Fieldwork may involve exposure to: uneven terrain (slips, trips, falls), dense vegetation and limited visibility, weather extremes (heat, cold, precipitation), wildlife and insects (ticks, mosquitoes, large mammals), remote or isolated work locations, water hazards (drowning, cold exposure), and vehicle/traffic hazards."
      },
      {
        heading: "5. General Control Measures",
        content: "To reduce risk, all workers must:\n• Conduct a field-level hazard assessment prior to starting work.\n• Maintain situational awareness at all times.\n• Use the buddy system where appropriate.\n• Establish and follow a communication plan.\n• Carry required navigation tools (e.g., GPS, maps).\n• Follow safe movement practices (e.g., slow travel in rough terrain).",
        highlight: true
      },
      {
        heading: "6. Communication and Check-In Procedures",
        content: "A designated contact person must be identified before field deployment. Workers must follow a check-in/check-out schedule. Communication methods may include: mobile phone, satellite device (e.g., inReach), or radio. Failure to check in must trigger a predefined escalation procedure.",
        highlight: true
      },
      {
        heading: "7. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "7.1 Emergency Planning",
            content: "Prior to fieldwork: identify nearest emergency services and access routes, review evacuation procedures, and ensure all workers know emergency contacts.",
            highlight: true
          },
          {
            heading: "7.2 First Aid",
            content: "At least one worker per crew must have valid first aid certification. A fully stocked first aid kit must be readily available.",
            highlight: true
          },
          {
            heading: "7.3 Incident Response",
            content: "In the event of an incident: ensure scene safety, provide first aid as required, contact emergency services if necessary, notify supervisor as soon as possible, and document and report the incident."
          }
        ]
      },
      {
        heading: "8. Environmental and Weather Conditions",
        content: "Monitor weather forecasts prior to and during fieldwork. Stop work if conditions become unsafe (e.g., lightning, high winds, extreme temperatures). Adjust work practices based on environmental conditions.",
        highlight: true
      },
      {
        heading: "9. Vehicle and Travel Safety",
        content: "Conduct pre-trip vehicle inspections. Ensure vehicles are appropriate for terrain. Carry emergency supplies (spare tire, first aid kit, communication device). Park in safe, visible locations when working roadside."
      },
      {
        heading: "10. Documentation and Reporting",
        content: "Workers must: complete required field forms and safety documentation, report all incidents, hazards, and near-misses, and participate in safety meetings and debriefs as required."
      },
      {
        heading: "11. References and Related Documents",
        content: "• Applicable Occupational Health and Safety legislation\n• Company Health and Safety Program\n• Task-Specific SWPs (e.g., Wetlands, Electrofishing, Roadside Work)"
      },
      {
        heading: "Approval Sign-Off",
        content: "Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  }

  // -------------------------------------------------------
  // ADD ADDITIONAL DOCUMENTS BELOW IN THE SAME FORMAT
  // -------------------------------------------------------
  // {
  //   category: "Health & Safety",   // or "Workplace Policies" / "SOPs / Field Procedures"
  //   id: "hs-001",
  //   title: "...",
  //   description: "...",
  //   version: "REV00",
  //   lastUpdated: "...",
  //   author: "...",
  //   sections: [ ... ]
  // }
];

// ── Renderer ─────────────────────────────────────────────────

(function () {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Convert plain text with • bullets into paragraphs / lists
  function renderText(text) {
    if (!text || !text.trim()) return '';
    const lines   = text.split('\n');
    const out     = [];
    let   bullets = [];

    lines.forEach(line => {
      const t = line.trim();
      if (t.startsWith('•')) {
        bullets.push(t.slice(1).trim());
      } else {
        if (bullets.length) {
          out.push('<ul>' + bullets.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul>');
          bullets = [];
        }
        if (t) out.push('<p>' + esc(t) + '</p>');
      }
    });
    if (bullets.length) {
      out.push('<ul>' + bullets.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul>');
    }
    return out.join('');
  }

  function renderSection(section, depth) {
    const cls = ['doc-section'];
    if (section.highlight)   cls.push('doc-section--highlight');
    if (section.placeholder) cls.push('doc-section--placeholder');

    let html = '<div class="' + cls.join(' ') + '">';

    if (section.heading) {
      const tag = depth ? 'h5' : 'h4';
      html += '<' + tag + ' class="doc-section-heading">' + esc(section.heading) + '</' + tag + '>';
    }

    if (section.placeholder) {
      html += '<span class="doc-placeholder-badge">⚠ Needs Company Input</span>';
    }

    if (section.content && section.content.trim()) {
      html += renderText(section.content);
    }

    if (section.subsections && section.subsections.length) {
      html += '<div class="doc-subsections">';
      section.subsections.forEach(sub => { html += renderSection(sub, depth + 1); });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function collectText(sections, parts) {
    if (!sections) return;
    sections.forEach(s => {
      if (s.heading) parts.push(s.heading);
      if (s.content) parts.push(s.content);
      collectText(s.subsections, parts);
    });
  }

  function hasPlaceholder(sections) {
    if (!sections) return false;
    return sections.some(s => s.placeholder || hasPlaceholder(s.subsections));
  }

  function buildDocCard(doc) {
    const textParts = [doc.title, doc.description];
    collectText(doc.sections, textParts);

    const card        = document.createElement('article');
    card.className    = 'doc-card';
    card.dataset.text = textParts.join(' ').toLowerCase();

    const needsInput = hasPlaceholder(doc.sections);
    const metaLine   = [doc.version, doc.lastUpdated, doc.author].filter(Boolean).join(' · ');
    const bodyHtml   = (doc.sections || []).map(s => renderSection(s, 0)).join('');

    card.innerHTML =
      '<div class="doc-card-head">' +
        (needsInput ? '<span class="doc-badge">⚠ Needs Company Input</span>' : '') +
        (metaLine   ? '<p class="doc-meta">' + esc(metaLine) + '</p>' : '') +
        '<h3 class="doc-title">' + esc(doc.title) + '</h3>' +
        '<p class="doc-desc">'   + esc(doc.description) + '</p>' +
        '<button class="doc-expand-btn" aria-expanded="false">' +
          '<span class="doc-expand-label">View document</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<polyline points="6 9 12 15 18 9"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="doc-body" hidden>' + bodyHtml + '</div>';

    const btn  = card.querySelector('.doc-expand-btn');
    const body = card.querySelector('.doc-body');
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.querySelector('.doc-expand-label').textContent = expanded ? 'View document' : 'Close';
      body.hidden = expanded;
    });

    return card;
  }

  const CAT_SLUG = {
    'SOPs / Field Procedures': 'sops',
    'Health & Safety':          'health-safety',
    'Workplace Policies':       'workplace-policies',
  };

  function renderDocuments() {
    DOCUMENTS.forEach(doc => {
      const slug = CAT_SLUG[doc.category];
      if (!slug) return;

      const catEl = document.querySelector('[data-category="' + slug + '"]');
      if (!catEl) return;

      const catBody = catEl.querySelector('.doc-cat-body');
      catBody.appendChild(buildDocCard(doc));

      const countEl = catEl.querySelector('.doc-cat-count');
      if (countEl) countEl.textContent = catBody.querySelectorAll('.doc-card').length;
    });
  }

  renderDocuments();
})();
