import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { RetrospectiveAuditor } from './retrospective-auditor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { AgentResponse, Step14RetrospectiveDraft } from './types.js';

export class Agent15Retrospective {
  private workspaceRoot: string;
  private draft: Step14RetrospectiveDraft | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Handles user turns interactively.
   */
  public async handleTurn(userInput: string): Promise<AgentResponse> {
    // 1. Check prerequisites (Steps 0 through 13 must be locked)
    const precondition = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
    if (!precondition.isValid) {
      return {
        step: 14,
        isLocked: false,
        message: precondition.errorMessage || 'Precondition verification failed.',
        error: true
      };
    }

    // 2. Initialize draft if not present
    if (!this.draft) {
      this.draft = RetrospectiveAuditor.createEmptyDraft(
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
        precondition.step12Tldr,
        precondition.step13Tldr
      );
    }

    // Record turn in uncommitted state buffer
    StateManager.recordTurn(this.workspaceRoot, userInput, 'Conducting project retrospective');

    // 3. Handle explicit Approval handshake
    if (userInput.trim().toLowerCase() === 'approve') {
      return this.lockAndCompleteProject();
    }

    // 4. Process user input if answering an unresolved area
    if (this.draft.unresolvedAreas.length > 0) {
      const currentArea = this.draft.unresolvedAreas[0];
      // Apply answer
      RetrospectiveAuditor.applyAnswer(this.draft, currentArea, userInput);

      // If more questions remain, ask the next one
      if (this.draft.unresolvedAreas.length > 0) {
        const nextArea = this.draft.unresolvedAreas[0];
        const question = QuestionGenerator.generateForArea(nextArea, this.draft);

        const optionsText = question.top3Options
          .map((opt, i) => `${i + 1}. **${opt.title}**\n   - Description: ${opt.description}\n   - Trade-offs: ${opt.tradeOffs}`)
          .join('\n\n');

        return {
          step: 14,
          isLocked: false,
          message: `### Project Retrospective Assessment: ${question.category}\n\n${question.question}\n\n${optionsText}\n\nPlease select an option (1, 2, or 3) or provide your custom retrospective input:`,
          question
        };
      }
    }

    // 5. All areas resolved -> Present final project retrospective review for signoff
    const previewArtifact = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetDocPath = path.join(docsDir, 'PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md');
    fs.writeFileSync(targetDocPath, previewArtifact, 'utf8');

    return {
      step: 14,
      isLocked: false,
      isReadyForSignoff: true,
      documentPath: 'docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md',
      message: `Full project retrospective across all 15 lifecycle stages has been compiled into \`docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md\`.\n\nAll architectural fidelity metrics, lessons learned, and Kaizen action items are verified.\n\nPlease review and reply with **Approve** to lock Step 14 and officially complete the entire autonomous engineering governance lifecycle.`
    };
  }

  /**
   * Finalizes artifact on disk, calculates SHA-256, locks Step 14 in StateManager, and marks project complete.
   */
  private lockAndCompleteProject(): AgentResponse {
    if (!this.draft) {
      throw new Error('Cannot lock Step 14 without active retrospective draft.');
    }

    const artifactContent = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const docPath = path.join(docsDir, 'PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md');
    fs.writeFileSync(docPath, artifactContent, 'utf8');

    const sha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');
    const tldr = ArtifactCompiler.generateCompactTldr(this.draft);

    // Commit lock through StateManager
    StateManager.lockStep(this.workspaceRoot, 14, {
      stepNumber: 14,
      stepName: 'Project Retrospective & Continuous Improvement',
      artifactPath: 'docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md',
      lockedAt: new Date().toISOString(),
      summary: tldr,
      artifactSha256: sha256
    });

    return {
      step: 14,
      isLocked: true,
      projectCompleted: true,
      documentPath: 'docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md',
      message: `🎉 ALL 15 STAGES COMPLETE! Step 14 (Project Retrospective & Continuous Improvement) is officially LOCKED.\n\nArtifact created: \`docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md\` (SHA-256: ${sha256}).\n\nThe entire autonomous engineering governance lifecycle (Steps 0 through 14) is officially certified and 100% complete!`
    };
  }
}
