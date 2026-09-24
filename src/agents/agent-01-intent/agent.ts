import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { ClarifyingQuestion, Agent01State } from './types.js';
import { IntentAnalyzer } from './intent-analyzer.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export interface AgentTurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
}

export class Agent01Intent {
  private workspaceRoot: string;
  private agentState: Agent01State;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    
    // Check for in-flight uncommitted buffer to rehydrate interrupted questionnaire
    const existing = StateManager.load(workspaceRoot);
    if (existing?.activeStep === 0 && existing?.uncommittedBuffer?.activeDraft) {
      this.agentState = {
        rawBrainDump: existing.uncommittedBuffer.lastUserMessage || '',
        draft: existing.uncommittedBuffer.activeDraft,
        unansweredQuestions: existing.uncommittedBuffer.unresolvedQuestions || [],
        answeredQuestions: {},
        isComplete: (existing.uncommittedBuffer.unresolvedQuestions?.length || 0) === 0,
        completionPercentage: (existing.uncommittedBuffer.unresolvedQuestions?.length || 0) === 0 ? 100 : 75
      };
    } else {
      this.agentState = {
        rawBrainDump: '',
        draft: IntentAnalyzer.createEmptyDraft(),
        unansweredQuestions: [],
        answeredQuestions: {},
        isComplete: false,
        completionPercentage: 0
      };
    }
  }

  /**
   * Initializes or processes a turn from the user.
   */
  public async handleTurn(userInput: string): Promise<AgentTurnResponse> {
    const text = userInput.trim();

    // Check if user is confirming sign-off
    if (this.agentState.isComplete && !this.agentState.draft.decisionFoundation.goNoGoRecommendation) {
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

    // If first turn, ingest raw brain-dump
    if (!this.agentState.rawBrainDump) {
      this.agentState.rawBrainDump = text;
      const analysis = IntentAnalyzer.analyze(text);
      this.agentState.draft = analysis.draft;
      this.agentState.completionPercentage = analysis.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        analysis.missingDomains,
        this.agentState.draft
      );

      // Record turn in StateManager
      StateManager.recordTurn(
        this.workspaceRoot,
        text,
        `Completeness: ${this.agentState.completionPercentage}%`,
        this.agentState.draft,
        this.agentState.unansweredQuestions
      );

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active question
    const activeQuestion = this.agentState.unansweredQuestions.shift();
    if (activeQuestion) {
      this.applyAnswerToDraft(activeQuestion, text);
      this.agentState.answeredQuestions[activeQuestion.id] = text;
    }

    // Recompute completeness
    const remainingCount = this.agentState.unansweredQuestions.length;
    this.agentState.completionPercentage = Math.min(100, Math.round(50 + ((5 - remainingCount) / 5) * 50));

    StateManager.recordTurn(
      this.workspaceRoot,
      text,
      `Answered ${activeQuestion?.id || 'question'}. Completeness: ${this.agentState.completionPercentage}%`,
      this.agentState.draft,
      this.agentState.unansweredQuestions
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies user response into the draft based on domain context.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedOptionText = isNegative ? 'Excluded by user (Out of scope)' : answer;

    if (!isNegative) {
      const matchNumber = answer.match(/^(?:option\s*)?([123])/i);
      if (matchNumber) {
        const idx = parseInt(matchNumber[1], 10) - 1;
        if (question.top3Options[idx]) {
          selectedOptionText = `${question.top3Options[idx].title}: ${question.top3Options[idx].description}`;
        }
      }
    }

    switch (question.domain) {
      case 'Problem Space':
        this.agentState.draft.problemSpace.rootCauseAnalysis = selectedOptionText;
        this.agentState.draft.problemSpace.costOfInaction = selectedOptionText;
        break;
      case 'People & Stakeholders':
        this.agentState.draft.peopleStakeholders.userIdentification = selectedOptionText;
        this.agentState.draft.peopleStakeholders.userPersonas = [selectedOptionText];
        this.agentState.draft.peopleStakeholders.decisionAuthority = 'Project Owner / Lead Developer';
        break;
      case 'Business Intent':
        this.agentState.draft.businessIntent.valueProposition = selectedOptionText;
        this.agentState.draft.businessIntent.businessObjective = selectedOptionText;
        break;
      case 'Scope & Boundaries':
        if (isNegative) {
          if (!this.agentState.draft.scopeBoundaries.outOfScope) {
            this.agentState.draft.scopeBoundaries.outOfScope = [];
          }
          this.agentState.draft.scopeBoundaries.outOfScope.push(question.question || 'User excluded feature');
        } else {
          this.agentState.draft.scopeBoundaries.initialScope = [selectedOptionText];
        }
        break;
      case 'Success Definition':
        this.agentState.draft.successDefinition.successCriteria = [selectedOptionText];
        this.agentState.draft.successDefinition.successMetrics = ['Process adherence > 95%', 'Zero uncommitted state loss'];
        break;
      case 'Constraints & Assumptions':
        this.agentState.draft.assumptionsConstraints.knownConstraints = [selectedOptionText];
        break;
      case 'Trust & Security':
        this.agentState.draft.trustCompliance.securityContext = selectedOptionText;
        break;
      case 'Operations & Support':
      default:
        this.agentState.draft.operationalImpact.monitoringReliability = selectedOptionText;
        break;
    }
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<AgentTurnResponse> {
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

    // All questions answered: compile draft and request sign-off
    this.agentState.isComplete = true;
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    const signoffPrompt = `All 12 Step 0 domains have been clarified.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`PROJECT_INTENT.md\` and advance to Step 1.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 0 in StateManager.
   */
  public async finalizeAndLock(): Promise<AgentTurnResponse> {
    this.agentState.draft.decisionFoundation.goNoGoRecommendation = 'GO';
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/PROJECT_INTENT.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'PROJECT_INTENT.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 0 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 0,
      stepName: 'Problem Definition & Project Intent',
      artifactPath: 'docs/PROJECT_INTENT.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 0, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 1);

    const confirmationMessage = `Step 0: Problem Definition & Project Intent is now LOCKED.\nAuthoritative document created: docs/PROJECT_INTENT.md\n\nNext Action: Ready to activate Agent 02 (Step 1: Requirements Elicitation).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/PROJECT_INTENT.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Domain: ${q.domain}]\n${q.question}\n\nTop 3 Strategic Options:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Details: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent01State {
    return this.agentState;
  }
}
