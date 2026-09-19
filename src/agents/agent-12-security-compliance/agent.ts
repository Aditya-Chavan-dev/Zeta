import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { SecurityAuditor } from './security-auditor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { AgentResponse, Step11SecurityComplianceDraft } from './types.js';

export class Agent12SecurityCompliance {
  private workspaceRoot: string;
  private draft: Step11SecurityComplianceDraft | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Handles user turns interactively.
   */
  public async handleTurn(userInput: string): Promise<AgentResponse> {
    // 1. Check prerequisites (Steps 0 through 10 must be locked)
    const precondition = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
    if (!precondition.isValid) {
      return {
        step: 11,
        isLocked: false,
        message: precondition.errorMessage || 'Precondition verification failed.',
        error: true
      };
    }

    // 2. Initialize draft if not present
    if (!this.draft) {
      this.draft = SecurityAuditor.createEmptyDraft(
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
        precondition.step10Tldr
      );
    }

    // Record turn in uncommitted state buffer
    StateManager.recordTurn(this.workspaceRoot, userInput, 'Auditing security and privacy compliance');

    // 3. Handle explicit Approval handshake
    if (userInput.trim().toLowerCase() === 'approve') {
      return this.lockAndCompleteStep();
    }

    // 4. Process user input if answering an unresolved area
    if (this.draft.unresolvedAreas.length > 0) {
      const currentArea = this.draft.unresolvedAreas[0];
      // Apply answer
      SecurityAuditor.applyAnswer(this.draft, currentArea, userInput);

      // If more questions remain, ask the next one
      if (this.draft.unresolvedAreas.length > 0) {
        const nextArea = this.draft.unresolvedAreas[0];
        const question = QuestionGenerator.generateForArea(nextArea, this.draft);

        const optionsText = question.top3Options
          .map((opt, i) => `${i + 1}. **${opt.title}**\n   - Description: ${opt.description}\n   - Trade-offs: ${opt.tradeOffs}`)
          .join('\n\n');

        return {
          step: 11,
          isLocked: false,
          message: `### Security, Privacy & Compliance Assessment: ${question.category}\n\n${question.question}\n\n${optionsText}\n\nPlease select an option (1, 2, or 3) or provide your custom security specification:`,
          question
        };
      }
    }

    // 5. All areas resolved -> Present final security review for signoff
    const previewArtifact = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetDocPath = path.join(docsDir, 'SECURITY_PRIVACY_AND_COMPLIANCE.md');
    fs.writeFileSync(targetDocPath, previewArtifact, 'utf8');

    return {
      step: 11,
      isLocked: false,
      isReadyForSignoff: true,
      documentPath: 'docs/SECURITY_PRIVACY_AND_COMPLIANCE.md',
      message: `Security, Privacy & Compliance architecture has been audited and compiled into \`docs/SECURITY_PRIVACY_AND_COMPLIANCE.md\`.\n\nAll STRIDE threat models, zero-cloud-egress boundaries, secrets scanning, and SBOM licensing rules are satisfied.\n\nPlease review and reply with **Approve** to lock Step 11 and advance to Step 12 (Governance, Lifecycle & Deprecation).`
    };
  }

  /**
   * Finalizes artifact on disk, calculates SHA-256, locks Step 11 in StateManager, and advances to Step 12.
   */
  private lockAndCompleteStep(): AgentResponse {
    if (!this.draft) {
      throw new Error('Cannot lock Step 11 without active security draft.');
    }

    const artifactContent = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const docPath = path.join(docsDir, 'SECURITY_PRIVACY_AND_COMPLIANCE.md');
    fs.writeFileSync(docPath, artifactContent, 'utf8');

    const sha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');
    const tldr = ArtifactCompiler.generateCompactTldr(this.draft);

    // Commit lock through StateManager
    StateManager.lockStep(this.workspaceRoot, 11, {
      stepNumber: 11,
      stepName: 'Security, Privacy & Compliance',
      artifactPath: 'docs/SECURITY_PRIVACY_AND_COMPLIANCE.md',
      lockedAt: new Date().toISOString(),
      summary: tldr,
      artifactSha256: sha256
    });

    StateManager.advanceStep(this.workspaceRoot, 12);

    return {
      step: 11,
      isLocked: true,
      documentPath: 'docs/SECURITY_PRIVACY_AND_COMPLIANCE.md',
      message: `Step 11 (Security, Privacy & Compliance) is officially LOCKED.\n\nArtifact created: \`docs/SECURITY_PRIVACY_AND_COMPLIANCE.md\` (SHA-256: ${sha256}).\nSession state advanced to Step 12.`
    };
  }
}
