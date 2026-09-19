import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-07-implementation-planning/precondition-verifier.js';
import { PlanGenerator } from '../../../src/agents/agent-07-implementation-planning/plan-generator.js';
import { QuestionGenerator } from '../../../src/agents/agent-07-implementation-planning/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-07-implementation-planning/artifact-compiler.js';
import { Agent07ImplementationPlanning } from '../../../src/agents/agent-07-implementation-planning/agent.js';

describe('Agent 07: Implementation Planning & Engineering Work Breakdown Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-07');

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

  test('Blocks execution if any of Steps 0 through 5 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent07ImplementationPlanning(testDir);
    const resp1 = await agent.handleTurn('Generate WBS tasks and schedule');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 4, Step 5 still missing
    for (let i = 0; i < 5; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter4 = new Agent07ImplementationPlanning(testDir);
    const resp2 = await agentAfter4.handleTurn('Generate WBS tasks and schedule');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 5'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 5 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design'];
    for (let i = 0; i <= 5; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} Baseline summary content.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const check = PreconditionVerifier.verifyPrerequisites(testDir);
    assert.equal(check.isValid, true);
    assert.ok(check.step0Tldr.includes('Intent'));
    assert.ok(check.step5Tldr.includes('Detailed Design'));
  });

  test('QuestionGenerator produces Top 3 delivery sequencing strategies with trade-offs', () => {
    const draft = PlanGenerator.createEmptyDraft('TL;DR 0', 'TL;DR 1', 'TL;DR 2', 'TL;DR 3', 'TL;DR 4', 'TL;DR 5');
    const q = QuestionGenerator.generateForArea('Delivery Sequencing Strategy', draft);

    assert.equal(q.category, 'Delivery Sequencing Strategy');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent07 executes interactive planning and locks Step 6 on approval', async () => {
    // 1. Setup locked Steps 0 through 5
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design'];
    for (let i = 0; i <= 5; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent07ImplementationPlanning(testDir);

    // Turn 1: Planning
    const turn1 = await agent.handleTurn('Break down architecture into sequenced WBS tasks with DoR and DoD.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer planning questions until signoff prompt
    let currentResponse = turn1;
    let iterations = 0;
    while (!currentResponse.isReadyForSignoff && iterations < 10) {
      currentResponse = await agent.handleTurn('1'); // Pick option 1
      iterations++;
    }

    assert.equal(currentResponse.isReadyForSignoff, true);
    assert.ok(currentResponse.message.includes('Approve'));

    // Turn: User gives approval handshake
    const signoffResponse = await agent.handleTurn('Approve');
    assert.equal(signoffResponse.isLocked, true);
    assert.equal(signoffResponse.documentPath, 'docs/IMPLEMENTATION_PLAN_AND_WBS.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'IMPLEMENTATION_PLAN_AND_WBS.md');
    assert.ok(fs.existsSync(savedDocPath), 'IMPLEMENTATION_PLAN_AND_WBS.md must exist');

    // Verify StateManager locked Step 6 and advanced to Step 7
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 7);
    assert.ok(state.lockedSteps.includes(6));
    assert.equal(state.stepSummaries['step_6'].artifactPath, 'docs/IMPLEMENTATION_PLAN_AND_WBS.md');
    assert.ok(state.stepSummaries['step_6'].summary.includes('TL;DR IMPLEMENTATION PLAN'));
    assert.equal(state.stepSummaries['step_6'].artifactSha256.length, 64);
  });
});
