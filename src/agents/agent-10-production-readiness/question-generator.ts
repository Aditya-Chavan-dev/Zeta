import { ClarifyingQuestion, Step9ProductionReadinessDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 options for a specific production readiness area.
   */
  public static generateForArea(area: string, _draft: Step9ProductionReadinessDraft): ClarifyingQuestion {
    switch (area) {
      case 'Production Deployment Packaging & Distribution Model':
        return {
          id: 'q-deploy-package',
          category: 'Production Deployment Packaging & Distribution Model',
          question: 'How should the production software artifact be packaged and distributed to target environments?',
          contextWhyNeeded: 'Determines the installation footprint, runtime dependencies, and update mechanisms for production users.',
          top3Options: [
            {
              title: 'Self-Contained Bundled Plugin / NPM Package (Recommended)',
              description: 'Bundle all runtime code, schema definitions, and assets into an npm package and IDE VSIX/plugin bundle with zero external daemon requirements.',
              tradeOffs: 'Zero setup friction; fast launch (< 500ms); respects strict greenfield local IDE boundary.',
              recommended: true
            },
            {
              title: 'Pre-Compiled Tarball with Standalone CLI Wrapper',
              description: 'Publish platform-specific tarballs (.tar.gz / .zip) containing a bundled Node runtime and execution binary.',
              tradeOffs: 'Eliminates host Node.js requirement; larger artifact download size (~40MB per platform).'
            },
            {
              title: 'Containerized Daemon (Docker / Podman)',
              description: 'Run the governance engine as a local Docker container exposing a localhost REST/gRPC API.',
              tradeOffs: 'Requires Docker daemon; heavy memory overhead and violates local zero-dependency ideal.'
            }
          ]
        };

      case 'Zero-Downtime Rollout & Update Protocol':
        return {
          id: 'q-zero-downtime',
          category: 'Zero-Downtime Rollout & Update Protocol',
          question: 'What rollout mechanism should protect ongoing active project sessions during plugin version upgrades?',
          contextWhyNeeded: 'Prevents active turn corruption or locked step invalidation when an update is installed.',
          top3Options: [
            {
              title: 'Atomic In-Place State Preservation with Backward-Compatible Schema Migrations (Recommended)',
              description: 'Active turns complete under current version; state schema migrations run idempotently on next startup with zero data loss.',
              tradeOffs: 'Seamless background updates; requires strict schema backward compatibility tests.',
              recommended: true
            },
            {
              title: 'Canary Rollout with Version Pinning',
              description: 'Allow users to opt-in to new versions while locking projects to the version they were initiated with.',
              tradeOffs: 'Safe; requires maintaining multiple concurrent active runtime versions on disk.'
            },
            {
              title: 'Full Process Shutdown & Restart Guard',
              description: 'Prompt user to pause active turns, exit IDE, and restart cleanly before upgrading.',
              tradeOffs: 'Guarantees zero concurrent file lock collision; introduces minor developer friction.'
            }
          ]
        };

      case 'Observability, Crash Telemetry & Log Rotation':
      default:
        return {
          id: 'q-observability',
          category: 'Observability, Crash Telemetry & Log Rotation',
          question: 'How should operational errors, health diagnostics, and crash reports be handled in production?',
          contextWhyNeeded: 'Allows developers to diagnose production issues quickly without leaking sensitive code or data.',
          top3Options: [
            {
              title: 'Local Structured Crash Logging with 5MB Capped Rotation (Recommended)',
              description: 'Write JSON-formatted telemetry and stack traces to local .zeta/crashes.log with automatic truncation and zero external telemetry transmission.',
              tradeOffs: '100% privacy-preserving; zero external network egress; capped disk usage.',
              recommended: true
            },
            {
              title: 'Opt-In Anonymized Sentry / Telemetry Cloud Collector',
              description: 'Send sanitized error signatures to a remote monitoring service with user consent toggle.',
              tradeOffs: 'Proactive bug visibility for authors; requires network access and privacy compliance.'
            },
            {
              title: 'Standard Console Out Only (Silent Mode)',
              description: 'Write errors strictly to stdout/stderr without persisting crash logs to disk.',
              tradeOffs: 'Zero disk footprint; crash diagnostic data is lost once terminal is closed.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unresolved readiness areas.
   */
  public static generateAllQuestions(unresolvedAreas: string[], draft: Step9ProductionReadinessDraft): ClarifyingQuestion[] {
    return unresolvedAreas.map(area => this.generateForArea(area, draft));
  }
}
