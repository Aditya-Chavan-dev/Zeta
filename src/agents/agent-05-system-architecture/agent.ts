import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { Step4ArchitectureDraft, ClarifyingQuestion, Agent05State, ArchitectureDecisionRecord } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { ArchitectureDesigner } from './architecture-designer.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler, CompiledArchitectureArtifacts } from './artifact-compiler.js';

export interface Agent05TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent05SystemArchitecture {
  private workspaceRoot: string;
  private agentState: Agent05State;
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.agentState = {
      step0Tldr: '',
      step1Tldr: '',
      step2Tldr: '',
      step3Tldr: '',
      draft: ArchitectureDesigner.createEmptyDraft('', '', '', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 4 System Architecture.
   */
  public async handleTurn(userInput: string): Promise<Agent05TurnResponse> {
    const text = userInput.trim();

    // Verify quad preconditions (Steps 0, 1, 2, and 3 all locked)
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
      this.isInitialized = true;
    }

    // Check if user is confirming sign-off
    if (this.agentState.isComplete) {
      if (text.toLowerCase() === 'approve') {
        return this.finalizeAndLock();
      }
    }

    // If first turn, evaluate architecture decisions
    if (this.agentState.unansweredQuestions.length === 0 && Object.keys(this.agentState.answeredQuestions).length === 0) {
      const evaluation = ArchitectureDesigner.evaluate(
        text,
        this.agentState.step0Tldr,
        this.agentState.step1Tldr,
        this.agentState.step2Tldr,
        this.agentState.step3Tldr
      );
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unresolvedArchitectureAreas,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 4 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active architecture question
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
      `Decided ${activeQuestion?.id || 'architecture'}. Step 4 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected architecture decision into draft ADRs.
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

    const newAdrId = `ADR-0${this.agentState.draft.adrs.length + 1}`;
    this.agentState.draft.adrs.push({
      id: newAdrId,
      title: `${question.category}: ${selectedTitle}`,
      status: 'ACCEPTED',
      context: question.contextWhyNeeded,
      decision: selectedDesc,
      consequences: 'Improves system modularity and eliminates runtime coupling between agents.'
    });
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent05TurnResponse> {
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

    const signoffPrompt = `All system architecture blueprints and ADRs have been baselined.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`SYSTEM_ARCHITECTURE_BLUEPRINT.md\` and advance to Step 5.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 4 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent05TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'SYSTEM_ARCHITECTURE_BLUEPRINT.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 4 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 4,
      stepName: 'System Architecture & Solution Design',
      artifactPath: 'docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 4, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 5);

    const confirmationMessage = `Step 4: System Architecture Blueprint is now LOCKED.\nAuthoritative document created: docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md\n\nNext Action: Ready to activate Agent 06 (Step 5: Detailed Technical Design Architect).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Architectural Dimension: ${q.category}]\n${q.question}\n\nTop 3 Strategic Architectural Patterns:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Architecture: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent05State {
    return this.agentState;
  }
}
