export interface DeploymentTarget {
  name: string;
  type: 'local-binary' | 'container' | 'serverless' | 'hybrid';
  runtime: string;
  resourceLimits: {
    cpu: string;
    memory: string;
    disk: string;
  };
  isolationModel: string;
}

export interface ReleaseGate {
  id: string;
  name: string;
  criteria: string;
  automatedCheck: string;
  blockingSeverity: 'BLOCKER' | 'CRITICAL' | 'WARNING';
}

export interface RollbackProcedure {
  triggerMetric: string;
  detectionThreshold: string;
  automatedSteps: string[];
  maxRollbackDurationSeconds: number;
  dataCompensationStrategy: string;
}

export interface SmokeTestPlan {
  endpointOrCommand: string;
  expectedBehavior: string;
  timeoutMs: number;
  criticality: 'MUST_PASS' | 'OPTIONAL';
}

export interface ConfigurationSpec {
  environmentVariable: string;
  required: boolean;
  isSecret: boolean;
  purpose: string;
  fallbackOrValidation: string;
}

export interface Step9ProductionReadinessDraft {
  deploymentTargets: DeploymentTarget[];
  releaseGates: ReleaseGate[];
  rollbackProcedures: RollbackProcedure[];
  smokeTests: SmokeTestPlan[];
  configSpecs: ConfigurationSpec[];
  zeroDowntimeStrategy: string;
  monitoringAndObservability: string[];
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
