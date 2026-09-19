/**
 * BuilderTranslator: Converts academic/enterprise software governance jargon
 * into clear, actionable builder language with a 3-act storytelling structure
 * and an educational end-of-turn Enterprise Term Breakdown.
 */

export const STAGE_PLAIN_DESCRIPTIONS: Record<number, string> = {
  0: "Nailing down your project idea, who it's for, and the exact problem it solves.",
  1: "Listing the must-have features and rules before touching any code.",
  2: "Checking what could break, technical limits, and things that might slow you down.",
  3: "Picking the best programming languages, libraries, and tools for the job.",
  4: "Designing how the main parts of your app connect and talk to each other.",
  5: "Mapping out the exact functions, data models, and folder structure.",
  6: "Breaking the build into bite-sized, step-by-step tasks.",
  7: "Writing the core logic and assembling the application.",
  8: "Testing the code to make sure nothing crashes under weird inputs.",
  9: "Getting the app ready to install, run, or deploy with zero headaches.",
  10: "Setting up crash recovery, error logging, and health monitoring.",
  11: "Locking down data privacy, secret keys, and protecting against hacked inputs.",
  12: "Deciding how to update versions and retire old features smoothly.",
  13: "Writing dead-simple documentation so anyone can run and understand the project.",
  14: "Reviewing what went well and creating an evolution checklist for future versions."
};

export const STAGE_PREVIOUS_MILESTONES: Record<number, string> = {
  0: "Initial project kickoff and raw idea capture.",
  1: "Step 0 verified: Problem statement and target user goals are firmly locked.",
  2: "Step 1 verified: Core features and non-negotiable boundaries are set.",
  3: "Step 2 verified: Technical feasibility and potential risks are mitigated.",
  4: "Step 3 verified: Tech stack, libraries, and runtime tools are chosen.",
  5: "Step 4 verified: High-level system architecture and data flows are mapped.",
  6: "Step 5 verified: Exact data models, interfaces, and function contracts are designed.",
  7: "Step 6 verified: Work breakdown schedule and task milestones are organized.",
  8: "Step 7 verified: Working code constructed and packaged locally.",
  9: "Step 8 verified: Quality assurance and test suites pass with zero regressions.",
  10: "Step 9 verified: Production deployment scripts and environment configs are ready.",
  11: "Step 10 verified: SRE error handling, crash recovery, and health probes are active.",
  12: "Step 11 verified: Security policies, offline privacy, and safe licensing are signed off.",
  13: "Step 12 verified: Versioning rules, backward compatibility, and deprecation policies set.",
  14: "Step 13 verified: Comprehensive developer setup guides and API docs are written."
};

export const STAGE_NEXT_OUTCOMES: Record<number, string> = {
  0: "Unlocks Step 1: Defining the functional requirements and system boundaries.",
  1: "Unlocks Step 2: Stress-testing feasibility and identifying technical risks.",
  2: "Unlocks Step 3: Selecting the fastest, most reliable programming stack.",
  3: "Unlocks Step 4: Drawing the complete multi-tier system architecture.",
  4: "Unlocks Step 5: Specifying exact code interfaces, types, and folder trees.",
  5: "Unlocks Step 6: Creating the phased implementation plan and task checklists.",
  6: "Unlocks Step 7: Writing the core software code brick by brick.",
  7: "Unlocks Step 8: Running rigorous automated QA and edge-case testing.",
  8: "Unlocks Step 9: Preparing automated build packaging and release scripts.",
  9: "Unlocks Step 10: Setting up site reliability engineering and crash logging.",
  10: "Unlocks Step 11: Auditing security gates, secrets scanning, and data privacy.",
  11: "Unlocks Step 12: Establishing version release and deprecation policies.",
  12: "Unlocks Step 13: Writing complete education and developer handoff guides.",
  13: "Unlocks Step 14: Final project retrospective and continuous improvement handoff to Evo.",
  14: "Project lifecycle complete! 100% verified v1.0 ready for active use and Evo evolution."
};

export interface EnterpriseTerm {
  term: string;
  whatItIs: string;
  whyEnterpriseUsesIt: string;
}

export const STAGE_DEFAULT_TERMS: Record<number, EnterpriseTerm> = {
  0: {
    term: "Project Intent Anchoring",
    whatItIs: "Writing down the exact problem and target user on a stone tablet before buying any tools.",
    whyEnterpriseUsesIt: "Prevents 'feature creep' where teams spend six months building features nobody actually needs."
  },
  1: {
    term: "Functional Requirements (FRs)",
    whatItIs: "A checklist of exactly what the software must do (like 'user can log in') and what it will never do.",
    whyEnterpriseUsesIt: "Ensures developers, testers, and product managers all agree on the finish line before building."
  },
  2: {
    term: "FMEA (Failure Mode & Effects Analysis)",
    whatItIs: "Brainstorming every possible way your software could break and planning the fix beforehand.",
    whyEnterpriseUsesIt: "Prevents multi-million-dollar outages by designing safety nets before going live."
  },
  3: {
    term: "Technology Stack Evaluation",
    whatItIs: "Selecting the right tool for the job based on speed, safety, and team skill rather than internet hype.",
    whyEnterpriseUsesIt: "Guarantees long-term maintainability so the business isn't stuck with abandoned libraries."
  },
  4: {
    term: "C4 Multi-Tier Architecture",
    whatItIs: "Organizing your application into clean layers (Client, Brain, Storage) so parts can change without breaking the whole.",
    whyEnterpriseUsesIt: "Allows massive teams to work on different parts of a system independently without stepping on each other."
  },
  5: {
    term: "Interface Contracts & Type Schemas",
    whatItIs: "Agreeing on the exact shape of data (like an electrical plug and socket) before writing the internal engine.",
    whyEnterpriseUsesIt: "Catches 90% of bugs before code ever runs by making incompatible data shapes impossible to compile."
  },
  6: {
    term: "Work Breakdown Structure (WBS)",
    whatItIs: "Chopping a giant project into bite-sized 30-minute tasks that can be built and tested one by one.",
    whyEnterpriseUsesIt: "Eliminates developer overwhelm and gives exact predictable estimates for shipping software."
  },
  7: {
    term: "Modular Software Construction",
    whatItIs: "Writing code in small, independent Lego blocks that each do one thing cleanly.",
    whyEnterpriseUsesIt: "Makes fixing bugs and testing effortless because every function is isolated."
  },
  8: {
    term: "Verification & Quality Assurance (QA)",
    whatItIs: "Bombarding the code with weird, invalid, and malicious inputs to verify it never crashes.",
    whyEnterpriseUsesIt: "Guarantees that a single customer typo doesn't take down the entire system."
  },
  9: {
    term: "Production Release Gating",
    whatItIs: "An automated security checkpoint that verifies all tests pass and code builds before it can ship.",
    whyEnterpriseUsesIt: "Stops broken code from reaching paying customers by taking human error out of deployment."
  },
  10: {
    term: "WAL (Write-Ahead Logging)",
    whatItIs: "Writing notes on a scratch pad before writing in the main ledger so you never tear a page by mistake.",
    whyEnterpriseUsesIt: "If a server loses power mid-save, it reads the scratch pad and restores data with zero corruption."
  },
  11: {
    term: "STRIDE Threat Modeling",
    whatItIs: "A security checklist that tests against fake users, file tampering, data leaks, and crash attacks.",
    whyEnterpriseUsesIt: "Guarantees customer data and proprietary secrets stay safe from modern cyber threats."
  },
  12: {
    term: "Semantic Versioning & Deprecation Policy",
    whatItIs: "A standardized numbering system (Major.Minor.Patch) giving users advance notice before old features are retired.",
    whyEnterpriseUsesIt: "Prevents breaking client apps when libraries update, preserving customer trust."
  },
  13: {
    term: "Knowledge Transfer & Runbooks",
    whatItIs: "Writing a crystal-clear manual so a brand-new developer can run and debug the app on their first day.",
    whyEnterpriseUsesIt: "Eliminates the 'bus factor'—the company never grinds to a halt if a lead developer leaves."
  },
  14: {
    term: "Post-Mortem & Continuous Improvement",
    whatItIs: "Reviewing what went right, what went wrong, and updating the process so mistakes are never repeated.",
    whyEnterpriseUsesIt: "Builds high-performing engineering teams that get faster and more reliable with every project."
  }
};

export const DEFAULT_STAGE_TERMS = STAGE_DEFAULT_TERMS;

export const JARGON_GLOSSARY: Record<string, string> = {
  'STRIDE Threat Mitigation & Residual Risk Tolerance': 'Security Policy & Vulnerability Gates (STRIDE)',
  'Data Privacy & Local Sandboxing Boundary': 'Data Privacy & Offline Execution Boundary',
  'Open-Source License & SBOM Policy': 'Open-Source Licensing & Safe Packages (SBOM)',
  'Deterministic serialization': 'Saving data in the exact same format every time so nothing scrambles',
  'FMEA Containment Strategy': 'Crash Recovery: what breaks, how bad it is, and how to bounce back',
  'Precondition Sentinel Gating': 'Stage Stop-Sign: blocks downstream steps until prerequisites are locked',
  'WAL Concurrency Mode': 'Concurrent reads and writes without file-locking freeze'
};

export const JARGON_WORD_REPLACEMENTS: Record<string, string> = {
  '\\bAST\\b': 'code structure map',
  '\\bDAG\\b': 'task dependency tree',
  '\\bFMEA\\b': 'failure mode analysis',
  '\\bWAL\\b': 'write-ahead safe log',
  '\\bSTRIDE\\b': 'security risk checklist',
  '\\bSBOM\\b': 'software ingredient bill'
};

export interface BuilderOption {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}

export interface StoryTurnParams {
  stepNumber?: number;
  stageIndex?: number;
  stepName?: string;
  stageName?: string;
  pastMilestone?: string;
  pastMilestoneBullets?: string[];
  presentAction?: string;
  presentActionBullets?: string[];
  nextUnlock?: string;
  nextUnlockBullets?: string[];
  category?: string;
  question?: string;
  mainContent?: string;
  top3Options?: BuilderOption[];
  nextActionPrompt?: string;
  termOverride?: EnterpriseTerm;
  tone?: 'builder' | 'enterprise';
}

export class BuilderTranslator {
  public static getStageWhatDoing(stepNumber: number): string {
    const summary = STAGE_PLAIN_DESCRIPTIONS[stepNumber] || 'Building and refining the project step by step.';
    return `👉 **What we are doing right now**: ${summary}`;
  }

  public static translateCategory(category: string): string {
    return JARGON_GLOSSARY[category] || category;
  }

  /**
   * Replaces raw enterprise/academic acronyms with everyday builder terms.
   */
  public static translateJargon(text: string): string {
    let result = text;
    for (const [pattern, replacement] of Object.entries(JARGON_WORD_REPLACEMENTS)) {
      result = result.replace(new RegExp(pattern, 'g'), replacement);
    }
    return result;
  }

  /**
   * Builds the end-of-turn Enterprise Term Breakdown card.
   */
  public static formatTermCard(stepNumber: number, override?: EnterpriseTerm): string {
    const termInfo = override || STAGE_DEFAULT_TERMS[stepNumber] || STAGE_DEFAULT_TERMS[0];
    return `---
💡 **Builder Word of the Turn: ${termInfo.term}**
• **What it is**: ${termInfo.whatItIs}
• **Why enterprises use it**: ${termInfo.whyEnterpriseUsesIt}`;
  }

  /**
   * Formats a complete 3-act storytelling turn with zero unexplained jargon,
   * clean vertical separation, 3 targeted context bullets per act,
   * and the educational Enterprise Term Breakdown at the bottom.
   */
  public static formatStoryTurn(params: StoryTurnParams): string {
    const step = params.stepNumber ?? params.stageIndex ?? 0;
    const previous = params.pastMilestone || STAGE_PREVIOUS_MILESTONES[step] || "Milestones baselined and verified.";
    const whatDoing = params.presentAction || STAGE_PLAIN_DESCRIPTIONS[step] || "Building the system step by step.";
    const nextOutcome = params.nextUnlock || STAGE_NEXT_OUTCOMES[step] || "Advances to next stage.";

    const pastBullets = (params.pastMilestoneBullets || [
      'Prior milestone verified and locked in state store.',
      'Disk artifact integrity and checksums validated.',
      'Zero regression across previous lifecycle stages.'
    ]).slice(0, 3).map(b => `• ${b}`).join('\n');

    const presentBullets = (params.presentActionBullets || [
      'Tackling core design and architectural decisions for this stage.',
      'Applying anti-bloat filters to keep codebase minimal and lean.',
      'Gathering targeted developer intent before code execution.'
    ]).slice(0, 3).map(b => `• ${b}`).join('\n');

    const nextBullets = (params.nextUnlockBullets || [
      'Generates authoritative stage specification document.',
      'Locks stage hash in tamper-evident state ledger.',
      'Unlocks subsequent lifecycle milestone without drift.'
    ]).slice(0, 3).map(b => `• ${b}`).join('\n');

    const categoryHeader = params.category
      ? `\n### Focus Area: ${this.translateCategory(params.category)}\n`
      : '';

    let optionsSection = '';
    if (params.top3Options && params.top3Options.length > 0) {
      optionsSection = '\n' + params.top3Options.map((opt, i) => {
        const recBadge = opt.recommended ? ' *(Recommended)*' : '';
        return `${i + 1}. **${opt.title}**${recBadge}\n   • **What it does**: ${opt.description}\n   • **Trade-off**: ${opt.tradeOffs}`;
      }).join('\n\n') + '\n\n*Reply with **1**, **2**, or **3**, or describe your own preference:*';
    }

    const questionSection = params.question ? `\n**${params.question}**` : '';
    const mainSection = params.mainContent ? `\n\n${params.mainContent}` : '';
    const nextAction = params.nextActionPrompt || 'Reply with your choice to lock this step.';

    const termCard = this.formatTermCard(step, params.termOverride);

    return `📖 **The Story So Far**: ${previous}
${pastBullets}

🔨 **What We Are Doing Right Now**: ${whatDoing}
${presentBullets}

🚀 **What Happens Next**: ${nextOutcome}
${nextBullets}
${categoryHeader}${questionSection}${mainSection}${optionsSection}

### Next Action (under 2 minutes)
${nextAction}

${termCard}`;
  }

  /**
   * Backward-compatible question formatter.
   */
  public static formatQuestion(params: {
    stepNumber: number;
    category: string;
    question: string;
    top3Options: BuilderOption[];
    tone?: 'builder' | 'enterprise';
  }): string {
    return this.formatStoryTurn({
      stepNumber: params.stepNumber,
      stepName: `Step ${params.stepNumber}`,
      category: params.category,
      question: params.question,
      top3Options: params.top3Options,
      tone: params.tone
    });
  }
}
