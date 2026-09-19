# DETAILED TECHNICAL DESIGN SPECIFICATION
**Stage**: Step 5 — Detailed Technical Design & Engineering Design  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Class Contracts, Schemas, State Machines & Errors  

---

## 1. Upstream Context Baselines
> **Step 0 Intent TL;DR**:  
> TL;DR PROJECT INTENT (Step 0 Baseline):
> • Core Problem: Greenfield software projects built with AI agents suffer from scope creep, lack of verification, and fragmented state because existing tools lack a deterministic, local 15-stage lifecycle governance engine.
> • Vision & Purpose: Production-grade, local-first npm CLI governance engine with Antigravity IDE integration, typed SQLite store, and 15-stage lifecycle enforcement.
> • Primary User: Autonomous AI agents, software engineers, technical leads, and engineering directors.
> • Core In-Scope: Antigravity-integrated CLI (zeta), 15-stage sequential lifecycle (Stages 0-14), Typed SQLite state store with WAL mode and crash recovery, Centralized GovernanceEngine with exact case-insensitive Approve gating, Idempotent migration from legacy state.json
> • Strictly Out-of-Scope: Codex, Cursor, and Claude Code integrations (Antigravity CLI target only), Cloud telemetry or remote persistence services, Self-approving or auto-advancing agent autonomy
> • Gating Verdict: GO — Proceed to Step 1 Requirements Elicitation.

> **Step 1 Requirements TL;DR**:  
> TL;DR REQUIREMENTS SPECIFICATION (Step 1 Baseline):
> • Functional Scope: 5 FRs baselined (FR-01 (Canonical 15-Stage Lifecycle & Routing Engine), FR-02 (GovernanceEngine Centralized Approval & Gating), FR-03 (Typed SQLite State Store with WAL Concurrency)).
> • Key NFR Thresholds: Low Latency Turn Execution: < 50ms; Atomic Interruption Recovery & Crash Safety: 100% recovery without state loss.
> • Data Model: Local-first .zeta/state.json + docs/*.md.
> • Strict Exclusions: No legacy reverse-engineering; zero cloud daemons.
> • Gating Verdict: GO — Proceed to Step 2 Feasibility & Risk Assessment.

> **Step 2 Feasibility & Risk TL;DR**:  
> TL;DR FEASIBILITY & RISK (Step 2 Baseline):
> • Feasibility Verdict: GO — Core architecture is fully viable in local-first environment.
> • Constraints Locked: CON-01, CON-02, CON-03.
> • Material Risks Mitigated: 3 risks addressed (RISK-01 (Windows SQLite Lock Collisions in Concurrency Tests); RISK-02 (Legacy JSON Migration with Missing or Altered Artifacts)).
> • Dependencies: Local file system and Node.js extension host (zero cloud daemons).
> • Gating Verdict: GO — Proceed to Step 3 Technology Strategy Architect.

> **Step 3 Tech Stack TL;DR**:  
> TL;DR TECH STACK & STRATEGY (Step 3 Baseline):
> • Core Stack: Node.js LTS + TypeScript strict + atomic file storage.
> • Key TDRs: RUNTIME_LANGUAGE: Node.js LTS (>=20.0.0 <25.0.0) + TypeScript 5.x; DATA_STORAGE: SQLite3 (better-sqlite3) with WAL Mode; BUILD_PACKAGING: zod Schema Engine; COMMUNICATION_PROTOCOL: POSIX Stdin/Stdout JSON Streaming; TESTING_FRAMEWORK: Node.js Native Test Runner (node:test) + tsx.
> • Testing: Native node:test runner with tsx (zero runner bloat).
> • Prohibited: External background servers / cloud daemons.
> • Gating Verdict: GO — Proceed to Step 4 System Architecture Architect.

> **Step 4 System Architecture TL;DR**:  
> TL;DR SYSTEM ARCHITECTURE (Step 4 Baseline):
> • Architecture Style: Modular Local-First Governance Engine with Inverted Ingestion Bridge.
> • Component Breakdown: 4 core components (Bridge, State Store, Governance, Dispatcher).
> • Key ADRs: ADR-01, ADR-02, ADR-03, ADR-04.
> • Resilience: FMEA verified; write-ahead atomic journaling with resume sentinel.
> • Gating Verdict: GO — Proceed to Step 5 Detailed Technical Design Architect.

---

## 2. Core Implementation Modules & Interface Contracts

### GovernanceEngine (`src/core/engine/governance-engine.ts`)
* **Dependencies**: IStateStore, LifecycleAgentRegistry, LifecycleMap
* **Public Method Contracts**:
  - `executeTurn(input: string): Promise<GovernanceTurnResult>`: Ingests user turn, evaluates gating, executes agent or approval, returns output
  - `approveStage(stage: number): Promise<ApprovalResult>`: Verifies predecessor locks, hashes, draft readiness, and locks stage
  - `advanceStage(): Promise<SessionState>`: Advances activeStep sequentially (0..14)
  - `rollbackStage(targetStage: number): Promise<SessionState>`: Invalidates downstream steps and restores target stage checkpoint

### SqliteStore (`src/core/state/sqlite-store.ts`)
* **Dependencies**: better-sqlite3, IStateStore, SessionStateSchema
* **Public Method Contracts**:
  - `loadState(): SessionState | null`: Loads active SessionState from SQLite session_state table
  - `saveState(state: SessionState): void`: Persists SessionState transactionally
  - `lockStep(step: number, summary: StepSummary): void`: Locks stage in database and saves artifact snapshot
  - `createBackup(destPath: string): Promise<void>`: Executes safe SQLite online backup
  - `verifyIntegrity(): { valid: boolean; violations: string[] }`: Runs PRAGMA integrity_check and verifies artifact disk hashes

### JsonToSqliteMigrator (`src/core/migration/json-migrator.ts`)
* **Dependencies**: IStateStore, fs, crypto
* **Public Method Contracts**:
  - `migrate(workspaceRoot: string): Promise<MigrationResult>`: Idempotently migrates state.json to SQLite with hash validation

### CliBridge (`bin/zeta.js`)
* **Dependencies**: GovernanceEngine, SqliteStore
* **Public Method Contracts**:
  - `main(argv: string[]): Promise<void>`: Parses command line arguments, handles stdin streaming, sets exit code

---

## 3. Lifecycle State Machine Transitions

| From State | Trigger Event | To State | Guard Condition | Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| NOT_STARTED | zeta init | IN_PROGRESS (Step 0) | No existing store | Initialize SQLite store |
| IN_PROGRESS | Turn with questions answered | AWAITING_APPROVAL | Draft complete | Set signoff ready |
| AWAITING_APPROVAL | Exact "Approve" | LOCKED | Predecessors locked + hashes valid | Write docs/*.md & lock step |
| LOCKED (Step X) | Advance | IN_PROGRESS (Step X+1) | X < 14 | Increment activeStep |
| LOCKED (Step 14) | Advance | COMPLETED | Step 14 locked | Set project read-only |

---

## 4. Standardized Error Taxonomy

| Error Code | Category | Description | Recovery Guidance |
| :--- | :--- | :--- | :--- |
| `ERR_BLOCKED_APPROVAL` | PRECONDITION | Stage cannot be approved because predecessor is unlocked or draft not ready | Review draft and answer all pending clarifying questions |
| `ERR_INVALID_INPUT` | VALIDATION | Malformed UTF-8, JSON schema mismatch, or payload > 512 KiB | Check stdin payload schema and byte length |
| `ERR_LOCK_CONTENTION` | PERSISTENCE | Database busy timeout or active file lock in .zeta/zeta.lock | Run zeta doctor --unlock if previous process died |
| `ERR_HASH_DRIFT` | DRIFT | Disk artifact SHA256 does not match recorded digest | Restore artifact using zeta restore <step> |

---

## 5. Concurrency, Storage & Locking Protocol
* **Write Protocol**: `SQLite WAL mode with PRAGMA busy_timeout=5000 and process-level .zeta/zeta.lock advisory file lock containing PID and start timestamp.`
* **Integrity Guarantee**: Temp file atomic rename guarantees zero half-written states.
* **Interruption Recovery**: Resume sentinel detects uncommitted turns and presents actionable resumption prompt.

---

## 6. Detailed Technical Design Baseline Lock
* **Readiness Verdict**: **IMPLEMENTATION READY**
* **Verification**: All modules, methods, error codes, and state transitions are explicitly specified.
* **Gating Authority**: Step 5 approved. Cleared to proceed to Step 6: Implementation Planning & Task Breakdown.
