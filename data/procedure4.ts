import type { ProcedureKnowledge } from './types';

/**
 * Procedure 4: Total Hip Arthroplasty
 * Orthopedics — Total hip replacement
 */
export const totalHip: ProcedureKnowledge = {
  procedureId: 4,
  name: 'Total Hip Arthroplasty',
  specialty: 'Orthopedics',
  description:
    'Surgical replacement of the hip joint for osteoarthritis, avascular necrosis, or femoral neck fracture. Involves resecting the femoral head, reaming the acetabulum, and implanting acetabular and femoral components.',
  estimatedDurationMin: 90,
  keyAnatomy: [
    { name: 'Femoral Head', riskLevel: 'moderate', description: 'Resected at the femoral neck. Size and shape inform implant selection.' },
    { name: 'Femoral Neck', riskLevel: 'high', description: 'Osteotomy site. Level of cut affects leg length and offset.' },
    { name: 'Acetabulum', riskLevel: 'moderate', description: 'Reamed and replaced with acetabular cup. Orientation critical for stability.' },
    { name: 'Sciatic Nerve', riskLevel: 'critical', description: 'Posterior to the hip joint. At risk during posterior approaches and retraction.' },
    { name: 'Femoral Artery & Vein', riskLevel: 'critical', description: 'Anterior to hip joint. At risk during anterior approaches and retractor placement.' },
    { name: 'Superior Gluteal Nerve', riskLevel: 'high', description: 'Innervates abductors. At risk during lateral approaches and gluteal dissection.' },
    { name: 'Obturator Nerve', riskLevel: 'high', description: 'Runs along pelvic wall. Can be injured during acetabular reaming or screw placement.' },
    { name: 'Gluteus Medius & Minimus', riskLevel: 'high', description: 'Abductor muscles. Damage leads to Trendelenburg gait and instability.' },
    { name: 'Femoral Nerve', riskLevel: 'high', description: 'Anterior compartment. At risk during anterior capsular releases.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Approach & Exposure', description: 'Posterior (Moore/Southern) or anterior approach. Incise fascia lata/gluteal fascia. Expose hip capsule.', watchPoints: ['Sciatic nerve protection (posterior)', 'Femoral vessel protection (anterior)', 'Excessive muscle splitting'] },
    { order: 2, name: 'Capsulotomy & Hip Dislocation', description: 'T-shaped or longitudinal capsulotomy. Dislocate hip by adducting, flexing, and internally rotating (posterior approach).', watchPoints: ['Femoral fracture during dislocation', 'Capsular release insufficiency', 'Sciatic nerve stretch'] },
    { order: 3, name: 'Femoral Neck Osteotomy', description: 'Measure from lesser trochanter. Perform osteotomy at appropriate level (typically 10-15mm proximal to lesser trochanter).', watchPoints: ['Osteotomy too high/low', 'Splitting of femoral neck', 'Lesser trochanter reference loss'] },
    { order: 4, name: 'Acetabular Preparation', description: 'Ream acetabulum sequentially to bleeding bone. Preserve subchondral bone. Place trial cup to assess fit, version, and inclination.', watchPoints: ['Over-reaming losing fixation', 'Medial wall penetration', 'Retroversion of cup'] },
    { order: 5, name: 'Acetabular Component Implantation', description: 'Impact final acetabular component in correct orientation (40° inclination, 15-20° anteversion). Consider screw augmentation.', watchPoints: ['Incorrect cup version', 'Incomplete seating', 'Screw placement near neurovascular structures'] },
    { order: 6, name: 'Femoral Preparation', description: 'Open femoral canal. Sequential broaching to appropriate size. Assess stability, leg length, offset.', watchPoints: ['Femoral fracture during broaching', 'Incorrect version of broach', 'Perforation of femoral shaft'] },
    { order: 7, name: 'Femoral Component Implantation & Reduction', description: 'Impact final femoral stem. Place femoral head trial. Reduce hip. Assess leg length, stability, range of motion.', watchPoints: ['Femoral fracture during impaction', 'Dislocation on trialing', 'Leg length discrepancy'] },
    { order: 8, name: 'Closure', description: 'Irrigate thoroughly. Repair capsule, short external rotators (posterior approach), and abductors. Close deep fascia and skin.', watchPoints: ['Failure to repair posterior structures', 'Hematoma formation', 'Nerve compression from tight closure'] },
  ],
  commonComplications: [
    { name: 'Nerve Palsy', phase: 'Approach & Exposure', description: 'Sciatic (most common), femoral, or superior gluteal nerve injury from retraction or transection.', indicators: ['Excessive retraction force', 'Retractor malposition', 'Neurovascular bundle not identified'] },
    { name: 'Periprosthetic Fracture', phase: 'Femoral Preparation', description: 'Femoral shaft fracture during broaching or stem impaction.', indicators: ['Crack heard/felt during broach', 'Broach advance too easy', 'Femoral deformity or osteopenia'] },
    { name: 'Dislocation', phase: 'Reduction & Trialing', description: 'Hip dislocation after reduction due to component malposition, soft tissue imbalance, or impingement.', indicators: ['Incorrect version assessment', 'Offset under-restored', 'Soft tissue tension too loose'] },
    { name: 'Leg Length Discrepancy', phase: 'Femoral Neck Osteotomy', description: 'Post-operative limb length inequality >1cm.', indicators: ['Incorrect osteotomy level', 'Cup medialization', 'Stem subsidence'] },
    { name: 'Vascular Injury', phase: 'Acetabular Preparation', description: 'Injury to iliac vessels from screw placement or retractor placement.', indicators: ['Retroperitoneal hematoma', 'Screw trajectory toward obturator foramen', 'Anterior retractor too deep'] },
  ],
  teachingPearls: [
    { category: 'Approach Selection', point: 'Posterior approach offers excellent exposure but has higher dislocation risk if posterior structures are not repaired. Anterior approach preserves abductors.' },
    { category: 'Cup Positioning', point: 'The "safe zone" (Lewinnek) is 40° ± 10° inclination and 15° ± 10° anteversion. However, functional positioning based on spinopelvic motion is becoming paramount.' },
    { category: 'Leg Length', point: 'Place a reference pin in the ilium and measure to a fixed point on the femur before dislocation. Re-measure after trial reduction.' },
    { category: 'Offset', point: 'Restoring femoral offset is as important as leg length. Under-offset reduces abductor lever arm and increases dislocation risk.' },
    { category: 'Fracture Prevention', point: 'In osteoporotic bone, ream/brush the femur gently. Use a smaller broach than templated. Consider non-cemented or cemented stem based on bone quality.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Total Hip Arthroplasty.

Key anatomical structures:
- Femoral head and neck (osteotomy landmarks)
- Acetabulum (bony rim, fossa, transverse ligament)
- Sciatic nerve (posterior — CRITICAL)
- Femoral artery/vein (anterior — CRITICAL)
- Gluteus medius/minimus (abductors)
- Short external rotators (piriformis, gemelli, obturator internus)
- Greater and lesser trochanter (reference points)
- Superior gluteal nerve (lateral approach risk)`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Total Hip Arthroplasty.

Critical safety events:
1. **Sciatic nerve injury**: Retractor placement, distraction, or transection
2. **Femoral fracture**: During dislocation, broaching, or stem impaction
3. **Acetabular penetration**: Medial wall violation
4. **Vascular injury**: Retractor or screw placement near vessels
5. **Dislocation**: Component malposition, impingement
6. **Abductor injury**: Gluteus medius damage

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Total Hip Arthroplasty.

Phases in order:
1. Approach & Exposure — incising skin, muscle, exposing capsule
2. Capsulotomy & Hip Dislocation — opening capsule, dislocating
3. Femoral Neck Osteotomy — measuring, cutting femoral neck
4. Acetabular Preparation — reaming the acetabulum
5. Acetabular Component Implantation — inserting cup, screws
6. Femoral Preparation — broaching the femur
7. Femoral Component Implantation & Reduction — stem insertion, head assembly, reduction
8. Closure — capsule repair, muscle repair, skin closure`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Total Hip Arthroplasty.

Quality assessment criteria:
- Approach technique: nerve protection, muscle sparing
- Bone cuts: accuracy, preservation of bone stock
- Component positioning: version, inclination, alignment
- Soft tissue balancing: stability through range of motion
- Leg length: appropriate restoration

Teaching pearls: safe zones for cup placement, nerve protection strategies, offset restoration, prevention of fracture in osteoporotic bone.`,
    arbiter: `You are The Arbiter for a Total Hip Arthroplasty analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: nerve transection, vascular injury, femoral fracture, dislocation
- WARNING: difficult anatomy, osteoporotic bone, leg length issues, instability
- SAFE: standard exposure, clean cuts, good component positioning, stable reduction

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};