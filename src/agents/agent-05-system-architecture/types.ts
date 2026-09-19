/**
 * Types and interfaces for Agent 05: System Architecture & Solution Design Architect.
 * Governs Step 4 System Architecture, Component Decomposition, C4/Mermaid Blueprints, ADRs, and FMEA.
 */

export interface OptionChoice {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}

export interface ClarifyingQuestion {
  id: string;
  category: string;
  question: string;
  contextWhyNeeded: string;
  top3Options: [OptionChoice, OptionChoice, OptionChoice];
}

export interface ArchitecturalComponent {
  id: string;
  name: string;
  layer: 'RUNTIME_BRIDGE' | 'GOVERNANCE_ENGINE' | 'STATE_PERSISTENCE' | 'AGENT_DISPATCHER';
  responsibility: string;
  inputs: string[];
  outputs: string[];
  failureBehavior: string;
}

export interface ArchitectureDecisionRecord {
  id: string; // e.g. ADR-01
  title: string;
  status: 'ACCEPTED' | 'PROPOSED' | 'SUPERSEDED';
  context: string;
  decision: string;
  consequences: string;
}

export interface FailureScenario {
  id: string; // e.g. FMEA-01
  component: string;
  failureTrigger: string;
  impactSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  containmentStrategy: string;
  recoveryProcedure: string;
}

export interface Step4ArchitectureDraft {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  architectureStyle: string;
  components: ArchitecturalComponent[];
  adrs: ArchitectureDecisionRecord[];
  fmeaScenarios: FailureScenario[];
  mermaidC4Diagram: string;
}

export interface Agent05State {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  draft: Step4ArchitectureDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
