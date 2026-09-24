import { AgentTurnResult } from '../../core/state/schema.js';

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

export interface AgentTurnContext<TDraft = unknown> {
  workspaceRoot: string;
  userInput: string;
  activeDraft?: TDraft;
  unresolvedQuestions?: unknown[];
  recordedEvidence?: Record<string, string>;
}

export interface LifecycleAgent<TDraft = unknown, TOutput = unknown> {
  readonly stage: number; // 0 to 14
  readonly name: string;
  readonly primaryArtifact: string;
  readonly requiresEvidence?: boolean;

  validateDraft?(data: unknown): TDraft;
  handleTurn?(userInput: string, draft?: TDraft): Promise<LifecycleAgentResponse> | LifecycleAgentResponse;
  executeTurn?(context: AgentTurnContext<TDraft>): Promise<AgentTurnResult<TOutput>>;
  compileArtifact?(draft: TDraft): { fullDocument: string; tldrSummary: string } | string;
}
