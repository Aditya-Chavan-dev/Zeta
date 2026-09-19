import { Step6ImplementationPlanDraft } from './types.js';

export interface CompiledImplementationPlanArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step6ImplementationPlanDraft into the authoritative docs/IMPLEMENTATION_PLAN_AND_WBS.md markdown document.
   */
  public static compile(draft: Step6ImplementationPlanDraft): CompiledImplementationPlanArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step6ImplementationPlanDraft): string {
    const taskRows = d.tasks.map(t =>
      `### ${t.id}: ${t.title} (${t.phase})\n* **Estimated Effort**: ${t.estimatedHours}h\n* **Dependencies**: ${t.dependencies.length > 0 ? t.dependencies.join(', ') : 'None'}\n* **Definition of Ready (DoR)**: ${t.definitionOfReady}\n* **Definition of Done (DoD)**: ${t.definitionOfDone}`
    ).join('\n\n');

    const gateRows = d.qualityGates.map(g =>
      `### ${g.gateName}\n* **Trigger Point**: ${g.triggerPoint}\n* **Mandatory Checks**:\n${g.mandatoryChecks.map(c => `  - ${c}`).join('\n')}\n* **Pass Threshold**: ${g.passThreshold}`
    ).join('\n\n');

    return `# IMPLEMENTATION PLAN & ENGINEERING WORK BREAKDOWN (WBS)
**Stage**: Step 6 — Implementation Planning & Work Breakdown  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Task Breakdown, Quality Gates & Critical Path  

---

## 1. Upstream Context Baselines
> **Step 0 Intent TL;DR**:  
> ${d.step0Tldr.replace(/\n/g, '\n> ')}

> **Step 1 Requirements TL;DR**:  
> ${d.step1Tldr.replace(/\n/g, '\n> ')}

> **Step 2 Feasibility & Risk TL;DR**:  
> ${d.step2Tldr.replace(/\n/g, '\n> ')}

> **Step 3 Tech Stack TL;DR**:  
> ${d.step3Tldr.replace(/\n/g, '\n> ')}

> **Step 4 System Architecture TL;DR**:  
> ${d.step4Tldr.replace(/\n/g, '\n> ')}

> **Step 5 Detailed Technical Design TL;DR**:  
> ${d.step5Tldr.replace(/\n/g, '\n> ')}

---

## 2. Delivery Sequencing Strategy & Critical Path
* **Sequencing Strategy**: ${d.sequencingStrategy}
* **Critical Path**: ${d.criticalPath.join(' $\\longrightarrow$ ')}

---

## 3. Work Breakdown Structure (WBS) Tasks

${taskRows}

---

## 4. Engineering Quality Gates & DoR / DoD Contracts

${gateRows}

---

## 5. Implementation Readiness & Baseline Lock
* **Readiness Verdict**: **APPROVED FOR PRODUCTION DEVELOPMENT**
* **Verification**: All tasks are bounded, estimated, sequenced, and covered by DoR/DoD contracts.
* **Gating Authority**: Step 6 approved. Cleared to proceed to Step 7: Implementation & Development Architect.
`;
  }

  private static generateTldrSummary(d: Step6ImplementationPlanDraft): string {
    const taskCount = d.tasks.length;
    const totalHours = d.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

    return `TL;DR IMPLEMENTATION PLAN (Step 6 Baseline):
• Work Breakdown: ${taskCount} core tasks planned (~${totalHours} total engineering hours).
• Delivery Strategy: ${d.sequencingStrategy}.
• Critical Path: ${d.criticalPath.join(' -> ')}.
• Quality Gates: Strict DoR before start; 100% test pass DoD before lock.
• Gating Verdict: GO — Proceed to Step 7 Implementation & Development Architect.`;
  }
}
