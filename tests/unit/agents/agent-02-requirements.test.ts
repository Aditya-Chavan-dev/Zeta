import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { IntentVerifier } from '../../../src/agents/agent-02-requirements/intent-verifier.js';
import { RequirementsElicitor } from '../../../src/agents/agent-02-requirements/requirements-elicitor.js';
import { QuestionGenerator } from '../../../src/agents/agent-02-requirements/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-02-requirements/artifact-compiler.js';
import { Agent02Requirements } from '../../../src/agents/agent-02-requirements/agent.js';

describe('Agent 02: Requirements Gathering & Elicitation Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-02');

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

  test('Blocks execution if Step 0 is not locked in session state', async () => {
    // Session initialized but Step 0 not locked
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent02Requirements(testDir);
    const response = await agent.handleTurn('I need user authentication and session management.');

    assert.ok(response.error);
    assert.ok(response.message.includes('Precondition Failed: Step 0'));
    assert.equal(response.isLocked, false);
  });

  test('IntentVerifier extracts Step 0 TL;DR and checks scope drift', () => {
    StateManager.initialize(testDir, 'test-project');
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Definition & Project Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR: Greenfield autonomous IDE governance lifecycle without legacy reverse-engineering.',
      artifactSha256: 'a'.repeat(64)
    });

    const check = IntentVerifier.verifyStep0Locked(testDir);
    assert.equal(check.isValid, true);
    assert.ok(check.step0Tldr.includes('Greenfield autonomous IDE governance'));

    // Test drift detection
    const drift = IntentVerifier.checkScopeDrift('We need to reverse-engineer legacy codebases.', check.step0Tldr);
    assert.equal(drift.length, 1);
    assert.ok(drift[0].includes('OUT-OF-SCOPE'));
  });

  test('QuestionGenerator produces Top 3 options for missing requirement areas', () => {
    const draft = RequirementsElicitor.createEmptyDraft('Step 0 TL;DR');
    const q = QuestionGenerator.generateForCategory('Performance & Latency', draft);

    assert.equal(q.category, 'Performance & Latency');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent02 executes full interactive elicitation and locks Step 1 on approval', async () => {
    // 1. Setup locked Step 0 state
    StateManager.initialize(testDir, 'test-project');
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Definition & Project Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR: Greenfield autonomous engineering governance lifecycle.',
      artifactSha256: 'b'.repeat(64)
    });

    const agent = new Agent02Requirements(testDir);

    // Turn 1: Feature requirements input
    const turn1 = await agent.handleTurn('Feature: Automated step gating and session persistence.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer questions with option 1 until signoff prompt
    let currentResponse = turn1;
    let iterations = 0;
    while (!currentResponse.isReadyForSignoff && iterations < 10) {
      currentResponse = await agent.handleTurn('1');
      iterations++;
    }

    assert.equal(currentResponse.isReadyForSignoff, true);
    assert.ok(currentResponse.message.includes('Approve'));

    // Turn: User gives approval handshake
    const signoffResponse = await agent.handleTurn('Approve');
    assert.equal(signoffResponse.isLocked, true);
    assert.equal(signoffResponse.documentPath, 'docs/REQUIREMENTS_SPECIFICATION.md');

    // Verify file created on disk
    const savedDocPath = path.join(testDir, 'docs', 'REQUIREMENTS_SPECIFICATION.md');
    assert.ok(fs.existsSync(savedDocPath), 'REQUIREMENTS_SPECIFICATION.md must exist');

    // Verify StateManager locked Step 1 and advanced to Step 2
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 2);
    assert.ok(state.lockedSteps.includes(1));
    assert.equal(state.stepSummaries['step_1'].artifactPath, 'docs/REQUIREMENTS_SPECIFICATION.md');
    assert.ok(state.stepSummaries['step_1'].summary.includes('TL;DR REQUIREMENTS SPECIFICATION'));
    assert.equal(state.stepSummaries['step_1'].artifactSha256.length, 64);
  });
});
