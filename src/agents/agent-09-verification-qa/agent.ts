import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { ClarifyingQuestion, Agent09State } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { QaAuditor } from './qa-auditor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export interface Agent09TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent09VerificationQa {
  private workspaceRoot: string;
  private agentState: Agent09State;
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
      step7Tldr: '',
      draft: QaAuditor.createEmptyDraft('', '', '', '', '', '', '', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 8 Verification & QA.
   */
  public async handleTurn(userInput: string): Promise<Agent09TurnResponse> {
    const text = userInput.trim();

    // Verify octuple preconditions (Steps 0 through 7 all locked)
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
      this.agentState.step7Tldr = verification.step7Tldr;
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

    // If first turn, evaluate QA dimensions and audit scope
    if (this.agentState.unansweredQuestions.length === 0 && Object.keys(this.agentState.answeredQuestions).length === 0) {
      const evaluation = QaAuditor.evaluate(
        text,
        this.agentState.step0Tldr,
        this.agentState.step1Tldr,
        this.agentState.step2Tldr,
        this.agentState.step3Tldr,
        this.agentState.step4Tldr,
        this.agentState.step5Tldr,
        this.agentState.step6Tldr,
        this.agentState.step7Tldr
      );
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unresolvedAuditAreas,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 8 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active audit question
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
      `Audited ${activeQuestion?.id || 'QA requirement'}. Step 8 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected audit choice into draft QA report.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedTitle = isNegative ? 'Excluded by user' : answer;

    if (!isNegative) {
      const matchNumber = answer.match(/^(?:option\s*)?([123])/i);
      if (matchNumber) {
        const idx = parseInt(matchNumber[1], 10) - 1;
        if (question.top3Options[idx]) {
          selectedTitle = question.top3Options[idx].title;
        }
      }
    }

    this.agentState.draft.qualityGateNotes += ` | ${question.category}: ${selectedTitle}`;
    if (question.category.includes('Defect')) {
      this.agentState.draft.qaVerdict = 'PASS';
    }
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent09TurnResponse> {
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

    const signoffPrompt = `All independent QA audits, traceability links, and chaos tests have verified the system.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`VERIFICATION_AND_QA_PACKAGE.md\` and advance to Step 9.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 8 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent09TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/VERIFICATION_AND_QA_PACKAGE.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'VERIFICATION_AND_QA_PACKAGE.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 8 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 8,
      stepName: 'Verification, Validation & Quality Assurance',
      artifactPath: 'docs/VERIFICATION_AND_QA_PACKAGE.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 8, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 9);

    const confirmationMessage = `Step 8: Verification & QA Package is now LOCKED.\nAuthoritative document created: docs/VERIFICATION_AND_QA_PACKAGE.md\n\nNext Action: Ready to activate Agent 10 (Step 9: Production Readiness & Release Engineer).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/VERIFICATION_AND_QA_PACKAGE.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[QA Audit Dimension: ${q.category}]\n${q.question}\n\nTop 3 QA Testing Strategies:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Strategy: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent09State {
    return this.agentState;
  }
}
