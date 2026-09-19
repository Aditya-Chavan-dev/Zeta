import fs from 'fs';
import path from 'path';
import os from 'os';

const BLOCK_START = '<!-- ZETA_GOVERNANCE_START -->';
const BLOCK_END = '<!-- ZETA_GOVERNANCE_END -->';

const RULE_BODY = `# Autonomous Greenfield Engineering Governance Rule (Always Active)

## Workspace Auto-Detection Sentinel & Session Resume
At the start of EVERY conversation turn or session reopening in any project workspace:
1. **Check for State Store**: Look for \`.zeta/state.json\` in the workspace root.
2. **If State Store Exists and Active Step < 15**:
   - Greet the user with the resumption prompt:
     > *"Active Greenfield Project Detected: \`[Project ID]\`. Current Stage: **Step [X] — [Step Name]**.\\nWould you like to continue with ZETA Mode for this project? (Yes / No)"*
   - If there is an \`uncommittedBuffer.lastUserMessage\`, display it as pending context.

3. **If State Store Does NOT Exist (Greenfield Idea Intake Protocol)**:
   - Do NOT immediately dump rigid archetype choices or jump to conclusions.
   - Greet the user in 1–2 sentences and invite their idea:
     > *"Welcome to ZETA Greenfield Governance!*\\n*What idea or problem are you planning to build? (Feel free to share a raw brain-dump, rough thoughts, or problem statement).*\\n*Tip: If you don't have an idea yet, reply **'Suggest an idea'** and I will ask a few quick questions to brainstorm one with you."*
   - **Path A (User provides an idea / brain-dump)**:
     - Ingest the idea into \`.zeta/state.json\` with Step 0 active.
     - **STRICT BAN ON PREMATURE SOLUTIONING**: In Step 0, NEVER jump to technical solutions, architecture profiles, parsers, or frameworks (e.g., no "Tree-sitter vs LSP", no database choices). Those belong strictly in Step 3 (Tech Stack) and Step 4 (Architecture).
     - **No Rigid Multiple-Choice Forcing**: Allow the user to answer in their own words. Present Top 3 options ONLY if the user says "I don't know", asks for recommendations, or is ambiguous.
     - **Sequential 3-Round Idea Clarification Loop** (Evolve depth across 3 turns):
       - **Round 1 (Base-Level Requirements)**: Elicit core problem, target audience, primary pain point, and core deliverables.
       - **Round 2 (Behavioral & Interaction Clarity)**: Elicit detailed user workflows, input/output data shapes, interaction modes, and step-by-step user journeys.
       - **Round 3 (Deep Mechanical & Boundary Clarity)**: Elicit operational rules, failure boundaries, must-have constraints vs. strict non-goals.
     - **Sequential 3-Round Blind Spots & Edge Cases Hardening** (Uncover hidden traps across 3 turns):
       - Once the idea is clear, ZETA surfaces things newer developers overlook, forget, or don't know:
       - **Round 1 (Foundation Blind Spots)**: Local configs, environment prerequisites, state persistence models, filesystem/platform traps.
       - **Round 2 (Runtime & Failure Edge Cases)**: Invalid inputs, concurrency issues, network/disk timeouts, unhandled exception paths, rate limits.
       - **Round 3 (Resilience & Boundary Limits)**: File/payload caps, performance degradation under load, data isolation, clean exit/recovery behaviors.
     - **Drafting Lean Baseline v1.0 & Evo Handoff Boundary**:
       - Synthesize a rock-solid, unbreakable v1.0 specification in \`docs/PROJECT_INTENT.md\`.
       - Version 1.0 is not bloated or over-engineered, but achieves the primary goal with zero drift, zero hallucination, and zero technical debt.
       - ZETA builds the unbreakable foundation (frontend, backend, DB, architecture, tech stack). Once v1.0 is built and verified, ZETA prepares the handoff documentation package in \`docs/\` for **Evo (Evolution Engine)** to take over for future evolution.
     - **End-of-Step Coherence Scan**: Before sign-off, ZETA scans the entire conversation across all 6 rounds for contradictions, scope creep, or architectural misalignment. If clean, compile \`docs/PROJECT_INTENT.md\` and prompt for \`"Approve"\`.
   - **Path B (User requests suggestions / brainstorming)**:
     - If the user asks for suggestions or is unsure, ask targeted discovery questions:
       1. Preferred domain (e.g., developer tools, personal productivity, data utilities, creative tools).
       2. Preferred interface (CLI/terminal, web application, desktop GUI, headless library).
       3. Any specific technologies or constraints they wish to explore.
     - Present Top 3 concrete project concepts with trade-offs.
     - When the user chooses or refines an idea, launch Step 0 with that concept as the foundation.

4. **User Choice Protocol (For In-Progress Resumption)**:
   - **If user answers "Yes" (or "continue", "y", "proceed")**:
     - Continue with the active step's next question or draft signoff.
     - Enforce the 15-stage sequential gating (never allow out-of-order execution or edits).
   - **If user answers "No" (or "stop", "exit", "quit")**:
     - **DO NOT quit immediately.** Surface the mandatory safety prompt:
       > *"⚠️ **WARNING: Quitting ZETA Mode will disable the skill until you evoke it again.**\\n*This might cause vibe coded errors or Technical debt.*\\n\\n*Proceed at your own risk. Please confirm: Are you sure you want to quit ZETA Mode? (Confirm / Cancel)*"
     - If the user responds with **"Confirm"**:
       - Formally pause and quit ZETA Mode for the current session.
     - If the user responds with **"Cancel"**:
       - Resume the active step cleanly.

4. **Strict Invariants**:
   - Greenfield software only (no legacy cloud migration bloat).
   - Always require explicit \`"Approve"\` handshake to lock steps.
   - Always present Top 3 industry options for architectural choices.
   - Zero cloud egress (100% local persistence).

## Mandatory Response Signature (Active Plugin Indicator)
In EVERY response, prefix the very first line with the active ZETA status badge so the user can verify the governance plugin is attached:
- If steps are in progress: \`[⚡ ZETA: ACTIVE | Step [X]/15 - [Step Name]]\`
- If all 15 stages are complete: \`[⚡ ZETA: ACTIVE | Lifecycle Complete (15/15)]\`
If this badge is ever absent, the user knows the governance plugin has been detached or bypassed.`;

const FULL_BLOCK = `${BLOCK_START}\n${RULE_BODY}\n${BLOCK_END}`;

/**
 * Safely merges the ZETA rule block into an existing file without overwriting other content.
 */
function safeMerge(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, FULL_BLOCK + '\n', 'utf8');
    return 'created';
  }

  const existing = fs.readFileSync(filePath, 'utf8');
  if (existing.includes(BLOCK_START) && existing.includes(BLOCK_END)) {
    // Replace existing block
    const regex = new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`, 'm');
    const updated = existing.replace(regex, FULL_BLOCK);
    fs.writeFileSync(filePath, updated, 'utf8');
    return 'updated';
  }

  // File exists but does not have block: append safely with clean spacing
  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  fs.writeFileSync(filePath, existing + separator + FULL_BLOCK + '\n', 'utf8');
  return 'appended';
}

export function installGlobalRules() {
  const homeDir = os.homedir();
  const results = [];

  // 1. Google Antigravity / Gemini IDE Global Rules (dedicated isolated rule file)
  const geminiRulesDir = path.join(homeDir, '.gemini', 'config', 'rules');
  if (fs.existsSync(geminiRulesDir)) {
    const targetFile = path.join(geminiRulesDir, 'greenfield-governance.md');
    const action = safeMerge(targetFile);
    results.push({ file: targetFile, action });
  }

  // 2. Claude Code Global Config (non-destructive merge/append into CLAUDE.md)
  const claudeDir = path.join(homeDir, '.claude');
  if (!fs.existsSync(claudeDir)) {
    try { fs.mkdirSync(claudeDir, { recursive: true }); } catch {}
  }
  const claudeFile = path.join(claudeDir, 'CLAUDE.md');
  const claudeAction = safeMerge(claudeFile);
  results.push({ file: claudeFile, action: claudeAction });

  // 3. User Home Universal AGENTS.md (non-destructive merge/append)
  const homeAgents = path.join(homeDir, 'AGENTS.md');
  const agentsAction = safeMerge(homeAgents);
  results.push({ file: homeAgents, action: agentsAction });

  // 4. Antigravity IDE Global Skill (~/.gemini/config/skills/zeta/SKILL.md)
  const geminiSkillsDir = path.join(homeDir, '.gemini', 'config', 'skills', 'zeta');
  try {
    if (!fs.existsSync(geminiSkillsDir)) {
      fs.mkdirSync(geminiSkillsDir, { recursive: true });
    }
    const sourceSkill = path.join(process.cwd(), '.agents', 'skills', 'zeta', 'SKILL.md');
    if (fs.existsSync(sourceSkill)) {
      const destSkill = path.join(geminiSkillsDir, 'SKILL.md');
      fs.copyFileSync(sourceSkill, destSkill);
      results.push({ file: destSkill, action: 'installed' });
    }
  } catch (err) {
    console.error('Skill copy warning:', err.message);
  }

  return results;
}

const targets = installGlobalRules();
console.log('Safely configured global governance rules:');
targets.forEach(t => console.log(`  -> [${t.action}] ${t.file}`));
