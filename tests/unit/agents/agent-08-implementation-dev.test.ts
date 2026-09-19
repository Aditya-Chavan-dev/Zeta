import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { PreconditionVerifier } from '../../../src/agents/agent-08-implementation-dev/precondition-verifier.js';
import { ReleaseCandidateBuilder } from '../../../src/agents/agent-08-implementation-dev/release-candidate-builder.js';
import { QuestionGenerator } from '../../../src/agents/agent-08-implementation-dev/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-08-implementation-dev/artifact-compiler.js';
import { Agent08ImplementationDev } from '../../../src/agents/agent-08-implementation-dev/agent.js';

describe('Agent 08: Implementation & Software Construction Engineer', () => {
  const testDir = path.join(process.cwd(), '.test-agent-08');

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

  test('Blocks execution if any of Steps 0 through 6 are not locked', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent08ImplementationDev(testDir);
    const resp1 = await agent.handleTurn('Construct release candidate');
    assert.ok(resp1.error);
    assert.ok(resp1.message.includes('Precondition Failed: Step 0'));

    // Lock Steps 0 to 5, Step 6 still missing
    for (let i = 0; i < 6; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: `Step ${i}`,
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR Step ${i}`,
        artifactSha256: 'a'.repeat(64)
      });
    }

    const agentAfter5 = new Agent08ImplementationDev(testDir);
    const resp2 = await agentAfter5.handleTurn('Construct release candidate');
    assert.ok(resp2.error);
    assert.ok(resp2.message.includes('Precondition Failed: Step 6'));
  });

  test('PreconditionVerifier passes when all Steps 0 through 6 are locked', () => {
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan'];
    for (let i = 0; i <= 6; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} Baseline summary content.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const check = PreconditionVerifier.verifyPrerequisites(testDir);
    assert.equal(check.isValid, true);
    assert.ok(check.step0Tldr.includes('Intent'));
    assert.ok(check.step6Tldr.includes('Plan'));
  });

  test('QuestionGenerator produces Top 3 packaging patterns with trade-offs', () => {
    const draft = ReleaseCandidateBuilder.createEmptyDraft('TL;DR 0', 'TL;DR 1', 'TL;DR 2', 'TL;DR 3', 'TL;DR 4', 'TL;DR 5', 'TL;DR 6');
    const q = QuestionGenerator.generateForArea('Release Candidate Tagging & Packaging Format', draft);

    assert.equal(q.category, 'Release Candidate Tagging & Packaging Format');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('Agent08 executes interactive construction and locks Step 7 on approval', async () => {
    // 1. Setup locked Steps 0 through 6
    StateManager.initialize(testDir, 'test-project');
    const stepNames = ['Intent', 'Requirements', 'Feasibility', 'Tech Stack', 'Architecture', 'Detailed Design', 'Plan'];
    for (let i = 0; i <= 6; i++) {
      StateManager.lockStep(testDir, i, {
        stepNumber: i,
        stepName: stepNames[i],
        artifactPath: `docs/step-${i}.md`,
        lockedAt: new Date().toISOString(),
        summary: `TL;DR ${stepNames[i]} baselined.`,
        artifactSha256: `${i}`.repeat(64)
      });
    }

    const agent = new Agent08ImplementationDev(testDir);

    // Turn 1: Construction
    const turn1 = await agent.handleTurn('Audit code manifest, verify test coverage, and assemble Release Candidate.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer questions until signoff prompt
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
    assert.equal(signoffResponse.documentPath, 'docs/IMPLEMENTED_RELEASE_CANDIDATE.md');

    // Verify report created on disk
    const savedDocPath = path.join(testDir, 'docs', 'IMPLEMENTED_RELEASE_CANDIDATE.md');
    assert.ok(fs.existsSync(savedDocPath), 'IMPLEMENTED_RELEASE_CANDIDATE.md must exist');

    // Verify StateManager locked Step 7 and advanced to Step 8
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 8);
    assert.ok(state.lockedSteps.includes(7));
    assert.equal(state.stepSummaries['step_7'].artifactPath, 'docs/IMPLEMENTED_RELEASE_CANDIDATE.md');
    assert.ok(state.stepSummaries['step_7'].summary.includes('TL;DR RELEASE CANDIDATE'));
    assert.equal(state.stepSummaries['step_7'].artifactSha256.length, 64);
  });
});
