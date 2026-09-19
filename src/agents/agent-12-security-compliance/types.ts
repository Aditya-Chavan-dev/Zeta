export interface StrideThreat {
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
  threatDescription: string;
  impactedComponent: string;
  mitigationControl: string;
  residualRisk: 'LOW' | 'MEDIUM' | 'NEGLIGIBLE';
}

export interface SecretManagementPolicy {
  classification: 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL';
  storageMechanism: string;
  detectionRule: string;
  rotationPolicy: string;
}

export interface PrivacyDataControl {
  dataDomain: string;
  collectionPolicy: 'NO_COLLECTION' | 'LOCAL_EPHEMERAL_ONLY' | 'ANONYMIZED';
  egressBoundary: 'ZERO_CLOUD_EGRESS' | 'RESTRICTED_TELEMETRY';
  sanitizationRule: string;
}

export interface LicenseComplianceRecord {
  allowedLicenses: string[];
  bannedLicenses: string[];
  sbomGenerationTool: string;
  spdxFormat: string;
}

export interface VulnerabilitySlaPolicy {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  remediationWindowHours: number;
  blockCiPipeline: boolean;
}

export interface Step11SecurityComplianceDraft {
  strideThreats: StrideThreat[];
  secretsPolicies: SecretManagementPolicy[];
  privacyControls: PrivacyDataControl[];
  licenseCompliance: LicenseComplianceRecord;
  vulnerabilitySlas: VulnerabilitySlaPolicy[];
  cryptographicVerification: string[];
  unresolvedAreas: string[];
  step0IntentTldr: string;
  step1RequirementsTldr: string;
  step2FeasibilityTldr: string;
  step3TechStrategyTldr: string;
  step4ArchitectureTldr: string;
  step5DetailedDesignTldr: string;
  step6ImplementationPlanTldr: string;
  step7ReleaseCandidateTldr: string;
  step8VerificationQaTldr: string;
  step9ProductionReadinessTldr: string;
  step10OperationsSreTldr: string;
}

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
  top3Options: OptionChoice[];
}

export interface AgentResponse {
  step: number;
  isLocked: boolean;
  message: string;
  question?: ClarifyingQuestion;
  documentPath?: string;
  isReadyForSignoff?: boolean;
  error?: boolean;
}
