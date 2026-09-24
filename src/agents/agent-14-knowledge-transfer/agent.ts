import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { KnowledgeAuditor } from './knowledge-auditor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { AgentResponse, Step13KnowledgeTransferDraft } from './types.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export class Agent14KnowledgeTransfer {
  private workspaceRoot: string;
  private draft: Step13KnowledgeTransferDraft | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Handles user turns interactively.
   */
  public async handleTurn(userInput: string): Promise<AgentResponse> {
    // 1. Check prerequisites (Steps 0 through 12 must be locked)
    const precondition = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
    if (!precondition.isValid) {
      return {
        step: 13,
        isLocked: false,
        message: precondition.errorMessage || 'Precondition verification failed.',
        error: true
      };
    }

    // 2. Initialize draft if not present
    if (!this.draft) {
      this.draft = KnowledgeAuditor.createEmptyDraft(
        precondition.step0Tldr,
        precondition.step1Tldr,
        precondition.step2Tldr,
        precondition.step3Tldr,
        precondition.step4Tldr,
        precondition.step5Tldr,
        precondition.step6Tldr,
        precondition.step7Tldr,
        precondition.step8Tldr,
        precondition.step9Tldr,
        precondition.step10Tldr,
        precondition.step11Tldr,
        precondition.step12Tldr
      );
    }

    // Record turn in uncommitted state buffer
    StateManager.recordTurn(this.workspaceRoot, userInput, 'Auditing knowledge transfer and documentation');

    // 3. Handle explicit Approval handshake
    if (userInput.trim().toLowerCase() === 'approve') {
      return this.lockAndCompleteStep();
    }

    // Drift check against agreed baselines
    const drift = DriftInterceptor.evaluateWorkspace(this.workspaceRoot, userInput.trim());
    if (drift.shouldIntercept) {
      return {
        step: 13,
        message: drift.conversationalPrompt,
        isLocked: false,
        isReadyForSignoff: false
      };
    }

    // 4. Process user input if answering an unresolved area
    if (this.draft.unresolvedAreas.length > 0) {
      const currentArea = this.draft.unresolvedAreas[0];
      // Apply answer
      KnowledgeAuditor.applyAnswer(this.draft, currentArea, userInput);

      // If more questions remain, ask the next one
      if (this.draft.unresolvedAreas.length > 0) {
        const nextArea = this.draft.unresolvedAreas[0];
        const question = QuestionGenerator.generateForArea(nextArea, this.draft);

        const optionsText = question.top3Options
          .map((opt, i) => `${i + 1}. **${opt.title}**\n   - Description: ${opt.description}\n   - Trade-offs: ${opt.tradeOffs}`)
          .join('\n\n');

        return {
          step: 13,
          isLocked: false,
          message: `### Knowledge Transfer & Documentation Assessment: ${question.category}\n\n${question.question}\n\n${optionsText}\n\nPlease select an option (1, 2, or 3) or provide your custom documentation specification:`,
          question
        };
      }
    }

    // 5. All areas resolved -> Present final documentation review for signoff
    const previewArtifact = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetDocPath = path.join(docsDir, 'KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md');
    fs.writeFileSync(targetDocPath, previewArtifact, 'utf8');

    return {
      step: 13,
      isLocked: false,
      isReadyForSignoff: true,
      documentPath: 'docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md',
      message: `Knowledge transfer, developer onboarding curriculum, and ADR catalogs have been compiled into \`docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md\`.\n\nAll ADR traces, quickstart guides, and troubleshooting procedures are verified.\n\nPlease review and reply with **Approve** to lock Step 13 and advance to Step 14 (Project Retrospective & Continuous Improvement).`
    };
  }

  /**
   * Finalizes artifact on disk, calculates SHA-256, locks Step 13 in StateManager, and advances to Step 14.
   */
  private lockAndCompleteStep(): AgentResponse {
    if (!this.draft) {
      throw new Error('Cannot lock Step 13 without active knowledge transfer draft.');
    }

    const artifactContent = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const docPath = path.join(docsDir, 'KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md');
    fs.writeFileSync(docPath, artifactContent, 'utf8');

    const sha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');
    const tldr = ArtifactCompiler.generateCompactTldr(this.draft);

    // Commit lock through StateManager
    StateManager.lockStep(this.workspaceRoot, 13, {
      stepNumber: 13,
      stepName: 'Knowledge Transfer, Documentation & Education',
      artifactPath: 'docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md',
      lockedAt: new Date().toISOString(),
      summary: tldr,
      artifactSha256: sha256
    });

    StateManager.advanceStep(this.workspaceRoot, 14);

    return {
      step: 13,
      isLocked: true,
      documentPath: 'docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md',
      message: `Step 13 (Knowledge Transfer, Documentation & Education) is officially LOCKED.\n\nArtifact created: \`docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md\` (SHA-256: ${sha256}).\nSession state advanced to Step 14.`
    };
  }
}
