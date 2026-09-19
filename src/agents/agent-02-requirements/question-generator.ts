import { ClarifyingQuestion, OptionChoice, Step1RequirementsDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 industry options for a specific missing requirement category.
   */
  public static generateForCategory(category: string, draft: Step1RequirementsDraft): ClarifyingQuestion {
    switch (category) {
      case 'Performance & Latency':
        return {
          id: 'q-nfr-performance',
          category: 'Performance & Latency',
          question: 'What is the required response time threshold for agent turns and local state operations?',
          contextWhyNeeded: 'Performance budgets ensure snappy developer UX inside the IDE without blocking typing or chat.',
          top3Options: [
            {
              title: '< 100ms In-process State Operations (Ultra-fast)',
              description: 'Zero perceptible lag for state reads/writes; runs synchronously within IDE event loop.',
              tradeOffs: 'Requires strictly local, synchronous file I/O operations with small state payloads.',
              recommended: true
            },
            {
              title: '< 500ms Local Asynchronous Operations',
              description: 'Allows background indexing and larger artifact generation in worker threads.',
              tradeOffs: 'UI might require brief loading indicators during heavy compilations.'
            },
            {
              title: '< 2000ms Network-bound Telemetry Operations',
              description: 'Permits network calls for external schema validation or remote syncing.',
              tradeOffs: 'High latency; degrades developer flow if network is slow or offline.'
            }
          ]
        };

      case 'Reliability & Recovery':
        return {
          id: 'q-nfr-reliability',
          category: 'Reliability & Recovery',
          question: 'What is the acceptable data loss tolerance in the event of an abrupt IDE crash or process termination?',
          contextWhyNeeded: 'Developers frequently close IDE windows without warning; data loss destroys trust.',
          top3Options: [
            {
              title: 'Zero Data Loss (Write-ahead atomic journal per turn)',
              description: 'Every interaction commits to disk before next turn; 100% state recovery upon restart.',
              tradeOffs: 'Disk write on every user turn; requires atomic rename protocol.',
              recommended: true
            },
            {
              title: 'Checkpoint-based Save (Periodic 60-second intervals)',
              description: 'State writes periodically on a background timer.',
              tradeOffs: 'May lose up to 60 seconds of decisions if crash occurs before next flush.'
            },
            {
              title: 'Session Exit Save (Save on window close event)',
              description: 'Only writes when IDE triggers close/unload.',
              tradeOffs: 'Does not protect against SIGKILL, hard reboots, or power failures.'
            }
          ]
        };

      case 'Security & Access Boundary':
        return {
          id: 'q-nfr-security',
          category: 'Security & Access Boundary',
          question: 'What security sandbox model must govern file system reads/writes by the agents?',
          contextWhyNeeded: 'AI agents modifying arbitrary system paths poses severe security and system integrity risks.',
          top3Options: [
            {
              title: 'Strict Workspace Root Sandboxing (Local-only)',
              description: 'Agents can only read/write files strictly inside the active workspace directory; absolute path traversal blocked.',
              tradeOffs: 'Cannot touch global configs outside .zeta or workspace root.',
              recommended: true
            },
            {
              title: 'Explicit Prompt Confirmation for Sensitive Paths',
              description: 'Allows editing outside workspace only after explicit user interactive prompt.',
              tradeOffs: 'Adds popup friction to user workflows.'
            },
            {
              title: 'Unrestricted Developer Access',
              description: 'Agents have full access to any directory the parent process can access.',
              tradeOffs: 'Extremely high risk of accidental system modification or credential leakage.'
            }
          ]
        };

      case 'Data Persistence & Lifecycle':
      default:
        return {
          id: 'q-data-persistence',
          category: 'Data Persistence & Lifecycle',
          question: 'Where and in what format should engineering governance artifacts and project state be stored?',
          contextWhyNeeded: 'Standardized storage ensures portability across different IDEs and version control systems.',
          top3Options: [
            {
              title: 'Git-friendly Local Storage (.zeta/state.json + docs/*.md)',
              description: 'All state in human-readable JSON and Markdown directly committable to git repository.',
              tradeOffs: 'Exposes internal state files to repository diffs; 100% portable and transparent.',
              recommended: true
            },
            {
              title: 'Embedded SQLite Database file (.zeta/database.sqlite)',
              description: 'Fast relational querying of lifecycle turns and requirement matrices.',
              tradeOffs: 'Binary file; cannot be easily diffed or reviewed in pull requests.'
            },
            {
              title: 'Global OS AppData directory',
              description: 'Stores state in user-level application data outside project folder.',
              tradeOffs: 'Fails to travel with the git repository when moving between machines or collaborators.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all missing pillars.
   */
  public static generateAllQuestions(missingPillars: string[], draft: Step1RequirementsDraft): ClarifyingQuestion[] {
    return missingPillars.map(pillar => this.generateForCategory(pillar, draft));
  }
}
