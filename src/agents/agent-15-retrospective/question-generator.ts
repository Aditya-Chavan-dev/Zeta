import { ClarifyingQuestion, Step14RetrospectiveDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a retrospective area.
   */
  public static generateForArea(area: string, _draft: Step14RetrospectiveDraft): ClarifyingQuestion {
    switch (area) {
      case 'Continuous Improvement Sprint Prioritization':
        return {
          id: 'q-retro-priority',
          category: 'Continuous Improvement Sprint Prioritization',
          question: 'Which post-launch continuous improvement initiative should receive immediate sprint priority?',
          contextWhyNeeded: 'Directs developer focus onto the highest-impact enhancement following full lifecycle completion.',
          top3Options: [
            {
              title: 'IDE Native Visual Bridge & One-Click Handshake UI (Recommended)',
              description: 'Integrate the 15-stage workflow into VSCode / Antigravity IDE sidebar webview for graphic status and one-click turn approvals.',
              tradeOffs: 'Dramatically enhances user experience and adoption; requires frontend IDE extension manifest development.',
              recommended: true
            },
            {
              title: 'Automated Git Pre-Commit Hook Enforcement',
              description: 'Install local git hooks that mathematically verify .zeta/state.json cryptographic hashes before git commits.',
              tradeOffs: 'Hardens repository governance; requires local developer git hook installation script.'
            },
            {
              title: 'Real-Time State Machine Visualizer (Mermaid Graph Generator)',
              description: 'Auto-generate and live-update visual Mermaid flowcharts in README.md as steps advance.',
              tradeOffs: 'Improves stakeholder visibility; adds minimal operational impact to core state machine.'
            }
          ]
        };

      case 'Technical Debt Allocation Budget':
        return {
          id: 'q-retro-debt-budget',
          category: 'Technical Debt Allocation Budget',
          question: 'What percentage of future engineering capacity should be dedicated to refactoring and debt reduction?',
          contextWhyNeeded: 'Balances continuous feature iteration with ongoing structural health and code quality.',
          top3Options: [
            {
              title: '15% Dedicated Technical Debt Allocation (Recommended)',
              description: 'Reserve ~15% of sprint velocity specifically for refactoring, test suite speedups, and dependency bumps.',
              tradeOffs: 'Industry standard for high-velocity software; prevents gradual decay without stalling roadmap.',
              recommended: true
            },
            {
              title: '20% Aggressive Hardening Allocation',
              description: 'Allocate one full sprint out of every five entirely to reliability, performance, and cleanup.',
              tradeOffs: 'Maximum codebase resilience; slightly reduces short-term feature delivery pace.'
            },
            {
              title: '10% Lean Maintenance Allocation',
              description: 'Dedicate 10% strictly to bug fixes and patch updates.',
              tradeOffs: 'Maximizes immediate feature output; technical debt can gradually accumulate over multi-year horizons.'
            }
          ]
        };

      case 'Retrospective Cadence & Team Feedback Loop':
      default:
        return {
          id: 'q-retro-cadence',
          category: 'Retrospective Cadence & Team Feedback Loop',
          question: 'What recurring cadence should govern future post-release retrospectives and Kaizen reviews?',
          contextWhyNeeded: 'Institutionalizes continuous improvement as a permanent engineering discipline.',
          top3Options: [
            {
              title: 'Per-Milestone & Major Release Retrospectives (Recommended)',
              description: 'Trigger a formal retrospective turn at the conclusion of every major software release candidate cycle.',
              tradeOffs: 'Directly ties retrospectives to shipped software milestones; avoids meeting fatigue.',
              recommended: true
            },
            {
              title: 'Bi-Weekly Sprint Retrospectives',
              description: 'Conduct team retrospectives every two weeks regardless of release state.',
              tradeOffs: 'Frequent feedback; can become repetitive during deep implementation phases.'
            },
            {
              title: 'Quarterly Strategic Engineering Review',
              description: 'Hold broad engineering reviews once per quarter.',
              tradeOffs: 'High-level strategic focus; micro-challenges and low-level tactical bugs are easily forgotten.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved retrospective areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step14RetrospectiveDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
