import { ClarifyingQuestion, OptionChoice, Step8VerificationQaDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a specific QA audit area.
   */
  public static generateForArea(area: string, draft: Step8VerificationQaDraft): ClarifyingQuestion {
    switch (area) {
      case 'Adversarial Chaos & Stress Test Scope':
        return {
          id: 'q-qa-chaos',
          category: 'Adversarial Chaos & Stress Test Scope',
          question: 'What level of automated chaos injection should stress-test the state engine before release?',
          contextWhyNeeded: 'Verifies how resilient the atomic persistence and resume sentinel are under hostile I/O environments.',
          top3Options: [
            {
              title: 'Simulated File Lock Retries & Interrupted Turn Recovery (Recommended)',
              description: 'Inject transient EPERM errors, file-lock collisions, and uncommitted turn aborts directly in unit tests.',
              tradeOffs: 'Deterministic and fast (< 100ms); verifies all recovery code paths without external chaos daemons.',
              recommended: true
            },
            {
              title: 'OS-Level Process Signal Killing (SIGKILL / Taskkill)',
              description: 'Spawn child processes and execute taskkill /f mid-write during test runs.',
              tradeOffs: 'More realistic OS kill simulation; slower and can leave dangling lock files on Windows.',
            },
            {
              title: 'Passive Static Code Analysis Only',
              description: 'Rely on code reviews without simulated chaos injection.',
              tradeOffs: 'Leaves runtime concurrency edge cases untested.'
            }
          ]
        };

      case 'User Acceptance Validation Rigor':
        return {
          id: 'q-qa-uat',
          category: 'User Acceptance Validation Rigor',
          question: 'How should the system validate that the implemented software truly eliminates the Step 0 user pain?',
          contextWhyNeeded: 'Software can technically pass all unit tests while still failing to satisfy the customer.',
          top3Options: [
            {
              title: 'Dual Validation: Step 0 Invariant Checklist + Multi-Stage Pipeline Playback',
              description: 'Verify that every turn enforces the invariant "prevent technical debt & architectural decay" and tests E2E flow.',
              tradeOffs: 'Requires rigorous intent cross-checks; guarantees perfect alignment between inception and code.',
              recommended: true
            },
            {
              title: 'End-to-End Golden File Diffs Only',
              description: 'Compare compiled markdown artifacts against pre-recorded golden snapshots.',
              tradeOffs: 'Brittle; breaks whenever copy or formatting is slightly tweaked.'
            },
            {
              title: 'Developer Self-Certification',
              description: 'Rely on developer confirmation without structured audit checklists.',
              tradeOffs: 'High risk of confirmation bias and missed UX edge cases.'
            }
          ]
        };

      case 'Defect Severity SLA & Regression Policy':
      default:
        return {
          id: 'q-qa-defect-sla',
          category: 'Defect Severity SLA & Regression Policy',
          question: 'What defect tolerance policy must govern the final QA gate before releasing to Step 9?',
          contextWhyNeeded: 'Establishes clear criteria for issuing PASS vs REWORK REQUIRED.',
          top3Options: [
            {
              title: 'Zero Defect Tolerance (0 P0, 0 P1, 0 P2 bugs permitted for release)',
              description: 'Any defect that impairs state integrity, stage gating, or artifact compilation blocks release completely.',
              tradeOffs: 'Zero tolerance for defects; guarantees production-grade reliability on Day 1.',
              recommended: true
            },
            {
              title: 'Conditional Pass with Documented Known Issues',
              description: 'Permit minor cosmetic defects (P2/P3) if documented in release notes.',
              tradeOffs: 'Faster release; incurs slight UX friction on non-critical paths.'
            },
            {
              title: 'Post-Launch Patching Window',
              description: 'Release immediately and patch discovered bugs in subsequent minor updates.',
              tradeOffs: 'Destroys user trust if early adopters encounter state corruption.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved audit areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step8VerificationQaDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
