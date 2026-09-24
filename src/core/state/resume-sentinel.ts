import { ResumeAssessment, SessionState } from './types.js';
import { StateManager } from './state-manager.js';

export class ResumeSentinel {
  private static readonly STEP_NAMES: Record<number, string> = {
    0: 'Problem Definition & Project Intent',
    1: 'Requirements Gathering & Elicitation',
    2: 'Feasibility, Constraints & Risk Analysis',
    3: 'Technology Strategy & Tech-Stack Selection',
    4: 'System Architecture & Solution Design',
    5: 'Detailed Technical Design',
    6: 'Implementation Planning & Work Breakdown',
    7: 'Implementation / Development',
    8: 'Verification, Validation & QA',
    9: 'Production Readiness & Deployment',
    10: 'Operations, Maintenance & SRE',
    11: 'Security, Privacy & Compliance',
    12: 'Governance, Lifecycle & Deprecation',
    13: 'Knowledge Transfer & Documentation',
    14: 'Project Retrospective & Continuous Improvement'
  };

  public static getStepName(stepNumber: number): string {
    return this.STEP_NAMES[stepNumber] || `Step ${stepNumber}`;
  }

  /**
   * Assesses an existing state on startup to detect interruption and build a clean resume prompt.
   */
  public static assess(state: SessionState, workspaceRoot?: string): ResumeAssessment {
    const activeStepName = this.getStepName(state.activeStep);
    const hasUncommitted = Boolean(
      state.uncommittedBuffer?.lastUserMessage || state.uncommittedBuffer?.pendingDraftSummary
    );

    const isInterrupted = state.stepStatus === 'IN_PROGRESS' && hasUncommitted;

    const lockedCount = state.lockedSteps.length;
    let greeting = `Welcome back! Active Project: ${state.projectId}.\n`;
    greeting += `Current Stage: Step ${state.activeStep} — ${activeStepName} (${state.stepStatus}).\n`;

    if (lockedCount > 0) {
      greeting += `Locked & Approved: ${lockedCount} of 15 stages complete.\n`;
    }

    let integrityViolations: string[] | undefined;
    if (workspaceRoot) {
      try {
        const integrity = StateManager.verifyIntegrity(workspaceRoot);
        if (!integrity.valid) {
          integrityViolations = integrity.violations;
          greeting += `\n⚠️ [INTEGRITY WARNING] Specification file tamper detected:\n`;
          integrity.violations.forEach((v: string) => {
            greeting += `  * ${v}\n`;
          });
        }
      } catch {}
    }

    if (isInterrupted) {
      greeting += `\n[NOTE] Previous session was interrupted mid-turn:\n`;
      if (state.uncommittedBuffer.lastUserMessage) {
        greeting += `* Last user input: "${state.uncommittedBuffer.lastUserMessage}"\n`;
      }
      if (state.uncommittedBuffer.pendingDraftSummary) {
        greeting += `* Pending draft: ${state.uncommittedBuffer.pendingDraftSummary}\n`;
      }
      greeting += `Resuming Step ${state.activeStep} cleanly from this point.`;
    } else {
      greeting += `Ready to proceed with Step ${state.activeStep}.`;
    }

    return {
      state,
      isInterrupted,
      resumptionGreeting: greeting,
      integrityViolations
    };
  }
}
