import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CANONICAL_LIFECYCLE, LifecycleRegistry } from '../../../src/core/lifecycle/lifecycle-map.js';
import { ExitCode } from '../../../src/core/state/schema.js';

describe('Milestone 1: Schemas & Lifecycle Map', () => {
  test('Canonical lifecycle map contains exactly 15 stages (0-14)', () => {
    assert.strictEqual(CANONICAL_LIFECYCLE.length, 15);
    for (let i = 0; i <= 14; i++) {
      const stage = LifecycleRegistry.getStage(i);
      assert.strictEqual(stage.stage, i);
      assert.ok(stage.agentId.startsWith('agent-'));
      assert.ok(stage.documentPath.startsWith('docs/'));
    }
  });

  test('Exit codes conform to authoritative specification', () => {
    assert.strictEqual(ExitCode.SUCCESS, 0);
    assert.strictEqual(ExitCode.BLOCKED_APPROVAL, 1);
    assert.strictEqual(ExitCode.INVALID_INPUT, 2);
    assert.strictEqual(ExitCode.LOCK_OR_CORRUPTION, 3);
    assert.strictEqual(ExitCode.FATAL_ERROR, 4);
  });
});

