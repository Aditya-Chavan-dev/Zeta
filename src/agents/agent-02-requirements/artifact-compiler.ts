import { Step1RequirementsDraft } from './types.js';

export interface CompiledRequirementsArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step1RequirementsDraft into the authoritative docs/REQUIREMENTS_SPECIFICATION.md markdown document.
   */
  public static compile(draft: Step1RequirementsDraft): CompiledRequirementsArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step1RequirementsDraft): string {
    const frRows = d.functionalRequirements.map(fr => 
      `### ${fr.id}: ${fr.title}\n* **Priority**: ${fr.priority}\n* **User Story**: ${fr.userStory}\n* **Acceptance Criteria**:\n${fr.acceptanceCriteria.map(c => `  - ${c}`).join('\n')}`
    ).join('\n\n');

    const nfrRows = d.nonFunctionalRequirements.map(nfr =>
      `| ${nfr.id} | ${nfr.category} | ${nfr.title} | ${nfr.metric} | ${nfr.targetThreshold} | ${nfr.priority} |`
    ).join('\n');

    const dataRows = d.dataRequirements.map(dr =>
      `| ${dr.id} | ${dr.entityName} | ${dr.description} | ${dr.persistenceModel} | ${dr.retentionPolicy} |`
    ).join('\n');

    return `# REQUIREMENTS SPECIFICATION
**Stage**: Step 1 — Requirements Engineering & Baselining  
**Status**: LOCKED  
**Authority**: Single Source of Truth for System Capabilities & Constraints  

---

## 1. Upstream Intent Baseline (Step 0 Reference)
> **Step 0 Summary**:  
> ${d.step0Tldr.replace(/\n/g, '\n> ')}

---

## 2. Functional Requirements (FR)

${frRows || 'No functional requirements recorded.'}

---

## 3. Non-Functional Requirements (NFR)

| ID | Category | Title | Metric | Target Threshold | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
${nfrRows || '| NFR-01 | PERFORMANCE | Low Latency | Turn Time | < 100ms | MUST_HAVE |\n| NFR-02 | RELIABILITY | Zero Data Loss | Interruption Recovery | 100% | MUST_HAVE |'}

---

## 4. Data & State Requirements

| ID | Entity | Description | Persistence Model | Retention Policy |
| :--- | :--- | :--- | :--- | :--- |
${dataRows || '| DR-01 | Session State | Tracks active step, locked stages, and uncommitted turns | JSON (.zeta/state.json) | Lifetime of project |\n| DR-02 | Governance Docs | Authoritative markdown documents for each stage | Markdown (docs/*.md) | Permanent version control |'}

---

## 5. Scope Boundaries & Exclusions
* **Strictly In-Scope**: Greenfield 15-stage lifecycle governance, per-turn atomic persistence, conversational drift detection.
* **Strictly Out-of-Scope**:
${d.outOfScopeItems.map(item => `  - ${item}`).join('\n')}

---

## 6. Verification & Handshake Criteria
* Every downstream architecture (Step 2/3) and implementation (Step 6/7) must trace directly back to one or more FRs and NFRs listed here.
* Formal sign-off on this document locks the functional baseline.
`;
  }

  private static generateTldrSummary(d: Step1RequirementsDraft): string {
    const frCount = d.functionalRequirements.length;
    const frHighlights = d.functionalRequirements.slice(0, 3).map(f => `${f.id} (${f.title})`).join(', ');
    const nfrHighlights = d.nonFunctionalRequirements.slice(0, 2).map(n => `${n.title}: ${n.targetThreshold}`).join('; ');

    return `TL;DR REQUIREMENTS SPECIFICATION (Step 1 Baseline):
• Functional Scope: ${frCount} FRs baselined (${frHighlights || 'Core Governance Flow'}).
• Key NFR Thresholds: ${nfrHighlights || 'Latency < 100ms; Zero data loss on crash'}.
• Data Model: Local-first .zeta/state.json + docs/*.md.
• Strict Exclusions: No legacy reverse-engineering; zero cloud daemons.
• Gating Verdict: GO — Proceed to Step 2 Feasibility & Risk Assessment.`;
  }
}
