/**
 * BaselineUpdater — Amendment plan generator.
 *
 * Given a confirmed cascade report, produces an update plan identifying
 * which steps need amendment and the earliest rollback target.
 * Does NOT execute the rollback — that's GovernanceEngine.rollbackForAmendment().
 */

import { CascadeReport } from './impact-cascade.js';

export interface UpdatePlan {
  /** Step numbers that need to be re-evaluated. */
  stepsToAmend: number[];
  /** The earliest affected step — rollback target for GovernanceEngine. */
  rollbackTarget: number;
  /** Human-readable reason for the amendment. */
  reason: string;
  /** Whether this plan requires user confirmation before execution. */
  requiresConfirmation: boolean;
}

export class BaselineUpdater {
  /**
   * Generates an amendment plan from a confirmed cascade report.
   *
   * Rules:
   * - The rollback target is the EARLIEST directly impacted step.
   * - All steps from rollbackTarget onward become stepsToAmend.
   * - The plan always requires user confirmation before execution.
   */
  public static planUpdate(cascadeReport: CascadeReport): UpdatePlan {
    const affected = cascadeReport.affectedSteps
      .filter(s => s.impactLevel === 'DIRECT' || s.impactLevel === 'INDIRECT')
      .sort((a, b) => a.stepNumber - b.stepNumber);

    if (affected.length === 0) {
      return {
        stepsToAmend: [],
        rollbackTarget: -1,
        reason: 'No steps affected by drift. No amendment needed.',
        requiresConfirmation: false
      };
    }

    const rollbackTarget = affected[0].stepNumber;
    const stepsToAmend = affected.map(a => a.stepNumber);

    // Build human-readable reason
    const directSteps = affected
      .filter(a => a.impactLevel === 'DIRECT')
      .map(a => `Step ${a.stepNumber} (${a.stepName})`)
      .slice(0, 5);

    const indirectSteps = affected
      .filter(a => a.impactLevel === 'INDIRECT')
      .map(a => `Step ${a.stepNumber} (${a.stepName})`)
      .slice(0, 5);

    let reason = `Drift trigger: ${cascadeReport.triggerDescription}\n`;
    reason += `Directly impacted: ${directSteps.join(', ')}.`;
    if (indirectSteps.length > 0) {
      reason += `\nIndirectly impacted: ${indirectSteps.join(', ')}.`;
    }
    reason += `\nRollback target: Step ${rollbackTarget}. All steps from ${rollbackTarget} onward will be unlocked for re-evaluation.`;

    return {
      stepsToAmend,
      rollbackTarget,
      reason,
      requiresConfirmation: true
    };
  }

  /**
   * Formats the update plan as a user-facing confirmation prompt.
   */
  public static formatConfirmationPrompt(plan: UpdatePlan): string {
    if (plan.stepsToAmend.length === 0) {
      return 'No amendment needed. Proceeding normally.';
    }

    return [
      '📋 **Amendment Plan**',
      '',
      plan.reason,
      '',
      `**${plan.stepsToAmend.length} step(s)** will be unlocked and re-evaluated.`,
      '',
      'Reply **"Confirm amendment"** to proceed or **"Cancel"** to keep the current baseline.'
    ].join('\n');
  }
}
