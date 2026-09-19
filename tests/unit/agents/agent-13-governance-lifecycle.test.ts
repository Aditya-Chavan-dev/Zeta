import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-13-governance-lifecycle/precondition-verifier.js';
import { GovernanceAuditor } from '../../../src/agents/agent-13-governance-lifecycle/governance-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-13-governance-lifecycle/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-13-governance-lifecycle/artifact-compiler.js';
import { Agent13GovernanceLifecycle } from '../../../src/agents/agent-13-governance-lifecycle/agent.js';

describe('Agent 13: Governance, Lifecycle & Deprecation Policy Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-13');

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

  test('Blocks execution if any of Steps 0 through 11 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent13GovernanceLifecycle(testDir);
    const resp1 = await agent.handleTurn('Audit SemVer rules and deprecation policies');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 10, Step 11 still missing
    for (let i = 0; i < 11; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter10 = new Agent13GovernanceLifecycle(testDir);
    const resp2 = await agentAfter10.handleTurn('Audit SemVer rules and deprecation policies');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 11'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 11 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy', 'SRE', 'Security'];
    for (let i = 0; i <= 11; i++) {
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
    assert.ok(check.step11Tldr.includes('Security'));
  });

  test('QuestionGenerator produces Top 3 governance options with trade-offs', () => {
    const draft = GovernanceAuditor.createEmptyDraft('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11');
    const q = QuestionGenerator.generateForArea('Breaking Change Notice & Deprecation Timeline', draft);

    assert.equal(q.category, 'Breaking Change Notice & Deprecation Timeline');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent13 executes interactive governance audit and locks Step 12 on approval', async () => {
    // 1. Setup locked Steps 0 through 11
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy', 'SRE', 'Security'];
    for (let i = 0; i <= 11; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent13GovernanceLifecycle(testDir);

    // Turn 1: Initial turn
    const turn1 = await agent.handleTurn('Audit SemVer rules, deprecation lifecycles, schema migrations, and drift guardrails.');
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
    assert.equal(signoffResponse.documentPath, 'docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md');
    assert.ok(fs.existsSync(savedDocPath), 'GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md must exist');

    // Verify StateManager locked Step 12 and advanced to Step 13
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 13);
    assert.ok(state.lockedSteps.includes(12));
    assert.equal(state.stepSummaries['step_12'].artifactPath, 'docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md');
    assert.ok(state.stepSummaries['step_12'].summary.includes('TL;DR GOVERNANCE, LIFECYCLE & DEPRECATION'));
    assert.equal(state.stepSummaries['step_12'].artifactSha256.length, 64);
  });
});
