import { Step0IntentDraft } from './types.js';

export interface AnalysisResult {
  draft: Step0IntentDraft;
  missingDomains: string[];
  completenessPercentage: number;
}

export class IntentAnalyzer {
  public static createEmptyDraft(): Step0IntentDraft {
    return {
      problemSpace: {},
      domainEnvironment: {},
      peopleStakeholders: {},
      businessIntent: {},
      scopeBoundaries: {},
      successDefinition: {},
      assumptionsConstraints: {},
      ecosystem: {},
      trustCompliance: {},
      operationalImpact: {},
      economicsFeasibility: {},
      decisionFoundation: {}
    };
  }

  /**
   * Analyzes raw brain-dump text and extracts structured initial assumptions across 12 domains.
   */
  public static analyze(rawBrainDump: string): AnalysisResult {
    const text = rawBrainDump.trim();
    const draft = this.createEmptyDraft();

    if (!text) {
      return {
        draft,
        missingDomains: [
          'Problem Space',
          'Domain & Environment',
          'People & Stakeholders',
          'Business Intent',
          'Scope & Boundaries',
          'Success Definition',
          'Constraints & Assumptions',
          'Ecosystem Context',
          'Trust & Security',
          'Operations & Support',
          'Economics & ROI',
          'Decision Principles'
        ],
        completenessPercentage: 0
      };
    }

    // Extract Problem Space signals
    const problemMatch = text.match(/(?:problem is|issue is|trying to solve|pain point|frustration|because|struggling with) ([^.!?\n]+)/i);
    if (problemMatch) {
      draft.problemSpace.problemIdentification = problemMatch[1].trim();
      draft.problemSpace.problemStatement = `The current workflow suffers from ${problemMatch[1].trim()}`;
    } else {
      draft.problemSpace.problemIdentification = text.slice(0, 150);
    }

    // Extract User signals
    const userMatch = text.match(/(?:for|target user|users are|built for|developers|engineers|customers|clients) ([^.!?\n]+)/i);
    if (userMatch) {
      draft.peopleStakeholders.userIdentification = userMatch[1].trim();
      draft.peopleStakeholders.userPersonas = [userMatch[1].trim()];
    }

    // Extract Product/Vision signals
    const visionMatch = text.match(/(?:i want to build|the idea is|goal is|vision is|project will be|it is a) ([^.!?\n]+)/i);
    if (visionMatch) {
      draft.businessIntent.projectVision = visionMatch[1].trim();
      draft.businessIntent.valueProposition = visionMatch[1].trim();
    } else {
      draft.businessIntent.projectVision = text.slice(0, 120);
    }

    // Extract Scope / Features mentioned
    const scopeMatch = text.match(/(?:it should|features include|it will|must have|needs to) ([^.!?\n]+)/i);
    if (scopeMatch) {
      draft.scopeBoundaries.initialScope = [scopeMatch[1].trim()];
    }

    // Identify missing core domains
    const missingDomains: string[] = [];

    if (!draft.problemSpace.problemStatement) missingDomains.push('Problem Space');
    if (!draft.peopleStakeholders.userIdentification) missingDomains.push('People & Stakeholders');
    if (!draft.businessIntent.valueProposition) missingDomains.push('Business Intent');
    if (!draft.scopeBoundaries.initialScope || draft.scopeBoundaries.initialScope.length === 0) {
      missingDomains.push('Scope & Boundaries');
    }
    if (!draft.successDefinition.successCriteria) missingDomains.push('Success Definition');
    if (!draft.assumptionsConstraints.knownConstraints) missingDomains.push('Constraints & Assumptions');
    if (!draft.trustCompliance.securityContext) missingDomains.push('Trust & Security');
    if (!draft.operationalImpact.operationalContext) missingDomains.push('Operations & Support');

    const totalTrackedDomains = 8;
    const answeredCount = totalTrackedDomains - missingDomains.length;
    const completenessPercentage = Math.round((answeredCount / totalTrackedDomains) * 100);

    return {
      draft,
      missingDomains,
      completenessPercentage
    };
  }
}
