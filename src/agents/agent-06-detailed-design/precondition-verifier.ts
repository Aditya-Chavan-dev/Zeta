import { StateManager } from '../../core/state/state-manager.js';

export interface PreconditionVerificationResult {
  isValid: boolean;
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  errorMessage?: string;
}

export class PreconditionVerifier {
  /**
   * Verifies that Steps 0, 1, 2, 3, and 4 are all locked in session state.
   */
  public static verifyPrerequisites(workspaceRoot: string): PreconditionVerificationResult {
    const state = StateManager.load(workspaceRoot);
    if (!state) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        step3Tldr: '',
        step4Tldr: '',
        errorMessage: 'Session state does not exist. Lifecycle must start at Step 0.'
      };
    }

    for (let step = 0; step <= 4; step++) {
      if (!state.lockedSteps.includes(step)) {
        return {
          isValid: false,
          step0Tldr: '',
          step1Tldr: '',
          step2Tldr: '',
          step3Tldr: '',
          step4Tldr: '',
          errorMessage: `Precondition Failed: Step ${step} is not LOCKED in .zeta/state.json.`
        };
      }
    }

    const s0 = state.stepSummaries['step_0'];
    const s1 = state.stepSummaries['step_1'];
    const s2 = state.stepSummaries['step_2'];
    const s3 = state.stepSummaries['step_3'];
    const s4 = state.stepSummaries['step_4'];

    if (!s0?.summary || !s1?.summary || !s2?.summary || !s3?.summary || !s4?.summary) {
      return {
        isValid: false,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        step3Tldr: '',
        step4Tldr: '',
        errorMessage: 'One or more upstream step summaries are missing from session state.'
      };
    }

    return {
      isValid: true,
      step0Tldr: s0.summary,
      step1Tldr: s1.summary,
      step2Tldr: s2.summary,
      step3Tldr: s3.summary,
      step4Tldr: s4.summary
    };
  }
}
