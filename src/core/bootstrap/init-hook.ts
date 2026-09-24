import * as path from 'path';
import { StateManager } from '../state/state-manager.js';
import { SessionState } from '../state/types.js';
import { ResumeSentinel } from '../state/resume-sentinel.js';

export interface InitHookResult {
  isNewProject: boolean;
  state: SessionState;
  greeting: string;
}

export class InitHook {
  /**
   * Checks workspace for existing state. If none, initializes a fresh project.
   * If existing, runs ResumeSentinel to generate resume greeting.
   * Returns a structured result with the greeting and state.
   */
  public static activate(workspaceRoot: string, projectId?: string): InitHookResult {
    let state = StateManager.load(workspaceRoot);
    if (!state) {
      state = StateManager.initialize(workspaceRoot, projectId);
      const greeting = `[INIT] Initialized new session in ${path.join(workspaceRoot, '.zeta', 'state.json')}`;
      return {
        isNewProject: true,
        state,
        greeting
      };
    } else {
      const assessment = ResumeSentinel.assess(state, workspaceRoot);
      return {
        isNewProject: false,
        state,
        greeting: assessment.resumptionGreeting
      };
    }
  }
}
