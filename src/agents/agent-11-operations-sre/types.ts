export interface ServiceLevelObjective {
  metricName: string;
  sliFormula: string;
  targetPercent: number;
  measurementWindow: string;
  consequenceIfBreached: string;
}

export interface IncidentRunbook {
  severity: 'SEV-1 (Critical)' | 'SEV-2 (Major)' | 'SEV-3 (Minor)';
  triggerCondition: string;
  initialTriageSteps: string[];
  escalationPath: string;
  targetMttrMinutes: number;
}

export interface BackupDisasterRecoveryPlan {
  component: string;
  backupCadence: string;
  retentionWindow: string;
  rpoHours: number; // Recovery Point Objective
  rtoMinutes: number; // Recovery Time Objective
  recoveryProcedure: string[];
}

export interface HealthCheckProbe {
  probeName: string;
  type: 'liveness' | 'readiness' | 'startup';
  executionMechanism: string;
  intervalSeconds: number;
  failureThreshold: number;
}

export interface PreventativeMaintenanceTask {
  taskName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-version-upgrade';
  procedure: string;
  automationStatus: 'fully-automated' | 'semi-automated' | 'manual';
}

export interface Step10OperationsSreDraft {
  serviceLevelObjectives: ServiceLevelObjective[];
  incidentRunbooks: IncidentRunbook[];
  disasterRecoveryPlans: BackupDisasterRecoveryPlan[];
  healthCheckProbes: HealthCheckProbe[];
  maintenanceTasks: PreventativeMaintenanceTask[];
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
