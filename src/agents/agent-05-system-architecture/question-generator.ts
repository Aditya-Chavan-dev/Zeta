import { ClarifyingQuestion, OptionChoice, Step4ArchitectureDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 architectural patterns for a specific architecture area.
   */
  public static generateForArea(area: string, draft: Step4ArchitectureDraft): ClarifyingQuestion {
    switch (area) {
      case 'Inter-Agent Communication & Coupling':
        return {
          id: 'q-arch-communication',
          category: 'Inter-Agent Communication & Coupling',
          question: 'How should downstream agents access and depend on upstream stage outputs?',
          contextWhyNeeded: 'Tight coupling between agents causes cascading failures; loose coupling preserves modularity.',
          top3Options: [
            {
              title: 'State-Mediated Loosely Coupled TL;DR Handshake',
              description: 'Agents communicate strictly via .zeta/state.json step summaries; zero direct cross-agent object dependencies.',
              tradeOffs: 'Forces compact summary compilation at stage boundaries; guarantees complete agent isolation.',
              recommended: true
            },
            {
              title: 'Direct In-Memory Shared State Object',
              description: 'Agents share a mutable global context pointer across the entire session.',
              tradeOffs: 'High risk of unintentional state mutation and brittle cross-agent coupling.'
            },
            {
              title: 'Event-Bus Pub/Sub Communication',
              description: 'Agents broadcast state transitions over an internal event emitter.',
              tradeOffs: 'Adds asynchronous indirection; makes sequential lifecycle debugging harder to trace.'
            }
          ]
        };

      case 'Memory & Context Retention Topology':
        return {
          id: 'q-arch-memory',
          category: 'Memory & Context Retention Topology',
          question: 'How should the architecture prevent AI model context window overflow across long multi-turn sessions?',
          contextWhyNeeded: 'Passing full documents across 15 stages exceeds LLM token limits and causes forgetfulness.',
          top3Options: [
            {
              title: 'Hierarchical Compression (Active Stage Raw + Upstream Compact TL;DRs)',
              description: 'Active stage receives full immediate turn context; all upstream stages provide only < 400 word locked summaries.',
              tradeOffs: 'Downstream agents rely on high-quality upstream summaries rather than raw transcript archives.',
              recommended: true
            },
            {
              title: 'Full Raw Document Concatenation',
              description: 'Append all upstream docs into every prompt.',
              tradeOffs: 'Rapidly exhausts context windows; degrades model attention and latency.'
            },
            {
              title: 'Vector Database RAG Retrieval',
              description: 'Embed documents and perform semantic chunk retrieval per turn.',
              tradeOffs: 'Overkill for local-first plugin; requires local embedding model and vector index.'
            }
          ]
        };

      case 'Crash Isolation & Error Boundary Strategy':
      default:
        return {
          id: 'q-arch-isolation',
          category: 'Crash Isolation & Error Boundary Strategy',
          question: 'What error boundary architecture should contain unexpected stage failures?',
          contextWhyNeeded: 'An unhandled exception in an agent must never crash the host IDE or corrupt .zeta/state.json.',
          top3Options: [
            {
              title: 'Per-Turn Try-Catch Boundary with Safe State Rollback',
              description: 'Wrap every turn in an error boundary; if an agent throws, restore last committed state and return actionable message.',
              tradeOffs: 'Requires idempotent turn handlers; prevents host IDE crashes and corrupted disk state.',
              recommended: true
            },
            {
              title: 'Process-Level Crash and Restart',
              description: 'Allow node process to fail and let IDE restart the extension host.',
              tradeOffs: 'Jarring user experience; flashes errors across the entire editor window.'
            },
            {
              title: 'Silent Error Suppression with Fallback Defaults',
              description: 'Catch errors silently and assume default positive answers.',
              tradeOffs: 'Hides critical architectural failures and creates hallucinated specifications.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved architecture areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step4ArchitectureDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
