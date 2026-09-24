# Engineering Implementation Roadmap: Autonomous Governance Plugin
**Document ID**: ROADMAP-AUTONOMOUS-GOVERNANCE-2026  
**Baseline**: Aligned strictly with `SSOT.md`  
**Target Duration**: 11 Hours Total Engineering Work  

---

## Phase 1: Session State & Interruption Recovery Engine
**Objective**: Guarantee that user state is never lost, even on abrupt browser or IDE shutdowns.  
**Estimated Time**: 2 Hours  

* [x] **1.1 State Schema Definition (`src/core/state/types.ts`)**
  - Define `SessionState`, `StepStatus` (`NOT_STARTED`, `IN_PROGRESS`, `AWAITING_APPROVAL`, `LOCKED`), `UncommittedBuffer`, and `StepSummaries`.
* [x] **1.2 Atomic Per-Turn State Manager (`src/core/state/state-manager.ts`)**
  - Implement read/write logic for `.zeta/state.json`.
  - Guarantee atomic file writes (write to `.tmp` then rename) to prevent corruption during unexpected terminations.
* [x] **1.3 Session Resume & Recovery Sentinel (`src/core/state/resume-sentinel.ts`)**
  - Implement startup check: if `.zeta/state.json` exists, load last active step, recover uncommitted buffer, and generate the greeting summary.
* [x] **1.4 Automated Unit Tests (`tests/unit/state-manager.test.ts`)**
  - Test per-turn saves, abrupt shutdown simulations, buffer recovery, and corruption prevention.

---

## Phase 2: Sequential 15-Agent Pipeline & Stage Gating
**Objective**: Build the strict sequential state machine that guides the user from Step 0 to Step 14 without rushing or skipping.  
**Estimated Time**: 3.5 Hours  

* [x] **2.1 Agent State Machine (`src/core/swarm/pipeline-runner.ts`)**
  - Implement sequential transitions: Step 0 $\rightarrow$ Step 1 $\rightarrow \dots \rightarrow$ Step 14.
  - Enforce prerequisite check: Step $N$ cannot start until Step $N-1$ is `LOCKED`.
* [x] **2.2 Human Handshake Gate (`src/core/swarm/handshake-gate.ts`)**
  - When an agent completes a step's draft, pause execution.
  - Prompt user with step summary and require explicit confirmation (`"Approve"`) to freeze.
* [x] **2.3 Context Compression Engine (TL;DR Compiler) (`src/core/context/summary-compiler.ts`)**
  - Automatically extract an executive summary whenever an artifact in `docs/` is locked.
  - Pass lightweight summaries to downstream agents to eliminate LLM context overflow.
* [x] **2.4 Artifact Storage Writer (`src/core/artifacts/writer.ts`)**
  - Standardize output writing to `docs/PROJECT_INTENT.md`, `docs/REQUIREMENTS_SPECIFICATION.md`, etc.
* [x] **2.5 Automated Unit Tests (`tests/unit/pipeline-runner.test.ts`)**
  - Test sequential progression, handshake approval locks, and context compression.

---

## Phase 3: Conversational Drift Detector & Impact Cascade Engine
**Objective**: Detect when the user's intent shifts during natural conversation and report downstream impacts before updating.  
**Estimated Time**: 3 Hours  

* [x] **3.1 Semantic Intent Comparator (`src/core/drift/intent-comparator.ts`)**
  - Compare incoming user prompts against locked `PROJECT_INTENT.md` and `SSOT.md`.
  - Flag deviations exceeding divergence threshold without needing manual commands.
* [x] **3.2 Conversational Drift Interceptor (`src/core/drift/interceptor.ts`)**
  - Intercept drift and ask naturally: *"This diverges from our agreed requirements. Did your goal change?"*
* [x] **3.3 Impact Cascade Analyzer (`src/core/drift/impact-cascade.ts`)**
  - When the user confirms an intentional change, analyze all locked downstream stages.
  - Generate the multi-stage Impact Cascade Report (e.g. changes to Feasibility, Tech Stack, or Architecture).
* [x] **3.4 Surgical Baseline Updater (`src/core/drift/baseline-updater.ts`)**
  - Update only the affected sections of the target document, preserving unimpacted specifications.
* [x] **3.5 Automated Unit Tests (`tests/unit/core/drift-detection.test.ts`)**
  - Test false-alarm suppression, true drift detection, cascade reporting, and surgical updates.

---

## Phase 4: IDE Bootstrap Hook & End-to-End Simulation
**Objective**: Wire the plugin into the IDE lifecycle and validate with a live project simulation.  
**Estimated Time**: 2.5 Hours  

* [x] **4.1 Zero-Config Bootstrap Hook (`src/core/bootstrap/init-hook.ts`)**
  - Trigger automatically on Message 1 when `.zeta/state.json` is absent.
  - Direct raw brain-dump directly into Agent 01.
* [x] **4.2 End-to-End Project Lifecycle Simulation (`tests/integration/swarm-e2e.test.ts`)**
  - Simulate a complete user journey:
    1. Raw brain-dump input.
    2. Agent 01 clarification and locking.
    3. Step 1 requirements handshake.
    4. Mid-project user goal change $\rightarrow$ Impact Cascade report $\rightarrow$ confirmed update.
    5. Mid-turn crash and successful resume.
* [x] **4.3 Plugin Packaging & Distribution Configuration (`package.json`, `tsconfig.json`)**
  - Clean build scripts, production entrypoint, and documentation.
