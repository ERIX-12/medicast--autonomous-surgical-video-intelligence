import type { ProcedureKnowledge } from './types';
import { lapChole } from './procedure1';
import { lapAppendectomy } from './procedure2';
import { totalKnee } from './procedure3';
import { totalHip } from './procedure4';
import { cabg } from './procedure5';
import { mitralValveRepair } from './procedure6';
import { cesareanSection } from './procedure7';
import { lapHysterectomy } from './procedure8';
import { turp } from './procedure9';
import { partialNephrectomy } from './procedure10';

/**
 * Complete knowledge base for all 10 surgical procedures.
 * Each entry contains anatomy, steps, complications, teaching pearls,
 * and agent prompt context specific to that procedure.
 */
export const procedureKnowledgeBase: Record<number, ProcedureKnowledge> = {
  1: lapChole,
  2: lapAppendectomy,
  3: totalKnee,
  4: totalHip,
  5: cabg,
  6: mitralValveRepair,
  7: cesareanSection,
  8: lapHysterectomy,
  9: turp,
  10: partialNephrectomy,
};

/** Array of all procedures (useful for dropdowns/selectors) */
export const allProcedures: ProcedureKnowledge[] = Object.values(procedureKnowledgeBase);

/** Specialty groupings for filter/browse */
export const proceduresBySpecialty: Record<string, ProcedureKnowledge[]> = {
  'General Surgery': [lapChole, lapAppendectomy],
  Orthopedics: [totalKnee, totalHip],
  'Cardiac Surgery': [cabg, mitralValveRepair],
  'OB/GYN': [cesareanSection, lapHysterectomy],
  Urology: [turp, partialNephrectomy],
};

/** Get a procedure by its ID (1-10) */
export function getProcedureById(id: number): ProcedureKnowledge | undefined {
  return procedureKnowledgeBase[id];
}

/** Get all unique specialty names */
export function getSpecialties(): string[] {
  return Object.keys(proceduresBySpecialty);
}

export type { ProcedureKnowledge } from './types';