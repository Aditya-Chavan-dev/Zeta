export interface SemVerRule {
  level: 'MAJOR' | 'MINOR' | 'PATCH';
  condition: string;
  deprecationRequired: boolean;
  minDeprecationCycles: number;
}

export interface DeprecationPhase {
  phaseName: 'Announcement & Warning' | 'Soft Deprecation' | 'Hard Deprecation' | 'Complete Sunsetting & Removal';
  durationWeeks: number;
  runtimeBehavior: string;
  migrationAssistance: string;
}

export interface SchemaMigrationContract {
  fromVersion: string;
  toVersion: string;
  migrationMechanism: string;
  rollbackGuaranteed: boolean;
  dataTransformRule: string;
}

export interface ArchitecturalDriftGuardrail {
  guardrailName: string;
  enforcementMechanism: string;
  toleranceLimit: string;
  breachAction: string;
}

export interface Step12GovernanceLifecycleDraft {
  semVerRules: SemVerRule[];
  deprecationPhases: DeprecationPhase[];
  schemaMigrations: SchemaMigrationContract[];
  driftGuardrails: ArchitecturalDriftGuardrail[];
  backwardCompatibilityGuarantee: string;
  unresolvedAreas: string[];
  step0IntentTldr: string;
  step1RequirementsTldr: string;
  step2FeasibilityTldr: string;
  step3TechStrategyTldr: string;
  step4ArchitectureTldr: string;
  step5DetailedDesignTldr: string;
  step6ImplementationPlanTldr: string;
  step7ReleaseCandidateTldr: string;
  step8VerificationQaTldr: string;
  step9ProductionReadinessTldr: string;
  step10OperationsSreTldr: string;
  step11SecurityComplianceTldr: string;
}

export interface OptionChoice {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}

export interface ClarifyingQuestion {
  id: string;
  category: string;
  question: string;
  contextWhyNeeded: string;
  top3Options: OptionChoice[];
}

export interface AgentResponse {
  step: number;
  isLocked: boolean;
  message: string;
  question?: ClarifyingQuestion;
  documentPath?: string;
  isReadyForSignoff?: boolean;
  error?: boolean;
}
