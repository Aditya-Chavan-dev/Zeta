/**
 * Types and interfaces for Agent 07: Implementation Planning & Engineering Work Breakdown Architect.
 * Governs Step 6 Implementation Planning, WBS, Task Matrix, DoR/DoD, and Critical Path Sequencing.
 */

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
  top3Options: [OptionChoice, OptionChoice, OptionChoice];
}

export interface WbsTask {
  id: string; // e.g. TASK-01
  title: string;
  phase: string;
  estimatedHours: number;
  dependencies: string[];
  definitionOfReady: string;
  definitionOfDone: string;
}

export interface QualityGateRule {
  gateName: string;
  triggerPoint: string;
  mandatoryChecks: string[];
  passThreshold: string;
}

export interface Step6ImplementationPlanDraft {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  sequencingStrategy: string;
  tasks: WbsTask[];
  qualityGates: QualityGateRule[];
  criticalPath: string[];
}

export interface Agent07State {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  draft: Step6ImplementationPlanDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
