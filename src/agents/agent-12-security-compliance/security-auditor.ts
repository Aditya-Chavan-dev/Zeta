import {
  Step11SecurityComplianceDraft,
  StrideThreat,
  SecretManagementPolicy,
  PrivacyDataControl,
  LicenseComplianceRecord,
  VulnerabilitySlaPolicy
} from './types.js';

export class SecurityAuditor {
  /**
   * Initializes baseline security and compliance model from upstream TL;DRs.
   */
  public static createEmptyDraft(
    step0Tldr: string,
    step1Tldr: string,
    step2Tldr: string,
    step3Tldr: string,
    step4Tldr: string,
    step5Tldr: string,
    step6Tldr: string,
    step7Tldr: string,
    step8Tldr: string,
    step9Tldr: string,
    step10Tldr: string
  ): Step11SecurityComplianceDraft {
    const strideThreats: StrideThreat[] = [
      {
        category: 'Tampering',
        threatDescription: 'Unauthorized modification of .zeta/state.json or compiled docs/ specifications',
        impactedComponent: 'StateManager / Disk Governance Store',
        mitigationControl: 'Cryptographic SHA-256 digest validation recorded on step lock and cross-checked on load',
        residualRisk: 'NEGLIGIBLE'
      },
      {
        category: 'Information Disclosure',
        threatDescription: 'Sensitive API tokens or customer code fragments inadvertently written to logs or artifacts',
        impactedComponent: 'ArtifactCompiler & Error Logger',
        mitigationControl: 'Automated regex token scrubber redacting patterns before writing to disk',
        residualRisk: 'LOW'
      },
      {
        category: 'Denial of Service',
        threatDescription: 'File-lock starvation or recursive turn loops causing process hang',
        impactedComponent: 'Turn Execution Engine',
        mitigationControl: 'Bounded turn timeouts (10s max) and 5-retry exponential backoff on file operations',
        residualRisk: 'NEGLIGIBLE'
      },
      {
        category: 'Elevation of Privilege',
        threatDescription: 'Unsanitized user prompt triggering arbitrary shell execution',
        impactedComponent: 'Agent Input Dispatcher',
        mitigationControl: 'Strict parameterized execution; no eval() or dynamic bash generation',
        residualRisk: 'NEGLIGIBLE'
      }
    ];

    const secretsPolicies: SecretManagementPolicy[] = [
      {
        classification: 'RESTRICTED',
        storageMechanism: 'Environment variable injection or OS-level credential vault (never committed to repo)',
        detectionRule: 'Pre-commit and CI git-secrets / gitleaks regex scan matching API keys and private keys',
        rotationPolicy: '90-day mandatory rotation with immediate revocation upon exposure'
      }
    ];

    const privacyControls: PrivacyDataControl[] = [
      {
        dataDomain: 'User Source Code & Architecture Documents',
        collectionPolicy: 'LOCAL_EPHEMERAL_ONLY',
        egressBoundary: 'ZERO_CLOUD_EGRESS',
        sanitizationRule: 'All governance and analysis executed locally within workspace sandbox; zero external cloud egress'
      },
      {
        dataDomain: 'Session Diagnostics & Crash Telemetry',
        collectionPolicy: 'LOCAL_EPHEMERAL_ONLY',
        egressBoundary: 'ZERO_CLOUD_EGRESS',
        sanitizationRule: 'Local .zeta/crashes.log only; all file paths and user tokens scrubbed'
      }
    ];

    const licenseCompliance: LicenseComplianceRecord = {
      allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
      bannedLicenses: ['GPL-3.0', 'AGPL-3.0', 'SSPL'],
      sbomGenerationTool: 'CycloneDX / NPM License Checker',
      spdxFormat: 'SPDX 2.3 JSON Specification'
    };

    const vulnerabilitySlas: VulnerabilitySlaPolicy[] = [
      {
        severity: 'CRITICAL',
        remediationWindowHours: 24,
        blockCiPipeline: true
      },
      {
        severity: 'HIGH',
        remediationWindowHours: 72,
        blockCiPipeline: true
      },
      {
        severity: 'MEDIUM',
        remediationWindowHours: 336, // 14 days
        blockCiPipeline: false
      },
      {
        severity: 'LOW',
        remediationWindowHours: 720, // 30 days
        blockCiPipeline: false
      }
    ];

    return {
      strideThreats,
      secretsPolicies,
      privacyControls,
      licenseCompliance,
      vulnerabilitySlas,
      cryptographicVerification: [
        'SHA-256 digest validation for all locked steps in .zeta/state.json',
        'Deterministic serialization of state objects to prevent false-positive drift',
        'Sub-resource integrity checks for third-party build tooling'
      ],
      unresolvedAreas: [
        'STRIDE Threat Mitigation & Residual Risk Tolerance',
        'Data Privacy & Local Sandboxing Boundary',
        'Open-Source License & SBOM Policy'
      ],
      step0IntentTldr: step0Tldr,
      step1RequirementsTldr: step1Tldr,
      step2FeasibilityTldr: step2Tldr,
      step3TechStrategyTldr: step3Tldr,
      step4ArchitectureTldr: step4Tldr,
      step5DetailedDesignTldr: step5Tldr,
      step6ImplementationPlanTldr: step6Tldr,
      step7ReleaseCandidateTldr: step7Tldr,
      step8VerificationQaTldr: step8Tldr,
      step9ProductionReadinessTldr: step9Tldr,
      step10OperationsSreTldr: step10Tldr
    };
  }

  /**
   * Applies user answers to refine the security draft.
   */
  public static applyAnswer(draft: Step11SecurityComplianceDraft, area: string, answer: string): void {
    draft.unresolvedAreas = draft.unresolvedAreas.filter(a => a !== area);
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());

    if (area === 'STRIDE Threat Mitigation & Residual Risk Tolerance') {
      if (isNegative) {
        draft.vulnerabilitySlas[0].blockCiPipeline = false;
        draft.vulnerabilitySlas[1].blockCiPipeline = false;
        draft.vulnerabilitySlas[2].blockCiPipeline = false;
      } else if (answer.includes('2') || answer.toLowerCase().includes('strict')) {
        draft.vulnerabilitySlas[2].blockCiPipeline = true; // Medium also blocks
      } else if (answer.includes('3') || answer.toLowerCase().includes('permissive')) {
        draft.vulnerabilitySlas[1].blockCiPipeline = false; // High does not block
      } else {
        // Default Option 1: Dangerous block + weekly cleanup reminder for minor warnings
        draft.vulnerabilitySlas[0].blockCiPipeline = true; // Critical blocks
        draft.vulnerabilitySlas[1].blockCiPipeline = true; // High blocks
        draft.vulnerabilitySlas[2].blockCiPipeline = false; // Medium reports
        draft.vulnerabilitySlas[3].blockCiPipeline = false; // Low reports
        draft.weeklyHygieneCadence = 'Weekly automated reminder to clean up Medium & Low vulnerabilities so technical debt does not accumulate.';
      }
    } else if (area === 'Data Privacy & Local Sandboxing Boundary') {
      if (isNegative) {
        draft.privacyControls[0].sanitizationRule = 'Standard local file handling (no custom sandboxing)';
      } else if (answer.includes('2') || answer.toLowerCase().includes('isolated')) {
        draft.privacyControls[0].sanitizationRule = 'Air-gapped offline environment with strict socket disconnect';
      } else if (answer.includes('3') || answer.toLowerCase().includes('cloud')) {
        draft.privacyControls[0].egressBoundary = 'RESTRICTED_TELEMETRY';
      } else if (answer.trim()) {
        draft.privacyControls[0].sanitizationRule = `Custom: ${answer.trim()}`;
      }
    } else if (area === 'Open-Source License & SBOM Policy') {
      if (isNegative) {
        draft.licenseCompliance.allowedLicenses = ['Unrestricted / User-directed'];
      } else if (answer.includes('2') || answer.toLowerCase().includes('permissive')) {
        draft.licenseCompliance.allowedLicenses.push('MPL-2.0');
      } else if (answer.includes('3') || answer.toLowerCase().includes('mit-only')) {
        draft.licenseCompliance.allowedLicenses = ['MIT'];
      } else if (answer.trim()) {
        draft.licenseCompliance.allowedLicenses.push(`Custom: ${answer.trim()}`);
      }
    }
  }
}
