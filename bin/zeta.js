#!/usr/bin/env node

import readline from 'readline';
import path from 'path';
import { StateManager } from '../dist/core/state/state-manager.js';
import { ResumeSentinel } from '../dist/core/state/resume-sentinel.js';
import { InitHook } from '../dist/core/bootstrap/init-hook.js';
import { CrashLogger } from '../dist/core/logging/crash-logger.js';
import { Agent01Intent } from '../dist/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../dist/agents/agent-02-requirements/agent.js';
import { Agent03Feasibility } from '../dist/agents/agent-03-feasibility/agent.js';
import { Agent04TechStrategy } from '../dist/agents/agent-04-tech-strategy/agent.js';
import { Agent05SystemArchitecture } from '../dist/agents/agent-05-system-architecture/agent.js';
import { Agent06DetailedDesign } from '../dist/agents/agent-06-detailed-design/agent.js';
import { Agent07ImplementationPlanning } from '../dist/agents/agent-07-implementation-planning/agent.js';
import { Agent08ImplementationDev } from '../dist/agents/agent-08-implementation-dev/agent.js';
import { Agent09VerificationQa } from '../dist/agents/agent-09-verification-qa/agent.js';
import { Agent10ProductionReadiness } from '../dist/agents/agent-10-production-readiness/agent.js';
import { Agent11OperationsSre } from '../dist/agents/agent-11-operations-sre/agent.js';
import { Agent12SecurityCompliance } from '../dist/agents/agent-12-security-compliance/agent.js';
import { Agent13GovernanceLifecycle } from '../dist/agents/agent-13-governance-lifecycle/agent.js';
import { Agent14KnowledgeTransfer } from '../dist/agents/agent-14-knowledge-transfer/agent.js';
import { Agent15Retrospective } from '../dist/agents/agent-15-retrospective/agent.js';

const workspaceRoot = process.cwd();

// Agent Class Map
const AGENT_CONSTRUCTORS = [
  Agent01Intent,
  Agent02Requirements,
  Agent03Feasibility,
  Agent04TechStrategy,
  Agent05SystemArchitecture,
  Agent06DetailedDesign,
  Agent07ImplementationPlanning,
  Agent08ImplementationDev,
  Agent09VerificationQa,
  Agent10ProductionReadiness,
  Agent11OperationsSre,
  Agent12SecurityCompliance,
  Agent13GovernanceLifecycle,
  Agent14KnowledgeTransfer,
  Agent15Retrospective
];

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('setup') || args.includes('install') || args.includes('--setup')) {
    console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════');
    console.log('\x1b[1m%s\x1b[0m', '   Zeta (v1.1.0) — Turn ideas into working software, step by step');
    console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════\n');
    const { installGlobalRules } = await import('../scripts/install-rules.js');
    const targets = installGlobalRules();
    console.log('\x1b[32m%s\x1b[0m', '🟢 Zeta installed globally in your IDE environment!\n');
    console.log('Configured locations:');
    targets.forEach(t => console.log(`  ▫️ [${t.action}] ${t.file}`));
    console.log('\n\x1b[1mWhat this means:\x1b[0m');
    console.log('  • Type /zeta or "Start project" in chat to build a new project step by step.');
    console.log('  • For everyday coding and doubts, your IDE assistant behaves normally.\n');
    process.exit(0);
  }

  console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════');
  console.log('\x1b[1m%s\x1b[0m', '   Autonomous Engineering Governance Plugin (15-Stage Engine)');
  console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════════════\n');

  const initResult = InitHook.activate(workspaceRoot);
  console.log(initResult.greeting + '\n');
  let state = initResult.state;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

  while (state.activeStep < 15) {
    const currentStep = state.activeStep;
    const AgentClass = AGENT_CONSTRUCTORS[currentStep];
    if (!AgentClass) {
      console.log('\x1b[32m%s\x1b[0m', '🎉 All 15 lifecycle stages have been completed and locked!');
      break;
    }

    const agent = new AgentClass(workspaceRoot);
    console.log(`\n\x1b[33m>>> Step ${currentStep} Active: ${ResumeSentinel.getStepName(currentStep)} <<<\x1b[0m\n`);

    let isStepComplete = false;
    let turnCount = 0;

    while (!isStepComplete) {
      const userInput = await prompt(`\x1b[1m[User (Step ${currentStep})] > \x1b[0m`);
      if (!userInput.trim()) continue;

      if (userInput.trim().toLowerCase() === 'exit' || userInput.trim().toLowerCase() === 'quit') {
        console.log('Session saved. Exiting.');
        rl.close();
        process.exit(0);
      }

      const response = await agent.handleTurn(userInput);
      console.log(`\n${response.message}\n`);

      if (response.isLocked) {
        isStepComplete = true;
        state = StateManager.load(workspaceRoot);
      }
    }
  }

  rl.close();
}

main().catch(async err => {
  try {
    const { CrashLogger } = await import('../dist/core/logging/crash-logger.js');
    CrashLogger.log(workspaceRoot, err, { source: 'cli-main' });
  } catch {}
  console.error('\x1b[31m%s\x1b[0m', `Fatal Error: ${err.message}`);
  process.exit(1);
});
