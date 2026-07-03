import type { ProcedureKnowledge } from './types';

/**
 * Procedure 9: Transurethral Resection of Prostate (TURP)
 * Urology — Resection of prostatic tissue via urethra
 */
export const turp: ProcedureKnowledge = {
  procedureId: 9,
  name: 'Transurethral Resection of Prostate (TURP)',
  specialty: 'Urology',
  description:
    'Endoscopic surgical procedure to remove obstructive prostatic tissue from within the urethra using a resectoscope passed through the penis. Gold standard for surgical management of benign prostatic hyperplasia (BPH). Uses monopolar or bipolar loop electrocautery with glycine/saline irrigation.',
  estimatedDurationMin: 60,
  keyAnatomy: [
    { name: 'Prostate (Lobes: Median, Lateral, Anterior)', riskLevel: 'high', description: 'Target organ. Three lobes. Median lobe obstructs bladder outlet. Lateral lobes compress urethra.' },
    { name: 'Prostatic Urethra', riskLevel: 'high', description: 'Passes through center of prostate. Verumontanum (sperm colliculus) is key landmark for distal resection limit.' },
    { name: 'Verumontanum', riskLevel: 'critical', description: 'Critical landmark on floor of prostatic urethra. Ejaculatory ducts open here. DISTAL LIMIT of resection — do not resect beyond this point.' },
    { name: 'External Urethral Sphincter', riskLevel: 'critical', description: 'Just distal to verumontanum. Injury causes permanent urinary incontinence.' },
    { name: 'Bladder Neck', riskLevel: 'moderate', description: 'Internal urethral orifice. Junction between prostate and bladder. PROXIMAL LIMIT of resection.' },
    { name: 'Bladder (Trigone)', riskLevel: 'moderate', description: 'Triangular area between ureteric orifices and bladder neck. Ureteric orifices are landmarks.' },
    { name: 'Ureteric Orifices', riskLevel: 'critical', description: 'Open at trigone ends. Can be injured if resection extends into trigone.' },
    { name: 'Ejaculatory Ducts', riskLevel: 'high', description: 'Open at verumontanum. Resection causes retrograde ejaculation (almost universal).' },
    { name: 'Capsule (Prostatic)', riskLevel: 'critical', description: 'Surgical capsule — the boundary between adenoma and peripheral zone. Capsular perforation causes fluid extravasation.' },
    { name: 'Venous Sinuses (Prostatic)', riskLevel: 'critical', description: 'Large veins within prostatic capsule. Opening causes TUR syndrome from irrigation fluid absorption.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Cystourethroscopy & Landmark Identification', description: 'Pass resectoscope through urethra into bladder. Identify bladder neck, ureteric orifices, interureteric ridge, prostate lobes, and verumontanum.', watchPoints: ['Urethral stricture preventing passage', 'Landmark identification', 'Prostate size estimation'] },
    { order: 2, name: 'Bladder Neck Incisions', description: 'Make incisions at 5 and 7 o\'clock positions through bladder neck. These are starting points for resection.', watchPoints: ['Too deep — capsular perforation', 'Ureteric orifice proximity at 5 o\'clock', 'Bleeding from bladder neck'] },
    { order: 3, name: 'Resection of Median Lobe', description: 'Resect median lobe from bladder neck toward verumontanum using cutting loop. Maintain depth to capsule but do not perforate.', watchPoints: ['Capsular perforation', 'Trigone injury', 'TUR syndrome from venous sinus opening'] },
    { order: 4, name: 'Resection of Lateral Lobes', description: 'Resect lateral lobes systematically from 12 o\'clock clockwise. Maintain orientation. Resect from proximal to distal.', watchPoints: ['Loss of orientation', 'Capsular perforation laterally', 'Venous sinus bleeding'] },
    { order: 5, name: 'Resection of Anterior/Funnel Tissue', description: 'Resect remaining anterior and apical tissue. Carefully approach verumontanum — do not resect distal to it.', watchPoints: ['Verumontanum as distal limit', 'External sphincter injury', 'Inadequate apical resection'] },
    { order: 6, name: 'Hemostasis & Clot Evacuation', description: 'Thoroughly coagulate all bleeding points using roller/ball electrode. Evacuate resected chips and clots from bladder.', watchPoints: ['Missing bleeding points at low irrigation pressure', 'Chip retention', 'Capsule perforation from over-coagulation'] },
    { order: 7, name: 'Final Inspection & Catheter Placement', description: 'Inspect bladder and prostatic fossa. Confirm clear landmarks (verumontanum intact, bladder neck open, ureteric orifices visible). Place 3-way Foley catheter for irrigation.', watchPoints: ['Incomplete resection at apex', 'Catheter balloon inflated in prostatic fossa', 'Inadequate irrigation settings'] },
  ],
  commonComplications: [
    { name: 'TUR Syndrome', phase: 'Resection of Lateral Lobes', description: 'Hyponatremia and fluid overload from absorption of hypotonic irrigating fluid through opened venous sinuses. Rare with bipolar TURP (saline).', indicators: ['Venous sinus opening visualized', 'Capsular perforation', 'Prolonged resection time >60min'] },
    { name: 'Capsular Perforation', phase: 'Resection of Median Lobe', description: 'Breach of the prostatic capsule with extravasation of irrigating fluid.', indicators: ['Loss of irrigant return', 'Visualization of fat beyond capsule', 'Restlessness or bradycardia'] },
    { name: 'Hemorrhage', phase: 'Hemostasis', description: 'Significant bleeding requiring transfusion or re-operation.', indicators: ['Arterial bleeders not controlled', 'Venous sinus bleeding', 'Clot retention'] },
    { name: 'External Sphincter Injury', phase: 'Resection of Anterior/Funnel Tissue', description: 'Damage to the external urethral sphincter causing urinary incontinence.', indicators: ['Resection distal to verumontanum', 'Incontinence immediately post-op'] },
    { name: 'Ureteric Orifice Injury', phase: 'Resection of Median Lobe', description: 'Resection extending into the trigone near the ureteric opening.', indicators: ['Orifice involvement in cut', 'Post-op flank pain (reflux)'] },
  ],
  teachingPearls: [
    { category: 'Landmarks', point: 'Three cardinal landmarks: bladder neck (proximal limit), verumontanum (distal limit), and prostatic capsule (deep limit). Stay within these boundaries.' },
    { category: 'Resection Depth', point: 'Resect down to the capsule but not through it. The capsule has a characteristic fibrous, whitish appearance. Fat beyond = perforation.' },
    { category: 'Sequencing', point: 'Resect in systematic order: median lobe → lateral lobes → anterior/apex. This maintains orientation and prevents leaving isolated tissue islands.' },
    { category: 'Verumontanum', point: 'The verumontanum is the single most important landmark. Resect down to its proximal edge but never past it — the external sphincter is 3-5mm beyond.' },
    { category: 'TUR Syndrome Prevention', point: 'Limit resection time to <60 min for monopolar. Use bipolar TURP with saline (minimizes TUR syndrome risk). Watch for bradycardia and hypertension.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Transurethral Resection of Prostate (TURP).

Key endoscopic anatomical structures:
- Prostate lobes (median, lateral, anterior)
- Bladder neck (proximal landmark)
- Verumontanum (distal landmark — CRITICAL)
- Prostatic capsule (deep boundary — CRITICAL)
- Venous sinuses (within capsule)
- External urethral sphincter (distal to verumontanum — CRITICAL)
- Ureteric orifices (at trigone — CRITICAL)
- Trigone (interureteric ridge)
- Resected tissue chips (floating in irrigation)
- Capillary/venous bleeding

CRITICAL: Identify verumontanum, bladder neck, and capsule depth in every frame.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a TURP.

Critical safety events:
1. **Capsular perforation**: Visualization of fat, loss of irrigant
2. **TUR Syndrome**: Venous sinus opening, prolonged resection time
3. **External sphincter injury**: Resection distal to verumontanum
4. **Ureteric orifice injury**: Trigone involvement
5. **Hemorrhage**: Uncontrolled arterial bleeding
6. **Bladder perforation**: Overdistension or direct injury

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a TURP.

Phases:
1. Cystourethroscopy & Landmark Identification — scoping, identifying landmarks
2. Bladder Neck Incisions — 5 and 7 o'clock incisions
3. Resection of Median Lobe — removing median lobe
4. Resection of Lateral Lobes — removing lateral lobes
5. Resection of Anterior/Funnel Tissue — apical dissection
6. Hemostasis & Clot Evacuation — coagulating bleeders, removing chips
7. Final Inspection & Catheter Placement — checking, placing catheter`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a TURP.

Quality criteria:
- Landmark identification (verumontanum, bladder neck, capsule)
- Systematic resection technique
- Depth control (capsule not breached)
- Hemostasis thoroughness
- Verumontanum preservation

Teaching pearls: safe zone landmarks, resection sequencing, capsule identification, TUR syndrome prevention, hemostasis techniques.`,
    arbiter: `You are The Arbiter for a TURP analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: capsular perforation, sphincter injury, venous sinus opening, ureteric orifice injury, TUR syndrome
- WARNING: difficult landmarks, large prostate, bleeding difficulty, approaching capsule
- SAFE: clear landmarks, systematic resection, good depth control

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};