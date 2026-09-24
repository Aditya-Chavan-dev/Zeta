import { ClarifyingQuestion, Step2FeasibilityDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 mitigation strategies for a specific risk area.
   */
  public static generateForRiskArea(riskArea: string, _draft: Step2FeasibilityDraft): ClarifyingQuestion {
    switch (riskArea) {
      case 'State Drift & Schema Migration Risk':
        return {
          id: 'q-risk-drift',
          riskCategory: 'State Drift & Schema Migration Risk',
          question: 'How should the system mitigate the risk of user requirements drifting away from established Step 0/1 baselines later in the project?',
          contextWhyNeeded: 'Uncontrolled drift causes architectural decay and breaks downstream assumptions.',
          top3Options: [
            {
              title: 'Conversational Drift Interceptor with Impact Cascade Report',
              description: 'Detect intent changes automatically during turns; warn the user and show all impacted stages before updating.',
              tradeOffs: 'Adds a clarification turn whenever user contradicts previous decisions; preserves architectural integrity.',
              recommended: true
            },
            {
              title: 'Hard Immutable Lock (Reject all changes to previous steps)',
              description: 'Steps cannot be amended once locked; user must restart the project from Step 0 to change requirements.',
              tradeOffs: 'Zero risk of undetected drift; causes high user frustration if requirements genuinely evolve.'
            },
            {
              title: 'Silent Auto-update of Downstream Documents',
              description: 'Silently rewrites downstream documents whenever user mentions a new requirement.',
              tradeOffs: 'High risk of silent contradictions, forgotten constraints, and cascading hallucinated code.'
            }
          ]
        };

      case 'Turn Latency & IDE Event Loop Blocking':
        return {
          id: 'q-risk-latency',
          riskCategory: 'Turn Latency & IDE Event Loop Blocking',
          question: 'How should the engine ensure that compiling governance artifacts does not freeze the IDE UI or typing experience?',
          contextWhyNeeded: 'Heavy synchronous disk operations or deep AST parsing on the main thread cause UI freezes and lag.',
          top3Options: [
            {
              title: 'Micro-turn Chunking with Non-blocking I/O (< 50ms per operation)',
              description: 'Keep state payloads small (< 50KB) and compile artifacts incrementally without blocking the main event loop.',
              tradeOffs: 'Requires strict token discipline and compact TL;DR summaries between agents.',
              recommended: true
            },
            {
              title: 'Dedicated Background Worker Process',
              description: 'Spin up a child process / worker thread for all artifact compilations and file writes.',
              tradeOffs: 'Increases architectural complexity and IPC message-passing overhead.'
            },
            {
              title: 'Batch Compilation on Explicit User Command Only',
              description: 'Only compile documents when user explicitly types /compile or /lock.',
              tradeOffs: 'User must remember manual commands; uncommitted progress remains in memory longer.'
            }
          ]
        };

      case 'Dependency & Local File Permission Failure':
      default:
        return {
          id: 'q-risk-permissions',
          riskCategory: 'Dependency & Local File Permission Failure',
          question: 'How should the system respond if the local filesystem encounters locked files or read-only workspace errors?',
          contextWhyNeeded: 'Antivirus or multi-process file locks on Windows can temporarily fail atomic file renames.',
          top3Options: [
            {
              title: 'Exponential Backoff Retry with Safe In-Memory Buffer',
              description: 'Retry atomic rename 3 times with 50ms exponential backoff; if still locked, hold in memory buffer and warn user.',
              tradeOffs: 'Adds a small fallback retry loop; prevents crashes from transient Windows file-system locks.',
              recommended: true
            },
            {
              title: 'Immediate Hard Failure with Actionable Error',
              description: 'Crash the turn immediately and print exact file path and permissions required.',
              tradeOffs: 'Fails fast, but interrupts the user workflow even on transient file access locks.'
            },
            {
              title: 'Silent Fallback to Global Temp Directory',
              description: 'Write state to OS temp directory if workspace is read-only.',
              tradeOffs: 'State gets separated from project repository and may be lost on OS cleanup.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved risk areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step2FeasibilityDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForRiskArea(area, draft));
  }
}
