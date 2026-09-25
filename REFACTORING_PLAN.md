# ZETA Refactoring & Hardening Plan (2-Pass Blueprint)

---

## Pass 1: Phased Implementation Plan

### Phase 1: High-Severity Logical Bug Fixes
* **Task 1.1: Fix Step 14 Terminal Status in `StateManager`**
  * Target: `src/core/state/state-manager.ts#L184`
  * Action: Change `state.stepStatus = 'LOCKED'` to `state.stepStatus = stepNumber === 14 ? 'COMPLETED' : 'LOCKED'`.
  * Verification: Test that Step 14 lock results in `'COMPLETED'`.
* **Task 1.2: Add Engine Self-Exemption Guard to `InitHook`**
  * Target: `src/core/bootstrap/init-hook.ts#L19`
  * Action: Check if `package.json` in `workspaceRoot` defines `"name": "zeta-architect"`. If so, skip auto-creating `.zeta/state.json`.
  * Verification: Calling `InitHook.activate(process.cwd())` in the engine repo leaves root clean.
* **Task 1.3: Fix Windows `EPERM` Lock Deletion in `SqliteStore`**
  * Target: `src/core/state/sqlite-store.ts#L49-L56`
  * Action: Catch errors from `process.kill(pid, 0)` specifically: only unlink if `err.code === 'ESRCH'`. If `err.code === 'EPERM'`, retain lock as active.
  * Verification: Non-existent PID unlinks; permission-denied PID does not delete lock.
* **Task 1.4: Fix Negation Extraction Scope in `IntentComparator`**
  * Target: `src/core/drift/intent-comparator.ts#L157-L170`
  * Action: Extract only the clause following the negation keyword (up to comma, semicolon, or period) rather than comparing all input terms against the baseline.
  * Verification: `"I don't need Redis, keep SQLite"` only checks `Redis` for negation, ignoring `SQLite`.
* **Task 1.5: Replace Busy-Wait Spin-Loop in `StateManager.save`**
  * Target: `src/core/state/state-manager.ts#L109-L110`
  * Action: Remove `while (Date.now() - start < 15) {}` and rely on immediate fallback copy + unlink with exponential backoff if needed.

### Phase 2: State Store & Type Unification
* **Task 2.1: Single Source of Truth for State Types**
  * Target: `src/core/state/types.ts` & `src/core/state/schema.ts`
  * Action: Make `schema.ts` the single type authority. Re-export inferred types (`SessionState`, `StepSummary`, `StepStatus`, `UncommittedBuffer`) from `types.ts`.
* **Task 2.2: Unify Persistence Engine**
  * Target: `src/core/state/`
  * Action: Establish `SqliteStore` as the primary operational store, with `.zeta/state.json` maintained as a lightweight, human-readable JSON mirror for IDE inspection.

### Phase 3: Boilerplate Consolidation & Dead Code Cleanup
* **Task 3.1: Centralize Precondition Verification**
  * Target: `src/agents/agent-02` through `agent-15`
  * Action: Deprecate individual `intent-verifier.ts` / `precondition-verifier.ts` files across all 15 agent directories. Route all precondition checks through a shared helper: `LifecycleRegistry.verifyStagePrerequisites(state, targetStage)`.
* **Task 3.2: Retire Dead Subsystems**
  * Target: `src/core/headroom/headroom-compressor.ts`, `src/core/migration/json-migrator.ts`
  * Action: Remove unreferenced standalone utilities or wire them into real CLI flags if needed.

### Phase 4: Overengineering Simplification
* **Task 4.1: Trim Audit Event Taxonomy**
  * Target: `src/core/state/schema.ts#L76-L90`
  * Action: Prune unused enum values from `AuditEventSchema` down to the actual active events: `INIT`, `TURN_EXECUTED`, `STAGE_LOCKED`, `STAGE_ADVANCED`, `STAGE_AMENDED`, `INTEGRITY_VIOLATION`.
* **Task 4.2: Simplify Snapshot Schema**
  * Target: `src/core/state/sqlite-store.ts`
  * Action: Remove unused multi-revision tracking overhead; index snapshots cleanly by `step_number`.

---

## Pass 2: Blind Spots & Edge Cases Hardening

### Blind Spot 1: Windows CRLF vs Linux LF Digest Mismatches
* **Risk**: Git checkouts or text editors on Windows convert `\n` to `\r\n`. When `StateManager.verifyIntegrity()` or `SqliteStore.verifyIntegrity()` computes `sha256(content)`, CRLF will produce a completely different hash than LF, causing false cryptographic tamper alarms!
* **Hardening**: Normalize line endings (`content.replace(/\r\n/g, '\n')`) prior to SHA-256 calculation across all artifact compilers, store savers, and integrity checkers.

### Blind Spot 2: Cross-Platform Path Separator Divergence
* **Risk**: `summary.artifactPath` stored on Windows may contain backslashes (`docs\PROJECT_INTENT.md`), while Linux/macOS expects forward slashes (`docs/PROJECT_INTENT.md`).
* **Hardening**: Enforce POSIX normalization (`path.posix.normalize()`) on all stored artifact paths before persisting to SQLite or JSON.

### Blind Spot 3: Backwards Compatibility for Pure-JSON `.zeta/` Projects
* **Risk**: Existing user projects may only have `.zeta/state.json` without an existing SQLite database.
* **Hardening**: When `SqliteStore` initializes in a folder that contains an existing `.zeta/state.json`, auto-import the JSON state on startup transparently without requiring manual migration commands.

### Blind Spot 4: Synchronous Call Chains vs Async File Operations
* **Risk**: Many parts of the codebase (`Agent01Intent.handleTurn`, `InitHook.activate`) rely on synchronous state loading (`StateManager.load`, `StateManager.save`). Converting `StateManager` to async could break synchronous consumers.
* **Hardening**: Maintain synchronous APIs for atomic reads/writes, while isolating async work (such as database backup streaming) to fire-and-forget background operations.

### Blind Spot 5: Non-Destructive Error Handling in Precondition Gating
* **Risk**: Centralizing the 15 agent verifiers into `LifecycleRegistry` could alter error messages that unit tests assert against (e.g. `assert.throws(..., /Prerequisite Step X is not locked/)`).
* **Hardening**: Preserve exact standard error messaging across the centralized helper to guarantee zero test regressions across the 146 passing tests.
