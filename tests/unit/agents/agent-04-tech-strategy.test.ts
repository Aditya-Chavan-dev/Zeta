import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-04-tech-strategy/precondition-verifier.js';
import { StackSelector } from '../../../src/agents/agent-04-tech-strategy/stack-selector.js';
import { QuestionGenerator } from '../../../src/agents/agent-04-tech-strategy/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-04-tech-strategy/artifact-compiler.js';
import { Agent04TechStrategy } from '../../../src/agents/agent-04-tech-strategy/agent.js';

describe('Agent 04: Technology Strategy & Tech-Stack Selection Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-04');

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

  test('Blocks execution if Steps 0, 1, or 2 are not locked in session state', async () => {
    StateManager.initialize(testDir, 'test-project');

    // No steps locked
    const agent = new Agent04TechStrategy(testDir);
    const resp1 = await agent.handleTurn('Select tech stack');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Step 0 locked, Step 1 missing
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Step 0',
      artifactSha256: 'a'.repeat(64)
    });

    const agentAfterStep0 = new Agent04TechStrategy(testDir);
    const resp2 = await agentAfterStep0.handleTurn('Select tech stack');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 1'));

    // Step 1 locked, Step 2 missing
    StateManager.lockStep(testDir, 1, {
      stepNumber: 1,
      stepName: 'Requirements',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Step 1',
      artifactSha256: 'b'.repeat(64)
    });

    const agentAfterStep1 = new Agent04TechStrategy(testDir);
    const resp3 = await agentAfterStep1.handleTurn('Select tech stack');
    assert.ok(resp3.error);
    assert.ok(resp3.message.includes('Precondition Failed: Step 2'));
  });

  test('PreconditionVerifier passes when Steps 0, 1, and 2 are all locked', () => {
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
    StateManager.lockStep(testDir, 2, {
      stepNumber: 2,
      stepName: 'Feasibility & Risk',
      artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Feasibility: Pure local-first node runtime.',
      artifactSha256: 'c'.repeat(64)
    });

    const check = PreconditionVerifier.verifyPrerequisites(testDir);
    assert.equal(check.isValid, true);
    assert.ok(check.step0Tldr.includes('Greenfield IDE governance'));
    assert.ok(check.step1Tldr.includes('Fast turns'));
    assert.ok(check.step2Tldr.includes('Pure local-first node runtime'));
  });

  test('QuestionGenerator produces Top 3 candidate options for tech categories', () => {
    const draft = StackSelector.createEmptyDraft('TL;DR 0', 'TL;DR 1', 'TL;DR 2');
    const q = QuestionGenerator.generateForCategory('Communication & Extension Protocol', draft);

    assert.equal(q.category, 'Communication & Extension Protocol');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent04 executes interactive stack selection and locks Step 3 on approval', async () => {
    // 1. Setup locked Steps 0, 1, and 2
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
    StateManager.lockStep(testDir, 2, {
      stepNumber: 2,
      stepName: 'Feasibility & Risk',
      artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Feasibility: Pure local-first node runtime.',
      artifactSha256: 'c'.repeat(64)
    });

    const agent = new Agent04TechStrategy(testDir);

    // Turn 1: Select stack
    const turn1 = await agent.handleTurn('Define technology strategy and frameworks.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer tech questions until signoff prompt
    let currentResponse = turn1;
    let iterations = 0;
    while (!currentResponse.isReadyForSignoff && iterations < 10) {
      currentResponse = await agent.handleTurn('1'); // Select recommended candidate 1
      iterations++;
    }

    assert.equal(currentResponse.isReadyForSignoff, true);
    assert.ok(currentResponse.message.includes('Approve'));

    // Turn: User gives approval handshake
    const signoffResponse = await agent.handleTurn('Approve');
    assert.equal(signoffResponse.isLocked, true);
    assert.equal(signoffResponse.documentPath, 'docs/TECH_STACK_AND_STRATEGY.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'TECH_STACK_AND_STRATEGY.md');
    assert.ok(fs.existsSync(savedDocPath), 'TECH_STACK_AND_STRATEGY.md must exist');

    // Verify StateManager locked Step 3 and advanced to Step 4
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 4);
    assert.ok(state.lockedSteps.includes(3));
    assert.equal(state.stepSummaries['step_3'].artifactPath, 'docs/TECH_STACK_AND_STRATEGY.md');
    assert.ok(state.stepSummaries['step_3'].summary.includes('TL;DR TECH STACK'));
    assert.equal(state.stepSummaries['step_3'].artifactSha256.length, 64);
  });
});
