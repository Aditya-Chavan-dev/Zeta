import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { Step5DetailedDesignDraft, ClarifyingQuestion, Agent06State, StandardErrorCodeSpec } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { DetailedDesigner } from './detailed-designer.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler, CompiledDetailedDesignArtifacts } from './artifact-compiler.js';

export interface Agent06TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent06DetailedDesign {
  private workspaceRoot: string;
  private agentState: Agent06State;
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.agentState = {
      step0Tldr: '',
      step1Tldr: '',
      step2Tldr: '',
      step3Tldr: '',
      step4Tldr: '',
      draft: DetailedDesigner.createEmptyDraft('', '', '', '', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 5 Detailed Technical Design.
   */
  public async handleTurn(userInput: string): Promise<Agent06TurnResponse> {
    const text = userInput.trim();

    // Verify quintuple preconditions (Steps 0 through 4 all locked)
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
      this.isInitialized = true;
    }

    // Check if user is confirming sign-off
    if (this.agentState.isComplete) {
      if (text.toLowerCase() === 'approve') {
        return this.finalizeAndLock();
      }
    }

    // If first turn, evaluate technical design specifications
    if (this.agentState.unansweredQuestions.length === 0 && Object.keys(this.agentState.answeredQuestions).length === 0) {
      const evaluation = DetailedDesigner.evaluate(
        text,
        this.agentState.step0Tldr,
        this.agentState.step1Tldr,
        this.agentState.step2Tldr,
        this.agentState.step3Tldr,
        this.agentState.step4Tldr
      );
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unresolvedDesignAreas,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 5 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active design question
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
      `Designed ${activeQuestion?.id || 'technical specification'}. Step 5 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected design choice into draft technical design.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    let selectedTitle = answer;
    let selectedDesc = answer;
    const matchNumber = answer.match(/^(?:option\s*)?([123])/i);
    if (matchNumber) {
      const idx = parseInt(matchNumber[1], 10) - 1;
      if (question.top3Options[idx]) {
        selectedTitle = question.top3Options[idx].title;
        selectedDesc = question.top3Options[idx].description;
      }
    }

    const newCode = `ERR_DESIGN_${String(this.agentState.draft.errorCodes.length + 1).padStart(2, '0')}`;
    this.agentState.draft.errorCodes.push({
      code: newCode,
      category: 'VALIDATION',
      description: `${question.category}: ${selectedTitle}`,
      httpStatusEquivalent: 400,
      recoveryGuidance: selectedDesc
    });
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent06TurnResponse> {
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

    const signoffPrompt = `All detailed technical design contracts have been baselined.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`DETAILED_TECHNICAL_DESIGN.md\` and advance to Step 6.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 5 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent06TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/DETAILED_TECHNICAL_DESIGN.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'DETAILED_TECHNICAL_DESIGN.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 5 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 5,
      stepName: 'Detailed Technical Design & Engineering Design',
      artifactPath: 'docs/DETAILED_TECHNICAL_DESIGN.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 5, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 6);

    const confirmationMessage = `Step 5: Detailed Technical Design is now LOCKED.\nAuthoritative document created: docs/DETAILED_TECHNICAL_DESIGN.md\n\nNext Action: Ready to activate Agent 07 (Step 6: Implementation Planning Architect).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/DETAILED_TECHNICAL_DESIGN.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Technical Design Dimension: ${q.category}]\n${q.question}\n\nTop 3 Engineering Patterns:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Specification: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent06State {
    return this.agentState;
  }
}
