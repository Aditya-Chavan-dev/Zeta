# Governance, Lifecycle & Deprecation Policy Specification

## Executive Summary
This document establishes long-term software governance, Semantic Versioning (SemVer 2.0.0) policies, multi-phase deprecation procedures, schema migration contracts, backward compatibility invariants, and automated architectural drift guardrails. It ensures software evolvability while preventing breaking changes from disrupting downstream consumers.

---

## 1. Upstream Traceability & Cumulative Context
- **Step 0 (Intent)**: TL;DR PROJECT INTENT (Step 0 Baseline):
• Core Problem: Greenfield software projects built with AI agents suffer from scope creep, lack of verification, and fragmented state because existing tools lack a deterministic, local 15-stage lifecycle governance engine.
• Vision & Purpose: Production-grade, local-first npm CLI governance engine with Antigravity IDE integration, typed SQLite store, and 15-stage lifecycle enforcement.
• Primary User: Autonomous AI agents, software engineers, technical leads, and engineering directors.
• Core In-Scope: Antigravity-integrated CLI (zeta), 15-stage sequential lifecycle (Stages 0-14), Typed SQLite state store with WAL mode and crash recovery, Centralized GovernanceEngine with exact case-insensitive Approve gating, Idempotent migration from legacy state.json
• Strictly Out-of-Scope: Codex, Cursor, and Claude Code integrations (Antigravity CLI target only), Cloud telemetry or remote persistence services, Self-approving or auto-advancing agent autonomy
• Gating Verdict: GO — Proceed to Step 1 Requirements Elicitation.
- **Step 1 (Requirements)**: TL;DR REQUIREMENTS SPECIFICATION (Step 1 Baseline):
• Functional Scope: 5 FRs baselined (FR-01 (Canonical 15-Stage Lifecycle & Routing Engine), FR-02 (GovernanceEngine Centralized Approval & Gating), FR-03 (Typed SQLite State Store with WAL Concurrency)).
• Key NFR Thresholds: Low Latency Turn Execution: < 50ms; Atomic Interruption Recovery & Crash Safety: 100% recovery without state loss.
• Data Model: Local-first .zeta/state.json + docs/*.md.
• Strict Exclusions: No legacy reverse-engineering; zero cloud daemons.
• Gating Verdict: GO — Proceed to Step 2 Feasibility & Risk Assessment.
- **Step 2 (Feasibility & Constraints)**: TL;DR FEASIBILITY & RISK (Step 2 Baseline):
• Feasibility Verdict: GO — Core architecture is fully viable in local-first environment.
• Constraints Locked: CON-01, CON-02, CON-03.
• Material Risks Mitigated: 3 risks addressed (RISK-01 (Windows SQLite Lock Collisions in Concurrency Tests); RISK-02 (Legacy JSON Migration with Missing or Altered Artifacts)).
• Dependencies: Local file system and Node.js extension host (zero cloud daemons).
• Gating Verdict: GO — Proceed to Step 3 Technology Strategy Architect.
- **Step 3 (Technology Strategy)**: TL;DR TECH STACK & STRATEGY (Step 3 Baseline):
• Core Stack: Node.js LTS + TypeScript strict + atomic file storage.
• Key TDRs: RUNTIME_LANGUAGE: Node.js LTS (>=20.0.0 <25.0.0) + TypeScript 5.x; DATA_STORAGE: SQLite3 (better-sqlite3) with WAL Mode; BUILD_PACKAGING: zod Schema Engine; COMMUNICATION_PROTOCOL: POSIX Stdin/Stdout JSON Streaming; TESTING_FRAMEWORK: Node.js Native Test Runner (node:test) + tsx.
• Testing: Native node:test runner with tsx (zero runner bloat).
• Prohibited: External background servers / cloud daemons.
• Gating Verdict: GO — Proceed to Step 4 System Architecture Architect.
- **Step 4 (System Architecture)**: TL;DR SYSTEM ARCHITECTURE (Step 4 Baseline):
• Architecture Style: Modular Local-First Governance Engine with Inverted Ingestion Bridge.
• Component Breakdown: 4 core components (Bridge, State Store, Governance, Dispatcher).
• Key ADRs: ADR-01, ADR-02, ADR-03, ADR-04.
• Resilience: FMEA verified; write-ahead atomic journaling with resume sentinel.
• Gating Verdict: GO — Proceed to Step 5 Detailed Technical Design Architect.
- **Step 5 (Detailed Technical Design)**: TL;DR DETAILED TECHNICAL DESIGN (Step 5 Baseline):
• Implementation Specs: 4 core modules specified with explicit method signatures.
• State Machine: 3-stage transition model (NOT_STARTED -> IN_PROGRESS -> AWAITING_APPROVAL -> LOCKED).
• Error Handling: 4 standardized error codes with recovery guidance.
• Concurrency: Single-writer atomic file rename journal.
• Gating Verdict: GO — Proceed to Step 6 Implementation Planning Architect.
- **Step 6 (Implementation Plan & WBS)**: TL;DR IMPLEMENTATION PLAN (Step 6 Baseline):
• Work Breakdown: 5 core tasks planned (~27 total engineering hours).
• Delivery Strategy: 5-Milestone Sequential Delivery with In-Flight SQLite Persistence and Strict Stage Gating.
• Critical Path: TASK-01 -> TASK-02 -> TASK-03 -> TASK-04 -> TASK-05.
• Quality Gates: Strict DoR before start; 100% test pass DoD before lock.
• Gating Verdict: GO — Proceed to Step 7 Implementation & Development Architect.
- **Step 7 (Release Candidate)**: TL;DR RELEASE CANDIDATE (Step 7 Baseline):
• RC Tag: v0.8.0-rc1 (Build: SUCCESS).
• Codebase Manifest: 9 verified modules (State Engine + Agents 01-07).
• Test Proof: 40/40 automated tests passing across 13 suites.
• Gating Verdict: GO — Proceed to Step 8 Verification & QA Architect.
- **Step 8 (Verification & QA)**: TL;DR VERIFICATION & QA (Step 8 Baseline):
• Binding Verdict: PASS (Ready for Production Release).
• Audit Coverage: 5 QA dimensions verified (Spec, Latency, Chaos, Sandboxing).
• Traceability: 4 core requirements traced directly from Step 0/1 to passing tests.
• Zero Defects: 0 P0/P1 bugs; 100% automated test pass rate.
• Gating Verdict: GO — Proceed to Step 9 Production Readiness Architect.
- **Step 9 (Production Readiness)**: TL;DR PRODUCTION READINESS & DEPLOYMENT (STEP 9 BASELINE):
- Target Environments: Local IDE extension host (<512MB RAM, 50MB disk) and ephemeral CI/CD container runner.
- Release Gates: GATE-01 (State signature integrity), GATE-02 (Exit code 0 on all test suites), GATE-03 (Atomic recovery verified).
- Rollback Strategy: Sub-2-second automated fallback to .zeta/state.json.bak with turn-buffer replay compensation.
- Rollout: Zero-downtime atomic swap with backward-compatible schema migrations.
- Observability: Local structured JSON crash logging (.zeta/crashes.log) with 5MB rolling cap and zero telemetry egress.
All release gates cleared for operational launch.
- **Step 10 (Operations & SRE)**: TL;DR OPERATIONS & SRE (STEP 10 BASELINE):
- Service Level Objectives: 99.99% atomic persistence success, P95 latency <= 1000ms, 99.9% crash-free sessions.
- Incident Response: SEV-1 (EPERM/state corruption) MTTR <= 5m with automated fallback to .zeta/state.json.bak; SEV-2 MTTR <= 15m; SEV-3 self-healing.
- Disaster Recovery: Continuous per-turn backup snapshots (RPO = 0, RTO <= 1m) retained in a 10-step rolling ring buffer.
- Probes: Active storage integrity and invariant alignment probes.
- Maintenance: Automated weekly pruning of .zeta/crashes.log (> 5MB) and on-upgrade SHA-256 cross-checks.
SRE operational baseline locked for Step 10.
- **Step 11 (Security & Compliance)**: TL;DR SECURITY, PRIVACY & COMPLIANCE (STEP 11 BASELINE):
- Threat Model (STRIDE): Tampering mitigated by SHA-256 state signatures; Disclosure mitigated by automated token scrubbing; DoS mitigated by turn backoff.
- Data Privacy: Strict Zero-Cloud-Egress boundary; all state and documents executed locally within workstation sandbox.
- Secrets Policy: Zero plain-text credentials in repository; pre-commit regex scanning enforced.
- Vulnerability SLAs: Hard CI pipeline block on CRITICAL (24h SLA) and HIGH (72h SLA) CVEs.
- License Compliance: CycloneDX SBOM generation; strictly permissive licenses (MIT, Apache-2.0, BSD-3); viral copyleft banned.
Security & compliance baseline formally locked for Step 11.

---

## 2. Semantic Versioning (SemVer 2.0.0) Rules
| Level | Trigger Condition | Deprecation Mandatory? | Minimum Prior Cycles |
|---|---|---|---|

| **MAJOR** | Breaking changes to public API, .zeta/state.json schema alterations without upward compatibility, or stage gate structural removals | YES | 2 minor cycles |

| **MINOR** | Backward-compatible additions, new optional agent features, or schema additions with default fallbacks | NO | 0 minor cycles |

| **PATCH** | Bug fixes, internal refactoring, non-breaking performance optimizations, and documentation edits | NO | 0 minor cycles |


---

## 3. Four-Phase Deprecation & Sunsetting Lifecycle

### Phase: Announcement & Warning (4 Weeks)
- **Runtime Behavior**: Functionality operates normally; static compilation warning emitted during build
- **Migration Assistance**: Provide replacement API symbol name and automated codemod snippet


### Phase: Soft Deprecation (8 Weeks)
- **Runtime Behavior**: Runtime console warning on first invocation per session; operation succeeds
- **Migration Assistance**: Interactive CLI deprecation notice with automated migration prompt


### Phase: Hard Deprecation (4 Weeks)
- **Runtime Behavior**: Throws DeprecatedFeatureError unless explicit opt-in flag `--allow-deprecated` is set
- **Migration Assistance**: Blocking error message with link to migration guide in docs/


### Phase: Complete Sunsetting & Removal (0 Weeks)
- **Runtime Behavior**: Code and schema fields completely removed from source tree
- **Migration Assistance**: Archived changelog documentation


---

## 4. State Schema Migrations & Rollback Guarantees
| Version Transition | Migration Engine | Rollback Guaranteed? | Data Transformation Rule |
|---|---|---|---|

| `v1.0.0` -> `v1.1.0` | In-place idempotent schema transformation executed by StateManager on startup | **YES (Automatic)** | Ensure newly introduced fields default to empty arrays or backward-compatible defaults |


- **Compatibility Contract**: N-1 Major Version Schema Support & 100% Backward Compatibility across Minor/Patch

---

## 5. Architectural Drift Guardrails & Technical Debt Limits
| Guardrail Name | Enforcement Mechanism | Tolerance Limit | Action on Breach |
|---|---|---|---|

| Invariant Alignment Guardrail | `Automated turn validator checking against Step 0 Intent and Step 4 Architecture` | **0 unapproved deviations from approved tech stack or core principles** | Block turn signoff and surface Top 3 trade-off questions |

| Cryptographic State Immutability | `SHA-256 integrity verification of locked step files on load` | **0 hash mismatches permitted** | Flag corrupted step as tampered and trigger SEV-1 SRE recovery |


---

## 6. Deprecation Governance Signoff & Baseline Certification
- **SemVer Compliance**: VERIFIED (No unannounced breaking changes)
- **Schema Migration Guarantee**: Verified Idempotent Rollback Automation
- **Drift Control Status**: Active Guardrails Enforcing Step 0 & Step 4 Baselines
