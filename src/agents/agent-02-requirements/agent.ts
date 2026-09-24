import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { StepSummary } from '../../core/state/types.js';
import { ClarifyingQuestion, Agent02State } from './types.js';
import { IntentVerifier } from './intent-verifier.js';
import { RequirementsElicitor } from './requirements-elicitor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export interface Agent02TurnResponse {
  message: string;
  isReadyForSignoff: boolean;
  isLocked: boolean;
  question?: ClarifyingQuestion;
  artifactSummary?: string;
  documentPath?: string;
  error?: string;
}

export class Agent02Requirements {
  private workspaceRoot: string;
  private agentState: Agent02State;
  private isInitialized = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.agentState = {
      step0Tldr: '',
      draft: RequirementsElicitor.createEmptyDraft(''),
      unansweredQuestions: [],
      answeredQuestions: {},
      isComplete: false,
      completionPercentage: 0
    };
  }

  /**
   * Initializes or processes a turn from the user for Step 1 Requirements.
   */
  public async handleTurn(userInput: string): Promise<Agent02TurnResponse> {
    const text = userInput.trim();

    // Verify Step 0 is locked
    if (!this.isInitialized) {
      const verification = IntentVerifier.verifyStep0Locked(this.workspaceRoot);
      if (!verification.isValid) {
        return {
          message: verification.errorMessage || 'Precondition Failed: Step 0 is not locked.',
          isReadyForSignoff: false,
          isLocked: false,
          error: verification.errorMessage
        };
      }
      this.agentState.step0Tldr = verification.step0Tldr;
      this.agentState.draft.step0Tldr = verification.step0Tldr;
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

    // If first turn, ingest requirements text
    if (this.agentState.draft.functionalRequirements.length === 0) {
      // Check for scope drift against Step 0 intent
      const scopeDrift = IntentVerifier.checkScopeDrift(text, this.agentState.step0Tldr);
      if (scopeDrift.length > 0) {
        return {
          message: `Scope Warning:\n${scopeDrift.join('\n')}\n\nPlease revise your requirements to stay aligned with Step 0 intent, or proceed with greenfield scope.`,
          isReadyForSignoff: false,
          isLocked: false,
          error: scopeDrift[0]
        };
      }

      const analysis = RequirementsElicitor.analyze(text, this.agentState.step0Tldr);
      this.agentState.draft = analysis.draft;
      this.agentState.completionPercentage = analysis.completenessPercentage;
      this.agentState.unansweredQuestions = QuestionGenerator.generateAllQuestions(
        analysis.missingPillars,
        this.agentState.draft
      );

      StateManager.recordTurn(this.workspaceRoot, text, `Step 1 Completeness: ${this.agentState.completionPercentage}%`);

      return this.askNextQuestionOrPresentDraft();
    }

    // Subsequent turns: process answer to the current active question
    const activeQuestion = this.agentState.unansweredQuestions.shift();
    if (activeQuestion) {
      this.applyAnswerToDraft(activeQuestion, text);
      this.agentState.answeredQuestions[activeQuestion.id] = text;
    }

    const remainingCount = this.agentState.unansweredQuestions.length;
    this.agentState.completionPercentage = Math.min(100, Math.round(50 + ((4 - remainingCount) / 4) * 50));

    StateManager.recordTurn(
      this.workspaceRoot,
      text,
      `Answered ${activeQuestion?.id || 'question'}. Step 1 Completeness: ${this.agentState.completionPercentage}%`
    );

    return this.askNextQuestionOrPresentDraft();
  }

  /**
   * Applies user response into the draft based on category.
   */
  private applyAnswerToDraft(question: ClarifyingQuestion, answer: string): void {
    const isNegative = /^(?:no|none|skip|neither|no\s+thanks|don'?t\s+want|n|false|exclude|disabled|not\s+needed)/i.test(answer.trim());
    let selectedOption = isNegative ? 'Excluded by user' : answer;

    if (!isNegative) {
      const matchNumber = answer.match(/^(?:option\s*)?([123])/i);
      if (matchNumber) {
        const idx = parseInt(matchNumber[1], 10) - 1;
        if (question.top3Options[idx]) {
          selectedOption = `${question.top3Options[idx].title}: ${question.top3Options[idx].description}`;
        }
      }
    }

    const priority = isNegative ? 'COULD_HAVE' : 'MUST_HAVE';

    switch (question.category) {
      case 'Performance & Latency':
        this.agentState.draft.nonFunctionalRequirements.push({
          id: `NFR-${String(this.agentState.draft.nonFunctionalRequirements.length + 1).padStart(2, '0')}`,
          category: 'PERFORMANCE',
          title: 'Response Latency Budget',
          metric: 'Turn Latency',
          targetThreshold: selectedOption,
          priority
        });
        break;

      case 'Reliability & Recovery':
        this.agentState.draft.nonFunctionalRequirements.push({
          id: `NFR-${String(this.agentState.draft.nonFunctionalRequirements.length + 1).padStart(2, '0')}`,
          category: 'RELIABILITY',
          title: 'Crash Data Loss Protection',
          metric: 'Interruption State Recovery',
          targetThreshold: selectedOption,
          priority: 'MUST_HAVE'
        });
        break;

      case 'Security & Access Boundary':
        this.agentState.draft.nonFunctionalRequirements.push({
          id: `NFR-${String(this.agentState.draft.nonFunctionalRequirements.length + 1).padStart(2, '0')}`,
          category: 'SECURITY',
          title: 'Workspace Sandboxing',
          metric: 'Path Traversal Prevention',
          targetThreshold: selectedOption,
          priority: 'MUST_HAVE'
        });
        break;

      case 'Data Persistence & Lifecycle':
      default:
        this.agentState.draft.dataRequirements.push({
          id: `DR-${String(this.agentState.draft.dataRequirements.length + 1).padStart(2, '0')}`,
          entityName: 'Lifecycle State & Artifacts',
          description: selectedOption,
          persistenceModel: 'Local JSON (.zeta/) + Git Markdown (docs/)',
          retentionPolicy: 'Project Lifetime'
        });
        break;
    }
  }

  /**
   * Asks the next question or presents the ready-for-signoff draft.
   */
  private async askNextQuestionOrPresentDraft(): Promise<Agent02TurnResponse> {
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

    const signoffPrompt = `All Step 1 Requirements have been clarified.\n\n${compiled.tldrSummary}\n\nPlease reply "**Approve**" to lock \`REQUIREMENTS_SPECIFICATION.md\` and advance to Step 2.`;

    return {
      message: signoffPrompt,
      isReadyForSignoff: true,
      isLocked: false,
      artifactSummary: compiled.tldrSummary
    };
  }

  /**
   * Finalizes the artifact, writes it to disk, and locks Step 1 in StateManager.
   */
  public async finalizeAndLock(): Promise<Agent02TurnResponse> {
    const compiled = ArtifactCompiler.compile(this.agentState.draft);

    // Write to docs/REQUIREMENTS_SPECIFICATION.md
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetPath = path.join(docsDir, 'REQUIREMENTS_SPECIFICATION.md');
    fs.writeFileSync(targetPath, compiled.fullDocument, 'utf-8');

    // Compute SHA256 and lock Step 1 in StateManager
    const sha256 = crypto.createHash('sha256').update(compiled.fullDocument).digest('hex');
    const stepSummary: StepSummary = {
      stepNumber: 1,
      stepName: 'Requirements Engineering & Baselining',
      artifactPath: 'docs/REQUIREMENTS_SPECIFICATION.md',
      lockedAt: new Date().toISOString(),
      summary: compiled.tldrSummary,
      artifactSha256: sha256
    };

    StateManager.lockStep(this.workspaceRoot, 1, stepSummary);
    StateManager.advanceStep(this.workspaceRoot, 2);

    const confirmationMessage = `Step 1: Requirements Specification is now LOCKED.\nAuthoritative document created: docs/REQUIREMENTS_SPECIFICATION.md\n\nNext Action: Ready to activate Agent 03 (Step 2: Feasibility & Risk Assessment).`;

    return {
      message: confirmationMessage,
      isReadyForSignoff: false,
      isLocked: true,
      artifactSummary: compiled.tldrSummary,
      documentPath: 'docs/REQUIREMENTS_SPECIFICATION.md'
    };
  }

  private formatQuestionMessage(q: ClarifyingQuestion): string {
    return `[Requirements Pillar: ${q.category}]\n${q.question}\n\nTop 3 Strategic Options:\n` +
      q.top3Options.map((opt, i) => `${i + 1}. **${opt.title}**${opt.recommended ? ' *(Recommended)*' : ''}\n   • Details: ${opt.description}\n   • Trade-off: ${opt.tradeOffs}`).join('\n\n') +
      `\n\nReply with your preferred number (1, 2, or 3) or provide your custom choice:`;
  }

  public getState(): Agent02State {
    return this.agentState;
  }
}
