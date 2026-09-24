/**
 * Canonical 15-Stage Lifecycle Map (Stages 0–14 -> Agents 01–15).
 * Authoritative Single Source of Truth for stage transitions, primary artifacts, and prerequisites.
 */

export interface LifecycleStageDefinition {
  readonly stage: number; // 0 to 14
  readonly agentId: string; // "agent-01" to "agent-15"
  readonly agentName: string;
  readonly focusQuestion: string;
  readonly primaryArtifact: string;
  readonly documentPath: string;
  readonly requiresEvidence?: boolean;
}

export const CANONICAL_LIFECYCLE: readonly LifecycleStageDefinition[] = Object.freeze([
  {
    stage: 0,
    agentId: 'agent-01',
    agentName: 'Problem Definition & Intent',
    focusQuestion: 'Why should we build this, for whom, and what does success look like?',
    primaryArtifact: 'PROJECT_INTENT.md',
    documentPath: 'docs/PROJECT_INTENT.md'
  },
  {
    stage: 1,
    agentId: 'agent-02',
    agentName: 'Requirements Elicitation',
    focusQuestion: 'What must it accomplish functionally and non-functionally?',
    primaryArtifact: 'REQUIREMENTS_SPECIFICATION.md',
    documentPath: 'docs/REQUIREMENTS_SPECIFICATION.md'
  },
  {
    stage: 2,
    agentId: 'agent-03',
    agentName: 'Feasibility & Risk',
    focusQuestion: 'Can we realistically build it within technical and operational constraints?',
    primaryArtifact: 'FEASIBILITY_AND_RISK_REPORT.md',
    documentPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md'
  },
  {
    stage: 3,
    agentId: 'agent-04',
    agentName: 'Technology Strategy',
    focusQuestion: 'What runtime, storage, and frameworks should be standardized?',
    primaryArtifact: 'TECH_STACK_AND_STRATEGY.md',
    documentPath: 'docs/TECH_STACK_AND_STRATEGY.md'
  },
  {
    stage: 4,
    agentId: 'agent-05',
    agentName: 'System Architecture',
    focusQuestion: 'How is the solution decomposed into modules, contracts, and failure boundaries?',
    primaryArtifact: 'SYSTEM_ARCHITECTURE_BLUEPRINT.md',
    documentPath: 'docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md'
  },
  {
    stage: 5,
    agentId: 'agent-06',
    agentName: 'Detailed Technical Design',
    focusQuestion: 'Exactly how does each class, API method, and state machine transition work?',
    primaryArtifact: 'DETAILED_TECHNICAL_DESIGN.md',
    documentPath: 'docs/DETAILED_TECHNICAL_DESIGN.md'
  },
  {
    stage: 6,
    agentId: 'agent-07',
    agentName: 'Implementation Planning',
    focusQuestion: 'What is the sequenced work breakdown, quality gates, and critical path?',
    primaryArtifact: 'IMPLEMENTATION_PLAN_AND_WBS.md',
    documentPath: 'docs/IMPLEMENTATION_PLAN_AND_WBS.md'
  },
  {
    stage: 7,
    agentId: 'agent-08',
    agentName: 'Implementation & Construction',
    focusQuestion: 'Construct and unit-test the release candidate software.',
    primaryArtifact: 'IMPLEMENTED_RELEASE_CANDIDATE.md',
    documentPath: 'docs/IMPLEMENTED_RELEASE_CANDIDATE.md'
  },
  {
    stage: 8,
    agentId: 'agent-09',
    agentName: 'Verification & QA',
    focusQuestion: 'Did we build it correctly and does every acceptance gate pass?',
    primaryArtifact: 'VERIFICATION_AND_QA_PACKAGE.md',
    documentPath: 'docs/VERIFICATION_AND_QA_PACKAGE.md',
    requiresEvidence: true
  },
  {
    stage: 9,
    agentId: 'agent-10',
    agentName: 'Production Readiness & Deployment',
    focusQuestion: 'Is the system production-ready with release gates, rollback strategy, and observability?',
    primaryArtifact: 'PRODUCTION_READINESS_AND_DEPLOYMENT.md',
    documentPath: 'docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md',
    requiresEvidence: true
  },
  {
    stage: 10,
    agentId: 'agent-11',
    agentName: 'Operations, Maintenance & SRE',
    focusQuestion: 'How do we keep the system healthy with SLOs, incident response, and disaster recovery?',
    primaryArtifact: 'OPERATIONS_MAINTENANCE_AND_SRE.md',
    documentPath: 'docs/OPERATIONS_MAINTENANCE_AND_SRE.md',
    requiresEvidence: true
  },
  {
    stage: 11,
    agentId: 'agent-12',
    agentName: 'Security, Privacy & Compliance',
    focusQuestion: 'Is the system secured against threats with privacy controls and license compliance?',
    primaryArtifact: 'SECURITY_PRIVACY_AND_COMPLIANCE.md',
    documentPath: 'docs/SECURITY_PRIVACY_AND_COMPLIANCE.md',
    requiresEvidence: true
  },
  {
    stage: 12,
    agentId: 'agent-13',
    agentName: 'Governance, Lifecycle & Deprecation',
    focusQuestion: 'How do we version, deprecate, and evolve the system without breaking state?',
    primaryArtifact: 'GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md',
    documentPath: 'docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md',
    requiresEvidence: true
  },
  {
    stage: 13,
    agentId: 'agent-14',
    agentName: 'Knowledge Transfer & Documentation',
    focusQuestion: 'Is the system fully documented with onboarding, ADRs, and troubleshooting guides?',
    primaryArtifact: 'KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md',
    documentPath: 'docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md',
    requiresEvidence: true
  },
  {
    stage: 14,
    agentId: 'agent-15',
    agentName: 'Project Retrospective & Continuous Improvement',
    focusQuestion: 'What went well, what can improve, and what is the kaizen plan going forward?',
    primaryArtifact: 'PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md',
    documentPath: 'docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md',
    requiresEvidence: true
  }
]);

export class LifecycleRegistry {
  public static getStage(stage: number): LifecycleStageDefinition {
    const def = CANONICAL_LIFECYCLE.find(s => s.stage === stage);
    if (!def) {
      throw new Error(`Invalid lifecycle stage: ${stage}. Valid stages are 0 through 14.`);
    }
    return def;
  }

  public static getByAgentId(agentId: string): LifecycleStageDefinition {
    const def = CANONICAL_LIFECYCLE.find(s => s.agentId === agentId);
    if (!def) {
      throw new Error(`Unknown agent ID: ${agentId}`);
    }
    return def;
  }

  public static isLastStage(stage: number): boolean {
    return stage === 14;
  }

  public static getPrerequisiteStages(stage: number): number[] {
    return Array.from({ length: stage }, (_, i) => i);
  }
}
