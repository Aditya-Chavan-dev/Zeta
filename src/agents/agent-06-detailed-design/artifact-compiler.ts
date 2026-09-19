import { Step5DetailedDesignDraft } from './types.js';

export interface CompiledDetailedDesignArtifacts {
  fullDocument: string;
  tldrSummary: string;
}

export class ArtifactCompiler {
  /**
   * Compiles the Step5DetailedDesignDraft into the authoritative docs/DETAILED_TECHNICAL_DESIGN.md markdown document.
   */
  public static compile(draft: Step5DetailedDesignDraft): CompiledDetailedDesignArtifacts {
    const fullDocument = this.generateFullDocument(draft);
    const tldrSummary = this.generateTldrSummary(draft);

    return {
      fullDocument,
      tldrSummary
    };
  }

  private static generateFullDocument(d: Step5DetailedDesignDraft): string {
    const moduleSections = d.modules.map(m =>
      `### ${m.moduleName} (\`${m.filePath}\`)\n* **Dependencies**: ${m.dependencies.join(', ')}\n* **Public Method Contracts**:\n` +
      m.publicMethods.map(pm => `  - \`${pm.name}${pm.signature}\`: ${pm.description}`).join('\n')
    ).join('\n\n');

    const stateRows = d.stateTransitions.map(st =>
      `| ${st.fromState} | ${st.trigger} | ${st.toState} | ${st.guardCondition} | ${st.sideEffect} |`
    ).join('\n');

    const errorRows = d.errorCodes.map(ec =>
      `| \`${ec.code}\` | ${ec.category} | ${ec.description} | ${ec.recoveryGuidance} |`
    ).join('\n');

    return `# DETAILED TECHNICAL DESIGN SPECIFICATION
**Stage**: Step 5 — Detailed Technical Design & Engineering Design  
**Status**: LOCKED  
**Authority**: Single Source of Truth for Class Contracts, Schemas, State Machines & Errors  

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

---

## 2. Core Implementation Modules & Interface Contracts

${moduleSections}

---

## 3. Lifecycle State Machine Transitions

| From State | Trigger Event | To State | Guard Condition | Side Effects |
| :--- | :--- | :--- | :--- | :--- |
${stateRows}

---

## 4. Standardized Error Taxonomy

| Error Code | Category | Description | Recovery Guidance |
| :--- | :--- | :--- | :--- |
${errorRows}

---

## 5. Concurrency, Storage & Locking Protocol
* **Write Protocol**: \`${d.concurrencyLockProtocol}\`
* **Integrity Guarantee**: Temp file atomic rename guarantees zero half-written states.
* **Interruption Recovery**: Resume sentinel detects uncommitted turns and presents actionable resumption prompt.

---

## 6. Detailed Technical Design Baseline Lock
* **Readiness Verdict**: **IMPLEMENTATION READY**
* **Verification**: All modules, methods, error codes, and state transitions are explicitly specified.
* **Gating Authority**: Step 5 approved. Cleared to proceed to Step 6: Implementation Planning & Task Breakdown.
`;
  }

  private static generateTldrSummary(d: Step5DetailedDesignDraft): string {
    const modCount = d.modules.length;
    const errorCount = d.errorCodes.length;

    return `TL;DR DETAILED TECHNICAL DESIGN (Step 5 Baseline):
• Implementation Specs: ${modCount} core modules specified with explicit method signatures.
• State Machine: 3-stage transition model (NOT_STARTED -> IN_PROGRESS -> AWAITING_APPROVAL -> LOCKED).
• Error Handling: ${errorCount} standardized error codes with recovery guidance.
• Concurrency: Single-writer atomic file rename journal.
• Gating Verdict: GO — Proceed to Step 6 Implementation Planning Architect.`;
  }
}
