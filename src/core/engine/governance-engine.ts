import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { IStateStore } from '../state/state-store.interface.js';
import { LifecycleRegistry } from '../lifecycle/lifecycle-map.js';
import { ExitCode, SessionState, AgentTurnResult } from '../state/schema.js';
import { ResponseSentinel } from '../governance/response-sentinel.js';

export interface GovernanceTurnInput {
  text: string;
  stageOverride?: number;
}

export interface ApprovalEvaluationResult {
  allowed: boolean;
  stage: number;
  reason?: string;
  violations?: string[];
}

export class GovernanceEngine {
  private store: IStateStore;

  constructor(store: IStateStore) {
    this.store = store;
  }

  public getStore(): IStateStore {
    return this.store;
  }

  /**
   * Checks if user input is an exact trimmed case-insensitive "Approve".
   */
  public static isApprovalIntent(input: string): boolean {
    return input.trim().toLowerCase() === 'approve';
  }

  /**
   * Checks if user input expresses a refusal, negative answer, or exclusion.
   * e.g. "no", "none", "skip", "neither", "don't want this", "n", "false", "no thanks", "exclude", "not needed"
   */
  public static isNegativeResponse(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return (
      /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|omit|not\s+needed|reject|do\s+not\s+include)$/i.test(trimmed) ||
      /^no[,\.\s]/i.test(trimmed)
    );
  }

  /**
   * Checks if user explicitly requests to terminate or quit ZETA governance mode.
   * Must be an explicit invocation such as "quit zeta", "exit zeta", "stop zeta".
   * Never conflates a simple "no" with quitting ZETA.
   */
  public static isExplicitQuitIntent(input: string): boolean {
    const trimmed = input.trim().toLowerCase();
    return /^(?:quit\s+zeta|exit\s+zeta|stop\s+zeta|cancel\s+zeta)$/i.test(trimmed);
  }

  /**
   * Routes any outgoing message through ResponseSentinel to guarantee:
   * 1. Active plugin badge.
   * 2. 3-act storytelling chronology.
   * 3. Max 5 items per list (ADHD).
   * 4. Ponytail zero-placeholder slop.
   * 5. End-of-turn Enterprise Term Breakdown.
   */
  public static formatOutgoingResponse(rawMessage: string, stepNumber: number = 0, stepName: string = 'Governance Stage'): string {
    const validated = ResponseSentinel.validateAndFormat(rawMessage, stepNumber, stepName);
    return validated.formattedOutput;
  }

  /**
   * Evaluates whether the active stage can be approved and locked.
   */
  public evaluateApprovalPreconditions(activeState: SessionState): ApprovalEvaluationResult {
    const stage = activeState.activeStep;
    const violations: string[] = [];

    // 1. Completed projects are read-only except through explicit amendment
    if (activeState.stepStatus === 'COMPLETED') {
      return {
        allowed: false,
        stage,
        reason: 'Project is COMPLETED and in read-only mode. Use zeta amend to modify locked stages.'
      };
    }

    // 2. Predecessor check: All predecessor stages must be locked
    const requiredPredecessors = LifecycleRegistry.getPrerequisiteStages(stage);
    for (const pred of requiredPredecessors) {
      if (!activeState.lockedSteps.includes(pred)) {
        violations.push(`Prerequisite Step ${pred} is not locked.`);
      }
    }

    // 3. Hash verification of all already locked predecessor artifacts on disk
    const integrity = this.store.verifyIntegrity();
    if (!integrity.valid) {
      violations.push(...integrity.violations);
    }

    // 4. In-flight draft must be signoff-ready and have 0 unresolved questions
    const buffer = activeState.uncommittedBuffer;
    if (buffer.unresolvedQuestions && buffer.unresolvedQuestions.length > 0) {
      violations.push(`There are ${buffer.unresolvedQuestions.length} unresolved clarifying questions.`);
    }

    if (!buffer.activeDraft) {
      violations.push('No active draft found in uncommitted state buffer.');
    }

    if (violations.length > 0) {
      return {
        allowed: false,
        stage,
        reason: 'Approval preconditions failed.',
        violations
      };
    }

    return {
      allowed: true,
      stage
    };
  }

  /**
   * Executes an approval for the active stage. Writes canonical disk artifact and locks stage.
   */
  public async executeApproval(
    artifactCompiler: (draft: unknown) => { fullDocument: string; tldrSummary: string }
  ): Promise<AgentTurnResult> {
    const state = this.store.loadState();
    if (!state) {
      return {
        success: false,
        exitCode: ExitCode.LOCK_OR_CORRUPTION,
        stage: 0,
        message: 'Cannot approve: session state is uninitialized.',
        isReadyForSignoff: false,
        isLocked: false,
        error: 'Uninitialized state'
      };
    }

    const evaluation = this.evaluateApprovalPreconditions(state);
    if (!evaluation.allowed) {
      return {
        success: false,
        exitCode: ExitCode.BLOCKED_APPROVAL,
        stage: state.activeStep,
        message: `Approval blocked for Step ${state.activeStep}:\n${(evaluation.violations || [evaluation.reason]).join('\n')}`,
        isReadyForSignoff: false,
        isLocked: false,
        error: evaluation.reason
      };
    }

    const stageDef = LifecycleRegistry.getStage(state.activeStep);
    const draft = state.uncommittedBuffer.activeDraft;

    // Compile canonical document
    const compiled = artifactCompiler(draft);

    // Write canonical docs/*.md file
    const fullDocPath = path.join(this.store.workspaceRoot, stageDef.documentPath);
    const docDir = path.dirname(fullDocPath);
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }
    fs.writeFileSync(fullDocPath, compiled.fullDocument, 'utf8');

    // Compute SHA256
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');

    // Lock step in store
    this.store.lockStep(
      state.activeStep,
      {
        stepNumber: state.activeStep,
        stepName: stageDef.agentName,
        artifactPath: stageDef.documentPath,
        lockedAt: new Date().toISOString(),
        summary: compiled.tldrSummary,
        artifactSha256: sha256
      },
      compiled.fullDocument
    );

    // If not final stage, advance to next step
    if (!LifecycleRegistry.isLastStage(state.activeStep)) {
      this.store.advanceStep(state.activeStep + 1);
    }

    const rawConfirmation = `Step ${state.activeStep} (${stageDef.agentName}) is now LOCKED.\nAuthoritative artifact written to ${stageDef.documentPath}.\n${LifecycleRegistry.isLastStage(state.activeStep) ? 'Project is now COMPLETED.' : `Advanced to Step ${state.activeStep + 1}.`}`;
    const formattedMessage = ResponseSentinel.validateAndFormat(rawConfirmation, state.activeStep, stageDef.agentName).formattedOutput;

    return {
      success: true,
      exitCode: ExitCode.SUCCESS,
      stage: state.activeStep,
      message: formattedMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: stageDef.documentPath
    };
  }

  /**
   * Rolls back downstream stages for an amendment.
   */
  public rollbackForAmendment(targetStage: number, reason: string): SessionState {
    const state = this.store.loadState();
    if (!state) {
      throw new Error('Cannot amend: session state uninitialized.');
    }

    if (targetStage < 0 || targetStage > 14) {
      throw new Error(`Invalid stage number for amendment: ${targetStage}`);
    }

    // Invalidate targetStage and all subsequent locked steps
    const newLockedSteps = state.lockedSteps.filter(s => s < targetStage);
    const newSummaries: Record<string, any> = {};
    for (const [key, val] of Object.entries(state.stepSummaries)) {
      if (val.stepNumber < targetStage) {
        newSummaries[key] = val;
      }
    }

    state.activeStep = targetStage;
    state.stepStatus = 'IN_PROGRESS';
    state.lockedSteps = newLockedSteps;
    state.stepSummaries = newSummaries;
    state.uncommittedBuffer = {};
    state.lastTurnTimestamp = new Date().toISOString();

    this.store.saveState(state);
    this.store.recordAudit({
      eventType: 'STAGE_AMENDED',
      stepNumber: targetStage,
      actor: 'user',
      details: `Amended Step ${targetStage}: ${reason}`
    });

    return state;
  }
}
