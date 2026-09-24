import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { ClarifyingQuestion, Agent07State } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { PlanGenerator } from './plan-generator.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export interface Agent07TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent07ImplementationPlanning {
  private workspaceRoot: string;
  private agentState: Agent07State;
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.agentState = {
      step0Tldr: '',
      step1Tldr: '',
      step2Tldr: '',
      step3Tldr: '',
      step4Tldr: '',
      step5Tldr: '',
      draft: PlanGenerator.createEmptyDraft('', '', '', '', '', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 6 Implementation Planning.
   */
  public async handleTurn(userInput: string): Promise<Agent07TurnResponse> {
    const text = userInput.trim();

    // Verify hexuple preconditions (Steps 0 through 5 all locked)
    if (!this.isInitialized) {
      const verification = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
      if (!verification.isValid) {
        return {
          message: verification.errorMessage || 'Precondition Failed: Prior steps are not locked.',
          isReadyForSignoff: false,
          isLocked: false,
          error: verification.errorMessage
        };
      }

      this.agentState.step0Tldr = verification.step0Tldr;
      this.agentState.step1Tldr = verification.step1Tldr;
      this.agentState.step2Tldr = verification.step2Tldr;
      this.agentState.step3Tldr = verification.step3Tldr;
      this.agentState.step4Tldr = verification.step4Tldr;
      this.agentState.step5Tldr = verification.step5Tldr;
      this.isInitialized = true;
    }

    // Check if user is confirming sign-off
    if (this.agentState.isComplete) {
      if (text.toLowerCase() === 'approve') {
        return this.finalizeAndLock();
      }
    }

    // Drift check against agreed baselines
    if (text.toLowerCase() !== 'approve') {
      const drift = DriftInterceptor.evaluateWorkspace(this.workspaceRoot, text);
      if (drift.shouldIntercept) {
        return {
          message: drift.conversationalPrompt,
          isReadyForSignoff: false,
          isLocked: false
        };
      }
    }

    // If first turn, evaluate delivery planning specifications
    if (this.agentState.unansweredQuestions.length === 0 && Object.keys(this.agentState.answeredQuestions).length === 0) {
      const evaluation = PlanGenerator.evaluate(
        text,
        this.agentState.step0Tldr,
        this.agentState.step1Tldr,
        this.agentState.step2Tldr,
        this.agentState.step3Tldr,
        this.agentState.step4Tldr,
        this.agentState.step5Tldr
      );
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unresolvedPlanningAreas,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 6 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active planning question
    const activeQuestion = this.agentState.unansweredQuestions.shift();
    if (activeQuestion) {
      this.applyAnswerToDraft(activeQuestion, text);
      this.agentState.answeredQuestions[activeQuestion.id] = text;
    }

    const remainingCount = this.agentState.unansweredQuestions.length;
    this.agentState.completionPercentage = Math.min(100, Math.round(50 + ((3 - remainingCount) / 3) * 50));

    StateManager.recordTurn(
      this.workspaceRoot,
      text,
      `Planned ${activeQuestion?.id || 'work item'}. Step 6 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected planning choice into draft plan.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedTitle = isNegative ? 'Excluded by user' : answer;
    let selectedDesc = isNegative ? 'Planning element excluded from release' : answer;

    if (!isNegative) {
      const matchNumber = answer.match(/^(?:option\s*)?([123])/i);
      if (matchNumber) {
        const idx = parseInt(matchNumber[1], 10) - 1;
        if (question.top3Options[idx]) {
          selectedTitle = question.top3Options[idx].title;
          selectedDesc = question.top3Options[idx].description;
        }
      }
    }

    if (question.category === 'Delivery Sequencing Strategy') {
      this.agentState.draft.sequencingStrategy = isNegative ? 'Direct single-stage release (No complex sequencing)' : selectedTitle;
    } else {
      if (!isNegative) {
        this.agentState.draft.qualityGates.push({
          gateName: question.category,
          triggerPoint: selectedTitle,
          mandatoryChecks: [selectedDesc],
          passThreshold: '100% adherence'
        });
      }
    }
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent07TurnResponse> {
    if (this.agentState.unansweredQuestions.length > 0) {
      const nextQ = this.agentState.unansweredQuestions[0];
      const prompt = this.formatQuestionMessage(nextQ);

      return {
        message: prompt,
        isReadyForSignoff: false,
        isLocked: false,
        question: nextQ
      };
    }

    // All decisions selected: compile draft and request sign-off
    this.agentState.isComplete = true;
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    const signoffPrompt = `All implementation planning and WBS tasks have been baselined.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`IMPLEMENTATION_PLAN_AND_WBS.md\` and advance to Step 7.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 6 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent07TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/IMPLEMENTATION_PLAN_AND_WBS.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'IMPLEMENTATION_PLAN_AND_WBS.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 6 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 6,
      stepName: 'Implementation Planning & Work Breakdown',
      artifactPath: 'docs/IMPLEMENTATION_PLAN_AND_WBS.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 6, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 7);

    const confirmationMessage = `Step 6: Implementation Plan & WBS is now LOCKED.\nAuthoritative document created: docs/IMPLEMENTATION_PLAN_AND_WBS.md\n\nNext Action: Ready to activate Agent 08 (Step 7: Implementation & Development Architect).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/IMPLEMENTATION_PLAN_AND_WBS.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Implementation Dimension: ${q.category}]\n${q.question}\n\nTop 3 Planning Strategies:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Details: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent07State {
    return this.agentState;
  }
}
