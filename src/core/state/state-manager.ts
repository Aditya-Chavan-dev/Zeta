import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SessionState, StepSummary } from './types.js';

export class StateManager {
  public static readonly STATE_DIR = '.zeta';
  public static readonly STATE_FILE = 'state.json';
  public static readonly CURRENT_VERSION = 1;
  public static readonly CURRENT_TOOL_VERSION = '1.1.0';
  public static readonly CURRENT_CHANGELOG = [
    '3-Round Idea Clarification & 3-Round Blind Spots hardening in Step 0',
    'Comprehensive negative response ("No") handling: excludes features rather than auto-selecting',
    'Dynamic mid-session version upgrading with opt-out rollback preservation'
  ];

  public static getStatePath(workspaceRoot: string): string {
    return path.join(workspaceRoot, this.STATE_DIR, this.STATE_FILE);
  }

  /**
   * Initializes a fresh session state for a greenfield project.
   */
  public static initialize(workspaceRoot: string, projectId?: string): SessionState {
    const state: SessionState = {
      version: this.CURRENT_VERSION,
      toolVersion: this.CURRENT_TOOL_VERSION,
      stayOnOldVersion: false,
      tone: 'builder',
      projectId: projectId || `proj_${crypto.randomBytes(4).toString('hex')}`,
      activeStep: 0,
      stepStatus: 'IN_PROGRESS',
      turnCount: 0,
      lastTurnTimestamp: new Date().toISOString(),
      lockedSteps: [],
      stepSummaries: {},
      uncommittedBuffer: {}
    };

    this.save(workspaceRoot, state);
    return state;
  }

  /**
   * Sets the language and communication tone for the workspace ('builder' or 'enterprise').
   */
  public static setTone(workspaceRoot: string, tone: 'builder' | 'enterprise'): SessionState {
    const state = this.load(workspaceRoot);
    if (!state) {
      throw new Error('No state found to update tone');
    }
    state.tone = tone;
    this.save(workspaceRoot, state);
    return state;
  }

  /**
   * Loads the current state, returning null if no state exists yet.
   */
  public static load(workspaceRoot: string): SessionState | null {
    const statePath = this.getStatePath(workspaceRoot);
    if (!fs.existsSync(statePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(raw) as SessionState;
    } catch (err) {
      // If corrupted or empty, attempt to read backup tmp file if present
      const tmpPath = `${statePath}.tmp`;
      if (fs.existsSync(tmpPath)) {
        try {
          const rawTmp = fs.readFileSync(tmpPath, 'utf8');
          return JSON.parse(rawTmp) as SessionState;
        } catch {}
      }
      throw new Error(`Failed to load session state at ${statePath}: ${err}`);
    }
  }

  /**
   * Atomically saves the state using a process-unique temp file + rename to prevent corruption and concurrency collisions.
   */
  public static save(workspaceRoot: string, state: SessionState): void {
    const stateDir = path.join(workspaceRoot, this.STATE_DIR);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const statePath = this.getStatePath(workspaceRoot);
    const uniqueSuffix = `${process.pid}_${crypto.randomBytes(4).toString('hex')}`;
    const tmpPath = `${statePath}.${uniqueSuffix}.tmp`;

    state.lastTurnTimestamp = new Date().toISOString();
    const payload = JSON.stringify(state, null, 2);

    // Atomic write: write to unique process-safe temp file then rename
    fs.writeFileSync(tmpPath, payload, 'utf8');

    let retries = 5;
    while (retries > 0) {
      try {
        fs.renameSync(tmpPath, statePath);
        return;
      } catch (err: any) {
        if ((err?.code === 'EPERM' || err?.code === 'EBUSY') && retries > 1) {
          retries--;
          try {
            fs.copyFileSync(tmpPath, statePath);
            fs.unlinkSync(tmpPath);
            return;
          } catch {
            continue;
          }
        }
        try {
          fs.copyFileSync(tmpPath, statePath);
          fs.unlinkSync(tmpPath);
          return;
        } catch {
          try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch {}
          throw err;
        }
      }
    }
  }

  /**
   * Records a user/agent turn, updating turn count, uncommitted buffer, and structured in-flight draft.
   */
  public static recordTurn(
    workspaceRoot: string,
    userMessage: string,
    pendingDraftSummary?: string,
    activeDraft?: any,
    unresolvedQuestions?: any[]
  ): SessionState {
    let state = this.load(workspaceRoot);
    if (!state) {
      state = this.initialize(workspaceRoot);
    }

    state.turnCount += 1;
    state.uncommittedBuffer = {
      lastUserMessage: userMessage,
      pendingDraftSummary,
      activeDraft,
      unresolvedQuestions,
      interruptedAt: new Date().toISOString()
    };

    this.save(workspaceRoot, state);
    return state;
  }

  /**
   * Locks a completed step, validating sequential prerequisites and updating the step summary.
   */
  public static lockStep(
    workspaceRoot: string,
    stepNumber: number,
    summary: StepSummary
  ): SessionState {
    const state = this.load(workspaceRoot);
    if (!state) {
      throw new Error('Cannot lock step: session state does not exist.');
    }

    if (stepNumber === state.activeStep + 1 && state.lockedSteps.includes(state.activeStep)) {
      state.activeStep = stepNumber;
    } else if (stepNumber !== state.activeStep) {
      throw new Error(`Invalid stage lock: cannot lock Step ${stepNumber} when active stage is Step ${state.activeStep}.`);
    }

    for (let i = 0; i < stepNumber; i++) {
      if (!state.lockedSteps.includes(i)) {
        throw new Error(`Sequential gating violation: Prerequisite Step ${i} is not locked.`);
      }
    }

    if (!state.lockedSteps.includes(stepNumber)) {
      state.lockedSteps.push(stepNumber);
      state.lockedSteps.sort((a, b) => a - b);
    }

    state.stepSummaries[`step_${stepNumber}`] = summary;
    state.stepStatus = stepNumber === 14 ? 'COMPLETED' : 'LOCKED';
    state.uncommittedBuffer = {};

    this.save(workspaceRoot, state);
    return state;
  }

  /**
   * Advances to the next step sequentially and sets status to IN_PROGRESS.
   */
  public static advanceStep(workspaceRoot: string, nextStep: number): SessionState {
    const state = this.load(workspaceRoot);
    if (!state) {
      throw new Error('Cannot advance step: session state does not exist.');
    }

    if (!state.lockedSteps.includes(state.activeStep)) {
      throw new Error(`Cannot advance to Step ${nextStep}: Current Step ${state.activeStep} is not locked.`);
    }

    if (nextStep !== state.activeStep + 1) {
      throw new Error(`Sequential gating violation: Cannot jump from Step ${state.activeStep} to Step ${nextStep}. Must advance sequentially to Step ${state.activeStep + 1}.`);
    }

    state.activeStep = nextStep;
    state.stepStatus = 'IN_PROGRESS';
    state.uncommittedBuffer = {};

    this.save(workspaceRoot, state);
    return state;
  }

  /**
   * Cryptographically verifies that all approved markdown specifications on disk match recorded SHA-256 digests.
   */
  public static verifyIntegrity(workspaceRoot: string): { valid: boolean; violations: string[] } {
    const state = this.load(workspaceRoot);
    if (!state) return { valid: true, violations: [] };

    const violations: string[] = [];
    for (const [stepKey, summary] of Object.entries(state.stepSummaries)) {
      const fullPath = path.join(workspaceRoot, summary.artifactPath);
      if (!fs.existsSync(fullPath)) {
        violations.push(`Missing approved specification for ${stepKey}: ${summary.artifactPath}`);
        continue;
      }
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const normalizedContent = content.replace(/\r\n/g, '\n');
        const actualHash = crypto.createHash('sha256').update(normalizedContent).digest('hex');
        if (actualHash !== summary.artifactSha256) {
          violations.push(`Cryptographic tamper detected for ${stepKey} (${summary.artifactPath}): Expected ${summary.artifactSha256}, found ${actualHash}`);
        }
      } catch (err: any) {
        violations.push(`Failed to read specification for ${stepKey} (${summary.artifactPath}): ${err?.message}`);
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Checks if the tool has been updated compared to the project's session state.
   */
  public static checkVersionUpdate(state: SessionState): {
    hasUpdate: boolean;
    currentVersion: string;
    newVersion: string;
    changelog: string[];
  } {
    const currentVersion = state.toolVersion || '1.0.0';
    const newVersion = this.CURRENT_TOOL_VERSION;
    const hasUpdate = !state.stayOnOldVersion && currentVersion !== newVersion;
    return {
      hasUpdate,
      currentVersion,
      newVersion,
      changelog: this.CURRENT_CHANGELOG
    };
  }

  /**
   * Applies the user's decision on a mid-session tool update.
   */
  public static applyVersionChoice(workspaceRoot: string, upgrade: boolean): SessionState {
    const state = this.load(workspaceRoot);
    if (!state) throw new Error('Cannot apply version choice: state does not exist.');
    if (upgrade) {
      state.toolVersion = this.CURRENT_TOOL_VERSION;
      state.stayOnOldVersion = false;
    } else {
      state.stayOnOldVersion = true;
    }
    this.save(workspaceRoot, state);
    return state;
  }
}
