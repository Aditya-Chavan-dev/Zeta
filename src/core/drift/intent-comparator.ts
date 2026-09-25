/**
 * IntentComparator — Deterministic semantic drift detector.
 *
 * Compares user input against locked Step 0 (Intent) and Step 1 (Requirements) baselines.
 * Uses keyword extraction, negation detection, and scope boundary cross-checking.
 * No LLM inference — purely deterministic string analysis.
 */

export interface DriftSignal {
  /** Whether drift was detected above the confidence threshold. */
  isDrift: boolean;
  /** Confidence score from 0.0 (no drift) to 1.0 (certain drift). */
  confidence: number;
  /** Domains where divergence was detected (e.g. 'scope', 'techStack', 'requirements'). */
  divergedDomains: string[];
  /** Human-readable explanation of why drift was flagged. */
  explanation: string;
}

export class IntentComparator {
  /**
   * Extracts meaningful noun phrases from text for comparison.
   * Strips common stop words to focus on domain-relevant terms.
   */
  private static extractKeyTerms(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
      'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or',
      'if', 'while', 'about', 'up', 'them', 'this', 'that', 'these', 'those',
      'it', 'its', 'i', 'we', 'you', 'they', 'me', 'us', 'my', 'our',
      'your', 'his', 'her', 'their', 'what', 'which', 'who', 'whom',
      'also', 'want', 'need', 'like', 'make', 'use', 'add', 'get', 'let'
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Checks if any user input terms match items in the out-of-scope or non-goals lists.
   */
  private static checkScopeBoundaryViolation(
    inputTerms: string[],
    outOfScope: string[],
    nonGoals: string[]
  ): { matches: string[]; confidence: number } {
    const excluded = [...outOfScope, ...nonGoals];
    const matches: string[] = [];
    let maxConfidence = 0;

    for (const excludedItem of excluded) {
      const excludedTerms = this.extractKeyTerms(excludedItem);
      const matchedTerms = excludedTerms.filter(et =>
        inputTerms.some(it => it === et || (it.length > 4 && et.includes(it)) || (et.length > 4 && it.includes(et)))
      );

      if (matchedTerms.length > 0) {
        const matchRatio = matchedTerms.length / Math.max(excludedTerms.length, 1);
        // Exact multi-word match is higher confidence than single-word overlap
        const confidence = matchRatio >= 0.5 ? 0.9 : matchRatio >= 0.3 ? 0.7 : 0.5;
        if (confidence > maxConfidence) maxConfidence = confidence;
        matches.push(excludedItem);
      }
    }

    return { matches, confidence: maxConfidence };
  }

  /**
   * Checks if user input introduces technologies or concepts not present in existing baselines.
   */
  private static checkTechDrift(
    inputTerms: string[],
    step0Tldr: string,
    step1Tldr: string
  ): { driftedTerms: string[]; confidence: number } {
    const techKeywords = new Set([
      'redis', 'postgres', 'postgresql', 'mongodb', 'mysql', 'dynamodb', 'firebase',
      'graphql', 'grpc', 'websocket', 'kafka', 'rabbitmq', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda', 'microservice',
      'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxt', 'electron',
      'python', 'rust', 'java', 'csharp', 'swift', 'kotlin', 'ruby',
      'blockchain', 'machine-learning', 'ai-model', 'llm', 'vector-database'
    ]);

    const baselineText = `${step0Tldr} ${step1Tldr}`.toLowerCase();
    const driftedTerms: string[] = [];

    for (const term of inputTerms) {
      if (techKeywords.has(term) && !baselineText.includes(term)) {
        driftedTerms.push(term);
      }
    }

    const confidence = driftedTerms.length > 0 ? Math.min(0.8, 0.5 + driftedTerms.length * 0.1) : 0;
    return { driftedTerms, confidence };
  }

  /**
   * Compares a user's new input against locked baselines to detect semantic drift.
   *
   * Detection strategy (deterministic, no LLM):
   * 1. Extract key noun phrases from user input
   * 2. Cross-reference against lockedScopes (out-of-scope) and lockedNonGoals
   * 3. Check for technology introductions not in existing baselines
   * 4. Produce a confidence-scored drift signal
   */
  public static compare(
    userInput: string,
    step0Tldr: string,
    step1Tldr: string,
    lockedScopes: string[],
    lockedNonGoals: string[]
  ): DriftSignal {
    const inputTerms = this.extractKeyTerms(userInput);

    // Skip drift check for very short inputs (approvals, yes/no, etc.)
    if (inputTerms.length < 3) {
      return { isDrift: false, confidence: 0, divergedDomains: [], explanation: '' };
    }

    const divergedDomains: string[] = [];
    let maxConfidence = 0;
    const explanations: string[] = [];

    // Check 1: Scope boundary violations
    const scopeCheck = this.checkScopeBoundaryViolation(inputTerms, lockedScopes, lockedNonGoals);
    if (scopeCheck.matches.length > 0) {
      divergedDomains.push('scope');
      if (scopeCheck.confidence > maxConfidence) maxConfidence = scopeCheck.confidence;
      explanations.push(
        `mentions out-of-scope items: ${scopeCheck.matches.slice(0, 3).join(', ')}`
      );
    }

    // Check 2: Technology drift
    const techCheck = this.checkTechDrift(inputTerms, step0Tldr, step1Tldr);
    if (techCheck.driftedTerms.length > 0) {
      divergedDomains.push('techStack');
      if (techCheck.confidence > maxConfidence) maxConfidence = techCheck.confidence;
      explanations.push(
        `introduces technologies not in baseline: ${techCheck.driftedTerms.slice(0, 3).join(', ')}`
      );
    }

    // Check 3: Requirements contradiction (negation of in-scope items)
    const negationPatterns = /\b(?:remove|delete|drop|eliminate|get rid of|no longer|stop using|dont need|don't need)\b/i;
    const negationMatch = userInput.match(negationPatterns);
    if (negationMatch && negationMatch.index !== undefined) {
      // Isolate the clause following the negation keyword up to boundary/punctuation
      const afterNegation = userInput.slice(negationMatch.index);
      const clause = afterNegation.split(/[,;.\n]|(?:\binstead\b|\bkeep\b|\brather than\b)/i)[0];
      const negatedTerms = this.extractKeyTerms(clause);

      // Check if the negated clause mentions something in the existing baseline
      const baselineTerms = this.extractKeyTerms(`${step0Tldr} ${step1Tldr}`);
      const negatedOverlap = negatedTerms.filter(t => baselineTerms.includes(t));
      if (negatedOverlap.length > 0) {
        divergedDomains.push('requirements');
        const negConfidence = Math.min(0.85, 0.6 + negatedOverlap.length * 0.1);
        if (negConfidence > maxConfidence) maxConfidence = negConfidence;
        explanations.push(
          `appears to negate existing baseline items: ${negatedOverlap.slice(0, 3).join(', ')}`
        );
      }
    }

    const isDrift = maxConfidence >= 0.5 && divergedDomains.length > 0;
    const explanation = explanations.length > 0
      ? `User input ${explanations.join('; ')}.`
      : '';

    return {
      isDrift,
      confidence: maxConfidence,
      divergedDomains,
      explanation
    };
  }
}
