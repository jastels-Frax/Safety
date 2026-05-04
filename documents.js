/* ============================================================
   documents.js — Document Library Data + Renderer
   Fraxinus Environmental & Geomatics
   Add new documents by appending entries to the DOCUMENTS array.
   highlight: true flags a section for visual emphasis in the app.
   placeholder: true shows a ⚠ Needs Company Input badge.
   ============================================================ */

const DOCUMENTS = [
  {
    category: "SWPs / Field Procedures",
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
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  // -------------------------------------------------------

  {
    category: "SWPs / Field Procedures",
    id: "swp-002",
    title: "Safe Work Practice #2 — Vegetation & Botanical Surveys",
    description: "Minimum safety requirements for vegetation and botanical fieldwork including flora surveys, rare plant surveys, vegetation plot sampling, and habitat description. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Scope",
        content: "This SWP defines the minimum safety requirements for vegetation and botanical fieldwork, including: plant identification (flora surveys), rare plant and species-at-risk surveys, vegetation plot sampling, transect-based ecological surveys, and habitat description and community classification.\n\nThis SWP must be used in conjunction with the Core Environmental Fieldwork SWP (#1) and all applicable task-specific SWPs (Wetland & Watercourse Assessment, Remote Fieldwork, etc.)."
      },
      {
        heading: "2. Additional Hazards",
        content: "In addition to core field hazards, vegetation surveys may involve:\n• Tick exposure (including Lyme disease risk)\n• Dense vegetation limiting visibility and increasing trip hazards\n• Poisonous or irritant plants (e.g., giant hogweed, poison ivy, stinging nettle)\n• Sharp vegetation (thorns, woody stems, slash)\n• Reduced situational awareness due to focus on sampling\n• Overexertion from repetitive plot sampling or transect work",
        highlight: true
      },
      {
        heading: "3. Control Measures",
        content: "",
        subsections: [
          {
            heading: "3.1 Tick & Insect Exposure Prevention",
            content: "• Conduct daily full-body tick checks (end of day minimum).\n• Perform interim checks during breaks in high-risk habitat.\n• Treat clothing with repellents where appropriate (e.g., permethrin-treated gear where permitted).\n• Tuck pants into socks/gaiters in high-risk areas.\n• Immediately report and follow safe removal procedures for attached ticks.",
            highlight: true
          },
          {
            heading: "3.2 Vegetation Navigation & Awareness",
            content: "• Maintain slow, deliberate movement in dense cover.\n• Use caution when stepping into obscured ground (roots, holes, blowdown).\n• Maintain visual spacing between crew members where possible.\n• Communicate hazards clearly (e.g., deadfall, steep drop-offs, dense patches)."
          },
          {
            heading: "3.3 Poisonous Plant Avoidance",
            content: "• All workers must be able to identify key hazardous species in the region.\n• Avoid contact with unknown plants where possible.\n• Wash exposed skin after suspected contact.\n• Report significant exposures or rashes immediately.",
            highlight: true
          },
          {
            heading: "3.4 Plotting, Flagging, and Navigation",
            content: "• Use minimal and consistent flagging to reduce environmental disturbance.\n• Avoid over-marking sensitive habitats.\n• GPS-enabled devices must be used as the primary navigation tool, with backup maps/compass.\n• Double-check plot coordinates before entry."
          }
        ]
      },
      {
        heading: "4. PPE Additions",
        content: "In addition to Core SWP PPE requirements, vegetation surveys require:\n• Gaiters — recommended or required in dense vegetation or tick habitat.\n• Insect-protective clothing or bug jackets — seasonal requirement.\n• Gloves — when handling unknown vegetation or thorny species."
      },
      {
        heading: "5. Field Tools and Equipment Safety",
        content: "Common tools include: clinometers, DBH tapes, measuring tapes, quadrats, flagging tape, and GPS units/tablets.",
        subsections: [
          {
            heading: "Safe Handling Requirements",
            content: "• Carry tools in a controlled manner to avoid snagging or injury.\n• Secure sharp or rigid tools during movement.\n• Avoid leaving tools hidden in vegetation or high-risk trip areas.\n• Ensure quadrats and stakes are clearly visible when deployed."
          }
        ]
      },
      {
        heading: "6. Additional Operational Controls",
        content: "• Maintain awareness of fatigue during repetitive sampling.\n• Rotate roles where possible to reduce repetitive strain.\n• Take scheduled breaks in safe, open areas.\n• Ensure communication remains active during dispersed sampling (where applicable)."
      },
      {
        heading: "7. Documentation and Reporting",
        content: "Workers must ensure all vegetation and botanical survey activities are accurately documented. At minimum:\n• Complete all required field data sheets in real time or at point of collection.\n• Record GPS coordinates accurately for all plots, transects, and rare species observations.\n• Document site conditions relevant to ecological interpretation (e.g., disturbance, canopy cover).\n• Report all hazards, near-misses, and safety concerns encountered in the field.\n• Note any deviations from planned sampling methodology.\n\nAll records must be legible, complete, and attributable to the field crew, submitted or backed up according to project data management procedures, and stored to ensure traceability and long-term accessibility."
      },
      {
        heading: "8. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Company Health and Safety Program & Applicable OHS Legislation\n• Regional botanical survey standards or protocols (where applicable)\n• Species-at-risk identification guides and conservation databases (e.g., ACCDC where relevant)\n• Task-specific SWPs (Wetlands, Electrofishing, Roadside Work, Remote Fieldwork)"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  // -------------------------------------------------------
  // SWP #3 — Wetland & Watercourse Assessment
  // -------------------------------------------------------
  {
    category: "SWPs / Field Procedures",
    id: "swp-003",
    title: "SWP #3 — Wetland & Watercourse Assessment",
    description: "Minimum safety requirements for fieldwork in wetland and aquatic environments including boundary delineation, hydrological assessments, and stream classification. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Scope",
        content: "This SWP defines minimum safety requirements for fieldwork in wetland and aquatic environments, including: wetland boundary delineation, hydrological feature identification, stream and watercourse classification, aquatic habitat assessments, and fish habitat observations (visual/passive).\n\nMust be used in conjunction with the Core Environmental Fieldwork SWP (#1)."
      },
      {
        heading: "2. Additional Hazards",
        content: "Wetland and watercourse environments introduce elevated hazards, including:\n• Soft or unstable substrates\n• Entrapment or submersion risk\n• Cold water exposure and hypothermia\n• Reduced visibility under water or vegetation\n• Sudden depth changes or hidden channels\n• Slippery substrates (algae, clay, etc.)\n• Remote access and delayed response\n• Waterborne pathogens or contaminants",
        highlight: true
      },
      {
        heading: "3. Control Measures",
        content: "",
        subsections: [
          {
            heading: "3.1 Movement & Substrate Safety",
            content: "• Probe the substrate ahead of each step before weight transfer.\n• Avoid stepping into unknown depths or unconsolidated organic mats.\n• Maintain slow, deliberate movement in all wetland zones.\n• Identify and use stable travel corridors where possible.\n• Establish and communicate 'no-go' zones in deep or unstable areas.",
            highlight: true
          },
          {
            heading: "3.2 Working in Pairs",
            content: "A two-person minimum is strongly recommended. Maintain visual or verbal contact at all times where possible. Do not enter deep or unstable substrates alone under any circumstances.",
            highlight: true
          },
          {
            heading: "3.3 Water Hazard Awareness",
            content: "• Assess flow velocity, depth, and temperature before entry.\n• Avoid crossing watercourses where depth or velocity is unknown.\n• Treat all flowing water as a potential drowning hazard.\n• Identify safe entry and exit points prior to fieldwork."
          },
          {
            heading: "3.4 Cold Water Protection",
            content: "• Limit exposure time in cold water environments.\n• Rotate personnel where prolonged exposure is required.\n• Exit water immediately if signs of cold stress appear.\n• Carry dry clothing and thermal layers for post-exposure warming.",
            highlight: true
          }
        ]
      },
      {
        heading: "4. PPE Additions",
        content: "In addition to Core SWP PPE:\n• Chest or hip waders with integrated belt — mandatory when entering water.\n• Personal Flotation Device (PFD) — required when water depth exceeds knee height, flow velocity presents an instability risk, or the supervisor determines an elevated hazard condition.\n• Insulated base layers (cold conditions).\n• Wading staff or pole — recommended for substrate probing.",
        highlight: true
      },
      {
        heading: "5. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "5.1 Entry and Exit Planning",
            content: "Identify safe entry and exit points before entering the wetland or watercourse. Avoid repeated entry/exit through unstable margins. Minimize disturbance to sensitive wetland edges where possible."
          },
          {
            heading: "5.2 Delineation and Assessment Practices",
            content: "Conduct boundary identification using conservative interpretation principles. Document vegetation, hydrology, and soil indicators systematically. Avoid excessive disturbance of wetland substrate during sampling. Use established protocols for hydrological classification where applicable."
          },
          {
            heading: "5.3 Decontamination (Invasive Species Control)",
            content: "• Clean boots, waders, and equipment before moving between waterbodies.\n• Remove visible organic material and sediment.\n• Follow site-specific invasive species prevention protocols.\n• Do not transport material between watersheds.",
            highlight: true
          }
        ]
      },
      {
        heading: "6. Communication and Supervision",
        content: "Maintain check-in procedures as per Core SWP. Ensure all crew members are aware of terrain hazards before entry. Establish clear verbal signals when working in low-visibility conditions. The supervisor must confirm risk conditions prior to wetland entry in complex terrain."
      },
      {
        heading: "7. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "7.1 Key Emergency Risks",
            content: "Submersion or entrapment, hypothermia from prolonged exposure, and slips leading to water entry or injury.",
            highlight: true
          },
          {
            heading: "7.2 Response Procedures",
            content: "In the event of an incident: prioritize worker retrieval from water or unstable substrate, move the individual to a stable dry location immediately, initiate first aid and warming procedures, contact emergency services if required, notify supervisor, and document the incident."
          }
        ]
      },
      {
        heading: "8. Environmental and Weather Conditions",
        content: "Do not enter wetland systems during heavy precipitation or flooding conditions. Suspend work during lightning or severe weather events. Reassess substrate stability following weather changes. Adjust work methods in response to seasonal water level fluctuations.",
        highlight: true
      },
      {
        heading: "9. Vehicle and Access Safety",
        content: "Park in stable, non-flood-prone access locations. Avoid driving on saturated soils or wetland margins. Carry recovery equipment where vehicle access is marginal. Plan access routes to minimize environmental disturbance."
      },
      {
        heading: "10. Documentation and Reporting",
        content: "Workers must: record wetland boundaries and observations accurately, document any unsafe conditions encountered, report near-misses or substrate failures immediately, and complete required field data sheets and safety logs."
      },
      {
        heading: "11. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Applicable wetland classification manuals or provincial standards\n• Invasive species prevention protocols\n• Occupational Health and Safety legislation\n• Task-Specific SWPs (Electrofishing, Remote Fieldwork, etc.)"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  // -------------------------------------------------------
  // ADD ADDITIONAL DOCUMENTS BELOW IN THE SAME FORMAT
  // -------------------------------------------------------

  {
    category: "SWPs / Field Procedures",
    id: "swp-004",
    title: "SWP #4 — Electrofishing",
    description: "Minimum safety requirements for electrofishing operations in freshwater environments. Inherent risk: HIGH. Only certified personnel may participate. Must be used with SWP #1 and SWP #3.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety requirements for electrofishing operations in freshwater environments. It applies to backpack electrofishing, boat electrofishing (if applicable), fish capture for scientific sampling, and any habitat or fish community assessments using electrical capture methods.\n\nMust be used in conjunction with SWP #1 (Core) and SWP #3 (Wetland & Watercourse)."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Workers involved in electrofishing have an elevated responsibility to:\n• Confirm understanding of electrical hazards prior to deployment.\n• Immediately report unsafe equipment conditions.\n• Stop work if any uncertainty exists regarding electrical integrity or safety.\n\nOnly certified personnel may participate in electrofishing activities.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Electrofishing introduces high-risk hazards, including:\n• Electrical shock (potentially fatal)\n• Loss of muscle control in water\n• Drowning risk following incapacitation\n• Slips, trips, and falls\n• Equipment malfunction\n• Fatigue-related errors\n• Poor communication in noisy conditions",
        highlight: true
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: HIGH. Electrical exposure combined with an aquatic environment creates high consequence potential. No electrofishing activity shall proceed without full control implementation and qualified supervision.\n\nRisk increases with: high-conductivity water, deep or fast-moving water, poor visibility or complex substrate, and fatigue or environmental stress.",
        highlight: true
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Personnel Requirements",
            content: "Only trained and authorized personnel may operate electrofishing equipment. A designated team leader must be assigned for each operation. Minimum crew must be maintained as per equipment specifications.",
            highlight: true
          },
          {
            heading: "5.2 Equipment Safety Controls",
            content: "• Pre-use inspection of all electrofishing equipment is mandatory.\n• All safety interlocks and deadman switches must be tested before entry into water.\n• Equipment must be grounded and operated according to manufacturer specifications.\n• No modifications to electrical systems are permitted in the field.",
            highlight: true
          },
          {
            heading: "5.3 Operational Controls",
            content: "• Maintain clear communication signals at all times (hand/verbal).\n• Establish and maintain exclusion zones around active electrodes.\n• Do not activate current until all personnel are confirmed in safe positions.\n• Maintain controlled sweep patterns to avoid unintended exposure."
          },
          {
            heading: "5.4 Shutdown Protocol (Critical Control)",
            content: "Immediate shutdown required if: any crew member enters unsafe proximity to energized equipment, loss of communication occurs, equipment malfunction is suspected, or uncontrolled movement or instability in water occurs.",
            highlight: true
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "In addition to Core SWP PPE:\n• Non-conductive chest waders (mandatory).\n• Insulated rubber gloves rated for electrical work.\n• Personal flotation device (PFD) where water depth or flow requires.\n• Whistle or emergency signalling device.\n\nAll PPE must be inspected before use.",
        highlight: true
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 Pre-Deployment",
            content: "Conduct full safety briefing (hazards, roles, signals). Inspect all electrical equipment and connections. Confirm communication devices are functional. Establish exclusion zones and crew positioning."
          },
          {
            heading: "7.2 Operational Deployment",
            content: "Only operate equipment when all personnel are confirmed clear. Maintain controlled movement and consistent sweep patterns. Continuously monitor crew positioning and water conditions. Pause operations if conditions change or uncertainty arises."
          },
          {
            heading: "7.3 Post-Operation",
            content: "Ensure equipment is fully powered down. Conduct decontamination procedures. Inspect equipment for damage or wear. Debrief crew on safety or procedural issues."
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "Continuous communication required between all crew members. Clear verbal or visual signals must be established before activation. A designated safety lead must maintain operational oversight at all times. Immediate stop-work authority applies to all crew members.",
        highlight: true
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Electrical shock incident, loss of consciousness in water, drowning or near-drowning, and equipment malfunction during operation.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "In the event of an incident: immediately cease all electrical output, remove affected personnel from the water, initiate CPR or first aid as required, activate emergency services immediately, notify supervisor, and secure and document equipment conditions."
          }
        ]
      },
      {
        heading: "10. Environmental and Weather Conditions",
        content: "Do not operate in lightning or electrical storm conditions. Suspend operations in high-flow or flood conditions. Avoid deployment in extreme cold where hypothermia risk is elevated. Reassess water conditions continuously during operation.",
        highlight: true
      },
      {
        heading: "11. Documentation and Reporting",
        content: "Workers must: record all sampling data accurately and in real time, document equipment settings and operational conditions, report any incidents, near misses, or equipment faults immediately, and maintain chain-of-custody or project documentation requirements where applicable."
      },
      {
        heading: "12. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Wetland & Watercourse SWP (#3)\n• Manufacturer's electrofishing equipment manuals\n• Applicable Occupational Health and Safety legislation\n• Internal company safety and training protocols"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  {
    category: "SWPs / Field Procedures",
    id: "swp-005",
    title: "SWP #5 — Roadside & Right-of-Way Work",
    description: "Minimum safety requirements for environmental fieldwork in roadside and right-of-way environments. Inherent risk: HIGH. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety requirements for conducting environmental fieldwork in roadside and right-of-way (ROW) environments. It applies to: roadside vegetation surveys, culvert and watercourse inspections, wildlife observations adjacent to roads, and general data collection within transportation corridors.\n\nMust be used in conjunction with the Core Environmental Fieldwork SWP (#1)."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Workers must remain continuously aware of traffic conditions. Workers have full authority to stop work if traffic conditions become unsafe.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Primary hazards include:\n• Moving vehicles (high-speed traffic)\n• Distracted or impaired drivers\n• Limited sightlines (curves, hills, vegetation)\n• Narrow shoulders or unstable ground\n• Noise limiting communication\n• Weather-related visibility reduction (fog, rain, snow)\n• Entering/exiting vehicles near active traffic",
        highlight: true
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: HIGH. Traffic exposure is a leading cause of serious injury and fatality in fieldwork.\n\nRisk increases with: higher traffic speed and volume, reduced visibility conditions, urban or congested roadways, and night or low-light operations.",
        highlight: true
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Traffic Control Planning",
            content: "A traffic control plan must be developed for all roadside work. Work must comply with applicable provincial traffic control standards. Determine if additional controls (signage, cones, spotters) are required.",
            highlight: true
          },
          {
            heading: "5.2 Worker Positioning",
            content: "• Always face oncoming traffic when possible.\n• Maintain a safe distance from active travel lanes.\n• Avoid turning back to traffic unless protected by barriers or spotters.\n• Establish clear safe zones for standing and equipment staging.",
            highlight: true
          },
          {
            heading: "5.3 Spotter Requirements",
            content: "A dedicated spotter must be assigned where visibility is limited, traffic speed is high, or workers are near active lanes. The spotter must maintain continuous observation of traffic and warn the crew of hazards."
          },
          {
            heading: "5.4 Vehicle Controls",
            content: "• Use hazard lights at all times when parked roadside.\n• Position vehicles to maximize visibility to oncoming traffic.\n• Use vehicles as physical barriers where safe and appropriate.\n• Do not park on blind corners, hills, or narrow shoulders."
          },
          {
            heading: "5.5 Work Duration and Exposure",
            content: "Minimize time spent within roadside hazard zones. Plan work to reduce repeated entry/exit from the roadway. Consolidate tasks where possible."
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "In addition to Core SWP PPE:\n• High-visibility apparel (CSA-compliant) — mandatory at all times.\n• Hard hat (where required by site or client).\n• Safety footwear suitable for uneven roadside terrain.\n\nHigh-visibility apparel must be clean and visible, worn as the outermost layer, and appropriate for lighting conditions (day/night).",
        highlight: true
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 Arrival and Setup",
            content: "Assess the site for traffic hazards before exiting the vehicle. Identify a safe parking location. Deploy cones or warning devices if required. Conduct a tailgate safety briefing."
          },
          {
            heading: "7.2 Active Work",
            content: "Maintain continuous awareness of traffic. Keep tools and equipment clear of the road. Avoid sudden movements toward traffic. Maintain communication between the crew."
          },
          {
            heading: "7.3 Demobilization",
            content: "Remove all equipment and signage safely. Re-enter vehicles only when safe to do so. Perform final visual sweep of the site before departure."
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "Maintain clear communication between crew members at all times. Use radios where noise levels limit verbal communication. The supervisor must assess and approve traffic control measures prior to work. All workers retain stop-work authority."
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Worker struck by a vehicle, near-miss traffic incidents, and vehicle collision at the work site.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "Move to a safe location immediately. Provide first aid as required. Secure the scene to prevent further incidents. Notify supervisor as soon as possible. Contact emergency services immediately. Document the incident and conditions."
          }
        ]
      },
      {
        heading: "10. Environmental and Weather Conditions",
        content: "Suspend work during low visibility conditions (fog, heavy rain, snow). Avoid roadside work during extreme weather where driver control may be impaired. Adjust traffic control measures based on lighting and weather.",
        highlight: true
      },
      {
        heading: "11. Documentation and Reporting",
        content: "Workers must: document site conditions and traffic hazards, record any traffic control measures implemented, report all near-misses involving vehicles immediately, and complete required field and safety documentation."
      },
      {
        heading: "12. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Provincial traffic control standards\n• Occupational Health and Safety legislation\n• Company Health and Safety Program\n• Applicable task-specific SWPs"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  {
    category: "SWPs / Field Procedures",
    id: "swp-006",
    title: "SWP #6 — Remote / Backcountry Fieldwork",
    description: "Minimum safety requirements for fieldwork outside reliable cellular coverage, including long-distance access, helicopter-supported work, and multi-day deployments. Inherent risk: HIGH. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety requirements for fieldwork in remote or backcountry environments. It applies to: fieldwork outside reliable cellular coverage, long-distance hiking or difficult terrain access, helicopter-supported access (where applicable), multi-hour or multi-day field deployments, and work in areas with delayed emergency response capability.\n\nMust be used with the Core Environmental Fieldwork SWP (#1) and relevant task-specific SWPs."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Additional responsibilities:\n• Workers must understand and follow trip plans and communication schedules.\n• Workers must not deviate from planned routes without notifying designated contacts.\n• All workers have the authority to turn back if conditions become unsafe.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Remote fieldwork introduces hazards including:\n• Isolation and delayed emergency response\n• Lack of reliable communication (no service)\n• Navigation errors or becoming lost\n• Injury without immediate assistance\n• Rapid weather changes and exposure\n• Fatigue from travel or difficult terrain\n• Wildlife encounters\n• Limited access to shelter, food, or water",
        highlight: true
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: HIGH. Risk is driven primarily by response time, not just hazard exposure.\n\nRisk increases with: distance from access points or roads, lack of communication capability, severe or rapidly changing weather, solo or widely dispersed work, and complex terrain or navigation difficulty.",
        highlight: true
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Trip Planning (Critical Control)",
            content: "Prior to deployment, prepare a trip plan including: work location(s) and access routes, planned travel routes, expected timeline, crew members and roles, and emergency contact information.",
            highlight: true
          },
          {
            heading: "5.2 Communication Systems",
            content: "Carry reliable communication devices such as: satellite messenger (e.g., InReach) and radio (where applicable). Establish a check-in/check-out schedule prior to departure. Failure to check in must trigger a predefined escalation procedure.",
            highlight: true
          },
          {
            heading: "5.3 Navigation Controls",
            content: "• Carry a GPS-enabled device and backup navigation tools (map and compass).\n• Ensure at least one crew member is proficient in navigation.\n• Track movement relative to the planned route.\n• Avoid unnecessary deviation from planned travel corridors."
          },
          {
            heading: "5.4 Crew Structure",
            content: "Solo work in remote environments is not recommended and must be approved by a supervisor. Maintain visual or communication contact between crew members. Establish regroup points and timelines if working in dispersed areas.",
            highlight: true
          },
          {
            heading: "5.5 Time and Fatigue Management",
            content: "Establish turnaround time and adhere to it. Plan sufficient time for safe return travel. Take regular breaks to reduce fatigue-related risk. Do not continue work if fatigue compromises safety."
          },
          {
            heading: "5.6 Emergency Supplies",
            content: "All crews must carry: first aid kit, emergency shelter (e.g., bivy, tarp), extra food and water, fire-starting materials (where appropriate), and weather-appropriate spare clothing.",
            highlight: true
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "In addition to Core SWP PPE:\n• Weather-appropriate outerwear.\n• Sturdy footwear suitable for extended travel.\n• High-visibility clothing.\n• Personal emergency kit."
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 Pre-Deployment",
            content: "Complete trip plan. Check weather forecast. Confirm communication devices are working. Conduct safety briefing with full crew."
          },
          {
            heading: "7.2 Active Fieldwork",
            content: "Follow the planned route and schedule. Maintain awareness of time, weather, and conditions. Conduct periodic check-ins as scheduled. Adjust plans as needed while maintaining safety margins."
          },
          {
            heading: "7.3 Return and Check-Out",
            content: "Confirm safe return with designated contact. Report any deviations from the plan. Report hazards or near-misses encountered."
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "A designated contact person must monitor the field crew status. The communication schedule must be clearly defined before departure. Escalation procedure must be in place for missed check-ins. Supervisor approval required for high-risk remote deployments.",
        highlight: true
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Lost or disoriented personnel, injury in a remote location, severe weather exposure, communication failure, ATV accident, and equipment failure.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "Stop work and assess situation. Provide first aid as required. Establish communication using available devices. Activate emergency response. Shelter in place if evacuation is not feasible. Follow escalation protocol if contact is lost."
          }
        ]
      },
      {
        heading: "10. Environmental and Weather Conditions",
        content: "Monitor weather before and during fieldwork. Do not proceed into remote areas under severe weather warnings. Adjust plans based on real-time conditions. Be prepared for rapid environmental changes.",
        highlight: true
      },
      {
        heading: "11. Documentation and Reporting",
        content: "Workers must: complete and file trip plans prior to deployment, document routes, conditions, and deviations, report all incidents, near-misses, and communication failures, and maintain records of check-in/check-out communications."
      },
      {
        heading: "12. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• All task-specific SWPs\n• Company Health and Safety Program\n• Occupational Health and Safety legislation\n• Emergency response procedures"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  {
    category: "SWPs / Field Procedures",
    id: "swp-007",
    title: "SWP #7 — Wildlife Surveys & Tracking",
    description: "Minimum safety requirements for wildlife surveys and tracking activities including camera traps, moose surveys, acoustic monitoring, and incidental wildlife observations. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety requirements for conducting wildlife surveys and tracking activities. It applies to: camera trap installation and monitoring, moose surveys (PGIs, winter tracking), acoustic monitoring (e.g., birds, bats), incidental wildlife observations, and wildlife habitat assessments.\n\nMust be used in conjunction with the Core Environmental Fieldwork SWP (#1) and applicable task-specific SWPs."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Additional responsibilities:\n• Workers must maintain safe and respectful distances from all wildlife.\n• Workers must not intentionally approach, feed, or interact with wildlife.\n• Workers must immediately report aggressive or unusual wildlife behaviour.\n• Workers retain the right to stop work if wildlife conditions present a safety risk.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Wildlife-related hazards may include:\n• Encounters with large mammals (e.g., bears, moose)\n• Aggressive or defensive animal behavior\n• Nesting or territorial birds\n• Bites, scratches, or trampling injuries\n• Zoonotic disease exposure (e.g., ticks)\n• Distraction leading to reduced awareness",
        highlight: true
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: MODERATE (can escalate to HIGH depending on species and context).\n\nRisk increases with: presence of large mammals or predators, breeding/nesting seasons, food attractants (intentional or unintentional), limited visibility environments (dense vegetation, dusk/dawn), and remote locations with delayed emergency response."
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Wildlife Awareness and Avoidance",
            content: "• Maintain continuous situational awareness for signs of wildlife.\n• Make noise when moving through dense vegetation to avoid surprise encounters.\n• Avoid areas with fresh signs of large or potentially dangerous wildlife (tracks, scat, carcasses).\n• Do not approach wildlife under any circumstances.",
            highlight: true
          },
          {
            heading: "5.2 Safe Distance Protocol",
            content: "Maintain an appropriate distance from all wildlife. Increase distance for large mammals or animals exhibiting alert or defensive behaviour. Use binoculars or remote tools instead of approaching animals."
          },
          {
            heading: "5.3 Attractant Management",
            content: "Do not leave food or waste accessible in the field. Store food securely and away from work areas. Avoid carrying strong attractants.",
            highlight: true
          },
          {
            heading: "5.4 Species-Specific Awareness",
            content: "Workers must be familiar with common regional wildlife and associated risks. Adjust behaviour based on species encountered. Follow established encounter protocols (see Section 7)."
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "In addition to Core SWP PPE:\n• Bear spray or wildlife deterrent (where applicable and permitted) — must be readily accessible, not stored in packs, and used only by trained personnel.\n• Gloves (for handling equipment or indirect contact with wildlife materials).\n• Tick protection measures (as per SWP #2 and SWP #11).",
        highlight: true
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 General Wildlife Encounter Protocol",
            content: "If wildlife is encountered: stop and assess the situation, do not approach or provoke the animal, slowly increase distance while maintaining awareness, maintain visual contact without direct confrontation, and leave the area if the animal does not vacate.",
            highlight: true
          },
          {
            heading: "7.2 Large Mammal Encounter (e.g., Bear, Moose)",
            content: "• Do not run.\n• Avoid sudden movements.\n• Speak calmly and back away slowly.\n• Use a deterrent (e.g., bear spray) only if the animal approaches aggressively.\n• Disengage and leave the area immediately.",
            highlight: true
          },
          {
            heading: "7.3 Aggressive or Escalating Behaviour",
            content: "Stop all work. Create distance immediately. Group together if in a crew. Prepare deterrent if necessary. Exit the area and reassess the work plan."
          },
          {
            heading: "7.4 Camera Trap and Equipment Handling",
            content: "Approach cameras cautiously, scanning for nearby wildlife. Avoid placing equipment in areas of high wildlife traffic when possible. Minimize scent and disturbance at monitoring sites."
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "Inform crew members of wildlife presence. Report high-risk wildlife encounters to the supervisor. Adjust work plans based on wildlife activity. Maintain communication in areas of reduced visibility."
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Animal attack or injury, bite or scratch with infection risk, and exposure to zoonotic disease.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "Move to a safe location immediately. Provide first aid as required. Seek medical attention as necessary. Report incident to supervisor as soon as possible. Document circumstances and species involved."
          }
        ]
      },
      {
        heading: "10. Environmental and Weather Conditions",
        content: "Increased wildlife activity may occur during dawn, dusk, and seasonal transitions. Adjust fieldwork timing and approach accordingly. Exercise increased caution in low visibility conditions."
      },
      {
        heading: "11. Documentation and Reporting",
        content: "Workers must: document wildlife observations relevant to the project scope, report all significant wildlife encounters, report aggressive or unusual behaviour, and record any incidents, near-misses, or deterrent use."
      },
      {
        heading: "12. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Vegetation & Botanical Surveys SWP (#2)\n• Remote / Backcountry Fieldwork SWP (#6)\n• Tick Safety & Lyme Disease Prevention SWP (#11)\n• Company Health and Safety Program\n• Occupational Health and Safety legislation"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  {
    category: "SWPs / Field Procedures",
    id: "swp-008",
    title: "SWP #8 — Construction Monitoring & Active Worksites",
    description: "Minimum safety requirements for environmental monitoring and inspection at active construction sites. Inherent risk: HIGH. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety requirements for environmental monitoring and inspection activities at active construction sites. It applies to: environmental inspection and compliance monitoring, erosion and sediment control (ESC) inspections, watercourse and wetland monitoring during construction, site visits to active infrastructure or development projects, and coordination with contractors and site supervisors.\n\nMust be used in conjunction with the Core Environmental Fieldwork SWP (#1) and applicable task-specific SWPs."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Additional responsibilities:\n• Workers must comply with all site-specific safety rules and orientations.\n• Workers must follow direction from the site supervisor or prime contractor regarding site safety.\n• Workers must not enter restricted or controlled areas without authorization.\n• Workers retain the right to stop their work if unsafe conditions are observed.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Construction sites present elevated and dynamic hazards, including:\n• Heavy equipment (excavators, trucks)\n• Moving vehicles and reversing equipment\n• Blind spots and limited operator visibility\n• Excavations, trenches, and unstable ground\n• Falling objects or overhead work\n• Noise limiting communication\n• Dust, debris, and airborne particulates\n• Slips, trips, and uneven terrain\n• Interaction with multiple contractors\n• Changing site conditions",
        highlight: true
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: HIGH. Risk is driven by dynamic conditions and heavy equipment interaction.\n\nRisk increases with: active excavation or earthworks, high equipment density, poor visibility (weather, dust, lighting), lack of site orientation or supervision, and working near operating machinery.",
        highlight: true
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Site Orientation and Authorization",
            content: "Workers must complete all required site safety orientations prior to entering the worksite. Sign-in/out procedures must be followed where required. Obtain approval from the site supervisor before accessing work areas.",
            highlight: true
          },
          {
            heading: "5.2 Communication and Coordination",
            content: "Establish communication with the site supervisor upon arrival. Confirm active work zones and restricted areas. Maintain communication with equipment operators when working nearby. Use radios or agreed signals where required."
          },
          {
            heading: "5.3 Equipment Interaction Controls",
            content: "• Maintain a safe distance from all operating equipment.\n• Never enter equipment blind spots.\n• Make eye contact with operators before approaching.\n• Do not assume operators can see you.\n• Stay clear of swing radius and travel paths.",
            highlight: true
          },
          {
            heading: "5.4 Work Zone Awareness",
            content: "Identify hazards before entering work area. Avoid walking under suspended loads. Stay clear of active excavation edges. Follow designated walkways where provided.",
            highlight: true
          },
          {
            heading: "5.5 Stop-Work Authority",
            content: "Work must be stopped if: unsafe equipment operation is observed, communication with operators is impossible, site conditions change unexpectedly, or required controls are not in place.",
            highlight: true
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "In addition to Core SWP PPE:\n• CSA-approved high-visibility apparel — mandatory.\n• Hard hat — mandatory on active sites.\n• Steel-toe safety boots — mandatory.\n• Safety glasses (where required).\n• Hearing protection (where required).\n\nAll PPE must meet site-specific requirements.",
        highlight: true
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 Site Arrival",
            content: "Report to the site supervisor. Complete sign-in and orientation. Review site hazards and current activities. Confirm safe access routes."
          },
          {
            heading: "7.2 Active Monitoring",
            content: "Maintain continuous awareness of equipment and site activity. Position yourself in safe, visible locations. Conduct inspections without interfering with construction activities. Communicate with operators before entering active work zones."
          },
          {
            heading: "7.3 Demobilization",
            content: "Exit site using designated safe routes. Sign out as required. Report any hazards or incidents observed. Debrief with supervisor if necessary."
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "Maintain communication with the site supervisor at all times. Follow all site-specific communication protocols. Ensure at least one point of contact is identified on-site. All workers retain stop-work authority."
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Worker struck by equipment, trench collapse or ground failure, falling object injury, and vehicle collision on site.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "Move to a safe location if possible. Alert site personnel immediately. Follow the site's emergency procedures. Provide first aid as required. Contact emergency services if necessary. Notify supervisor. Document the incident and site conditions."
          }
        ]
      },
      {
        heading: "10. Environmental and Weather Conditions",
        content: "Monitor weather impacts on site safety (rain, wind, freezing conditions). Be aware of increased hazards due to mud, ice, or reduced visibility. Adjust positioning and movement accordingly."
      },
      {
        heading: "11. Documentation and Reporting",
        content: "Workers must: complete all monitoring and inspection records, document environmental conditions and compliance observations, report safety hazards and near-misses observed on site, and record any interactions affecting safety or compliance."
      },
      {
        heading: "12. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Roadside & Right-of-Way SWP (#5)\n• Wetland & Watercourse SWP (#3) (if applicable)\n• Company Health and Safety Program\n• Occupational Health and Safety legislation\n• Site-specific safety plans\n• All relevant contractor documentation"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  {
    category: "SWPs / Field Procedures",
    id: "swp-009",
    title: "SWP #9 — Vehicle Use & Travel",
    description: "Minimum safety requirements for operating vehicles during fieldwork and travel between sites, including highway, rural, and off-road conditions. Inherent risk: HIGH. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety requirements for operating vehicles during fieldwork and travel between sites. It applies to: company and personal vehicles used for work purposes, travel to and from field sites, driving on highways, rural roads, and off-road conditions, and transport of personnel and equipment.\n\nMust be used in conjunction with the Core Environmental Fieldwork SWP (#1)."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Additional responsibilities:\n• Drivers must hold a valid license appropriate for the vehicle class.\n• Drivers must be fit for duty and free from impairment or fatigue.\n• Workers have the right to refuse travel in unsafe conditions.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Vehicle operation hazards include:\n• Motor vehicle collisions\n• Fatigue and long-distance driving\n• Poor weather conditions (snow, ice, fog)\n• Wildlife collisions\n• Poor road conditions (gravel, logging roads)\n• Mechanical failure\n• Distraction while driving",
        highlight: true
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: HIGH. Driving is one of the leading causes of workplace incidents.\n\nRisk increases with: winter driving conditions, long travel durations, remote or poorly maintained roads, and night driving.",
        highlight: true
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Driver Requirements",
            content: "Drivers must be authorized and competent. No use of mobile devices while driving. Follow all traffic laws and regulations.",
            highlight: true
          },
          {
            heading: "5.2 Pre-Trip Inspection",
            content: "Before departure: check tires, lights, brakes, and fluid levels, ensure sufficient fuel for the trip, and confirm emergency equipment is present."
          },
          {
            heading: "5.3 Safe Driving Practices",
            content: "Adjust speed to road and weather conditions. Maintain safe following distances. Avoid aggressive or distracted driving. Use headlights appropriately."
          },
          {
            heading: "5.4 Fatigue Management",
            content: "Take breaks at regular intervals. Avoid excessive driving hours in a single day. Rotate drivers where possible. Do not drive if fatigued.",
            highlight: true
          },
          {
            heading: "5.5 Off-Road and Rural Driving",
            content: "Use appropriate vehicles for terrain. Drive cautiously on gravel or dirt roads. Watch for wildlife and other road users. Avoid driving in unsafe conditions."
          },
          {
            heading: "5.6 Emergency Preparedness",
            content: "Vehicles must carry: first aid kit, spare tire and tools, emergency supplies (seasonal), and communication device.",
            highlight: true
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "• Seatbelts must be worn at all times.\n• High-visibility apparel when exiting the vehicle roadside.\n• Weather-appropriate clothing for emergency situations.",
        highlight: true
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 Pre-Travel",
            content: "Plan the route and travel time. Check the weather and road conditions. Inform others of travel plans where required."
          },
          {
            heading: "7.2 During Travel",
            content: "Drive defensively and remain alert. Avoid unnecessary stops in unsafe locations. Monitor vehicle performance."
          },
          {
            heading: "7.3 Post-Travel",
            content: "Report any vehicle issues or hazards. Refuel and prepare vehicle for next use. Document incidents or near-misses."
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "Maintain communication when traveling to remote sites. Follow check-in procedures where required. Notify supervisor of delays or issues."
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Motor vehicle collision, vehicle breakdown in a remote area, and becoming stranded due to weather.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "Move to a safe location if possible. Activate hazard lights. Contact emergency services if required. Notify supervisor. Remain with the vehicle unless it is unsafe."
          }
        ]
      },
      {
        heading: "10. Environmental and Weather Conditions",
        content: "Avoid travel during severe weather conditions. Adjust driving practices for seasonal hazards. Be prepared for rapidly changing conditions.",
        highlight: true
      },
      {
        heading: "11. Documentation and Reporting",
        content: "Workers must: complete vehicle inspection records where required, report all incidents, near-misses, and mechanical issues, and document travel plans where applicable."
      },
      {
        heading: "12. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Roadside & Right-of-Way SWP (#5)\n• Company Vehicle Policy\n• Occupational Health and Safety legislation"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  },

  {
    category: "SWPs / Field Procedures",
    id: "swp-010",
    title: "SWP #10 — Public Interaction & Landowner Engagement",
    description: "Minimum safety and conduct requirements for interacting with members of the public, landowners, and stakeholders during fieldwork. Must be used with SWP #1.",
    version: "REV00",
    lastUpdated: "April 23, 2026",
    author: "Jason Astels",
    sections: [
      {
        heading: "1. Purpose and Scope",
        content: "This SWP defines minimum safety and conduct requirements for interacting with members of the public, landowners, and stakeholders during fieldwork. It applies to: work conducted on or near private property, interactions with landowners or residents, encounters with the general public, and situations involving questions, concerns, or conflict.\n\nMust be used in conjunction with the Core Environmental Fieldwork SWP (#1)."
      },
      {
        heading: "2. Worker Rights and Responsibilities",
        content: "Additional responsibilities:\n• Workers must act professionally and respectfully at all times.\n• Workers must not engage in confrontation or escalation.\n• Workers have the right to disengage from unsafe interactions.",
        highlight: true
      },
      {
        heading: "3. Hazards",
        content: "Public interaction hazards include:\n• Verbal confrontation or conflict\n• Aggressive or threatening individuals\n• Misunderstanding of the project purpose\n• Unauthorized access to private property\n• Reputational risk to the company\n• Distraction from field hazards"
      },
      {
        heading: "4. Risk Assessment",
        content: "Inherent Risk Level: MODERATE.\n\nRisk increases with: work on private or contested land, rural or isolated locations, lack of prior landowner communication, and working alone."
      },
      {
        heading: "5. Control Measures",
        content: "",
        subsections: [
          {
            heading: "5.1 Pre-Field Preparation",
            content: "Confirm land access permissions before site entry. Carry identification and project information. Understand project scope and purpose.",
            highlight: true
          },
          {
            heading: "5.2 Professional Conduct",
            content: "Be courteous, calm, and respectful. Clearly identify yourself and your purpose if approached. Do not argue or engage in disputes."
          },
          {
            heading: "5.3 Conflict Avoidance",
            content: "Avoid escalating situations. Do not respond to aggression with confrontation. Remove yourself from situations that feel unsafe.",
            highlight: true
          },
          {
            heading: "5.4 Property Respect",
            content: "Do not enter private property without permission. Respect gates, signage, and boundaries. Leave sites as found."
          }
        ]
      },
      {
        heading: "6. PPE",
        content: "• High-visibility apparel (where appropriate).\n• Company identification (recommended)."
      },
      {
        heading: "7. Field Procedures",
        content: "",
        subsections: [
          {
            heading: "7.1 Initial Interaction",
            content: "Greet individuals calmly. Identify yourself and your organization. Provide a brief explanation of the work."
          },
          {
            heading: "7.2 If Concerns Are Raised",
            content: "Listen respectfully. Provide general information only. Refer detailed concerns to the supervisor or project lead."
          },
          {
            heading: "7.3 If Conflict Escalates",
            content: "Disengage immediately. Leave the area if necessary. Do not continue work in unsafe conditions. Report the incident to the supervisor.",
            highlight: true
          }
        ]
      },
      {
        heading: "8. Communication and Supervision",
        content: "Notify supervisor of any significant interactions. Report access issues or denied entry. Seek guidance for ongoing concerns."
      },
      {
        heading: "9. Emergency Preparedness and Response",
        content: "",
        subsections: [
          {
            heading: "9.1 Key Emergency Scenarios",
            content: "Threatening or aggressive individual, physical confrontation, and harassment or intimidation.",
            highlight: true
          },
          {
            heading: "9.2 Response Procedures",
            content: "Remove yourself from the situation immediately. Move to a safe location. Contact emergency services if required. Notify supervisor. Document the incident."
          }
        ]
      },
      {
        heading: "10. Documentation and Reporting",
        content: "Workers must: document significant public interactions, report conflicts, complaints, or denied access, and record any incidents or near-misses."
      },
      {
        heading: "11. References and Related Documents",
        content: "• Core Environmental Fieldwork SWP (#1)\n• Remote / Backcountry SWP (#6)\n• Company Code of Conduct\n• Occupational Health and Safety legislation"
      },
      {
        heading: "Approval Sign-Off",
        content: "⚠ Needs Company Input — Supervisor, Safety Lead, and Program Manager signatures required.",
        placeholder: true
      }
    ]
  }

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
      html += '<span class="doc-placeholder-badge">⚠ Needs Company Input</span>';
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
    'SWPs / Field Procedures': 'sops',
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
