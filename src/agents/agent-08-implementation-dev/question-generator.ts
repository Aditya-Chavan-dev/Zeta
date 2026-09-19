import { ClarifyingQuestion, OptionChoice, Step7ImplementationDevDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a specific construction area.
   */
  public static generateForArea(area: string, draft: Step7ImplementationDevDraft): ClarifyingQuestion {
    switch (area) {
      case 'Release Candidate Tagging & Packaging Format':
        return {
          id: 'q-dev-packaging',
          category: 'Release Candidate Tagging & Packaging Format',
          question: 'What packaging and tagging format should represent the verified Release Candidate (RC)?',
          contextWhyNeeded: 'Determines how downstream QA and deployment agents reference the immutable code snapshot.',
          top3Options: [
            {
              title: 'Semver RC Git Tag + Authoritative Manifest (v0.8.0-rc1)',
              description: 'Standard semantic versioning tag referencing an exact SHA-256 hash manifest in docs/IMPLEMENTED_RELEASE_CANDIDATE.md.',
              tradeOffs: 'Standard across npm, GitHub, and VS Code marketplaces; 100% transparent and reproducible.',
              recommended: true
            },
            {
              title: 'Single-file Tarball Bundle (release-candidate.tar.gz)',
              description: 'Compress entire verified workspace into a single zipped archive file.',
              tradeOffs: 'Binary file; requires decompression before downstream inspection.'
            },
            {
              title: 'Ephemeral Git Branch (rc/staging)',
              description: 'Push verified code to a temporary staging branch without explicit version tags.',
              tradeOffs: 'Mutable; lacks strict immutable SHA-256 baseline freeze.'
            }
          ]
        };

      case 'Build Verification Sandbox Isolation':
        return {
          id: 'q-dev-sandbox',
          category: 'Build Verification Sandbox Isolation',
          question: 'How should the construction engineer verify test suites before assembling the Release Candidate?',
          contextWhyNeeded: 'Running destructive or stateful tests in the active workspace risks corrupting user files.',
          top3Options: [
            {
              title: 'Two-Stage Ephemeral Test Lab (.test-* directories + workspace verification)',
              description: 'Run integration tests inside isolated temporary directories, cleaned up immediately in afterEach.',
              tradeOffs: 'Requires rigorous beforeEach/afterEach fixtures; guarantees 100% zero pollution of actual .zeta state.',
              recommended: true
            },
            {
              title: 'In-Place Direct Execution in Active Workspace',
              description: 'Run tests directly against the current .zeta/state.json.',
              tradeOffs: 'High risk of corrupting user state during testing.'
            },
            {
              title: 'External Docker Container Execution',
              description: 'Spin up a container to run all tests.',
              tradeOffs: 'Requires Docker daemon running on host machine; violates zero-daemon local-first constraint.'
            }
          ]
        };

      case 'Rollback Safety & Artifact Archival Policy':
      default:
        return {
          id: 'q-dev-rollback',
          category: 'Rollback Safety & Artifact Archival Policy',
          question: 'What automated rollback policy should trigger if code generation fails quality gates?',
          contextWhyNeeded: 'Failed builds must never leave partially written files or broken AST nodes in the repository.',
          top3Options: [
            {
              title: 'Atomic Reversion to Prior Locked Git/File State',
              description: 'Discard uncommitted buffer and restore last verified files if build fails type-checking or tests.',
              tradeOffs: 'Requires clean git working tree; ensures codebase remains in 100% working order at all times.',
              recommended: true
            },
            {
              title: 'Leave Broken Files with Error Annotations',
              description: 'Keep broken code on disk and print syntax errors in console.',
              tradeOffs: 'Leaves repository in broken state; blocks other tasks.'
            },
            {
              title: 'Move Broken Files to Quarantine Directory (.quarantine/)',
              description: 'Move unverified files into a separate folder for manual inspection.',
              tradeOffs: 'Accumulates orphaned files and confuses package resolution.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved construction areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step7ImplementationDevDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
