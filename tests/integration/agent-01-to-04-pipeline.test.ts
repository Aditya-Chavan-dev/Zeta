import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../src/core/state/state-manager.js';
import { Agent01Intent } from '../../src/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../../src/agents/agent-02-requirements/agent.js';
import { Agent03Feasibility } from '../../src/agents/agent-03-feasibility/agent.js';
import { Agent04TechStrategy } from '../../src/agents/agent-04-tech-strategy/agent.js';

describe('End-to-End 4-Stage Lifecycle: Agent 01 -> Agent 02 -> Agent 03 -> Agent 04', () => {
  const testDir = path.join(process.cwd(), '.test-e2e-4stages');

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

  test('Executes full 4-agent chain with strict gating and zero state loss', async () => {
    StateManager.initialize(testDir, 'e2e-4stages');

    // === STAGE 0: Agent 01 ===
    const agent1 = new Agent01Intent(testDir);
    let a1Resp = await agent1.handleTurn('I want to build an autonomous engineering governance plugin.');
    while (!a1Resp.isReadyForSignoff) {
      a1Resp = await agent1.handleTurn('1');
    }
    const a1Lock = await agent1.handleTurn('Approve');
    assert.equal(a1Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'PROJECT_INTENT.md')));

    // === STAGE 1: Agent 02 ===
    const agent2 = new Agent02Requirements(testDir);
    let a2Resp = await agent2.handleTurn('Feature: Per-turn atomic persistence and drift detection.');
    while (!a2Resp.isReadyForSignoff) {
      a2Resp = await agent2.handleTurn('1');
    }
    const a2Lock = await agent2.handleTurn('Approve');
    assert.equal(a2Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'REQUIREMENTS_SPECIFICATION.md')));

    // === STAGE 2: Agent 03 ===
    const agent3 = new Agent03Feasibility(testDir);
    let a3Resp = await agent3.handleTurn('Evaluate feasibility under local disk constraints.');
    while (!a3Resp.isReadyForSignoff) {
      a3Resp = await agent3.handleTurn('1');
    }
    const a3Lock = await agent3.handleTurn('Approve');
    assert.equal(a3Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'FEASIBILITY_AND_RISK_REPORT.md')));

    // === STAGE 3: Agent 04 ===
    const agent4 = new Agent04TechStrategy(testDir);
    let a4Resp = await agent4.handleTurn('Select tech stack and runtime frameworks.');
    while (!a4Resp.isReadyForSignoff) {
      a4Resp = await agent4.handleTurn('1');
    }
    const a4Lock = await agent4.handleTurn('Approve');
    assert.equal(a4Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'TECH_STACK_AND_STRATEGY.md')));

    // === Final State Verification ===
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 4);
    assert.deepEqual(state.lockedSteps, [0, 1, 2, 3]);
    assert.ok(state.stepSummaries['step_0']);
    assert.ok(state.stepSummaries['step_1']);
    assert.ok(state.stepSummaries['step_2']);
    assert.ok(state.stepSummaries['step_3']);
  });
});
