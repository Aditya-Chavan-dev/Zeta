export interface EngineeringWin {
  category: string;
  achievement: string;
  impactMetric: string;
}

export interface LessonLearned {
  lifecycleStage: string;
  challengeEncountered: string;
  architecturalResolution: string;
  futureGuidance: string;
}

export interface ContinuousImprovementAction {
  id: string;
  actionItem: string;
  targetHorizon: 'Immediate (Next Sprint)' | 'Medium-Term (Next Minor Release)' | 'Long-Term (Next Major Release)';
  ownerRole: string;
  successMeasure: string;
}

export interface LifecycleFidelityMetric {
  domain: string;
  intendedInvariant: string;
  deliveredResult: string;
  adherenceScore: number; // 0-100%
}

export interface Step14RetrospectiveDraft {
  engineeringWins: EngineeringWin[];
  lessonsLearned: LessonLearned[];
  continuousImprovementActions: ContinuousImprovementAction[];
  fidelityMetrics: LifecycleFidelityMetric[];
  techDebtBudgetPercent: number;
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
  step13KnowledgeTransferTldr: string;
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
  projectCompleted?: boolean;
}
