export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  contextStep: number;
  decisionOutcome: string;
  tradeOffAccepted: string;
}

export interface OnboardingMilestone {
  timeframe: 'Hour 1 (Setup)' | 'Day 1 (First Build & Run)' | 'Week 1 (Independent Contribution)';
  objective: string;
  verificationStep: string;
  expectedDurationMinutes: number;
}

export interface QuickstartGuide {
  title: string;
  prerequisites: string[];
  terminalCommands: string[];
  expectedOutput: string;
}

export interface TroubleshootingEntry {
  symptom: string;
  probableCause: string;
  remediationCommand: string;
}

export interface Step13KnowledgeTransferDraft {
  adrIndex: ArchitectureDecisionRecord[];
  onboardingMilestones: OnboardingMilestone[];
  quickstartGuides: QuickstartGuide[];
  troubleshootingCatalog: TroubleshootingEntry[];
  docFreshnessCadence: string;
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
  step12GovernanceLifecycleTldr: string;
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
