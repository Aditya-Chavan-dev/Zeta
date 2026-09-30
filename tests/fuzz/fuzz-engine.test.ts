import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { IntentComparator } from '../../src/core/drift/intent-comparator.js';
import { ResponseSentinel } from '../../src/core/governance/response-sentinel.js';
import { HeadroomCompressor } from '../../src/core/headroom/headroom-compressor.js';
import { StateManager } from '../../src/core/state/state-manager.js';

describe('Fast-Check Fuzzing Suite: Resilience Under Adversarial Inputs', () => {

  describe('2. IntentComparator Fuzzing & ReDoS Defense', () => {
    it('evaluates arbitrary adversarial user input without regex hanging or crashing', () => {
      const mockOut = ['legacy codebase reverse-engineering', 'cloud daemon'];
      const mockNonGoals = ['unbounded telemetry'];

      fc.assert(
        fc.property(
          fc.string({ maxLength: 2000 }),
          fc.string({ maxLength: 1000 }),
          (userInput, step0) => {
            const start = Date.now();
            const signal = IntentComparator.compare(userInput, step0, '', mockOut, mockNonGoals);
            const duration = Date.now() - start;

            // ReDoS guardrail: Execution must not freeze event loop
            assert.ok(duration < 200, `Execution took too long: ${duration}ms`);
            assert.strictEqual(typeof signal.isDrift, 'boolean');
            assert.ok(signal.confidence >= 0 && signal.confidence <= 1);
            assert.ok(Array.isArray(signal.divergedDomains));
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('3. ResponseSentinel ADHD List Cap Fuzzing', () => {
    it('enforces ADHD list cap of maximum 5 items across arbitrary markdown structures', () => {
      // Generate random lines of list items and non-list items
      const listItemArb = fc.tuple(
        fc.constantFrom('- ', '* ', '1. ', '99. '),
        fc.string({ maxLength: 50 })
      ).map(([bullet, text]) => `${bullet}${text}`);

      const lineArb = fc.oneof(listItemArb, fc.string({ maxLength: 50 }));

      fc.assert(
        fc.property(fc.array(lineArb, { maxLength: 100 }), (lines) => {
          const rawText = lines.join('\n');
          const cappedText = ResponseSentinel.enforceAdhdListCap(rawText, 5);
          assert.strictEqual(typeof cappedText, 'string');

          // Verify no consecutive list block exceeds 5 items
          const cappedLines = cappedText.split('\n');
          let currentListCount = 0;
          for (const line of cappedLines) {
            const isListItem = /^\s*(?:\d+\.|\*|-)\s+/.test(line);
            if (isListItem) {
              currentListCount++;
              assert.ok(
                currentListCount <= 5,
                `List item count exceeded 5 in output: count was ${currentListCount}`
              );
            } else {
              currentListCount = 0;
            }
          }
        }),
        { numRuns: 500 }
      );
    });
  });

  describe('4. HeadroomCompressor Lossless Roundtrip Fuzzing', () => {
    it('compresses and retrieves arbitrary string payloads without corruption', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-fuzz-headroom-'));

      try {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 5000 }),
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => !/[/\\?%*:|"<>]/g.test(s)),
            (rawPayload, label) => {
              const compressed = HeadroomCompressor.compress(tempDir, rawPayload, label);
              assert.ok(compressed.token.startsWith('HEADROOM:'));

              const retrieved = HeadroomCompressor.retrieve(tempDir, compressed.token);
              assert.strictEqual(retrieved, rawPayload, 'Retrieved payload must exactly match original');
            }
          ),
          { numRuns: 200 }
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('5. StateManager Atomic Resilience Under Fuzzed Turns', () => {
    it('handles arbitrary user messages and maintains valid JSON state on disk', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-fuzz-state-'));

      try {
        StateManager.initialize(tempDir, 'fuzz_project');

        fc.assert(
          fc.property(
            fc.string({ maxLength: 1000 }),
            (userMessage) => {
              // Record turn with fuzzed message
              const state = StateManager.recordTurn(tempDir, userMessage);
              assert.ok(state);
              assert.strictEqual(state.uncommittedBuffer.lastUserMessage, userMessage);

              // Verify file on disk is strictly valid parseable JSON
              const statePath = StateManager.getStatePath(tempDir);
              const raw = fs.readFileSync(statePath, 'utf8');
              const parsed = JSON.parse(raw);
              assert.strictEqual(parsed.projectId, 'fuzz_project');
              assert.strictEqual(parsed.uncommittedBuffer.lastUserMessage, userMessage);
            }
          ),
          { numRuns: 200 }
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});

