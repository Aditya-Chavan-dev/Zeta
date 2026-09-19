import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-06-detailed-design/precondition-verifier.js';
import { DetailedDesigner } from '../../../src/agents/agent-06-detailed-design/detailed-designer.js';
import { QuestionGenerator } from '../../../src/agents/agent-06-detailed-design/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-06-detailed-design/artifact-compiler.js';
import { Agent06DetailedDesign } from '../../../src/agents/agent-06-detailed-design/agent.js';

describe('Agent 06: Detailed Technical Design & Engineering Design Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-06');

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

  test('Blocks execution if any of Steps 0 through 4 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent06DetailedDesign(testDir);
    const resp1 = await agent.handleTurn('Create detailed technical design');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 3, Step 4 still missing
    for (let i = 0; i < 4; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter3 = new Agent06DetailedDesign(testDir);
    const resp2 = await agentAfter3.handleTurn('Create detailed technical design');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 4'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 4 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture'];
    for (let i = 0; i <= 4; i++) {
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
    assert.ok(check.step4Tldr.includes('Architecture'));
  });

  test('QuestionGenerator produces Top 3 technical design patterns with trade-offs', () => {
    const draft = DetailedDesigner.createEmptyDraft('TL;DR 0', 'TL;DR 1', 'TL;DR 2', 'TL;DR 3', 'TL;DR 4');
    const q = QuestionGenerator.generateForArea('Input Validation & Sanitization Schema', draft);

    assert.equal(q.category, 'Input Validation & Sanitization Schema');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent06 executes interactive detailed technical design and locks Step 5 on approval', async () => {
    // 1. Setup locked Steps 0 through 4
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture'];
    for (let i = 0; i <= 4; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent06DetailedDesign(testDir);

    // Turn 1: Detailed design
    const turn1 = await agent.handleTurn('Formalize module method signatures, state machine, and error taxonomy.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer technical questions until signoff prompt
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
    assert.equal(signoffResponse.documentPath, 'docs/DETAILED_TECHNICAL_DESIGN.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'DETAILED_TECHNICAL_DESIGN.md');
    assert.ok(fs.existsSync(savedDocPath), 'DETAILED_TECHNICAL_DESIGN.md must exist');

    // Verify StateManager locked Step 5 and advanced to Step 6
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 6);
    assert.ok(state.lockedSteps.includes(5));
    assert.equal(state.stepSummaries['step_5'].artifactPath, 'docs/DETAILED_TECHNICAL_DESIGN.md');
    assert.ok(state.stepSummaries['step_5'].summary.includes('TL;DR DETAILED TECHNICAL DESIGN'));
    assert.equal(state.stepSummaries['step_5'].artifactSha256.length, 64);
  });
});
