import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-12-security-compliance/precondition-verifier.js';
import { SecurityAuditor } from '../../../src/agents/agent-12-security-compliance/security-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-12-security-compliance/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-12-security-compliance/artifact-compiler.js';
import { Agent12SecurityCompliance } from '../../../src/agents/agent-12-security-compliance/agent.js';

describe('Agent 12: Security, Privacy & Compliance Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-12');

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

  test('Blocks execution if any of Steps 0 through 10 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent12SecurityCompliance(testDir);
    const resp1 = await agent.handleTurn('Audit STRIDE security and privacy compliance');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 9, Step 10 still missing
    for (let i = 0; i < 10; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter9 = new Agent12SecurityCompliance(testDir);
    const resp2 = await agentAfter9.handleTurn('Audit STRIDE security and privacy compliance');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 10'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 10 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy', 'SRE'];
    for (let i = 0; i <= 10; i++) {
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
    assert.ok(check.step10Tldr.includes('SRE'));
  });

  test('QuestionGenerator produces Top 3 security options with trade-offs', () => {
    const draft = SecurityAuditor.createEmptyDraft('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10');
    const q = QuestionGenerator.generateForArea('STRIDE Threat Mitigation & Residual Risk Tolerance', draft);

    assert.equal(q.category, 'STRIDE Threat Mitigation & Residual Risk Tolerance');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent12 executes interactive security audit and locks Step 11 on approval', async () => {
    // 1. Setup locked Steps 0 through 10
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy', 'SRE'];
    for (let i = 0; i <= 10; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent12SecurityCompliance(testDir);

    // Turn 1: Initial turn
    const turn1 = await agent.handleTurn('Audit STRIDE threat modeling, zero-cloud data privacy, and SBOM licensing.');
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
    assert.equal(signoffResponse.documentPath, 'docs/SECURITY_PRIVACY_AND_COMPLIANCE.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'SECURITY_PRIVACY_AND_COMPLIANCE.md');
    assert.ok(fs.existsSync(savedDocPath), 'SECURITY_PRIVACY_AND_COMPLIANCE.md must exist');

    // Verify StateManager locked Step 11 and advanced to Step 12
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 12);
    assert.ok(state.lockedSteps.includes(11));
    assert.equal(state.stepSummaries['step_11'].artifactPath, 'docs/SECURITY_PRIVACY_AND_COMPLIANCE.md');
    assert.ok(state.stepSummaries['step_11'].summary.includes('TL;DR SECURITY, PRIVACY & COMPLIANCE'));
    assert.equal(state.stepSummaries['step_11'].artifactSha256.length, 64);
  });
});
