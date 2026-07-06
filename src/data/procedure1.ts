import type { ProcedureKnowledge } from './types';

/**
 * Procedure 1: Laparoscopic Cholecystectomy
 * General Surgery — Gallbladder removal
 */
export const lapChole: ProcedureKnowledge = {
  procedureId: 1,
  name: 'Laparoscopic Cholecystectomy',
  specialty: 'General Surgery',
  description:
    'Minimally invasive surgical removal of the gallbladder for symptomatic gallstones, cholecystitis, or biliary dyskinesia. The procedure uses 4 small incisions and a laparoscope to visualize and dissect Calot\'s triangle.',
  estimatedDurationMin: 60,
  keyAnatomy: [
    { name: 'Gallbladder', riskLevel: 'moderate', description: 'Pear-shaped organ storing bile; target organ for removal.' },
    { name: 'Cystic Duct', riskLevel: 'critical', description: 'Connects gallbladder to common bile duct; must be clipped and divided.' },
    { name: 'Cystic Artery', riskLevel: 'critical', description: 'Blood supply to the gallbladder; must be clipped and divided.' },
    { name: 'Common Bile Duct (CBD)', riskLevel: 'critical', description: 'Drains bile from liver to duodenum; must NOT be injured (bile duct injury is a major complication).' },
    { name: 'Calot\'s Triangle', riskLevel: 'critical', description: 'Anatomical triangle bounded by cystic duct, common hepatic duct, and cystic artery; critical view of safety is achieved here.' },
    { name: 'Common Hepatic Duct', riskLevel: 'critical', description: 'Joins with cystic duct to form CBD; must be identified and preserved.' },
    { name: 'Liver (Gallbladder Fossa)', riskLevel: 'moderate', description: 'Bed from which gallbladder is dissected; bleeding can occur from liver bed.' },
    { name: 'Duodenum', riskLevel: 'moderate', description: 'First part of small intestine; lies posterior to gallbladder; can be injured during dissection.' },
    { name: 'Hepatoduodenal Ligament', riskLevel: 'high', description: 'Contains portal vein, hepatic artery, and bile ducts; careful dissection required.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Port Placement & Pneumoperitoneum', description: 'Establish CO2 pneumoperitoneum (15 mmHg). Insert 10mm umbilical port for camera, 3 additional ports under direct vision.', watchPoints: ['Entry angle', 'Bowel or vessel injury during entry', 'Insufficient pneumoperitoneum'] },
    { order: 2, name: 'Diagnostic Laparoscopy', description: 'Explore abdominal cavity. Identify gallbladder, liver, duodenum, and surrounding anatomy. Assess for adhesions or anomalies.', watchPoints: ['Biliary anomalies', 'Inflammation severity', 'Adhesions from prior surgery'] },
    { order: 3, name: 'Retraction of Gallbladder', description: 'Grasp gallbladder fundus and retract cephalad. Grasp infundibulum and retract laterally to expose Calot\'s triangle.', watchPoints: ['Tissue tearing', 'Bile leak from over-grasping', 'Proper exposure'] },
    { order: 4, name: 'Dissection of Calot\'s Triangle', description: 'Carefully dissect peritoneum over Calot\'s triangle. Identify cystic duct and cystic artery. Achieve "Critical View of Safety" — only two structures entering gallbladder.', watchPoints: ['CBD mistaken for cystic duct', 'Cystic artery injury', 'Cystic duct avulsion'] },
    { order: 5, name: 'Clipping and Division', description: 'Clip cystic duct proximally and distally, divide. Clip and divide cystic artery. Ensure clips are securely placed with clear visual confirmation.', watchPoints: ['Clip malposition', 'Cystic duct stump leak', 'Incomplete arterial hemostasis'] },
    { order: 6, name: 'Gallbladder Dissection from Liver Bed', description: 'Use electrocautery or energy device to dissect gallbladder from liver fossa. Maintain correct plane to avoid liver injury or perforation.', watchPoints: ['Liver bed bleeding', 'Gallbladder perforation with bile/bile leak', 'Deep dissection into liver parenchyma'] },
    { order: 7, name: 'Gallbladder Extraction', description: 'Place gallbladder in retrieval bag. Remove through umbilical port site. Inspect gallbladder and counts.', watchPoints: ['Gallbladder rupture during extraction', 'Lost stones', 'Port site bleeding'] },
    { order: 8, name: 'Hemostasis Check & Closure', description: 'Reduce pressure, inspect for bleeding and bile leak. Irrigate and suction. Remove ports under vision. Close fascia at 10mm+ port sites.', watchPoints: ['Missed bleeder after pressure drop', 'Bile leak from cystic duct stump', 'Port site hernia potential'] },
  ],
  commonComplications: [
    { name: 'Bile Duct Injury', phase: 'Dissection of Calot\'s Triangle', description: 'Partial or complete transection of the common bile duct — one of the most dreaded complications.', indicators: ['Structures not clearly identified', 'Anatomy distorted by inflammation', 'Bile leak noted', 'Failure to achieve Critical View of Safety'] },
    { name: 'Cystic Artery Hemorrhage', phase: 'Dissection of Calot\'s Triangle', description: 'Tear or avulsion of cystic artery causing significant bleeding.', indicators: ['Sudden bleeding in Calot\'s triangle', 'Loss of visualization', 'Hematoma formation'] },
    { name: 'Cystic Duct Stump Leak', phase: 'Clipping and Division', description: 'Incomplete sealing of the cystic duct stump leading to bile leak post-op.', indicators: ['Clip not across entire duct', 'Fragile/inflamed tissue', 'Bile staining after irrigation'] },
    { name: 'Gallbladder Perforation', phase: 'Gallbladder Dissection from Liver Bed', description: 'Tear of the gallbladder wall with spillage of bile and/or stones.', indicators: ['Bile in operative field', 'Stones visible in abdomen', 'Difficulty maintaining traction'] },
    { name: 'Liver Laceration', phase: 'Gallbladder Dissection from Liver Bed', description: 'Injury to liver parenchyma during dissection from the fossa.', indicators: ['Oozing from liver bed', 'Capsular tear', 'Bleeding not controlled by cautery'] },
    { name: 'Retained Stone', phase: 'Gallbladder Extraction', description: 'Stone(s) dropped and not retrieved during extraction.', indicators: ['Visible stone spillage', 'Difficulty closing extraction bag', 'Pre-existing perforation'] },
  ],
  teachingPearls: [
    { category: 'Critical View of Safety', point: 'The Critical View of Safety requires clearing fat and fibrous tissue from Calot\'s triangle, separating the lower third of the gallbladder from the liver bed, and confirming only two structures enter the gallbladder.' },
    { category: 'Bailout Strategy', point: 'If anatomy cannot be clearly identified (severe inflammation), convert to subtotal cholecystectomy or open — the safest surgeon knows when to convert.' },
    { category: 'Retraction Technique', point: 'Fundus-first (dome-down) approach is useful for severely inflamed gallbladders where Calot\'s triangle is obliterated.' },
    { category: 'Cystic Artery Variations', point: 'The cystic artery arises from the right hepatic artery in ~70% but can arise from the left hepatic, gastroduodenal, or superior mesenteric artery.' },
    { category: 'Bile Duct Anatomy', point: 'Always identify the cystic duct-CBD junction before clipping. The "S" sign or "C" curve of the cystic duct helps distinguish it from the CBD.' },
    { category: 'Energy Devices', point: 'Use minimal cautery near the CBD — thermal spread can cause delayed bile duct strictures even without transection.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Laparoscopic Cholecystectomy.

Key anatomical structures to identify:
- Gallbladder (fundus, body, infundibulum/Hartmann's pouch)
- Cystic duct and cystic artery within Calot's triangle
- Common bile duct, common hepatic duct
- Liver (right lobe, gallbladder fossa)
- Duodenum, hepatoduodenal ligament
- Falciform ligament, round ligament

Critical risk zones:
- CALOT'S TRIANGLE: bounded by cystic duct, common hepatic duct, cystic artery — HIGH RISK
- CYSTIC ARTERY: can be torn — HIGH RISK
- COMMON BILE DUCT: must NOT be injured — CRITICAL RISK
- Gallbladder fossa on liver: bleeding risk during dissection

For each frame, identify visible anatomical structures, note their condition, and flag any concerning findings.`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Laparoscopic Cholecystectomy.

Monitor for these safety-critical events:
1. **Bile duct injury risk**: Is the dissection too close to the common bile duct? Are the structures in Calot's triangle clearly identified?
2. **Hemorrhage**: Uncontrolled bleeding from cystic artery, liver bed, or port sites
3. **Bile leak**: Green/yellow staining indicating gallbladder perforation or bile duct injury
4. **Thermal injury**: Cautery too close to bile ducts or bowel
5. **Clip issues**: Clips not fully across duct, malpositioned, or insufficient
6. **Bowel injury**: Inadvertent injury to duodenum or colon

Assess difficulty factors: inflammation, adhesions, obesity, aberrant anatomy.
Rate safety level: GOOD / CAUTION / DANGER / CRITICAL

Flag ANY deviation from the standard surgical approach with HIGH priority.`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Laparoscopic Cholecystectomy.

The procedure has 8 phases in order:
1. Port Placement & Pneumoperitoneum — establishing access, inserting ports
2. Diagnostic Laparoscopy — exploring, identifying anatomy
3. Retraction of Gallbladder — grasping and retracting to expose Calot's triangle
4. Dissection of Calot's Triangle — clearing tissue, identifying cystic duct and artery
5. Clipping and Division — clipping and cutting cystic duct and artery
6. Gallbladder Dissection from Liver Bed — separating gallbladder from liver fossa
7. Gallbladder Extraction — placing in bag and removing
8. Hemostasis Check & Closure — final inspection, irrigation, port closure

Use visual cues: instruments visible, anatomy exposed, dissected state, clips present, etc.
If you cannot determine the phase, respond with "UNCERTAIN" and describe what you see.`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Laparoscopic Cholecystectomy.

Provide educational commentary appropriate for surgical residents:
1. Identify the current technical step and rate technique quality (EXCELLENT / GOOD / FAIR / POOR)
2. Note specific technical observations about dissection plane, tissue handling, instrument use
3. Provide a teaching pearl relevant to what is visible in the frame
4. Rate overall performance on this frame relative to standard

Teaching points to draw from:
- Critical View of Safety principles
- Safe electrocautery usage near bile ducts
- Proper retraction techniques
- Instrument selection for each phase
- Team communication best practices

Frame quality assessment criteria:
- VISIBILITY: how clear is the surgical field? (blood, smoke, fog)
- TECHNIQUE: appropriateness of instrument position and angle
- SAFETY: adherence to safe dissection principles
- PROGRESS: appropriate advancement toward procedural goals`,
    arbiter: `You are The Arbiter — the synthesis agent for a Laparoscopic Cholecystectomy analysis.

You receive outputs from 4 specialist agents (Anatomy, Safety, Phase, Education).
Your job is to synthesize them into a unified verdict.

Output format:
{
  "verdict": "SAFE" | "WARNING" | "CRITICAL",
  "summary": "One-sentence summary of the frame analysis",
  "keyFindings": ["finding1", "finding2", ...],
  "anatomyConfirmed": "Structure(s) positively identified",
  "currentPhase": "Phase name or UNCERTAIN",
  "escalationLevel": "NONE" | "WARNING" | "CRITICAL",
  "escalationReason": "Reason if escalated",
  "teachingPoint": "One brief teaching pearl relevant to this frame",
  "qualityScore": 0-100
}

Escalation rules:
- CRITICAL: bile duct injury, uncontrolled hemorrhage, bowel injury, CBD transection
- WARNING: approaching critical structure without clear identification, difficult anatomy, bleeding that is controlled, poor visibility
- SAFE: standard dissection, clear view, appropriate technique, no concerns

If ANY agent reports a critical safety issue, the verdict must reflect that.`,
  },
};
