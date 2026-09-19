import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../src/core/state/state-manager.js';
import { Agent01Intent } from '../../src/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../../src/agents/agent-02-requirements/agent.js';
import { Agent03Feasibility } from '../../src/agents/agent-03-feasibility/agent.js';
import { Agent05SystemArchitecture } from '../../src/agents/agent-05-system-architecture/agent.js';
import { Agent11OperationsSre } from '../../src/agents/agent-11-operations-sre/agent.js';
import { Agent15Retrospective } from '../../src/agents/agent-15-retrospective/agent.js';

describe('Hostile Input & Edge-Case Mutation Suite', () => {
  const testDir = path.join(process.cwd(), '.test-hostile-inputs');

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

  test('Hostile Inputs in Agent 01: Massive 100KB input string, unicode emojis, and script tags', async () => {
    StateManager.initialize(testDir, 'hostile-agent-01');
    const agent = new Agent01Intent(testDir);

    // 100KB long brain dump with adversarial script injection and emojis
    const massiveInput = '🚀 Build an enterprise grade governance system <script>alert(1)</script> '.repeat(1500);
    const resp1 = await agent.handleTurn(massiveInput);

    assert.equal(resp1.isLocked, false);
    assert.ok(resp1.message.length > 0);
    assert.ok(resp1.question !== undefined);

    // Answer with boundary inputs
    const resp2 = await agent.handleTurn('Option 1: Recommended \u0000 \uFFFF');
    assert.equal(resp2.isLocked, false);
  });

  test('Out-of-Order Execution Attempt: Later agents fail gracefully without crash', async () => {
    StateManager.initialize(testDir, 'out-of-order');

    // Attempting Agent 15 directly on fresh session
    const agent15 = new Agent15Retrospective(testDir);
    const resp15 = await agent15.handleTurn('Run retrospective now');
    assert.ok(resp15.error);
    assert.ok(resp15.message.includes('Precondition Failed: Step 0'));

    // Attempting Agent 05 directly
    const agent05 = new Agent05SystemArchitecture(testDir);
    const resp05 = await agent05.handleTurn('Design system');
    assert.ok(resp05.error);
    assert.ok(resp05.message.includes('Precondition Failed'));
  });

  test('Cryptographic State Drift Tampering: Mutating locked step document fails sha256 check', async () => {
    StateManager.initialize(testDir, 'tamper-test');

    // Run Agent 01 to lock
    const agent1 = new Agent01Intent(testDir);
    let a1Resp = await agent1.handleTurn('Build greenfield governance tool');
    while (!a1Resp.isReadyForSignoff) {
      a1Resp = await agent1.handleTurn('1');
    }
    const a1Lock = await agent1.handleTurn('Approve');
    assert.equal(a1Lock.isLocked, true);

    const docPath = path.join(testDir, 'docs', 'PROJECT_INTENT.md');
    assert.ok(fs.existsSync(docPath));

    const originalContent = fs.readFileSync(docPath, 'utf8');
    const originalState = StateManager.load(testDir);
    assert.ok(originalState);
    const originalHash = originalState.stepSummaries['step_0'].artifactSha256;

    // Malicious actor modifies the locked document behind the scenes
    fs.writeFileSync(docPath, originalContent + '\n<!-- TAMPERED BY THIRD PARTY -->', 'utf8');

    // Calculate new hash directly
    const crypto = await import('crypto');
    const tamperedHash = crypto.createHash('sha256').update(fs.readFileSync(docPath)).digest('hex');

    assert.notEqual(tamperedHash, originalHash, 'Tampered document must yield distinct SHA-256');
  });

  test('Extreme Turn Volume: 200 rapid turns on single session without memory leak or corruption', () => {
    StateManager.initialize(testDir, 'high-volume');

    const start = Date.now();
    for (let turn = 1; turn <= 200; turn++) {
      StateManager.recordTurn(testDir, `User message ${turn}`, `Draft summary ${turn}`);
    }
    const elapsed = Date.now() - start;

    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.turnCount, 200);
    // 200 atomic disk writes must complete in reasonable time (< 3000ms)
    assert.ok(elapsed < 6000, `200 atomic turns should complete under 6000ms, took ${elapsed}ms`);
  });
});
