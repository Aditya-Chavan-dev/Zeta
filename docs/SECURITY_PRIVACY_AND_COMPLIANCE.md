# Security, Privacy & Compliance Architecture Specification

## Executive Summary
This document establishes the security threat model (STRIDE), secrets management governance, data privacy boundaries, vulnerability remediation SLAs, cryptographic integrity controls, and open-source license compliance policies for the greenfield project. It enforces a strict zero-cloud-egress posture, guaranteeing that user proprietary assets and architecture remain completely private and sovereign.

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

---

## 2. STRIDE Threat Modeling & Risk Matrix
| Category | Identified Threat | Impacted Component | Mitigation Control | Residual Risk |
|---|---|---|---|---|

| **Tampering** | Unauthorized modification of .zeta/state.json or compiled docs/ specifications | `StateManager / Disk Governance Store` | Cryptographic SHA-256 digest validation recorded on step lock and cross-checked on load | **NEGLIGIBLE** |

| **Information Disclosure** | Sensitive API tokens or customer code fragments inadvertently written to logs or artifacts | `ArtifactCompiler & Error Logger` | Automated regex token scrubber redacting patterns before writing to disk | **LOW** |

| **Denial of Service** | File-lock starvation or recursive turn loops causing process hang | `Turn Execution Engine` | Bounded turn timeouts (10s max) and 5-retry exponential backoff on file operations | **NEGLIGIBLE** |

| **Elevation of Privilege** | Unsanitized user prompt triggering arbitrary shell execution | `Agent Input Dispatcher` | Strict parameterized execution; no eval() or dynamic bash generation | **NEGLIGIBLE** |


---

## 3. Secrets Management & Exposure Prevention

### Classification: RESTRICTED
- **Storage Mechanism**: Environment variable injection or OS-level credential vault (never committed to repo)
- **Detection & Prevention Rule**: Pre-commit and CI git-secrets / gitleaks regex scan matching API keys and private keys
- **Rotation Policy**: 90-day mandatory rotation with immediate revocation upon exposure


---

## 4. Data Privacy, Sovereignty & Sandboxing Boundary
| Data Domain | Collection Policy | Egress Boundary | Sanitization / Handling Control |
|---|---|---|---|

| User Source Code & Architecture Documents | `LOCAL_EPHEMERAL_ONLY` | **ZERO_CLOUD_EGRESS** | All governance and analysis executed locally within workspace sandbox; zero external cloud egress |

| Session Diagnostics & Crash Telemetry | `LOCAL_EPHEMERAL_ONLY` | **ZERO_CLOUD_EGRESS** | Local .zeta/crashes.log only; all file paths and user tokens scrubbed |


---

## 5. Vulnerability Remediation SLAs & Pipeline Gating
| CVE Severity | Mandatory Remediation SLA | Automated CI/CD Gate |
|---|---|---|

| **CRITICAL** | 24 hours | **YES (HARD BLOCK)** |

| **HIGH** | 72 hours | **YES (HARD BLOCK)** |

| **MEDIUM** | 336 hours | **NO (WARNING)** |

| **LOW** | 720 hours | **NO (WARNING)** |


---

## 6. Software Bill of Materials (SBOM) & License Compliance
- **Permitted Licenses**: MIT, Apache-2.0, BSD-3-Clause, ISC
- **Banned Licenses**: GPL-3.0, AGPL-3.0, SSPL
- **SBOM Generation Tool**: `CycloneDX / NPM License Checker`
- **Output Standard**: `SPDX 2.3 JSON Specification`

---

## 7. Cryptographic Verification & Tamper Evidence
- SHA-256 digest validation for all locked steps in .zeta/state.json
- Deterministic serialization of state objects to prevent false-positive drift
- Sub-resource integrity checks for third-party build tooling

---

## 8. Security Architecture Signoff & Baseline Certification
- **Threat Model Completeness**: AUDITED (All STRIDE categories evaluated)
- **Data Sovereignty**: 100% Local Execution Verified (Zero Cloud Egress)
- **License Integrity**: Permissive Open-Source Licensing Enforced
