import { Step3TechStrategyDraft, TechnologyDecisionRecord } from './types.js';

export interface SelectionAnalysis {
  draft: Step3TechStrategyDraft;
  unselectedCategories: string[];
  completenessPercentage: number;
}

export class StackSelector {
  public static createEmptyDraft(step0Tldr: string, step1Tldr: string, step2Tldr: string): Step3TechStrategyDraft {
    const tdrs: TechnologyDecisionRecord[] = [
      {
        id: 'TDR-01',
        category: 'RUNTIME_LANGUAGE',
        selectedTech: 'Node.js (v20+ LTS) with TypeScript (ES2022 / NodeNext)',
        version: '^5.7.0',
        justification: 'Guarantees universal compatibility across VS Code, Antigravity, and Cursor extension hosts with static type safety.',
        rejectedAlternatives: ['Deno (lacks native VS Code extension host embedding)', 'Bun (Windows extension host stability concerns)'],
        tradeOffsAccepted: 'Slight compilation step required; standard across all major IDE plugins.'
      },
      {
        id: 'TDR-02',
        category: 'DATA_STORAGE',
        selectedTech: 'Atomic File-based JSON (.zeta/state.json) + Markdown Docs',
        version: 'POSIX / Windows fs standard',
        justification: 'Zero external database dependency; 100% git-portable and crash-resilient via atomic write-ahead rename.',
        rejectedAlternatives: ['SQLite (binary file harder to diff in git)', 'Redis / PostgreSQL (violates zero-daemon constraint)'],
        tradeOffsAccepted: 'Requires strict per-turn file flushing; negligible overhead for small governance payloads.'
      }
    ];

    return {
      step0Tldr,
      step1Tldr,
      step2Tldr,
      tdrs,
      candidateEvaluations: [],
      architectureReadinessVerdict: 'APPROVED'
    };
  }

  /**
   * Initializes evaluation and flags remaining stack categories requiring user confirmation.
   */
  public static evaluate(_userInput: string, step0Tldr: string, step1Tldr: string, step2Tldr: string): SelectionAnalysis {
    const draft = this.createEmptyDraft(step0Tldr, step1Tldr, step2Tldr);
    const unselectedCategories: string[] = [
      'Communication & Extension Protocol',
      'Testing & Verification Framework',
      'Build Tooling & Compilation'
    ];

    return {
      draft,
      unselectedCategories,
      completenessPercentage: 40
    };
  }
}
