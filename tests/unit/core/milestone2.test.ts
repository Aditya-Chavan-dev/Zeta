import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SqliteStore } from '../../../src/core/state/sqlite-store.js';
import { GovernanceEngine } from '../../../src/core/engine/governance-engine.js';
import { ExitCode } from '../../../src/core/state/schema.js';

describe('Milestone 2: GovernanceEngine Central Authority & Gating', () => {
  let tmpDir: string;
  let store: SqliteStore;
  let engine: GovernanceEngine;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-m2-test-'));
    store = new SqliteStore(tmpDir);
    engine = new GovernanceEngine(store);
  });

  afterEach(() => {
    store.close();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test('isApprovalIntent parses exact trimmed case-insensitive Approve', () => {
    assert.strictEqual(GovernanceEngine.isApprovalIntent('Approve'), true);
    assert.strictEqual(GovernanceEngine.isApprovalIntent('  approve  '), true);
    assert.strictEqual(GovernanceEngine.isApprovalIntent('APPROVE'), true);
    assert.strictEqual(GovernanceEngine.isApprovalIntent('Approved'), false);
    assert.strictEqual(GovernanceEngine.isApprovalIntent('Go ahead'), false);
    assert.strictEqual(GovernanceEngine.isApprovalIntent('yes please approve'), false);
  });

  test('Blocks approval if predecessor stage is unlocked', async () => {
    const state = store.initialize('test-pred');
    state.activeStep = 1; // Step 0 is not locked
    state.uncommittedBuffer = { activeDraft: { title: 'draft 1' } };
    store.saveState(state);

    const result = await engine.executeApproval(() => ({
      fullDocument: '# Step 1',
      tldrSummary: 'Step 1'
    }));

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.exitCode, ExitCode.BLOCKED_APPROVAL);
    assert.ok(result.message.includes('Prerequisite Step 0 is not locked'));
  });

  test('Allows approval when valid, writes disk file, and advances stage', async () => {
    store.initialize('test-valid');
    store.recordTurn('Raw dump', '50%', { problemStatement: 'test prob' }, []);

    const result = await engine.executeApproval((draft: any) => ({
      fullDocument: `# PROJECT INTENT\n${draft.problemStatement}`,
      tldrSummary: 'Project intent summary'
    }));

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.exitCode, ExitCode.SUCCESS);
    assert.strictEqual(result.stage, 0);

    // Verify disk file
    const docPath = path.join(tmpDir, 'docs', 'PROJECT_INTENT.md');
    assert.ok(fs.existsSync(docPath));
    assert.ok(fs.readFileSync(docPath, 'utf8').includes('test prob'));

    // Verify advanced to step 1
    const nextState = store.loadState();
    assert.strictEqual(nextState?.activeStep, 1);
    assert.deepStrictEqual(nextState?.lockedSteps, [0]);
  });

  test('Amendment invalidates downstream locked steps', () => {
    const state = store.initialize('test-amend');
    state.lockedSteps = [0, 1, 2, 3];
    state.activeStep = 4;
    const dummyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const now = new Date().toISOString();
    state.stepSummaries = {
      step_0: { stepNumber: 0, stepName: 's0', artifactPath: 'p0', lockedAt: now, summary: 's0 summary', artifactSha256: dummyHash },
      step_1: { stepNumber: 1, stepName: 's1', artifactPath: 'p1', lockedAt: now, summary: 's1 summary', artifactSha256: dummyHash },
      step_2: { stepNumber: 2, stepName: 's2', artifactPath: 'p2', lockedAt: now, summary: 's2 summary', artifactSha256: dummyHash },
      step_3: { stepNumber: 3, stepName: 's3', artifactPath: 'p3', lockedAt: now, summary: 's3 summary', artifactSha256: dummyHash }
    };
    store.saveState(state);

    const rolledBack = engine.rollbackForAmendment(2, 'Architecture refactor');
    assert.strictEqual(rolledBack.activeStep, 2);
    assert.deepStrictEqual(rolledBack.lockedSteps, [0, 1]);
    assert.strictEqual(Object.keys(rolledBack.stepSummaries).length, 2);
  });
});
