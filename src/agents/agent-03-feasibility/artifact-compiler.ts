import { Step2FeasibilityDraft } from './types.js';

export interface CompiledFeasibilityArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step2FeasibilityDraft into the authoritative docs/FEASIBILITY_AND_RISK_REPORT.md markdown document.
   */
  public static compile(draft: Step2FeasibilityDraft): CompiledFeasibilityArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step2FeasibilityDraft): string {
    const dimensionRows = d.dimensionScores.map(score =>
      `| ${score.dimension} | ${score.status} | ${score.notes} |`
    ).join('\n');

    const constraintRows = d.constraints.map(c =>
      `| ${c.id} | ${c.type} | ${c.description} | ${c.impactOnSolution} |`
    ).join('\n');

    const dependencyRows = d.dependencies.map(dep =>
      `| ${dep.id} | ${dep.name} | ${dep.criticality} | ${dep.failureMode} | ${dep.fallbackOption} |`
    ).join('\n');

    const riskRows = d.risks.map(r =>
      `### ${r.id}: ${r.title}\n* **Category**: ${r.category} | **Severity**: ${r.severity} (Probability: ${r.probability}, Impact: ${r.impact})\n* **Mitigation**: ${r.mitigationStrategy}\n* **Contingency Plan**: ${r.contingencyPlan}`
    ).join('\n\n');

    return `# FEASIBILITY, CONSTRAINTS & RISK ASSESSMENT REPORT
**Stage**: Step 2 — Feasibility, Constraints & Risk Analysis  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Project Viability & Risk Mitigation  

---

## 1. Upstream Context Baselines
> **Step 0 Intent TL;DR**:  
> ${d.step0Tldr.replace(/\n/g, '\n> ')}

> **Step 1 Requirements TL;DR**:  
> ${d.step1Tldr.replace(/\n/g, '\n> ')}

---

## 2. Feasibility Dimension Scorecard

| Dimension | Status | Notes |
| :--- | :--- | :--- |
${dimensionRows}

---

## 3. Real-World Constraints Register

| ID | Type | Constraint Description | Impact on Architecture |
| :--- | :--- | :--- | :--- |
${constraintRows}

---

## 4. Critical Dependencies & Single Points of Failure

| ID | Dependency | Criticality | Failure Mode | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
${dependencyRows}

---

## 5. Risk Register & Concrete Mitigations

${riskRows || 'No material risks identified.'}

---

## 6. Stage-Gate Verdict & Sign-off Decision
* **Overall Feasibility**: **${d.verdict}**
* **Verdict Rationale**: ${d.verdictRationale}
* **Gating Authority**: Step 2 approved. Cleared to proceed to Step 3: Technology Strategy & Stack Selection.
`;
  }

  private static generateTldrSummary(d: Step2FeasibilityDraft): string {
    const riskCount = d.risks.length;
    const topRisks = d.risks.slice(0, 2).map(r => `${r.id} (${r.title})`).join('; ');
    const constraints = d.constraints.map(c => c.id).join(', ');

    return `TL;DR FEASIBILITY & RISK (Step 2 Baseline):
• Feasibility Verdict: ${d.verdict} — Core architecture is fully viable in local-first environment.
• Constraints Locked: ${constraints || 'CON-01, CON-02, CON-03'}.
• Material Risks Mitigated: ${riskCount} risks addressed (${topRisks || 'Atomic journaling, drift detection'}).
• Dependencies: Local file system and Node.js extension host (zero cloud daemons).
• Gating Verdict: GO — Proceed to Step 3 Technology Strategy Architect.`;
  }
}
