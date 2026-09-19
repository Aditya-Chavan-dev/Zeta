import { AgentTurnResult } from '../../core/state/schema.js';

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

  /**
   * Validates and parses the draft against the stage-specific schema.
   */
  validateDraft(data: unknown): TDraft;

  /**
   * Processes a turn, asking clarifying questions or generating a signoff-ready draft.
   * NOTE: Agents DO NOT approve or advance stages; only GovernanceEngine may approve.
   */
  executeTurn(context: AgentTurnContext<TDraft>): Promise<AgentTurnResult<TOutput>>;

  /**
   * Compiles the authoritative artifact for this stage.
   */
  compileArtifact(draft: TDraft): { fullDocument: string; tldrSummary: string };
}
