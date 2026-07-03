import type { ProcedureKnowledge } from './types';

/**
 * Procedure 5: Coronary Artery Bypass Grafting (CABG)
 * Cardiac Surgery — Bypass blocked coronary arteries
 */
export const cabg: ProcedureKnowledge = {
  procedureId: 5,
  name: 'Coronary Artery Bypass Grafting (CABG)',
  specialty: 'Cardiac Surgery',
  description:
    'Open-heart surgical procedure to bypass blocked coronary arteries using grafts from the internal mammary artery, saphenous vein, or radial artery. Requires cardiopulmonary bypass and cardioplegic arrest (on-pump) or specialized stabilizers (off-pump).',
  estimatedDurationMin: 240,
  keyAnatomy: [
    { name: 'Left Anterior Descending (LAD) Artery', riskLevel: 'critical', description: 'Main anterior coronary artery supplying LV anterior wall. Most commonly grafted target.' },
    { name: 'Right Coronary Artery (RCA)', riskLevel: 'critical', description: 'Supplies RV, inferior LV, SA/AV nodes. Common graft target.' },
    { name: 'Circumflex Artery (LCx)', riskLevel: 'critical', description: 'Supplies lateral/posterior LV wall. Obtuse marginal branches are graft targets.' },
    { name: 'Left Main Coronary Artery', riskLevel: 'critical', description: 'Divides into LAD and LCx. Critical stenosis requires urgent revascularization.' },
    { name: 'Aorta (Ascending)', riskLevel: 'critical', description: 'Proximal anastomosis site for vein grafts. Cannulation and clamping site.' },
    { name: 'Left Internal Mammary Artery (LIMA)', riskLevel: 'high', description: 'Best graft conduit — pedicled to LAD. Must be harvested carefully.' },
    { name: 'Saphenous Vein (GSV)', riskLevel: 'moderate', description: 'Common vein graft conduit. Harvested from leg endoscopically or open.' },
    { name: 'Right Atrium & Appendage', riskLevel: 'high', description: 'Venous cannulation site for cardiopulmonary bypass.' },
    { name: 'Superior & Inferior Vena Cava', riskLevel: 'high', description: 'Venous drainage cannulation sites.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Median Sternotomy & Conduit Harvest', description: 'Perform median sternotomy. Harvest LIMA pedicle. Simultaneously harvest saphenous vein or radial artery.', watchPoints: ['Sternotomy off-midline', 'LIMA injury during harvest', 'Phrenic nerve injury'] },
    { order: 2, name: 'Pericardiotomy & Bypass Cannulation', description: 'Open pericardium. Purse-string aorta, right atrium. Insert aortic cannula and venous cannula. Initiate cardiopulmonary bypass.', watchPoints: ['Air embolism', 'Aortic dissection from cannula', 'Malposition of venous cannula'] },
    { order: 3, name: 'Cross-clamp & Cardioplegia', description: 'Cross-clamp ascending aorta. Deliver cardioplegia (antegrade ± retrograde) to achieve electromechanical arrest.', watchPoints: ['Incomplete arrest', 'Aortic valve injury from clamp', 'Coronary air emboli'] },
    { order: 4, name: 'Distal Anastomoses', description: 'Identify target coronary arteries. Perform arteriotomy. Suture distal end of graft to coronary artery (8-0 or 7-0 Prolene).', watchPoints: ['Coronary artery injury', 'Poor anastomotic suture technique', 'Back-wall stitch'] },
    { order: 5, name: 'Proximal Anastomoses', description: 'Place side-biting clamp on ascending aorta. Create aortotomy. Suture proximal end of vein grafts to aorta (6-0 Prolene).', watchPoints: ['Aortic dissection from clamp', 'Air in grafts', 'Bleeding from anastomosis'] },
    { order: 6, name: 'De-airing & Reperfusion', description: 'Release cross-clamp. De-air heart via aortic root vent. Allow reperfusion. Heart typically resumes beating spontaneously or with defibrillation.', watchPoints: ['Air emboli to right coronary', 'Ventricular arrhythmias', 'Incomplete de-airing'] },
    { order: 7, name: 'Hemostasis & Graft Check', description: 'Check all anastomoses for bleeding. Assess graft flow with Doppler or flow probe. Achieve surgical hemostasis.', watchPoints: ['Anastomotic bleeding', 'Tension on grafts', 'Flow insufficiency'] },
    { order: 8, name: 'Decannulation & Closure', description: 'Wean from bypass. Remove venous and aortic cannulae. Protamine reversal. Place pacing wires, chest tubes. Close sternum and layers.', watchPoints: ['Protamine reaction', 'Tamponade from bleeding', 'Sternal instability'] },
  ],
  commonComplications: [
    { name: 'Graft Failure', phase: 'Distal Anastomoses', description: 'Acute graft thrombosis or technical failure.', indicators: ['Poor Doppler signal', 'Kinking of graft', 'Intimal flap in target vessel'] },
    { name: 'Myocardial Infarction', phase: 'Post-operative', description: 'Peri-operative MI due to inadequate revascularization or graft failure.', indicators: ['New ST changes', 'Reduced graft flow', 'Inadequate cardioplegia protection'] },
    { name: 'Bleeding / Cardiac Tamponade', phase: 'Decannulation & Closure', description: 'Post-operative bleeding requiring re-exploration.', indicators: ['Mediastinal bleeding >200ml/hr', 'Increasing chest tube output', 'Hemodynamic compromise'] },
    { name: 'Stroke', phase: 'Bypass Cannulation', description: 'Embolic or hypoperfusion stroke during bypass.', indicators: ['Atheromatous aorta', 'Air in left heart', 'Prolonged bypass time'] },
    { name: 'Phrenic Nerve Injury', phase: 'Conduit Harvest', description: 'Injury from cold injury or surgical trauma during LIMA harvest.', indicators: ['Hemidiaphragm elevation', 'Difficult weaning from vent'] },
    { name: 'Atrial Fibrillation', phase: 'Post-operative', description: 'New-onset AF after cardiac surgery (very common).', indicators: ['Irregular rhythm', 'Hemodynamic instability', 'Risk of stroke'] },
  ],
  teachingPearls: [
    { category: 'LIMA to LAD', point: 'The LIMA-to-LAD graft is the "gold standard" with 90%+ patency at 10 years. Always harvest LIMA as a pedicle with surrounding fat and muscle.' },
    { category: 'Sequential Grafting', point: 'Sequential (side-to-side and end-to-side) anastomoses can revascularize multiple territories with a single vein graft, but require precise planning of graft length.' },
    { category: 'Target Identification', point: 'Identify the target coronary by palpating for the plaque (calcified) and visualizing the epicardial fat line over the vessel. Do not dissect into the myocardium.' },
    { category: 'Cardioplegia Delivery', point: 'Antegrade cardioplegia may be inadequate with severe coronary stenosis. Retrograde cardioplegia via the coronary sinus provides better distribution to the LV.' },
    { category: 'Conduit Choice', point: 'LIMA > radial artery (if negative Allen\'s test) > saphenous vein. Use the best conduit for the most important target (LIMA to LAD).' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Coronary Artery Bypass Grafting (CABG) procedure.

Key anatomical structures:
- Heart (epicardial surface, chambers visible)
- LAD artery (anterior interventricular groove)
- RCA (right atrioventricular groove)
- LCx and obtuse marginal branches
- Ascending aorta (cannulation, clamping, proximal anastomosis sites)
- Left internal mammary artery (LIMA) pedicle
- Saphenous vein grafts
- Right atrium and SVC (venous cannulation)
- Pericardium (opened, edges)

CRITICAL: Identify target coronary arteries on epicardial surface. Note graft locations and anastomotic sites.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a CABG procedure.

Critical safety events:
1. **Aortic dissection**: Cannulation or clamping injury to aorta
2. **Air embolism**: Incomplete de-airing before cross-clamp removal
3. **Graft malposition**: Kinking, tension, twisting of grafts
4. **Anastomotic bleeding**: Inadequate suture line hemostasis
5. **Arrhythmia**: Ventricular fibrillation during reperfusion
6. **Myocardial protection failure**: Incomplete arrest, rewarming

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a CABG procedure.

Phases in order:
1. Median Sternotomy & Conduit Harvest — sternotomy, LIMA/vein harvest
2. Pericardiotomy & Bypass Cannulation — opening pericardium, cannulation
3. Cross-clamp & Cardioplegia — aortic clamping, arresting heart
4. Distal Anastomoses — suturing grafts to coronary targets
5. Proximal Anastomoses — suturing grafts to aorta
6. De-airing & Reperfusion — clamp removal, resuscitation
7. Hemostasis & Graft Check — checking bleeds, graft flow
8. Decannulation & Closure — removing cannulae, closing chest`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a CABG procedure.

Assessment criteria:
- Conduit harvest: intact pedicle, no trauma
- Anastomotic technique: appropriate suture spacing, depth, tension
- Graft geometry: correct length, lie, orientation
- Myocardial protection: complete arrest, appropriate cardioplegia
- De-airing: thoroughness of air removal

Teaching pearls: LIMA skeletonization, parachute technique for distal anastomosis, sequential grafting strategy, de-airing maneuvers.`,
    arbiter: `You are The Arbiter for a CABG procedure analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: aortic dissection, air embolism, massive bleeding, graft failure
- WARNING: marginal graft flow, difficult targets, incomplete arrest, coagulopathy
- SAFE: standard technique, good graft geometry, hemostatic anastomoses

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};