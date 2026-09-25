# ZETA Codebase Audit: Logical Bugs, Technical Debt & Overengineering

This document records the comprehensive findings from an architectural and logical audit of the `zeta-architect` codebase conducted on September 25, 2026.

---

## 1. Logical Bugs

### Bug 1: Step 14 Final Status Never Reaches `COMPLETED`
* **Severity**: High
* **Location**: [`src/core/state/state-manager.ts#L184`](file:///e:/New%20folder%20(2)/src/core/state/state-manager.ts#L184)
* **Issue**: `StateManager.lockStep` unconditionally sets `state.stepStatus = 'LOCKED'`. In contrast, `SqliteStore.lockStep` correctly checks `stepNumber === 14 ? 'COMPLETED' : 'LOCKED'`.
* **Impact**: In workflows using `StateManager`, a finished project at Step 14 remains indefinitely in `'LOCKED'` status and never transitions to `'COMPLETED'`.
* **Fix**: Change line 184 to `state.stepStatus = stepNumber === 14 ? 'COMPLETED' : 'LOCKED';`.

### Bug 2: `InitHook` Auto-Pollutes the Engine Repository
* **Severity**: High
* **Location**: [`src/core/bootstrap/init-hook.ts#L19-L22`](file:///e:/New%20folder%20(2)/src/core/bootstrap/init-hook.ts#L19-L22)
* **Issue**: `InitHook.activate()` unconditionally initializes `.zeta/state.json` if no state exists. It does not check if the current directory is `zeta-architect` (`package.json` `"name": "zeta-architect"`).
* **Impact**: Running CLI commands or agents in the development repo creates an unwanted `.zeta/` directory, causing the engine to misidentify itself as a managed greenfield project.
* **Fix**: Add a check in `InitHook.activate`: if `package.json` has `"name": "zeta-architect"`, do not auto-initialize unless an explicit flag is passed.

### Bug 3: Windows `EPERM` False Stale Lock Deletion
* **Severity**: Medium
* **Location**: [`src/core/state/sqlite-store.ts#L49-L56`](file:///e:/New%20folder%20(2)/src/core/state/sqlite-store.ts#L49-L56)
* **Issue**: In `acquireLock()`, `process.kill(lockData.pid, 0)` is used to check if the lockholder process is alive. On Windows, if a process exists but is running with different privileges, Node.js throws `EPERM` (not `ESRCH`). The generic catch block assumes the process is dead and deletes the lock file.
* **Impact**: Active database locks can be prematurely deleted if accessed across different user or privilege contexts.
* **Fix**: Only treat `err.code === 'ESRCH'` as a dead process; preserve the lock if `EPERM` is caught.

### Bug 4: Drift Negation Flags In-Scope Retained Items
* **Severity**: Medium
* **Location**: [`src/core/drift/intent-comparator.ts#L157-L164`](file:///e:/New%20folder%20(2)/src/core/drift/intent-comparator.ts#L157-L164)
* **Issue**: When input contains negation words (e.g. "don't need"), `IntentComparator` filters *all* extracted terms in the user prompt against the baseline.
* **Impact**: If a user says *"I don't need Redis, keep SQLite and TypeScript"*, both `sqlite` and `typescript` are incorrectly reported as being negated.
* **Fix**: Isolate the negated clause (terms immediately following the negation phrase) before matching against baseline terms.

### Bug 5: Synchronous Busy-Wait Spin-Loop in File Rename
* **Severity**: Low
* **Location**: [`src/core/state/state-manager.ts#L109-L110`](file:///e:/New%20folder%20(2)/src/core/state/state-manager.ts#L109-L110)
* **Issue**: The retry loop contains `while (Date.now() - start < 15) {}`.
* **Impact**: Locks the single-threaded Node.js event loop synchronously for 15ms per retry attempt instead of yielding control.
* **Fix**: Use asynchronous retry (`await new Promise(r => setTimeout(r, 15))`) or eliminate the spin-loop.

---

## 2. Technical Debt

### Debt 1: Dual State Persistence Engines (`StateManager` vs `SqliteStore`)
* **Severity**: High
* **Files**: [`src/core/state/state-manager.ts`](file:///e:/New%20folder%20(2)/src/core/state/state-manager.ts), [`src/core/state/sqlite-store.ts`](file:///e:/New%20folder%20(2)/src/core/state/sqlite-store.ts)
* **Issue**: The codebase maintains two completely separate state systems:
  1. A legacy JSON file writer with atomic temp-file rename and spin-lock retry (`state-manager.ts`).
  2. A modern transactional SQLite WAL store with snapshot history (`sqlite-store.ts`).
* **Impact**: `InitHook`, `ResumeSentinel`, and `Agent01`–`15` read from `state-manager.ts`, while `GovernanceEngine` and `BackupRing` read from `sqlite-store.ts`. Changes in one store are not automatically synchronized with the other.
* **Fix**: Unify onto `SqliteStore` as the single source of truth, retaining `.zeta/state.json` strictly as a lightweight export/mirror.

### Debt 2: Dual Type Definitions (`types.ts` vs `schema.ts`)
* **Severity**: Medium
* **Files**: [`src/core/state/types.ts`](file:///e:/New%20folder%20(2)/src/core/state/types.ts), [`src/core/state/schema.ts`](file:///e:/New%20folder%20(2)/src/core/state/schema.ts)
* **Issue**: Core types (`SessionState`, `StepSummary`, `StepStatus`, `UncommittedBuffer`) are declared twice: once as plain TypeScript interfaces in `types.ts`, and again as Zod schemas with inferred types in `schema.ts`.
* **Impact**: Any schema update requires editing two separate files, risking type divergence.
* **Fix**: Re-export inferred types from `schema.ts` inside `types.ts` to make `schema.ts` the single type authority.

### Debt 3: Dead Subsystems (`HeadroomCompressor` & `JsonToSqliteMigrator`)
* **Severity**: Low
* **Files**: [`src/core/headroom/headroom-compressor.ts`](file:///e:/New%20folder%20(2)/src/core/headroom/headroom-compressor.ts), [`src/core/migration/json-migrator.ts`](file:///e:/New%20folder%20(2)/src/core/migration/json-migrator.ts)
* **Issue**:
  - `HeadroomCompressor` writes and retrieves compressed tokens (`HEADROOM:label:hash`), but zero agents or engines invoke it during runtime.
  - `JsonToSqliteMigrator` provides full database migration logic, but is never invoked by CLI bootstrap or `InitHook`.
* **Impact**: Unused code paths maintained and tested in isolation without delivering runtime value.
* **Fix**: Either integrate them into the active lifecycle pipeline or remove them to trim bundle size.

### Debt 4: 15x Copy-Pasted Precondition Verifiers
* **Severity**: Medium
* **Files**: `src/agents/agent-02/intent-verifier.ts` through `agent-15/precondition-verifier.ts`
* **Issue**: Every single agent implements a custom verifier class to check if previous steps are locked.
* **Impact**: 15 identical files duplicating logic that is already provided centrally by `LifecycleRegistry.getPrerequisiteStages(step)` and `GovernanceEngine.evaluateApprovalPreconditions()`.
* **Fix**: Replace the 15 bespoke verifiers with a single centralized helper in `LifecycleRegistry`.

---

## 3. Overengineered Solutions

### Overengineering 1: 13-Event Audit Taxonomy
* **Severity**: Low
* **Location**: [`src/core/state/schema.ts#L76-L90`](file:///e:/New%20folder%20(2)/src/core/state/schema.ts#L76-L90)
* **Issue**: The schema defines a 13-variant enum for `AuditEventSchema` (`QUESTIONS_GENERATED`, `QUESTIONS_ANSWERED`, `RESTORE_PERFORMED`, `APPROVAL_ACCEPTED`, etc.), yet the system only records 3 event types (`INIT`, `TURN_EXECUTED`, `STAGE_LOCKED`).
* **Fix**: Simplify the audit schema to match the actual recorded lifecycle events.

### Overengineering 2: Multi-Revision Artifact Snapshots
* **Severity**: Low
* **Location**: [`src/core/state/sqlite-store.ts#L293-L299`](file:///e:/New%20folder%20(2)/src/core/state/sqlite-store.ts#L293-L299)
* **Issue**: `artifact_snapshots` table tracks sequential `revision` numbers for artifacts, but each stage only locks once before advancing. Revisions are always hardcoded to `1`.
* **Fix**: Store artifacts by step number directly without speculative multi-version branching.

### Overengineering 3: Hardcoded Keyword Technology Matrix in Drift Comparator
* **Severity**: Medium
* **Location**: [`src/core/drift/intent-comparator.ts#L87-L94`](file:///e:/New%20folder%20(2)/src/core/drift/intent-comparator.ts#L87-L94)
* **Issue**: Contains an arbitrary hardcoded list of ~40 technologies (`redis`, `kafka`, `svelte`, `nuxt`, `rust`, etc.).
* **Impact**: Fragile and high-maintenance; fails to detect any modern technology not on the list, while flagging harmless mentions of common libraries.
* **Fix**: Compare input nouns dynamically against the locked Step 3 tech-stack specification artifact instead of maintaining static keyword lists.
