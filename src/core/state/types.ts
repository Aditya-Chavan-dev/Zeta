/**
 * Core state interfaces for the Autonomous Governance Plugin.
 * Enables atomic, per-turn persistence and seamless interruption recovery.
 */

export type StepNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type StepStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'LOCKED';

export interface UncommittedBuffer {
  lastUserMessage?: string;
  pendingDraftSummary?: string;
  activeDraft?: any;
  unresolvedQuestions?: any[];
  interruptedAt?: string;
}

export interface StepSummary {
  stepNumber: number;
  stepName: string;
  artifactPath: string;
  lockedAt: string;
  summary: string;
  artifactSha256: string;
}

export interface SessionState {
  version: number;
  projectId: string;
  activeStep: number;
  stepStatus: StepStatus;
  turnCount: number;
  lastTurnTimestamp: string;
  lockedSteps: number[];
  stepSummaries: Record<string, StepSummary>;
  uncommittedBuffer: UncommittedBuffer;
  toolVersion?: string;
  stayOnOldVersion?: boolean;
}

export interface ResumeAssessment {
  state: SessionState;
  isInterrupted: boolean;
  resumptionGreeting: string;
  integrityViolations?: string[];
}
