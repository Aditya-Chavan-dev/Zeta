# ZETA System Faults & Incident Postmortem Log

This directory documents all architectural, behavioral, and runtime faults encountered during the design, construction, and hardening of the **ZETA Autonomous Engineering Governance System**, along with root-cause analyses and permanent mitigations.

---

## Summary of All Faults

| ID | Title | Component | Impact | Resolution Status |
|---|---|---|---|---|
| **FLT-01** | Premature Technical Solutioning in Step 0 | Prompt / Step 0 Elicitation | LLM forced AST/DB choices before problem was defined | RESOLVED |
| **FLT-02** | Rigid Multiple-Choice Forcing & `(Recommended)` Tag Trap | Invariant 4 / Skill Rules | Constrained user vision into pre-baked multiple-choice | RESOLVED |
| **FLT-03** | Premature Goal Finalization & Overlooked Blind Spots | Step 0 Lifecycle Map | Novice developers missed critical runtime edge cases | RESOLVED |
| **FLT-04** | Silent Bypass on User Uncertainty ("I can't think of a way") | Step 0 Exception Handling | Agent assumed answer and compiled doc without answering user | RESOLVED |
| **FLT-05** | Inability to Comprehend "No" & Silent Auto-Selection | Agent 01–15 / Governance Rules | Answering "No" auto-selected Option 1 or triggered quit warning | RESOLVED |
| **FLT-06** | Lack of Mid-Session Update Detection & Rollback Choice | State Store / Sentinel | Projects in-flight missed tool improvements or were forced | RESOLVED |
| **FLT-07** | Windows SQLite EPERM & Concurrency Lock Collisions | Storage Layer (`better-sqlite3`) | Fast concurrent tests collided on NTFS file locks | RESOLVED |

---

## Detailed Fault Records

### Fault FLT-01: Premature Technical Solutioning in Step 0
- **Location**: Step 0 Idea Clarification (`docs/PROJECT_INTENT.md`, `AGENTS.md`).
- **Symptom**: When a user entered a raw brain-dump (e.g., an MCP auditing tool), ZETA immediately jumped to technical questions (e.g., *"Select parser: Tree-sitter AST vs LSP vs Hybrid Engine"*).
- **Root Cause**: The prompt lacked a strict separation between problem discovery (Step 0) and technical strategy (Step 3/4).
- **Impact**: Non-technical users or early-stage founders were alienated; technical choices were locked before requirements were discovered.
- **Fix**:
  1. Enforced a **Strict Ban on Premature Solutioning** in Step 0.
  2. Restricted Step 0 to core problem space, target users, and workflow boundaries in plain English.

---

### Fault FLT-02: Rigid Multiple-Choice Forcing & The `(Recommended)` Tag Trap
- **Location**: Invariant 4 (`SKILL.md`, `scripts/install-rules.js`).
- **Symptom**: ZETA turned clarifying questions into multiple-choice surveys (`1. (Recommended)... 2... 3... Reply with 1, 2, 3`). Users blindly selected Option 1, resulting in "vibe-coded" misalignment.
- **Root Cause**: Invariant 4 stated: *"Whenever eliciting user intent, requirements, architecture... ALWAYS present exactly Top 3 industry options"*. The LLM interpreted this as a mandate to make every question a multiple-choice quiz.
- **Impact**: Users could not express custom ideas; ideas were forced into AI archetypes.
- **Fix**:
  1. Banned numbered choices (`1, 2, 3`) and `(Recommended)` tags from Step 0 questions.
  2. Mandated direct, open-ended probing questions that require the user to answer in their own words.
  3. Reserved Top 3 options strictly for architectural decisions in Steps 3 & 4.

---

### Fault FLT-03: Premature Goal Finalization & Overlooked Blind Spots
- **Location**: Step 0 Gating Flow.
- **Symptom**: After 1 round of base questions, ZETA compiled the document and demanded approval, leaving critical configuration, recovery, and boundary limits unaddressed.
- **Root Cause**: No multi-round elicitation depth; newer developers do not know what they do not know.
- **Impact**: Projects built on v1.0 had brittle foundations that broke under runtime edge cases.
- **Fix**:
  1. Established the **Sequential 3-Round Idea Clarification Loop** (Base -> Behavioral -> Mechanical).
  2. Established the **Sequential 3-Round Blind Spots Hardening Loop** (Foundation -> Runtime -> Resilience).
  3. Synthesized a rock-solid, unbreakable Lean Baseline v1.0 and established the handoff boundary to Evo.

---

### Fault FLT-04: Silent Bypass on User Uncertainty ("I can't think of a way")
- **Location**: Step 0 Prompt Exception Flow.
- **Symptom**: When a user responded *"I can't think of a way. What is the recommended way?"*, ZETA ignored the plea for recommendations, assumed an answer on its own, wrote `docs/PROJECT_INTENT.md`, and prompted for `"Approve"`.
- **Root Cause**: The blanket ban on suggestions in Step 0 had no exception handler for user-requested help. The LLM felt forbidden from offering options, so it bypassed the question entirely.
- **Impact**: The user was shut out of design decisions precisely when they needed expert architectural guidance.
- **Fix**:
  1. Implemented the **Uncertainty & Recommendation Protocol (Top 3 on Demand)**.
  2. Whenever the user says *"I don't know"*, *"I can't think of a way"*, or *"What do you recommend?"*, ZETA is strictly forbidden from writing documents or advancing.
  3. ZETA immediately presents Top 3 industry options with trade-offs and waits for user selection.

---

### Fault FLT-05: Inability to Comprehend "No" & Silent Auto-Selection
- **Location**: All 15 Agents (`src/agents/agent-01` to `agent-15`), `AGENTS.md`.
- **Symptom**: When the user replied *"No"* to a feature, question, or option:
  1. ZETA displayed a safety warning: *"WARNING: Quitting ZETA Mode..."*, OR
  2. ZETA silently fell through and auto-selected Option 1 / Recommended feature.
- **Root Cause**:
  1. Rule in `install-rules.js` mapped any input of `"No"` to the session termination prompt.
  2. Agent code in `release-readiness-auditor.ts`, `sre-auditor.ts`, etc., checked `if (answer.includes('2')) ... else if (answer.includes('3')) ...` and defaulted to Option 1 when "No" didn't match 2 or 3.
- **Impact**: Negative constraints were ignored; users could not exclude unwanted features.
- **Fix**:
  1. Added `GovernanceEngine.isNegativeResponse()` across all 15 agents.
  2. Answering "No", "None", or "Skip" explicitly records the item as `EXCLUDED` or `OUT OF SCOPE`.
  3. Quitting ZETA mode was restricted to explicit commands (`"quit zeta"` / `"exit zeta"`).

---

### Fault FLT-06: Lack of Mid-Session Update Detection & Rollback Choice
- **Location**: State Store (`.zeta/state.json`), Resumption Sentinel.
- **Symptom**: When ZETA was updated from our side with new elicitation workflows, active in-progress project sessions had no awareness of the update or were abruptly altered without consent.
- **Root Cause**: State store lacked tool versioning metadata and mid-session upgrade handshakes.
- **Impact**: Users lost workflow continuity or missed out on critical governance bug fixes.
- **Fix**:
  1. Added `toolVersion` and `stayOnOldVersion` to `SessionStateSchema`.
  2. Added **Mid-Session Dynamic Tool Update Sentinel** that detects version changes at turn start.
  3. Prompts the user with 3 bullet points of changes and lets them choose: *"Upgrade"* or *"Stay on old version"*.

---

### Fault FLT-07: Windows SQLite EPERM & Concurrency Lock Collisions
- **Location**: Storage Layer (`src/core/state/sqlite-store.ts`).
- **Symptom**: Fast parallel test execution on Windows failed with `SqliteError: database is locked` or `EPERM: operation not permitted`.
- **Root Cause**: NTFS file locking behavior on Windows holds locks longer than POSIX; standard rollback journal caused read/write lock collisions.
- **Impact**: Automated CI/CD test suites had intermittent flaky failures under load.
- **Fix**:
  1. Enabled SQLite Write-Ahead Logging (`PRAGMA journal_mode = WAL`).
  2. Added exponential backoff retry for transient Windows file-lock collisions.
