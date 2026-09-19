/**
 * Types and interfaces for Agent 01: Problem Definition & Project Intent Architect.
 * Governs the 12 Step 0 domains, clarifying questions, and Top 3 options protocol.
 */

export interface OptionChoice {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}


export interface ClarifyingQuestion {
  id: string;
  domain: string;
  question: string;
  contextWhyNeeded: string;
  top3Options: [OptionChoice, OptionChoice, OptionChoice];
}

export interface ProblemSpaceData {
  problemIdentification?: string;
  problemStatement?: string;
  rootCauseAnalysis?: string;
  problemEvidence?: string;
  problemContext?: string;
  problemFrequencySeverity?: string;
  costOfInaction?: string;
}

export interface DomainEnvironmentData {
  domainUnderstanding?: string;
  businessProcesses?: string;
  businessRules?: string;
  currentStateAnalysis?: string;
  existingSystems?: string;
  existingAlternatives?: string;
  marketContext?: string;
  industryStandards?: string;
}

export interface PeopleStakeholdersData {
  userIdentification?: string;
  customerIdentification?: string;
  userPersonas?: string[];
  userPainPoints?: string[];
  stakeholders?: string[];
  decisionAuthority?: string;
  conflictingExpectations?: string;
}

export interface BusinessStrategicIntentData {
  businessObjective?: string;
  productObjective?: string;
  valueProposition?: string;
  expectedBusinessValue?: string;
  expectedUserValue?: string;
  strategicAlignment?: string;
  projectVision?: string;
  desiredOutcomes?: string[];
  futureStateVision?: string;
}

export interface ScopeBoundariesData {
  initialScope?: string[];
  outOfScope?: string[];
  scopeBoundaries?: string;
  futureDeferredScope?: string[];
  scopeChangePrinciples?: string;
}

export interface SuccessDefinitionData {
  successCriteria?: string[];
  successMetrics?: string[];
  businessKpis?: string[];
  userOutcomes?: string[];
  productOutcomes?: string[];
  qualityIndicators?: string[];
}

export interface AssumptionsConstraintsData {
  businessAssumptions?: string[];
  technicalAssumptions?: string[];
  knownConstraints?: string[];
  resourceConstraints?: string[];
  timelineConstraints?: string[];
  budgetConstraints?: string[];
  regulatoryConstraints?: string[];
  unknownsRisks?: string[];
}

export interface EcosystemData {
  dataContext?: string;
  dataOwnership?: string;
  existingTechLandscape?: string;
  dependencies?: string[];
  integrations?: string[];
}

export interface TrustComplianceData {
  securityContext?: string;
  privacyContext?: string;
  legalRequirements?: string;
  regulatoryRequirements?: string[];
  ethicalSafetyConsiderations?: string;
}

export interface OperationalImpactData {
  operationalContext?: string;
  supportExpectations?: string;
  monitoringReliability?: string;
  changeManagement?: string;
}

export interface EconomicsFeasibilityData {
  expectedInvestment?: string;
  expectedRoi?: string;
  opportunityCost?: string;
  highLevelResources?: string;
}

export interface DecisionFoundationData {
  alternativesConsidered?: string[];
  buildVsBuyReuse?: string;
  decisionPrinciples?: string[];
  criticalTradeOffs?: string[];
  goNoGoRecommendation?: 'GO' | 'NO_GO' | 'FURTHER_DISCOVERY';
}

export interface Step0IntentDraft {
  problemSpace: ProblemSpaceData;
  domainEnvironment: DomainEnvironmentData;
  peopleStakeholders: PeopleStakeholdersData;
  businessIntent: BusinessStrategicIntentData;
  scopeBoundaries: ScopeBoundariesData;
  successDefinition: SuccessDefinitionData;
  assumptionsConstraints: AssumptionsConstraintsData;
  ecosystem: EcosystemData;
  trustCompliance: TrustComplianceData;
  operationalImpact: OperationalImpactData;
  economicsFeasibility: EconomicsFeasibilityData;
  decisionFoundation: DecisionFoundationData;
}

export interface Agent01State {
  rawBrainDump: string;
  draft: Step0IntentDraft;
  unansweredQuestions: ClarifyingQuestion[];
  answeredQuestions: Record<string, string>;
  isComplete: boolean;
  completionPercentage: number;
}
