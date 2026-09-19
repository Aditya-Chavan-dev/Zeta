import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-11-operations-sre/precondition-verifier.js';
import { SreAuditor } from '../../../src/agents/agent-11-operations-sre/sre-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-11-operations-sre/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-11-operations-sre/artifact-compiler.js';
import { Agent11OperationsSre } from '../../../src/agents/agent-11-operations-sre/agent.js';

describe('Agent 11: Operations, Maintenance & Site Reliability Engineer', () => {
  const testDir = path.join(process.cwd(), '.test-agent-11');

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

  test('Blocks execution if any of Steps 0 through 9 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent11OperationsSre(testDir);
    const resp1 = await agent.handleTurn('Audit SRE runbooks and SLOs');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 8, Step 9 still missing
    for (let i = 0; i < 9; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter8 = new Agent11OperationsSre(testDir);
    const resp2 = await agentAfter8.handleTurn('Audit SRE runbooks and SLOs');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 9'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 9 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy'];
    for (let i = 0; i <= 9; i++) {
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
    assert.ok(check.step9Tldr.includes('Deploy'));
  });

  test('QuestionGenerator produces Top 3 SRE incident triage options with trade-offs', () => {
    const draft = SreAuditor.createEmptyDraft('0', '1', '2', '3', '4', '5', '6', '7', '8', '9');
    const q = QuestionGenerator.generateForArea('Incident Triage & Auto-Escalation Protocol', draft);

    assert.equal(q.category, 'Incident Triage & Auto-Escalation Protocol');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent11 executes interactive SRE audit and locks Step 10 on approval', async () => {
    // 1. Setup locked Steps 0 through 9
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy'];
    for (let i = 0; i <= 9; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent11OperationsSre(testDir);

    // Turn 1: Initial turn
    const turn1 = await agent.handleTurn('Audit SRE runbooks, SLO metrics, disaster recovery, and maintenance.');
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
    assert.equal(signoffResponse.documentPath, 'docs/OPERATIONS_MAINTENANCE_AND_SRE.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'OPERATIONS_MAINTENANCE_AND_SRE.md');
    assert.ok(fs.existsSync(savedDocPath), 'OPERATIONS_MAINTENANCE_AND_SRE.md must exist');

    // Verify StateManager locked Step 10 and advanced to Step 11
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 11);
    assert.ok(state.lockedSteps.includes(10));
    assert.equal(state.stepSummaries['step_10'].artifactPath, 'docs/OPERATIONS_MAINTENANCE_AND_SRE.md');
    assert.ok(state.stepSummaries['step_10'].summary.includes('TL;DR OPERATIONS & SRE'));
    assert.equal(state.stepSummaries['step_10'].artifactSha256.length, 64);
  });
});
