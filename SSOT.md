# Single Source of Truth (SSOT): Autonomous Engineering Governance Plugin
**Document ID**: SSOT-ENGINEERING-PLUGIN-2026  
**Scope**: Greenfield / New Projects Only  
**Status**: ACTIVE & LOCKED  

---

## 1. Product Identity & Purpose

### The Problem
When developers input an idea into an AI IDE, the AI often "vibe-codes" an immediate implementation without discipline. Over time, poor architecture, lack of planning, undocumented decisions, and untracked technical debt produce an unmaintainable codebase that cannot be modified, scaled, or safely refactored.

### The Solution
An automated, zero-configuration IDE governance plugin that **intercepts the initial idea brain-dump** on new projects and rigorously guides both the AI and the developer through a professional **15-stage software engineering lifecycle**.

### Core Invariants
1. **Greenfield Scope Only**: Activates solely on new projects starting from an idea.
2. **Zero-Configuration Activation**: Activates automatically on the very first user message after installation without requiring slash commands.
3. **No Skipping, No Rushing**: Every stage requires an explicit human handshake to lock its artifact before the next agent unlocks.
4. **Natural Language Drift Detection**: If the user's conversation deviates from earlier agreements, the plugin detects the intent shift, asks for confirmation, and calculates an **Impact Cascade Report** across all affected stages.
5. **Per-Turn Atomic Persistence**: State is committed on every message turn to eliminate loss from abrupt session quits.

---

## 2. The 15-Stage Engineering Swarm

The system executes 15 specialized agents in strict sequence:

| Step | Agent Role | Focus Question | Output Artifact |
| :---: | :--- | :--- | :--- |
| **0** | **Problem Definition & Project Intent** | *Why should we build this?* | `docs/PROJECT_INTENT.md` |
| **1** | **Requirements Gathering & Elicitation** | *What must it accomplish?* | `docs/REQUIREMENTS_SPECIFICATION.md` |
| **2** | **Feasibility, Constraints & Risk Analysis** | *Can we realistically build it?* | `docs/FEASIBILITY_AND_RISK_REPORT.md` |
| **3** | **Technology Strategy & Tech-Stack Selection** | *What technologies should we use?* | `docs/TECH_STACK_AND_STRATEGY.md` |
| **4** | **System Architecture & Solution Design** | *How is the system structured?* | `docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md` |
| **5** | **Detailed Technical / Engineering Design** | *Exactly how does each part work?* | `docs/DETAILED_TECHNICAL_DESIGN.md` |
| **6** | **Implementation Planning & Work Breakdown** | *What do we build and in what order?* | `docs/IMPLEMENTATION_PLAN_AND_WBS.md` |
| **7** | **Implementation / Software Construction** | *Build and construct the software.* | `docs/IMPLEMENTED_RELEASE_CANDIDATE.md` + Code |
| **8** | **Verification, Validation & Quality Assurance** | *Did we build it correctly?* | `docs/VERIFICATION_AND_QA_PACKAGE.md` |
| **9** | **Production Readiness & Deployment** | *Is it production-ready with release gates and rollback?* | `docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md` |
| **10** | **Operations, Maintenance & SRE** | *How do we keep it healthy with SLOs and incident response?* | `docs/OPERATIONS_MAINTENANCE_AND_SRE.md` |
| **11** | **Security, Privacy & Compliance** | *Is it secured against threats with privacy controls?* | `docs/SECURITY_PRIVACY_AND_COMPLIANCE.md` |
| **12** | **Governance, Lifecycle & Deprecation** | *How do we version and evolve without breaking state?* | `docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md` |
| **13** | **Knowledge Transfer & Documentation** | *Is it fully documented with onboarding and ADRs?* | `docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md` |
| **14** | **Project Retrospective & Continuous Improvement** | *What went well and what is the kaizen plan?* | `docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md` |

---

## 3. Human-Agent Interaction & Elicitation Protocol

### 1. The Initial Brain-Dump
* On message 1, the user enters an unorganized idea.
* Agent 01 takes over, dissects the idea, and identifies missing dimensions (Problem Space, Target Users, Success Metrics).
* **Top 3 Options Rule**: If the user is ambiguous or unsure about a design choice, the agent provides the **top 3 industry options** with trade-offs and impact explained before finalizing.

### 2. The Stage Handshake Gate
* An agent never silently moves to the next step.
* When a step's draft is complete, the agent presents a summary and prompts:
  > *"Step [X] complete and saved to `docs/[ARTIFACT].md`. Review the summary above. Type **'Approve'** to freeze this step and proceed to Step [X+1]."*

### 3. Context Window Optimization (Executive TL;DR)
* To prevent LLM context exhaustion, downstream agents do not ingest all prior 50-page markdown documents.
* Each locked artifact compiles an **Executive Summary (TL;DR)** that is fed into downstream agent prompts, with full documents referenced on demand.

---

## 4. Natural Drift Detection & Impact Cascade Engine

Users change their minds naturally during conversation. Instead of rigid commands, the plugin handles changes conversationally:

```
[User casually asks for a conflicting feature mid-project]
                         │
                         ▼
[Plugin compares prompt against Step 0 Intent & Step 1 Requirements]
                         │
                         ▼
"Notice: This request diverges from our agreed Step 1 Requirements.
 Did your project goals change, or is this an intentional update?"
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
   [User: "No, mistake"]            [User: "Yes, change it"]
   Plugin stays on track            Plugin runs Impact Cascade Analysis:
                                    - Step 2 Feasibility: Impact on storage costs
                                    - Step 3 Tech Stack: Requires Redis cache
                                    - Step 4 Architecture: Adds Pub/Sub queue
                                    "Confirm to update all 3 affected stages?"
```

---

## 5. Per-Turn State Persistence & Interruption Recovery

### State File: `.zeta/state.json`
Updated atomically after **every single user and model turn**:
```json
{
  "activeStep": 3,
  "stepStatus": "IN_PROGRESS",
  "turnCount": 6,
  "lockedSteps": [0, 1, 2],
  "lastTurnTimestamp": "2026-09-13T17:15:00.000Z",
  "stepSummaries": {
    "step_0": "Intent locked: Developer governance engine...",
    "step_1": "Requirements locked: 15-stage pipeline...",
    "step_2": "Feasibility approved: Node/TS local execution..."
  },
  "uncommittedBuffer": {
    "lastUserMessage": "I prefer PostgreSQL over MongoDB",
    "pendingDraftUpdates": "Database candidate shortlisted to Postgres"
  }
}
```

### Abrupt Session Resume Protocol
If the user closes the IDE or terminates the chat mid-stage:
1. On the next session start, the plugin reads `.zeta/state.json`.
2. It detects `stepStatus: "IN_PROGRESS"` and uncommitted buffer content.
3. It immediately greets the user:
   > *"Welcome back. Last time we were working on **Step 3 (Technology Strategy)** discussing database selection. We have locked Steps 0, 1, and 2. Let's resume where we left off."*

---

## 6. Implementation Roadmap (How We Build This)

Building the plugin proceeds across 4 bounded phases:

* **Phase 1: State Core & Session Sentinel**
  - Implement `.zeta/state.json` schema and atomic read/write manager.
  - Implement the IDE bootstrap hook (intercepts Message 1 on fresh workspaces).
  - Implement the abrupt session resume logic.

* **Phase 2: The Sequential 15-Agent Dispatcher**
  - Implement the stage-gate state machine (Steps 0 through 14).
  - Implement the TL;DR summary generator for cross-stage context compression.
  - Implement the explicit human handshake gate (`Approve` trigger).

* **Phase 3: Natural Language Drift & Impact Cascade Engine**
  - Implement the drift detector comparing user input against active `SSOT.md` and `PROJECT_INTENT.md`.
  - Implement the multi-stage Impact Cascade analyzer that calculates downstream effects when requirements shift.

* **Phase 4: Parallel Sentinel Sentries (V2)**
  - Integrate background Checker Agents running asynchronously on each turn to enforce quality, security, and completeness invariants.
