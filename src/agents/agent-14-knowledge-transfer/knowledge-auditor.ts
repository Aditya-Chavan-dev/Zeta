import {
  Step13KnowledgeTransferDraft,
  ArchitectureDecisionRecord,
  OnboardingMilestone,
  QuickstartGuide,
  TroubleshootingEntry
} from './types.js';

export class KnowledgeAuditor {
  /**
   * Initializes baseline knowledge transfer and documentation plan from upstream TL;DRs.
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
    step11Tldr: string,
    step12Tldr: string
  ): Step13KnowledgeTransferDraft {
    const adrIndex: ArchitectureDecisionRecord[] = [
      {
        id: 'ADR-001',
        title: 'Problem Invariant Definition: Greenfield Scope Only',
        contextStep: 0,
        decisionOutcome: 'Restrict system strictly to greenfield projects; disallow legacy migration daemons.',
        tradeOffAccepted: 'Faster development velocity and simpler state models at the expense of legacy tool adoption.'
      },
      {
        id: 'ADR-002',
        title: 'Atomic Per-Turn State Persistence Architecture',
        contextStep: 1,
        decisionOutcome: 'Implement atomic JSON serialization (.zeta/state.json.tmp -> state.json) with lock retries.',
        tradeOffAccepted: 'Slightly higher filesystem I/O per turn for 100% crash resilience.'
      },
      {
        id: 'ADR-003',
        title: 'Local Standalone File System Governance Store',
        contextStep: 2,
        decisionOutcome: 'Persist state strictly to local workspace files; zero external database dependencies.',
        tradeOffAccepted: 'Bounded to local filesystem IOPS; zero network egress or credential requirements.'
      },
      {
        id: 'ADR-004',
        title: 'Node.js v24 + Native Node Test Runner Runtime Strategy',
        contextStep: 3,
        decisionOutcome: 'Adopt standard ES Modules with node:test runner and zero heavy testing frameworks.',
        tradeOffAccepted: 'Instant test boot (< 50ms); rely on built-in assert/strict instead of Jest/Vitest.'
      },
      {
        id: 'ADR-005',
        title: 'Top 3 Industry Options Decision Engine Protocol',
        contextStep: 4,
        decisionOutcome: 'Mandate that any ambiguity or architectural trade-off presents exactly Top 3 options with trade-offs.',
        tradeOffAccepted: 'Requires upfront domain curation; completely avoids infinite conversational loops.'
      },
      {
        id: 'ADR-006',
        title: 'Strict Cryptographic Gating Across 15-Stage Lifecycle',
        contextStep: 5,
        decisionOutcome: 'Enforce step locking with SHA-256 artifact digests before subsequent agents execute.',
        tradeOffAccepted: 'Requires sequential execution discipline; permanently blocks out-of-order architectural drift.'
      }
    ];

    const onboardingMilestones: OnboardingMilestone[] = [
      {
        timeframe: 'Hour 1 (Setup)',
        objective: 'Clone repository, install dependencies with npm install, run full test suite via node:test.',
        verificationStep: 'Execute `npm test` and observe all unit and multi-stage pipeline tests passing.',
        expectedDurationMinutes: 15
      },
      {
        timeframe: 'Day 1 (First Build & Run)',
        objective: 'Understand the 15-stage lifecycle state machine, initialize an `.zeta/state.json` session, and execute Agent 01.',
        verificationStep: 'Inspect `.zeta/state.json` and verify Step 0 locking and SHA-256 recording in docs/.',
        expectedDurationMinutes: 45
      },
      {
        timeframe: 'Week 1 (Independent Contribution)',
        objective: 'Create or enhance an agent domain module, wire question generator with Top 3 trade-offs, and write cumulative pipeline test.',
        verificationStep: 'Run `npx tsx --test tests/**/*.test.ts` to confirm 100% green pipeline.',
        expectedDurationMinutes: 180
      }
    ];

    const quickstartGuides: QuickstartGuide[] = [
      {
        title: 'Local Environment Setup & Smoke Verification',
        prerequisites: ['Node.js v24 or higher', 'npm v10+ or pnpm', 'Git'],
        terminalCommands: [
          'git clone <repository-url>',
          'cd <project-root>',
          'npm install',
          'npx tsx --test tests/**/*.test.ts'
        ],
        expectedOutput: 'ℹ tests 75, ℹ pass 75, ℹ fail 0'
      },
      {
        title: 'Running Autonomous Governance Flow Interactively',
        prerequisites: ['Completed local environment setup'],
        terminalCommands: [
          'node -e "import(\'./src/core/state/state-manager.js\').then(m => m.StateManager.initialize(process.cwd(), \'my-greenfield-app\'))"'
        ],
        expectedOutput: 'Session initialized in .zeta/state.json with activeStep = 0'
      }
    ];

    const troubleshootingCatalog: TroubleshootingEntry[] = [
      {
        symptom: 'EPERM / EBUSY: resource busy or locked on Windows file rename',
        probableCause: 'Antivirus or concurrent node process holding a transient read lock on .zeta/state.json',
        remediationCommand: 'The built-in StateManager retry loop handles this automatically. If hung, kill background node processes.'
      },
      {
        symptom: 'Precondition Failed: Step X is not locked',
        probableCause: 'Attempted to invoke Agent N before prerequisite Step N-1 was formally locked with "Approve"',
        remediationCommand: 'Run the preceding agent to completion and provide the handshake input "Approve".'
      }
    ];

    return {
      adrIndex,
      onboardingMilestones,
      quickstartGuides,
      troubleshootingCatalog,
      docFreshnessCadence: 'Continuous automated sync: docs/ generated and verified on every locked step',
      unresolvedAreas: [
        'Developer Onboarding Velocity & Ramp-up Target',
        'API Reference & Interactive Sandbox Format',
        'Documentation Freshness & Cross-Check Policy'
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
      step11SecurityComplianceTldr: step11Tldr,
      step12GovernanceLifecycleTldr: step12Tldr
    };
  }

  /**
   * Applies user answers to refine the knowledge transfer draft.
   */
  public static applyAnswer(draft: Step13KnowledgeTransferDraft, area: string, answer: string): void {
    draft.unresolvedAreas = draft.unresolvedAreas.filter(a => a !== area);
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());

    if (area === 'Developer Onboarding Velocity & Ramp-up Target') {
      if (isNegative) {
        draft.onboardingMilestones = [];
      } else if (answer.includes('2') || answer.toLowerCase().includes('rapid')) {
        draft.onboardingMilestones[0].expectedDurationMinutes = 10;
        draft.onboardingMilestones[1].expectedDurationMinutes = 30;
      } else if (answer.includes('3') || answer.toLowerCase().includes('deep')) {
        draft.onboardingMilestones[0].expectedDurationMinutes = 30;
        draft.onboardingMilestones[1].expectedDurationMinutes = 90;
      }
    } else if (area === 'API Reference & Interactive Sandbox Format') {
      if (isNegative) {
        draft.quickstartGuides[0].terminalCommands = [];
      } else if (answer.includes('2') || answer.toLowerCase().includes('typedoc')) {
        draft.quickstartGuides[0].terminalCommands.push('npx typedoc --out docs/api src/');
      } else if (answer.includes('3') || answer.toLowerCase().includes('interactive')) {
        draft.quickstartGuides[0].terminalCommands.push('npm run sandbox');
      }
    } else if (area === 'Documentation Freshness & Cross-Check Policy') {
      if (isNegative) {
        draft.docFreshnessCadence = 'Manual developer maintenance (No automated CI gating)';
      } else if (answer.includes('2') || answer.toLowerCase().includes('ci-gate')) {
        draft.docFreshnessCadence = 'Strict CI Gate: reject PRs if code symbols drift from docs/ without documentation update';
      } else if (answer.includes('3') || answer.toLowerCase().includes('monthly')) {
        draft.docFreshnessCadence = 'Monthly peer review audit of markdown docs/';
      }
    }
  }
}
