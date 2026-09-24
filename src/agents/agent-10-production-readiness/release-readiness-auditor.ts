import {
  Step9ProductionReadinessDraft,
  DeploymentTarget,
  ReleaseGate,
  RollbackProcedure,
  SmokeTestPlan,
  ConfigurationSpec
} from './types.js';

export class ReleaseReadinessAuditor {
  /**
   * Initializes a production readiness baseline from upstream TL;DRs.
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
    step8Tldr: string
  ): Step9ProductionReadinessDraft {
    const deploymentTargets: DeploymentTarget[] = [
      {
        name: 'Local Developer Workstation IDE Environment',
        type: 'local-binary',
        runtime: 'Node.js v24+ / VSCode / Antigravity IDE Host Process',
        resourceLimits: {
          cpu: '1 vCPU (sub-thread non-blocking)',
          memory: '512 MB Max Heap RSS',
          disk: '50 MB Local State (.zeta/)'
        },
        isolationModel: 'Sandboxed Workspace Process with scoped FS API permissions'
      },
      {
        name: 'CI/CD Headless Automation Runner',
        type: 'container',
        runtime: 'Alpine Node 24 minimal Docker image',
        resourceLimits: {
          cpu: '2 vCPU',
          memory: '1 GB RSS',
          disk: '200 MB scratch tempfs'
        },
        isolationModel: 'Ephemeral OCI container containerized isolation'
      }
    ];

    const releaseGates: ReleaseGate[] = [
      {
        id: 'GATE-01',
        name: 'Precondition State Signature Integrity',
        criteria: 'All upstream stages 0 through 8 locked with valid SHA-256 digests in .zeta/state.json',
        automatedCheck: 'StateManager.verifyAllLocks() === true',
        blockingSeverity: 'BLOCKER'
      },
      {
        id: 'GATE-02',
        name: 'Zero Unhandled Exception Clean Exit',
        criteria: 'All unit, integration, and stress tests exit code 0 under node:test runner',
        automatedCheck: 'npx tsx --test tests/**/*.test.ts === code 0',
        blockingSeverity: 'BLOCKER'
      },
      {
        id: 'GATE-03',
        name: 'Atomic I/O Resilience & Zero State Corruption',
        criteria: 'Interrupted turn simulation recovery must cleanly resume without corrupting activeStep',
        automatedCheck: 'ResumeSentinel.inspectInterruptedTurn() recovers buffer cleanly',
        blockingSeverity: 'CRITICAL'
      }
    ];

    const rollbackProcedures: RollbackProcedure[] = [
      {
        triggerMetric: 'Fatal Process Crash or State Corruption on Startup',
        detectionThreshold: 'Exit code != 0 or .zeta/state.json JSON parse failure within 5s of startup',
        automatedSteps: [
          'Halt active execution loop immediately',
          'Restore backup copy .zeta/state.json.bak or previous stable step snapshot',
          'Notify user via IDE notification banner and prompt manual retry'
        ],
        maxRollbackDurationSeconds: 2,
        dataCompensationStrategy: 'Replay uncommitted turn buffer from scratch log if valid'
      },
      {
        triggerMetric: 'Severe Performance Regression in Multi-Stage Pipeline',
        detectionThreshold: 'Turn execution latency exceeds 15000ms threshold',
        automatedSteps: [
          'Deactivate verbose trace logging',
          'Fallback to lightweight in-memory cache for artifact compiles'
        ],
        maxRollbackDurationSeconds: 1,
        dataCompensationStrategy: 'Preserve locked step state; flush ephemeral cache'
      }
    ];

    const smokeTests: SmokeTestPlan[] = [
      {
        endpointOrCommand: 'StateManager.initialize(workspaceRoot, projectName)',
        expectedBehavior: 'Generates valid .zeta/state.json with initial Step 0 and activeStep = 0',
        timeoutMs: 1000,
        criticality: 'MUST_PASS'
      },
      {
        endpointOrCommand: 'Agent10ProductionReadiness.handleTurn("status")',
        expectedBehavior: 'Returns valid response payload without runtime crash',
        timeoutMs: 2000,
        criticality: 'MUST_PASS'
      }
    ];

    const configSpecs: ConfigurationSpec[] = [
      {
        environmentVariable: 'EVO_WORKSPACE_ROOT',
        required: true,
        isSecret: false,
        purpose: 'Defines root filesystem path for project files and .zeta governance store',
        fallbackOrValidation: 'Defaults to process.cwd() if not explicitly supplied'
      },
      {
        environmentVariable: 'EVO_LOG_LEVEL',
        required: false,
        isSecret: false,
        purpose: 'Controls telemetry verbosity (DEBUG, INFO, WARN, ERROR)',
        fallbackOrValidation: 'Defaults to INFO'
      }
    ];

    return {
      deploymentTargets,
      releaseGates,
      rollbackProcedures,
      smokeTests,
      configSpecs,
      zeroDowntimeStrategy: 'Atomic File Swapping & Blue/Green In-Memory Module Instantiation',
      monitoringAndObservability: [
        'Local structured file logger with rolling 5MB buffer',
        'State lock timestamp and latency tracking per turn',
        'Crash report telemetry written to .zeta/crashes.log'
      ],
      unresolvedAreas: [
        'Production Deployment Packaging & Distribution Model',
        'Zero-Downtime Rollout & Update Protocol',
        'Observability, Crash Telemetry & Log Rotation'
      ],
      step0IntentTldr: step0Tldr,
      step1RequirementsTldr: step1Tldr,
      step2FeasibilityTldr: step2Tldr,
      step3TechStrategyTldr: step3Tldr,
      step4ArchitectureTldr: step4Tldr,
      step5DetailedDesignTldr: step5Tldr,
      step6ImplementationPlanTldr: step6Tldr,
      step7ReleaseCandidateTldr: step7Tldr,
      step8VerificationQaTldr: step8Tldr
    };
  }

  /**
   * Applies user answers to refine the production readiness draft.
   */
  public static applyAnswer(draft: Step9ProductionReadinessDraft, area: string, answer: string): void {
    draft.unresolvedAreas = draft.unresolvedAreas.filter(a => a !== area);
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());

    if (area === 'Production Deployment Packaging & Distribution Model') {
      if (isNegative) {
        draft.deploymentTargets[0].runtime = 'None / Excluded (Direct local execution)';
      } else if (answer.includes('2') || answer.toLowerCase().includes('tarball')) {
        draft.deploymentTargets[0].runtime = 'Pre-compiled tarball release bundle';
      } else if (answer.includes('3') || answer.toLowerCase().includes('docker')) {
        draft.deploymentTargets[0].runtime = 'Docker OCI container image';
      } else if (answer.trim()) {
        draft.deploymentTargets[0].runtime = `Custom: ${answer.trim()}`;
      }
    } else if (area === 'Zero-Downtime Rollout & Update Protocol') {
      if (isNegative) {
        draft.zeroDowntimeStrategy = 'None (Standard direct deployment / no zero-downtime overhead)';
      } else if (answer.includes('2') || answer.toLowerCase().includes('canary')) {
        draft.zeroDowntimeStrategy = 'Canary 10% pilot rollout with automated rollback';
      } else if (answer.includes('3') || answer.toLowerCase().includes('maintenance')) {
        draft.zeroDowntimeStrategy = 'Maintenance window with scheduled downtime banner';
      } else if (answer.trim()) {
        draft.zeroDowntimeStrategy = `Custom: ${answer.trim()}`;
      }
    } else if (area === 'Observability, Crash Telemetry & Log Rotation') {
      if (isNegative) {
        draft.monitoringAndObservability = ['Telemetry and remote logging explicitly excluded by user'];
      } else if (answer.includes('2') || answer.toLowerCase().includes('syslog')) {
        draft.monitoringAndObservability.push('Syslog daemon stream forwarding');
      } else if (answer.includes('3') || answer.toLowerCase().includes('stdout')) {
        draft.monitoringAndObservability.push('POSIX stdout JSON stream format');
      } else if (answer.trim()) {
        draft.monitoringAndObservability.push(`Custom: ${answer.trim()}`);
      }
    }
  }
}
