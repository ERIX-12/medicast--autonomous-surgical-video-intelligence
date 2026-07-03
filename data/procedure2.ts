import type { ProcedureKnowledge } from './types';

/**
 * Procedure 2: Laparoscopic Appendectomy
 * General Surgery — Appendix removal
 */
export const lapAppendectomy: ProcedureKnowledge = {
  procedureId: 2,
  name: 'Laparoscopic Appendectomy',
  specialty: 'General Surgery',
  description:
    'Minimally invasive removal of the appendix for acute appendicitis. A common emergency procedure typically performed through 3 ports with visualization of the right lower quadrant.',
  estimatedDurationMin: 40,
  keyAnatomy: [
    { name: 'Appendix', riskLevel: 'moderate', description: 'Vermiform appendix attached to cecum; target organ for removal.' },
    { name: 'Cecum', riskLevel: 'moderate', description: 'Proximal portion of the ascending colon; appendix base attaches here.' },
    { name: 'Mesoappendix', riskLevel: 'high', description: 'Mesentery of the appendix containing the appendicular artery; must be divided.' },
    { name: 'Appendicular Artery', riskLevel: 'high', description: 'Branch of ileocolic artery supplying appendix; can cause significant bleeding.' },
    { name: 'Ileocolic Vessels', riskLevel: 'high', description: 'Vascular supply to ileocecal region; must be identified during mesoappendix division.' },
    { name: 'Terminal Ileum', riskLevel: 'moderate', description: 'Last portion of small intestine; can be confused with appendix.' },
    { name: 'Right Ureter', riskLevel: 'critical', description: 'Retroperitoneal structure; can be injured if dissection extends too deep.' },
    { name: 'Ovarian Vessels (female) / Gonadal Vessels', riskLevel: 'high', description: 'Lie posteriorly; can be injured during retrocecal dissection.' },
  ],
  surgicalSteps: [
    { order: 1, name: 'Port Placement', description: 'Establish pneumoperitoneum. Place 10mm umbilical camera port, 5mm left lower quadrant and suprapubic working ports.', watchPoints: ['Veress needle injuries', 'Insufficient port triangulation'] },
    { order: 2, name: 'Diagnostic Laparoscopy', description: 'Explore abdominal cavity. Identify appendix, cecum, terminal ileum. Confirm diagnosis of appendicitis. Rule out other pathology.', watchPoints: ['Normal appendix with other pathology', 'Retrocecal appendix position', 'Perforation with localized abscess'] },
    { order: 3, name: 'Mobilization & Exposure', description: 'Retract cecum medially. Expose appendix by releasing adhesions. Divide any lateral peritoneal attachments.', watchPoints: ['Bowel injury during retraction', 'Retrocecal appendix requiring mobilization', 'Adhesions from prior surgery'] },
    { order: 4, name: 'Division of Mesoappendix', description: 'Create window in mesoappendix at base of appendix. Divide mesoappendix using energy device or clips, controlling the appendicular artery.', watchPoints: ['Appendicular artery hemorrhage', 'Mesenteric injury', 'Window placement too close to cecum'] },
    { order: 5, name: 'Ligation & Division of Appendix Base', description: 'Secure appendix base with 2 endoloops (or clips). Leave 5mm distal cuff. Divide appendix between ligatures.', watchPoints: ['Incomplete ligation causing stump leak', 'Base too close to cecum', 'Fecal spillage from cut end'] },
    { order: 6, name: 'Appendix Extraction', description: 'Place appendix in retrieval bag. Remove through umbilical port. Inspect stump for hemostasis.', watchPoints: ['Appendix rupture during extraction', 'Lost in abdominal cavity', 'Port site contamination'] },
    { order: 7, name: 'Irrigation & Hemostasis', description: 'Irrigate right lower quadrant. Suction fluid. Confirm hemostasis at mesenteric stump and port sites.', watchPoints: ['Abscess cavity requiring drainage', 'Retained purulent fluid', 'Bleeding from port sites'] },
    { order: 8, name: 'Port Closure', description: 'Remove ports under vision. Close 10mm+ port site fascia.', watchPoints: ['Port site bleeding', 'Fascial dehiscence risk'] },
  ],
  commonComplications: [
    { name: 'Stump Leak', phase: 'Ligation & Division', description: 'Leak from the appendiceal stump due to insecure ligation.', indicators: ['Inadequate tissue on distal side of ligature', 'Friable/edematous base', 'Clip or loop migration'] },
    { name: 'Appendicular Artery Hemorrhage', phase: 'Division of Mesoappendix', description: 'Bleeding from the appendicular artery or its branches.', indicators: ['Sudden bleeding in mesoappendix', 'Hematoma forming in mesentery', 'Poor visualization'] },
    { name: 'Intra-abdominal Abscess', phase: 'Post-operative', description: 'Abscess formation in the right lower quadrant or pelvis.', indicators: ['Purulent fluid in operative field', 'Retained foreign body', 'Incomplete irrigation'] },
    { name: 'Cecal Injury', phase: 'Mobilization', description: 'Inadvertent thermal or traction injury to the cecum.', indicators: ['Cecal serosal tear', 'Thermal blanching', 'Focal necrosis from cautery'] },
  ],
  teachingPearls: [
    { category: 'Exposure', point: 'Retract the cecum medially to expose the appendix and its mesentery. Trendelenburg with left tilt helps keep small bowel out of the field.' },
    { category: 'Retrocecal Appendix', point: 'If the appendix is not immediately visible, it is likely retrocecal — mobilize the cecum by dividing lateral peritoneal attachments.' },
    { category: 'Base Ligation', point: 'Always visualize the junction of the appendix base with the cecum before ligating. Leave a 5mm cuff to prevent stump leak.' },
    { category: 'Stump Management', point: 'In severe inflammation at the base, consider stapled transection across the cecal base rather than endoloops.' },
    { category: 'Mesoappendix Division', point: 'Create a window in the mesoappendix close to the appendix wall to avoid the ileocolic vessels.' },
  ],
  promptContext: {
    anatomyAgent: `You are the Anatomy Recognition Agent analyzing frames from a Laparoscopic Appendectomy.

Key anatomical structures to identify:
- Appendix (inflamed, normal, retrocecal position)
- Cecum (identify the base where appendix attaches)
- Mesoappendix (mesentery containing the appendicular artery)
- Terminal ileum (can be confused with appendix)
- Right ureter (retroperitoneal — CRITICAL to avoid)
- Ileocolic vessels (vascular supply)

For each frame:
1. Identify all visible structures
2. Note the appendix condition (inflamed? perforated? edematous?)
3. Flag any proximity to critical retroperitoneal structures`,
    safetyAgent: `You are the Safety Monitor Agent analyzing frames from a Laparoscopic Appendectomy.

Monitor for these safety-critical events:
1. **Appendicular artery hemorrhage**: Uncontrolled bleeding during mesoappendix division
2. **Cecal/base injury**: Thermal or traumatic injury at the base
3. **Stump leak risk**: Incomplete ligation, friable tissue at base
4. **Retroperitoneal injury**: Deep dissection near ureter or vessels
5. **Fecal spillage**: Ruptured appendix with contamination
6. **Abscess**: Localated purulent fluid collections

Rate difficulty: inflammation severity, retrocecal position, perforation present
Safety level: GOOD / CAUTION / DANGER / CRITICAL`,
    phaseAgent: `You are the Phase Detection Agent analyzing frames from a Laparoscopic Appendectomy.

The procedure has 8 phases in order:
1. Port Placement — establishing access
2. Diagnostic Laparoscopy — exploring abdomen, identifying appendix
3. Mobilization & Exposure — releasing adhesions, exposing appendix
4. Division of Mesoappendix — creating window, dividing with energy
5. Ligation & Division of Appendix Base — loops/clips, cutting
6. Appendix Extraction — placing in bag, removing
7. Irrigation & Hemostasis — cleaning field, securing bleeding
8. Port Closure — removing ports, closing fascia`,
    educationAgent: `You are the Quality Assessment & Education Agent analyzing frames from a Laparoscopic Appendectomy.

Educational points:
- Safe entry techniques for emergency surgery
- Retrocecal appendix mobilization techniques
- Mesoappendix dissection and vessel control
- Stump management options (loops vs. clips vs. stapler)
- Contamination management and irrigation strategy`,
    arbiter: `You are The Arbiter for a Laparoscopic Appendectomy analysis.

Synthesize the 4 agent outputs into a unified verdict.

Escalation rules:
- CRITICAL: vascular injury, cecal injury, unrecognized perforation, retroperitoneal injury
- WARNING: difficult anatomy, controlled bleeding, severe inflammation, abscess
- SAFE: routine dissection, clear anatomy, controlled technique

Output must include: verdict, summary, keyFindings, anatomyConfirmed, currentPhase, escalationLevel, escalationReason, teachingPoint, qualityScore.`,
  },
};
