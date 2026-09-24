/**
 * DriftInterceptor — Conversational drift interception layer.
 *
 * Wraps IntentComparator and generates a natural-language, non-robotic prompt
 * when drift exceeds the confidence threshold. Designed to ask, never accuse.
 */

import * as fs from 'fs';
import { IntentComparator, DriftSignal } from './intent-comparator.js';

export interface DriftInterception {
  /** Whether drift was significant enough to intercept the user's flow. */
  shouldIntercept: boolean;
  /** Natural language question to pose to the user about the detected drift. */
  conversationalPrompt: string;
  /** The underlying drift signal with full analysis details. */
  driftSignal: DriftSignal;
}

export class DriftInterceptor {
  /** Default confidence threshold below which drift is ignored. */
  public static readonly DEFAULT_THRESHOLD = 0.6;

  /**
   * Domain-specific conversational templates for drift interception prompts.
   */
  private static readonly DOMAIN_TEMPLATES: Record<string, string> = {
    scope: 'This request touches on areas we explicitly placed **out of scope** in our agreed baseline.',
    techStack: 'This introduces **technologies** not part of our locked tech stack selection.',
    requirements: 'This appears to **change or remove** something we agreed on in our locked requirements.'
  };

  /**
   * Evaluates user input against locked baselines and generates a conversational
   * interception prompt if drift is detected above the threshold.
   *
   * Returns shouldIntercept=false if drift confidence is below the threshold,
   * allowing the agent to proceed normally.
   */
  public static evaluate(
    userInput: string,
    step0Tldr: string,
    step1Tldr: string,
    lockedScopes: string[],
    lockedNonGoals: string[],
    confidenceThreshold: number = DriftInterceptor.DEFAULT_THRESHOLD
  ): DriftInterception {
    const driftSignal = IntentComparator.compare(
      userInput,
      step0Tldr,
      step1Tldr,
      lockedScopes,
      lockedNonGoals
    );

    if (!driftSignal.isDrift || driftSignal.confidence < confidenceThreshold) {
      return {
        shouldIntercept: false,
        conversationalPrompt: '',
        driftSignal
      };
    }

    // Build domain-specific explanation
    const domainExplanations = driftSignal.divergedDomains
      .map(d => this.DOMAIN_TEMPLATES[d] || `Potential divergence detected in **${d}**.`)
      .slice(0, 3);

    const domainText = domainExplanations.join(' Additionally, ');

    const prompt = [
      `⚠️ **Drift Detected** (confidence: ${Math.round(driftSignal.confidence * 100)}%)`,
      '',
      domainText,
      '',
      `> ${driftSignal.explanation}`,
      '',
      '**Did your project goals change, or was this unintentional?**',
      '',
      '- Reply **"Yes, change it"** to trigger an Impact Cascade Analysis across all affected locked stages.',
      '- Reply **"No, mistake"** to stay on the current agreed baseline.',
    ].join('\n');

    return {
      shouldIntercept: true,
      conversationalPrompt: prompt,
      driftSignal
    };
  }

  /**
   * Helper to load locked boundaries and evaluate drift for a workspace.
   * If Step 0 is not locked yet, returns shouldIntercept: false.
   */
  public static evaluateWorkspace(
    workspaceRoot: string,
    userInput: string,
    confidenceThreshold: number = DriftInterceptor.DEFAULT_THRESHOLD
  ): DriftInterception {
    try {
      const statePath = `${workspaceRoot}/.zeta/state.json`;
      if (!fs.existsSync(statePath)) {
        return {
          shouldIntercept: false,
          conversationalPrompt: '',
          driftSignal: { isDrift: false, confidence: 0, divergedDomains: [], explanation: '' }
        };
      }

      const raw = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(raw);
      if (!state.lockedSteps || !state.lockedSteps.includes(0)) {
        return {
          shouldIntercept: false,
          conversationalPrompt: '',
          driftSignal: { isDrift: false, confidence: 0, divergedDomains: [], explanation: '' }
        };
      }

      const step0Tldr = state.stepSummaries?.['step_0']?.summary || '';
      const step1Tldr = state.stepSummaries?.['step_1']?.summary || '';

      const { lockedScopes, lockedNonGoals } = this.extractBoundaries(workspaceRoot, step0Tldr);

      return this.evaluate(userInput, step0Tldr, step1Tldr, lockedScopes, lockedNonGoals, confidenceThreshold);
    } catch {
      return {
        shouldIntercept: false,
        conversationalPrompt: '',
        driftSignal: { isDrift: false, confidence: 0, divergedDomains: [], explanation: '' }
      };
    }
  }

  /**
   * Extracts scope boundaries from docs/PROJECT_INTENT.md or step0Tldr.
   */
  public static extractBoundaries(
    workspaceRoot: string,
    step0Tldr: string
  ): { lockedScopes: string[]; lockedNonGoals: string[] } {
    const lockedScopes: string[] = [];
    const lockedNonGoals: string[] = [];

    const intentDocPath = `${workspaceRoot}/docs/PROJECT_INTENT.md`;
    if (fs.existsSync(intentDocPath)) {
      try {
        const content = fs.readFileSync(intentDocPath, 'utf8');

        // Parse "* **Explicitly Out-of-Scope**:" section
        const outOfScopeMatch = content.match(/Explicitly Out-of-Scope\*\*:\s*([\s\S]*?)(?:\n\s*\*\s*\*\*|\n---|\n##|$)/i);
        if (outOfScopeMatch) {
          const lines = outOfScopeMatch[1].split('\n');
          for (const line of lines) {
            const item = line.replace(/^[\s*\-]+/, '').trim();
            if (item && item.length > 3) {
              lockedScopes.push(item);
            }
          }
        }

        // Parse Non-Goals section if present
        const nonGoalsMatch = content.match(/Non-Goals.*?\*\*:\s*([\s\S]*?)(?:\n\s*\*\s*\*\*|\n---|\n##|$)/i);
        if (nonGoalsMatch) {
          const lines = nonGoalsMatch[1].split('\n');
          for (const line of lines) {
            const item = line.replace(/^[\s*\-]+/, '').trim();
            if (item && item.length > 3) {
              lockedNonGoals.push(item);
            }
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Fallback or supplement from step0Tldr
    if (lockedScopes.length === 0 && step0Tldr) {
      const tldrMatch = step0Tldr.match(/Strictly Out-of-Scope:\s*([^\n•]+)/i);
      if (tldrMatch) {
        const items = tldrMatch[1].split(/,|;/).map(s => s.trim()).filter(s => s.length > 3);
        lockedScopes.push(...items);
      }
    }

    return { lockedScopes, lockedNonGoals };
  }
}
