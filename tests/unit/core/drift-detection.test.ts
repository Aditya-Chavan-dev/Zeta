import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IntentComparator } from '../../../src/core/drift/intent-comparator.js';
import { DriftInterceptor } from '../../../src/core/drift/interceptor.js';
import { ImpactCascadeAnalyzer } from '../../../src/core/drift/impact-cascade.js';
import { BaselineUpdater } from '../../../src/core/drift/baseline-updater.js';

const SAMPLE_STEP0_TLDR = 'Local-first governance engine using Node.js, TypeScript, and SQLite for autonomous AI agents. Strict zero-cloud-egress boundary. Antigravity IDE integration only.';
const SAMPLE_STEP1_TLDR = 'Functional requirements: 15-stage lifecycle, GovernanceEngine approval gating, typed SQLite state store with WAL mode. Non-functional: <50ms latency, 100% crash recovery.';

const LOCKED_OUT_OF_SCOPE = [
  'Codex integration',
  'Cursor IDE integration',
  'Claude Code integration',
  'Cloud telemetry or remote persistence',
  'Self-approving agent autonomy'
];

const LOCKED_NON_GOALS = [
  'Multi-tenant cloud deployment',
  'Real-time collaboration',
  'Web-based dashboard UI'
];

describe('IntentComparator', () => {
  it('should detect drift when user mentions an out-of-scope item', () => {
    const signal = IntentComparator.compare(
      'We should add Cursor IDE integration for better adoption',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(signal.isDrift, 'Should detect drift');
    assert.ok(signal.confidence >= 0.5, `Confidence should be >= 0.5, got ${signal.confidence}`);
    assert.ok(signal.divergedDomains.includes('scope'), 'Should flag scope domain');
  });

  it('should detect drift when user introduces a new technology', () => {
    const signal = IntentComparator.compare(
      'I think we should use Redis for caching the state and deploy to Kubernetes',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(signal.isDrift, 'Should detect tech drift');
    assert.ok(signal.divergedDomains.includes('techStack'), 'Should flag techStack domain');
  });

  it('should NOT flag drift for normal in-scope questions', () => {
    const signal = IntentComparator.compare(
      'How does the SQLite WAL mode handle concurrent writes in the state manager?',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(!signal.isDrift, 'Should not flag in-scope question as drift');
    assert.ok(signal.confidence < 0.5, `Confidence should be low, got ${signal.confidence}`);
  });

  it('should NOT flag drift for short inputs like approvals', () => {
    const signal = IntentComparator.compare(
      'Approve',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(!signal.isDrift, 'Should not flag approval as drift');
    assert.equal(signal.confidence, 0);
  });

  it('should detect requirements negation drift', () => {
    const signal = IntentComparator.compare(
      'Actually lets remove the SQLite state store and stop using TypeScript strict mode',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(signal.isDrift, 'Should detect negation drift');
    assert.ok(signal.divergedDomains.includes('requirements'), 'Should flag requirements domain');
  });
});

describe('DriftInterceptor', () => {
  it('should intercept when drift confidence exceeds threshold', () => {
    const result = DriftInterceptor.evaluate(
      'We need cloud telemetry and remote persistence for monitoring',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(result.shouldIntercept, 'Should intercept');
    assert.ok(result.conversationalPrompt.length > 0, 'Should have a prompt');
    assert.ok(result.conversationalPrompt.includes('Drift Detected'), 'Prompt should mention drift');
    assert.ok(result.conversationalPrompt.includes('Yes, change it'), 'Should offer confirmation');
  });

  it('should NOT intercept for in-scope questions', () => {
    const result = DriftInterceptor.evaluate(
      'Show me how the GovernanceEngine handles approval gating',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS
    );

    assert.ok(!result.shouldIntercept, 'Should not intercept in-scope question');
    assert.equal(result.conversationalPrompt, '');
  });

  it('should respect custom confidence threshold', () => {
    const result = DriftInterceptor.evaluate(
      'Maybe we could consider adding Redis',
      SAMPLE_STEP0_TLDR,
      SAMPLE_STEP1_TLDR,
      LOCKED_OUT_OF_SCOPE,
      LOCKED_NON_GOALS,
      0.95 // Very high threshold
    );

    assert.ok(!result.shouldIntercept, 'Should not intercept at very high threshold');
  });
});

describe('ImpactCascadeAnalyzer', () => {
  const lockedSummaries: Record<string, { summary: string; artifactPath: string }> = {
    step_0: {
      summary: 'Core Problem: Lack of governance for greenfield projects. Scope: 15-stage lifecycle. Technology: Node.js, TypeScript, SQLite.',
      artifactPath: 'docs/PROJECT_INTENT.md'
    },
    step_1: {
      summary: 'Functional requirements: FR-01 lifecycle engine, FR-02 approval gating, FR-03 SQLite state store.',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md'
    },
    step_2: {
      summary: 'Feasibility verified. Constraints: local execution, zero cloud daemons. Risk: Windows lock collisions.',
      artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md'
    },
    step_3: {
      summary: 'Technology stack: Node.js LTS, TypeScript 5.x, SQLite3 with WAL, zod schema engine.',
      artifactPath: 'docs/TECH_STACK_AND_STRATEGY.md'
    }
  };

  it('should identify direct and indirect impacts from scope drift', () => {
    const driftSignal = {
      isDrift: true,
      confidence: 0.9,
      divergedDomains: ['scope'],
      explanation: 'User input mentions out-of-scope items: Cloud telemetry.'
    };

    const report = ImpactCascadeAnalyzer.analyze(driftSignal, lockedSummaries);

    assert.ok(report.totalAffected > 0, 'Should have affected steps');
    assert.ok(report.requiresAmendment, 'Should require amendment');
    assert.ok(report.affectedSteps.some(s => s.impactLevel === 'DIRECT'), 'Should have direct impacts');
  });

  it('should identify tech stack drift impacting Step 3', () => {
    const driftSignal = {
      isDrift: true,
      confidence: 0.8,
      divergedDomains: ['techStack'],
      explanation: 'User input introduces technologies not in baseline: redis, kubernetes.'
    };

    const report = ImpactCascadeAnalyzer.analyze(driftSignal, lockedSummaries);

    const step3Impact = report.affectedSteps.find(s => s.stepNumber === 3);
    assert.ok(step3Impact, 'Step 3 (Tech Strategy) should be impacted');
    assert.equal(step3Impact?.impactLevel, 'DIRECT');
  });

  it('should return empty cascade when no steps are locked', () => {
    const driftSignal = {
      isDrift: true,
      confidence: 0.9,
      divergedDomains: ['scope'],
      explanation: 'Test drift.'
    };

    const report = ImpactCascadeAnalyzer.analyze(driftSignal, {});
    assert.equal(report.totalAffected, 0);
    assert.ok(!report.requiresAmendment);
  });
});

describe('BaselineUpdater', () => {
  it('should produce rollback target at earliest DIRECT step', () => {
    const cascadeReport = {
      triggerDescription: 'Scope drift detected.',
      affectedSteps: [
        { stepNumber: 0, stepName: 'Intent', artifactPath: 'docs/PROJECT_INTENT.md', impactLevel: 'DIRECT' as const, impactDescription: 'Scope overlap.' },
        { stepNumber: 1, stepName: 'Requirements', artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md', impactLevel: 'INDIRECT' as const, impactDescription: 'Depends on Step 0.' },
        { stepNumber: 3, stepName: 'Tech Strategy', artifactPath: 'docs/TECH_STACK_AND_STRATEGY.md', impactLevel: 'DIRECT' as const, impactDescription: 'Tech overlap.' }
      ],
      totalAffected: 3,
      requiresAmendment: true
    };

    const plan = BaselineUpdater.planUpdate(cascadeReport);

    assert.equal(plan.rollbackTarget, 0, 'Rollback target should be Step 0 (earliest)');
    assert.deepEqual(plan.stepsToAmend, [0, 1, 3]);
    assert.ok(plan.requiresConfirmation);
  });

  it('should return no amendment when no steps affected', () => {
    const cascadeReport = {
      triggerDescription: 'No drift.',
      affectedSteps: [],
      totalAffected: 0,
      requiresAmendment: false
    };

    const plan = BaselineUpdater.planUpdate(cascadeReport);

    assert.equal(plan.rollbackTarget, -1);
    assert.deepEqual(plan.stepsToAmend, []);
    assert.ok(!plan.requiresConfirmation);
  });

  it('should format a human-readable confirmation prompt', () => {
    const plan = {
      stepsToAmend: [1, 2],
      rollbackTarget: 1,
      reason: 'Drift trigger: Tech change. Rollback target: Step 1.',
      requiresConfirmation: true
    };

    const prompt = BaselineUpdater.formatConfirmationPrompt(plan);
    assert.ok(prompt.includes('Amendment Plan'));
    assert.ok(prompt.includes('2 step(s)'));
    assert.ok(prompt.includes('Confirm amendment'));
  });
});
