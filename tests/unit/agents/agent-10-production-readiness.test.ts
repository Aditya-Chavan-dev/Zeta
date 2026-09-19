import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-10-production-readiness/precondition-verifier.js';
import { ReleaseReadinessAuditor } from '../../../src/agents/agent-10-production-readiness/release-readiness-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-10-production-readiness/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-10-production-readiness/artifact-compiler.js';
import { Agent10ProductionReadiness } from '../../../src/agents/agent-10-production-readiness/agent.js';

describe('Agent 10: Production Readiness, Deployment & Release Engineer', () => {
  const testDir = path.join(process.cwd(), '.test-agent-10');

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

  test('Blocks execution if any of Steps 0 through 8 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent10ProductionReadiness(testDir);
    const resp1 = await agent.handleTurn('Audit production readiness and release topology');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 7, Step 8 still missing
    for (let i = 0; i < 8; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter7 = new Agent10ProductionReadiness(testDir);
    const resp2 = await agentAfter7.handleTurn('Audit production readiness and release topology');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 8'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 8 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA'];
    for (let i = 0; i <= 8; i++) {
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
    assert.ok(check.step8Tldr.includes('QA'));
  });

  test('QuestionGenerator produces Top 3 deployment options with trade-offs', () => {
    const draft = ReleaseReadinessAuditor.createEmptyDraft('0', '1', '2', '3', '4', '5', '6', '7', '8');
    const q = QuestionGenerator.generateForArea('Production Deployment Packaging & Distribution Model', draft);

    assert.equal(q.category, 'Production Deployment Packaging & Distribution Model');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent10 executes interactive readiness assessment and locks Step 9 on approval', async () => {
    // 1. Setup locked Steps 0 through 8
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA'];
    for (let i = 0; i <= 8; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent10ProductionReadiness(testDir);

    // Turn 1: Initial turn
    const turn1 = await agent.handleTurn('Audit production release gates, rollback mechanics, and launch readiness.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer questions until signoff prompt
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
    assert.equal(signoffResponse.documentPath, 'docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'PRODUCTION_READINESS_AND_DEPLOYMENT.md');
    assert.ok(fs.existsSync(savedDocPath), 'PRODUCTION_READINESS_AND_DEPLOYMENT.md must exist');

    // Verify StateManager locked Step 9 and advanced to Step 10
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 10);
    assert.ok(state.lockedSteps.includes(9));
    assert.equal(state.stepSummaries['step_9'].artifactPath, 'docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md');
    assert.ok(state.stepSummaries['step_9'].summary.includes('TL;DR PRODUCTION READINESS'));
    assert.equal(state.stepSummaries['step_9'].artifactSha256.length, 64);
  });
});
