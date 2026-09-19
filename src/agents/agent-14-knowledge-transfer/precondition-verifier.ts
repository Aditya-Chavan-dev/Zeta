import { StateManager } from '../../core/state/state-manager.js';

export interface PreconditionCheckResult {
  isValid: boolean;
  missingSteps: number[];
  errorMessage?: string;
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  step5Tldr: string;
  step6Tldr: string;
  step7Tldr: string;
  step8Tldr: string;
  step9Tldr: string;
  step10Tldr: string;
  step11Tldr: string;
  step12Tldr: string;
}

export class PreconditionVerifier {
  /**
   * Verifies that Steps 0 through 12 are locked before Agent 14 runs.
   */
  public static verifyPrerequisites(workspaceRoot: string): PreconditionCheckResult {
    const state = StateManager.load(workspaceRoot);
    if (!state) {
      return {
        isValid: false,
        missingSteps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        errorMessage: 'Precondition Failed: No ZETA session state found in .zeta/state.json.',
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        step3Tldr: '',
        step4Tldr: '',
        step5Tldr: '',
        step6Tldr: '',
        step7Tldr: '',
        step8Tldr: '',
        step9Tldr: '',
        step10Tldr: '',
        step11Tldr: '',
        step12Tldr: ''
      };
    }

    const requiredSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const missing = requiredSteps.filter(s => !state.lockedSteps.includes(s));

    if (missing.length > 0) {
      return {
        isValid: false,
        missingSteps: missing,
        errorMessage: `Precondition Failed: Step ${missing[0]} is not locked. All stages 0 through 12 must be formally completed and locked before Knowledge Transfer, Documentation & Education can commence.`,
        step0Tldr: '',
        step1Tldr: '',
        step2Tldr: '',
        step3Tldr: '',
        step4Tldr: '',
        step5Tldr: '',
        step6Tldr: '',
        step7Tldr: '',
        step8Tldr: '',
        step9Tldr: '',
        step10Tldr: '',
        step11Tldr: '',
        step12Tldr: ''
      };
    }

    return {
      isValid: true,
      missingSteps: [],
      step0Tldr: state.stepSummaries['step_0']?.summary || '',
      step1Tldr: state.stepSummaries['step_1']?.summary || '',
      step2Tldr: state.stepSummaries['step_2']?.summary || '',
      step3Tldr: state.stepSummaries['step_3']?.summary || '',
      step4Tldr: state.stepSummaries['step_4']?.summary || '',
      step5Tldr: state.stepSummaries['step_5']?.summary || '',
      step6Tldr: state.stepSummaries['step_6']?.summary || '',
      step7Tldr: state.stepSummaries['step_7']?.summary || '',
      step8Tldr: state.stepSummaries['step_8']?.summary || '',
      step9Tldr: state.stepSummaries['step_9']?.summary || '',
      step10Tldr: state.stepSummaries['step_10']?.summary || '',
      step11Tldr: state.stepSummaries['step_11']?.summary || '',
      step12Tldr: state.stepSummaries['step_12']?.summary || ''
    };
  }
}
