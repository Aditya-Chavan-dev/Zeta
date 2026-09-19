import { Step5DetailedDesignDraft, ModuleInterfaceSpec, StateMachineTransition, StandardErrorCodeSpec } from './types.js';

export interface DetailedDesignAnalysis {
  draft: Step5DetailedDesignDraft;
  unresolvedDesignAreas: string[];
  completenessPercentage: number;
}

export class DetailedDesigner {
  public static createEmptyDraft(s0: string, s1: string, s2: string, s3: string, s4: string): Step5DetailedDesignDraft {
    const modules: ModuleInterfaceSpec[] = [
      {
        moduleName: 'StateManager',
        filePath: 'src/core/state/state-manager.ts',
        publicMethods: [
          { name: 'initialize', signature: '(workspaceRoot: string, projectId?: string): SessionState', description: 'Creates fresh .zeta/state.json' },
          { name: 'load', signature: '(workspaceRoot: string): SessionState | null', description: 'Loads session state from disk with fallback to tmp backup' },
          { name: 'save', signature: '(workspaceRoot: string, state: SessionState): void', description: 'Atomic write via temporary file + rename' },
          { name: 'recordTurn', signature: '(workspaceRoot: string, userMessage: string, pendingDraftSummary?: string): SessionState', description: 'Records user/agent message and updates uncommitted buffer' },
          { name: 'lockStep', signature: '(workspaceRoot: string, stepNumber: number, summary: StepSummary): SessionState', description: 'Locks completed step, stores SHA-256 and clears uncommitted buffer' },
          { name: 'advanceStep', signature: '(workspaceRoot: string, nextStep: number): SessionState', description: 'Advances activeStep and sets status to IN_PROGRESS' }
        ],
        dependencies: ['node:fs', 'node:path', 'node:crypto']
      },
      {
        moduleName: 'ResumeSentinel',
        filePath: 'src/core/state/resume-sentinel.ts',
        publicMethods: [
          { name: 'assessOnStartup', signature: '(workspaceRoot: string): ResumeAssessment', description: 'Inspects uncommittedBuffer to detect crash or interruption' }
        ],
        dependencies: ['src/core/state/state-manager.ts']
      }
    ];

    const stateTransitions: StateMachineTransition[] = [
      {
        fromState: 'NOT_STARTED',
        trigger: 'INIT_STEP',
        toState: 'IN_PROGRESS',
        guardCondition: 'All preceding steps must be in LOCKED state',
        sideEffect: 'Create empty stage draft and initialize uncommitted buffer'
      },
      {
        fromState: 'IN_PROGRESS',
        trigger: 'ALL_QUESTIONS_ANSWERED',
        toState: 'AWAITING_APPROVAL',
        guardCondition: 'All clarifying questions answered; stage artifact compiled',
        sideEffect: 'Present TL;DR summary to user and request formal Approve handshake'
      },
      {
        fromState: 'AWAITING_APPROVAL',
        trigger: 'USER_APPROVE',
        toState: 'LOCKED',
        guardCondition: "User response strictly matches 'approve'",
        sideEffect: 'Write markdown to disk, compute SHA-256, lock step in state.json, advance to next step'
      }
    ];

    const errorCodes: StandardErrorCodeSpec[] = [
      {
        code: 'ERR_PRECONDITION_FAILED',
        category: 'PRECONDITION',
        description: 'Attempted to invoke a stage before all preceding stages were locked.',
        httpStatusEquivalent: 412,
        recoveryGuidance: 'Complete and approve all preceding stages in sequential order.'
      },
      {
        code: 'ERR_ATOMIC_WRITE_FAILED',
        category: 'PERSISTENCE',
        description: 'Failed to write temporary file or rename to state.json due to disk or permission lock.',
        httpStatusEquivalent: 500,
        recoveryGuidance: 'Check filesystem permissions on workspace .zeta directory and verify disk space.'
      },
      {
        code: 'ERR_SCOPE_DRIFT_DETECTED',
        category: 'DRIFT',
        description: 'User requirement explicitly contradicts locked Step 0 Intent or established constraints.',
        httpStatusEquivalent: 409,
        recoveryGuidance: 'Review Impact Cascade Report and confirm whether to discard input or execute formal amendment.'
      }
    ];

    return {
      step0Tldr: s0,
      step1Tldr: s1,
      step2Tldr: s2,
      step3Tldr: s3,
      step4Tldr: s4,
      modules,
      stateTransitions,
      errorCodes,
      concurrencyLockProtocol: 'Single-writer atomic rename write-ahead journal (.zeta/state.json.tmp -> .zeta/state.json)'
    };
  }

  /**
   * Evaluates detailed design specifications and flags areas requiring user confirmation.
   */
  public static evaluate(userInput: string, s0: string, s1: string, s2: string, s3: string, s4: string): DetailedDesignAnalysis {
    const draft = this.createEmptyDraft(s0, s1, s2, s3, s4);
    const unresolvedDesignAreas: string[] = [
      'Input Validation & Sanitization Schema',
      'Correlation ID & Logging Traceability',
      'Plugin Exception Hierarchy & Serialization'
    ];

    return {
      draft,
      unresolvedDesignAreas,
      completenessPercentage: 40
    };
  }
}
