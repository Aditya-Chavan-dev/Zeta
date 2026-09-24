import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { IStateStore, IntegrityCheckResult } from './state-store.interface.js';
import { BackupRing } from './backup-ring.js';
import {
  SessionState,
  SessionStateSchema,
  StepSummary,
  ArtifactSnapshot,
  AuditEvent,
  StepStatus
} from './schema.js';

export class SqliteStore implements IStateStore {
  public readonly workspaceRoot: string;
  private dbPath: string;
  private lockFilePath: string;
  private db: Database.Database;
  private hasAdvisoryLock = false;

  public static readonly DB_DIR = '.zeta';
  public static readonly DB_NAME = 'zeta.db';
  public static readonly LOCK_NAME = 'zeta.lock';

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    const dbDir = path.join(workspaceRoot, SqliteStore.DB_DIR);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, SqliteStore.DB_NAME);
    this.lockFilePath = path.join(dbDir, SqliteStore.LOCK_NAME);

    this.acquireLock();
    this.db = new Database(this.dbPath, { timeout: 5000 });
    this.initDatabase();
  }

  private acquireLock(): void {
    if (fs.existsSync(this.lockFilePath)) {
      try {
        const raw = fs.readFileSync(this.lockFilePath, 'utf8');
        const lockData = JSON.parse(raw);
        // Check if process is still alive (only on same OS)
        if (lockData?.pid && lockData.pid !== process.pid) {
          try {
            process.kill(lockData.pid, 0); // throws if process does not exist
            // Process exists and holds lock - allow read-only or throw contention
            // For now, allow proceeding if busy_timeout can handle sqlite, but flag contention
          } catch {
            // Process dead - clean up stale lock
            fs.unlinkSync(this.lockFilePath);
          }
        }
      } catch {
        try { fs.unlinkSync(this.lockFilePath); } catch {}
      }
    }

    try {
      fs.writeFileSync(
        this.lockFilePath,
        JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }),
        { flag: 'w' }
      );
      this.hasAdvisoryLock = true;
    } catch {
      // If unable to write lock, continue; SQLite's internal locking is authoritative
    }
  }

  private releaseLock(): void {
    if (this.hasAdvisoryLock && fs.existsSync(this.lockFilePath)) {
      try {
        const raw = fs.readFileSync(this.lockFilePath, 'utf8');
        const lockData = JSON.parse(raw);
        if (lockData?.pid === process.pid) {
          fs.unlinkSync(this.lockFilePath);
        }
      } catch {}
      this.hasAdvisoryLock = false;
    }
  }

  private initDatabase(): void {
    // Set concurrency and performance pragmas
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');

    // Create session_state table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_state (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        project_id TEXT NOT NULL,
        active_step INTEGER NOT NULL,
        step_status TEXT NOT NULL,
        turn_count INTEGER NOT NULL,
        last_turn_timestamp TEXT NOT NULL,
        locked_steps TEXT NOT NULL,
        step_summaries TEXT NOT NULL,
        uncommitted_buffer TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS artifact_snapshots (
        id TEXT PRIMARY KEY,
        step_number INTEGER NOT NULL,
        revision INTEGER NOT NULL,
        artifact_path TEXT NOT NULL,
        content TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_snapshots_step ON artifact_snapshots(step_number, revision DESC);

      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        step_number INTEGER,
        actor TEXT NOT NULL,
        details TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
    `);
  }

  public loadState(): SessionState | null {
    const row = this.db.prepare('SELECT * FROM session_state WHERE id = ?').get('current') as any;
    if (!row) {
      return null;
    }

    try {
      const stateObj = {
        version: row.version,
        projectId: row.project_id,
        activeStep: row.active_step,
        stepStatus: row.step_status as StepStatus,
        turnCount: row.turn_count,
        lastTurnTimestamp: row.last_turn_timestamp,
        lockedSteps: JSON.parse(row.locked_steps),
        stepSummaries: JSON.parse(row.step_summaries),
        uncommittedBuffer: JSON.parse(row.uncommitted_buffer)
      };

      return SessionStateSchema.parse(stateObj);
    } catch (err) {
      throw new Error(`Corrupted session_state in SQLite store: ${err}`);
    }
  }

  public saveState(state: SessionState): void {
    // Validate schema
    const validated = SessionStateSchema.parse(state);

    const stmt = this.db.prepare(`
      INSERT INTO session_state (
        id, version, project_id, active_step, step_status, turn_count,
        last_turn_timestamp, locked_steps, step_summaries, uncommitted_buffer
      ) VALUES (
        'current', @version, @projectId, @activeStep, @stepStatus, @turnCount,
        @lastTurnTimestamp, @lockedSteps, @stepSummaries, @uncommittedBuffer
      )
      ON CONFLICT(id) DO UPDATE SET
        version = excluded.version,
        project_id = excluded.project_id,
        active_step = excluded.active_step,
        step_status = excluded.step_status,
        turn_count = excluded.turn_count,
        last_turn_timestamp = excluded.last_turn_timestamp,
        locked_steps = excluded.locked_steps,
        step_summaries = excluded.step_summaries,
        uncommitted_buffer = excluded.uncommitted_buffer;
    `);

    stmt.run({
      version: validated.version,
      projectId: validated.projectId,
      activeStep: validated.activeStep,
      stepStatus: validated.stepStatus,
      turnCount: validated.turnCount,
      lastTurnTimestamp: validated.lastTurnTimestamp,
      lockedSteps: JSON.stringify(validated.lockedSteps),
      stepSummaries: JSON.stringify(validated.stepSummaries),
      uncommittedBuffer: JSON.stringify(validated.uncommittedBuffer)
    });
  }

  public initialize(projectId: string): SessionState {
    const freshState: SessionState = {
      version: 1,
      projectId: projectId || `proj_${crypto.randomBytes(4).toString('hex')}`,
      activeStep: 0,
      stepStatus: 'IN_PROGRESS',
      turnCount: 0,
      lastTurnTimestamp: new Date().toISOString(),
      lockedSteps: [],
      stepSummaries: {},
      uncommittedBuffer: {}
    };

    const tx = this.db.transaction(() => {
      this.saveState(freshState);
      this.recordAudit({
        eventType: 'INIT',
        stepNumber: 0,
        actor: 'system',
        details: `Initialized project ${freshState.projectId}`
      });
    });

    tx();
    return freshState;
  }

  public recordTurn(
    userMessage: string,
    pendingDraftSummary?: string,
    activeDraft?: unknown,
    unresolvedQuestions?: unknown[]
  ): SessionState {
    let state = this.loadState();
    if (!state) {
      state = this.initialize('zeta-architect');
    }

    state.turnCount += 1;
    state.lastTurnTimestamp = new Date().toISOString();
    state.uncommittedBuffer = {
      lastUserMessage: userMessage,
      pendingDraftSummary,
      activeDraft,
      unresolvedQuestions,
      interruptedAt: new Date().toISOString()
    };

    const tx = this.db.transaction(() => {
      this.saveState(state);
      this.recordAudit({
        eventType: 'TURN_EXECUTED',
        stepNumber: state.activeStep,
        actor: 'user',
        details: `Recorded turn #${state.turnCount}: ${pendingDraftSummary || 'Turn evaluated'}`
      });
    });

    tx();

    // Fire-and-forget per-turn backup (never blocks the turn)
    try {
      BackupRing.createTurnBackup(this).catch(() => {});
    } catch {}

    return state;
  }

  public lockStep(stepNumber: number, summary: StepSummary, artifactContent: string): SessionState {
    const state = this.loadState();
    if (!state) {
      throw new Error('Cannot lock step: session state is uninitialized.');
    }

    if (stepNumber !== state.activeStep) {
      throw new Error(`Invalid stage lock: cannot lock Step ${stepNumber} when active stage is Step ${state.activeStep}.`);
    }

    for (let i = 0; i < stepNumber; i++) {
      if (!state.lockedSteps.includes(i)) {
        throw new Error(`Prerequisite Step ${i} is not locked.`);
      }
    }

    if (!state.lockedSteps.includes(stepNumber)) {
      state.lockedSteps.push(stepNumber);
      state.lockedSteps.sort((a, b) => a - b);
    }

    state.stepSummaries[`step_${stepNumber}`] = summary;
    state.stepStatus = stepNumber === 14 ? 'COMPLETED' : 'LOCKED';
    state.uncommittedBuffer = {};
    state.lastTurnTimestamp = new Date().toISOString();

    const tx = this.db.transaction(() => {
      this.saveState(state);
      this.saveSnapshot({
        stepNumber,
        revision: 1,
        artifactPath: summary.artifactPath,
        content: artifactContent,
        sha256: summary.artifactSha256
      });
      this.recordAudit({
        eventType: 'STAGE_LOCKED',
        stepNumber,
        actor: 'GovernanceEngine',
        details: `Locked Step ${stepNumber} (${summary.stepName}) with SHA256 ${summary.artifactSha256}`
      });
    });

    tx();
    return state;
  }

  public advanceStep(nextStep: number): SessionState {
    const state = this.loadState();
    if (!state) {
      throw new Error('Cannot advance step: session state is uninitialized.');
    }

    if (!state.lockedSteps.includes(state.activeStep)) {
      throw new Error(`Cannot advance: Step ${state.activeStep} is not locked.`);
    }

    if (nextStep !== state.activeStep + 1) {
      throw new Error(`Cannot jump from Step ${state.activeStep} to Step ${nextStep}. Must advance sequentially.`);
    }

    state.activeStep = nextStep;
    state.stepStatus = 'IN_PROGRESS';
    state.uncommittedBuffer = {};
    state.lastTurnTimestamp = new Date().toISOString();

    const tx = this.db.transaction(() => {
      this.saveState(state);
      this.recordAudit({
        eventType: 'STAGE_ADVANCED',
        stepNumber: nextStep,
        actor: 'GovernanceEngine',
        details: `Advanced active stage to Step ${nextStep}`
      });
    });

    tx();
    return state;
  }

  public saveSnapshot(snapshot: Omit<ArtifactSnapshot, 'id' | 'createdAt'>): ArtifactSnapshot {
    const id = `snap_${crypto.randomBytes(6).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO artifact_snapshots (
        id, step_number, revision, artifact_path, content, sha256, created_at
      ) VALUES (
        @id, @stepNumber, @revision, @artifactPath, @content, @sha256, @createdAt
      );
    `);

    stmt.run({
      id,
      stepNumber: snapshot.stepNumber,
      revision: snapshot.revision,
      artifactPath: snapshot.artifactPath,
      content: snapshot.content,
      sha256: snapshot.sha256,
      createdAt
    });

    return {
      id,
      stepNumber: snapshot.stepNumber,
      revision: snapshot.revision,
      artifactPath: snapshot.artifactPath,
      content: snapshot.content,
      sha256: snapshot.sha256,
      createdAt
    };
  }

  public getLatestSnapshot(stepNumber: number): ArtifactSnapshot | null {
    const row = this.db.prepare(`
      SELECT * FROM artifact_snapshots
      WHERE step_number = ?
      ORDER BY revision DESC
      LIMIT 1
    `).get(stepNumber) as any;

    if (!row) return null;

    return {
      id: row.id,
      stepNumber: row.step_number,
      revision: row.revision,
      artifactPath: row.artifact_path,
      content: row.content,
      sha256: row.sha256,
      createdAt: row.created_at
    };
  }

  public getSnapshotRevision(stepNumber: number, revision: number): ArtifactSnapshot | null {
    const row = this.db.prepare(`
      SELECT * FROM artifact_snapshots
      WHERE step_number = ? AND revision = ?
      LIMIT 1
    `).get(stepNumber, revision) as any;

    if (!row) return null;

    return {
      id: row.id,
      stepNumber: row.step_number,
      revision: row.revision,
      artifactPath: row.artifact_path,
      content: row.content,
      sha256: row.sha256,
      createdAt: row.created_at
    };
  }

  public recordAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const id = `aud_${crypto.randomBytes(6).toString('hex')}`;
    const timestamp = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO audit_log (id, timestamp, event_type, step_number, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, timestamp, event.eventType, event.stepNumber ?? null, event.actor, event.details);
  }

  public getAuditHistory(limit = 100): AuditEvent[] {
    const rows = this.db.prepare(`
      SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?
    `).all(limit) as any[];

    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      eventType: r.event_type,
      stepNumber: r.step_number ?? undefined,
      actor: r.actor,
      details: r.details
    }));
  }

  public verifyIntegrity(): IntegrityCheckResult {
    const violations: string[] = [];

    // 1. SQLite internal integrity check
    try {
      const pragmaCheck = this.db.pragma('integrity_check') as any[];
      if (!pragmaCheck || pragmaCheck.length === 0 || pragmaCheck[0]?.integrity_check !== 'ok') {
        violations.push(`SQLite PRAGMA integrity_check failed: ${JSON.stringify(pragmaCheck)}`);
      }
    } catch (err: any) {
      violations.push(`Database integrity check failed: ${err.message}`);
    }

    // 2. Verify all locked step disk artifacts against recorded SHA-256 hashes
    const state = this.loadState();
    if (state) {
      for (const [key, summary] of Object.entries(state.stepSummaries)) {
        const fullPath = path.join(this.workspaceRoot, summary.artifactPath);
        if (!fs.existsSync(fullPath)) {
          violations.push(`Missing disk artifact for ${key}: ${summary.artifactPath}`);
          continue;
        }

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          if (hash !== summary.artifactSha256) {
            violations.push(`Cryptographic digest mismatch for ${key} (${summary.artifactPath}): Expected ${summary.artifactSha256}, calculated ${hash}`);
          }
        } catch (err: any) {
          violations.push(`Failed to read artifact ${summary.artifactPath}: ${err.message}`);
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  public async createBackup(destPath: string): Promise<void> {
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // better-sqlite3 provides a safe, online backup API that respects WAL transactions
    await this.db.backup(destPath);
  }

  public close(): void {
    try {
      this.db.close();
    } catch {}
    this.releaseLock();
  }
}
