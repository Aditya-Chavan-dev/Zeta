# IMPLEMENTATION PLAN & ENGINEERING WORK BREAKDOWN (WBS)
**Stage**: Step 6 — Implementation Planning & Work Breakdown  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Task Breakdown, Quality Gates & Critical Path  

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

> **Step 5 Detailed Technical Design TL;DR**:  
> TL;DR DETAILED TECHNICAL DESIGN (Step 5 Baseline):
> • Implementation Specs: 4 core modules specified with explicit method signatures.
> • State Machine: 3-stage transition model (NOT_STARTED -> IN_PROGRESS -> AWAITING_APPROVAL -> LOCKED).
> • Error Handling: 4 standardized error codes with recovery guidance.
> • Concurrency: Single-writer atomic file rename journal.
> • Gating Verdict: GO — Proceed to Step 6 Implementation Planning Architect.

---

## 2. Delivery Sequencing Strategy & Critical Path
* **Sequencing Strategy**: 5-Milestone Sequential Delivery with In-Flight SQLite Persistence and Strict Stage Gating
* **Critical Path**: TASK-01 $\longrightarrow$ TASK-02 $\longrightarrow$ TASK-03 $\longrightarrow$ TASK-04 $\longrightarrow$ TASK-05

---

## 3. Work Breakdown Structure (WBS) Tasks

### TASK-01: Canonical Lifecycle Map, Zod Schemas & Migration Rules (Milestone 1)
* **Estimated Effort**: 4h
* **Dependencies**: None
* **Definition of Ready (DoR)**: Detailed technical design approved in Step 5
* **Definition of Done (DoD)**: src/core/lifecycle/lifecycle-map.ts, src/core/state/schema.ts, and migration verification logic implemented with unit tests

### TASK-02: Typed SQLite Store & GovernanceEngine Core (Milestone 2)
* **Estimated Effort**: 6h
* **Dependencies**: TASK-01
* **Definition of Ready (DoR)**: Zod schemas and IStateStore interface defined
* **Definition of Done (DoD)**: SqliteStore and GovernanceEngine implemented with WAL mode, busy timeout, online backup, and rollback testing

### TASK-03: Standardize Agents 01–15 behind LifecycleAgent Contract (Milestone 3)
* **Estimated Effort**: 8h
* **Dependencies**: TASK-02
* **Definition of Ready (DoR)**: GovernanceEngine centralized approval authority implemented
* **Definition of Done (DoD)**: All 15 agents ported to LifecycleAgent without self-approval; evidence gates added for stages 9-14

### TASK-04: CLI Bridge & Antigravity IDE Skill Sync (Milestone 4)
* **Estimated Effort**: 5h
* **Dependencies**: TASK-03
* **Definition of Ready (DoR)**: GovernanceEngine and 15 agents operational
* **Definition of Done (DoD)**: bin/zeta.js implements all CLI verbs with 512 KiB buffer limit, exit codes, and doctor command

### TASK-05: Release Packaging, Security & Clean Installation Certification (Milestone 5)
* **Estimated Effort**: 4h
* **Dependencies**: TASK-04
* **Definition of Ready (DoR)**: CLI and engine functional and tested
* **Definition of Done (DoD)**: Clean package tarball unpack drill, LICENSE, SECURITY.md, offline verification test passing

---

## 4. Engineering Quality Gates & DoR / DoD Contracts

### Quality Gate 1: Contract Typing & Migration Safety
* **Trigger Point**: Completion of Milestone 1
* **Mandatory Checks**:
  - TypeScript compilation without errors
  - Schema validation unit tests
  - Migration crash rollback test
* **Pass Threshold**: 100% pass rate

### Quality Gate 2: Concurrency & Transaction Integrity
* **Trigger Point**: Completion of Milestone 2
* **Mandatory Checks**:
  - WAL mode verification
  - Concurrent writer lock rejection
  - Online backup drill
* **Pass Threshold**: Zero lock corruption or unhandled contention

### Quality Gate 3: Production Release Certification
* **Trigger Point**: Completion of Milestone 5
* **Mandatory Checks**:
  - Zero-devDependency tarball install test
  - Offline execution verification
  - Node LTS matrix certification
* **Pass Threshold**: Full checklist verified

---

## 5. Implementation Readiness & Baseline Lock
* **Readiness Verdict**: **APPROVED FOR PRODUCTION DEVELOPMENT**
* **Verification**: All tasks are bounded, estimated, sequenced, and covered by DoR/DoD contracts.
* **Gating Authority**: Step 6 approved. Cleared to proceed to Step 7: Implementation & Development Architect.
