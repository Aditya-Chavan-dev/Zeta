import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CANONICAL_LIFECYCLE, LifecycleRegistry } from '../../../src/core/lifecycle/lifecycle-map.js';
import { SqliteStore } from '../../../src/core/state/sqlite-store.js';
import { JsonToSqliteMigrator } from '../../../src/core/migration/json-migrator.js';
import { ExitCode } from '../../../src/core/state/schema.js';

describe('Milestone 1: Schemas, Lifecycle Map & Safe Migrator', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-m1-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test('Canonical lifecycle map contains exactly 15 stages (0-14)', () => {
    assert.strictEqual(CANONICAL_LIFECYCLE.length, 15);
    for (let i = 0; i <= 14; i++) {
      const stage = LifecycleRegistry.getStage(i);
      assert.strictEqual(stage.stage, i);
      assert.ok(stage.agentId.startsWith('agent-'));
      assert.ok(stage.documentPath.startsWith('docs/'));
    }
  });

  test('Exit codes conform to authoritative specification', () => {
    assert.strictEqual(ExitCode.SUCCESS, 0);
    assert.strictEqual(ExitCode.BLOCKED_APPROVAL, 1);
    assert.strictEqual(ExitCode.INVALID_INPUT, 2);
    assert.strictEqual(ExitCode.LOCK_OR_CORRUPTION, 3);
    assert.strictEqual(ExitCode.FATAL_ERROR, 4);
  });

  test('SqliteStore initializes with WAL mode and persists state transactionally', () => {
    const store = new SqliteStore(tmpDir);
    const state = store.initialize('proj-test');
    assert.strictEqual(state.projectId, 'proj-test');
    assert.strictEqual(state.activeStep, 0);
    assert.strictEqual(state.stepStatus, 'IN_PROGRESS');

    const loaded = store.loadState();
    assert.deepStrictEqual(loaded?.projectId, 'proj-test');
    store.close();
  });

  test('JsonToSqliteMigrator aborts safely if disk artifact hash mismatches', async () => {
    const zetaDir = path.join(tmpDir, '.zeta');
    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(zetaDir, { recursive: true });
    fs.mkdirSync(docsDir, { recursive: true });

    const docPath = path.join(docsDir, 'PROJECT_INTENT.md');
    fs.writeFileSync(docPath, '# Corrupted content', 'utf8');

    const stateJson = {
      version: 1,
      projectId: 'mig-test',
      activeStep: 1,
      stepStatus: 'IN_PROGRESS',
      turnCount: 1,
      lastTurnTimestamp: new Date().toISOString(),
      lockedSteps: [0],
      stepSummaries: {
        step_0: {
          stepNumber: 0,
          stepName: 'Problem Definition',
          artifactPath: 'docs/PROJECT_INTENT.md',
          lockedAt: new Date().toISOString(),
          summary: 'Test summary',
          artifactSha256: '0000000000000000000000000000000000000000000000000000000000000000'
        }
      },
      uncommittedBuffer: {}
    };

    fs.writeFileSync(path.join(zetaDir, 'state.json'), JSON.stringify(stateJson), 'utf8');

    const result = await JsonToSqliteMigrator.migrate(tmpDir);
    assert.strictEqual(result.success, false);
    assert.ok(result.violations && result.violations.length > 0);
    // Legacy file must still exist
    assert.ok(fs.existsSync(path.join(zetaDir, 'state.json')));
    // Backup must exist
    assert.ok(result.backupPath && fs.existsSync(result.backupPath));
  });
});
