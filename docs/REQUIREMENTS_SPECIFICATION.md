# REQUIREMENTS SPECIFICATION
**Stage**: Step 1 — Requirements Engineering & Baselining  
**Status**: LOCKED  
**Authority**: Single Source of Truth for System Capabilities & Constraints  

---

## 1. Upstream Intent Baseline (Step 0 Reference)
> **Step 0 Summary**:  
> TL;DR PROJECT INTENT (Step 0 Baseline):
> • Core Problem: Greenfield software projects built with AI agents suffer from scope creep, lack of verification, and fragmented state because existing tools lack a deterministic, local 15-stage lifecycle governance engine.
> • Vision & Purpose: Production-grade, local-first npm CLI governance engine with Antigravity IDE integration, typed SQLite store, and 15-stage lifecycle enforcement.
> • Primary User: Autonomous AI agents, software engineers, technical leads, and engineering directors.
> • Core In-Scope: Antigravity-integrated CLI (zeta), 15-stage sequential lifecycle (Stages 0-14), Typed SQLite state store with WAL mode and crash recovery, Centralized GovernanceEngine with exact case-insensitive Approve gating, Idempotent migration from legacy state.json
> • Strictly Out-of-Scope: Codex, Cursor, and Claude Code integrations (Antigravity CLI target only), Cloud telemetry or remote persistence services, Self-approving or auto-advancing agent autonomy
> • Gating Verdict: GO — Proceed to Step 1 Requirements Elicitation.

---

## 2. Functional Requirements (FR)

### FR-01: Canonical 15-Stage Lifecycle & Routing Engine
* **Priority**: MUST_HAVE
* **User Story**: As an engineering system, I require a single authoritative lifecycle map across Stages 0–14 so that all agent operations, CLI commands, and validations are strictly sequential and deterministic.
* **Acceptance Criteria**:
  - Single canonical lifecycle map in src/core/lifecycle/lifecycle-map.ts defining stages 0 through 14
  - Stages 0–14 map 1:1 with implementation Agents 01–15
  - Direct stage jumping or out-of-order execution is strictly prevented
  - Stage 14 lock sets project status to COMPLETED and switches store to read-only

### FR-02: GovernanceEngine Centralized Approval & Gating
* **Priority**: MUST_HAVE
* **User Story**: As an engineer, I require a single centralized engine for approvals so that individual agents cannot autonomously self-approve or advance stages.
* **Acceptance Criteria**:
  - GovernanceEngine is the sole authority for approve, advance, invalidate, amend, or lock operations
  - Approval succeeds only upon exact case-insensitive trimmed "Approve"
  - Approval verifies active stage, predecessor locks, SHA256 hashes, answered questions, and schema validity
  - Canonical docs/*.md files are written only after all approval criteria pass

### FR-03: Typed SQLite State Store with WAL Concurrency
* **Priority**: MUST_HAVE
* **User Story**: As a system user, I require all governance state to be persisted in SQLite behind an IStateStore interface to guarantee atomic turn updates and crash resilience.
* **Acceptance Criteria**:
  - State stored in SQLite with WAL mode, busy_timeout=5000ms, and single-writer file lock
  - Versioned Zod schemas for all drafts, turns, snapshots, and audit records
  - Full checkpointing of in-flight uncommitted drafts and questions
  - SQLite online backup API implementation with rolling retention of 10 backups

### FR-04: Crash-Safe Idempotent Migration from Legacy JSON
* **Priority**: MUST_HAVE
* **User Story**: As an existing user, I require seamless migration from legacy .zeta/state.json to SQLite without data loss or corruption.
* **Acceptance Criteria**:
  - Retains timestamped backup before touching legacy state.json
  - Imports snapshots from canonical docs/*.md files and verifies SHA256 hashes
  - Aborts without modifying destination if artifacts are missing or corrupt
  - Preserves legacy file until SQLite database passes PRAGMA integrity_check

### FR-05: Antigravity CLI Command Suite
* **Priority**: MUST_HAVE
* **User Story**: As a developer, I require a standard CLI tool suite to manage governance from terminal and IDE workflows.
* **Acceptance Criteria**:
  - Implement init, start, turn, resume, status, validate, restore, amend, install, uninstall, and doctor
  - zeta turn --stdin --format json handles UTF-8 with 512 KiB limit and documented exit codes
  - zeta doctor supports --unlock and --repair for stale locks and recovery
  - Zero shell command interpolation of untrusted user input

---

## 3. Non-Functional Requirements (NFR)

| ID | Category | Title | Metric | Target Threshold | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-01 | PERFORMANCE | Low Latency Turn Execution | Turn processing latency | < 50ms | MUST_HAVE |
| NFR-02 | RELIABILITY | Atomic Interruption Recovery & Crash Safety | Recovery success rate after process kill | 100% recovery without state loss | MUST_HAVE |
| NFR-03 | SECURITY | Offline Local Execution & Supply Chain Safety | External telemetry/network calls | 0 calls (strictly offline) | MUST_HAVE |
| NFR-04 | USABILITY | Antigravity IDE & Terminal Ergonomics | Exit code and structured JSON compliance | 100% POSIX exit code accuracy | MUST_HAVE |

---

## 4. Data & State Requirements

| ID | Entity | Description | Persistence Model | Retention Policy |
| :--- | :--- | :--- | :--- | :--- |
| DR-01 | SessionState | Active stage, status, turn count, locked stages, and metadata | SQLite table: session_state | Project lifetime |
| DR-02 | ArtifactSnapshot | Historical revisions of docs/*.md artifacts with SHA256 digests | SQLite table: artifact_snapshots | Permanent audit trail |
| DR-03 | AuditEvent | Immutable record of turns, approvals, amendments, and migrations | SQLite table: audit_log | Permanent append-only |

---

## 5. Scope Boundaries & Exclusions
* **Strictly In-Scope**: Greenfield 15-stage lifecycle governance, per-turn atomic persistence, conversational drift detection.
* **Strictly Out-of-Scope**:
  - Codex, Cursor, and Claude Code integrations
  - Remote cloud telemetry or multi-tenant sync
  - Agent autonomous self-approvals

---

## 6. Verification & Handshake Criteria
* Every downstream architecture (Step 2/3) and implementation (Step 6/7) must trace directly back to one or more FRs and NFRs listed here.
* Formal sign-off on this document locks the functional baseline.
