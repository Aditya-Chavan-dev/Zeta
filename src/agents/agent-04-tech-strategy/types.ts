/**
 * Types and interfaces for Agent 04: Technology Strategy & Tech-Stack Selection Architect.
 * Governs Step 3 Technology Selection, TDRs, and Top 3 Candidate evaluations.
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

export type TechCategory = 
  | 'RUNTIME_LANGUAGE'
  | 'DATA_STORAGE'
  | 'COMMUNICATION_PROTOCOL'
  | 'TESTING_FRAMEWORK'
  | 'BUILD_PACKAGING';

export interface TechnologyDecisionRecord {
  id: string; // e.g. TDR-01
  category: TechCategory;
  selectedTech: string;
  version: string;
  justification: string;
  rejectedAlternatives: string[];
  tradeOffsAccepted: string;
}

export interface StackCandidateEvaluation {
  category: TechCategory;
  candidates: [OptionChoice, OptionChoice, OptionChoice];
  selectedCandidate: string;
  decisionRationale: string;
}

export interface Step3TechStrategyDraft {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  tdrs: TechnologyDecisionRecord[];
  candidateEvaluations: StackCandidateEvaluation[];
  architectureReadinessVerdict: 'APPROVED' | 'REQUIRES_SPIKE' | 'REJECTED';
}

export interface Agent04State {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  draft: Step3TechStrategyDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
