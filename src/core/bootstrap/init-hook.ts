import * as fs from 'fs';
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
   * Checks if workspace is the ZETA engine codebase itself.
   */
  public static isEngineWorkspace(workspaceRoot: string): boolean {
    try {
      const pkgPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg?.name === 'zeta-architect';
      }
    } catch {}
    return false;
  }

  /**
   * Checks workspace for existing state. If none, initializes a fresh project.
   * If existing, runs ResumeSentinel to generate resume greeting.
   * Returns a structured result with the greeting and state.
   */
  public static activate(workspaceRoot: string, projectId?: string): InitHookResult {
    let state = StateManager.load(workspaceRoot);
    if (!state) {
      if (this.isEngineWorkspace(workspaceRoot) && projectId !== 'force') {
        return {
          isNewProject: false,
          state: null as any,
          greeting: '[SKIP] ZETA Engine development workspace detected. Skipping auto-initialization.'
        };
      }
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
