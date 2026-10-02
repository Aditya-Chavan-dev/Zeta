import { test, describe } from 'node:test';
import assert from 'node:assert';
import { PrinciplesDictionary } from '../../../src/core/governance/principles-dictionary.js';
import { BloatKillerAgent } from '../../../src/core/governance/bloat-killer-agent.js';
import { ResponseSentinel } from '../../../src/core/governance/response-sentinel.js';
import { GoldenPathGenerator } from '../../../src/core/governance/golden-path-generator.js';

describe('City-Building Architecture & Bloat-Killer Governance Tests', () => {
  test('PrinciplesDictionary contains all 11 core principles and 8 zoning rules', () => {
    const principles = Object.keys(PrinciplesDictionary.CORE_PRINCIPLES);
    assert.strictEqual(principles.length, 11);
    assert.ok(PrinciplesDictionary.CORE_PRINCIPLES.solid);
    assert.ok(PrinciplesDictionary.CORE_PRINCIPLES.dryRuleOfThree);
    assert.ok(PrinciplesDictionary.CORE_PRINCIPLES.commandQuerySeparation);

    const zoning = Object.keys(PrinciplesDictionary.ZONING_RULES);
    assert.strictEqual(zoning.length, 8);
    assert.ok(PrinciplesDictionary.ZONING_RULES.dependencyRule);
    assert.ok(PrinciplesDictionary.ZONING_RULES.goldenPaths);
    assert.ok(PrinciplesDictionary.ZONING_RULES.rulesForSharedCode);

    assert.strictEqual(PrinciplesDictionary.COMPLEXITY_BUDGETS.maxFunctionLines, 30);
    assert.strictEqual(PrinciplesDictionary.COMPLEXITY_BUDGETS.maxFileLines, 300);
  });

  test('BloatKillerAgent detects and blocks AI placeholders (// TODO)', () => {
    const killer = new BloatKillerAgent();
    const report = killer.auditStageArtifacts({
      stageIndex: 7,
      stageName: 'Implementation',
      files: [
        {
          path: 'src/features/auth/service.ts',
          content: `export class AuthService {\n  login() {\n    // TODO: implement later\n  }\n}`,
        },
      ],
    });

    assert.strictEqual(report.status, 'BLOCKED');
    assert.ok(report.violations.some((v) => v.ruleId === 'no_ai_placeholders'));
  });

  test('BloatKillerAgent detects function length exceeding 30 lines', () => {
    const killer = new BloatKillerAgent();
    const longFunctionBody = Array.from({ length: 35 }, (_, i) => `    const x${i} = ${i};`).join('\n');
    const content = `export function processData() {\n${longFunctionBody}\n}`;

    const report = killer.auditStageArtifacts({
      stageIndex: 7,
      stageName: 'Implementation',
      files: [
        {
          path: 'src/features/billing/processor.ts',
          content,
        },
      ],
    });

    assert.strictEqual(report.status, 'BLOCKED');
    assert.ok(report.violations.some((v) => v.ruleId === 'function_length_budget_exceeded'));
  });

  test('BloatKillerAgent detects duplicated regex across features (DRY rule of three)', () => {
    const killer = new BloatKillerAgent();
    const report = killer.auditStageArtifacts({
      stageIndex: 7,
      stageName: 'Implementation',
      files: [
        {
          path: 'src/features/users/validator.ts',
          content: 'const phonePattern = /^\\+?[1-9]\\d{1,14}$/;\nexport function v1() {}',
        },
        {
          path: 'src/features/checkout/validator.ts',
          content: 'const checkPhone = /^\\+?[1-9]\\d{1,14}$/;\nexport function v2() {}',
        },
      ],
    });

    assert.strictEqual(report.status, 'BLOCKED');
    assert.ok(report.violations.some((v) => v.ruleId === 'duplicate_domain_logic'));
  });

  test('ResponseSentinel formats discrete schemas without blended clutter', () => {
    const recap = ResponseSentinel.formatRecapResponse({
      stepNumber: 7,
      lockedMilestones: ['Step 0 Intent locked', 'Step 1 Requirements locked'],
      activeDeliverable: 'Core engine constructed and verified.',
      nextStepName: 'Step 8 (QA)',
    });

    assert.ok(recap.includes('Milestone Recap (Step 7/15)'));
    assert.ok(recap.includes('Next Action (under 2 minutes)'));
    assert.ok(!recap.includes('What We Are Doing Right Now')); // No mixed story wall

    const nextSteps = ResponseSentinel.formatNextStepsResponse({
      currentStep: 7,
      currentStepName: 'Implementation',
      immediateAction: 'Lock Step 7 candidate',
      downstreamMilestones: ['Step 8 QA validation'],
    });

    assert.ok(nextSteps.includes('Upcoming Roadmap (Step 7 — Implementation)'));
    assert.ok(!nextSteps.includes('The Story So Far')); // No historical story wall
  });

  test('GoldenPathGenerator produces valid GOLDEN_PATHS.md and Day 1 configs', () => {
    const doc = GoldenPathGenerator.generateGoldenPaths({
      projectName: 'TestProject',
      primaryLanguage: 'typescript',
      framework: 'NodeNext',
      dataPath: 'src/shared/data',
      validationPath: 'src/shared/validation',
      errorPath: 'src/shared/errors',
    });

    assert.ok(doc.includes('GOLDEN PATHS: THE ONE APPROVED WAY'));
    assert.ok(doc.includes('The Rule of Three'));

    const inspectors = GoldenPathGenerator.generateTypeScriptInspectors();
    assert.ok(inspectors.tsconfigContent.includes('"strict": true'));
    assert.ok(inspectors.eslintContent.includes('max-lines-per-function'));
  });
});
