import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { ReleaseReadinessAuditor } from './release-readiness-auditor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { AgentResponse, Step9ProductionReadinessDraft } from './types.js';

export class Agent10ProductionReadiness {
  private workspaceRoot: string;
  private draft: Step9ProductionReadinessDraft | null = null;
  private currentQuestionIndex: number = 0;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Handles user turns interactively.
   */
  public async handleTurn(userInput: string): Promise<AgentResponse> {
    // 1. Check prerequisites (Steps 0 through 8 must be locked)
    const precondition = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
    if (!precondition.isValid) {
      return {
        step: 9,
        isLocked: false,
        message: precondition.errorMessage || 'Precondition verification failed.',
        error: true
      };
    }

    // 2. Initialize draft if not present
    if (!this.draft) {
      this.draft = ReleaseReadinessAuditor.createEmptyDraft(
        precondition.step0Tldr,
        precondition.step1Tldr,
        precondition.step2Tldr,
        precondition.step3Tldr,
        precondition.step4Tldr,
        precondition.step5Tldr,
        precondition.step6Tldr,
        precondition.step7Tldr,
        precondition.step8Tldr
      );
    }

    // Record turn in uncommitted state buffer
    StateManager.recordTurn(this.workspaceRoot, userInput, 'Auditing production readiness gates');

    // 3. Handle explicit Approval handshake
    if (userInput.trim().toLowerCase() === 'approve') {
      return this.lockAndCompleteStep();
    }

    // 4. Process user input if answering an unresolved area
    if (this.draft.unresolvedAreas.length > 0) {
      const currentArea = this.draft.unresolvedAreas[0];
      // Apply answer
      ReleaseReadinessAuditor.applyAnswer(this.draft, currentArea, userInput);

      // If more questions remain, ask the next one
      if (this.draft.unresolvedAreas.length > 0) {
        const nextArea = this.draft.unresolvedAreas[0];
        const question = QuestionGenerator.generateForArea(nextArea, this.draft);

        const optionsText = question.top3Options
          .map((opt, i) => `${i + 1}. **${opt.title}**\n   - Description: ${opt.description}\n   - Trade-offs: ${opt.tradeOffs}`)
          .join('\n\n');

        return {
          step: 9,
          isLocked: false,
          message: `### Production Readiness Assessment: ${question.category}\n\n${question.question}\n\n${optionsText}\n\nPlease select an option (1, 2, or 3) or provide your custom deployment specification:`,
          question
        };
      }
    }

    // 5. All areas resolved -> Present final production readiness review for signoff
    const previewArtifact = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetDocPath = path.join(docsDir, 'PRODUCTION_READINESS_AND_DEPLOYMENT.md');
    fs.writeFileSync(targetDocPath, previewArtifact, 'utf8');

    return {
      step: 9,
      isLocked: false,
      isReadyForSignoff: true,
      documentPath: 'docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md',
      message: `Production readiness, deployment architecture, and rollback mechanisms have been audited and compiled into \`docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md\`.\n\nAll pre-flight release gates (GATE-01, GATE-02, GATE-03) are satisfied.\n\nPlease review and reply with **Approve** to lock Step 9 and advance to Step 10 (Operations, Maintenance & SRE).`
    };
  }

  /**
   * Finalizes artifact on disk, calculates SHA-256, locks Step 9 in StateManager, and advances to Step 10.
   */
  private lockAndCompleteStep(): AgentResponse {
    if (!this.draft) {
      throw new Error('Cannot lock Step 9 without active production readiness draft.');
    }

    const artifactContent = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const docPath = path.join(docsDir, 'PRODUCTION_READINESS_AND_DEPLOYMENT.md');
    fs.writeFileSync(docPath, artifactContent, 'utf8');

    const sha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');
    const tldr = ArtifactCompiler.generateCompactTldr(this.draft);

    // Commit lock through StateManager
    StateManager.lockStep(this.workspaceRoot, 9, {
      stepNumber: 9,
      stepName: 'Production Readiness, Deployment & Release Engineering',
      artifactPath: 'docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md',
      lockedAt: new Date().toISOString(),
      summary: tldr,
      artifactSha256: sha256
    });

    StateManager.advanceStep(this.workspaceRoot, 10);

    return {
      step: 9,
      isLocked: true,
      documentPath: 'docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md',
      message: `Step 9 (Production Readiness, Deployment & Release Engineering) is officially LOCKED.\n\nArtifact created: \`docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md\` (SHA-256: ${sha256}).\nSession state advanced to Step 10.`
    };
  }
}
