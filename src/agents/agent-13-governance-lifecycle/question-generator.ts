import { ClarifyingQuestion, OptionChoice, Step12GovernanceLifecycleDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a lifecycle/governance area.
   */
  public static generateForArea(area: string, draft: Step12GovernanceLifecycleDraft): ClarifyingQuestion {
    switch (area) {
      case 'Breaking Change Notice & Deprecation Timeline':
        return {
          id: 'q-gov-deprecation',
          category: 'Breaking Change Notice & Deprecation Timeline',
          question: 'What lifecycle notice window should precede any breaking API or schema deprecation?',
          contextWhyNeeded: 'Protects developer projects and automated pipelines from unexpected breakage across upgrades.',
          top3Options: [
            {
              title: 'Standard 16-Week Multi-Phase Window (Recommended)',
              description: '4 weeks announcement warning + 8 weeks soft runtime deprecation + 4 weeks hard opt-in deprecation before removal in next MAJOR version.',
              tradeOffs: 'Provides ample notice for enterprise developers to adapt; maintains clear predictability.',
              recommended: true
            },
            {
              title: 'Accelerated 6-Week Window (Rapid Lifecycle Iteration)',
              description: '2 weeks warning + 4 weeks soft deprecation; sunset in immediate subsequent minor or major release.',
              tradeOffs: 'Faster codebase cleanup; higher risk of breaking active developer setups that upgrade frequently.'
            },
            {
              title: 'Extended 6-Month Enterprise Long-Term Support (LTS)',
              description: '6-month deprecation period with dual-version maintenance before sunsetting.',
              tradeOffs: 'Maximum stability; increases code bloat and maintenance overhead for backward compatibility shims.'
            }
          ]
        };

      case 'State Schema Migration & Rollback Guarantee':
        return {
          id: 'q-gov-migration',
          category: 'State Schema Migration & Rollback Guarantee',
          question: 'How should .zeta/state.json schema migrations handle backward compatibility and rollbacks?',
          contextWhyNeeded: 'Ensures existing project states upgrade seamlessly without risk of irreversible data corruption.',
          top3Options: [
            {
              title: 'Idempotent In-Place Migration with Two-Way Snapshot Rollback (Recommended)',
              description: 'Automatically migrate schema on startup; write .zeta/state.json.vN backup prior to transformation; guarantee deterministic rollback.',
              tradeOffs: 'Zero user intervention; guaranteed recovery if new schema encounters parsing issues.',
              recommended: true
            },
            {
              title: 'One-Way Destructive Migration with Backup File Only',
              description: 'Upgrade schema irreversibly; keep snapshot for manual recovery if needed.',
              tradeOffs: 'Simpler migration code; requires manual developer file restoration if rolling back IDE versions.'
            },
            {
              title: 'Additive-Only Strict Immutability (No field renaming/removal permitted)',
              description: 'Never modify or delete existing schema fields; only permit appending optional fields.',
              tradeOffs: 'Perfect backward compatibility; schema accumulates legacy deprecated fields indefinitely.'
            }
          ]
        };

      case 'Architectural Drift Detection & Enforcement Policy':
      default:
        return {
          id: 'q-gov-drift',
          category: 'Architectural Drift Detection & Enforcement Policy',
          question: 'What enforcement policy should trigger when an active implementation drifts from the approved baseline?',
          contextWhyNeeded: 'Prevents gradual architectural decay and technical debt accumulation during subsequent development phases.',
          top3Options: [
            {
              title: 'Interactive Gated Drift Resolution with Top 3 Trade-Offs (Recommended)',
              description: 'Detect drift against Step 0 (Intent) and Step 4 (Architecture); block signoff and present Top 3 options (Realign / Update Architecture / Exception Waiver).',
              tradeOffs: 'Balances strict architectural governance with practical real-world implementation discoveries.',
              recommended: true
            },
            {
              title: 'Strict Immediate Build Failure (Zero Drift Tolerance)',
              description: 'Fail CI/CD builds and turn commits immediately if any unapproved dependency or pattern is detected.',
              tradeOffs: 'Zero architectural drift; can frustrate developers exploring localized implementation alternatives.'
            },
            {
              title: 'Non-Blocking Telemetry Warnings Only',
              description: 'Log architectural drift to docs/DRIFT_LOG.md without blocking turn completion.',
              tradeOffs: 'Zero friction for developers; technical debt easily accumulates without active enforcement.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved governance areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step12GovernanceLifecycleDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
