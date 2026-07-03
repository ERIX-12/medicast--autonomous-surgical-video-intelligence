/** Risk level for anatomical structures */
export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

/** Anatomical structure in a procedure */
export interface AnatomyEntry {
  name: string;
  riskLevel: RiskLevel;
  description: string;
}

/** A phase/step in the surgical procedure */
export interface SurgicalStep {
  order: number;
  name: string;
  description: string;
  /** Key things the agents should watch for during this phase */
  watchPoints: string[];
}

/** A common complication and what to look for */
export interface Complication {
  name: string;
  phase: string;
  description: string;
  indicators: string[];
}

/** Teaching pearl for residents */
export interface TeachingPearl {
  category: string;
  point: string;
}

/**
 * Agent system prompt fragments specific to this procedure.
 * Each is a string that gets concatenated into the full system prompt
 * for that agent when analyzing frames from this procedure.
 */
export interface ProcedurePromptContext {
  anatomyAgent: string;
  safetyAgent: string;
  phaseAgent: string;
  educationAgent: string;
  arbiter: string;
}

/** Full knowledge base entry for a single procedure */
export interface ProcedureKnowledge {
  /** Numeric ID 1-10 */
  procedureId: number;
  /** Display name */
  name: string;
  /** Medical specialty */
  specialty: string;
  /** Detailed description of the procedure */
  description: string;
  /** Anatomical structures with risk levels */
  keyAnatomy: AnatomyEntry[];
  /** Ordered surgical phases */
  surgicalSteps: SurgicalStep[];
  /** Common complications */
  commonComplications: Complication[];
  /** Teaching pearls for residents */
  teachingPearls: TeachingPearl[];
  /** Agent prompt context fragments */
  promptContext: ProcedurePromptContext;
  /** Estimated duration in minutes */
  estimatedDurationMin: number;
}
