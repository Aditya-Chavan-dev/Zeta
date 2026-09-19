import { ClarifyingQuestion, OptionChoice, Step3TechStrategyDraft } from './types.js';

export class QuestionGenerator {
  /**
   * Generates a targeted question with Top 3 candidate options for a specific technology category.
   */
  public static generateForCategory(category: string, draft: Step3TechStrategyDraft): ClarifyingQuestion {
    switch (category) {
      case 'Communication & Extension Protocol':
        return {
          id: 'q-tech-communication',
          category: 'Communication & Extension Protocol',
          question: 'What interface protocol should bridge the IDE chat/runtime to the autonomous governance engine?',
          contextWhyNeeded: 'Determines how the plugin intercepts turns, exchanges prompts, and streams progress to the user.',
          top3Options: [
            {
              title: 'Native In-Process IDE Extension API (VS Code / Antigravity Hooks)',
              description: 'Direct in-memory method calls within the extension host; ultra-fast (< 5ms) with zero IPC overhead.',
              tradeOffs: 'Coupled to Node.js IDE extension hosts; requires adapter layer for standalone CLI.',
              recommended: true
            },
            {
              title: 'Model Context Protocol (MCP) Server via stdio',
              description: 'Universal JSON-RPC 2.0 protocol over standard input/output; works with Claude Desktop, Cursor, and IDEs.',
              tradeOffs: 'Adds JSON serialization overhead; process management overhead on startup.'
            },
            {
              title: 'Local HTTP / WebSocket Daemon',
              description: 'Standalone HTTP server running on localhost (e.g. port 4100).',
              tradeOffs: 'Violates zero-daemon constraint; port collision risks and firewall warnings.'
            }
          ]
        };

      case 'Testing & Verification Framework':
        return {
          id: 'q-tech-testing',
          category: 'Testing & Verification Framework',
          question: 'What test runner and assertion framework should govern automated testing across all 15 agents?',
          contextWhyNeeded: 'Reliable, low-overhead testing is vital for fast developer feedback without configuration bloat.',
          top3Options: [
            {
              title: 'Native Node.js Test Runner (node:test + node:assert/strict with tsx)',
              description: 'Zero external test runner dependencies; executes in < 50ms with instant TypeScript execution.',
              tradeOffs: 'Fewer complex snapshot plugins than Jest; maximum speed and zero dependency maintenance.',
              recommended: true
            },
            {
              title: 'Vitest (Vite-powered test suite)',
              description: 'Modern, feature-rich test runner with built-in watch mode, coverage, and UI plugins.',
              tradeOffs: 'Adds Vite and Rollup dependency tree; slightly longer cold-start execution time.'
            },
            {
              title: 'Jest with ts-jest',
              description: 'Industry-standard enterprise testing framework with widespread community examples.',
              tradeOffs: 'Heavyweight; notorious ESM/TypeScript configuration friction in NodeNext.'
            }
          ]
        };

      case 'Build Tooling & Compilation':
      default:
        return {
          id: 'q-tech-build',
          category: 'Build Tooling & Compilation',
          question: 'What compilation and bundling pipeline should package the TypeScript engine for production distribution?',
          contextWhyNeeded: 'Clean bundling ensures small package footprints and fast extension loading.',
          top3Options: [
            {
              title: 'TypeScript Compiler (tsc) + tsx for development',
              description: 'Standard TypeScript compiler emitting clean, unbundled ES2022 JavaScript modules with source maps.',
              tradeOffs: 'Emits multiple .js files rather than a single bundle; completely transparent and standard.',
              recommended: true
            },
            {
              title: 'esbuild / tsup single-file bundler',
              description: 'Ultra-fast Go-based bundler packaging the entire extension into a single lightweight dist/index.js.',
              tradeOffs: 'Slightly obfuscates individual file stack traces unless source maps are configured.'
            },
            {
              title: 'Webpack 5 with ts-loader',
              description: 'Traditional enterprise bundling suite with extensive plugin ecosystem.',
              tradeOffs: 'Slow compilation times; large, complex configuration files.'
            }
          ]
        };
    }
  }

  /**
   * Returns a list of clarifying questions for all unselected categories.
   */
  public static generateAllQuestions(unselectedCategories: string[], draft: Step3TechStrategyDraft): ClarifyingQuestion[] {
    return unselectedCategories.map(cat => this.generateForCategory(cat, draft));
  }
}
