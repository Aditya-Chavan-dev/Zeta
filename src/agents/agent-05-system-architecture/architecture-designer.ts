import { Step4ArchitectureDraft, ArchitecturalComponent, ArchitectureDecisionRecord, FailureScenario } from './types.js';

export interface DesignAnalysis {
  draft: Step4ArchitectureDraft;
  unresolvedArchitectureAreas: string[];
  completenessPercentage: number;
}

export class ArchitectureDesigner {
  public static createEmptyDraft(step0Tldr: string, step1Tldr: string, step2Tldr: string, step3Tldr: string): Step4ArchitectureDraft {
    const components: ArchitecturalComponent[] = [
      {
        id: 'COMP-01',
        name: 'IDE Hook & Runtime Bridge',
        layer: 'RUNTIME_BRIDGE',
        responsibility: 'Intercepts user IDE chat turns, injects system prompt constraints, and handles startup interruption detection.',
        inputs: ['Raw user chat prompt', 'IDE workspace metadata'],
        outputs: ['Sanitized turn input', 'Streaming response to user UI'],
        failureBehavior: 'If bridge throws, surfaces actionable error to user without killing host IDE.'
      },
      {
        id: 'COMP-02',
        name: 'State Manager & Atomic Storage',
        layer: 'STATE_PERSISTENCE',
        responsibility: 'Maintains .zeta/state.json via write-ahead temp file renaming; records every user and agent turn.',
        inputs: ['SessionState update requests', 'LockStep handshakes'],
        outputs: ['Committed session state', 'Locked step summaries with SHA-256'],
        failureBehavior: 'If file rename fails, retries with backoff and falls back to .tmp backup.'
      },
      {
        id: 'COMP-03',
        name: 'Autonomous Governance Engine & Stage Gates',
        layer: 'GOVERNANCE_ENGINE',
        responsibility: 'Enforces sequential 15-stage lifecycle; verifies preconditions before granting stage entry; detects intent drift.',
        inputs: ['Turn inputs', 'Active stage status'],
        outputs: ['Stage validation verdict', 'Impact cascade reports on drift'],
        failureBehavior: 'Halts downstream execution until prerequisite stages are marked LOCKED.'
      },
      {
        id: 'COMP-04',
        name: 'Agent Dispatcher & Elicitation Pipeline',
        layer: 'AGENT_DISPATCHER',
        responsibility: 'Invokes active stage architect (Agent 01 to 15), manages Top 3 options protocol, and compiles stage artifacts.',
        inputs: ['Turn payload', 'Active stage architect instance'],
        outputs: ['Clarifying questions with Top 3 options', 'Compiled markdown artifacts'],
        failureBehavior: 'Isolates stage exceptions and requests clarification without state loss.'
      }
    ];

    const adrs: ArchitectureDecisionRecord[] = [
      {
        id: 'ADR-01',
        title: 'Modular Monolith Architecture with Isolated Stage Agents',
        status: 'ACCEPTED',
        context: 'Need strict execution order, zero network latency, and zero background daemon processes.',
        decision: 'Implement pure TypeScript modular monolith where each stage agent is self-contained in src/agents/agent-xx/.',
        consequences: 'Zero network overhead and simple debugging; requires clean TypeScript boundary enforcement.'
      },
      {
        id: 'ADR-02',
        title: 'Synchronous Write-Ahead Journaling with Startup Resume Sentinel',
        status: 'ACCEPTED',
        context: 'Users abruptly terminate IDE processes; uncommitted state would otherwise be lost.',
        decision: 'Flush uncommitted buffer to .zeta/state.json on every single turn; check for uncommitted state on next startup.',
        consequences: 'Eliminates session loss completely; small file I/O overhead per message is well under 10ms.'
      }
    ];

    const fmeaScenarios: FailureScenario[] = [
      {
        id: 'FMEA-01',
        component: 'State Manager (COMP-02)',
        failureTrigger: 'Abrupt IDE crash or power loss during turn execution',
        impactSeverity: 'HIGH',
        containmentStrategy: 'Atomic temp file write + rename ensures .zeta/state.json is never partially written.',
        recoveryProcedure: 'ResumeSentinel inspects uncommittedBuffer upon restart and resumes at the interrupted question.'
      },
      {
        id: 'FMEA-02',
        component: 'Governance Engine (COMP-03)',
        failureTrigger: 'User requests features that contradict locked Step 0 Intent',
        impactSeverity: 'HIGH',
        containmentStrategy: 'IntentVerifier detects scope drift and flags warning.',
        recoveryProcedure: 'Prompts user with Impact Cascade Report to either reject drift or execute structured amendment.'
      }
    ];

    const mermaidC4Diagram = `flowchart TB
  subgraph InterfaceLayer ["Client & Interface Layer"]
    User([Software Engineer])
    ChatBridge["Runtime Chat Bridge\n(COMP-01)"]
  end

  subgraph OrchestrationLayer ["Orchestration & Governance Core"]
    Dispatcher["Agent Dispatcher & Router\n(COMP-04)"]
    Governance["Governance Engine\n(COMP-03)"]
    PreconditionSentinel["Precondition Sentinel\n(Integrity & Gating)"]
  end

  subgraph LifecycleAgents ["15-Stage Lifecycle Agent Domain"]
    AgentPool["Agents 00-14\n(Intent -> QA -> Retro)"]
    QuestionEngine["Question & Option\nGenerator"]
  end

  subgraph StorageLayer ["Persistence & Audit Boundary"]
    StateStore[(".zeta/state.json\n(Atomic State Manager COMP-02)")]
    SqliteWAL[(".zeta/governance.db\n(WAL SQLite Storage)")]
    DocArtifacts[("docs/*.md\n(Canonical Specifications)")]
  end

  User -->|"Chat Prompt / Stdio"| ChatBridge
  ChatBridge -->|"Dispatch Turn"| Dispatcher
  Dispatcher -->|"Evaluate Stage Gating"| Governance
  Governance -->|"Verify Stage Preconditions"| PreconditionSentinel
  Dispatcher -->|"Invoke Stage Architect"| AgentPool
  AgentPool -->|"Generate Questions / Top 3"| QuestionEngine
  Governance -->|"Atomic Read / Write"| StateStore
  Governance -->|"Audit & WAL Logging"| SqliteWAL
  AgentPool -->|"Compile Signed Document"| DocArtifacts`;

    return {
      step0Tldr,
      step1Tldr,
      step2Tldr,
      step3Tldr,
      architectureStyle: 'Modular Monolith (Local-first Clean Architecture)',
      components,
      adrs,
      fmeaScenarios,
      mermaidC4Diagram
    };
  }

  /**
   * Initializes evaluation and flags architecture decisions requiring user confirmation.
   */
  public static evaluate(userInput: string, s0: string, s1: string, s2: string, s3: string): DesignAnalysis {
    const draft = this.createEmptyDraft(s0, s1, s2, s3);
    const unresolvedArchitectureAreas: string[] = [
      'Inter-Agent Communication & Coupling',
      'Memory & Context Retention Topology',
      'Crash Isolation & Error Boundary Strategy'
    ];

    return {
      draft,
      unresolvedArchitectureAreas,
      completenessPercentage: 40
    };
  }
}
