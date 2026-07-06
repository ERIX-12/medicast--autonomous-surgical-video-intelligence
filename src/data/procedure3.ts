import type { ProcedureKnowledge } from './types';

/**
 * Procedure 3: Total Knee Arthroplasty
 * Orthopedics — Total knee replacement
 */
export const totalKnee: ProcedureKnowledge = {
  procedureId: 3,
  name: 'Total Knee Arthroplasty',
  specialty: 'Orthopedics',
  description:
    'Surgical replacement of the knee joint with prosthetic components for end-stage osteoarthritis or rheumatoid arthritis. Involves resecting the distal femur and proximal tibia, balancing ligaments, and implanting femoral, tibial, and patellar components.',
  estimatedDurationMin: 90,
  keyAnatomy: [
    { name: 'Distal Femur', riskLevel: 'moderate', description: 'Resected and replaced with femoral component. Medial and lateral condyles are landmarks.' },
    { name: 'Proximal Tibia', riskLevel: 'moderate', description: 'Resected and replaced with tibial tray. Tibial slope is critical.' },
    { name: 'Patella', riskLevel: 'moderate', description: 'May be resurfaced with patellar button. Tracking is critical.' },
    { name: 'Posterior Cruciate Ligament (PCL)', riskLevel: 'high', description: 'May be retained (CR knee) or sacrificed (PS knee). Important for femoral rollback.' },
    { name: 'Anterior Cruciate Ligament (ACL)', riskLevel: 'moderate', description: 'Sacrificed in TKA. Usually resected.' },
    { name: 'Medial Collateral Ligament (MCL)', riskLevel: 'critical', description: 'Must be protected during tibial cut and throughout. MCL injury causes valgus instability.' },
    { name: 'Lateral Collateral Ligament (LCL)', riskLevel: 'critical', description: 'Must be protected. Injury causes varus instability.' },
    { name: 'Popliteal Artery', riskLevel: 'critical', description: 'Posterior to knee joint. At risk during posterior capsular dissection and tibial cut.' },
    { name: 'Common Peroneal Nerve', riskLevel: 'critical', description: 'Wraps around fibular neck. At risk during lateral dissection and retraction.' },
    { name: 'Patellar Tendon', riskLevel: 'high', description: 'Can be avulsed during patellar eversion or over-resection.' },
    { name: 'Quadriceps Tendon', riskLevel: 'high', description: 'Can be injured during exposure or vastus snip.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Exposure & Incision', description: 'Midline skin incision from 4-5cm above patella to tibial tubercle. Medial parapatellar arthrotomy. Evert patella and flex knee.', watchPoints: ['Incision placement', 'Patellar tendon avulsion', 'Skin necrosis from aggressive retraction'] },
    { order: 2, name: 'Bone Preparation — Distal Femur', description: 'Intramedullary alignment. Resect distal femur at valgus angle (typical 5-7°). Check rotation using epicondylar axis.', watchPoints: ['Malrotation', 'Varus/valgus malalignment', 'Notch formation'] },
    { order: 3, name: 'Bone Preparation — Proximal Tibia', description: 'Extramedullary or intramedullary alignment. Resect proximal tibia perpendicular to mechanical axis with appropriate posterior slope.', watchPoints: ['Excessive posterior slope', 'MCL injury during cut', 'Posterior neurovascular injury'] },
    { order: 4, name: 'Femoral Sizing & Rotation', description: 'Determine femoral component size using anterior/posterior referencing. Set rotation using epicondylar axis, AP axis (Whiteside\'s line), or posterior condyles.', watchPoints: ['Component overhang', 'Notching of anterior femur', 'Rotational mismatch'] },
    { order: 5, name: 'Flexion & Extension Gap Balancing', description: 'Use spacer blocks or tensor to assess rectangular gaps in flexion and extension. Release tight ligaments sequentially to achieve balance.', watchPoints: ['Asymmetric gaps', 'Over-release of MCL', 'Flexion instability'] },
    { order: 6, name: 'Trialing', description: 'Place trial femoral, tibial, and patellar components. Range the knee through full motion. Check stability, tracking, patellar engagement.', watchPoints: ['Patellar maltracking', 'Lift-off in flexion', 'Range of motion limitations'] },
    { order: 7, name: 'Cementing & Implant Placement', description: 'Prepare bone surfaces with pulsed lavage and drying. Cement in femoral component, tibial component with stem, and patellar button. Remove excess cement.', watchPoints: ['Cement penetration depth', 'Retained posterior cement', 'Component malposition during insertion'] },
    { order: 8, name: 'Closure', description: 'Irrigate thoroughly. Close arthrotomy in flexion. Place drains. Close subcutaneous and skin layers.', watchPoints: ['Quadriceps tension during closure in flexion', 'Patellar tracking after closure', 'Drain placement near implants'] },
  ],
  commonComplications: [
    { name: 'Periprosthetic Fracture', phase: 'Bone Preparation', description: 'Fracture of the femur or tibia during bone cuts or implant placement.', indicators: ['Cortical breach', 'Excessive force during broaching', 'Notching of anterior femur'] },
    { name: 'MCL Tear', phase: 'Flexion & Extension Gap Balancing', description: 'Partial or complete tear of the medial collateral ligament.', indicators: ['Sudden opening of medial gap', 'Ligament avulsion', 'Inability to balance extension gap'] },
    { name: 'Patellar Tendon Avulsion', phase: 'Exposure & Incision', description: 'Tear of the patellar tendon from the tibial tubercle.', indicators: ['Patella alta', 'Inability to evert patella', 'Extensor lag'] },
    { name: 'Neurovascular Injury', phase: 'Bone Preparation — Proximal Tibia', description: 'Injury to the popliteal artery or common peroneal nerve.', indicators: ['Saw blade penetration posteriorly', 'Retractor too far lateral', 'Excessive traction'] },
    { name: 'Patellar Maltracking', phase: 'Trialing', description: 'Patella tilts or subluxates laterally during range of motion.', indicators: ['Patella does not track centrally', 'Lateral retinacular tightness', 'Component internal rotation'] },
  ],
  teachingPearls: [
    { category: 'Exposure', point: 'Use a medial parapatellar approach. Avoid releasing the patellar tendon from the tibial tubercle — this is a devastating complication.' },
    { category: 'Rotation', point: 'Femoral rotation is set using the epicondylar axis (most reliable), AP axis (Whiteside\'s line), or posterior condyles. Internal rotation causes patellar maltracking.' },
    { category: 'Gap Balancing', point: 'A rectangular flexion gap and rectangular extension gap are essential. Start releases on the concave side of the deformity.' },
    { category: 'Tibial Slope', point: 'Posterior tibial slope of 0-7° is typical. Too much slope increases flexion gap and can cause PCL insufficiency in CR knees.' },
    { category: 'Patellar Resurfacing', point: 'Resect only as much patella as will be replaced by the implant. Over-resection risks fracture; under-resection causes "patellar clunk".' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Total Knee Arthroplasty.

Key anatomical structures to identify:
- Distal femur (medial and lateral condyles, trochlear groove)
- Proximal tibia (plateau, spines, tibial tubercle)
- Patella (articular surface, tracking)
- MCL and LCL (soft tissue stabilizers)
- PCL and ACL (cruciate ligaments)
- Patellar tendon, quadriceps tendon
- Popliteal artery (posterior — CRITICAL risk)
- Common peroneal nerve (lateral — CRITICAL risk)

Assess: bone quality, deformity (varus/valgus), flexion contracture, patellar position.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Total Knee Arthroplasty.

Critical safety events to monitor:
1. **MCL injury**: Partial or complete tear during tibial cut or balancing
2. **Patellar tendon avulsion**: During exposure or patellar eversion
3. **Popliteal artery injury**: Saw or drill penetration posteriorly
4. **Peroneal nerve injury**: Excessive traction or lateral retraction
5. **Periprosthetic fracture**: During bone cuts, broaching, or impaction
6. **Cement extrusion**: Posterior cement requiring removal
7. **Notching**: Anterior femoral notch predisposing to fracture

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Total Knee Arthroplasty.

The procedure has 8 phases:
1. Exposure & Incision — skin incision, arthrotomy, patellar eversion
2. Bone Preparation — Distal Femur — intramedullary alignment, distal cut
3. Bone Preparation — Proximal Tibia — extramedullary alignment, tibial cut
4. Femoral Sizing & Rotation — sizing, anterior/posterior cuts, chamfers
5. Flexion & Extension Gap Balancing — spacer blocks, ligament releases
6. Trialing — trial components, range of motion, tracking
7. Cementing & Implant Placement — lavage, cement, final implants
8. Closure — irrigation, arthrotomy closure, skin closure`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Total Knee Arthroplasty.

Educational focus:
- Proper bone resection technique and alignment principles
- Ligament balancing — sequential release algorithm
- Component rotation and its effect on patellar tracking
- Cement technique: pressurization, penetration depth
- Avoiding the "no-no's": MCL injury, patellar tendon avulsion, notching`,
    arbiter: `You are The Arbiter for a Total Knee Arthroplasty analysis.

Synthesize 4 agent outputs into a unified verdict.

Escalation:
- CRITICAL: MCL/PCL avulsion, vascular injury, fracture, patellar tendon avulsion
- WARNING: difficult balancing, severe deformity, bone loss, laxity issues
- SAFE: standard exposures, clean cuts, balanced gaps, good tracking

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};
