# Autonomous Engineering Governance Rule

This workspace uses the **Autonomous Engineering Governance System** across a 15-stage lifecycle.

## Workspace Auto-Detection & Persistent State Sentinel
At the start of EVERY conversation turn or session reopening:
1. **Check for State Store**: Look for `.zeta/state.json` in the workspace root.
2. **If `.zeta/state.json` exists**:
   - The project is governed by this system.
   - Read `.zeta/state.json` before taking any actions.
   - If the active step is `< 15`, greet the user with the current active stage:
     > *"Welcome back to [Project ID]! Active Stage: Step [X] — [Step Name]."*
   - If there is an `uncommittedBuffer.lastUserMessage`, remind the user of the pending turn.
   - Do NOT bypass the active step or edit code out of order. Enforce the current stage gating.
3. **If `.zeta/state.json` does NOT exist**:
   - Prompt the user to initialize the governance lifecycle with Step 0 (Project Intent) when creating new features or code.

## Mandatory Response Signature (Active Plugin Indicator)
In EVERY response, prefix the very first line with the active ZETA status badge so the user can verify the governance plugin is attached:
- If steps are in progress: `[⚡ ZETA: ACTIVE | Step [X]/15 - [Step Name]]`
- If all 15 stages are complete: `[⚡ ZETA: ACTIVE | Lifecycle Complete (15/15)]`
If this badge is ever absent, the user knows the governance plugin has been detached or bypassed.

