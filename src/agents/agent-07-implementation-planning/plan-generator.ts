import { Step6ImplementationPlanDraft, WbsTask, QualityGateRule } from './types.js';

export interface PlanningAnalysis {
  draft: Step6ImplementationPlanDraft;
  unresolvedPlanningAreas: string[];
  completenessPercentage: number;
}

export class PlanGenerator {
  public static createEmptyDraft(s0: string, s1: string, s2: string, s3: string, s4: string, s5: string): Step6ImplementationPlanDraft {
    const tasks: WbsTask[] = [
      {
        id: 'TASK-01',
        title: 'Initialize State Manager & Atomic Persistence',
        phase: 'Phase 1: Core Foundation',
        estimatedHours: 4,
        dependencies: [],
        definitionOfReady: 'Approved detailed design in Step 5 with StateManager method signatures.',
        definitionOfDone: 'src/core/state/state-manager.ts passing atomic write tests with temp rename.'
      },
      {
        id: 'TASK-02',
        title: 'Implement Resume Sentinel & Crash Recovery',
        phase: 'Phase 1: Core Foundation',
        estimatedHours: 3,
        dependencies: ['TASK-01'],
        definitionOfReady: 'StateManager load/save implemented and tested.',
        definitionOfDone: 'ResumeSentinel correctly detects interrupted turns and builds recovery greeting.'
      },
      {
        id: 'TASK-03',
        title: 'Implement Step Gating & Precondition Verification Engine',
        phase: 'Phase 2: Governance Engine',
        estimatedHours: 5,
        dependencies: ['TASK-01'],
        definitionOfReady: 'Precondition verifier contracts and error codes specified.',
        definitionOfDone: 'Stages physically halt if preceding steps are not in LOCKED state.'
      },
      {
        id: 'TASK-04',
        title: 'Build Stage Agents (Step 0 to 14 Pipelines)',
        phase: 'Phase 3: Agent Orchestration',
        estimatedHours: 12,
        dependencies: ['TASK-03'],
        definitionOfReady: 'All 15 agent markdown specifications approved in docs/.',
        definitionOfDone: 'All 15 agents implemented in src/agents/ with Top 3 option generators.'
      },
      {
        id: 'TASK-05',
        title: 'End-to-End Pipeline Verification & Multi-Agent Integration Tests',
        phase: 'Phase 4: QA & Packaging',
        estimatedHours: 6,
        dependencies: ['TASK-04'],
        definitionOfReady: 'All individual agent unit test suites passing.',
        definitionOfDone: 'Seamless multi-stage pipeline integration tests passing with zero state loss.'
      }
    ];

    const qualityGates: QualityGateRule[] = [
      {
        gateName: 'Gate 1: Definition of Ready (DoR)',
        triggerPoint: 'Before starting implementation of any task',
        mandatoryChecks: ['Task has explicit input/output contracts', 'No open architectural ambiguities', 'Preconditions satisfied'],
        passThreshold: '100% of prerequisites met'
      },
      {
        gateName: 'Gate 2: Definition of Done (DoD)',
        triggerPoint: 'Before closing any task or locking any stage',
        mandatoryChecks: ['Automated unit & integration tests passing', 'Artifact compiled with SHA-256 hash', 'Zero uncommitted state loss'],
        passThreshold: '100% test pass rate with zero regressions'
      }
    ];

    const criticalPath = ['TASK-01', 'TASK-03', 'TASK-04', 'TASK-05'];

    return {
      step0Tldr: s0,
      step1Tldr: s1,
      step2Tldr: s2,
      step3Tldr: s3,
      step4Tldr: s4,
      step5Tldr: s5,
      sequencingStrategy: 'Foundation-First with Vertical Slices (Core State -> Stage Gating -> Agents -> E2E QA)',
      tasks,
      qualityGates,
      criticalPath
    };
  }

  /**
   * Evaluates implementation plan and flags remaining decisions requiring user confirmation.
   */
  public static evaluate(_userInput: string, s0: string, s1: string, s2: string, s3: string, s4: string, s5: string): PlanningAnalysis {
    const draft = this.createEmptyDraft(s0, s1, s2, s3, s4, s5);
    const unresolvedPlanningAreas: string[] = [
      'Delivery Sequencing Strategy',
      'Test Automation Execution Priority',
      'Task Sizing & Granularity Threshold'
    ];

    return {
      draft,
      unresolvedPlanningAreas,
      completenessPercentage: 40
    };
  }
}
