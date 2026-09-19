import { Step1RequirementsDraft, FunctionalRequirement, NonFunctionalRequirement } from './types.js';

export interface ElicitationAnalysis {
  draft: Step1RequirementsDraft;
  missingPillars: string[];
  completenessPercentage: number;
}

export class RequirementsElicitor {
  public static createEmptyDraft(step0Tldr: string): Step1RequirementsDraft {
    return {
      step0Tldr,
      targetUserPersonas: [],
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      dataRequirements: [],
      integrationRequirements: [],
      outOfScopeItems: ['Legacy codebase reverse-engineering', 'Cloud-hosted background daemons']
    };
  }

  /**
   * Parses user input and populates initial requirements draft.
   */
  public static analyze(input: string, step0Tldr: string): ElicitationAnalysis {
    const draft = this.createEmptyDraft(step0Tldr);
    const text = input.trim();

    // Extract functional features
    const featureMatches = text.match(/(?:feature|must have|should have|needs to|ability to|allow user to|system shall) ([^.!?\n]+)/gi);
    if (featureMatches) {
      featureMatches.forEach((f, idx) => {
        const cleaned = f.replace(/^(?:feature|must have|should have|needs to|ability to|allow user to|system shall)\s+/i, '').trim();
        draft.functionalRequirements.push({
          id: `FR-${String(idx + 1).padStart(2, '0')}`,
          title: cleaned,
          userStory: `As a developer, I want ${cleaned} so that the system maintains engineering governance.`,
          acceptanceCriteria: [
            `System executes ${cleaned} predictably without errors.`,
            `User receives unambiguous feedback upon execution.`
          ],
          priority: 'MUST_HAVE'
        });
      });
    } else {
      // Default core functional requirement
      draft.functionalRequirements.push({
        id: 'FR-01',
        title: 'Core Governance Lifecycle Workflow',
        userStory: `As an engineer, I want disciplined step-by-step lifecycle gating so that architecture does not decay.`,
        acceptanceCriteria: [
          'Stages lock sequentially with explicit approval.',
          'State persists across turns and interruptions.'
        ],
        priority: 'MUST_HAVE'
      });
    }

    // Extract performance / latency signals
    if (/latency|speed|response time|fast|milliseconds|ms/i.test(text)) {
      draft.nonFunctionalRequirements.push({
        id: 'NFR-01',
        category: 'PERFORMANCE',
        title: 'Low-latency Turn Execution',
        metric: 'Turn Processing Latency',
        targetThreshold: '< 200ms for local state operations',
        priority: 'MUST_HAVE'
      });
    }

    // Extract reliability / persistence signals
    if (/persistence|atomic|crash|recovery|save|storage/i.test(text)) {
      draft.nonFunctionalRequirements.push({
        id: 'NFR-02',
        category: 'RELIABILITY',
        title: 'Crash-resilient State Persistence',
        metric: 'Data Loss on Process Termination',
        targetThreshold: '0 uncommitted turns lost (100% recovery)',
        priority: 'MUST_HAVE'
      });
    }

    // Check missing requirement pillars
    const missingPillars: string[] = [];
    if (!draft.nonFunctionalRequirements.some(r => r.category === 'PERFORMANCE')) {
      missingPillars.push('Performance & Latency');
    }
    if (!draft.nonFunctionalRequirements.some(r => r.category === 'RELIABILITY')) {
      missingPillars.push('Reliability & Recovery');
    }
    if (!draft.nonFunctionalRequirements.some(r => r.category === 'SECURITY')) {
      missingPillars.push('Security & Access Boundary');
    }
    if (draft.dataRequirements.length === 0) {
      missingPillars.push('Data Persistence & Lifecycle');
    }

    const totalTracked = 4;
    const answeredCount = totalTracked - missingPillars.length;
    const completenessPercentage = Math.round((answeredCount / totalTracked) * 100);

    return {
      draft,
      missingPillars,
      completenessPercentage
    };
  }
}
