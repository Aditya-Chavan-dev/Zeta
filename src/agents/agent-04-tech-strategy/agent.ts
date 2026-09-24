import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { ClarifyingQuestion, Agent04State } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { StackSelector } from './stack-selector.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export interface Agent04TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent04TechStrategy {
  private workspaceRoot: string;
  private agentState: Agent04State;
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.agentState = {
      step0Tldr: '',
      step1Tldr: '',
      step2Tldr: '',
      draft: StackSelector.createEmptyDraft('', '', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 3 Technology Strategy.
   */
  public async handleTurn(userInput: string): Promise<Agent04TurnResponse> {
    const text = userInput.trim();

    // Verify triple preconditions (Steps 0, 1, and 2 all locked)
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

    // If first turn, evaluate candidate categories
    if (this.agentState.unansweredQuestions.length === 0 && Object.keys(this.agentState.answeredQuestions).length === 0) {
      const evaluation = StackSelector.evaluate(text, this.agentState.step0Tldr, this.agentState.step1Tldr, this.agentState.step2Tldr);
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unselectedCategories,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 3 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active category question
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
      `Selected ${activeQuestion?.id || 'technology'}. Step 3 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected technology choice into draft TDRs.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedTitle = isNegative ? 'None (Explicitly excluded by user)' : answer;
    let selectedDesc = isNegative ? 'User opted out of this technology layer' : answer;

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

    const rejectedAlternatives = question.top3Options
      .filter(opt => opt.title !== selectedTitle)
      .map(opt => `${opt.title}: ${opt.tradeOffs}`);

    const newTdrId = `TDR-0${this.agentState.draft.tdrs.length + 1}`;
    this.agentState.draft.tdrs.push({
      id: newTdrId,
      category: 'COMMUNICATION_PROTOCOL',
      selectedTech: selectedTitle,
      version: isNegative ? 'N/A' : 'Production LTS',
      justification: selectedDesc,
      rejectedAlternatives,
      tradeOffsAccepted: isNegative ? 'Excluded per explicit user constraint.' : 'Selected based on lowest latency and zero-daemon constraint.'
    });
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent04TurnResponse> {
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

    // All categories selected: compile draft and request sign-off
    this.agentState.isComplete = true;
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    const signoffPrompt = `All technology stack decisions have been baselined.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`TECH_STACK_AND_STRATEGY.md\` and advance to Step 4.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 3 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent04TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/TECH_STACK_AND_STRATEGY.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'TECH_STACK_AND_STRATEGY.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 3 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 3,
      stepName: 'Technology Strategy & Tech-Stack Selection',
      artifactPath: 'docs/TECH_STACK_AND_STRATEGY.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 3, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 4);

    const confirmationMessage = `Step 3: Technology Strategy is now LOCKED.\nAuthoritative document created: docs/TECH_STACK_AND_STRATEGY.md\n\nNext Action: Ready to activate Agent 05 (Step 4: System Architecture Architect).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/TECH_STACK_AND_STRATEGY.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Technology Layer: ${q.category}]\n${q.question}\n\nTop 3 Candidate Technologies:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Characteristics: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent04State {
    return this.agentState;
  }
}
