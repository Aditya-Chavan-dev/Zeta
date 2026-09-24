import { ClarifyingQuestion, Step10OperationsSreDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for an operational SRE area.
   */
  public static generateForArea(area: string, _draft: Step10OperationsSreDraft): ClarifyingQuestion {
    switch (area) {
      case 'Incident Triage & Auto-Escalation Protocol':
        return {
          id: 'q-sre-incident',
          category: 'Incident Triage & Auto-Escalation Protocol',
          question: 'How should SEV-1 disk write failures or state corruption be triaged and surfaced to the operator?',
          contextWhyNeeded: 'Establishes the escalation boundary between automatic remediation and manual operator intervention.',
          top3Options: [
            {
              title: 'Automated Backup Restoration + High-Visibility IDE Alert (Recommended)',
              description: 'Immediately restore from .zeta/state.json.bak, log failure details to .zeta/crashes.log, and surface an actionable notification banner in the IDE.',
              tradeOffs: 'Zero developer data loss; instantaneous recovery (< 5s MTTR); non-intrusive notification.',
              recommended: true
            },
            {
              title: 'Strict Immediate Hard Stop (Interactive Triage Prompt)',
              description: 'Block all further turns until the developer reviews the corrupted file and approves a rollback action.',
              tradeOffs: 'Maximum caution; halts developer velocity even for transient retryable locks.'
            },
            {
              title: 'Silent Background Self-Healing',
              description: 'Silently overwrite corrupted state from the last known good snapshot without alerting the developer.',
              tradeOffs: 'Zero developer interruption; hides potential underlying storage or filesystem permissions bugs.'
            }
          ]
        };

      case 'State Disaster Recovery & Snapshot Retention Window':
        return {
          id: 'q-sre-dr-retention',
          category: 'State Disaster Recovery & Snapshot Retention Window',
          question: 'What retention policy should govern ZETA state backup snapshots?',
          contextWhyNeeded: 'Balances historical auditability and point-in-time recovery against local workspace disk usage.',
          top3Options: [
            {
              title: 'Rolling 10-Step Snapshot Ring Buffer + Per-Turn Backup (Recommended)',
              description: 'Retain .zeta/state.json.bak alongside snapshots of the last 10 completed steps (< 5MB total footprint).',
              tradeOffs: 'Enables point-in-time rollback across major lifecycle milestones while bounding disk consumption.',
              recommended: true
            },
            {
              title: 'Complete Lifecycle History Preservation (All turns and steps)',
              description: 'Retain every turn diff and step snapshot indefinitely in an immutable .zeta/history/ archive.',
              tradeOffs: 'Infinite audit trail; disk usage grows linearly over prolonged project lifecycles.'
            },
            {
              title: 'Ephemeral Single Backup (Only state.json.bak)',
              description: 'Retain only the immediate preceding state.json.bak file.',
              tradeOffs: 'Smallest disk footprint (< 100KB); cannot roll back past the most recent turn.'
            }
          ]
        };

      case 'Log Rotation & Storage Maintenance Cadence':
      default:
        return {
          id: 'q-sre-maintenance',
          category: 'Log Rotation & Storage Maintenance Cadence',
          question: 'How often should log rotation, temp cleanup, and checksum audits execute?',
          contextWhyNeeded: 'Prevents operational log files from consuming unbounded disk space over time.',
          top3Options: [
            {
              title: 'Weekly Automated Prune + On-Upgrade Verification Audit (Recommended)',
              description: 'Rotate .zeta/crashes.log when exceeding 5MB and audit SHA-256 integrity on every version upgrade or project reopen.',
              tradeOffs: 'Zero manual maintenance overhead; bounds disk usage; ensures tamper-evident state.',
              recommended: true
            },
            {
              title: 'Daily Aggressive Prune (1MB log cap)',
              description: 'Truncate logs daily and purge uncommitted scratch buffers older than 24 hours.',
              tradeOffs: 'Minimal disk footprint; may purge diagnostic data before developers inspect yesterday\'s bugs.'
            },
            {
              title: 'Manual Maintenance Only (Operator-Triggered)',
              description: 'Provide an explicit CLI command `zeta clean` without automated pruning.',
              tradeOffs: 'Total operator control; logs may grow indefinitely if operator forgets to prune.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved SRE areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step10OperationsSreDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
