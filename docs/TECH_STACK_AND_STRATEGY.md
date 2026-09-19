# TECHNOLOGY STRATEGY & TECH-STACK BASELINE
**Stage**: Step 3 — Technology Strategy & Tech-Stack Selection  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Approved Technologies & Runtimes  

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

---

## 2. Technology Decision Records (TDRs)

### TDR-01: Node.js LTS (>=20.0.0 <25.0.0) + TypeScript 5.x
* **Category**: RUNTIME_LANGUAGE
* **Version / Spec**: Node.js 20.x/22.x, TS 5.x
* **Justification**: Guarantees cross-platform performance, standard ESM support, and strong type contracts across CLI and engine.
* **Rejected Alternatives**:
  - Deno
  - Bun
  - Python
* **Trade-offs Accepted**: Subshell memory limit handling required on Windows in certain environments.

### TDR-02: SQLite3 (better-sqlite3) with WAL Mode
* **Category**: DATA_STORAGE
* **Version / Spec**: ^11.8.1
* **Justification**: Atomic transactions, fast synchronous read/write, native online backup API, robust WAL concurrency.
* **Rejected Alternatives**:
  - Plain JSON state
  - DuckDB
  - LevelDB
* **Trade-offs Accepted**: Requires native compilation tooling or prebuilds on developer machines.

### TDR-03: zod Schema Engine
* **Category**: BUILD_PACKAGING
* **Version / Spec**: ^3.23.8
* **Justification**: Zero external dependencies, comprehensive runtime schema validation, TypeScript inference for state contracts.
* **Rejected Alternatives**:
  - Joi
  - Yup
  - Ajv
* **Trade-offs Accepted**: Slight bundle size addition (~50kb minified).

### TDR-04: POSIX Stdin/Stdout JSON Streaming
* **Category**: COMMUNICATION_PROTOCOL
* **Version / Spec**: 1.0.0
* **Justification**: Enables deterministic non-interactive automation for Antigravity IDE and shell scripts with 512 KiB buffer.
* **Rejected Alternatives**:
  - gRPC
  - Named pipes
  - WebSockets
* **Trade-offs Accepted**: Requires strict UTF-8 decoding and line buffering.

### TDR-05: Node.js Native Test Runner (node:test) + tsx
* **Category**: TESTING_FRAMEWORK
* **Version / Spec**: Node built-in
* **Justification**: Ultra-fast execution, zero test runner dependency overhead, built-in assertion and mocking.
* **Rejected Alternatives**:
  - Jest
  - Mocha
  - Vitest
* **Trade-offs Accepted**: Limited third-party reporter plugins.

---

## 3. Technology Governance & Prohibited Items
* **Prohibited Technologies**: Cloud-hosted background daemons, binary SQLite databases (for core state), heavyweight JVM runtimes.
* **Approved Language Standards**: TypeScript strict mode (`"strict": true`), ES2022 target, NodeNext module resolution.
* **Dependency Policy**: Minimalist zero-bloat standard; prefer native Node.js APIs (`node:fs`, `node:crypto`, `node:test`) over third-party micro-packages.

---

## 4. Architecture-Readiness Verdict & Sign-Off
* **Readiness Verdict**: **APPROVED**
* **Verification**: The chosen technologies fully satisfy Step 1 Requirements and Step 2 Feasibility bounds.
* **Gating Authority**: Step 3 approved. Cleared to proceed to Step 4: System Architecture & Structural Design.
