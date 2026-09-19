import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SqliteStore } from '../state/sqlite-store.js';
import { SessionState, SessionStateSchema } from '../state/schema.js';

export interface MigrationResult {
  success: boolean;
  migratedSteps: number[];
  backupPath?: string;
  error?: string;
  violations?: string[];
}

export class JsonToSqliteMigrator {
  public static readonly LEGACY_STATE_FILE = '.zeta/state.json';
  public static readonly BACKUP_DIR = '.zeta/backups';
  public static readonly QUARANTINE_DIR = '.zeta/quarantine';

  /**
   * Idempotently and safely migrates legacy .zeta/state.json into SQLite .zeta/zeta.db.
   */
  public static async migrate(workspaceRoot: string): Promise<MigrationResult> {
    const legacyPath = path.join(workspaceRoot, this.LEGACY_STATE_FILE);

    // If no legacy state exists, nothing to migrate
    if (!fs.existsSync(legacyPath)) {
      return { success: true, migratedSteps: [] };
    }

    // 1. Read and parse legacy JSON
    let legacyRaw: string;
    let legacyState: SessionState;
    try {
      legacyRaw = fs.readFileSync(legacyPath, 'utf8');
      const parsed = JSON.parse(legacyRaw);
      legacyState = SessionStateSchema.parse(parsed);
    } catch (err: any) {
      this.quarantineFile(legacyPath, 'malformed_json');
      return {
        success: false,
        migratedSteps: [],
        error: `Legacy state.json is malformed or invalid: ${err?.message}`
      };
    }

    // 2. Create timestamped backup of legacy state BEFORE touching anything
    const backupDir = path.join(workspaceRoot, this.BACKUP_DIR);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `state.pre-migration.${timestamp}.json`);
    fs.copyFileSync(legacyPath, backupPath);

    // 3. Verify all disk artifacts referenced in stepSummaries
    const artifactContents: Record<number, { path: string; content: string; hash: string }> = {};
    const violations: string[] = [];

    for (const [stepKey, summary] of Object.entries(legacyState.stepSummaries)) {
      const stepNum = summary.stepNumber;
      const fullDocPath = path.join(workspaceRoot, summary.artifactPath);

      if (!fs.existsSync(fullDocPath)) {
        violations.push(`Missing canonical disk artifact for ${stepKey}: ${summary.artifactPath}`);
        continue;
      }

      try {
        const content = fs.readFileSync(fullDocPath, 'utf8');
        const computedHash = crypto.createHash('sha256').update(content).digest('hex');

        if (computedHash !== summary.artifactSha256) {
          violations.push(
            `Digest mismatch for ${stepKey} (${summary.artifactPath}): Expected ${summary.artifactSha256}, calculated ${computedHash}`
          );
          continue;
        }

        artifactContents[stepNum] = {
          path: summary.artifactPath,
          content,
          hash: computedHash
        };
      } catch (readErr: any) {
        violations.push(`Failed to read artifact for ${stepKey}: ${readErr?.message}`);
      }
    }

    if (violations.length > 0) {
      return {
        success: false,
        migratedSteps: [],
        backupPath,
        violations,
        error: `Migration aborted due to artifact verification failures. Legacy state.json preserved.`
      };
    }

    // 4. Open SQLite store and import atomically
    const store = new SqliteStore(workspaceRoot);
    const migratedSteps: number[] = [];

    try {
      // Save state
      store.saveState(legacyState);

      // Save snapshots for all verified locked steps
      for (const [stepNumStr, artifact] of Object.entries(artifactContents)) {
        const stepNum = parseInt(stepNumStr, 10);
        store.saveSnapshot({
          stepNumber: stepNum,
          revision: 1,
          artifactPath: artifact.path,
          content: artifact.content,
          sha256: artifact.hash
        });
        migratedSteps.push(stepNum);
      }

      // Record audit event
      store.recordAudit({
        eventType: 'MIGRATION_COMPLETED',
        stepNumber: legacyState.activeStep,
        actor: 'JsonToSqliteMigrator',
        details: `Successfully migrated ${migratedSteps.length} steps from legacy state.json`
      });

      // 5. Verify database integrity post-migration
      const integrity = store.verifyIntegrity();
      if (!integrity.valid) {
        throw new Error(`Post-migration integrity check failed: ${integrity.violations.join('; ')}`);
      }

      // 6. Rename legacy state to .migrated only after full verification succeeds
      const migratedLegacyPath = `${legacyPath}.migrated`;
      fs.renameSync(legacyPath, migratedLegacyPath);

      store.close();
      return {
        success: true,
        migratedSteps,
        backupPath
      };
    } catch (err: any) {
      store.close();
      return {
        success: false,
        migratedSteps: [],
        backupPath,
        error: `Migration transaction failed: ${err?.message}`
      };
    }
  }

  private static quarantineFile(filePath: string, reason: string): void {
    try {
      const workspaceRoot = path.dirname(path.dirname(filePath));
      const quarantineDir = path.join(workspaceRoot, this.QUARANTINE_DIR);
      if (!fs.existsSync(quarantineDir)) {
        fs.mkdirSync(quarantineDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dest = path.join(quarantineDir, `state.${reason}.${timestamp}.corrupt`);
      fs.copyFileSync(filePath, dest);
    } catch {}
  }
}
