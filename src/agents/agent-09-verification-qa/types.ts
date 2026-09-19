/**
 * Types and interfaces for Agent 09: Verification, Validation & Quality Assurance Architect.
 * Governs Step 8 Quality Assurance, Adversarial Audit, Requirements Traceability, and Binding QA Verdict.
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

export type QaVerdict = 'PASS' | 'CONDITIONAL_PASS' | 'REWORK_REQUIRED' | 'NO_GO';

export interface QaAuditDimension {
  dimensionName: string;
  scope: string;
  status: 'VERIFIED' | 'NEEDS_ATTENTION' | 'FAILED';
  evidence: string;
}

export interface TraceabilityVerificationItem {
  id: string; // e.g. TRACE-01
  requirementId: string; // e.g. FR-01 / NFR-01
  specSource: string;
  implementedModule: string;
  verifiedTestFile: string;
  auditStatus: 'VERIFIED_CLOSED' | 'OPEN';
}

export interface Step8VerificationQaDraft {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  step6Tldr: string;
  step7Tldr: string;
  qaVerdict: QaVerdict;
  auditDimensions: QaAuditDimension[];
  traceabilityMatrix: TraceabilityVerificationItem[];
  chaosTestEvidence: string;
  qualityGateNotes: string;
}

export interface Agent09State {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  step6Tldr: string;
  step7Tldr: string;
  draft: Step8VerificationQaDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
