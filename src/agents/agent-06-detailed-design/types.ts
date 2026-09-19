/**
 * Types and interfaces for Agent 06: Detailed Technical Design & Engineering Design Architect.
 * Governs Step 5 Technical Design, Module Specifications, State Machine Models, and Standardized Error Taxonomy.
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

export interface ModuleInterfaceSpec {
  moduleName: string;
  filePath: string;
  publicMethods: {
    name: string;
    signature: string;
    description: string;
  }[];
  dependencies: string[];
}

export interface StateMachineTransition {
  fromState: string;
  trigger: string;
  toState: string;
  guardCondition: string;
  sideEffect: string;
}

export interface StandardErrorCodeSpec {
  code: string; // e.g. ERR_PRECONDITION_FAILED
  category: 'PRECONDITION' | 'PERSISTENCE' | 'DRIFT' | 'VALIDATION';
  description: string;
  httpStatusEquivalent: number;
  recoveryGuidance: string;
}

export interface Step5DetailedDesignDraft {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  modules: ModuleInterfaceSpec[];
  stateTransitions: StateMachineTransition[];
  errorCodes: StandardErrorCodeSpec[];
  concurrencyLockProtocol: string;
}

export interface Agent06State {
  step0Tldr: string;
  step1Tldr: string;
  step2Tldr: string;
  step3Tldr: string;
  step4Tldr: string;
  draft: Step5DetailedDesignDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
