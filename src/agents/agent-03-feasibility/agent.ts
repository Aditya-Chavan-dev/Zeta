import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { Step2FeasibilityDraft, ClarifyingQuestion, Agent03State, RiskItem } from './types.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { FeasibilityEvaluator } from './feasibility-evaluator.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler, CompiledFeasibilityArtifacts } from './artifact-compiler.js';

export interface Agent03TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent03Feasibility {
  private workspaceRoot: string;
  private agentState: Agent03State;
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.agentState = {
      step0Tldr: '',
      step1Tldr: '',
      draft: FeasibilityEvaluator.createEmptyDraft('', ''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 2 Feasibility & Risk.
   */
  public async handleTurn(userInput: string): Promise<Agent03TurnResponse> {
    const text = userInput.trim();

    // Verify dual preconditions (Step 0 and Step 1 both locked)
    if (!this.isInitialized) {
      const verification = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
      if (!verification.isValid) {
        return {
          message: verification.errorMessage || 'Precondition Failed: Step 0 or Step 1 is not locked.',
          isReadyForSignoff: false,
          isLocked: false,
          error: verification.errorMessage
        };
      }

      this.agentState.step0Tldr = verification.step0Tldr;
      this.agentState.step1Tldr = verification.step1Tldr;
      this.isInitialized = true;
    }

    // Check if user is confirming sign-off
    if (this.agentState.isComplete) {
      if (text.toLowerCase() === 'approve') {
        return this.finalizeAndLock();
      }
    }

    // If first turn, evaluate feasibility & risks
    if (this.agentState.draft.risks.length === 0) {
      const evaluation = FeasibilityEvaluator.evaluate(text, this.agentState.step0Tldr, this.agentState.step1Tldr);
      this.agentState.draft = evaluation.draft;
      this.agentState.completionPercentage = evaluation.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        evaluation.unresolvedRiskAreas,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 2 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active risk question
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
      `Mitigated ${activeQuestion?.id || 'risk'}. Step 2 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies selected mitigation option into the draft risk register.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedOptionText = isNegative ? 'None (Risk accepted / mitigation excluded by user)' : answer;

    if (!isNegative) {
      const matchNumber = answer.match(/^(?:option\s*)?([123])/i);
      if (matchNumber) {
        const idx = parseInt(matchNumber[1], 10) - 1;
        if (question.top3Options[idx]) {
          selectedOptionText = `${question.top3Options[idx].title}: ${question.top3Options[idx].description}`;
        }
      }
    }

    const newRiskId = `RISK-${String(this.agentState.draft.risks.length + 1).padStart(2, '0')}`;
    this.agentState.draft.risks.push({
      id: newRiskId,
      title: question.riskCategory,
      category: 'TECHNICAL',
      probability: isNegative ? 'LOW' : 'MEDIUM',
      impact: isNegative ? 'LOW' : 'MEDIUM',
      severity: isNegative ? 'LOW' : 'MEDIUM',
      mitigationStrategy: selectedOptionText,
      contingencyPlan: isNegative ? 'No action needed.' : 'Trigger automated recovery sentinel if risk manifests.'
    });
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent03TurnResponse> {
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

    // All risks addressed: compile draft and request sign-off
    this.agentState.isComplete = true;
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    const signoffPrompt = `All feasibility assessments and risk mitigations have been baselined.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`FEASIBILITY_AND_RISK_REPORT.md\` and advance to Step 3.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 2 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent03TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/FEASIBILITY_AND_RISK_REPORT.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'FEASIBILITY_AND_RISK_REPORT.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 2 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 2,
      stepName: 'Feasibility, Constraints & Risk Analysis',
      artifactPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 2, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 3);

    const confirmationMessage = `Step 2: Feasibility & Risk Assessment is now LOCKED.\nAuthoritative document created: docs/FEASIBILITY_AND_RISK_REPORT.md\n\nNext Action: Ready to activate Agent 04 (Step 3: Technology Strategy Architect).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/FEASIBILITY_AND_RISK_REPORT.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Risk Vector: ${q.riskCategory}]\n${q.question}\n\nTop 3 Mitigation Options:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Strategy: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom mitigation:`;
  }

  public getState(): Agent03State {
    return this.agentState;
  }
}
