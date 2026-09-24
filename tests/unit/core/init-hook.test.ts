import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InitHook } from '../../../src/core/bootstrap/init-hook.js';
import { StateManager } from '../../../src/core/state/state-manager.js';

describe('InitHook', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-init-hook-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should initialize a fresh project when no state exists', () => {
    const result = InitHook.activate(tempDir, 'custom-test-proj');

    assert.equal(result.isNewProject, true);
    assert.equal(result.state.projectId, 'custom-test-proj');
    assert.equal(result.state.activeStep, 0);
    assert.equal(result.state.stepStatus, 'IN_PROGRESS');
    assert.ok(result.greeting.includes('[INIT] Initialized new session'));
    assert.ok(fs.existsSync(path.join(tempDir, '.zeta', 'state.json')));
  });

  it('should resume an existing project when state file exists', () => {
    // First activation: creates project
    InitHook.activate(tempDir, 'proj-resume-test');

    // Second activation: resumes existing project
    const resumeResult = InitHook.activate(tempDir);

    assert.equal(resumeResult.isNewProject, false);
    assert.equal(resumeResult.state.projectId, 'proj-resume-test');
    assert.equal(resumeResult.state.activeStep, 0);
    assert.ok(resumeResult.greeting.length > 0);
  });

  it('should reflect active step in resume greeting when step is advanced', () => {
    const initResult = InitHook.activate(tempDir, 'advanced-proj');
    assert.equal(initResult.isNewProject, true);

    // Simulate state update
    const state = initResult.state;
    state.activeStep = 3;
    state.stepStatus = 'IN_PROGRESS';
    state.lockedSteps = [0, 1, 2];
    state.stepSummaries = {
      step_0: { stepNumber: 0, stepName: 'Problem Definition', artifactPath: 'docs/PROJECT_INTENT.md', lockedAt: new Date().toISOString(), summary: 'Intent locked' },
      step_1: { stepNumber: 1, stepName: 'Requirements', artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md', lockedAt: new Date().toISOString(), summary: 'Reqs locked' },
      step_2: { stepNumber: 2, stepName: 'Feasibility', artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md', lockedAt: new Date().toISOString(), summary: 'Feasibility locked' }
    };
    StateManager.save(tempDir, state);

    const resumeResult = InitHook.activate(tempDir);
    assert.equal(resumeResult.isNewProject, false);
    assert.equal(resumeResult.state.activeStep, 3);
    assert.ok(resumeResult.greeting.includes('Step 3'));
  });
});
