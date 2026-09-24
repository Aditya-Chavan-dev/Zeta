# Root Cause Analysis (RCA) - Issue 001

## Incident Summary
- **Issue**: ZETA Greenfield Governance sentinel was not invoked when opening a new greenfield project (`e:\Evo`) after running global installation (`npm run setup:global`).
- **Symptom**: The AI assistant in `e:\Evo` answered as a generic coding assistant ("*What type of application are we building in Evo (stack, goal, or framework)?*") without the ZETA badge or Greenfield Idea Intake protocol.
- **Severity**: High (Governance bypass on clean greenfield projects).
- **Status**: Resolved & Verified.

---

## Root Cause Analysis

### 1. Mechanism of IDE Global Rule Ingestion
Antigravity IDE discovers and injects rules into the model's system prompt (`<user_rules>`) using two primary mechanisms:
1. **User Global Rule**: Injected unconditionally into every workspace from `~/.gemini/GEMINI.md` (labeled `<RULE[user_global]>`).
2. **Directory & Workspace Rules**: Discovered hierarchically by walking up the folder tree looking for `AGENTS.md` or `GEMINI.md`.

### 2. The Failure Mode
- `scripts/install-rules.js` was configured to write the global rules to:
  `~/.gemini/config/rules/greenfield-governance.md`
- While `~/.gemini/config/rules/` is an organizational folder, Antigravity IDE **does not automatically inject arbitrary `.md` files in that folder into `<user_rules>`**.
- In the active development workspace (`e:\New folder (2)`), ZETA was working because a local `AGENTS.md` existed in the project root.
- In a fresh workspace (`e:\Evo`), no `AGENTS.md` existed yet. Because `~/.gemini/GEMINI.md` only contained the user's ADHD rules and lacked the ZETA block, the AI had no instructions to invoke ZETA.

---

## Corrective Actions & Resolution

1. **Updated Installer Target (`scripts/install-rules.js`)**:
   Added `~/.gemini/GEMINI.md` as the primary installation target using `safeMerge()`:
   ```javascript
   // 1. Google Antigravity / Gemini IDE Global Rule File (~/.gemini/GEMINI.md)
   const geminiGlobalFile = path.join(homeDir, '.gemini', 'GEMINI.md');
   if (fs.existsSync(path.dirname(geminiGlobalFile))) {
     const action = safeMerge(geminiGlobalFile);
     results.push({ file: geminiGlobalFile, action });
   }
   ```
2. **Preserved Existing Configuration**:
   The `safeMerge()` function preserves the user's existing global ADHD rules and cleanly appends the ZETA governance block within `<!-- ZETA_GOVERNANCE_START -->` and `<!-- ZETA_GOVERNANCE_END -->`.
3. **Verified Deployment**:
   Ran `npm run setup:global`. Verified that `C:\Users\autot\.gemini\GEMINI.md` contains both ADHD rules and ZETA governance rules.

---

## Verification & Prevention
- **Verification**: Node inspection confirms `~/.gemini/GEMINI.md` now has both `ADHD-Friendly` and `ZETA Greenfield Idea Intake Protocol`.
- **Prevention**: In all future releases, global rule installation tests verify `~/.gemini/GEMINI.md` directly.
