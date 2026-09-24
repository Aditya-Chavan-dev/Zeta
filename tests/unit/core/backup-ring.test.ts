import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { BackupRing } from '../../../src/core/state/backup-ring.js';

/**
 * Creates a minimal mock IStateStore for testing BackupRing.
 */
function createMockStore(workspaceRoot: string) {
  const dbDir = path.join(workspaceRoot, '.zeta');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  // Create a dummy zeta.db so backup has something to copy
  const dbPath = path.join(dbDir, 'zeta.db');
  fs.writeFileSync(dbPath, 'mock-sqlite-database-content', 'utf8');

  return {
    workspaceRoot,
    createBackup: async (destPath: string) => {
      // Simulate backup by copying the file
      fs.copyFileSync(dbPath, destPath);
    },
    // Stubs for interface compliance
    loadState: () => null,
    saveState: () => {},
    initialize: () => ({} as any),
    recordTurn: () => ({} as any),
    lockStep: () => ({} as any),
    advanceStep: () => ({} as any),
    saveSnapshot: () => ({} as any),
    getLatestSnapshot: () => null,
    getSnapshotRevision: () => null,
    recordAudit: () => {},
    getAuditHistory: () => [],
    verifyIntegrity: () => ({ valid: true, violations: [] }),
    close: () => {}
  };
}

describe('BackupRing', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-backup-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create a backup file in .zeta/backups/', async () => {
    const store = createMockStore(tmpDir);
    const backupPath = await BackupRing.createTurnBackup(store as any);

    assert.ok(fs.existsSync(backupPath), 'Backup file should exist');
    assert.ok(backupPath.includes('zeta_backup_'), 'Filename should contain prefix');
    assert.ok(backupPath.endsWith('.db'), 'Filename should end with .db');
  });

  it('should list backups newest-first', async () => {
    const store = createMockStore(tmpDir);

    await BackupRing.createTurnBackup(store as any);
    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 10));
    await BackupRing.createTurnBackup(store as any);

    const backups = BackupRing.listBackups(tmpDir);
    assert.equal(backups.length, 2);
    // Newest first (reverse sort)
    assert.ok(backups[0] > backups[1], 'First entry should be newer');
  });

  it('should prune backups beyond MAX_BACKUPS (10)', async () => {
    const store = createMockStore(tmpDir);

    // Create 12 backups
    for (let i = 0; i < 12; i++) {
      await BackupRing.createTurnBackup(store as any);
      await new Promise(r => setTimeout(r, 5));
    }

    const backups = BackupRing.listBackups(tmpDir);
    assert.ok(backups.length <= BackupRing.MAX_BACKUPS, `Should have at most ${BackupRing.MAX_BACKUPS} backups, got ${backups.length}`);
  });

  it('should return empty array when no backups exist', () => {
    const backups = BackupRing.listBackups(tmpDir);
    assert.deepEqual(backups, []);
  });

  it('should return 0 deleted when under limit', () => {
    const deleted = BackupRing.pruneOldBackups(tmpDir);
    assert.equal(deleted, 0);
  });
});
