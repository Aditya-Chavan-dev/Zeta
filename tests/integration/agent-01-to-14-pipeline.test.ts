import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../src/core/state/state-manager.js';
import { Agent01Intent } from '../../src/agents/agent-01-intent/agent.js';
import { Agent02Requirements } from '../../src/agents/agent-02-requirements/agent.js';
import { Agent03Feasibility } from '../../src/agents/agent-03-feasibility/agent.js';
import { Agent04TechStrategy } from '../../src/agents/agent-04-tech-strategy/agent.js';
import { Agent05SystemArchitecture } from '../../src/agents/agent-05-system-architecture/agent.js';
import { Agent06DetailedDesign } from '../../src/agents/agent-06-detailed-design/agent.js';
import { Agent07ImplementationPlanning } from '../../src/agents/agent-07-implementation-planning/agent.js';
import { Agent08ImplementationDev } from '../../src/agents/agent-08-implementation-dev/agent.js';
import { Agent09VerificationQa } from '../../src/agents/agent-09-verification-qa/agent.js';
import { Agent10ProductionReadiness } from '../../src/agents/agent-10-production-readiness/agent.js';
import { Agent11OperationsSre } from '../../src/agents/agent-11-operations-sre/agent.js';
import { Agent12SecurityCompliance } from '../../src/agents/agent-12-security-compliance/agent.js';
import { Agent13GovernanceLifecycle } from '../../src/agents/agent-13-governance-lifecycle/agent.js';
import { Agent14KnowledgeTransfer } from '../../src/agents/agent-14-knowledge-transfer/agent.js';

describe('End-to-End 14-Stage Lifecycle: Agent 01 -> ... -> Agent 14', () => {
  const testDir = path.join(process.cwd(), '.test-e2e-14stages');

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

  test('Executes full 14-agent chain with strict gating and zero state loss', async () => {
    StateManager.initialize(testDir, 'e2e-14stages');

    // === STAGE 0: Agent 01 ===
    const agent1 = new Agent01Intent(testDir);
    let a1Resp = await agent1.handleTurn('I want to build an autonomous engineering governance plugin.');
    while (!a1Resp.isReadyForSignoff) a1Resp = await agent1.handleTurn('1');
    const a1Lock = await agent1.handleTurn('Approve');
    assert.equal(a1Lock.isLocked, true);

    // === STAGE 1: Agent 02 ===
    const agent2 = new Agent02Requirements(testDir);
    let a2Resp = await agent2.handleTurn('Feature: Per-turn atomic persistence and drift detection.');
    while (!a2Resp.isReadyForSignoff) a2Resp = await agent2.handleTurn('1');
    const a2Lock = await agent2.handleTurn('Approve');
    assert.equal(a2Lock.isLocked, true);

    // === STAGE 2: Agent 03 ===
    const agent3 = new Agent03Feasibility(testDir);
    let a3Resp = await agent3.handleTurn('Evaluate feasibility under local disk constraints.');
    while (!a3Resp.isReadyForSignoff) a3Resp = await agent3.handleTurn('1');
    const a3Lock = await agent3.handleTurn('Approve');
    assert.equal(a3Lock.isLocked, true);

    // === STAGE 3: Agent 04 ===
    const agent4 = new Agent04TechStrategy(testDir);
    let a4Resp = await agent4.handleTurn('Select tech stack and runtime frameworks.');
    while (!a4Resp.isReadyForSignoff) a4Resp = await agent4.handleTurn('1');
    const a4Lock = await agent4.handleTurn('Approve');
    assert.equal(a4Lock.isLocked, true);

    // === STAGE 4: Agent 05 ===
    const agent5 = new Agent05SystemArchitecture(testDir);
    let a5Resp = await agent5.handleTurn('Design system architecture and C4 components.');
    while (!a5Resp.isReadyForSignoff) a5Resp = await agent5.handleTurn('1');
    const a5Lock = await agent5.handleTurn('Approve');
    assert.equal(a5Lock.isLocked, true);

    // === STAGE 5: Agent 06 ===
    const agent6 = new Agent06DetailedDesign(testDir);
    let a6Resp = await agent6.handleTurn('Specify module public methods, state transitions, and error codes.');
    while (!a6Resp.isReadyForSignoff) a6Resp = await agent6.handleTurn('1');
    const a6Lock = await agent6.handleTurn('Approve');
    assert.equal(a6Lock.isLocked, true);

    // === STAGE 6: Agent 07 ===
    const agent7 = new Agent07ImplementationPlanning(testDir);
    let a7Resp = await agent7.handleTurn('Break down implementation into sequenced WBS tasks and quality gates.');
    while (!a7Resp.isReadyForSignoff) a7Resp = await agent7.handleTurn('1');
    const a7Lock = await agent7.handleTurn('Approve');
    assert.equal(a7Lock.isLocked, true);

    // === STAGE 7: Agent 08 ===
    const agent8 = new Agent08ImplementationDev(testDir);
    let a8Resp = await agent8.handleTurn('Assemble and verify working Release Candidate.');
    while (!a8Resp.isReadyForSignoff) a8Resp = await agent8.handleTurn('1');
    const a8Lock = await agent8.handleTurn('Approve');
    assert.equal(a8Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'IMPLEMENTED_RELEASE_CANDIDATE.md')));

    // === STAGE 8: Agent 09 ===
    const agent9 = new Agent09VerificationQa(testDir);
    let a9Resp = await agent9.handleTurn('Execute exhaustive quality audit, stress testing, and verification matrix.');
    while (!a9Resp.isReadyForSignoff) a9Resp = await agent9.handleTurn('1');
    const a9Lock = await agent9.handleTurn('Approve');
    assert.equal(a9Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'VERIFICATION_AND_QA_PACKAGE.md')));

    // === STAGE 9: Agent 10 ===
    const agent10 = new Agent10ProductionReadiness(testDir);
    let a10Resp = await agent10.handleTurn('Audit production release gates, rollback mechanics, and launch readiness.');
    while (!a10Resp.isReadyForSignoff) a10Resp = await agent10.handleTurn('1');
    const a10Lock = await agent10.handleTurn('Approve');
    assert.equal(a10Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'PRODUCTION_READINESS_AND_DEPLOYMENT.md')));

    // === STAGE 10: Agent 11 ===
    const agent11 = new Agent11OperationsSre(testDir);
    let a11Resp = await agent11.handleTurn('Audit SRE runbooks, SLO metrics, disaster recovery, and maintenance.');
    while (!a11Resp.isReadyForSignoff) a11Resp = await agent11.handleTurn('1');
    const a11Lock = await agent11.handleTurn('Approve');
    assert.equal(a11Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'OPERATIONS_MAINTENANCE_AND_SRE.md')));

    // === STAGE 11: Agent 12 ===
    const agent12 = new Agent12SecurityCompliance(testDir);
    let a12Resp = await agent12.handleTurn('Audit STRIDE threat modeling, zero-cloud data privacy, and SBOM licensing.');
    while (!a12Resp.isReadyForSignoff) a12Resp = await agent12.handleTurn('1');
    const a12Lock = await agent12.handleTurn('Approve');
    assert.equal(a12Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'SECURITY_PRIVACY_AND_COMPLIANCE.md')));

    // === STAGE 12: Agent 13 ===
    const agent13 = new Agent13GovernanceLifecycle(testDir);
    let a13Resp = await agent13.handleTurn('Audit SemVer rules, deprecation lifecycles, schema migrations, and drift guardrails.');
    while (!a13Resp.isReadyForSignoff) a13Resp = await agent13.handleTurn('1');
    const a13Lock = await agent13.handleTurn('Approve');
    assert.equal(a13Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md')));

    // === STAGE 13: Agent 14 ===
    const agent14 = new Agent14KnowledgeTransfer(testDir);
    let a14Resp = await agent14.handleTurn('Audit developer onboarding, ADR catalog, quickstarts, and troubleshooting.');
    while (!a14Resp.isReadyForSignoff) a14Resp = await agent14.handleTurn('1');
    const a14Lock = await agent14.handleTurn('Approve');
    assert.equal(a14Lock.isLocked, true);
    assert.ok(fs.existsSync(path.join(testDir, 'docs', 'KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md')));

    // === Final State Verification ===
    const state = StateManager.load(testDir);
    assert.ok(state);
    assert.equal(state.activeStep, 14);
    assert.deepEqual(state.lockedSteps, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    for (let i = 0; i <= 13; i++) {
      assert.ok(state.stepSummaries[`step_${i}`]);
    }
  });
});
