import { StateManager } from '../../core/state/state-manager.js';

export interface PreconditionVerificationResult {
  isValid: boolean;
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  errorMessage?: string;
}

export class PreconditionVerifier {
  /**
   * Verifies that Steps 0, 1, and 2 are all locked in session state.
   */
  public static verifyPrerequisites(workspaceRoot: string): PreconditionVerificationResult {
    const state = StateManager.load(workspaceRoot);
    if (!state) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        errorMessage: 'Session state does not exist. Lifecycle must begin at Step 0.'
      };
    }

    if (!state.lockedSteps.includes(0)) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        errorMessage: 'Precondition Failed: Step 0 (Problem Intent) is not LOCKED in .zeta/state.json.'
      };
    }

    if (!state.lockedSteps.includes(1)) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        errorMessage: 'Precondition Failed: Step 1 (Requirements Specification) is not LOCKED in .zeta/state.json.'
      };
    }

    if (!state.lockedSteps.includes(2)) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        errorMessage: 'Precondition Failed: Step 2 (Feasibility & Risk Assessment) is not LOCKED in .zeta/state.json.'
      };
    }

    const s0 = state.stepSummaries['step_0'];
    const s1 = state.stepSummaries['step_1'];
    const s2 = state.stepSummaries['step_2'];

    if (!s0?.summary || !s1?.summary || !s2?.summary) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        errorMessage: 'One or more upstream step summaries are missing from session state.'
      };
    }

    return {
      isValid: true,
      step0Tldr: s0.summary,
      step1Tldr: s1.summary,
      step2Tldr: s2.summary
    };
  }
}
