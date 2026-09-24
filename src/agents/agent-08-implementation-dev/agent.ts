import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { ClarifyingQuestion, Agent08State } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { ReleaseCandidateBuilder } from './release-candidate-builder.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export interface Agent08TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent08ImplementationDev {
  private workspaceRoot: string;
  private agentState: Agent08State;
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
      step6Tldr: '',
      draft: ReleaseCandidateBuilder.createEmptyDraft('', '', '', '', '', '', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 7 Implementation / Development.
   */
  public async handleTurn(userInput: string): Promise<Agent08TurnResponse> {
    const text = userInput.trim();

    // Verify septuple preconditions (Steps 0 through 6 all locked)
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
      this.agentState.step6Tldr = verification.step6Tldr;
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

    // If first turn, evaluate construction specifications
    if (this.agentState.unansweredQuestions.length === 0 && Object.keys(this.agentState.answeredQuestions).length === 0) {
      const evaluation = ReleaseCandidateBuilder.evaluate(
        text,
        this.agentState.step0Tldr,
        this.agentState.step1Tldr,
        this.agentState.step2Tldr,
        this.agentState.step3Tldr,
        this.agentState.step4Tldr,
        this.agentState.step5Tldr,
        this.agentState.step6Tldr
      );
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unresolvedConstructionAreas,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 7 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active construction question
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
      `Constructed ${activeQuestion?.id || 'release candidate specification'}. Step 7 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected construction choice into draft RC report.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedTitle = isNegative ? 'Excluded by user' : answer;
    let selectedDesc = isNegative ? 'Construction element omitted' : answer;

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

    if (question.category === 'Release Candidate Tagging & Packaging Format') {
      this.agentState.draft.releaseCandidateTag = isNegative ? 'v1.0.0-lean' : (selectedTitle.split(' ')[0] || 'v0.8.0-rc1');
    } else {
      this.agentState.draft.verificationLabNotes += ` | ${question.category}: ${selectedTitle} (${selectedDesc})`;
    }
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent08TurnResponse> {
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

    const signoffPrompt = `All implementation verification checks have passed and Release Candidate is assembled.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`IMPLEMENTED_RELEASE_CANDIDATE.md\` and advance to Step 8.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 7 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent08TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/IMPLEMENTED_RELEASE_CANDIDATE.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'IMPLEMENTED_RELEASE_CANDIDATE.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 7 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 7,
      stepName: 'Implementation & Software Construction',
      artifactPath: 'docs/IMPLEMENTED_RELEASE_CANDIDATE.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 7, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 8);

    const confirmationMessage = `Step 7: Implementation & Release Candidate is now LOCKED.\nAuthoritative document created: docs/IMPLEMENTED_RELEASE_CANDIDATE.md\n\nNext Action: Ready to activate Agent 09 (Step 8: Verification & QA Architect).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/IMPLEMENTED_RELEASE_CANDIDATE.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Construction Dimension: ${q.category}]\n${q.question}\n\nTop 3 Build Patterns:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Details: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent08State {
    return this.agentState;
  }
}
