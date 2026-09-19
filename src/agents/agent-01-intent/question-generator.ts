import { ClarifyingQuestion, OptionChoice, Step0IntentDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted clarifying question with Top 3 industry options for a specific missing domain.
   */
  public static generateForDomain(domain: string, draft: Step0IntentDraft): ClarifyingQuestion {
    switch (domain) {
      case 'Problem Space':
        return {
          id: 'q-problem-space',
          domain: 'Problem Space',
          question: 'What is the primary root cause and concrete cost of inaction if this problem is not solved?',
          contextWhyNeeded: 'Without a clear root cause and cost of inaction, engineering risks solving symptoms rather than the core issue.',
          top3Options: [
            {
              title: 'Manual toil and lost engineering velocity',
              description: 'Teams spend hours manually wrestling fragmented workflows, slowing releases by 30-50%.',
              tradeOffs: 'Focuses strictly on operational efficiency; may overlook external customer experience.',
              recommended: true
            },
            {
              title: 'High production defect rate and fragility',
              description: 'Lack of automated governance allows critical architectural bugs and regressions into production.',
              tradeOffs: 'Requires strict gating mechanisms that developers might initially perceive as friction.'
            },
            {
              title: 'Uncontrolled technical debt accumulation',
              description: 'Quick hacks compound until complete rewrites are required every 12-18 months.',
              tradeOffs: 'Value is realized over months/years rather than as immediate headline vanity metrics.'
            }
          ]
        };

      case 'People & Stakeholders':
        return {
          id: 'q-people-stakeholders',
          domain: 'People & Stakeholders',
          question: 'Who is the primary persona interacting with the product day-to-day, and who holds final decision authority?',
          contextWhyNeeded: 'Software without distinct user personas and clear decision authority leads to conflicting requirements and bloated scope.',
          top3Options: [
            {
              title: 'Solo Developers / Technical Founders',
              description: 'High-autonomy engineers who want frictionless speed, instant feedback, and zero boilerplate.',
              tradeOffs: 'Low tolerance for heavy enterprise configuration; needs seamless developer UX.',
              recommended: true
            },
            {
              title: 'Engineering Leads & Staff Architects',
              description: 'Technical managers focused on code quality, compliance, observability, and team consistency.',
              tradeOffs: 'Requires rigorous audit trails, reporting dashboards, and enforcement policies.'
            },
            {
              title: 'Cross-functional Product Teams (PMs + Devs)',
              description: 'Teams balancing fast feature shipping with stakeholder visibility and business metrics.',
              tradeOffs: 'Requires non-technical UI surfaces alongside CLI/developer workflows.'
            }
          ]
        };

      case 'Business Intent':
        return {
          id: 'q-business-intent',
          domain: 'Business Intent',
          question: 'What is the primary strategic value proposition and metric that proves business success?',
          contextWhyNeeded: 'Aligns technical work directly with ROI and product survival.',
          top3Options: [
            {
              title: 'Autonomous Quality Guardrails (Error Prevention)',
              description: 'Eliminates 80%+ of avoidable architectural regressions before code is written.',
              tradeOffs: 'Forces slower inception phases to ensure rock-solid execution later.',
              recommended: true
            },
            {
              title: 'Time-to-Market Acceleration (Velocity)',
              description: 'Reduces end-to-end product delivery time from concept to deployment by 5x.',
              tradeOffs: 'May require automated scaffolding that makes standard assumptions for speed.'
            },
            {
              title: 'Knowledge Retention & Standardization',
              description: 'Ensures codebases remain maintainable even when team members churn or hand over work.',
              tradeOffs: 'Produces comprehensive documentation artifacts that must be kept synchronized.'
            }
          ]
        };

      case 'Scope & Boundaries':
        return {
          id: 'q-scope-boundaries',
          domain: 'Scope & Boundaries',
          question: 'What is explicitly IN-SCOPE for V1, and what must be strictly deferred or kept OUT-OF-SCOPE?',
          contextWhyNeeded: 'Scope creep is the #1 killer of greenfield projects. Boundaries protect delivery timelines.',
          top3Options: [
            {
              title: 'Strict MVP Core: Greenfield lifecycle governance only',
              description: 'In-scope: Step 0 to 14 automated gating and state persistence. Out-of-scope: legacy reverse-engineering.',
              tradeOffs: 'Excludes legacy modernization customers initially; guarantees reliable greenfield execution.',
              recommended: true
            },
            {
              title: 'Expanded Core: Greenfield + Basic Migration Bridge',
              description: 'In-scope: Greenfield flow plus lightweight migration importer for existing specs.',
              tradeOffs: 'Increases scope by 30-40%; adds surface area for edge cases.'
            },
            {
              title: 'Single-Stage Deep Vertical (Step 0-2 only)',
              description: 'In-scope: Flawless problem intent and requirements elicitation only.',
              tradeOffs: 'Incomplete lifecycle; leaves implementation and QA ungoverned.'
            }
          ]
        };

      case 'Success Definition':
        return {
          id: 'q-success-definition',
          domain: 'Success Definition',
          question: 'How will you objectively quantify whether this project has succeeded 3 months after launch?',
          contextWhyNeeded: 'Success must be measurable, not subjective sentiment.',
          top3Options: [
            {
              title: 'Deterministic Handshake Adherence Rate (>95%)',
              description: '95%+ of projects complete all gating steps without unapproved state drift or rollback.',
              tradeOffs: 'Requires measuring process telemetry and completion rates.',
              recommended: true
            },
            {
              title: 'Zero Production Hallucination Incidents',
              description: '100% of generated architectures and code pass verification without architectural hallucinations.',
              tradeOffs: 'Requires stringent multi-agent QA pipelines and verification gates.'
            },
            {
              title: 'User Retention & Repeated Workflow Adoption',
              description: 'Engineers choose to use the tool across multiple consecutive projects voluntarily.',
              tradeOffs: 'Takes longer to measure; relies on developer qualitative sentiment.'
            }
          ]
        };

      case 'Constraints & Assumptions':
        return {
          id: 'q-assumptions-constraints',
          domain: 'Constraints & Assumptions',
          question: 'What are the strictest technical, platform, or operational constraints for this build?',
          contextWhyNeeded: 'Constraints dictate technology choices and prevent unviable architectures.',
          top3Options: [
            {
              title: 'Local-first, Zero External Daemon Requirement',
              description: 'Must run entirely inside the user workspace with zero background servers or external DBs.',
              tradeOffs: 'All state must be stored in atomic files (`.zeta/state.json`); no distributed cloud state.',
              recommended: true
            },
            {
              title: 'Hybrid Cloud: Local CLI with Central Cloud Telemetry',
              description: 'Local execution with centralized team analytics and shared rule synchronization.',
              tradeOffs: 'Requires network connectivity and API keys; introduces privacy concerns for proprietary code.'
            },
            {
              title: 'Full SaaS Web Application',
              description: 'Browser-based IDE environment where all agents run in cloud microservices.',
              tradeOffs: 'High operational infrastructure cost; code must be uploaded to third-party servers.'
            }
          ]
        };

      case 'Trust & Security':
        return {
          id: 'q-trust-security',
          domain: 'Trust & Security',
          question: 'What are the data privacy and security boundaries regarding intellectual property and user code?',
          contextWhyNeeded: 'Developers and enterprises will not adopt tools that leak intellectual property or sensitive keys.',
          top3Options: [
            {
              title: '100% Air-gapped / Local Storage Guarantee',
              description: 'All state, artifacts, and logs stay strictly inside the project root workspace.',
              tradeOffs: 'Cannot sync state across devices without standard git push.',
              recommended: true
            },
            {
              title: 'Encrypted Metadata Telemetry with Opt-in Sharing',
              description: 'Sends anonymized failure metrics and step completion times to improve prompts.',
              tradeOffs: 'Requires telemetry toggles and privacy disclosures.'
            },
            {
              title: 'Enterprise RBAC & Key Vault Integration',
              description: 'Role-based access control and integration with enterprise secrets managers.',
              tradeOffs: 'Overkill for solo developers and early-stage greenfield builds.'
            }
          ]
        };

      case 'Operations & Support':
      default:
        return {
          id: 'q-operations-support',
          domain: 'Operations & Support',
          question: 'How should the system behave when unexpected interruptions or session crashes occur?',
          contextWhyNeeded: 'Ensures graceful recovery and prevents data corruption when users abruptly exit.',
          top3Options: [
            {
              title: 'Atomic Per-Turn Write-Ahead Journaling with Auto-Resume',
              description: 'Every interaction commits immediately; startup sentinel detects interruption and resumes seamlessly.',
              tradeOffs: 'Slight I/O overhead on disk per message; eliminates state loss completely.',
              recommended: true
            },
            {
              title: 'Manual Save Commands (/save, /checkpoint)',
              description: 'User explicitly dictates when checkpoints are created.',
              tradeOffs: 'Users frequently forget to save before quitting, leading to lost progress.'
            },
            {
              title: 'In-Memory Only with Periodic 5-minute Auto-save',
              description: 'Keeps state in RAM, saving to disk on an interval timer.',
              tradeOffs: 'Crashes between intervals lose the last 5 minutes of decisions.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all missing domains.
   */
  public static generateAllQuestions(missingDomains: string[], draft: Step0IntentDraft): ClarifyingQuestion[] {
    return missingDomains.map(domain => this.generateForDomain(domain, draft));
  }
}
