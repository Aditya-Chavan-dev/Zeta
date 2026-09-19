import { Step2FeasibilityDraft, RiskItem, ConstraintItem, DependencyItem, FeasibilityDimensionScore } from './types.js';

export interface EvaluationResult {
  draft: Step2FeasibilityDraft;
  unresolvedRiskAreas: string[];
  completenessPercentage: number;
}

export class FeasibilityEvaluator {
  public static createEmptyDraft(step0Tldr: string, step1Tldr: string): Step2FeasibilityDraft {
    const dimensionScores: FeasibilityDimensionScore[] = [
      { dimension: 'Technical Feasibility', status: 'FEASIBLE', notes: 'Pure TypeScript local node engine without external daemons' },
      { dimension: 'Operational Feasibility', status: 'FEASIBLE', notes: 'Zero background daemon overhead; local file-based persistence' },
      { dimension: 'Resource & Capacity Feasibility', status: 'FEASIBLE', notes: 'Self-contained single-repository modular architecture' },
      { dimension: 'Security & Trust Feasibility', status: 'FEASIBLE', notes: 'Air-gapped local execution within workspace root' }
    ];

    const constraints: ConstraintItem[] = [
      { id: 'CON-01', type: 'TECHNICAL', description: 'Pure local execution with zero third-party daemon processes', impactOnSolution: 'Requires synchronous / atomic file I/O within IDE process' },
      { id: 'CON-02', type: 'OPERATIONAL', description: 'Per-turn atomic state writes to .zeta/state.json', impactOnSolution: 'Requires temporary file + rename write pattern to avoid corruption' },
      { id: 'CON-03', type: 'RESOURCE', description: 'Greenfield project scope only', impactOnSolution: 'Legacy reverse-engineering is strictly excluded' }
    ];

    const dependencies: DependencyItem[] = [
      { id: 'DEP-01', name: 'Local File System (Node.js fs)', criticality: 'CRITICAL', failureMode: 'Permission denied or disk full', fallbackOption: 'Halt turn and alert user with actionable OS error' },
      { id: 'DEP-02', name: 'IDE Extension Host / CLI Runtime', criticality: 'CRITICAL', failureMode: 'Process abruptly killed', fallbackOption: 'Startup ResumeSentinel automatically recovers uncommitted turn' }
    ];

    return {
      step0Tldr,
      step1Tldr,
      dimensionScores,
      constraints,
      dependencies,
      risks: [],
      verdict: 'GO',
      verdictRationale: 'Architecture and requirements are highly feasible within local-first node runtime.'
    };
  }

  /**
   * Evaluates requirements against risk vectors and identifies critical risks.
   */
  public static evaluate(userInput: string, step0Tldr: string, step1Tldr: string): EvaluationResult {
    const draft = this.createEmptyDraft(step0Tldr, step1Tldr);

    // Initial default baseline risk: State Corruption on Abrupt Termination
    draft.risks.push({
      id: 'RISK-01',
      title: 'State Corruption on Process Abrupt Termination',
      category: 'TECHNICAL',
      probability: 'MEDIUM',
      impact: 'HIGH',
      severity: 'HIGH',
      mitigationStrategy: 'Write-ahead atomic journaling using temp file + atomic rename.',
      contingencyPlan: 'Fall back to .zeta/state.json.tmp if main file is malformed.'
    });

    const unresolvedRiskAreas: string[] = [
      'State Drift & Schema Migration Risk',
      'Turn Latency & IDE Event Loop Blocking',
      'Dependency & Local File Permission Failure'
    ];

    return {
      draft,
      unresolvedRiskAreas,
      completenessPercentage: 25
    };
  }
}
