import { SessionState, StepSummary, ArtifactSnapshot, AuditEvent } from './schema.js';

export interface IntegrityCheckResult {
  valid: boolean;
  violations: string[];
}

export interface IStateStore {
  readonly workspaceRoot: string;

  /**
   * Loads current SessionState, or null if uninitialized.
   */
  loadState(): SessionState | null;

  /**
   * Atomically saves or updates the SessionState.
   */
  saveState(state: SessionState): void;

  /**
   * Initializes state store for a new project.
   */
  initialize(projectId: string): SessionState;

  /**
   * Records a user/agent turn with in-flight uncommitted draft buffer.
   */
  recordTurn(
    userMessage: string,
    pendingDraftSummary?: string,
    activeDraft?: unknown,
    unresolvedQuestions?: unknown[]
  ): SessionState;

  /**
   * Atomically locks a completed step, saves artifact snapshot, and updates stepSummary.
   */
  lockStep(stepNumber: number, summary: StepSummary, artifactContent: string): SessionState;

  /**
   * Advances active step to the next sequential stage.
   */
  advanceStep(nextStep: number): SessionState;

  /**
   * Saves an artifact revision snapshot.
   */
  saveSnapshot(snapshot: Omit<ArtifactSnapshot, 'id' | 'createdAt'>): ArtifactSnapshot;

  /**
   * Retrieves latest artifact snapshot for a step.
   */
  getLatestSnapshot(stepNumber: number): ArtifactSnapshot | null;

  /**
   * Retrieves specific revision snapshot for a step.
   */
  getSnapshotRevision(stepNumber: number, revision: number): ArtifactSnapshot | null;

  /**
   * Appends an immutable audit log record.
   */
  recordAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): void;

  /**
   * Queries audit event history in reverse chronological order.
   */
  getAuditHistory(limit?: number): AuditEvent[];

  /**
   * Cryptographically verifies database integrity and disk artifact hashes against recorded digests.
   */
  verifyIntegrity(): IntegrityCheckResult;

  /**
   * Performs an online, non-blocking backup of the SQLite database.
   */
  createBackup(destPath: string): Promise<void>;

  /**
   * Closes database connection cleanly.
   */
  close(): void;
}
