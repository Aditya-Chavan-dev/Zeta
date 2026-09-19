import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../src/core/state/state-manager.js';
import { Agent01Intent } from '../../src/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../../src/agents/agent-02-requirements/agent.js';

describe('End-to-End Pipeline: Agent 01 -> Agent 02 Handshake & Gating', () => {
  const testDir = path.join(process.cwd(), '.test-e2e-pipeline');

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

  test('Agent 2 refuses to work before Agent 1 completes, then succeeds once Agent 1 is locked', async () => {
    // 1. Initialize empty session (Agent 1 has not run)
    StateManager.initialize(testDir, 'e2e-project');

    // 2. Attempt to invoke Agent 2 prematurely
    const prematureAgent2 = new Agent02Requirements(testDir);
    const prematureResponse = await prematureAgent2.handleTurn('Feature: Automated code checks');

    assert.equal(prematureResponse.isLocked, false);
    assert.ok(prematureResponse.error, 'Agent 2 must return error when Step 0 is not locked');
    assert.ok(
      prematureResponse.message.includes('Precondition Failed: Step 0'),
      'Agent 2 must explicitly refuse execution until Step 0 is locked'
    );

    // 3. Run Agent 1 to completion
    const agent1 = new Agent01Intent(testDir);
    let a1Response = await agent1.handleTurn(
      'I want to build an autonomous engineering governance plugin for IDEs to prevent technical debt.'
    );
    assert.equal(a1Response.isLocked, false);

    // Answer all Agent 1 clarifying questions
    let a1Iterations = 0;
    while (!a1Response.isReadyForSignoff && a1Iterations < 10) {
      a1Response = await agent1.handleTurn('1'); // Select option 1
      a1Iterations++;
    }
    assert.equal(a1Response.isReadyForSignoff, true);

    // User approves Step 0
    const a1Signoff = await agent1.handleTurn('Approve');
    assert.equal(a1Signoff.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'PROJECT_INTENT.md')));

    // 4. Verify state after Agent 1 lock
    const stateAfterStep0 = StateManager.load(testDir);
    assert.ok(stateAfterStep0);
    assert.equal(stateAfterStep0.activeStep, 1);
    assert.ok(stateAfterStep0.lockedSteps.includes(0));
    assert.ok(stateAfterStep0.stepSummaries['step_0'].summary.includes('TL;DR PROJECT INTENT'));

    // 5. Now invoke Agent 2 - it should successfully initialize and consume Step 0 TL;DR
    const agent2 = new Agent02Requirements(testDir);
    let a2Response = await agent2.handleTurn(
      'Feature: Per-turn atomic persistence and interactive question generator.'
    );
    assert.equal(a2Response.error, undefined, 'Agent 2 must run without precondition errors');
    assert.ok(agent2.getState().step0Tldr.includes('TL;DR PROJECT INTENT'), 'Agent 2 must have Step 0 TL;DR in state');

    // Answer all Agent 2 clarifying questions
    let a2Iterations = 0;
    while (!a2Response.isReadyForSignoff && a2Iterations < 10) {
      a2Response = await agent2.handleTurn('1'); // Select option 1
      a2Iterations++;
    }
    assert.equal(a2Response.isReadyForSignoff, true);

    // User approves Step 1
    const a2Signoff = await agent2.handleTurn('Approve');
    assert.equal(a2Signoff.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'REQUIREMENTS_SPECIFICATION.md')));

    // 6. Verify final state has both Step 0 and Step 1 locked in sequence
    const finalState = StateManager.load(testDir);
    assert.ok(finalState);
    assert.equal(finalState.activeStep, 2);
    assert.deepEqual(finalState.lockedSteps, [0, 1]);
    assert.ok(finalState.stepSummaries['step_0']);
    assert.ok(finalState.stepSummaries['step_1']);
    assert.equal(finalState.stepSummaries['step_0'].artifactPath, 'docs/PROJECT_INTENT.md');
    assert.equal(finalState.stepSummaries['step_1'].artifactPath, 'docs/REQUIREMENTS_SPECIFICATION.md');
  });
});
