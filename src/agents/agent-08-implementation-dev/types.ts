/**
 * Types and interfaces for Agent 08: Implementation & Software Construction Engineer.
 * Governs Step 7 Software Implementation, Release Candidate Assembly, and Build Verification.
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

export interface CodeArtifactManifestItem {
  path: string;
  type: 'CORE_ENGINE' | 'STAGE_AGENT' | 'GOVERNANCE' | 'TEST_SUITE' | 'DOCS';
  linesOfCode: number;
  status: 'IMPLEMENTED' | 'VERIFIED';
}

export interface TestExecutionSummary {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  suiteCount: number;
  executionDurationMs: number;
}

export interface Step7ImplementationDevDraft {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  step6Tldr: string;
  releaseCandidateTag: string;
  artifactsManifest: CodeArtifactManifestItem[];
  testSummary: TestExecutionSummary;
  buildStatus: 'SUCCESS' | 'FAILED';
  verificationLabNotes: string;
}

export interface Agent08State {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  step6Tldr: string;
  draft: Step7ImplementationDevDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
