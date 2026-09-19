/**
 * Types and interfaces for Agent 03: Feasibility, Constraints & Risk Architect.
 * Governs Step 2 Feasibility Assessment, Risk Management, and Top 3 Mitigation Options.
 */

export interface OptionChoice {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}

export interface ClarifyingQuestion {
  id: string;
  riskCategory: string;
  question: string;
  contextWhyNeeded: string;
  top3Options: [OptionChoice, OptionChoice, OptionChoice];
}

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FeasibilityVerdict = 'GO' | 'CONDITIONAL_GO' | 'RETURN_FOR_REQUIREMENTS' | 'NO_GO';

export interface RiskItem {
  id: string; // e.g. RISK-01
  title: string;
  category: 'TECHNICAL' | 'OPERATIONAL' | 'DEPENDENCY' | 'SCHEDULE' | 'DATA';
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  severity: RiskSeverity;
  mitigationStrategy: string;
  contingencyPlan: string;
}

export interface ConstraintItem {
  id: string; // e.g. CON-01
  type: 'TECHNICAL' | 'OPERATIONAL' | 'RESOURCE' | 'REGULATORY';
  description: string;
  impactOnSolution: string;
}

export interface DependencyItem {
  id: string; // e.g. DEP-01
  name: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  failureMode: string;
  fallbackOption: string;
}

export interface FeasibilityDimensionScore {
  dimension: string;
  status: 'FEASIBLE' | 'RISK_IDENTIFIED' | 'BLOCKING';
  notes: string;
}

export interface Step2FeasibilityDraft {
  step0Tldr: string;
  step1Tldr: string;
  dimensionScores: FeasibilityDimensionScore[];
  constraints: ConstraintItem[];
  dependencies: DependencyItem[];
  risks: RiskItem[];
  verdict: FeasibilityVerdict;
  verdictRationale: string;
}

export interface Agent03State {
  step0Tldr: string;
  step1Tldr: string;
  draft: Step2FeasibilityDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
