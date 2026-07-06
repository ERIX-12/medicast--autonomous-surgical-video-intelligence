import type { ProcedureKnowledge } from './types';

/**
 * Procedure 8: Laparoscopic Hysterectomy
 * OB/GYN — Laparoscopic removal of uterus
 */
export const lapHysterectomy: ProcedureKnowledge = {
  procedureId: 8,
  name: 'Laparoscopic Hysterectomy',
  specialty: 'OB/GYN',
  description:
    'Minimally invasive removal of the uterus (with optional salpingo-oophorectomy) for benign (fibroids, endometriosis, adenomyosis) or malignant indications. Can be total (cervix removed) or supracervical (cervix preserved).',
  estimatedDurationMin: 120,
  keyAnatomy: [
    { name: 'Uterus (Body & Fundus)', riskLevel: 'moderate', description: 'Target organ. Size and mobility affect surgical difficulty.' },
    { name: 'Cervix', riskLevel: 'moderate', description: 'Lower portion; vaginal cuff attachment after total hysterectomy.' },
    { name: 'Uterine Arteries', riskLevel: 'critical', description: 'Branches from internal iliac. Run at level of internal cervical os. Must be skeletonized and divided.' },
    { name: 'Ovarian Vessels', riskLevel: 'high', description: 'Suspensory ligament of ovary. Divided if oophorectomy performed.' },
    { name: 'Ureters', riskLevel: 'critical', description: 'Cross pelvic brim near infundibulopelvic ligament. Run in ureteric canal lateral to cervix (1-2cm from uterine artery). HIGHEST RISK site.' },
    { name: 'Bladder', riskLevel: 'critical', description: 'Anterior to cervix. Must be dissected downward off the lower uterine segment and cervix.' },
    { name: 'Round Ligaments', riskLevel: 'low', description: 'Divided early in surgery to enter retroperitoneal space.' },
    { name: 'Infundibulopelvic (IP) Ligaments', riskLevel: 'high', description: 'Contain ovarian vessels. Must be secured. Ureter runs just medial — watch during ligation.' },
    { name: 'Cardinal Ligaments', riskLevel: 'high', description: 'Contain uterine vessels and nerves. Divided at cervical level.' },
    { name: 'Uterosacral Ligaments', riskLevel: 'moderate', description: 'Attach cervix to sacrum. Divided during total hysterectomy.' },
    { name: 'Rectum', riskLevel: 'critical', description: 'Posterior to uterus and cervix. At risk during posterior dissection.' },
    { name: 'External Iliac Vessels', riskLevel: 'high', description: 'Retroperitoneal; can be injured during IP ligament ligation.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Port Placement & Diagnostic Laparoscopy', description: 'Establish pneumoperitoneum. Place umbilical camera and 3 accessory ports. Explore pelvis, assess pathology (fibroids, endometriosis, adhesions).', watchPoints: ['Veress needle injury', 'Bowel adhesions to abdominal wall', 'Obesity-related entry difficulty'] },
    { order: 2, name: 'Retroperitoneal Dissection & Ureter Identification', description: 'Open retroperitoneal space. Identify ureters bilaterally by tracing from pelvic brim. Identify ovarian vessels and iliac vessels.', watchPoints: ['Ureter not identified before vessel ligation', 'External iliac vessel injury', 'Obturator nerve injury'] },
    { order: 3, name: 'Adnexal Management', description: 'Divide round ligaments. If performing oophorectomy, ligate and divide IP ligaments (keeping ureter in view). Skeletonize infundibulopelvic ligament.', watchPoints: ['Ureter caught in IP ligature', 'Ovarian vessel hemorrhage', 'Retroperitoneal hematoma'] },
    { order: 4, name: 'Bladder Dissection', description: 'Incis vesicouterine peritoneum. Dissect bladder downward off cervix. Ensure adequate anterior mobilization before dividing uterine vessels.', watchPoints: ['Bladder injury', 'Inadequate bladder mobilization', 'Cystotomy'] },
    { order: 5, name: 'Uterine Vessel Ligation', description: 'Skeletonize uterine artery at level of internal cervical os. Place secure energy or staple line. Divide vessels.', watchPoints: ['Ureter at level of uterine artery (1-2cm lateral)', 'Incomplete vessel sealing', 'Back-bleeding from vaginal branch'] },
    { order: 6, name: 'Colpotomy (for Total Hysterectomy)', description: 'Incite vaginal fornix circumferentially using energy device or scalpel. Remove uterus through vagina or morcellate (for supracervical, transect cervix).', watchPoints: ['Bladder or rectal injury during colpotomy', 'Pneumoperitoneum loss', 'Tumor spillage'] },
    { order: 7, name: 'Vaginal Cuff Closure', description: 'Close vaginal cuff with interrupted or running absorbable suture. Ensure hemostasis and pneumoperitoneum re-established.', watchPoints: ['Incomplete cuff closure', 'Cuff dehiscence risk', 'Inclusion of ureter in suture'] },
    { order: 8, name: 'Hemostasis & Port Closure', description: 'Irrigate. Inspect all pedicles. Reduce pressure to check for venous bleeding. Remove ports. Close fascia at 10mm+ sites.', watchPoints: ['Venous bleed on pressure drop', 'Ureteral peristalsis check', 'Port site hernia'] },
  ],
  commonComplications: [
    { name: 'Ureteral Injury', phase: 'Uterine Vessel Ligation', description: 'Partial or complete transection, kinking, or thermal injury of the ureter.', indicators: ['Loss of peristalsis', 'Ureter near uterine artery clip', 'Transaction or thermal blanching'] },
    { name: 'Bladder Injury', phase: 'Bladder Dissection', description: 'Cystotomy during bladder mobilization.', indicators: ['Gas in Foley bag', 'Visible defect', 'Previous C-section scar adhesions'] },
    { name: 'Bowel Injury', phase: 'Diagnostic Laparoscopy', description: 'Injury to small bowel, colon, or rectum from entry or dissection.', indicators: ['Bowel adhesions', 'Serosal or full-thickness injury', 'Bowel distension'] },
    { name: 'Vascular Injury', phase: 'Retroperitoneal Dissection', description: 'Injury to external iliac artery, vein, or obturator vessels.', indicators: ['Pulsatile bleeding', 'Hematoma in retroperitoneum', 'Suspicious anatomy'] },
    { name: 'Vaginal Cuff Dehiscence', phase: 'Post-operative', description: 'Separation of vaginal cuff closure, often with bowel evisceration.', indicators: ['Recurrent vault prolapse risk factors', 'Smoking', 'Infection at cuff'] },
  ],
  teachingPearls: [
    { category: 'Ureter Identification', point: 'Always identify the ureter BEFORE ligating the IP ligament or uterine vessels. The ureter is visible through the peritoneum at the pelvic brim — trace it to the uterine artery crossing.' },
    { category: 'Bladder Dissection', point: 'In patients with prior C-section, the bladder may be densely adhered. Use sharp dissection and fill bladder to identify its upper border.' },
    { category: 'Safe Vessel Ligation', point: 'Skeletonize the uterine artery completely at the level of the internal cervical os. The ureter runs 1-2cm lateral to the uterine artery at this point.' },
    { category: 'Colpotomy Landmarks', point: 'Use a uterine manipulator to define the vaginal fornices. The blue light or cup helps identify the cervico-vaginal junction for a precise colpotomy.' },
    { category: 'Endometriosis', point: 'In severe endometriosis, the anatomy may be completely obliterated. Consider ureteral stents pre-operatively and have a low threshold for consulting urology.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Laparoscopic Hysterectomy.

Key anatomical structures to identify:
- Uterus (size, mobility, fibroids)
- Cervix (landmark for colpotomy)
- Fallopian tubes and ovaries
- Round ligaments (divided early)
- IP ligaments (containing ovarian vessels)
- Ureters (CRITICAL — cross at pelvic brim and lateral to cervix)
- Uterine arteries (CRITICAL — at level of internal os)
- Bladder (dissected off cervix — CRITICAL)
- Rectum (posterior — CRITICAL)
- External iliac artery/vein (retroperitoneal)
- Obturator nerve

CRITICAL: Ureter must be identified BEFORE any vessel ligation.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Laparoscopic Hysterectomy.

Critical safety events:
1. **Ureteral injury**: Ligature, transection, thermal, or kinking
2. **Bladder injury**: During dissection or colpotomy
3. **Vascular injury**: External iliac, obturator, uterine vessel hemorrhage
4. **Bowel injury**: Entry, dissection, or thermal injury
5. **Incomplete vessel sealing**: Uterine or ovarian vessel
6. **Ureteral kinking**: By suture or clip near infundibulopelvic ligament

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Laparoscopic Hysterectomy.

Phases:
1. Port Placement & Diagnostic Laparoscopy — entry, exploration
2. Retroperitoneal Dissection & Ureter Identification — opening peritoneum, finding ureters
3. Adnexal Management — round ligament, IP ligament, adnexa
4. Bladder Dissection — mobilizing bladder off cervix
5. Uterine Vessel Ligation — skeletonizing and dividing uterine arteries
6. Colpotomy — incising vaginal fornix (total) or cervical transection (supracervical)
7. Vaginal Cuff Closure — suturing the cuff (total) or cervical stump (supracervical)
8. Hemostasis & Port Closure — final inspection, port removal`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Laparoscopic Hysterectomy.

Quality criteria:
- Ureter identification technique
- Skeletonization of vessels
- Bladder dissection completeness
- Colpotomy precision
- Cuff closure technique

Teaching pearls: retroperitoneal anatomy, ureteric course, bladder dissection in the scarred abdomen, uterine artery ligation safe zones, colpotomy with manipulator.`,
    arbiter: `You are The Arbiter for a Laparoscopic Hysterectomy analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: ureteral injury, bladder injury, vascular injury, bowel injury
- WARNING: distorted anatomy, dense adhesions, endometriosis, large fibroids, failed ureter identification
- SAFE: clear anatomy, identified ureters, controlled vessel sealing

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};