import { Step0IntentDraft } from './types.js';

export interface CompiledArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step0IntentDraft into the authoritative docs/PROJECT_INTENT.md markdown document.
   */
  public static compile(draft: Step0IntentDraft): CompiledArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step0IntentDraft): string {
    const prob = d.problemSpace;
    const env = d.domainEnvironment;
    const people = d.peopleStakeholders;
    const biz = d.businessIntent;
    const scope = d.scopeBoundaries;
    const succ = d.successDefinition;
    const constr = d.assumptionsConstraints;
    const trust = d.trustCompliance;
    const ops = d.operationalImpact;
    const econ = d.economicsFeasibility;
    const dec = d.decisionFoundation;

    return `# PROJECT INTENT & PROBLEM DEFINITION
**Stage**: Step 0 — Engineering Lifecycle Inception  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Project Purpose  

---

## 1. Executive Summary & Core Invariant
* **Why Build This**: ${biz.valueProposition || 'To establish an autonomous, disciplined engineering governance lifecycle preventing technical debt.'}
* **Core Problem**: ${prob.problemStatement || prob.problemIdentification || 'Engineering teams suffer from unguided development resulting in architectural decay.'}
* **Target Audience**: ${people.userIdentification || 'Software engineers, founders, and cross-functional teams.'}
* **Definition of Success**: ${(succ.successCriteria && succ.successCriteria.join(', ')) || 'Deterministic adherence to governance guardrails with zero unapproved architectural drift.'}

---

## 2. Problem Space & Root-Cause Analysis
* **Problem Identification**: ${prob.problemIdentification || 'Manual workflow fragmentation and lack of systematic architectural enforcement.'}
* **Problem Statement**: ${prob.problemStatement || 'Developers waste time and incur debt because current tools lack disciplined, multi-stage lifecycle enforcement.'}
* **Root-Cause Analysis**: ${prob.rootCauseAnalysis || 'Inception decisions are rarely captured systematically; developers jump straight to code without locked intent.'}
* **Evidence & Observed Failures**: ${prob.problemEvidence || 'Frequent rewrites, unmaintained documentation, and high production defect rates.'}
* **Context & Operating Conditions**: ${prob.problemContext || 'High-velocity greenfield software development.'}
* **Frequency & Severity**: ${prob.problemFrequencySeverity || 'Occurs continuously on almost every unguided software initiative.'}
* **Cost of Inaction**: ${prob.costOfInaction || 'Compound technical debt, delayed releases, and inevitable project abandonment.'}

---

## 3. Domain & Environmental Context
* **Domain Understanding**: ${env.domainUnderstanding || 'Developer tooling, autonomous engineering governance, and compiler/agent pipelines.'}
* **Current-State Workarounds**: ${env.currentStateAnalysis || 'Manual checklists, scattered notion docs, or ad-hoc prompt chaining.'}
* **Existing Alternatives & Limitations**: ${env.existingAlternatives || 'Traditional linters only catch syntax; copilot tools write code without architectural boundaries.'}
* **Industry Standards**: ${env.industryStandards || 'IEEE standard for software life cycle processes (IEEE 12207) and modern agile governance.'}

---

## 4. People & Stakeholder Personas
* **Primary Users**: ${people.userIdentification || 'Autonomous software engineers and technical founders.'}
* **Key Personas**: ${(people.userPersonas && people.userPersonas.join('; ')) || 'Lead Developer / Staff Engineer'}
* **User Frustrations**: ${(people.userPainPoints && people.userPainPoints.join('; ')) || 'Having to context switch, fix regressions, and reverse-engineer lost decisions.'}
* **Decision Authority**: ${people.decisionAuthority || 'Primary user / repository owner via conversational sign-off.'}

---

## 5. Strategic & Business Intent
* **Business Objective**: ${biz.businessObjective || 'Deliver reliable, high-grade software projects 5x faster with zero architectural decay.'}
* **Product Vision**: ${biz.projectVision || 'The autonomous engineering governor that guides development from raw idea to decommissioning.'}
* **Value Proposition**: ${biz.valueProposition || 'Guaranteed architectural discipline without manual overhead.'}
* **Desired State Change**: ${(biz.desiredOutcomes && biz.desiredOutcomes.join('; ')) || 'Projects stay structured, documented, and resilient from Day 1.'}

---

## 6. Scope Boundaries & Explicit Exclusions
* **Initial Scope (V1)**:
${(scope.initialScope && scope.initialScope.map(s => `  * ${s}`).join('\n')) || '  * Greenfield 15-stage engineering lifecycle governance\n  * Session persistence & crash-recovery engine\n  * Conversational drift detection & impact analysis'}
* **Explicitly Out-of-Scope**:
${(scope.outOfScope && scope.outOfScope.map(s => `  * ${s}`).join('\n')) || '  * Legacy codebase reverse-engineering\n  * Cloud-hosted SaaS management dashboards\n  * Direct manual code injection without stage gating'}
* **Scope-Change Principles**: ${scope.scopeChangePrinciples || 'Any scope modification requires an Impact Cascade Report and explicit human approval.'}

---

## 7. Success Metrics & Quality Indicators
* **Definitive Success Criteria**: ${(succ.successCriteria && succ.successCriteria.join('; ')) || '100% of generated stages conform to upstream constraints; zero uncommitted state loss.'}
* **Target Metrics**: ${(succ.successMetrics && succ.successMetrics.join('; ')) || 'Stage gating pass rate > 95%; crash recovery recovery rate = 100%.'}

---

## 8. Assumptions, Constraints & Unknowns
* **Technical Constraints**: ${(constr.knownConstraints && constr.knownConstraints.join('; ')) || 'Local-first filesystem storage (.zeta/); zero external daemon dependencies; pure Node.js/TypeScript.'}
* **Assumptions**: ${(constr.businessAssumptions && constr.businessAssumptions.join('; ')) || 'Users prefer disciplined guided steps over hallucinated one-shot code dumps.'}

---

## 9. Trust, Security & Compliance
* **Security & Privacy Posture**: ${trust.securityContext || '100% local execution. Code and state never leave the user workspace.'}
* **Compliance Standards**: ${(trust.regulatoryRequirements && trust.regulatoryRequirements.join('; ')) || 'Local file permission sandboxing.'}

---

## 10. Operations, Support & Crash Recovery
* **Operational Model**: ${ops.operationalContext || 'Embedded IDE extension / autonomous pair-programmer.'}
* **Crash Resilience**: ${ops.monitoringReliability || 'Per-turn write-ahead atomic persistence to .zeta/state.json with automatic session resume sentinel.'}

---

## 11. Economics & High-Level Feasibility
* **Resource Investment**: ${econ.expectedInvestment || 'Greenfield modular architecture completed across 4 planned phases.'}
* **ROI Projection**: ${econ.expectedRoi || 'Saves 40+ engineering hours per project by eliminating redesign loops.'}

---

## 12. Decision Foundation & Sign-off Verdict
* **Alternatives Evaluated**: ${(dec.alternativesConsidered && dec.alternativesConsidered.join('; ')) || 'Ad-hoc LLM chats; rigid enterprise project management suites.'}
* **Core Trade-offs Accepted**: ${(dec.criticalTradeOffs && dec.criticalTradeOffs.join('; ')) || 'Deliberate upfront rigor prioritized over instantaneous unvalidated code dumping.'}
* **Formal Inception Verdict**: **${dec.goNoGoRecommendation || 'GO'}**
`;
  }

  private static generateTldrSummary(d: Step0IntentDraft): string {
    const prob = d.problemSpace.problemStatement || d.problemSpace.problemIdentification || 'Manual workflow fragmentation and lack of systematic architectural enforcement.';
    const vision = d.businessIntent.projectVision || d.businessIntent.valueProposition || 'Autonomous engineering governance from inception to delivery.';
    const user = d.peopleStakeholders.userIdentification || 'Engineers and technical founders.';
    const scope = d.scopeBoundaries.initialScope?.join(', ') || '15-stage greenfield lifecycle with session persistence and drift detection.';
    const outScope = d.scopeBoundaries.outOfScope?.join(', ') || 'Legacy codebase reverse engineering and external daemons.';

    return `TL;DR PROJECT INTENT (Step 0 Baseline):
• Core Problem: ${prob}
• Vision & Purpose: ${vision}
• Primary User: ${user}
• Core In-Scope: ${scope}
• Strictly Out-of-Scope: ${outScope}
• Gating Verdict: GO — Proceed to Step 1 Requirements Elicitation.`;
  }
}
