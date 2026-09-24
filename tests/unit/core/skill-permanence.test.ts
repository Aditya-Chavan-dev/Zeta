import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { BuilderTranslator, DEFAULT_STAGE_TERMS } from '../../../src/core/formatters/builder-translator.js';
import { HeadroomCompressor } from '../../../src/core/headroom/headroom-compressor.js';
import { ResponseSentinel } from '../../../src/core/governance/response-sentinel.js';
import { GovernanceEngine } from '../../../src/core/engine/governance-engine.js';
import { CANONICAL_LIFECYCLE } from '../../../src/core/lifecycle/lifecycle-map.js';

describe('Skill Permanence: ADHD, Zero-Jargon Storytelling, Ponytail & Headroom', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-skill-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  describe('Suite 1: ADHD Cognitive Invariants', () => {
    test('Ensures active ZETA status badge is on the first line', () => {
      const formatted = ResponseSentinel.validateAndFormat({
        stageIndex: 3,
        stageName: 'System Architecture Blueprint',
        isComplete: false,
        pastMilestone: 'Risk register signed off',
        presentAction: 'Mapping out data flows and service boundaries',
        nextUnlock: 'Component contracts and test harness',
        rawBody: 'Here is the architectural overview.'
      });

      const firstLine = formatted.split('\n')[0];
      assert.strictEqual(firstLine, '🟢 [ZETA: ACTIVE | Step 3/15 - System Architecture Blueprint]');
    });

    test('Ensures completed lifecycle displays (15/15) badge', () => {
      const formatted = ResponseSentinel.validateAndFormat({
        stageIndex: 14,
        stageName: 'Operational Readiness & Handoff',
        isComplete: true,
        pastMilestone: 'Production deployment rehearsal passed',
        presentAction: 'Packaging project handoff documentation',
        nextUnlock: 'Handoff to Evo evolution engine',
        rawBody: 'Lifecycle is complete.'
      });

      const firstLine = formatted.split('\n')[0];
      assert.strictEqual(firstLine, '🟢 [ZETA: ACTIVE | Lifecycle Complete (15/15)]');
    });

    test('Enforces hard cap of maximum 5 items per list', () => {
      const rawWithLongList = [
        'Here are the options:',
        '1. Option one',
        '2. Option two',
        '3. Option three',
        '4. Option four',
        '5. Option five',
        '6. Option six should be capped',
        '7. Option seven should be capped'
      ].join('\n');

      const capped = ResponseSentinel.enforceAdhdListCap(rawWithLongList);
      assert.ok(!capped.includes('Option six'));
      assert.ok(!capped.includes('Option seven'));
      assert.ok(capped.includes('Option five'));
    });
  });

  describe('Suite 2: Zero-Jargon Storytelling & Term Breakdown', () => {
    test('Formats all 3 chronological story acts in Summary Mode', () => {
      const story = BuilderTranslator.formatStoryTurn({
        stageIndex: 0,
        stageName: 'Project Intent & Problem Framing',
        pastMilestone: 'None (Greenfield start)',
        presentAction: 'Clarifying the core problem without technical buzzwords',
        nextUnlock: 'Authoritative requirements baseline in Step 1'
      });

      assert.ok(story.includes('🔹 **The Story So Far**: None (Greenfield start)'));
      assert.ok(story.includes('🔹 **What We Are Doing Right Now**: Clarifying the core problem without technical buzzwords'));
      assert.ok(story.includes('🔹 **What Happens Next**: Authoritative requirements baseline in Step 1'));
      assert.ok(story.includes('🔸 **Next Action (under 2 minutes)**:'));
    });

    test('Translates technical jargon terms into everyday builder language', () => {
      const jargonText = 'We need to inspect the AST and construct a DAG to prevent race condition issues with WAL and STRIDE.';
      const translated = BuilderTranslator.translateJargon(jargonText);

      assert.ok(!translated.includes('AST'));
      assert.ok(translated.includes('code structure map'));
      assert.ok(!translated.includes('DAG'));
      assert.ok(translated.includes('task dependency tree'));
      assert.ok(!translated.includes('WAL'));
      assert.ok(translated.includes('write-ahead safe log'));
      assert.ok(!translated.includes('STRIDE'));
      assert.ok(translated.includes('security risk checklist'));
    });

    test('Explains domain terms inline in bold brackets', () => {
      const formatted = BuilderTranslator.formatInlineTerm('Greenfield');
      assert.strictEqual(formatted, 'Greenfield (**Building something completely new from scratch.**)');
    });

    test('All 15 stages have defined builder terms', () => {
      for (let i = 0; i <= 14; i++) {
        assert.ok(DEFAULT_STAGE_TERMS[i], `Missing stage term for stage ${i}`);
        assert.ok(DEFAULT_STAGE_TERMS[i].term.length > 0);
        assert.ok(DEFAULT_STAGE_TERMS[i].whatItIs.length > 0);
        assert.ok(DEFAULT_STAGE_TERMS[i].whyEnterpriseUsesIt.length > 0);
      }
    });
  });

  describe('Suite 3: Ponytail Anti-Bloat Ladder', () => {
    test('Detects and blocks placeholder slop (// TODO)', () => {
      const badContent = 'function connect() {\n  // TODO: implement connection\n  return null;\n}';
      const check = ResponseSentinel.checkPonytailBloat(badContent);

      assert.strictEqual(check.allowed, false);
      assert.ok(check.reason && check.reason.includes('// TODO'));
    });

    test('Passes valid implementations with zero placeholders', () => {
      const cleanContent = 'function add(a: number, b: number): number {\n  return a + b;\n}';
      const check = ResponseSentinel.checkPonytailBloat(cleanContent);

      assert.strictEqual(check.allowed, true);
    });
  });

  describe('Suite 4: Headroom Context Compression', () => {
    test('Compresses long repeated payloads and decompresses losslessly', () => {
      const compressor = new HeadroomCompressor(tmpDir);
      const text = 'Line of repeated diagnostic information with logs and tokens.\n'.repeat(50);

      const compressed = compressor.compress(text, 'unit-test-log');
      assert.ok(compressed.compressedLength < text.length, 'Compressed length should be smaller');
      assert.ok(compressed.compressionRatio > 0.4, 'Compression ratio should be substantial');

      // Check cache storage
      const cached = compressor.retrieve(compressed.token);
      assert.strictEqual(cached, text, 'Retrieved cached content must match original text identically');
    });

    test('Headroom token format is identifiable and compact', () => {
      const compressor = new HeadroomCompressor(tmpDir);
      const sample = 'Small content for cache token validation';
      const result = compressor.compress(sample);

      assert.ok(result.token.startsWith('HEADROOM:'));
      const parts = result.token.split(':');
      assert.strictEqual(parts.length, 3);
    });
  });

  describe('Suite 5: Multi-Turn Permanence & Central Governance Funnel', () => {
    test('ResponseSentinel central funnel formats normal turn directly and summary turn on demand', () => {
      const normalResponse = ResponseSentinel.validateAndFormat({
        stageIndex: 1,
        stageName: 'System Requirements Specification',
        isComplete: false,
        pastMilestone: 'Project intent ratified in Step 0',
        presentAction: 'Defining inputs, outputs, and constraints',
        nextUnlock: 'Threat modeling and failure modes in Step 2',
        rawBody: 'Here is the requirements breakdown:\n1. One\n2. Two\n3. Three'
      });

      // Verify Palette 1A badge
      assert.ok(normalResponse.startsWith('🟢 [ZETA: ACTIVE | Step 1/15 - System Requirements Specification]'));
      // Normal turn has NO 3-act wall
      assert.ok(!normalResponse.includes('The Story So Far'));
      assert.ok(normalResponse.includes('🔹 **Current Focus**:'));
      assert.ok(normalResponse.includes('🔸 **Next Action (under 2 minutes)**:'));
      assert.ok(normalResponse.includes('1. One'));

      // Summary Mode turn has the 3-act story
      const summaryResponse = ResponseSentinel.validateAndFormat({
        stageIndex: 1,
        stageName: 'System Requirements Specification',
        isComplete: false,
        isSummaryMode: true,
        pastMilestone: 'Project intent ratified in Step 0',
        presentAction: 'Defining inputs, outputs, and constraints',
        nextUnlock: 'Threat modeling and failure modes in Step 2'
      });
      assert.ok(summaryResponse.includes('🔹 **The Story So Far**:'));
      assert.ok(summaryResponse.includes('🔹 **What We Are Doing Right Now**:'));
      assert.ok(summaryResponse.includes('🔹 **What Happens Next**:'));
      assert.ok(summaryResponse.includes('🔸 **Next Action (under 2 minutes)**:'));
    });

    test('Multiple sequential turns preserve Palette 1A formatting without degradation', () => {
      for (let stage = 0; stage < 5; stage++) {
        const output = ResponseSentinel.validateAndFormat({
          stageIndex: stage,
          stageName: CANONICAL_LIFECYCLE[stage].agentName,
          isComplete: false,
          pastMilestone: `Step ${stage - 1} verified`,
          presentAction: `Working on step ${stage}`,
          nextUnlock: `Unlock step ${stage + 1}`,
          rawBody: `Step ${stage} body output.`
        });

        assert.ok(output.includes(`🟢 [ZETA: ACTIVE | Step ${stage}/15 - ${CANONICAL_LIFECYCLE[stage].agentName}]`));
        assert.ok(output.includes('🔹 **Current Focus**:'));
        assert.ok(output.includes('🔸 **Next Action (under 2 minutes)**:'));
      }
    });
  });
});
