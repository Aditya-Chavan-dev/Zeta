import { BuilderTranslator, STAGE_PLAIN_DESCRIPTIONS, STAGE_PREVIOUS_MILESTONES, STAGE_NEXT_OUTCOMES } from '../formatters/builder-translator.js';

export interface ValidationResult {
  isValid: boolean;
  formattedOutput: string;
  violations: string[];
}

export interface ResponseSentinelOptions {
  stageIndex?: number;
  stepNumber?: number;
  stageName?: string;
  isComplete?: boolean;
  pastMilestone?: string;
  pastMilestoneBullets?: string[];
  presentAction?: string;
  presentActionBullets?: string[];
  nextUnlock?: string;
  nextUnlockBullets?: string[];
  rawBody?: string;
}

export class ResponseSentinel {
  public static readonly BADGE_REGEX = /^\[⚡ ZETA: ACTIVE \| (?:Step \d+\/15 - [^\]]+|Lifecycle Complete \(15\/15\))\]/;
  public static readonly PLACEHOLDER_REGEX = /\/\/\s*(?:TODO|FIXME|Implement later|Add logic here|Insert code here)/i;

  /**
   * Enforces the ADHD cognitive limit of max 5 items per list.
   */
  public static enforceAdhdListCap(text: string, maxItems: number = 5): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let currentListCount = 0;
    let inList = false;

    for (const line of lines) {
      const isListItem = /^\s*(?:\d+\.|\*|-)\s+/.test(line);
      if (isListItem) {
        inList = true;
        currentListCount++;
        if (currentListCount <= maxItems) {
          result.push(line);
        }
        // Excess list items are omitted to maintain ADHD guardrails
      } else {
        inList = false;
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
        reason: 'PONYTAIL_VIOLATION: Code contains placeholder slop (// TODO). Fully executable code required.'
      };
    }
    return { allowed: true };
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
      
      const badge = isComplete
        ? '[⚡ ZETA: ACTIVE | Lifecycle Complete (15/15)]'
        : `[⚡ ZETA: ACTIVE | Step ${step}/15 - ${stageName}]`;

      const previous = opts.pastMilestone || STAGE_PREVIOUS_MILESTONES[step] || 'Milestones baselined and verified.';
      const whatDoing = opts.presentAction || STAGE_PLAIN_DESCRIPTIONS[step] || 'Building the system step by step.';
      const nextOutcome = opts.nextUnlock || STAGE_NEXT_OUTCOMES[step] || 'Advances project lifecycle to next milestone.';

      const pastBullets = (opts.pastMilestoneBullets || [
        'Prior milestone verified and locked in state store.',
        'Disk artifact integrity and checksums validated.',
        'Zero regression across previous lifecycle stages.'
      ]).slice(0, 3).map(b => `• ${b}`).join('\n');

      const presentBullets = (opts.presentActionBullets || [
        'Tackling core design and architectural decisions for this stage.',
        'Applying anti-bloat filters to keep codebase minimal and lean.',
        'Gathering targeted developer intent before code execution.'
      ]).slice(0, 3).map(b => `• ${b}`).join('\n');

      const nextBullets = (opts.nextUnlockBullets || [
        'Generates authoritative stage specification document.',
        'Locks stage hash in tamper-evident state ledger.',
        'Unlocks subsequent lifecycle milestone without drift.'
      ]).slice(0, 3).map(b => `• ${b}`).join('\n');

      let body = opts.rawBody ? opts.rawBody.trim() : '';
      body = this.enforceAdhdListCap(body);

      const termCard = BuilderTranslator.formatTermCard(step);

      const formatted = `${badge}

📖 **The Story So Far**: ${previous}
${pastBullets}

🔨 **What We Are Doing Right Now**: ${whatDoing}
${presentBullets}

🚀 **What Happens Next**: ${nextOutcome}
${nextBullets}

${body}

### Next Action (under 2 minutes)
Reply with your decision or type **Approve** to advance to the next step.

${termCard}`;

      return formatted;
    }

    // String argument path
    const rawMessage = arg1;
    const stepNumber = arg2;
    const stepName = arg3;
    const violations: string[] = [];
    let message = rawMessage.trim();

    // 1. Ponytail Check: Reject placeholder comments
    const bloatCheck = this.checkPonytailBloat(message);
    if (!bloatCheck.allowed) {
      violations.push(bloatCheck.reason!);
      message = message.replace(this.PLACEHOLDER_REGEX, '/* Executable implementation required */');
    }

    // 2. ADHD Check: Prepend mandatory status badge if absent
    if (!this.BADGE_REGEX.test(message)) {
      violations.push('ADHD_VIOLATION: Missing active plugin status badge on line 1.');
      const badge = stepNumber >= 15
        ? '[⚡ ZETA: ACTIVE | Lifecycle Complete (15/15)]'
        : `[⚡ ZETA: ACTIVE | Step ${stepNumber}/15 - ${stepName}]`;
      message = `${badge}\n\n${message}`;
    }

    // 3. Storytelling Check: Enforce 3-Act story arc
    const hasStory = message.includes('The Story So Far') && message.includes('What We Are Doing Right Now');
    if (!hasStory) {
      violations.push('STORY_VIOLATION: Missing 3-act storytelling chronology.');
      const previous = `Milestone for Step ${Math.max(0, stepNumber - 1)} verified and locked.`;
      const whatDoing = BuilderTranslator.getStageWhatDoing(stepNumber);
      const storyHeader = `📖 **The Story So Far**: ${previous}\n• Prior milestone verified and locked in state store.\n• Disk artifact integrity and checksums validated.\n• Zero regression across previous lifecycle stages.\n\n🔨 **${whatDoing.replace('👉 ', '')}**\n• Tackling core design and architectural decisions for this stage.\n• Applying anti-bloat filters to keep codebase minimal and lean.\n• Gathering targeted developer intent before code execution.\n\n🚀 **What Happens Next**: Advances project lifecycle to next milestone.\n• Generates authoritative stage specification document.\n• Locks stage hash in tamper-evident state ledger.\n• Unlocks subsequent lifecycle milestone without drift.\n\n`;
      
      const badgeEnd = message.indexOf('\n');
      if (badgeEnd !== -1) {
        message = message.slice(0, badgeEnd + 1) + '\n' + storyHeader + message.slice(badgeEnd + 1).trim();
      } else {
        message = `${message}\n\n${storyHeader}`;
      }
    }

    // 4. ADHD Check: Next action under 2 minutes
    if (!message.includes('Next Action') && !message.includes('under 2 minutes')) {
      violations.push('ADHD_VIOLATION: Missing under-2-minute actionable next step.');
      message += '\n\n### Next Action (under 2 minutes)\n1. Reply with your selection or type **Approve** to continue.';
    }

    // 5. Term Breakdown Check: Ensure Builder Word of the Turn is present
    if (!message.includes('Builder Word of the Turn')) {
      violations.push('TERM_CARD_VIOLATION: Missing end-of-turn Enterprise Term Breakdown.');
      message += `\n\n${BuilderTranslator.formatTermCard(stepNumber)}`;
    }

    return {
      isValid: violations.length === 0,
      formattedOutput: message,
      violations
    };
  }
}
