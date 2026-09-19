/**
 * BuilderTranslator: Converts academic/enterprise software governance jargon
 * into clear, actionable builder language.
 *
 * Enforces:
 * 1. Mandatory "👉 What this step is doing" 1-line real-world explanation.
 * 2. Plain-English questions with technical terms in parentheses.
 * 3. Real-world builder trade-offs (speed, crash risk, setup effort).
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

export const JARGON_GLOSSARY: Record<string, string> = {
  'STRIDE Threat Mitigation & Residual Risk Tolerance': 'Security Policy & Vulnerability Gates (STRIDE)',
  'Data Privacy & Local Sandboxing Boundary': 'Data Privacy & Offline Execution Boundary',
  'Open-Source License & SBOM Policy': 'Open-Source Licensing & Safe Packages (SBOM)',
  'Deterministic serialization': 'Saving data in the exact same format every time so nothing scrambles',
  'FMEA Containment Strategy': 'Crash Recovery: what breaks, how bad it is, and how to bounce back',
  'Precondition Sentinel Gating': 'Stage Stop-Sign: blocks downstream steps until prerequisites are locked',
  'WAL Concurrency Mode': 'Concurrent reads and writes without file-locking freeze'
};

export interface BuilderOption {
  title: string;
  description: string;
  tradeOffs: string;
  recommended?: boolean;
}

export class BuilderTranslator {
  /**
   * Returns the mandatory 1-line everyday explanation for any stage.
   */
  public static getStageWhatDoing(stepNumber: number): string {
    const summary = STAGE_PLAIN_DESCRIPTIONS[stepNumber] || 'Building and refining the project step by step.';
    return `👉 **What we are doing right now**: ${summary}`;
  }

  /**
   * Translates an enterprise term or category into plain English.
   */
  public static translateCategory(category: string): string {
    return JARGON_GLOSSARY[category] || category;
  }

  /**
   * Formats a stage question with builder-friendly tone and real-world clarity.
   */
  public static formatQuestion(params: {
    stepNumber: number;
    category: string;
    question: string;
    top3Options: BuilderOption[];
    tone?: 'builder' | 'enterprise';
  }): string {
    const tone = params.tone || 'builder';
    const whatDoing = this.getStageWhatDoing(params.stepNumber);
    const categoryName = tone === 'builder' ? this.translateCategory(params.category) : params.category;

    const optionsText = params.top3Options.map((opt, i) => {
      const recBadge = opt.recommended ? ' *(Recommended)*' : '';
      return `${i + 1}. **${opt.title}**${recBadge}\n   • **What it does**: ${opt.description}\n   • **Trade-off**: ${opt.tradeOffs}`;
    }).join('\n\n');

    return `${whatDoing}\n\n### Focus Area: ${categoryName}\n\n**${params.question}**\n\n${optionsText}\n\n*Reply with **1**, **2**, or **3**, or describe your own preference:*`;
  }
}
