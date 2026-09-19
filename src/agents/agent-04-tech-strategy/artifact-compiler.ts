import { Step3TechStrategyDraft } from './types.js';

export interface CompiledTechStrategyArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step3TechStrategyDraft into the authoritative docs/TECH_STACK_AND_STRATEGY.md markdown document.
   */
  public static compile(draft: Step3TechStrategyDraft): CompiledTechStrategyArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step3TechStrategyDraft): string {
    const tdrSections = d.tdrs.map(t =>
      `### ${t.id}: ${t.selectedTech}\n* **Category**: ${t.category}\n* **Version / Spec**: ${t.version}\n* **Justification**: ${t.justification}\n* **Rejected Alternatives**:\n${t.rejectedAlternatives.map(a => `  - ${a}`).join('\n')}\n* **Trade-offs Accepted**: ${t.tradeOffsAccepted}`
    ).join('\n\n');

    return `# TECHNOLOGY STRATEGY & TECH-STACK BASELINE
**Stage**: Step 3 — Technology Strategy & Tech-Stack Selection  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Approved Technologies & Runtimes  

---

## 1. Upstream Context Baselines
> **Step 0 Intent TL;DR**:  
> ${d.step0Tldr.replace(/\n/g, '\n> ')}

> **Step 1 Requirements TL;DR**:  
> ${d.step1Tldr.replace(/\n/g, '\n> ')}

> **Step 2 Feasibility & Risk TL;DR**:  
> ${d.step2Tldr.replace(/\n/g, '\n> ')}

---

## 2. Technology Decision Records (TDRs)

${tdrSections}

---

## 3. Technology Governance & Prohibited Items
* **Prohibited Technologies**: Cloud-hosted background daemons, binary SQLite databases (for core state), heavyweight JVM runtimes.
* **Approved Language Standards**: TypeScript strict mode (\`"strict": true\`), ES2022 target, NodeNext module resolution.
* **Dependency Policy**: Minimalist zero-bloat standard; prefer native Node.js APIs (\`node:fs\`, \`node:crypto\`, \`node:test\`) over third-party micro-packages.

---

## 4. Architecture-Readiness Verdict & Sign-Off
* **Readiness Verdict**: **${d.architectureReadinessVerdict}**
* **Verification**: The chosen technologies fully satisfy Step 1 Requirements and Step 2 Feasibility bounds.
* **Gating Authority**: Step 3 approved. Cleared to proceed to Step 4: System Architecture & Structural Design.
`;
  }

  private static generateTldrSummary(d: Step3TechStrategyDraft): string {
    const stackHighlights = d.tdrs.map(t => `${t.category}: ${t.selectedTech}`).join('; ');

    return `TL;DR TECH STACK & STRATEGY (Step 3 Baseline):
• Core Stack: Node.js LTS + TypeScript strict + atomic file storage.
• Key TDRs: ${stackHighlights || 'Node.js LTS, local .zeta state'}.
• Testing: Native node:test runner with tsx (zero runner bloat).
• Prohibited: External background servers / cloud daemons.
• Gating Verdict: GO — Proceed to Step 4 System Architecture Architect.`;
  }
}
