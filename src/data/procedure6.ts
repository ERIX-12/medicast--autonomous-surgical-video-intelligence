import type { ProcedureKnowledge } from './types';

/**
 * Procedure 6: Mitral Valve Repair
 * Cardiac Surgery — Repair degenerative mitral regurgitation
 */
export const mitralValveRepair: ProcedureKnowledge = {
  procedureId: 6,
  name: 'Mitral Valve Repair',
  specialty: 'Cardiac Surgery',
  description:
    'Surgical repair of the mitral valve for degenerative mitral regurgitation (typically due to prolapse or flail of the posterior leaflet). Usually involves quadrangular resection, sliding plasty, chordal replacement, and annuloplasty ring placement via sternotomy or right mini-thoracotomy.',
  estimatedDurationMin: 210,
  keyAnatomy: [
    { name: 'Mitral Valve (Anterior Leaflet)', riskLevel: 'critical', description: 'Larger, aortic-mitral curtain related. Less commonly prolapses but technically challenging to repair.' },
    { name: 'Mitral Valve (Posterior Leaflet)', riskLevel: 'critical', description: 'Three scallops: P1, P2, P3. P2 most commonly prolapses. Target for quadrangular resection.' },
    { name: 'Chordae Tendineae', riskLevel: 'high', description: 'Support valve leaflets. Ruptured chordae cause leaflet prolapse. Replacement with Gore-Tex neo-chordae.' },
    { name: 'Papillary Muscles (Anterolateral, Posteromedial)', riskLevel: 'high', description: 'Attach chordae to LV wall. Rupture causes severe MR.' },
    { name: 'Mitral Annulus', riskLevel: 'high', description: 'Fibrous ring supporting valve. Dilates in chronic MR. Requires annuloplasty ring to stabilize repair.' },
    { name: 'Left Atrium', riskLevel: 'moderate', description: 'Accessed via left atriotomy or transseptal approach. Enlarges in chronic MR.' },
    { name: 'Coronary Sinus', riskLevel: 'high', description: 'Runs in AV groove posteriorly. At risk during annuloplasty suture placement.' },
    { name: 'Circumflex Artery', riskLevel: 'critical', description: 'Runs in left AV groove near mitral annulus. Can be injured by deep sutures in P1 area.' },
    { name: 'Aortic Valve', riskLevel: 'high', description: 'In close proximity to anterior mitral leaflet. Can be injured during anterior leaflet repair.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Exposure & Cardiopulmonary Bypass', description: 'Sternotomy (or thoracotomy). Aortic and bicaval cannulation. Cross-clamp, antegrade/retrograde cardioplegia.', watchPoints: ['Air in left heart', 'Inadequate venous drainage', 'X-clamp related aortic injury'] },
    { order: 2, name: 'Left Atriotomy & Valve Exposure', description: 'Open left atrium posterior to interatrial groove (Sondergaard\'s groove). Place atrial retractors to expose mitral valve.', watchPoints: ['Injury to right atrium', 'Inadequate exposure of subvalvar apparatus', 'Retraction injury to atrial tissue'] },
    { order: 3, name: 'Valve Analysis & Assessment', description: 'Analyze leaflet pathology. Confirm location of prolapse (P1, P2, P3 vs anterior). Assess chordal and papillary integrity. Salt test to confirm prolapse location.', watchPoints: ['Missed bileaflet prolapse', 'Underestimate complexity', 'Cleft in leaflet missed'] },
    { order: 4, name: 'Leaflet Resection / Repair', description: 'Perform quadrangular or triangular resection of prolapsing segment. Re-approximate leaflet edges. Sliding plasty if needed to reduce leaflet height.', watchPoints: ['Insufficient resection', 'Leaflet height >15mm', 'Tension on repair', 'Systolic anterior motion (SAM) risk'] },
    { order: 5, name: 'Chordal Reconstruction (if needed)', description: 'Place Gore-Tex neo-chordae from papillary muscle head to prolapsing leaflet edge. Adjust length to achieve proper coaptation.', watchPoints: ['Neo-chordae length error', 'Papillary muscle head avulsion', 'Knot too bulky'] },
    { order: 6, name: 'Annuloplasty Ring Implantation', description: 'Suture annuloplasty ring (complete or band) to mitral annulus using interrupted or running sutures. Ring size determined by anterior leaflet area.', watchPoints: ['Suture too deep circumflex injury', 'Ring undersizing/oversizing', 'Suture laceration of leaflet'] },
    { order: 7, name: 'Saline Test & Leaflet Coaptation Assessment', description: 'Inject saline into LV to test valve competence. Assess coaptation length and height. Confirm no residual prolapse or SAM.', watchPoints: ['Residual MR >mild', 'SAM with LVOT obstruction', 'Coaptation <5mm'] },
    { order: 8, name: 'De-airing, Weaning & TEE Confirmation', description: 'Close atriotomy. De-air heart. Wean from bypass. Confirm repair result on TEE — MR grade, gradient, SAM, leaflet motion.', watchPoints: ['Significant residual MR', 'Systolic anterior motion', 'Elevated transmitral gradient >5mmHg'] },
  ],
  commonComplications: [
    { name: 'Systolic Anterior Motion (SAM)', phase: 'Post-repair TEE', description: 'Anterior leaflet drawn into LVOT during systole causing LVOT obstruction and MR.', indicators: ['Long posterior leaflet (>15mm)', 'Small hyperdynamic LV', 'Myxomatous valve with excess tissue'] },
    { name: 'Residual Mitral Regurgitation', phase: 'Saline Test', description: 'Incomplete coaptation or persistent prolapse after repair.', indicators: ['Probe-patent in saline test', 'Insufficient leaflet apposition', 'Unrepaired cleft'] },
    { name: 'Circumflex Artery Injury', phase: 'Annuloplasty Ring Implantation', description: 'Suture placed too deep in P1 region causing myocardial ischemia.', indicators: ['Suture in AV groove near LCx', 'New wall motion abnormality', 'ST changes post-bypass'] },
    { name: 'Chordal Rupture', phase: 'Chordal Reconstruction', description: 'Rupture of native or neo-chordae during or after repair.', indicators: ['Insufficient chordal support', 'Excessive tension on repair', 'Knot slippage'] },
  ],
  teachingPearls: [
    { category: 'Exposure', point: 'Use a long left atriotomy posterior to the interatrial groove. Place a left atrial retractor (e.g., Cosgrove) for optimal exposure. Vent the left ventricle to keep the field dry.' },
    { category: 'Leaflet Height', point: 'Keep posterior leaflet height <15mm to prevent SAM. Use sliding plasty to reduce height if >15mm even after quadrangular resection.' },
    { category: 'Ring Sizing', point: 'Size the annuloplasty ring to the anterior leaflet area (height × width), NOT to the dilated annulus. Undersizing the ring is a common error.' },
    { category: 'Neo-chordae', point: 'Pre-measure chordal length with a caliper against a non-prolapsing segment. The "loop technique" allows reproducible chordal length and easier adjustment.' },
    { category: 'Water Test', point: 'Always test with saline before and after ring placement. Mild or moderate central MR on saline test becomes worse after LV loading off-bypass.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Mitral Valve Repair procedure.

Key anatomical structures:
- Mitral valve leaflets: Anterior (A1, A2, A3) and Posterior (P1, P2, P3 scallops)
- Chordae tendineae (native and Gore-Tex neo-chordae)
- Papillary muscles (anterolateral, posteromedial)
- Mitral annulus and annuloplasty ring
- Left atrium (atriotomy)
- Circumflex artery (in AV groove — CRITICAL)
- Aortic valve (adjacent to anterior leaflet)
- Left ventricle (viewed across valve)

CRITICAL: Prolapse location (scallop specific), leaflet height, coaptation, SAM risk.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Mitral Valve Repair.

Critical safety events:
1. **Circumflex artery injury**: Deep suture in P1 region
2. **SAM**: Long posterior leaflet, excess tissue, hyperdynamic LV
3. **Residual MR**: Incomplete repair
4. **Aortic valve injury**: Suture damage to adjacent aortic valve
5. **Air emboli**: Incomplete left heart de-airing
6. **Iatrogenic cleft**: From aggressive resection
7. **Neo-chordae failure**: Wrong length, knot failure

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Mitral Valve Repair.

Phases in order:
1. Exposure & Bypass — sternotomy, cannulation, cross-clamp
2. Left Atriotomy & Valve Exposure — opening LA, exposing valve
3. Valve Analysis & Assessment — examining pathology
4. Leaflet Resection / Repair — resecting prolapsed segment
5. Chordal Reconstruction — neo-chordae placement (if performed)
6. Annuloplasty Ring Implantation — suturing ring to annulus
7. Saline Test & Coaptation Assessment — testing competence
8. De-airing, Weaning & TEE Confirmation — closing, bypass wean, echo`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Mitral Valve Repair.

Quality criteria:
- Leaflet analysis: correct identification of prolapsing scallop
- Resection technique: appropriate extent, smooth edges
- Neo-chordae: correct length measurement, secure knots
- Annuloplasty: correct ring size, suture depth and spacing
- Coaptation: length >5mm, no SAM, no residual MR

Teaching pearls: chordal measurement techniques, SAM prevention, ring sizing by anterior leaflet, water testing interpretation, TEE findings correlation.`,
    arbiter: `You are The Arbiter for a Mitral Valve Repair analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: circumflex injury, papillary muscle rupture, severe SAM, aortic injury
- WARNING: residual MR >mild, borderline elevation gradient, challenging anatomy
- SAFE: good exposure, clean repair, excellent coaptation, normal TEE

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};