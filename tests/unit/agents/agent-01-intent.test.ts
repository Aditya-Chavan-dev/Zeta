import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../../src/core/state/state-manager.js';
import { IntentAnalyzer } from '../../../src/agents/agent-01-intent/intent-analyzer.js';
import { QuestionGenerator } from '../../../src/agents/agent-01-intent/question-generator.js';
import { ArtifactCompiler } from '../../../src/agents/agent-01-intent/artifact-compiler.js';
import { Agent01Intent } from '../../../src/agents/agent-01-intent/agent.js';

describe('Agent 01: Problem Definition & Project Intent Architect', () => {
  const testDir = path.join(process.cwd(), '.test-agent-01');

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

  test('IntentAnalyzer extracts structured signals from raw brain-dump', () => {
    const rawDump = 'I want to build an autonomous IDE governance plugin for developers struggling with unguided AI coding.';
    const result = IntentAnalyzer.analyze(rawDump);

    assert.ok(result.draft.problemSpace.problemIdentification);
    assert.ok(result.draft.businessIntent.projectVision);
    assert.ok(result.completenessPercentage > 0);
  });

  test('QuestionGenerator produces Top 3 industry options with trade-offs', () => {
    const draft = IntentAnalyzer.createEmptyDraft();
    const q = QuestionGenerator.generateForDomain('Problem Space', draft);

    assert.equal(q.domain, 'Problem Space');
    assert.equal(q.top3Options.length, 3);
    assert.ok(q.top3Options[0].recommended);
    assert.ok(q.top3Options[0].tradeOffs.length > 0);
  });

  test('ArtifactCompiler generates full 12-domain document and compact TL;DR', () => {
    const draft = IntentAnalyzer.createEmptyDraft();
    draft.problemSpace.problemStatement = 'Developers incur debt without governance.';
    draft.businessIntent.valueProposition = 'Autonomous engineering discipline.';

    const compiled = ArtifactCompiler.compile(draft);

    assert.ok(compiled.fullDocument.includes('# PROJECT INTENT & PROBLEM DEFINITION'));
    assert.ok(compiled.fullDocument.includes('## 1. Executive Summary & Core Invariant'));
    assert.ok(compiled.fullDocument.includes('## 12. Decision Foundation & Sign-off Verdict'));
    assert.ok(compiled.tldrSummary.includes('TL;DR PROJECT INTENT'));
  });

  test('Agent01Intent executes full interactive lifecycle and locks Step 0 on approval', async () => {
    StateManager.initialize(testDir, 'test-project');

    const agent = new Agent01Intent(testDir);

    // Turn 1: Raw brain dump
    const turn1 = await agent.handleTurn('I want to build a local code guardrail for engineers.');
    assert.equal(turn1.isLocked, false);
    assert.ok(turn1.question);

    // Answer questions until sign-off prompt is reached
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
    assert.equal(signoffResponse.documentPath, 'docs/PROJECT_INTENT.md');

    // Verify file exists on disk
    const savedDocPath = path.join(testDir, 'docs', 'PROJECT_INTENT.md');
    assert.ok(fs.existsSync(savedDocPath), 'PROJECT_INTENT.md must exist on disk');

    // Verify StateManager locked Step 0 and advanced to Step 1
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 1);
    assert.ok(state.lockedSteps.includes(0));
    assert.equal(state.stepSummaries['step_0'].artifactPath, 'docs/PROJECT_INTENT.md');
    assert.ok(state.stepSummaries['step_0'].summary.includes('TL;DR'));
    assert.ok(state.stepSummaries['step_0'].artifactSha256.length === 64);
  });
});
