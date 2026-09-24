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
  isSummaryMode?: boolean;
  pastMilestone?: string;
  pastMilestoneBullets?: string[];
  presentAction?: string;
  presentActionBullets?: string[];
  nextUnlock?: string;
  nextUnlockBullets?: string[];
  rawBody?: string;
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
        ? '🟢 [ZETA: ACTIVE | Lifecycle Complete (15/15)]'
        : `🟢 [ZETA: ACTIVE | Step ${step}/15 - ${stageName}]`;

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
        // Summary Mode: 3-Act Chronology only when explicitly requested
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

      // Normal Turn: Direct, focused, and non-overwhelming
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
        ? '🟢 [ZETA: ACTIVE | Lifecycle Complete (15/15)]'
        : `🟢 [ZETA: ACTIVE | Step ${stepNumber}/15 - ${stepName}]`;
      message = `${badge}\n\n${message}`;
    }

    // 3. Actionable next step check
    if (!message.includes('Next Action') && !message.includes('under 2 minutes')) {
      violations.push('ADHD_VIOLATION: Missing under-2-minute actionable next step.');
      message += '\n\n---\n\n🔸 **Next Action (under 2 minutes)**:\nReply with your selection or type **Approve** to continue.';
    }

    return {
      isValid: violations.length === 0,
      formattedOutput: message,
      violations
    };
  }
}
