/**
 * ImpactCascadeAnalyzer — Multi-stage downstream impact analysis.
 *
 * Given a confirmed drift signal, walks all locked lifecycle stages
 * and determines which are directly or indirectly impacted by the drift.
 */

import { DriftSignal } from './intent-comparator.js';
import { CANONICAL_LIFECYCLE, LifecycleStageDefinition } from '../lifecycle/lifecycle-map.js';

export interface CascadeImpact {
  /** The lifecycle step number (0–14). */
  stepNumber: number;
  /** Human-readable step name. */
  stepName: string;
  /** Path to the step's authoritative artifact. */
  artifactPath: string;
  /** DIRECT = drift keywords found in step's TL;DR; INDIRECT = depends on a DIRECT step; NONE = unaffected. */
  impactLevel: 'DIRECT' | 'INDIRECT' | 'NONE';
  /** Human-readable description of why this step is impacted. */
  impactDescription: string;
}

export interface CascadeReport {
  /** Description of the drift that triggered this cascade. */
  triggerDescription: string;
  /** Impact analysis for each locked step. */
  affectedSteps: CascadeImpact[];
  /** Count of steps with DIRECT or INDIRECT impact. */
  totalAffected: number;
  /** Whether amendment (rollback) is recommended. */
  requiresAmendment: boolean;
}

export class ImpactCascadeAnalyzer {
  /**
   * Extracts lowercase key terms from a text for matching.
   */
  private static extractTerms(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
  }

  /**
   * Checks if a step's summary contains terms related to the diverged domains.
   */
  private static checkStepImpact(
    stepSummary: string,
    divergedDomains: string[],
    driftExplanation: string
  ): { isImpacted: boolean; reason: string } {
    const summaryTerms = this.extractTerms(stepSummary);
    const driftTerms = this.extractTerms(driftExplanation);

    // Domain-specific keyword sets
    const domainKeywords: Record<string, string[]> = {
      scope: ['scope', 'boundary', 'feature', 'requirement', 'constraint', 'goal', 'intent'],
      techStack: ['technology', 'framework', 'runtime', 'database', 'storage', 'stack', 'language', 'library', 'dependency'],
      requirements: ['requirement', 'functional', 'specification', 'baseline', 'acceptance', 'criteria']
    };

    for (const domain of divergedDomains) {
      const keywords = domainKeywords[domain] || [];
      const domainMatch = keywords.some(kw => summaryTerms.includes(kw));
      const driftMatch = driftTerms.some(dt => summaryTerms.includes(dt));

      if (domainMatch || driftMatch) {
        return {
          isImpacted: true,
          reason: `Step references ${domain}-related terms that overlap with the detected drift.`
        };
      }
    }

    return { isImpacted: false, reason: '' };
  }

  /**
   * Analyzes all locked downstream steps to determine cascade impact.
   *
   * Strategy:
   * 1. For each diverged domain, scan locked step summaries for keyword overlap
   * 2. Mark matching steps as DIRECT
   * 3. Mark steps that depend on a DIRECT step (via prerequisite chain) as INDIRECT
   * 4. Generate human-readable cascade report
   */
  public static analyze(
    driftSignal: DriftSignal,
    lockedStepSummaries: Record<string, { summary: string; artifactPath: string }>,
    lifecycleMap: readonly LifecycleStageDefinition[] = CANONICAL_LIFECYCLE
  ): CascadeReport {
    const impacts: CascadeImpact[] = [];
    const directSteps = new Set<number>();

    // Pass 1: Find DIRECT impacts
    for (const stageDef of lifecycleMap) {
      const stepKey = `step_${stageDef.stage}`;
      const stepData = lockedStepSummaries[stepKey];

      if (!stepData) {
        // Step not locked, skip
        continue;
      }

      const check = this.checkStepImpact(
        stepData.summary,
        driftSignal.divergedDomains,
        driftSignal.explanation
      );

      if (check.isImpacted) {
        directSteps.add(stageDef.stage);
        impacts.push({
          stepNumber: stageDef.stage,
          stepName: stageDef.agentName,
          artifactPath: stepData.artifactPath,
          impactLevel: 'DIRECT',
          impactDescription: check.reason
        });
      }
    }

    // Pass 2: Find INDIRECT impacts (any locked step that depends on a DIRECT step)
    for (const stageDef of lifecycleMap) {
      const stepKey = `step_${stageDef.stage}`;
      const stepData = lockedStepSummaries[stepKey];

      if (!stepData || directSteps.has(stageDef.stage)) continue;

      // A step is INDIRECT if any of its prerequisites are DIRECT
      const hasDirectPrereq = Array.from(directSteps).some(ds => ds < stageDef.stage);
      if (hasDirectPrereq) {
        impacts.push({
          stepNumber: stageDef.stage,
          stepName: stageDef.agentName,
          artifactPath: stepData.artifactPath,
          impactLevel: 'INDIRECT',
          impactDescription: `Depends on directly impacted Step(s): ${Array.from(directSteps).filter(d => d < stageDef.stage).join(', ')}.`
        });
      }
    }

    // Sort by step number
    impacts.sort((a, b) => a.stepNumber - b.stepNumber);

    const totalAffected = impacts.filter(i => i.impactLevel !== 'NONE').length;

    return {
      triggerDescription: driftSignal.explanation,
      affectedSteps: impacts,
      totalAffected,
      requiresAmendment: totalAffected > 0
    };
  }
}
