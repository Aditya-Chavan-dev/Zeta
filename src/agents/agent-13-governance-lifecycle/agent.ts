import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateManager } from '../../core/state/state-manager.js';
import { PreconditionVerifier } from './precondition-verifier.js';
import { GovernanceAuditor } from './governance-auditor.js';
import { QuestionGenerator } from './question-generator.js';
import { ArtifactCompiler } from './artifact-compiler.js';
import { AgentResponse, Step12GovernanceLifecycleDraft } from './types.js';
import { DriftInterceptor } from '../../core/drift/interceptor.js';

export class Agent13GovernanceLifecycle {
  private workspaceRoot: string;
  private draft: Step12GovernanceLifecycleDraft | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Handles user turns interactively.
   */
  public async handleTurn(userInput: string): Promise<AgentResponse> {
    // 1. Check prerequisites (Steps 0 through 11 must be locked)
    const precondition = PreconditionVerifier.verifyPrerequisites(this.workspaceRoot);
    if (!precondition.isValid) {
      return {
        step: 12,
        isLocked: false,
        message: precondition.errorMessage || 'Precondition verification failed.',
        error: true
      };
    }

    // 2. Initialize draft if not present
    if (!this.draft) {
      this.draft = GovernanceAuditor.createEmptyDraft(
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
        precondition.step11Tldr
      );
    }

    // Record turn in uncommitted state buffer
    StateManager.recordTurn(this.workspaceRoot, userInput, 'Auditing governance and lifecycle policies');

    // 3. Handle explicit Approval handshake
    if (userInput.trim().toLowerCase() === 'approve') {
      return this.lockAndCompleteStep();
    }

    // Drift check against agreed baselines
    const drift = DriftInterceptor.evaluateWorkspace(this.workspaceRoot, userInput.trim());
    if (drift.shouldIntercept) {
      return {
        step: 12,
        message: drift.conversationalPrompt,
        isLocked: false,
        isReadyForSignoff: false
      };
    }

    // 4. Process user input if answering an unresolved area
    if (this.draft.unresolvedAreas.length > 0) {
      const currentArea = this.draft.unresolvedAreas[0];
      // Apply answer
      GovernanceAuditor.applyAnswer(this.draft, currentArea, userInput);

      // If more questions remain, ask the next one
      if (this.draft.unresolvedAreas.length > 0) {
        const nextArea = this.draft.unresolvedAreas[0];
        const question = QuestionGenerator.generateForArea(nextArea, this.draft);

        const optionsText = question.top3Options
          .map((opt, i) => `${i + 1}. **${opt.title}**\n   - Description: ${opt.description}\n   - Trade-offs: ${opt.tradeOffs}`)
          .join('\n\n');

        return {
          step: 12,
          isLocked: false,
          message: `### Governance & Lifecycle Policy Assessment: ${question.category}\n\n${question.question}\n\n${optionsText}\n\nPlease select an option (1, 2, or 3) or provide your custom governance policy specification:`,
          question
        };
      }
    }

    // 5. All areas resolved -> Present final governance policy review for signoff
    const previewArtifact = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const targetDocPath = path.join(docsDir, 'GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md');
    fs.writeFileSync(targetDocPath, previewArtifact, 'utf8');

    return {
      step: 12,
      isLocked: false,
      isReadyForSignoff: true,
      documentPath: 'docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md',
      message: `Governance, Lifecycle & Deprecation policies have been audited and compiled into \`docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md\`.\n\nAll SemVer rules, deprecation phases, schema migrations, and drift guardrails are satisfied.\n\nPlease review and reply with **Approve** to lock Step 12 and advance to Step 13 (Knowledge Transfer, Documentation & Education).`
    };
  }

  /**
   * Finalizes artifact on disk, calculates SHA-256, locks Step 12 in StateManager, and advances to Step 13.
   */
  private lockAndCompleteStep(): AgentResponse {
    if (!this.draft) {
      throw new Error('Cannot lock Step 12 without active governance draft.');
    }

    const artifactContent = ArtifactCompiler.compileArtifact(this.draft);
    const docsDir = path.join(this.workspaceRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const docPath = path.join(docsDir, 'GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md');
    fs.writeFileSync(docPath, artifactContent, 'utf8');

    const sha256 = crypto.createHash('sha256').update(artifactContent).digest('hex');
    const tldr = ArtifactCompiler.generateCompactTldr(this.draft);

    // Commit lock through StateManager
    StateManager.lockStep(this.workspaceRoot, 12, {
      stepNumber: 12,
      stepName: 'Governance, Lifecycle & Deprecation Policy',
      artifactPath: 'docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md',
      lockedAt: new Date().toISOString(),
      summary: tldr,
      artifactSha256: sha256
    });

    StateManager.advanceStep(this.workspaceRoot, 13);

    return {
      step: 12,
      isLocked: true,
      documentPath: 'docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md',
      message: `Step 12 (Governance, Lifecycle & Deprecation Policy) is officially LOCKED.\n\nArtifact created: \`docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md\` (SHA-256: ${sha256}).\nSession state advanced to Step 13.`
    };
  }
}
