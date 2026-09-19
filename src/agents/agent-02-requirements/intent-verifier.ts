import { StateManager } from '../../core/state/state-manager.js';
import { SessionState } from '../../core/state/types.js';

export interface IntentVerificationResult {
  isValid: boolean;
  step0Tldr: string;
  errorMessage?: string;
  scopeViolations?: string[];
}

export class IntentVerifier {
  /**
   * Verifies that Step 0 is locked and loads its TL;DR baseline.
   */
  public static verifyStep0Locked(workspaceRoot: string): IntentVerificationResult {
    const state = StateManager.load(workspaceRoot);
    if (!state) {
      return {
        isValid: false,
        step0Tldr: '',
        errorMessage: 'Session state does not exist. Step 0 must be executed first.'
      };
    }

    if (!state.lockedSteps.includes(0)) {
      return {
        isValid: false,
        step0Tldr: '',
        errorMessage: 'Precondition Failed: Step 0 (Problem Intent) is not LOCKED in .zeta/state.json.'
      };
    }

    const step0Summary = state.stepSummaries['step_0'];
    if (!step0Summary || !step0Summary.summary) {
      return {
        isValid: false,
        step0Tldr: '',
        errorMessage: 'Step 0 summary is missing from session state.'
      };
    }

    return {
      isValid: true,
      step0Tldr: step0Summary.summary
    };
  }

  /**
   * Checks incoming requirement input against out-of-scope intent boundaries.
   */
  public static checkScopeDrift(requirementText: string, step0Tldr: string): string[] {
    const violations: string[] = [];
    const text = requirementText.toLowerCase();

    // Check against standard out-of-scope boundaries defined in Step 0
    if (text.includes('legacy') && (text.includes('reverse-engineer') || text.includes('modernize existing codebase'))) {
      violations.push('Scope Drift: Legacy codebase reverse-engineering is explicitly OUT-OF-SCOPE for Greenfield V1.');
    }

    if (text.includes('cloud daemon') || text.includes('external server background process')) {
      violations.push('Scope Drift: External cloud daemon dependencies violate the local-first zero-daemon constraint.');
    }

    return violations;
  }
}
