import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-09-verification-qa/precondition-verifier.js';
import { QaAuditor } from '../../../src/agents/agent-09-verification-qa/qa-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-09-verification-qa/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-09-verification-qa/artifact-compiler.js';
import { Agent09VerificationQa } from '../../../src/agents/agent-09-verification-qa/agent.js';

describe('Agent 09: Verification, Validation & Quality Assurance Engineer', () => {
  const testDir = path.join(process.cwd(), '.test-agent-09');

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

  test('Blocks execution if any of Steps 0 through 7 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent09VerificationQa(testDir);
    const resp1 = await agent.handleTurn('Run QA verification and audit');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 6, Step 7 still missing
    for (let i = 0; i < 7; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter6 = new Agent09VerificationQa(testDir);
    const resp2 = await agentAfter6.handleTurn('Run QA verification and audit');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 7'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 7 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation'];
    for (let i = 0; i <= 7; i++) {
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
    assert.ok(check.step7Tldr.includes('Implementation'));
  });

  test('QuestionGenerator produces Top 3 QA test strategies with trade-offs', () => {
    const draft = QaAuditor.createEmptyDraft('TL;DR 0', 'TL;DR 1', 'TL;DR 2', 'TL;DR 3', 'TL;DR 4', 'TL;DR 5', 'TL;DR 6', 'TL;DR 7');
    const q = QuestionGenerator.generateForArea('Adversarial Chaos & Stress Test Scope', draft);

    assert.equal(q.category, 'Adversarial Chaos & Stress Test Scope');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent09 executes interactive audit and locks Step 8 on approval', async () => {
    // 1. Setup locked Steps 0 through 7
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation'];
    for (let i = 0; i <= 7; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent09VerificationQa(testDir);

    // Turn 1: QA Audit initial turn
    const turn1 = await agent.handleTurn('Conduct exhaustive QA verification, test matrix auditing, and compliance validation.');
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
    assert.equal(signoffResponse.documentPath, 'docs/VERIFICATION_AND_QA_PACKAGE.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'VERIFICATION_AND_QA_PACKAGE.md');
    assert.ok(fs.existsSync(savedDocPath), 'VERIFICATION_AND_QA_PACKAGE.md must exist');

    // Verify StateManager locked Step 8 and advanced to Step 9
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 9);
    assert.ok(state.lockedSteps.includes(8));
    assert.equal(state.stepSummaries['step_8'].artifactPath, 'docs/VERIFICATION_AND_QA_PACKAGE.md');
    assert.ok(state.stepSummaries['step_8'].summary.includes('TL;DR VERIFICATION & QA'));
    assert.equal(state.stepSummaries['step_8'].artifactSha256.length, 64);
  });
});
