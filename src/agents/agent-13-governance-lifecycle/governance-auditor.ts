import {
  Step12GovernanceLifecycleDraft,
  SemVerRule,
  DeprecationPhase,
  SchemaMigrationContract,
  ArchitecturalDriftGuardrail
} from './types.js';

export class GovernanceAuditor {
  /**
   * Initializes baseline governance and lifecycle policy from upstream TL;DRs.
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
    step10Tldr: string,
    step11Tldr: string
  ): Step12GovernanceLifecycleDraft {
    const semVerRules: SemVerRule[] = [
      {
        level: 'MAJOR',
        condition: 'Breaking changes to public API, .zeta/state.json schema alterations without upward compatibility, or stage gate structural removals',
        deprecationRequired: true,
        minDeprecationCycles: 2 // Minimum 2 minor release cycles before hard removal
      },
      {
        level: 'MINOR',
        condition: 'Backward-compatible additions, new optional agent features, or schema additions with default fallbacks',
        deprecationRequired: false,
        minDeprecationCycles: 0
      },
      {
        level: 'PATCH',
        condition: 'Bug fixes, internal refactoring, non-breaking performance optimizations, and documentation edits',
        deprecationRequired: false,
        minDeprecationCycles: 0
      }
    ];

    const deprecationPhases: DeprecationPhase[] = [
      {
        phaseName: 'Announcement & Warning',
        durationWeeks: 4,
        runtimeBehavior: 'Functionality operates normally; static compilation warning emitted during build',
        migrationAssistance: 'Provide replacement API symbol name and automated codemod snippet'
      },
      {
        phaseName: 'Soft Deprecation',
        durationWeeks: 8,
        runtimeBehavior: 'Runtime console warning on first invocation per session; operation succeeds',
        migrationAssistance: 'Interactive CLI deprecation notice with automated migration prompt'
      },
      {
        phaseName: 'Hard Deprecation',
        durationWeeks: 4,
        runtimeBehavior: 'Throws DeprecatedFeatureError unless explicit opt-in flag `--allow-deprecated` is set',
        migrationAssistance: 'Blocking error message with link to migration guide in docs/'
      },
      {
        phaseName: 'Complete Sunsetting & Removal',
        durationWeeks: 0,
        runtimeBehavior: 'Code and schema fields completely removed from source tree',
        migrationAssistance: 'Archived changelog documentation'
      }
    ];

    const schemaMigrations: SchemaMigrationContract[] = [
      {
        fromVersion: 'v1.0.0',
        toVersion: 'v1.1.0',
        migrationMechanism: 'In-place idempotent schema transformation executed by StateManager on startup',
        rollbackGuaranteed: true,
        dataTransformRule: 'Ensure newly introduced fields default to empty arrays or backward-compatible defaults'
      }
    ];

    const driftGuardrails: ArchitecturalDriftGuardrail[] = [
      {
        guardrailName: 'Invariant Alignment Guardrail',
        enforcementMechanism: 'Automated turn validator checking against Step 0 Intent and Step 4 Architecture',
        toleranceLimit: '0 unapproved deviations from approved tech stack or core principles',
        breachAction: 'Block turn signoff and surface Top 3 trade-off questions'
      },
      {
        guardrailName: 'Cryptographic State Immutability',
        enforcementMechanism: 'SHA-256 integrity verification of locked step files on load',
        toleranceLimit: '0 hash mismatches permitted',
        breachAction: 'Flag corrupted step as tampered and trigger SEV-1 SRE recovery'
      }
    ];

    return {
      semVerRules,
      deprecationPhases,
      schemaMigrations,
      driftGuardrails,
      backwardCompatibilityGuarantee: 'N-1 Major Version Schema Support & 100% Backward Compatibility across Minor/Patch',
      unresolvedAreas: [
        'Breaking Change Notice & Deprecation Timeline',
        'State Schema Migration & Rollback Guarantee',
        'Architectural Drift Detection & Enforcement Policy'
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
      step10OperationsSreTldr: step10Tldr,
      step11SecurityComplianceTldr: step11Tldr
    };
  }

  /**
   * Applies user answers to refine the governance draft.
   */
  public static applyAnswer(draft: Step12GovernanceLifecycleDraft, area: string, answer: string): void {
    draft.unresolvedAreas = draft.unresolvedAreas.filter(a => a !== area);
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());

    if (area === 'Breaking Change Notice & Deprecation Timeline') {
      if (isNegative) {
        draft.deprecationPhases = [];
      } else if (answer.includes('2') || answer.toLowerCase().includes('accelerated')) {
        draft.deprecationPhases[0].durationWeeks = 2;
        draft.deprecationPhases[1].durationWeeks = 4;
      } else if (answer.includes('3') || answer.toLowerCase().includes('extended')) {
        draft.deprecationPhases[0].durationWeeks = 8;
        draft.deprecationPhases[1].durationWeeks = 16;
      }
    } else if (area === 'State Schema Migration & Rollback Guarantee') {
      if (isNegative) {
        draft.schemaMigrations[0].migrationMechanism = 'None (Single-version schema, no migration overhead)';
        draft.schemaMigrations[0].rollbackGuaranteed = false;
      } else if (answer.includes('2') || answer.toLowerCase().includes('backup-only')) {
        draft.schemaMigrations[0].migrationMechanism = 'Snapshot backup and complete rewrite without rollback guarantee';
        draft.schemaMigrations[0].rollbackGuaranteed = false;
      } else if (answer.includes('3') || answer.toLowerCase().includes('immutable')) {
        draft.backwardCompatibilityGuarantee = 'Indefinite backward compatibility across all historical versions';
      } else if (answer.trim()) {
        draft.schemaMigrations[0].migrationMechanism = `Custom: ${answer.trim()}`;
      }
    } else if (area === 'Architectural Drift Detection & Enforcement Policy') {
      if (isNegative) {
        draft.driftGuardrails[0].breachAction = 'Ignore drift (Architectural enforcement disabled by user)';
      } else if (answer.includes('2') || answer.toLowerCase().includes('warning')) {
        draft.driftGuardrails[0].breachAction = 'Emit non-blocking warning in UI without halting execution';
      } else if (answer.includes('3') || answer.toLowerCase().includes('strict')) {
        draft.driftGuardrails[0].breachAction = 'Hard failure requiring explicit architectural waiver commit';
      } else if (answer.trim()) {
        draft.driftGuardrails[0].breachAction = `Custom: ${answer.trim()}`;
      }
    }
  }
}
