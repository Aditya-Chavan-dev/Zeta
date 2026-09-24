import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InitHook } from '../../src/core/bootstrap/init-hook.js';
import { StateManager } from '../../src/core/state/state-manager.js';
import { DriftInterceptor } from '../../src/core/drift/interceptor.js';
import { ImpactCascadeAnalyzer } from '../../src/core/drift/impact-cascade.js';
import { BaselineUpdater } from '../../src/core/drift/baseline-updater.js';
import { CANONICAL_LIFECYCLE } from '../../src/core/lifecycle/lifecycle-map.js';
import { Agent01Intent } from '../../src/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../../src/agents/agent-02-requirements/agent.js';
import { Agent03Feasibility } from '../../src/agents/agent-03-feasibility/agent.js';
import { Agent04TechStrategy } from '../../src/agents/agent-04-tech-strategy/agent.js';
import { Agent05SystemArchitecture } from '../../src/agents/agent-05-system-architecture/agent.js';

describe('Swarm E2E: Full Lifecycle Simulation with Drift and Crash Recovery', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-swarm-e2e-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('5-Act Lifecycle Simulation: Bootstrap -> Pipeline Execution -> Scope Drift Detection -> Crash & Resume', async () => {
    // ═══════════════════════════════════════════════════════════════
    // Act 1 — Greenfield Bootstrap
    // ═══════════════════════════════════════════════════════════════
    const initResult = InitHook.activate(testDir, 'swarm-e2e-project');
    assert.equal(initResult.isNewProject, true, 'Act 1: Must be detected as a new project');
    assert.equal(initResult.state.activeStep, 0, 'Act 1: Active step must be 0');
    assert.equal(initResult.state.stepStatus, 'IN_PROGRESS', 'Act 1: Status must be IN_PROGRESS');
    assert.ok(fs.existsSync(path.join(testDir, '.zeta', 'state.json')), 'Act 1: State file must exist');

    // ═══════════════════════════════════════════════════════════════
    // Act 2 — Agent 01 Full Flow (Step 0)
    // ═══════════════════════════════════════════════════════════════
    const agent1 = new Agent01Intent(testDir);
    let a1Res = await agent1.handleTurn(
      'We are building an autonomous engineering governance engine for IDEs with local SQLite state and strict zero-cloud egress.'
    );
    assert.equal(a1Res.isLocked, false);

    let a1Turns = 0;
    while (!a1Res.isReadyForSignoff && a1Turns < 10) {
      a1Res = await agent1.handleTurn('Option 1: Proceed with standard builder baseline');
      a1Turns++;
    }
    assert.equal(a1Res.isReadyForSignoff, true, 'Act 2: Agent 01 must become ready for signoff');

    const a1Signoff = await agent1.handleTurn('Approve');
    assert.equal(a1Signoff.isLocked, true, 'Act 2: Step 0 must be LOCKED after Approve');

    const intentDocPath = path.join(testDir, 'docs', 'PROJECT_INTENT.md');
    assert.ok(fs.existsSync(intentDocPath), 'Act 2: docs/PROJECT_INTENT.md must exist');

    const stateAfterStep0 = StateManager.load(testDir);
    assert.ok(stateAfterStep0?.lockedSteps.includes(0), 'Act 2: Step 0 must be in lockedSteps');
    assert.equal(stateAfterStep0?.activeStep, 1, 'Act 2: Active step must advance to 1');

    // ═══════════════════════════════════════════════════════════════
    // Act 3 — Sequential Pipeline Execution (Steps 1–4)
    // ═══════════════════════════════════════════════════════════════
    // Step 1: Requirements
    const agent2 = new Agent02Requirements(testDir);
    let a2Res = await agent2.handleTurn('Functional requirements for 15-stage sequential lifecycle');
    let a2Turns = 0;
    while (!a2Res.isReadyForSignoff && a2Turns < 10) {
      a2Res = await agent2.handleTurn('Option 1');
      a2Turns++;
    }
    assert.equal(a2Res.isReadyForSignoff, true);
    const a2Signoff = await agent2.handleTurn('Approve');
    assert.equal(a2Signoff.isLocked, true, 'Act 3: Step 1 must be LOCKED');

    // Step 2: Feasibility & Risk
    const agent3 = new Agent03Feasibility(testDir);
    let a3Res = await agent3.handleTurn('Feasibility analysis for local SQLite concurrency');
    let a3Turns = 0;
    while (!a3Res.isReadyForSignoff && a3Turns < 10) {
      a3Res = await agent3.handleTurn('Option 1');
      a3Turns++;
    }
    assert.equal(a3Res.isReadyForSignoff, true);
    const a3Signoff = await agent3.handleTurn('Approve');
    assert.equal(a3Signoff.isLocked, true, 'Act 3: Step 2 must be LOCKED');

    // Step 3: Technology Strategy
    const agent4 = new Agent04TechStrategy(testDir);
    let a4Res = await agent4.handleTurn('Tech stack selection: Node LTS, TypeScript, better-sqlite3');
    let a4Turns = 0;
    while (!a4Res.isReadyForSignoff && a4Turns < 10) {
      a4Res = await agent4.handleTurn('Option 1');
      a4Turns++;
    }
    assert.equal(a4Res.isReadyForSignoff, true);
    const a4Signoff = await agent4.handleTurn('Approve');
    assert.equal(a4Signoff.isLocked, true, 'Act 3: Step 3 must be LOCKED');

    // Step 4: System Architecture
    const agent5 = new Agent05SystemArchitecture(testDir);
    let a5Res = await agent5.handleTurn('Architecture design with modular local-first layers');
    let a5Turns = 0;
    while (!a5Res.isReadyForSignoff && a5Turns < 10) {
      a5Res = await agent5.handleTurn('Option 1');
      a5Turns++;
    }
    assert.equal(a5Res.isReadyForSignoff, true);
    const a5Signoff = await agent5.handleTurn('Approve');
    assert.equal(a5Signoff.isLocked, true, 'Act 3: Step 4 must be LOCKED');

    const stateAfterStep4 = StateManager.load(testDir);
    assert.equal(stateAfterStep4?.activeStep, 5, 'Act 3: Active step must advance to 5');
    assert.deepEqual(stateAfterStep4?.lockedSteps, [0, 1, 2, 3, 4]);

    // ═══════════════════════════════════════════════════════════════
    // Act 4 — Mid-Project Drift Detection & Cascade Analysis
    // ═══════════════════════════════════════════════════════════════
    // User introduces out-of-scope technology (e.g. Kubernetes, Redis, Cloud telemetry)
    const driftInterception = DriftInterceptor.evaluateWorkspace(
      testDir,
      'Let us deploy to Kubernetes cluster with Redis cloud telemetry'
    );
    assert.equal(driftInterception.shouldIntercept, true, 'Act 4: Must detect scope/tech drift');
    assert.ok(driftInterception.conversationalPrompt.includes('Drift Detected'), 'Act 4: Must generate drift prompt');

    // Perform cascade analysis across locked stages
    const cascadeReport = ImpactCascadeAnalyzer.analyze(
      driftInterception.driftSignal,
      stateAfterStep4!.stepSummaries,
      CANONICAL_LIFECYCLE
    );
    assert.ok(cascadeReport.totalAffected > 0, 'Act 4: Cascade report must detect affected steps');
    assert.equal(cascadeReport.requiresAmendment, true, 'Act 4: Must require amendment');

    // Baseline updater produces update plan
    const updatePlan = BaselineUpdater.planUpdate(cascadeReport);
    assert.ok(updatePlan.rollbackTarget >= 0, 'Act 4: Rollback target must be identified');
    assert.ok(updatePlan.stepsToAmend.length > 0, 'Act 4: Steps to amend must be listed');

    // ═══════════════════════════════════════════════════════════════
    // Act 5 — Crash Simulation & Resume Sentinel
    // ═══════════════════════════════════════════════════════════════
    // Simulate crash mid-turn at Step 5 by injecting an uncommitted buffer
    const stateBeforeCrash = StateManager.load(testDir)!;
    stateBeforeCrash.uncommittedBuffer = {
      lastUserMessage: 'I want to configure the detailed error code handlers',
      activeDraft: { partialField: 'in-flight-work' }
    };
    StateManager.save(testDir, stateBeforeCrash);

    // Call InitHook to simulate next CLI / IDE launch after crash
    const resumedResult = InitHook.activate(testDir);
    assert.equal(resumedResult.isNewProject, false, 'Act 5: Must recognize existing project on restart');
    assert.equal(resumedResult.state.activeStep, 5, 'Act 5: Must restore interrupted step 5');
    assert.ok(
      resumedResult.greeting.includes('Step 5') || resumedResult.greeting.includes('Welcome back'),
      'Act 5: Resume greeting must reference interrupted step'
    );
  });
});
