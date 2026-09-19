import { StateManager } from '../../core/state/state-manager.js';

export interface PreconditionVerificationResult {
  isValid: boolean;
  step0Tldr: string;
  step1Tldr: string;
  errorMessage?: string;
}

export class PreconditionVerifier {
  /**
   * Verifies that both Step 0 and Step 1 are locked in session state.
   */
  public static verifyPrerequisites(workspaceRoot: string): PreconditionVerificationResult {
    const state = StateManager.load(workspaceRoot);
    if (!state) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        errorMessage: 'Session state does not exist. Lifecycle must start with Step 0.'
      };
    }

    if (!state.lockedSteps.includes(0)) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        errorMessage: 'Precondition Failed: Step 0 (Problem Intent) is not LOCKED in .zeta/state.json.'
      };
    }

    if (!state.lockedSteps.includes(1)) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        errorMessage: 'Precondition Failed: Step 1 (Requirements Engineering) is not LOCKED in .zeta/state.json.'
      };
    }

    const step0Summary = state.stepSummaries['step_0'];
    const step1Summary = state.stepSummaries['step_1'];

    if (!step0Summary || !step0Summary.summary) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        errorMessage: 'Step 0 summary is missing from session state.'
      };
    }

    if (!step1Summary || !step1Summary.summary) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        errorMessage: 'Step 1 summary is missing from session state.'
      };
    }

    return {
      isValid: true,
      step0Tldr: step0Summary.summary,
      step1Tldr: step1Summary.summary
    };
  }
}
