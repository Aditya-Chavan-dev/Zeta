import { ClarifyingQuestion, OptionChoice, Step5DetailedDesignDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 design patterns for a specific technical design area.
   */
  public static generateForArea(area: string, draft: Step5DetailedDesignDraft): ClarifyingQuestion {
    switch (area) {
      case 'Input Validation & Sanitization Schema':
        return {
          id: 'q-design-validation',
          category: 'Input Validation & Sanitization Schema',
          question: 'What validation approach should enforce runtime payload integrity across agent turns and state reads?',
          contextWhyNeeded: 'Malformed turn inputs or corrupted state JSON can crash the extension runtime.',
          top3Options: [
            {
              title: 'Lightweight Static TypeScript Guards & Regex Parsers',
              description: 'Zero external dependencies; clean pure-TypeScript type guards and explicit schema check functions.',
              tradeOffs: 'Requires writing explicit type guards; zero runtime overhead and zero third-party bundle bloat.',
              recommended: true
            },
            {
              title: 'Zod Runtime Schema Validation',
              description: 'Industry-standard declarative schema library with automatic TypeScript type inference.',
              tradeOffs: 'Adds a third-party dependency; adds slight parse overhead on every message.'
            },
            {
              title: 'JSON Schema Validation (Ajv)',
              description: 'Strict JSON Schema drafts with compiled validator functions.',
              tradeOffs: 'Heavyweight; requires maintaining separate JSON Schema files alongside TypeScript types.'
            }
          ]
        };

      case 'Correlation ID & Logging Traceability':
        return {
          id: 'q-design-tracing',
          category: 'Correlation ID & Logging Traceability',
          question: 'How should individual user turns and agent internal events be tagged for diagnostic traceability?',
          contextWhyNeeded: 'When a turn fails or drifts, engineers need to trace exactly which agent and turn triggered the issue.',
          top3Options: [
            {
              title: 'Deterministic Turn Counter + ISO-8601 Timestamp in State',
              description: 'Embed turnCount and lastTurnTimestamp directly in .zeta/state.json and uncommittedBuffer.',
              tradeOffs: 'Zero external telemetry infrastructure required; completely self-contained in state.json.',
              recommended: true
            },
            {
              title: 'UUIDv4 Correlation ID per Turn Message',
              description: 'Generate a random UUIDv4 header for every single message passed through the bridge.',
              tradeOffs: 'Adds random identifiers to state files; slightly less human-scannable than sequential turn counts.'
            },
            {
              title: 'OpenTelemetry Span Context Injection',
              description: 'Inject full W3C TraceContext headers into every agent invocation.',
              tradeOffs: 'High complexity; overkill for local-first single-repository plugin.'
            }
          ]
        };

      case 'Plugin Exception Hierarchy & Serialization':
      default:
        return {
          id: 'q-design-exceptions',
          category: 'Plugin Exception Hierarchy & Serialization',
          question: 'What error structure should agents return when encountering invalid operations or drift?',
          contextWhyNeeded: 'Standardized error payloads allow the UI to display clean, actionable messages instead of raw stack traces.',
          top3Options: [
            {
              title: 'Standardized Error Return Interface ({ error: string; message: string; recoveryGuidance?: string })',
              description: 'Functional error return model; methods return clean response objects without throwing unhandled exceptions.',
              tradeOffs: 'Callers must inspect response.error; prevents unhandled exceptions from crashing the IDE.',
              recommended: true
            },
            {
              title: 'Custom Typed Error Classes (PreconditionError, DriftError)',
              description: 'Throw custom JavaScript Error subclasses that must be caught in try-catch blocks.',
              tradeOffs: 'Requires try-catch wrappers at every call site; risk of unhandled rejection if uncaught.'
            },
            {
              title: 'Generic String Error Messages',
              description: 'Return raw error string or null on failure.',
              tradeOffs: 'Lacks structured metadata; caller cannot programmatically distinguish precondition from drift errors.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved design areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step5DetailedDesignDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
