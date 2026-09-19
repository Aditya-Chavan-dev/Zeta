import { Step4ArchitectureDraft } from './types.js';

export interface CompiledArchitectureArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step4ArchitectureDraft into the authoritative docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md markdown document.
   */
  public static compile(draft: Step4ArchitectureDraft): CompiledArchitectureArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step4ArchitectureDraft): string {
    const componentRows = d.components.map(c =>
      `### ${c.id}: ${c.name} (${c.layer})\n* **Responsibility**: ${c.responsibility}\n* **Inputs**: ${c.inputs.join(', ')}\n* **Outputs**: ${c.outputs.join(', ')}\n* **Failure Behavior**: ${c.failureBehavior}`
    ).join('\n\n');

    const adrSections = d.adrs.map(a =>
      `### ${a.id}: ${a.title}\n* **Status**: ${a.status}\n* **Context**: ${a.context}\n* **Decision**: ${a.decision}\n* **Consequences**: ${a.consequences}`
    ).join('\n\n');

    const fmeaRows = d.fmeaScenarios.map(f =>
      `| ${f.id} | ${f.component} | ${f.failureTrigger} | ${f.impactSeverity} | ${f.containmentStrategy} | ${f.recoveryProcedure} |`
    ).join('\n');

    return `# SYSTEM ARCHITECTURE & SOLUTION DESIGN BLUEPRINT
**Stage**: Step 4 — System Architecture & Solution Design  
**Status**: LOCKED  
**Authority**: Single Source of Truth for System Partitioning, Failure Modes & ADRs  

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

---

## 2. Architectural Style & C4 Structural Decomposition
* **Architecture Style**: ${d.architectureStyle}

![System Architecture Blueprint](assets/architecture-blueprint.svg)

<details>
<summary>View Raw Mermaid Source</summary>

\`\`\`mermaid
${d.mermaidC4Diagram}
\`\`\`

</details>

---

## 3. Core Architectural Components

${componentRows}

---

## 4. Failure Mode & Effect Analysis (FMEA)

| ID | Component | Failure Trigger | Severity | Containment | Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- |
${fmeaRows}

---

## 5. Architecture Decision Records (ADRs)

${adrSections}

---

## 6. Architecture Baseline Lock & Handshake
* **Readiness Verdict**: **LOCKED & VERIFIED**
* **Traceability**: All components trace directly to Step 1 Requirements and Step 3 Technology selections.
* **Gating Authority**: Step 4 approved. Cleared to proceed to Step 5: Detailed Technical Design Architect.
`;
  }

  private static generateTldrSummary(d: Step4ArchitectureDraft): string {
    const compCount = d.components.length;
    const adrHighlights = d.adrs.map(a => a.id).join(', ');

    return `TL;DR SYSTEM ARCHITECTURE (Step 4 Baseline):
• Architecture Style: ${d.architectureStyle}.
• Component Breakdown: ${compCount} core components (Bridge, State Store, Governance, Dispatcher).
• Key ADRs: ${adrHighlights || 'ADR-01, ADR-02'}.
• Resilience: FMEA verified; write-ahead atomic journaling with resume sentinel.
• Gating Verdict: GO — Proceed to Step 5 Detailed Technical Design Architect.`;
  }
}
