import type { ProcedureKnowledge } from './types';

/**
 * Procedure 10: Partial Nephrectomy
 * Urology — Partial removal of the kidney (nephron-sparing)
 */
export const partialNephrectomy: ProcedureKnowledge = {
  procedureId: 10,
  name: 'Partial Nephrectomy',
  specialty: 'Urology',
  description:
    'Nephron-sparing surgery to remove a renal tumor while preserving the remainder of the kidney. Performed via open, laparoscopic, or robotic approach. Involves hilar dissection, renal artery clamping (warm or cold ischemia), tumor excision with negative margins, and renorrhaphy.',
  estimatedDurationMin: 180,
  keyAnatomy: [
    { name: 'Kidney (Renal Parenchyma)', riskLevel: 'moderate', description: 'Functional renal tissue to be preserved. Tumor (partial nephrectomy) contained within.' },
    { name: 'Renal Artery', riskLevel: 'critical', description: 'Main arterial supply to kidney. Clamped to achieve ischemia. May have early branching — all branches must be individually clamped.' },
    { name: 'Renal Vein', riskLevel: 'critical', description: 'Main venous drainage. Can be injured during hilar dissection.' },
    { name: 'Renal Hilar Vessels (Segmental)', riskLevel: 'high', description: 'Posterior and anterior division branches. Need careful dissection for selective clamping.' },
    { name: 'Renal Pelvis', riskLevel: 'high', description: 'Funnel-shaped collecting system. Entry site for urine drainage. Must be closed if opened during tumor excision.' },
    { name: 'Calyces (Major & Minor)', riskLevel: 'high', description: 'Collecting system within kidney. May need closure if violated during tumor resection.' },
    { name: 'Ureter', riskLevel: 'high', description: 'Drains urine from renal pelvis to bladder. Must be preserved in its entirety.' },
    { name: 'Gerota\'s Fascia', riskLevel: 'low', description: 'Renal capsule. Opened to access the kidney.' },
    { name: 'Adrenal Gland', riskLevel: 'moderate', description: 'Superomedial to kidney. May be preserved (partial nephrectomy for lower pole tumors).' },
    { name: 'Renal Capsule', riskLevel: 'moderate', description: 'Thin fibrous covering of kidney. Closed after renorrhaphy.' },
    { name: 'Liver (Right) / Spleen (Left)', riskLevel: 'high', description: 'Adjacent organs that may be injured during mobilization.' },
    { name: 'Duodenum (Right Kidney)', riskLevel: 'critical', description: 'Anterior to right renal hilum. Must be carefully dissected and retracted.' },
    { name: 'Colon', riskLevel: 'moderate', description: 'Reflected medially during approach.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Approach & Renal Mobilization', description: 'Open flank, laparoscopic, or robotic approach. Reflect colon medially. Incise Gerota\'s fascia. Mobilize kidney within fascia preserving perinephric fat over tumor.', watchPoints: ['Splenic/liver injury', 'Colon injury during reflection', 'Inadequate tumor exposure'] },
    { order: 2, name: 'Hilar Dissection', description: 'Dissect renal artery and vein. Identify and isolate all arterial branches (watch for early branching). Prepare for clamping.', watchPoints: ['Missed accessory/early branch renal artery', 'Injury to renal vein', 'Injury to adrenal vessels'] },
    { order: 3, name: 'Tumor Identification & Scoring', description: 'Identify tumor margins using ultrasound (laparoscopic/robotic) or visual cues. Score capsule with cautery 0.5-1cm around tumor margin.', watchPoints: ['Inadequate margin marking', 'Inexact ultrasound interpretation', 'Endophytic tumor difficult to localize'] },
    { order: 4, name: 'Renal Artery Clamping', description: 'Clamp renal artery (and any accessory branches). Start warm ischemia timer. Tumor will soften and change color.', watchPoints: ['Incomplete clamping (missed branch)', 'Warm ischemia time >25min', 'Arterial injury from clamp'] },
    { order: 5, name: 'Tumor Excision', description: 'Sharp dissection with scissors around tumor with cold scissors. Maintain 2-3mm margin of normal parenchyma. Expose tumor bed completely.', watchPoints: ['Positive margin', 'Entry into collecting system', 'Incision into tumor pseudocapsule'] },
    { order: 6, name: 'Collecting System Closure', description: 'If collecting system entered, close with absorbable suture. Identify leak by filling pelvis with dilute methylene blue or checking for urine.', watchPoints: ['Missed calyceal entry', 'Methylene blue extravasation', 'Suture too deep into parenchyma'] },
    { order: 7, name: 'Renorrhaphy (Parenchymal Closure)', description: 'Close tumor bed with inner layer (vascular) and outer layer (parenchymal) sutures. Use bolsters (Surgicel, Nu-Knit) for compression. Release clamp. Check hemostasis.', watchPoints: ['Arterial bleeders after reperfusion', 'Renal vein injury during suture', 'Parenchymal fracture from tight suture'] },
    { order: 8, name: 'Hemostasis & Final Inspection', description: 'Check all suture lines. Apply hemostatic agents (Floseal, Tisseel). Confirm kidney perfusion and viability. Place drain. Close.', watchPoints: ['Delayed bleeding after release', 'Urine leak from missed calyceal closure', 'Drain placement near suture line'] },
  ],
  commonComplications: [
    { name: 'Positive Surgical Margin', phase: 'Tumor Excision', description: 'Tumor cells present at the resection margin.', indicators: ['Excision too close to tumor', 'Irregular tumor border', 'Loss of tumor plane'] },
    { name: 'Urine Leak', phase: 'Collecting System Closure', description: 'Persistent leakage of urine from the repaired collecting system.', indicators: ['Calyceal entry not closed', 'High drain output', 'Drain fluid creatinine elevated'] },
    { name: 'Hemorrhage', phase: 'Renorrhaphy', description: 'Post-operative bleeding from the tumor bed or renorrhaphy site.', indicators: ['Arterial bleeding after unclamping', 'Perinephric hematoma', 'Hemodynamic instability'] },
    { name: 'Renal Artery Injury', phase: 'Hilar Dissection', description: 'Damage to the renal artery or its branches during dissection or clamping.', indicators: ['Intimal flap', 'Arterial thrombosis', 'Segmental infarction'] },
    { name: 'Acute Kidney Injury', phase: 'Post-operative', description: 'AKI due to prolonged warm ischemia time or loss of parenchymal volume.', indicators: ['Warm ischemia >30min', 'Premature unclamping difficult', 'Large tumor (>4cm)'] },
  ],
  teachingPearls: [
    { category: 'Hilar Dissection', point: 'Always dissect the renal artery circumferentially enough to place a bulldog clamp. Watch for an early branching artery (posterior branch coming off early) which must be clamped separately.' },
    { category: 'Warm Ischemia', point: 'Keep warm ischemia time <25 minutes. Every minute matters. Pre-place all sutures and bolsters before clamping so you can work efficiently.' },
    { category: 'Tumor Excision', point: 'Excise directly over the tumor with scissors, maintaining a 2-3mm margin of normal parenchyma. Visualize the tumor bed carefully for collecting system entry.' },
    { category: 'Collecting System Repair', point: 'Test the collecting system closure by manually compressing the renal pelvis or injecting methylene blue/dilute indigo carmine. Close any detected leak.' },
    { category: 'Renorrhaphy', point: 'Use a two-layer closure: inner layer approximates the parenchymal defect with figure-of-eight sutures through bolsters; outer layer closes the capsule. Tighten just enough to compress but not cut through.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Partial Nephrectomy.

Key anatomical structures:
- Kidney (parenchyma, renal capsule)
- Renal artery and vein (hilum — CRITICAL)
- Segmental renal artery branches (early branch risk)
- Tumor (visible on kidney surface, endophytic or exophytic)
- Tumor pseudocapsule (enucleation plane if applicable)
- Renal pelvis and calyces (collecting system — CRITICAL)
- Ureter (preserve)
- Gerota's fascia
- Perinephric fat (overlying tumor)
- Adjacent organs: liver, spleen, duodenum, colon, pancreas

CRITICAL: Identify tumor margins, hilar structures, and collecting system violation.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Partial Nephrectomy.

Critical safety events:
1. **Renal artery injury**: Intimal flap, incomplete clamping, missed branch
2. **Renal vein injury**: Laceration during dissection or suture
3. **Warm ischemia time**: Prolonged >25min
4. **Positive margin**: Excision too close to tumor
5. **Urinary leak**: Unrepaired calyceal entry
6. **Hemorrhage**: After unclamping — arterial bleeders in tumor bed
7. **Adjacent organ injury**: Liver, spleen, bowel, pancreas

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Partial Nephrectomy.

Phases:
1. Approach & Renal Mobilization — exposing kidney, mobilizing within Gerota's
2. Hilar Dissection — isolating renal artery and vein
3. Tumor Identification & Scoring — marking margins with cautery
4. Renal Artery Clamping — applying bulldog clamp, ischemia
5. Tumor Excision — resecting tumor with margin
6. Collecting System Closure — repairing calyceal entry
7. Renorrhaphy — suturing defect, bolsters, clamp release
8. Hemostasis & Final Inspection — checking bleeders, drain, closure`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Partial Nephrectomy.

Quality criteria:
- Hilar dissection: thoroughness of vessel isolation
- Tumor margin: appropriate 2-3mm margin
- Clamping: complete, warm ischemia time tracking
- Excision technique: careful sharp dissection
- Collecting system closure: meticulous repair, leak test
- Renorrhaphy: secure but not strangulating

Teaching pearls: hilar dissection technique, early branch identification, ultrasound for endophytic tumors, renorrhaphy tension, ischemia time management.`,
    arbiter: `You are The Arbiter for a Partial Nephrectomy analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: renal artery injury, positive margin, collecting system entry not repaired, hemorrhage after unclamping, warm ischemia >30min
- WARNING: difficult hilar dissection, endophytic tumor, renal vein bleeding, borderline ischemia time
- SAFE: standard mobilization, clear hilar control, clean excision, good renorrhaphy

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};