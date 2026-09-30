export interface ClarifyingQuestionOption {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}

export interface ClarifyingQuestion {
  area?: string;
  category?: string;
  question: string;
  contextWhyNeeded?: string;
  contextWhyNeededEveryday?: string;
  top3Options: ClarifyingQuestionOption[];
  isExcludable?: boolean;
}

export interface LifecycleAgentResponse {
  step?: number;
  isLocked: boolean;
  message: string;
  question?: ClarifyingQuestion;
  documentPath?: string;
  isReadyForSignoff?: boolean;
  artifactSummary?: string;
  error?: string | boolean;
}

