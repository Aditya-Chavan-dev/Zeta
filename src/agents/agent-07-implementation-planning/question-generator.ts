import { ClarifyingQuestion, OptionChoice, Step6ImplementationPlanDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a specific implementation planning area.
   */
  public static generateForArea(area: string, draft: Step6ImplementationPlanDraft): ClarifyingQuestion {
    switch (area) {
      case 'Delivery Sequencing Strategy':
        return {
          id: 'q-plan-sequencing',
          category: 'Delivery Sequencing Strategy',
          question: 'What delivery sequencing strategy should guide the implementation order of downstream stages?',
          contextWhyNeeded: 'Dictates whether foundation layers are fully hardened first or built as vertical slices alongside UI.',
          top3Options: [
            {
              title: 'Sequential Agent Hardening (Agent-by-Agent with Full Test Suite)',
              description: 'Build, verify, and write integration tests for one agent at a time before proceeding to the next.',
              tradeOffs: 'Slower initial breadth; guarantees 100% bug-free foundation and zero cascading defects.',
              recommended: true
            },
            {
              title: 'Broad Scaffolding First, Then Deep Implementation',
              description: 'Generate skeletal interfaces and mock responses for all 15 agents first, then fill in logic.',
              tradeOffs: 'Fast surface coverage; delays end-to-end integration proof and hides latent schema bugs.'
            },
            {
              title: 'Risk-First Critical Path Only (Skip non-critical agents)',
              description: 'Implement only Steps 0, 1, 4, 7, and 8, omitting governance and decommission stages.',
              tradeOffs: 'Incomplete lifecycle; defeats the core invariant of disciplined 15-stage governance.'
            }
          ]
        };

      case 'Test Automation Execution Priority':
        return {
          id: 'q-plan-testing',
          category: 'Test Automation Execution Priority',
          question: 'What test automation tier should gate stage progression during development?',
          contextWhyNeeded: 'Determines what automated test suites run before locking each stage and advancing state.',
          top3Options: [
            {
              title: 'Dual-Layer Gating: Unit Tests + Cumulative Pipeline Integration Tests',
              description: 'Run agent unit tests AND cumulative multi-stage pipeline tests (e.g. Agent 01 -> Agent 0N) on every stage lock.',
              tradeOffs: 'Adds ~1 second to test execution per stage; guarantees zero regressions across all upstream agents.',
              recommended: true
            },
            {
              title: 'Unit Tests Only per Stage',
              description: 'Only run unit tests for the active stage during development; run integration tests at release time.',
              tradeOffs: 'Slightly faster dev cycle; risks discovering inter-agent coupling breaks late in the project.'
            },
            {
              title: 'Manual Visual Verification Only',
              description: 'Rely on interactive chat playback without automated assertions.',
              tradeOffs: 'Extremely high risk of silent regressions and non-deterministic state corruption.'
            }
          ]
        };

      case 'Task Sizing & Granularity Threshold':
      default:
        return {
          id: 'q-plan-tasksizing',
          category: 'Task Sizing & Granularity Threshold',
          question: 'What granularity ceiling should bound individual implementation task packages?',
          contextWhyNeeded: 'Oversized tasks create cognitive fatigue and review bottlenecks; undersized tasks create admin overhead.',
          top3Options: [
            {
              title: 'Single-Responsibility Bounded Units (2 to 6 engineering hours)',
              description: 'Every task produces a single verifiable module with accompanying unit tests and clean interfaces.',
              tradeOffs: 'Produces more task cards; perfectly aligned with focused, flow-state engineering.',
              recommended: true
            },
            {
              title: 'Feature-Level Epics (1 to 3 days per work package)',
              description: 'Group module creation, integration, and documentation into broad feature tickets.',
              tradeOffs: 'Harder to track incremental progress; increases merge conflict likelihood.'
            },
            {
              title: 'Micro-Commits (< 1 hour per task)',
              description: 'Break tasks down to individual function definitions and docstring updates.',
              tradeOffs: 'Excessive task management overhead; fragments cohesive architectural thinking.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved planning areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step6ImplementationPlanDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
