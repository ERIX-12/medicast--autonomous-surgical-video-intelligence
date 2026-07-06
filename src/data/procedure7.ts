import type { ProcedureKnowledge } from './types';

/**
 * Procedure 7: Cesarean Section
 * OB/GYN — Delivery via abdominal incision
 */
export const cesareanSection: ProcedureKnowledge = {
  procedureId: 7,
  name: 'Cesarean Section',
  specialty: 'OB/GYN',
  description:
    'Surgical delivery of a baby through an incision in the abdominal wall (Pfannenstiel or midline) and uterine wall (lower uterine segment). One of the most common surgical procedures worldwide, performed for both elective and emergency indications.',
  estimatedDurationMin: 45,
  keyAnatomy: [
    { name: 'Uterus (Lower Segment)', riskLevel: 'moderate', description: 'Site of uterine incision. Thin-walled, less vascular, allows safe fetal extraction.' },
    { name: 'Bladder', riskLevel: 'critical', description: 'Lies anterior to lower uterine segment. Must be dissected downward to access uterus and avoid injury.' },
    { name: 'Uterine Vessels', riskLevel: 'critical', description: 'Bilateral ascending and descending branches. Lateral to uterus, can cause significant hemorrhage if lacerated.' },
    { name: 'Fallopian Tubes & Ovaries', riskLevel: 'moderate', description: 'May be visualized during pelvic exploration after delivery.' },
    { name: 'Fetal Membranes', riskLevel: 'low', description: 'Amnion and chorion; entered after uterine incision.' },
    { name: 'Rectus Abdominis Muscles', riskLevel: 'moderate', description: 'Separated in midline during abdominal entry.' },
    { name: 'Fascia (Anterior Rectus Sheath)', riskLevel: 'moderate', description: 'Closed at the end of the procedure.' },
    { name: 'Bladder Flap Peritoneum', riskLevel: 'high', description: 'Reflected peritoneum over bladder; incised to mobilize bladder downward.' },
    { name: 'Round Ligaments', riskLevel: 'low', description: 'Laparoscopic visualization landmark.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Abdominal Entry', description: 'Pfannenstiel skin incision (typically). Divide subcutaneous tissue. Incise fascia transversely. Separate rectus muscles. Open peritoneum.', watchPoints: ['Bladder injury (especially in repeat C-sections)', 'Bowel injury', 'Fascial incision too lateral'] },
    { order: 2, name: 'Bladder Dissection / Flap Development', description: 'Identify bladder reflection. Incise vesicouterine peritoneum. Bluntly dissect bladder downward off lower uterine segment.', watchPoints: ['Bladder laceration', 'Inadequate bladder mobilization', 'Bleeding from placental site'] },
    { order: 3, name: 'Uterine Incision (Hysterotomy)', description: 'Transverse incision in lower uterine segment using scalpel initially, then extended bluntly (or with scissors).', watchPoints: ['Laceration of uterine vessels laterally', 'Fetal injury', 'Incision too high (thick upper segment) or too low (cervix)'] },
    { order: 4, name: 'Delivery of Presenting Part', description: 'Delivery assistant applies fundal pressure. Surgeon delivers fetal head (or breech) using hand. Clear airway, deliver shoulders and body.', watchPoints: ['Difficult head delivery', 'Nuchal cord', 'Fetal trauma from forceps'] },
    { order: 5, name: 'Clamping & Cord Cutting', description: 'Clamp and cut umbilical cord. Hand off baby to pediatric team. Administer oxytocin ± other uterotonics.', watchPoints: ['Delayed cord clamping indication', 'Cord avulsion'] },
    { order: 6, name: 'Placental Delivery', description: 'Await spontaneous separation of placenta (or controlled cord traction). Remove placenta and membranes. Check completeness.', watchPoints: ['Retained placenta fragments', 'Postpartum hemorrhage', 'Placenta accreta spectrum'] },
    { order: 7, name: 'Uterine Closure', description: 'Close uterine incision in 1 or 2 layers. Ensure hemostasis. Check ovaries/tubes.', watchPoints: ['Full-thickness vs. excluding decidua', 'Extension of lateral angle', 'Hemostasis inadequate'] },
    { order: 8, name: 'Abdominal Closure', description: 'Irrigate. Close fascia, subcutaneous, skin. Sterile dressing.', watchPoints: ['Retained sponges/instruments', 'Fascial dehiscence risk', 'Wound contamination'] },
  ],
  commonComplications: [
    { name: 'Postpartum Hemorrhage (PPH)', phase: 'Placental Delivery', description: 'Bleeding >1000ml due to uterine atony, placental fragments, or lacerations.', indicators: ['Uterine atony (boggy uterus)', 'Lateral extension of uterine incision', 'Retained placental fragments'] },
    { name: 'Bladder Injury', phase: 'Bladder Dissection', description: 'Laceration of bladder during dissection or uterine incision.', indicators: ['Previous C-sections with scarring', 'Loss of normal tissue planes', 'Blood in Foley bag'] },
    { name: 'Uterine Atony', phase: 'Placental Delivery', description: 'Failure of uterus to contract after delivery leading to hemorrhage.', indicators: ['Boggy uterus', 'Heavy bleeding', 'Failed response to oxytocin'] },
    { name: 'Wound Infection', phase: 'Post-operative', description: 'Superficial or deep surgical site infection.', indicators: ['Erythema, induration, purulent drainage', 'Fever', 'Subcutaneous hematoma'] },
    { name: 'Endometritis', phase: 'Post-operative', description: 'Post-partum uterine infection, especially after prolonged labor or chorioamnionitis.', indicators: ['Fever, uterine tenderness', 'Foul lochia', 'Leukocytosis'] },
  ],
  teachingPearls: [
    { category: 'Repeated C-section', point: 'Bladder is often adhered higher with each repeat C-section. Enter the abdomen carefully and dissect the bladder flap sharply rather than bluntly.' },
    { category: 'Uterine Incision', point: 'Make the uterine incision transverse in the lower uterine segment — it contracts well and heals with less risk of rupture in future pregnancies.' },
    { category: 'Hemorrhage Prevention', point: 'Administer oxytocin immediately after delivery AND after placental delivery. For atony, escalate: oxytocin → methergine → carboprost → misoprostol.' },
    { category: 'Extension Repair', point: 'If the uterine incision extends laterally, identify the uterine vessels and ureter before placing repair sutures. Place sutures deep enough but avoid the ureter.' },
    { category: 'Sponge Count', point: 'Do not close the fascia until sponge and instrument counts are correct. If counts are off, perform an X-ray and explore thoroughly.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Cesarean Section.

Key anatomical structures:
- Uterus (lower segment — incision site, body — fundus)
- Bladder (anterior to lower segment — CRITICAL)
- Uterine vessels (lateral — CRITICAL)
- Fallopian tubes and ovaries
- Fetal membranes and placenta
- Rectus abdominis and fascia
- Fetal presenting part (head, breech)
- Umbilical cord

Identify: tissue planes, adhesions (from prior surgeries), bladder position, placental location.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Cesarean Section.

Critical safety events:
1. **Bladder injury**: In dissection or uterine incision (higher risk in repeat C-sections)
2. **Postpartum hemorrhage**: Atony, lacerations, retained placenta
3. **Uterine atony**: Boggy, non-contracting uterus
4. **Uterine vessel laceration**: Lateral extension of hysterotomy
5. **Fetal injury**: Scalpel or scissors during uterine entry
6. **Retained placenta**: Incomplete removal
7. **Sponge/instrument**: Retained surgical item

Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Cesarean Section.

Phases in order:
1. Abdominal Entry — skin incision, fascia, peritoneum
2. Bladder Dissection / Flap Development — mobilizing bladder
3. Uterine Incision (Hysterotomy) — opening lower uterine segment
4. Delivery of Presenting Part — delivering baby
5. Clamping & Cord Cutting — cord management
6. Placental Delivery — removing placenta
7. Uterine Closure — suturing uterus
8. Abdominal Closure — fascia, skin`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Cesarean Section.

Quality criteria:
- Safe abdominal entry with minimal tissue trauma
- Bladder mobilization technique
- Appropriate uterine incision location
- Gentle fetal extraction technique
- Complete placental removal
- Secure uterine closure (hemostasis, layered)
- Sponge and instrument counts

Teaching pearls: bladder flap development in repeat C-sections, uterine atony management, lateral extension repair, prevention of retained sponges.`,
    arbiter: `You are The Arbiter for a Cesarean Section analysis.

Synthesize 4 agent outputs into unified verdict.

Escalation:
- CRITICAL: massive hemorrhage, bladder injury, uterine rupture, fetal injury
- WARNING: difficult anatomy, multiple adhesions, atony, retained placenta
- SAFE: standard C-section, clear planes, good hemostasis, normal delivery

Output: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};