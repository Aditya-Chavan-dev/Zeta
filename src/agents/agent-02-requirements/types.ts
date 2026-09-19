/**
 * Types and interfaces for Agent 02: Requirements Gathering & Elicitation Architect.
 * Governs Step 1 Requirements Engineering, Functional/Non-Functional pillars, and Top 3 options.
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

export type RequirementPriority = 'MUST_HAVE' | 'SHOULD_HAVE' | 'COULD_HAVE' | 'WONT_HAVE';

export interface FunctionalRequirement {
  id: string; // e.g. FR-01
  title: string;
  userStory: string;
  acceptanceCriteria: string[];
  priority: RequirementPriority;
  inputs?: string[];
  outputs?: string[];
  edgeCases?: string[];
}

export interface NonFunctionalRequirement {
  id: string; // e.g. NFR-01
  category: 'PERFORMANCE' | 'RELIABILITY' | 'SECURITY' | 'PRIVACY' | 'USABILITY' | 'MAINTAINABILITY';
  title: string;
  metric: string;
  targetThreshold: string;
  priority: RequirementPriority;
}

export interface DataRequirement {
  id: string;
  entityName: string;
  description: string;
  persistenceModel: string;
  retentionPolicy: string;
}

export interface IntegrationRequirement {
  id: string;
  systemName: string;
  interfaceType: string;
  failureBehavior: string;
}

export interface Step1RequirementsDraft {
  step0Tldr: string;
  targetUserPersonas: string[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  dataRequirements: DataRequirement[];
  integrationRequirements: IntegrationRequirement[];
  outOfScopeItems: string[];
}

export interface Agent02State {
  step0Tldr: string;
  draft: Step1RequirementsDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
