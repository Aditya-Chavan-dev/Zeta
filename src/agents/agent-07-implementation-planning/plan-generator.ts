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
        title: 'Project Scaffolding & Core Foundation Setup',
        phase: 'Phase 1: Foundation',
        estimatedHours: 4,
        dependencies: [],
        definitionOfReady: 'Approved detailed technical design specifications.',
        definitionOfDone: 'Project repository initialized with build configuration, linter, and base types.'
      },
      {
        id: 'TASK-02',
        title: 'Implement Data Layer & Storage Repositories',
        phase: 'Phase 2: Persistence',
        estimatedHours: 6,
        dependencies: ['TASK-01'],
        definitionOfReady: 'Database schema and repository method signatures defined.',
        definitionOfDone: 'Data repositories passing atomic persistence and load/save unit tests.'
      },
      {
        id: 'TASK-03',
        title: 'Implement Core Domain Logic & Business Rules',
        phase: 'Phase 3: Domain Services',
        estimatedHours: 10,
        dependencies: ['TASK-02'],
        definitionOfReady: 'Precondition verifier contracts and business rules documented.',
        definitionOfDone: 'Domain services execute business logic and pass all domain test cases.'
      },
      {
        id: 'TASK-04',
        title: 'Build Application Interfaces & User Controllers',
        phase: 'Phase 4: Client & API Interfaces',
        estimatedHours: 8,
        dependencies: ['TASK-03'],
        definitionOfReady: 'API/CLI input schemas and validation rules approved.',
        definitionOfDone: 'Controllers handle user requests with input validation and clean error responses.'
      },
      {
        id: 'TASK-05',
        title: 'End-to-End System Integration & QA Test Suite',
        phase: 'Phase 5: Verification & Packaging',
        estimatedHours: 6,
        dependencies: ['TASK-04'],
        definitionOfReady: 'All core domain services and interface controllers implemented.',
        definitionOfDone: 'End-to-end integration tests pass 100% with regression test suite.'
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
