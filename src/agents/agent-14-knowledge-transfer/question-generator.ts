import { ClarifyingQuestion, OptionChoice, Step13KnowledgeTransferDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a knowledge transfer area.
   */
  public static generateForArea(area: string, draft: Step13KnowledgeTransferDraft): ClarifyingQuestion {
    switch (area) {
      case 'Developer Onboarding Velocity & Ramp-up Target':
        return {
          id: 'q-doc-onboarding',
          category: 'Developer Onboarding Velocity & Ramp-up Target',
          question: 'What target ramp-up velocity should new engineers achieve from git clone to first verified contribution?',
          contextWhyNeeded: 'Defines the ergonomics and documentation clarity needed to eliminate onboarding friction.',
          top3Options: [
            {
              title: 'Sub-30-Minute Fast Ramp-Up (Zero-Config Native Node.js) (Recommended)',
              description: 'Developers install node, clone repo, run `npm test`, and execute a simulated agent turn within 30 minutes.',
              tradeOffs: 'Eliminates complex container dependencies and configuration bloat; requires strictly self-contained code.',
              recommended: true
            },
            {
              title: 'Comprehensive Deep-Dive (Half-Day Guided Tour)',
              description: 'Include comprehensive 4-hour guided video transcripts and architecture deep dives before committing code.',
              tradeOffs: 'Deeper contextual understanding; slower initial engineer throughput.'
            },
            {
              title: 'Ad-Hoc Pair Programming Onboarding',
              description: 'Rely on 1-on-1 mentorship sessions without structured self-guided onboarding checklists.',
              tradeOffs: 'Personalized; expensive in senior engineer time and does not scale.'
            }
          ]
        };

      case 'API Reference & Interactive Sandbox Format':
        return {
          id: 'q-doc-api-format',
          category: 'API Reference & Interactive Sandbox Format',
          question: 'How should module interfaces, state transitions, and public APIs be documented for engineering consumers?',
          contextWhyNeeded: 'Determines the discoverability and maintainability of code contracts across the 15-stage lifecycle.',
          top3Options: [
            {
              title: 'Co-Located Markdown Docs + TypeScript Declarations (.d.ts) (Recommended)',
              description: 'Maintain canonical architecture specifications in docs/ with full JSDoc typing directly in code for IDE autocomplete.',
              tradeOffs: 'Always in sync with code; zero external documentation build steps; instant IDE readability.',
              recommended: true
            },
            {
              title: 'Static HTML Documentation Site (TypeDoc / Docusaurus)',
              description: 'Generate a static web portal containing cross-linked API definitions and search capabilities.',
              tradeOffs: 'Searchable browser UI; adds build dependencies and static site hosting overhead.'
            },
            {
              title: 'Raw Inline Source Comments Only',
              description: 'Rely purely on code comments without compiled markdown artifacts in docs/.',
              tradeOffs: 'Zero documentation overhead; completely fails the system requirement for persistent governance artifacts.'
            }
          ]
        };

      case 'Documentation Freshness & Cross-Check Policy':
      default:
        return {
          id: 'q-doc-freshness',
          category: 'Documentation Freshness & Cross-Check Policy',
          question: 'What governance mechanism ensures technical specifications remain perfectly aligned with code changes over time?',
          contextWhyNeeded: 'Prevents documentation rot where markdown specifications diverge from actual runtime behavior.',
          top3Options: [
            {
              title: 'Automated Cryptographic Hash & Pipeline Verification Gate (Recommended)',
              description: 'StateManager computes SHA-256 digests of all docs/; multi-stage integration tests verify hash alignment on every PR commit.',
              tradeOffs: 'Mathematically guarantees tamper evidence and documentation freshness; zero manual audit fatigue.',
              recommended: true
            },
            {
              title: 'Pre-Commit Linter Warning (AST Docstring Check)',
              description: 'Check that every exported class has a corresponding section in docs/ via AST parsing.',
              tradeOffs: 'Fast lint check; does not verify semantic correctness of documentation content.'
            },
            {
              title: 'Quarterly Manual Documentation Review',
              description: 'Schedule quarterly team reviews to reconcile discrepancies between code and documentation.',
              tradeOffs: 'Allows conversational team reviews; documentation remains stale between review cycles.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved knowledge transfer areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step13KnowledgeTransferDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
