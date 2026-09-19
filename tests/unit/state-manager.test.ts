import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { StateManager } from '../../src/core/state/state-manager.js';
import { ResumeSentinel } from '../../src/core/state/resume-sentinel.js';

test('StateManager Suite: Atomic Per-Turn Persistence & Interruption Recovery', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-state-test-'));

  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await t.test('1. Initializes fresh session state in .zeta/state.json', () => {
    const state = StateManager.initialize(tempDir, 'proj_alpha');

    assert.equal(state.projectId, 'proj_alpha');
    assert.equal(state.activeStep, 0);
    assert.equal(state.stepStatus, 'IN_PROGRESS');
    assert.equal(state.turnCount, 0);
    assert.deepEqual(state.lockedSteps, []);

    const loaded = StateManager.load(tempDir);
    assert.ok(loaded);
    assert.equal(loaded.projectId, 'proj_alpha');
  });

  await t.test('2. Records turns atomically with uncommitted buffer', () => {
    const updated = StateManager.recordTurn(
      tempDir,
      'I want to build a real-time collaborative code editor',
      'Extracted problem statement: sync lag in existing editors'
    );

    assert.equal(updated.turnCount, 1);
    assert.equal(updated.uncommittedBuffer.lastUserMessage, 'I want to build a real-time collaborative code editor');
    assert.ok(updated.uncommittedBuffer.interruptedAt);

    // Verify written file matches
    const loaded = StateManager.load(tempDir);
    assert.ok(loaded);
    assert.equal(loaded.turnCount, 1);
    assert.equal(loaded.uncommittedBuffer.lastUserMessage, 'I want to build a real-time collaborative code editor');
  });

  await t.test('3. ResumeSentinel detects interrupted turn cleanly', () => {
    const loaded = StateManager.load(tempDir)!;
    const assessment = ResumeSentinel.assess(loaded);

    assert.equal(assessment.isInterrupted, true);
    assert.match(assessment.resumptionGreeting, /Previous session was interrupted mid-turn/);
    assert.match(assessment.resumptionGreeting, /I want to build a real-time collaborative code editor/);
  });

  await t.test('4. Locks Step 0 and advances to Step 1', () => {
    const locked = StateManager.lockStep(tempDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Definition & Project Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'Intent locked: Real-time collaborative editor with CRDT synchronization.',
      artifactSha256: 'abc123sha256hash'
    });

    assert.deepEqual(locked.lockedSteps, [0]);
    assert.equal(locked.stepStatus, 'LOCKED');
    assert.deepEqual(locked.uncommittedBuffer, {}); // Cleared on lock

    const advanced = StateManager.advanceStep(tempDir, 1);
    assert.equal(advanced.activeStep, 1);
    assert.equal(advanced.stepStatus, 'IN_PROGRESS');

    const assessment = ResumeSentinel.assess(advanced);
    assert.equal(assessment.isInterrupted, false);
    assert.match(assessment.resumptionGreeting, /Ready to proceed with Step 1/);
    assert.match(assessment.resumptionGreeting, /Locked & Approved: 1 of 15 stages complete/);
  });

  await t.test('5. Atomic write resilience: temporary file rename succeeds', () => {
    const statePath = StateManager.getStatePath(tempDir);
    assert.ok(fs.existsSync(statePath));
    assert.ok(!fs.existsSync(`${statePath}.tmp`)); // .tmp cleaned up by rename
  });
});
