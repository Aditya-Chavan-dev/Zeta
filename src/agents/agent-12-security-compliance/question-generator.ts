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
          question: 'What vulnerability severity threshold should strictly block CI/CD pipelines and release gating?',
          contextWhyNeeded: 'Defines the automated security enforcement barrier preventing high-risk code from reaching production.',
          top3Options: [
            {
              title: 'Block on CRITICAL and HIGH CVEs (Recommended)',
              description: 'Zero unresolved Critical (24h SLA) or High (72h SLA) vulnerabilities permitted. Medium/Low are tracked with warning tickets.',
              tradeOffs: 'Industry standard; ensures robust perimeter and execution defense without paralyzing developer flow on low-severity issues.',
              recommended: true
            },
            {
              title: 'Zero Vulnerability Policy (Block on CRITICAL, HIGH, and MEDIUM)',
              description: 'All CVEs regardless of severity block build pipelines until patched or explicitly granted temporary waiver.',
              tradeOffs: 'Maximum hardening; can stall development velocity on transitive low-risk library dependencies.'
            },
            {
              title: 'Advisory Mode (Notify Only, Block on Critical Exploits)',
              description: 'Only actively exploitable remote code execution (RCE) flaws block; all others log warnings.',
              tradeOffs: 'Maximum velocity; incurs high technical debt and security drift over time.'
            }
          ]
        };

      case 'Data Privacy & Local Sandboxing Boundary':
        return {
          id: 'q-sec-privacy',
          category: 'Data Privacy & Local Sandboxing Boundary',
          question: 'How strictly should the zero-cloud-egress data privacy boundary be enforced?',
          contextWhyNeeded: 'Guarantees proprietary customer source code and architectural models never leak to external third parties.',
          top3Options: [
            {
              title: 'Strict Zero-Cloud Egress (100% Local Execution Boundary) (Recommended)',
              description: 'All governance analysis, state storage, and artifact compilation run exclusively in local workstation process with zero network calls.',
              tradeOffs: 'Total privacy compliance (GDPR, SOC2, HIPAA compliant by design); no dependency on external services.',
              recommended: true
            },
            {
              title: 'Air-Gapped Offline Enforcement (Socket Socket Disconnect)',
              description: 'Actively sever and reject any outbound socket or HTTP/HTTPS connection from the IDE extension process.',
              tradeOffs: 'Absolute cryptographic isolation; prevents legitimate developer tools from checking package registry versions.'
            },
            {
              title: 'Opt-In Sanity Telemetry (Sanitized Error Signatures)',
              description: 'Allow sending stripped exception class names and line numbers to a diagnostic collector with explicit user opt-in.',
              tradeOffs: 'Helps maintainers spot bugs; requires telemetry consent prompts and scrubbing validation.'
            }
          ]
        };

      case 'Open-Source License & SBOM Policy':
      default:
        return {
          id: 'q-sec-license',
          category: 'Open-Source License & SBOM Policy',
          question: 'Which open-source license governance and Software Bill of Materials (SBOM) standard should be enforced?',
          contextWhyNeeded: 'Prevents viral copyleft licenses (GPL/AGPL) from contaminating proprietary software codebases.',
          top3Options: [
            {
              title: 'Permissive Only (MIT, Apache-2.0, BSD-3-Clause, ISC) with CycloneDX SBOM (Recommended)',
              description: 'Strictly permit business-friendly permissive licenses; automatically ban viral copyleft (GPL/AGPL); generate CycloneDX SBOM on build.',
              tradeOffs: 'Eliminates legal and IP contamination risks; industry standard for commercial and enterprise software.',
              recommended: true
            },
            {
              title: 'Ultra-Restrictive MIT Only',
              description: 'Only permit MIT-licensed dependencies; reject Apache, BSD, or any licenses requiring patent grant clauses.',
              tradeOffs: 'Extremely simple legal review; severely limits the choice of usable open-source packages.'
            },
            {
              title: 'Dual Permissive & Weak Copyleft (Allow MPL-2.0 / LGPL with isolation)',
              description: 'Allow weak copyleft libraries if consumed as dynamic unlinked libraries or independent modules.',
              tradeOffs: 'Broader dependency selection; requires ongoing legal audit of module boundary linking.'
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
