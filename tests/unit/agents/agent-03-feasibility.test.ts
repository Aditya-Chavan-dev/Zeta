import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-03-feasibility/precondition-verifier.js';
import { FeasibilityEvaluator } from '../../../src/agents/agent-03-feasibility/feasibility-evaluator.js';
import { QuestionGenerator } from '../../../src/agents/agent-03-feasibility/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-03-feasibility/artifact-compiler.js';
import { Agent03Feasibility } from '../../../src/agents/agent-03-feasibility/agent.js';

describe('Agent 03: Feasibility, Constraints & Risk Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-03');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('Blocks execution if Step 0 or Step 1 is not locked in session state', async () => {
    StateManager.initialize(testDir, 'test-project');

    // Neither step locked
    const agent = new Agent03Feasibility(testDir);
    const resp1 = await agent.handleTurn('Evaluate system feasibility');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Only Step 0 locked
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Step 0',
      artifactSha256: 'a'.repeat(64)
    });

    const agentAfterStep0 = new Agent03Feasibility(testDir);
    const resp2 = await agentAfterStep0.handleTurn('Evaluate system feasibility');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 1'));
  });

  test('PreconditionVerifier passes when both Step 0 and Step 1 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Intent: Greenfield autonomous IDE governance.',
      artifactSha256: 'a'.repeat(64)
    });
    StateManager.lockStep(testDir, 1, {
      stepNumber: 1,
      stepName: 'Requirements',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Requirements: Low latency < 100ms, zero data loss.',
      artifactSha256: 'b'.repeat(64)
    });

    const check = PreconditionVerifier.verifyPrerequisites(testDir);
    assert.equal(check.isValid, true);
    assert.ok(check.step0Tldr.includes('Greenfield autonomous IDE'));
    assert.ok(check.step1Tldr.includes('Low latency < 100ms'));
  });

  test('QuestionGenerator produces Top 3 mitigation options for risk areas', () => {
    const draft = FeasibilityEvaluator.createEmptyDraft('Step 0 TL;DR', 'Step 1 TL;DR');
    const q = QuestionGenerator.generateForRiskArea('State Drift & Schema Migration Risk', draft);

    assert.equal(q.riskCategory, 'State Drift & Schema Migration Risk');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent03 executes full interactive risk assessment and locks Step 2 on approval', async () => {
    // 1. Setup locked Step 0 and Step 1
    StateManager.initialize(testDir, 'test-project');
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Intent: Greenfield IDE governance.',
      artifactSha256: 'a'.repeat(64)
    });
    StateManager.lockStep(testDir, 1, {
      stepNumber: 1,
      stepName: 'Requirements',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Requirements: Fast turns, local persistence.',
      artifactSha256: 'b'.repeat(64)
    });

    const agent = new Agent03Feasibility(testDir);

    // Turn 1: Ingest risk review
    const turn1 = await agent.handleTurn('Evaluate technical and operational feasibility under local file constraints.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer risk mitigation questions until signoff prompt
    let currentResponse = turn1;
    let iterations = 0;
    while (!currentResponse.isReadyForSignoff && iterations < 10) {
      currentResponse = await agent.handleTurn('1'); // Pick recommended option 1
      iterations++;
    }

    assert.equal(currentResponse.isReadyForSignoff, true);
    assert.ok(currentResponse.message.includes('Approve'));

    // Turn: User gives approval handshake
    const signoffResponse = await agent.handleTurn('Approve');
    assert.equal(signoffResponse.isLocked, true);
    assert.equal(signoffResponse.documentPath, 'docs/FEASIBILITY_AND_RISK_REPORT.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'FEASIBILITY_AND_RISK_REPORT.md');
    assert.ok(fs.existsSync(savedDocPath), 'FEASIBILITY_AND_RISK_REPORT.md must exist');

    // Verify StateManager locked Step 2 and advanced to Step 3
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 3);
    assert.ok(state.lockedSteps.includes(2));
    assert.equal(state.stepSummaries['step_2'].artifactPath, 'docs/FEASIBILITY_AND_RISK_REPORT.md');
    assert.ok(state.stepSummaries['step_2'].summary.includes('TL;DR FEASIBILITY & RISK'));
    assert.equal(state.stepSummaries['step_2'].artifactSha256.length, 64);
  });
});
