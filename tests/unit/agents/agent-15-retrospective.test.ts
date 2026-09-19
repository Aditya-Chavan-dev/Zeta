import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-15-retrospective/precondition-verifier.js';
import { RetrospectiveAuditor } from '../../../src/agents/agent-15-retrospective/retrospective-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-15-retrospective/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-15-retrospective/artifact-compiler.js';
import { Agent15Retrospective } from '../../../src/agents/agent-15-retrospective/agent.js';

describe('Agent 15: Project Retrospective & Continuous Improvement Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-15');

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

  test('Blocks execution if any of Steps 0 through 13 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent15Retrospective(testDir);
    const resp1 = await agent.handleTurn('Conduct final project retrospective');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 12, Step 13 still missing
    for (let i = 0; i < 13; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter12 = new Agent15Retrospective(testDir);
    const resp2 = await agentAfter12.handleTurn('Conduct final project retrospective');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 13'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 13 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = [
      'Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture',
      'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy',
      'SRE', 'Security', 'Governance', 'Knowledge'
    ];
    for (let i = 0; i <= 13; i++) {
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
    assert.ok(check.step13Tldr.includes('Knowledge'));
  });

  test('QuestionGenerator produces Top 3 retrospective options with trade-offs', () => {
    const draft = RetrospectiveAuditor.createEmptyDraft('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13');
    const q = QuestionGenerator.generateForArea('Continuous Improvement Sprint Prioritization', draft);

    assert.equal(q.category, 'Continuous Improvement Sprint Prioritization');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent15 executes interactive retrospective and locks Step 14 on approval', async () => {
    // 1. Setup locked Steps 0 through 13
    StateManager.initialize(testDir, 'test-project');
    const stepNames = [
      'Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture',
      'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy',
      'SRE', 'Security', 'Governance', 'Knowledge'
    ];
    for (let i = 0; i <= 13; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent15Retrospective(testDir);

    // Turn 1: Initial turn
    const turn1 = await agent.handleTurn('Conduct comprehensive 15-stage project retrospective and continuous improvement synthesis.');
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
    assert.equal(signoffResponse.projectCompleted, true);
    assert.equal(signoffResponse.documentPath, 'docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md');
    assert.ok(fs.existsSync(savedDocPath), 'PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md must exist');

    // Verify StateManager locked Step 14
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.ok(state.lockedSteps.includes(14));
    assert.equal(state.lockedSteps.length, 15);
    assert.equal(state.stepSummaries['step_14'].artifactPath, 'docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md');
    assert.ok(state.stepSummaries['step_14'].summary.includes('TL;DR PROJECT RETROSPECTIVE'));
    assert.equal(state.stepSummaries['step_14'].artifactSha256.length, 64);
  });
});
