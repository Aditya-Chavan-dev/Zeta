import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../src/core/state/state-manager.js';
import { ResumeSentinel } from '../../src/core/state/resume-sentinel.js';
import { Agent01Intent } from '../../src/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../../src/agents/agent-02-requirements/agent.js';

describe('Stress & Chaos Suite: High Concurrency & Interruption Resilience', () => {
  const testDir = path.join(process.cwd(), '.test-stress-concurrency');

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

  test('Heavy Concurrent Reads: 100 parallel reads while atomic writes are executing', async () => {
    StateManager.initialize(testDir, 'concurrent-reads-project');

    // Launch concurrent reader tasks
    const readPromises = Array.from({ length: 100 }).map(async (_, idx) => {
      // Small jitter
      const jitter = Math.floor(Math.random() * 20);
      await new Promise(r => setTimeout(r, jitter));
      const state = StateManager.load(testDir);
      assert.ok(state !== null, `Read ${idx} must return valid state`);
      assert.equal(state.projectId, 'concurrent-reads-project');
      return true;
    });

    // Concurrently perform 10 sequential turn records
    for (let i = 1; i <= 10; i++) {
      StateManager.recordTurn(testDir, `Turn message ${i}`, `Draft summary ${i}`);
    }

    const results = await Promise.all(readPromises);
    assert.equal(results.length, 100);

    const finalState = StateManager.load(testDir);
    assert.ok(finalState);
    assert.equal(finalState.turnCount, 10);
  });

  test('Hostile Recovery: State file truncated mid-write recovers via .tmp backup', () => {
    StateManager.initialize(testDir, 'recovery-test');
    StateManager.recordTurn(testDir, 'First turn', 'Summary 1');

    const statePath = StateManager.getStatePath(testDir);
    const tmpPath = `${statePath}.tmp`;

    // Simulate an interrupted turn where state.json was wiped or corrupted, but .tmp had valid content
    const validState = StateManager.load(testDir);
    assert.ok(validState);
    fs.writeFileSync(tmpPath, JSON.stringify(validState), 'utf8');
    fs.writeFileSync(statePath, 'CORRUPTED_PARTIAL_JSON_DATA{{{', 'utf8');

    // Loading should recover from the .tmp file
    const recovered = StateManager.load(testDir);
    assert.ok(recovered, 'StateManager must fallback and parse .tmp file on state.json corruption');
    assert.equal(recovered.projectId, 'recovery-test');
  });

  test('ResumeSentinel: Catches sudden crash with uncommitted draft and prepares warm resume', () => {
    StateManager.initialize(testDir, 'sentinel-test');
    
    // Simulate crash after user asked question but before step locking
    StateManager.recordTurn(testDir, 'How should we architect the datastore?', 'Drafting Top 3 DB options');

    const state = StateManager.load(testDir);
    assert.ok(state);
    const assessment = ResumeSentinel.assess(state);
    assert.equal(assessment.isInterrupted, true);
    assert.ok(assessment.resumptionGreeting.includes('interrupted'));
    assert.ok(assessment.resumptionGreeting.includes('How should we architect the datastore?'));
  });

  test('Rapid-Fire State Gating: 15 rapid lock/advance cycles with zero I/O locks', () => {
    StateManager.initialize(testDir, 'rapid-gating');

    for (let step = 0; step < 15; step++) {
      StateManager.lockStep(testDir, step, {
        stepNumber: step,
        stepName: `Step ${step}`,
        artifactPath: `docs/step-${step}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR for step ${step}`,
        artifactSha256: `${step}`.padStart(64, '0')
      });
      StateManager.advanceStep(testDir, step + 1);
    }

    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.lockedSteps.length, 15);
    assert.equal(state.activeStep, 15);
  });
});
