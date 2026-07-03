"""Agent prompt builders for the MediCast inference server.

Each function builds a system prompt for one of the 4 vision agents,
tailored to the specific surgical procedure being analyzed.

The prompts reference the procedure knowledge base structure defined in
src/data/types.ts and src/data/procedureKnowledgeBase.ts.
"""

from __future__ import annotations


# ─── Procedure Knowledge Lookup (embedded subset) ────────────────────────────

# This is a condensed version of the frontend knowledge base.
# In production, this could be loaded from a JSON file or database.
PROCEDURE_CONTEXT: dict[int, dict[str, object]] = {
    1: {
        "name": "Laparoscopic Cholecystectomy",
        "specialty": "General Surgery",
        "description": "Minimally invasive surgical removal of the gallbladder. Key anatomy: Calot's Triangle (critical), cystic duct, cystic artery, common bile duct (CBD), gallbladder, liver bed.",
        "steps": [
            "Port Placement & Pneumoperitoneum",
            "Diagnostic Laparoscopy",
            "Retraction of Gallbladder",
            "Dissection of Calot's Triangle",
            "Clipping and Division",
            "Gallbladder Dissection from Liver Bed",
            "Gallbladder Extraction",
            "Hemostasis Check & Closure",
        ],
        "criticalAnatomy": [
            "Cystic Duct — must be clipped and divided",
            "Cystic Artery — must be clipped and divided",
            "Common Bile Duct (CBD) — CRITICAL: must NOT be injured",
            "Calot's Triangle — critical view of safety",
            "Common Hepatic Duct — must be identified and preserved",
        ],
        "complications": [
            "Bile Duct Injury — CBD transection or partial injury",
            "Cystic Artery Hemorrhage",
            "Cystic Duct Stump Leak",
            "Gallbladder Perforation",
            "Liver Laceration",
            "Retained Stone",
        ],
    },
    2: {
        "name": "Laparoscopic Appendectomy",
        "specialty": "General Surgery",
        "description": "Minimally invasive removal of the appendix. Key anatomy: appendix, mesoappendix, appendicular artery, cecum, terminal ileum.",
        "steps": [
            "Port Placement & Pneumoperitoneum",
            "Diagnostic Laparoscopy",
            "Mobilization of Appendix",
            "Division of Mesoappendix",
            "Stapling and Division of Appendix Base",
            "Extraction and Closure",
        ],
        "criticalAnatomy": [
            "Appendix — target organ, must be identified at its base",
            "Mesoappendix — contains appendicular artery",
            "Appendicular Artery — must be controlled",
            "Cecum — appendiceal base junction",
            "Terminal Ileum — must be identified to avoid injury",
        ],
        "complications": [
            "Stump Leak — incomplete closure of appendiceal base",
            "Appendicular Artery Bleeding",
            "Cecal Injury",
            "Abscess Formation",
            "Perforation with Spillage",
        ],
    },
    3: {
        "name": "Total Knee Arthroplasty",
        "specialty": "Orthopedics",
        "description": "Total knee replacement. Key anatomy: distal femur, proximal tibia, patella, posterior cruciate ligament (PCL), medial/lateral collateral ligaments, popliteal artery (posterior).",
        "steps": [
            "Incision & Exposure",
            "Distal Femoral Resection",
            "Tibial Resection",
            "Flexion/Extension Gap Balancing",
            "Patellar Resurfacing",
            "Trial Reduction",
            "Component Cementing",
            "Closure",
        ],
        "criticalAnatomy": [
            "Distal Femur — resected for femoral component",
            "Proximal Tibia — resected for tibial component",
            "Patella — may be resurfaced",
            "Posterior Cruciate Ligament",
            "Popliteal Artery — CRITICAL: posterior to knee",
            "Common Peroneal Nerve — lateral to knee",
        ],
        "complications": [
            "Vascular Injury — popliteal artery laceration",
            "Nerve Injury — common peroneal",
            "Periprosthetic Fracture",
            "Malalignment",
            "Patellar Tendon Avulsion",
            "Bone Cement Implantation Syndrome",
        ],
    },
    4: {
        "name": "Total Hip Arthroplasty",
        "specialty": "Orthopedics",
        "description": "Total hip replacement. Key anatomy: femoral head, acetabulum, sciatic nerve (posterior), femoral nerve (anterior), gluteal muscles.",
        "steps": [
            "Incision & Exposure",
            "Femoral Neck Osteotomy",
            "Acetabular Reaming",
            "Acetabular Component Placement",
            "Femoral Broaching",
            "Femoral Stem Placement",
            "Head Impaction & Reduction",
            "Closure",
        ],
        "criticalAnatomy": [
            "Femoral Head & Neck — resected",
            "Acetabulum — reamed for cup placement",
            "Sciatic Nerve — CRITICAL: posterior to hip",
            "Femoral Nerve — anterior",
            "Femoral Artery — anterior",
            "Gluteal Muscles — abductor mechanism",
        ],
        "complications": [
            "Nerve Injury — sciatic nerve palsy",
            "Vascular Injury — femoral vessel laceration",
            "Periprosthetic Fracture",
            "Dislocation",
            "Leg Length Discrepancy",
            "Bone Cement Implantation Syndrome",
        ],
    },
    5: {
        "name": "Coronary Artery Bypass Grafting (CABG)",
        "specialty": "Cardiac Surgery",
        "description": "Open-heart bypass surgery. Key anatomy: left anterior descending (LAD), right coronary artery (RCA), circumflex artery, saphenous vein graft, internal mammary artery (IMA), aorta.",
        "steps": [
            "Median Sternotomy",
            "Conduit Harvesting (LIMA/Saphenous Vein)",
            "Pericardiotomy & Heparinization",
            "Cardiopulmonary Bypass Initiation",
            "Distal Anastomoses",
            "Proximal Anastomoses",
            "Weaning from CPB & Reversal of Heparinization",
            "Chest Closure",
        ],
        "criticalAnatomy": [
            "Left Anterior Descending (LAD) — most common bypass target",
            "Right Coronary Artery (RCA)",
            "Circumflex Artery",
            "Left Internal Mammary Artery (LIMA) — preferred graft to LAD",
            "Saphenous Vein Graft (SVG)",
            "Aorta — proximal anastomosis site",
        ],
        "complications": [
            "Graft Failure — acute graft thrombosis",
            "Myocardial Ischemia — inadequate revascularization",
            "Hemorrhage — anastomotic bleeding",
            "Stroke — embolic from aortic manipulation",
            "Arrhythmia — atrial fibrillation common",
            "Sternal Wound Infection",
        ],
    },
    6: {
        "name": "Mitral Valve Repair",
        "specialty": "Cardiac Surgery",
        "description": "Repair of the mitral valve. Key anatomy: mitral valve leaflets (anterior, posterior), chordae tendineae, papillary muscles, annulus, left atrium, left ventricle.",
        "steps": [
            "Median Sternotomy / Right Thoracotomy",
            "Cardiopulmonary Bypass Initiation",
            "Left Atriotomy",
            "Valve Analysis",
            "Leaflet Repair / Resection",
            "Annuloplasty Ring Placement",
            "Valve Testing",
            "Closure & Weaning from CPB",
        ],
        "criticalAnatomy": [
            "Mitral Valve Anterior Leaflet",
            "Mitral Valve Posterior Leaflet",
            "Chordae Tendineae — must be preserved",
            "Papillary Muscles",
            "Mitral Annulus",
            "Circumflex Artery — runs near annulus, CRITICAL",
            "Coronary Sinus — near annulus",
        ],
        "complications": [
            "Systolic Anterior Motion (SAM) — LVOT obstruction",
            "Residual Mitral Regurgitation",
            "Circumflex Artery Injury — annulus stitches",
            "Leaflet Tear",
            "Chordal Rupture",
            "Heart Block",
        ],
    },
    7: {
        "name": "Cesarean Section",
        "specialty": "OB/GYN",
        "description": "Surgical delivery of baby through abdominal and uterine incisions. Key anatomy: skin, subcutaneous tissue, rectus sheath, peritoneum, lower uterine segment, bladder (reflected).",
        "steps": [
            "Skin Incision & Entry",
            "Subcutaneous & Fascial Dissection",
            "Peritoneal Entry & Bladder Reflection",
            "Uterine Incision",
            "Delivery of Baby",
            "Delivery of Placenta",
            "Uterine Closure",
            "Abdominal Closure",
        ],
        "criticalAnatomy": [
            "Lower Uterine Segment — incision site",
            "Bladder — must be reflected inferiorly",
            "Uterine Arteries — lateral to uterus",
            "Rectus Sheath — fascial closure",
            "Bowel — must be identified",
            "Ovarian Vessels",
        ],
        "complications": [
            "Uterine Atony — postpartum hemorrhage",
            "Bladder Injury",
            "Bowel Injury",
            "Uterine Artery Laceration",
            "Placenta Accreta Spectrum",
            "Wound Infection / Dehiscence",
        ],
    },
    8: {
        "name": "Laparoscopic Hysterectomy",
        "specialty": "OB/GYN",
        "description": "Minimally invasive removal of the uterus. Key anatomy: uterus, uterine arteries, cervix, ureters (CRITICAL), bladder, ovaries, round ligaments, infundibulopelvic ligaments.",
        "steps": [
            "Port Placement & Pneumoperitoneum",
            "Uterine Manipulation",
            "Ligament Division (Round, IP, Utero-ovarian)",
            "Bladder Dissection",
            "Uterine Artery Ligation",
            "Colpotomy & Uterine Detachment",
            "Vaginal Cuff Closure",
            "Hemostasis Check & Closure",
        ],
        "criticalAnatomy": [
            "Uterus — target organ",
            "Uterine Arteries — must be ligated",
            "Ureters — CRITICAL: run near uterine arteries",
            "Bladder — must be dissected off cervix",
            "Round Ligaments",
            "Infundibulopelvic Ligaments — contain ovarian vessels",
            "Uterosacral Ligaments",
            "Vaginal Cuff — closure site",
        ],
        "complications": [
            "Ureteral Injury — most common major complication",
            "Bladder Injury",
            "Uterine Artery Hemorrhage",
            "Bowel Injury",
            "Vaginal Cuff Dehiscence",
            "Ureterovaginal Fistula",
        ],
    },
    9: {
        "name": "Transurethral Resection of the Prostate (TURP)",
        "specialty": "Urology",
        "description": "Endoscopic resection of prostate tissue. Key anatomy: prostate, urethra, bladder neck, verumontanum, external sphincter (CRITICAL), ureteral orifices.",
        "steps": [
            "Cystoscopy & Urethral Assessment",
            "Resection of Middle Lobe",
            "Resection of Lateral Lobes",
            "Resection of Anterior Tissue",
            "Hemostasis & Evacuation",
            "Catheter Placement",
        ],
        "criticalAnatomy": [
            "Prostate — target tissue for resection",
            "Prostatic Urethra — resection channel",
            "External Sphincter — CRITICAL: must be preserved",
            "Verumontanum — distal landmark",
            "Bladder Neck — proximal landmark",
            "Ureteral Orifices — must be identified",
            "Prostatic Capsule — perforation risk",
        ],
        "complications": [
            "TURP Syndrome — hyponatremia from irrigation absorption",
            "Capsular Perforation",
            "External Sphincter Injury — incontinence",
            "Hemorrhage",
            "Retrograde Ejaculation",
            "Ureteral Orifice Injury",
        ],
    },
    10: {
        "name": "Partial Nephrectomy",
        "specialty": "Urology",
        "description": "Removal of a renal tumor while preserving kidney parenchyma. Key anatomy: kidney, renal artery & vein, ureter, collecting system, renal capsule, Gerota's fascia.",
        "steps": [
            "Port Placement / Incision",
            "Mobilization of Colon & Kidney",
            "Tumor Identification & Margins",
            "Renal Artery Clamping",
            "Tumor Excision",
            "Collecting System Closure",
            "Parenchymal Repair",
            "Declamping & Hemostasis Check",
        ],
        "criticalAnatomy": [
            "Renal Artery — CRITICAL: must be clamped for warm ischemia",
            "Renal Vein — must be identified and preserved",
            "Kidney Parenchyma — preserved tissue",
            "Renal Tumor — target for excision",
            "Collecting System — must be closed after tumor excision",
            "Ureter — must be identified",
            "Renal Capsule — closure",
            "Adrenal Gland — superior to kidney",
        ],
        "complications": [
            "Hemorrhage — renal vessel injury",
            "Urine Leak — collecting system injury",
            "Renal Artery Pseudoaneurysm",
            "Positive Margins — incomplete tumor resection",
            "Acute Kidney Injury — prolonged warm ischemia",
            "AV Fistula",
        ],
    },
}


def get_procedure_context(procedure_id: int) -> dict[str, object]:
    """Get the knowledge base context for a given procedure ID.

    Falls back to a generic context if the procedure ID is unknown.
    """
    return PROCEDURE_CONTEXT.get(procedure_id, {
        "name": "Unknown Surgical Procedure",
        "specialty": "General Surgery",
        "description": "No specific knowledge base entry available.",
        "steps": [],
        "criticalAnatomy": [],
        "complications": [],
    })


# ─── Agent Prompt Builders ───────────────────────────────────────────────────

def build_anatomy_prompt(procedure_type: str, procedure_name: str, procedure_id: int = 1) -> str:
    """Build the system prompt for the Anatomy Recognition Agent.

    This agent identifies visible anatomical structures in the surgical frame,
    flags missing or obscured structures, and assesses dissection progress.
    """
    ctx = get_procedure_context(procedure_id)

    critical_anatomy_str = "\n".join(
        f"- {a}" for a in ctx["criticalAnatomy"]
    ) if ctx["criticalAnatomy"] else "- Refer to standard surgical anatomy for this procedure"

    return f"""You are the Anatomy Recognition Agent, part of the MediCast autonomous surgical video intelligence system.

You are analyzing frames from a **{procedure_name}** ({procedure_type}).

**Procedure Description:**
{ctx['description']}

**Critical Anatomical Structures to Identify & Monitor:**
{critical_anatomy_str}

**Your Task for Each Frame:**
1. Identify ALL visible anatomical structures in the frame
2. Note their condition (normal, inflamed, obscured, dissected, injured)
3. Flag any structures that should be visible but are NOT
4. Identify the dissection plane and tissue relationships
5. Note any anatomical variants or anomalies

**Output Format:**
Provide your analysis as a structured JSON object with fields:
- "visibleStructures": list of anatomical structures identified
- "confidence": float 0.0-1.0
- "findings": list of observation strings (2-4 items)
- "riskZones": list of areas requiring caution
- "safetyLevel": "GOOD" | "CAUTION" | "DANGER" | "CRITICAL"
- "alerts": list of any critical alerts (empty if none)

Be specific and clinically accurate. If anatomy is unclear, state that clearly and flag it as a concern."""


def build_safety_prompt(procedure_type: str, procedure_name: str, procedure_id: int = 1) -> str:
    """Build the system prompt for the Safety Monitor Agent.

    This agent detects safety-critical events, anomalous findings,
    and potential complications during the surgical procedure.
    """
    ctx = get_procedure_context(procedure_id)

    complications_str = "\n".join(
        f"- {c}" for c in ctx["complications"]
    ) if ctx["complications"] else "- Standard operative complications"

    return f"""You are the Safety Monitor Agent, part of the MediCast autonomous surgical video intelligence system.

You are analyzing frames from a **{procedure_name}** ({procedure_type}).

**Common Complications to Monitor:**
{complications_str}

**Your Task for Each Frame:**
1. Scan the frame for any safety-critical events or indicators of complications
2. Assess the proximity of instruments to critical structures
3. Evaluate hemostasis (bleeding, oozing, vessel injury)
4. Check for tissue trauma, thermal injury, or inappropriate dissection
5. Assess instrument trajectory and positioning relative to safe zones
6. Evaluate overall field visibility (blood, smoke, fog, obstruction)

**Safety Assessment Scale:**
- GOOD: No concerns, standard dissection, clear field
- CAUTION: Minor concerns (mild inflammation, slightly obscured view, approaching critical zone)
- DANGER: Significant concern (bleeding, poor visibility, structure proximity, difficult anatomy)
- CRITICAL: Imminent or present injury (active hemorrhage, structure injury, wrong plane)

**Output Format:**
Provide your analysis as a structured JSON object with fields:
- "safetyLevel": "GOOD" | "CAUTION" | "DANGER" | "CRITICAL"
- "confidence": float 0.0-1.0
- "findings": list of safety observations (2-4 items)
- "alerts": list of any safety alerts requiring attention (empty if none)
- "riskScore": integer 0-100 (0 = no risk, 100 = critical risk)

Be conservative — err on the side of caution. If you cannot assess the frame clearly, flag it as a visibility concern."""


def build_phase_prompt(procedure_type: str, procedure_name: str, procedure_id: int = 1) -> str:
    """Build the system prompt for the Phase Detection Agent.

    This agent identifies the current surgical phase based on visual cues
    and assesses whether the procedure is progressing as expected.
    """
    ctx = get_procedure_context(procedure_id)

    steps_str = "\n".join(
        f"- Step {i+1}: {s}" for i, s in enumerate(ctx["steps"])
    ) if ctx["steps"] else "- Standard surgical steps"

    return f"""You are the Phase Detection Agent, part of the MediCast autonomous surgical video intelligence system.

You are analyzing frames from a **{procedure_name}** ({procedure_type}).

**Expected Surgical Phases (in order):**
{steps_str}

**Your Task for Each Frame:**
1. Identify the CURRENT surgical phase based on visual cues
2. Note the specific instruments visible and their positioning
3. Assess the state of tissue dissection and exposure
4. Determine if the procedure is progressing appropriately
5. Flag any phase transitions or unexpected findings

**Visual Cues to Use:**
- Instruments visible (e.g., laparoscope, grasper, scissors, cautery, stapler, clip applier)
- State of anatomy (intact, dissected, divided, clamped, sutured)
- Presence of foreign materials (clips, staples, sutures, sponges)
- Level of exposure and retraction
- Presence of bleeding, fluid, irrigation

**Output Format:**
Provide your analysis as a structured JSON object with fields:
- "currentPhase": name of the identified phase or "UNCERTAIN"
- "phaseNumber": integer step number (1-based) or 0 if uncertain
- "confidence": float 0.0-1.0
- "findings": list of phase observations (2-4 items)
- "phaseProgress": "EARLY" | "MID" | "LATE" | "COMPLETE" | "UNCERTAIN"
- "safetyLevel": "GOOD" | "CAUTION" | "DANGER" | "CRITICAL"
- "alerts": list of any phase-related alerts (empty if none)

If you cannot determine the phase, respond with "UNCERTAIN" and describe what visual cues are present."""


def build_education_prompt(
    procedure_type: str,
    procedure_name: str,
    procedure_id: int = 1,
    current_phase: str = "",
) -> str:
    """Build the system prompt for the Education & Quality Assessment Agent.

    This agent provides educational commentary, technique assessment,
    and teaching pearls for surgical residents.
    """
    ctx = get_procedure_context(procedure_id)

    phase_context = f" Current detected phase: {current_phase}." if current_phase else ""

    return f"""You are the Quality Assessment & Education Agent, part of the MediCast autonomous surgical video intelligence system.

You are analyzing frames from a **{procedure_name}** ({procedure_type}).{phase_context}

**Your Task for Each Frame:**
1. Assess the technical quality of the surgery visible in the frame
2. Evaluate tissue handling, instrument usage, and dissection technique
3. Provide a teaching pearl relevant to what is visible
4. Rate the overall quality of the current step
5. Identify learning opportunities for surgical residents

**Quality Assessment Dimensions:**
- VISIBILITY: How clear is the surgical field? (blood, smoke, fog, camera cleanliness)
- TECHNIQUE: Appropriateness of instrument position, angle, and dissection plane
- SAFETY: Adherence to safe surgical principles
- PROGRESS: Appropriate advancement toward procedural goals
- TISSUE HANDLING: Gentle vs. traumatic tissue manipulation

**Output Format:**
Provide your analysis as a structured JSON object with fields:
- "feedback": detailed educational commentary (2-3 sentences)
- "qualityScore": integer 0-100
- "teachingPoints": list of 1-2 teaching pearls relevant to this frame
- "techniqueRating": "EXCELLENT" | "GOOD" | "FAIR" | "POOR"
- "confidence": float 0.0-1.0
- "findings": list of educational observations (2-3 items)
- "safetyLevel": "GOOD" | "CAUTION" | "DANGER" | "CRITICAL"
- "alerts": list of any educational alerts (empty if none)

Be constructive and educational. Frame feedback as learning opportunities."""


def build_arbiter_prompt(
    procedure_type: str,
    procedure_name: str,
    procedure_id: int = 1,
) -> str:
    """Build the system prompt for the Arbiter synthesis agent.

    The Arbiter receives outputs from all 4 specialist agents and
    produces a unified verdict with escalation decisions.
    """
    ctx = get_procedure_context(procedure_id)

    return f"""You are The Arbiter — the synthesis and decision agent for the MediCast autonomous surgical video intelligence system.

You are analyzing frames from a **{procedure_name}** ({procedure_type}).

You receive outputs from 4 specialist agents:
1. **Anatomy Agent** — identifies visible anatomical structures and risk zones
2. **Safety Agent** — detects safety-critical events and complications
3. **Phase Agent** — identifies the current surgical phase
4. **Education Agent** — assesses technique quality and provides teaching

**Your Task:**
Synthesize the 4 agent outputs into a unified verdict following these rules:

**Verdict Determination:**
- CRITICAL: Any agent reports a critical safety issue (active hemorrhage, structure injury, wrong plane, bile duct injury, vessel injury, organ perforation)
- WARNING: Any agent reports a significant concern (approaching critical structure, difficult anatomy, bleeding that is controlled, poor visibility, high inflammation)
- SAFE: All agents report standard dissection, clear view, appropriate technique, no concerns

**Escalation Rules:**
- CRITICAL: Immediate escalation — STOP procedure concern, potential injury detected
- WARNING: Heightened caution required — continue but monitor closely
- NONE: Standard progression — no escalation needed

**Quality Score Guidelines:**
- 85-100: Excellent visualization, technique, and safety
- 70-84: Good with minor areas for improvement
- 50-69: Fair — significant concerns or poor visibility
- 0-49: Poor — safety concerns, poor technique, or critical issues

**Output Format:**
Respond with a JSON object containing:
- "verdict": "SAFE" | "WARNING" | "CRITICAL"
- "summary": one-sentence summary
- "keyFindings": list of 2-4 key findings from cross-agent synthesis
- "anatomyConfirmed": string listing structures positively identified
- "currentPhase": phase name from phase agent
- "escalationLevel": "NONE" | "WARNING" | "CRITICAL"
- "escalationReason": reason string (empty if NONE)
- "teachingPoint": one relevant teaching pearl
- "qualityScore": integer 0-100

If ANY agent reports a critical safety issue, the verdict must reflect that."""