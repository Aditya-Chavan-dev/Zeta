# Operations, Maintenance & Site Reliability Engineering (SRE) Runbook

## Executive Summary
This document establishes operational service level objectives (SLOs), incident response runbooks, automated disaster recovery procedures, continuous health check probes, and preventative maintenance cadences for the autonomous engineering governance system. It ensures high reliability, rapid mean-time-to-recovery (MTTR), and zero silent state corruption across operational lifecycles.

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

---

## 2. Service Level Objectives (SLOs) & Reliability Indicators (SLIs)
| Metric Name | SLI Formula | Target Objective | Window | Breach Action |
|---|---|---|---|---|

| Session State Persistence Success Rate | `(successful_atomic_saves / total_state_save_attempts) * 100` | **99.99%** | 30-day rolling | Halt all auto-advancements and trigger storage health audit |

| Turn Execution Latency (P95) | `turn_response_time_ms <= 1000ms` | **99%** | 7-day rolling | Deactivate background non-essential diagnostics |

| Crash-Free Session Integrity | `(sessions_with_zero_uncaught_exceptions / total_sessions) * 100` | **99.9%** | 30-day rolling | Issue urgent hotfix release candidate via Step 7/8 cycle |


---

## 3. Incident Triage Runbooks & Escalation Matrix

### SEV-1 (Critical) Runbook
- **Trigger Condition**: Persistent EPERM / EBUSY disk write failure or state file corruption preventing workspace boot
- **Target MTTR**: 5 minutes
- **Escalation Path**: Notify core engineering maintainer immediately via local error report banner
- **Initial Triage Steps**:
  1. Inspect .zeta/state.json syntax and integrity
  1. Attempt automatic restore from .zeta/state.json.bak
  1. Check file lock holders on process thread
  1. If file locks persist, trigger clean restart with file-lock retry backoff


### SEV-2 (Major) Runbook
- **Trigger Condition**: Precondition verification failure for an ostensibly completed step or missing TL;DR digest
- **Target MTTR**: 15 minutes
- **Escalation Path**: Prompt user with Top 3 state repair options
- **Initial Triage Steps**:
  1. Verify cryptographic hash SHA-256 in docs/ against stepSummaries in state.json
  1. Run StateManager.recomputeStepDigest(stepNumber)
  1. Re-lock corrupted step if artifact remains intact


### SEV-3 (Minor) Runbook
- **Trigger Condition**: Transient turn buffer desynchronization or formatting artifact warning
- **Target MTTR**: 30 minutes
- **Escalation Path**: Self-healed by ResumeSentinel on next turn
- **Initial Triage Steps**:
  1. Flush uncommitted turn buffer
  1. Re-render artifact preview in memory


---

## 4. Disaster Recovery & Backup Retention Architecture

### Component: .zeta/state.json (Primary Governance Store)
- **Backup Cadence**: Continuous per-turn snapshot (.zeta/state.json.bak)
- **Retention Window**: Latest 10 historical step snapshots
- **RPO**: 0 hours | **RTO**: 1 minutes
- **Recovery Procedure**:
  1. Copy state.json.bak over state.json
  1. Validate JSON syntax and lockedSteps array
  1. Resume active turn with ResumeSentinel


### Component: docs/ Compiled Project Specifications
- **Backup Cadence**: Git commit per locked step
- **Retention Window**: Full project Git commit history
- **RPO**: 0 hours | **RTO**: 2 minutes
- **Recovery Procedure**:
  1. Execute git checkout HEAD -- docs/ if uncommitted drift detected
  1. Verify sha256 checksums against state.stepSummaries


---

## 5. Health Check Probes & Telemetry Monitors
| Probe Name | Type | Invocation / Mechanism | Interval | Failure Threshold |
|---|---|---|---|---|

| State Storage Integrity Probe | `liveness` | `StateManager.load(workspaceRoot)` | 30s | 2 |

| Workspace Write Permission Probe | `startup` | `fs.accessSync(workspaceRoot, fs.constants.W_OK)` | 0s | 1 |

| Step Invariant Alignment Probe | `readiness` | `PreconditionVerifier.verifyPrerequisites(workspaceRoot)` | 60s | 1 |


---

## 6. Preventative Maintenance & Log Hygiene
| Maintenance Task | Frequency | Procedure | Automation Status |
|---|---|---|---|

| Crash Log & Uncommitted Scratch Buffer Pruning | `weekly` | Truncate .zeta/crashes.log if file size exceeds 5MB and prune scratch files older than 14 days | **fully-automated** |

| State Checksum & Artifact Cross-Audit | `on-version-upgrade` | Verify SHA-256 hashes of all locked markdown documents against .zeta/state.json records | **fully-automated** |


---

## 7. SRE Operational Signoff & Baseline Certification
- **SLO Feasibility**: VERIFIED (Target >= 99.9% availability & atomic persistence)
- **Disaster Recovery MTTR**: Sub-2-minute RTO confirmed with zero state loss (RPO = 0)
- **Runbook Clarity**: Operational runbooks baselined for SEV-1 through SEV-3
