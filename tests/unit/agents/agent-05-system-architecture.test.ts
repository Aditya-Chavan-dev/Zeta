import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-05-system-architecture/precondition-verifier.js';
import { ArchitectureDesigner } from '../../../src/agents/agent-05-system-architecture/architecture-designer.js';
import { QuestionGenerator } from '../../../src/agents/agent-05-system-architecture/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-05-system-architecture/artifact-compiler.js';
import { Agent05SystemArchitecture } from '../../../src/agents/agent-05-system-architecture/agent.js';

describe('Agent 05: System Architecture & Solution Design Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-05');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('Blocks execution if any of Steps 0, 1, 2, or 3 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent05SystemArchitecture(testDir);
    const resp1 = await agent.handleTurn('Design system architecture');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Step 0, Step 1 still missing
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Step 0',
      artifactSha256: 'a'.repeat(64)
    });

    const agentAfter0 = new Agent05SystemArchitecture(testDir);
    const resp2 = await agentAfter0.handleTurn('Design system architecture');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 1'));
  });

  test('PreconditionVerifier passes when all Steps 0, 1, 2, and 3 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Intent: Greenfield IDE governance.',
      artifactSha256: 'a'.repeat(64)
    });
    StateManager.lockStep(testDir, 1, {
      stepNumber: 1,
      stepName: 'Requirements',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Requirements: Fast turns, local persistence.',
      artifactSha256: 'b'.repeat(64)
    });
    StateManager.lockStep(testDir, 2, {
      stepNumber: 2,
      stepName: 'Feasibility & Risk',
      artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Feasibility: Pure local-first node runtime.',
      artifactSha256: 'c'.repeat(64)
    });
    StateManager.lockStep(testDir, 3, {
      stepNumber: 3,
      stepName: 'Technology Strategy',
      artifactPath: 'docs/TECH_STACK_AND_STRATEGY.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Tech Stack: Node.js LTS, TypeScript strict, atomic JSON.',
      artifactSha256: 'd'.repeat(64)
    });

    const check = PreconditionVerifier.verifyPrerequisites(testDir);
    assert.equal(check.isValid, true);
    assert.ok(check.step0Tldr.includes('Greenfield IDE governance'));
    assert.ok(check.step1Tldr.includes('Fast turns'));
    assert.ok(check.step2Tldr.includes('Pure local-first'));
    assert.ok(check.step3Tldr.includes('Node.js LTS'));
  });

  test('QuestionGenerator produces Top 3 architectural patterns with trade-offs', () => {
    const draft = ArchitectureDesigner.createEmptyDraft('TL;DR 0', 'TL;DR 1', 'TL;DR 2', 'TL;DR 3');
    const q = QuestionGenerator.generateForArea('Inter-Agent Communication & Coupling', draft);

    assert.equal(q.category, 'Inter-Agent Communication & Coupling');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent05 executes interactive architecture design and locks Step 4 on approval', async () => {
    // 1. Setup locked Steps 0, 1, 2, and 3
    StateManager.initialize(testDir, 'test-project');
    StateManager.lockStep(testDir, 0, {
      stepNumber: 0,
      stepName: 'Problem Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Intent: Greenfield IDE governance.',
      artifactSha256: 'a'.repeat(64)
    });
    StateManager.lockStep(testDir, 1, {
      stepNumber: 1,
      stepName: 'Requirements',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Requirements: Fast turns, local persistence.',
      artifactSha256: 'b'.repeat(64)
    });
    StateManager.lockStep(testDir, 2, {
      stepNumber: 2,
      stepName: 'Feasibility & Risk',
      artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Feasibility: Pure local-first node runtime.',
      artifactSha256: 'c'.repeat(64)
    });
    StateManager.lockStep(testDir, 3, {
      stepNumber: 3,
      stepName: 'Technology Strategy',
      artifactPath: 'docs/TECH_STACK_AND_STRATEGY.md',
      lockedAt: new Date().toISOString(),
      summary: 'TL;DR Tech Stack: Node.js LTS, TypeScript strict.',
      artifactSha256: 'd'.repeat(64)
    });

    const agent = new Agent05SystemArchitecture(testDir);

    // Turn 1: Design architecture
    const turn1 = await agent.handleTurn('Decompose system into modular components and ADRs.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer architecture questions until signoff prompt
    let currentResponse = turn1;
    let iterations = 0;
    while (!currentResponse.isReadyForSignoff && iterations < 10) {
      currentResponse = await agent.handleTurn('1'); // Pick option 1
      iterations++;
    }

    assert.equal(currentResponse.isReadyForSignoff, true);
    assert.ok(currentResponse.message.includes('Approve'));

    // Turn: User gives approval handshake
    const signoffResponse = await agent.handleTurn('Approve');
    assert.equal(signoffResponse.isLocked, true);
    assert.equal(signoffResponse.documentPath, 'docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'SYSTEM_ARCHITECTURE_BLUEPRINT.md');
    assert.ok(fs.existsSync(savedDocPath), 'SYSTEM_ARCHITECTURE_BLUEPRINT.md must exist');

    // Verify StateManager locked Step 4 and advanced to Step 5
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 5);
    assert.ok(state.lockedSteps.includes(4));
    assert.equal(state.stepSummaries['step_4'].artifactPath, 'docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md');
    assert.ok(state.stepSummaries['step_4'].summary.includes('TL;DR SYSTEM ARCHITECTURE'));
    assert.equal(state.stepSummaries['step_4'].artifactSha256.length, 64);
  });
});
