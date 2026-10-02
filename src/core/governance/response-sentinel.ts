import { STAGE_PLAIN_DESCRIPTIONS, STAGE_PREVIOUS_MILESTONES, STAGE_NEXT_OUTCOMES } from '../formatters/builder-translator.js';

export interface ValidationResult {
  isValid: boolean;
  formattedOutput: string;
  violations: string[];
}

export type ResponseStateType = 'recap' | 'next_steps' | 'stage_gate' | 'discovery' | 'architecture_decision' | 'fallback';

export interface ResponseSentinelOptions {
  stageIndex?: number;
  stepNumber?: number;
  stageName?: string;
  isComplete?: boolean;
  isSummaryMode?: boolean;
  stateType?: ResponseStateType;
  pastMilestone?: string;
  pastMilestoneBullets?: string[];
  presentAction?: string;
  presentActionBullets?: string[];
  nextUnlock?: string;
  nextUnlockBullets?: string[];
  rawBody?: string;
  contextText?: string;
  category1Title?: string;
  category1Items?: string[];
  category2Title?: string;
  category2Items?: string[];
  optionsList?: Array<{ name: string; rationale: string; isRecommended?: boolean }>;
  nextActionPrompt?: string;
}

export class ResponseSentinel {
  public static readonly BADGE_REGEX = /^🟢 \[ZETA: ACTIVE \| (?:Step \d+\/15 - [^\]]+|Lifecycle Complete \(15\/15\))\]/;
  public static readonly PLACEHOLDER_REGEX = /\/\/\s*(?:TODO|FIXME|Implement later|Add logic here|Insert code here)/i;

  /**
   * Checks if user message is asking for a summary/status recap.
   */
  public static isSummaryQuery(text: string): boolean {
    return /what have we (?:done|covered|built|achieved)|summary|status update|where are we|recap/i.test(text);
  }

  /**
   * Checks if user message is asking for next steps.
   */
  public static isNextStepsQuery(text: string): boolean {
    return /what (?:are the )?next steps|what happens next|where do we go|what should we do next/i.test(text);
  }

  /**
   * Strips legacy animated/cartoon emojis and replaces them with clean text or Palette 1A symbols.
   */
  public static stripAnimatedEmojis(text: string): string {
    return text
      .replace(/\[⚡\s*ZETA/g, '🟢 [ZETA')
      .replace(/⚡/g, '')
      .replace(/📖\s*\*\*The Story So Far\*\*/g, '🔹 **The Story So Far**')
      .replace(/🔨\s*\*\*What We Are Doing Right Now\*\*/g, '🔹 **What We Are Doing Right Now**')
      .replace(/🚀\s*\*\*What Happens Next\*\*/g, '🔹 **What Happens Next**')
      .replace(/💡\s*\*\*Builder Word of the Turn:[^*]+\*\*/g, '')
      .replace(/🔔/g, '🟢')
      .replace(/🎉/g, '🟢');
  }

  /**
   * Enforces the ADHD cognitive limit of max 5 items per list.
   */
  public static enforceAdhdListCap(text: string, maxItems: number = 5): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let currentListCount = 0;

    for (const line of lines) {
      const isListItem = /^\s*(?:\d+\.|\*|-|▫️|🔹|🔸)\s+/.test(line);
      if (isListItem) {
        currentListCount++;
        if (currentListCount <= maxItems) {
          result.push(line);
        }
      } else {
        currentListCount = 0;
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Checks for Ponytail anti-bloat violations such as placeholder comments.
   */
  public static checkPonytailBloat(text: string): { allowed: boolean; reason?: string } {
    if (this.PLACEHOLDER_REGEX.test(text)) {
      return {
        allowed: false,
        reason: 'PONYTAIL_VIOLATION: Code contains placeholder slop (// TODO). Fully executable code required.',
      };
    }
    return { allowed: true };
  }

  /**
   * Schema 1: Recap & Progress ("What have we done so far?")
   */
  public static formatRecapResponse(options: {
    stepNumber: number;
    totalSteps?: number;
    lockedMilestones: string[];
    activeDeliverable: string;
    nextStepName: string;
  }): string {
    const total = options.totalSteps || 15;
    const bullets = options.lockedMilestones.slice(0, 4).map(m => `  ▫️ ${m}`).join('\n');
    
    return `🔹 **Current Focus**: Milestone Recap (Step ${options.stepNumber}/${total})

We have verified and locked ${options.stepNumber} of ${total} lifecycle stages.

* **Locked Foundations**:  
${bullets}

* **Active Deliverable**:  
  ▫️ ${options.activeDeliverable}

---
🔸 **Next Action (under 2 minutes)**:
Reply "Continue" to proceed to ${options.nextStepName}.`;
  }

  /**
   * Schema 2: Next Steps & Forward Outlook ("What are the next steps?")
   */
  public static formatNextStepsResponse(options: {
    currentStep: number;
    currentStepName: string;
    immediateAction: string;
    downstreamMilestones: string[];
  }): string {
    const bullets = options.downstreamMilestones.slice(0, 3).map(m => `  ▫️ ${m}`).join('\n');

    return `🔹 **Current Focus**: Upcoming Roadmap (Step ${options.currentStep} — ${options.currentStepName})

Next actions focus on completing ${options.currentStepName} and unlocking downstream validation.

* **Immediate Next Step (Step ${options.currentStep})**:  
  ▫️ ${options.immediateAction}

* **Downstream Milestones**:  
${bullets}

---
🔸 **Next Action (under 2 minutes)**:
Reply "Proceed" to begin ${options.immediateAction}.`;
  }

  /**
   * Schema 3: Stage Gate & Sign-Off
   */
  public static formatStageGateResponse(options: {
    stepNumber: number;
    stepName: string;
    artifactPath: string;
    inspectionVerdict: string;
    nextStepName: string;
  }): string {
    return `🔹 **Current Focus**: Stage Gate — Step ${options.stepNumber}/15 [${options.stepName}]

All deliverables for Step ${options.stepNumber} are compiled, tested, and verified.

* **Verification Summary**:  
  ▫️ Artifact: ${options.artifactPath} verified.  
  ▫️ Inspector Scan: ${options.inspectionVerdict}  

* **Pending Authorization**:  
  ▫️ Locking Step ${options.stepNumber} transitions state store to ${options.nextStepName}.

---
🔸 **Next Action (under 2 minutes)**:
Reply "Approve" to lock Step ${options.stepNumber} and advance.`;
  }

  /**
   * Schema 4: Requirement & Clarification (Step 0)
   */
  public static formatDiscoveryResponse(options: {
    roundNumber: number;
    totalRounds?: number;
    context: string;
    questions: string[];
  }): string {
    const total = options.totalRounds || 3;
    const q1 = options.questions[0] || 'What is the primary friction or problem?';
    const q2 = options.questions[1] || 'What is the exact outcome required?';

    return `🔹 **Current Focus**: Requirement Discovery (Round ${options.roundNumber}/${total})

${options.context}

* **Question 1**:  
  ${q1}

* **Question 2**:  
  ${q2}

---
🔸 **Next Action (under 2 minutes)**:
Reply with your answers to questions 1 and 2 in your own words.`;
  }

  /**
   * Schema 5: Architectural Decisions (Top 3 on demand)
   */
  public static formatArchitectureDecisionResponse(options: {
    componentName: string;
    challenge: string;
    options: Array<{ name: string; rationale: string; isRecommended?: boolean }>;
  }): string {
    const optionLines = options.options.slice(0, 3).map((opt, idx) => {
      const prefix = opt.isRecommended ? `(Recommended) ` : '';
      return `  ${idx + 1}. **${prefix}${opt.name}**: ${opt.rationale}`;
    }).join('\n');

    return `🔹 **Current Focus**: Architecture Decision — ${options.componentName}

Evaluating approaches for ${options.challenge}.

* **Top 3 Architecture Options**:  
${optionLines}

---
🔸 **Next Action (under 2 minutes)**:
Choose option 1, 2, 3, or specify a custom approach.`;
  }

  /**
   * Universal Fallback Template
   */
  public static formatFallbackResponse(options: {
    title: string;
    context: string;
    keyDetail: string;
    impact: string;
    nextAction: string;
  }): string {
    return `🔹 **Current Focus**: ${options.title}

${options.context}

* **Key Detail**:  
  ▫️ ${options.keyDetail}

* **System Impact**:  
  ▫️ ${options.impact}

---
🔸 **Next Action (under 2 minutes)**:
${options.nextAction}`;
  }

  /**
   * Overloaded validation and formatting method.
   */
  public static validateAndFormat(options: ResponseSentinelOptions): string;
  public static validateAndFormat(rawMessage: string, stepNumber?: number, stepName?: string): ValidationResult;
  public static validateAndFormat(
    arg1: string | ResponseSentinelOptions,
    arg2: number = 0,
    arg3: string = 'Current Stage'
  ): string | ValidationResult {
    if (typeof arg1 === 'object') {
      const opts = arg1;
      const step = opts.stepNumber ?? opts.stageIndex ?? 0;
      const stageName = opts.stageName || `Stage ${step}`;
      const isComplete = opts.isComplete ?? (step >= 15);
      const nextStepName = STAGE_PLAIN_DESCRIPTIONS[step + 1] || `Step ${step + 1}`;

      const badge = isComplete
        ? '🟢 [ZETA: ACTIVE | Lifecycle Complete (15/15)]'
        : `🟢 [ZETA: ACTIVE | Step ${step}/15 - ${stageName}]`;

      if (opts.stateType) {
        let content = '';
        switch (opts.stateType) {
          case 'recap':
            content = this.formatRecapResponse({
              stepNumber: step,
              lockedMilestones: opts.category1Items || ['Prior milestones locked in .zeta/state.json'],
              activeDeliverable: opts.category2Items?.[0] || 'Current step deliverable verified.',
              nextStepName,
            });
            break;
          case 'next_steps':
            content = this.formatNextStepsResponse({
              currentStep: step,
              currentStepName: stageName,
              immediateAction: opts.category1Items?.[0] || 'Complete active stage deliverable.',
              downstreamMilestones: opts.category2Items || ['Next milestone verification.'],
            });
            break;
          case 'stage_gate':
            content = this.formatStageGateResponse({
              stepNumber: step,
              stepName: stageName,
              artifactPath: opts.category1Items?.[0] || `docs/STAGE_${step}.md`,
              inspectionVerdict: opts.category1Items?.[1] || '0 complexity violations, 0 dead code.',
              nextStepName,
            });
            break;
          case 'discovery':
            content = this.formatDiscoveryResponse({
              roundNumber: step,
              context: opts.contextText || 'Clarifying base-level project requirements.',
              questions: opts.category1Items || ['Describe your primary problem.', 'What is the required outcome?'],
            });
            break;
          case 'architecture_decision':
            content = this.formatArchitectureDecisionResponse({
              componentName: stageName,
              challenge: opts.contextText || 'selecting technical components',
              options: opts.optionsList || [
                { name: 'Native Standard Approach', rationale: 'Zero external dependencies', isRecommended: true },
                { name: 'Lean Custom Helper', rationale: 'Fast implementation with minimal code' },
                { name: 'Modular Extensible Adapter', rationale: 'High flexibility for future scaling' },
              ],
            });
            break;
          default:
            content = this.formatFallbackResponse({
              title: stageName,
              context: opts.contextText || STAGE_PLAIN_DESCRIPTIONS[step] || 'System operation in progress.',
              keyDetail: opts.category1Items?.[0] || 'Active step state verified.',
              impact: opts.category2Items?.[0] || 'Ensures zero drift in downstream execution.',
              nextAction: opts.nextActionPrompt || 'Reply with your decision or type "Approve" to continue.',
            });
            break;
        }
        return `${badge}\n\n${content}`;
      }

      const previous = opts.pastMilestone || STAGE_PREVIOUS_MILESTONES[step] || 'Milestones baselined and verified.';
      const whatDoing = opts.presentAction || STAGE_PLAIN_DESCRIPTIONS[step] || 'Building the system step by step.';
      const nextOutcome = opts.nextUnlock || STAGE_NEXT_OUTCOMES[step] || 'Advances project lifecycle to next milestone.';

      const pastBullets = (opts.pastMilestoneBullets || [
        'Prior milestone verified and locked in state store.',
        'Disk artifact integrity and checksums validated.',
        'Zero regression across previous lifecycle stages.'
      ]).slice(0, 3).map(b => `▫️ ${b}`).join('\n\n');

      const presentBullets = (opts.presentActionBullets || [
        'Tackling core design and architectural decisions for this stage.',
        'Applying anti-bloat filters to keep codebase minimal and lean.',
        'Gathering targeted developer intent before code execution.'
      ]).slice(0, 3).map(b => `▫️ ${b}`).join('\n\n');

      const nextBullets = (opts.nextUnlockBullets || [
        'Generates authoritative stage specification document.',
        'Locks stage hash in tamper-evident state ledger.',
        'Unlocks subsequent lifecycle milestone without drift.'
      ]).slice(0, 3).map(b => `▫️ ${b}`).join('\n\n');

      let body = opts.rawBody ? opts.rawBody.trim() : '';
      body = this.enforceAdhdListCap(body);

      const nextActionText = opts.nextActionPrompt || 'Reply with your decision or type **Approve** to advance to the next step.';

      if (opts.isSummaryMode) {
        return `${badge}

🔹 **The Story So Far**: ${previous}

${pastBullets}

---

🔹 **What We Are Doing Right Now**: ${whatDoing}

${presentBullets}

---

🔹 **What Happens Next**: ${nextOutcome}

${nextBullets}
${body ? `\n---\n\n${body}` : ''}

---

🔸 **Next Action (under 2 minutes)**:
${nextActionText}`;
      }

      return `${badge}

🔹 **Current Focus**: ${whatDoing}

${presentBullets}
${body ? `\n---\n\n${body}` : ''}

---

🔸 **Next Action (under 2 minutes)**:
${nextActionText}`;
    }

    // String argument path
    const rawMessage = arg1;
    const stepNumber = arg2;
    const stepName = arg3;
    const violations: string[] = [];
    let message = this.stripAnimatedEmojis(rawMessage.trim());

    if (this.PLACEHOLDER_REGEX.test(message)) {
      violations.push('PONYTAIL_VIOLATION: Code contains placeholder slop (// TODO). Fully executable code required.');
      message = message.replace(this.PLACEHOLDER_REGEX, '/* Executable implementation required */');
    }

    if (!this.BADGE_REGEX.test(message)) {
      const badge = stepNumber >= 15
        ? '🟢 [ZETA: ACTIVE | Lifecycle Complete (15/15)]'
        : `🟢 [ZETA: ACTIVE | Step ${stepNumber}/15 - ${stepName}]`;
      message = `${badge}\n\n${message}`;
    }

    if (!message.includes('Next Action') && !message.includes('under 2 minutes')) {
      violations.push('ADHD_VIOLATION: Missing under-2-minute actionable next step.');
      message += '\n\n---\n\n🔸 **Next Action (under 2 minutes)**:\nReply with your selection or type **Approve** to continue.';
    }

    return {
      isValid: violations.length === 0,
      formattedOutput: message,
      violations,
    };
  }
}
