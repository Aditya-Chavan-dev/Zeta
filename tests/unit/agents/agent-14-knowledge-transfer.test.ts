import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-14-knowledge-transfer/precondition-verifier.js';
import { KnowledgeAuditor } from '../../../src/agents/agent-14-knowledge-transfer/knowledge-auditor.js';
import { QuestionGenerator } from '../../../src/agents/agent-14-knowledge-transfer/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-14-knowledge-transfer/artifact-compiler.js';
import { Agent14KnowledgeTransfer } from '../../../src/agents/agent-14-knowledge-transfer/agent.js';

describe('Agent 14: Knowledge Transfer, Documentation & Education Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-14');

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

  test('Blocks execution if any of Steps 0 through 12 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent14KnowledgeTransfer(testDir);
    const resp1 = await agent.handleTurn('Audit knowledge transfer and documentation');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 11, Step 12 still missing
    for (let i = 0; i < 12; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter11 = new Agent14KnowledgeTransfer(testDir);
    const resp2 = await agentAfter11.handleTurn('Audit knowledge transfer and documentation');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 12'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 12 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy', 'SRE', 'Security', 'Governance'];
    for (let i = 0; i <= 12; i++) {
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
    assert.ok(check.step12Tldr.includes('Governance'));
  });

  test('QuestionGenerator produces Top 3 onboarding options with trade-offs', () => {
    const draft = KnowledgeAuditor.createEmptyDraft('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
    const q = QuestionGenerator.generateForArea('Developer Onboarding Velocity & Ramp-up Target', draft);

    assert.equal(q.category, 'Developer Onboarding Velocity & Ramp-up Target');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent14 executes interactive documentation audit and locks Step 13 on approval', async () => {
    // 1. Setup locked Steps 0 through 12
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan', 'Implementation', 'QA', 'Deploy', 'SRE', 'Security', 'Governance'];
    for (let i = 0; i <= 12; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent14KnowledgeTransfer(testDir);

    // Turn 1: Initial turn
    const turn1 = await agent.handleTurn('Audit developer onboarding, ADR catalog, quickstarts, and troubleshooting.');
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
    assert.equal(signoffResponse.documentPath, 'docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md');
    assert.ok(fs.existsSync(savedDocPath), 'KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md must exist');

    // Verify StateManager locked Step 13 and advanced to Step 14
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 14);
    assert.ok(state.lockedSteps.includes(13));
    assert.equal(state.stepSummaries['step_13'].artifactPath, 'docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md');
    assert.ok(state.stepSummaries['step_13'].summary.includes('TL;DR KNOWLEDGE TRANSFER'));
    assert.equal(state.stepSummaries['step_13'].artifactSha256.length, 64);
  });
});
