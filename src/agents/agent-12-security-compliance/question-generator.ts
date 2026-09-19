import { ClarifyingQuestion, OptionChoice, Step11SecurityComplianceDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a security/compliance area.
   */
  public static generateForArea(area: string, draft: Step11SecurityComplianceDraft): ClarifyingQuestion {
    switch (area) {
      case 'STRIDE Threat Mitigation & Residual Risk Tolerance':
        return {
          id: 'q-sec-stride',
          category: 'STRIDE Threat Mitigation & Residual Risk Tolerance',
          question: 'How should the build system react when security vulnerabilities or compromised packages are detected? (Security Gates)',
          contextWhyNeeded: 'Decides whether security bugs immediately stop your build or just display warning notes.',
          top3Options: [
            {
              title: 'Block on dangerous, high-severity bugs only',
              description: 'Stops builds on critical vulnerabilities (like remote exploits or credential leaks). Tracks minor warnings without slowing you down.',
              tradeOffs: 'Industry standard; protects from actual disasters while keeping fast developer velocity.',
              recommended: true
            },
            {
              title: 'Zero-vulnerability lockdown (Block on any warning)',
              description: 'Refuses to build if there is even a minor warning or low-risk package notice.',
              tradeOffs: 'Maximum paranoid defense, but you might get blocked by harmless 3rd-party library notices.'
            },
            {
              title: 'Advisory mode (Show warnings, never block)',
              description: 'Prints security alerts in the terminal but lets everything build anyway.',
              tradeOffs: 'Fastest shipping speed, but dangerous vulnerabilities can easily slip into production unnoticed.'
            }
          ]
        };

      case 'Data Privacy & Local Sandboxing Boundary':
        return {
          id: 'q-sec-privacy',
          category: 'Data Privacy & Local Sandboxing Boundary',
          question: 'How strictly should zero-cloud data privacy be enforced? (Privacy Boundary)',
          contextWhyNeeded: 'Guarantees your code, data, and secret keys never leak to external third-party servers.',
          top3Options: [
            {
              title: '100% Local & Offline execution',
              description: 'All governance analysis, state storage, and artifacts run exclusively on your computer with zero network calls.',
              tradeOffs: 'Complete privacy by design (GDPR/HIPAA compliant); zero external downtime risk.',
              recommended: true
            },
            {
              title: 'Air-gapped network kill-switch',
              description: 'Actively severs and rejects any outbound network socket or HTTP request from the process.',
              tradeOffs: 'Absolute cryptographic isolation; prevents checking package registries for updates.'
            },
            {
              title: 'Opt-in anonymous crash telemetry',
              description: 'Allows sending stripped error names and line numbers with explicit user consent.',
              tradeOffs: 'Helps fix bugs faster, but requires user consent prompts and telemetry scrubbing.'
            }
          ]
        };

      case 'Open-Source License & SBOM Policy':
      default:
        return {
          id: 'q-sec-license',
          category: 'Open-Source License & SBOM Policy',
          question: 'Which open-source software licenses should be permitted in dependencies? (Safe Licensing)',
          contextWhyNeeded: 'Prevents accidentally using libraries with viral copyleft rules that could force open-sourcing proprietary code.',
          top3Options: [
            {
              title: 'Permissive licenses only (MIT, Apache 2.0, BSD, ISC)',
              description: 'Allows standard business-friendly licenses and automatically blocks viral copyleft (GPL/AGPL). Generates a package inventory (SBOM) on build.',
              tradeOffs: 'Zero legal headaches; industry standard for commercial and open software.',
              recommended: true
            },
            {
              title: 'Ultra-strict MIT only',
              description: 'Only permits packages using the simple MIT license; rejects Apache, BSD, or complex licenses.',
              tradeOffs: 'Dead-simple legal rules, but eliminates many great Apache and BSD packages.'
            },
            {
              title: 'Permissive with isolated weak copyleft (Allow MPL-2.0 / LGPL)',
              description: 'Permits weak copyleft libraries only if kept separate as dynamic unlinked modules.',
              tradeOffs: 'More package choices, but requires checking module link boundaries periodically.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved security areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step11SecurityComplianceDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
