import { Step4ArchitectureDraft } from './types.js';

/**
 * Generates a high-resolution, dark-mode vector SVG blueprint of the system architecture.
 * Self-contained, zero cloud dependencies, crisp at retina resolutions.
 */
export function generateArchitectureSvg(draft?: Step4ArchitectureDraft): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 640" width="100%" height="100%" style="background:#0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Gradients -->
    <linearGradient id="tierBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#161e2e" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="clientGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="orchGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="agentGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>
    <linearGradient id="storeGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    
    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>

    <!-- Arrow Markers -->
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
    </marker>
    <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
    </marker>
    <marker id="arrow-indigo" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#818cf8" />
    </marker>
  </defs>

  <!-- Canvas Header -->
  <rect x="0" y="0" width="1000" height="52" fill="#0d131f" />
  <line x1="0" y1="52" x2="1000" y2="52" stroke="#1e293b" stroke-width="1.5" />
  <circle cx="28" cy="26" r="6" fill="#ef4444" />
  <circle cx="46" cy="26" r="6" fill="#f59e0b" />
  <circle cx="64" cy="26" r="6" fill="#10b981" />
  <text x="90" y="31" fill="#f8fafc" font-size="14" font-weight="700" letter-spacing="0.5">ZETA SYSTEM ARCHITECTURE BLUEPRINT</text>
  <rect x="740" y="14" width="236" height="24" rx="12" fill="#1e293b" stroke="#334155" />
  <text x="752" y="30" fill="#38bdf8" font-size="11" font-weight="600">MODULAR LOCAL MONOLITH</text>
  <circle cx="958" cy="26" r="4" fill="#34d399" />

  <!-- ================= TIER 1: CLIENT & INGESTION LAYER ================= -->
  <g id="tier-ingestion">
    <rect x="30" y="75" width="280" height="235" rx="12" fill="url(#tierBg)" stroke="#1e293b" stroke-width="1.5" />
    <rect x="42" y="87" width="180" height="20" rx="4" fill="#0c4a6e" fill-opacity="0.5" />
    <text x="50" y="101" fill="#38bdf8" font-size="11" font-weight="700" letter-spacing="0.5">1. CLIENT &amp; INGESTION</text>

    <!-- Client Pill -->
    <rect x="50" y="125" width="240" height="56" rx="28" fill="url(#clientGrad)" filter="url(#shadow)" stroke="#38bdf8" stroke-width="1" />
    <text x="95" y="150" fill="#ffffff" font-size="13" font-weight="700">IDE / Developer User</text>
    <text x="95" y="166" fill="#bae6fd" font-size="11">Chat Input &amp; Turn Commands</text>
    <circle cx="74" cy="153" r="14" fill="#0284c7" />
    <text x="68" y="158" fill="#ffffff" font-size="14">💻</text>

    <!-- Runtime Bridge -->
    <rect x="50" y="215" width="240" height="68" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" filter="url(#shadow)" />
    <text x="65" y="240" fill="#f8fafc" font-size="13" font-weight="700">Runtime Chat Bridge</text>
    <text x="65" y="258" fill="#94a3b8" font-size="11">COMP-01 • Ingestion &amp; Sanitizer</text>
    <text x="65" y="272" fill="#64748b" font-size="10">Startup Sentinel &amp; Stream Parser</text>
  </g>

  <!-- ================= TIER 2: ORCHESTRATION & GOVERNANCE CORE ================= -->
  <g id="tier-orchestration">
    <rect x="345" y="75" width="310" height="235" rx="12" fill="url(#tierBg)" stroke="#1e293b" stroke-width="1.5" />
    <rect x="357" y="87" width="190" height="20" rx="4" fill="#312e81" fill-opacity="0.5" />
    <text x="365" y="101" fill="#818cf8" font-size="11" font-weight="700" letter-spacing="0.5">2. GOVERNANCE &amp; CORE</text>

    <!-- Dispatcher Box -->
    <rect x="365" y="125" width="270" height="68" rx="8" fill="#1e293b" stroke="#818cf8" stroke-width="1.5" filter="url(#shadow)" />
    <text x="380" y="148" fill="#f8fafc" font-size="13" font-weight="700">Agent Dispatcher &amp; Router</text>
    <text x="380" y="165" fill="#a5b4fc" font-size="11">COMP-04 • Turn Gating &amp; Routing</text>
    <text x="380" y="179" fill="#64748b" font-size="10">Directs Turn to Active Stage Architect</text>

    <!-- Governance Engine Box -->
    <rect x="365" y="215" width="270" height="74" rx="8" fill="url(#orchGrad)" stroke="#c7d2fe" stroke-width="1" filter="url(#shadow)" />
    <text x="380" y="240" fill="#ffffff" font-size="13" font-weight="700">Central Governance Engine</text>
    <text x="380" y="258" fill="#e0e7ff" font-size="11">COMP-03 • Decision Authority</text>
    <text x="380" y="274" fill="#c7d2fe" font-size="10">Precondition Sentinel • LockStep Handshake</text>
  </g>

  <!-- ================= TIER 3: LIFECYCLE AGENT DOMAIN ================= -->
  <g id="tier-agents">
    <rect x="690" y="75" width="280" height="235" rx="12" fill="url(#tierBg)" stroke="#1e293b" stroke-width="1.5" />
    <rect x="702" y="87" width="190" height="20" rx="4" fill="#064e3b" fill-opacity="0.5" />
    <text x="710" y="101" fill="#34d399" font-size="11" font-weight="700" letter-spacing="0.5">3. LIFECYCLE AGENTS</text>

    <!-- Lifecycle Agent Pool -->
    <rect x="710" y="125" width="240" height="68" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.5" filter="url(#shadow)" />
    <text x="725" y="148" fill="#f8fafc" font-size="13" font-weight="700">15-Stage Agent Domain</text>
    <text x="725" y="165" fill="#6ee7b7" font-size="11">Agents 00-14 (Intent → Retro)</text>
    <text x="725" y="179" fill="#64748b" font-size="10">Single-Responsibility Architects</text>

    <!-- Elicitation & Options Engine -->
    <rect x="710" y="215" width="240" height="68" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5" filter="url(#shadow)" />
    <text x="725" y="240" fill="#f8fafc" font-size="13" font-weight="700">Interactive Elicitation Engine</text>
    <text x="725" y="258" fill="#6ee7b7" font-size="11">Clarification Loops &amp; Edge Cases</text>
    <text x="725" y="272" fill="#64748b" font-size="10">Strict "No" Exclusion &amp; Top 3 Trade-offs</text>
  </g>

  <!-- ================= TIER 4: PERSISTENCE & DELIVERABLES ================= -->
  <g id="tier-storage">
    <rect x="30" y="355" width="940" height="250" rx="12" fill="url(#tierBg)" stroke="#1e293b" stroke-width="1.5" />
    <rect x="42" y="367" width="240" height="20" rx="4" fill="#1e293b" fill-opacity="0.8" />
    <text x="50" y="381" fill="#94a3b8" font-size="11" font-weight="700" letter-spacing="0.5">4. STORAGE, STATE &amp; DELIVERABLES</text>

    <!-- Datastore 1: Atomic State Store -->
    <g transform="translate(60, 410)">
      <path d="M 0 15 C 0 5, 240 5, 240 15 L 240 120 C 240 130, 0 130, 0 120 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" filter="url(#shadow)"/>
      <ellipse cx="120" cy="15" rx="120" ry="12" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="120" y="55" fill="#f8fafc" font-size="14" font-weight="700" text-anchor="middle">Atomic State Store</text>
      <text x="120" y="75" fill="#38bdf8" font-size="11" text-anchor="middle">COMP-02 • .zeta/state.json</text>
      <text x="120" y="95" fill="#94a3b8" font-size="10" text-anchor="middle">Write-Ahead Atomic Renaming</text>
      <text x="120" y="110" fill="#64748b" font-size="10" text-anchor="middle">Zero-Loss Interruption Sentinel</text>
    </g>

    <!-- Datastore 2: SQLite WAL Store -->
    <g transform="translate(380, 410)">
      <path d="M 0 15 C 0 5, 240 5, 240 15 L 240 120 C 240 130, 0 130, 0 120 Z" fill="#1e293b" stroke="#818cf8" stroke-width="1.5" filter="url(#shadow)"/>
      <ellipse cx="120" cy="15" rx="120" ry="12" fill="#0f172a" stroke="#818cf8" stroke-width="1.5"/>
      <text x="120" y="55" fill="#f8fafc" font-size="14" font-weight="700" text-anchor="middle">SQLite WAL Database</text>
      <text x="120" y="75" fill="#a5b4fc" font-size="11" text-anchor="middle">SqliteStore (.zeta/zeta.db)</text>
      <text x="120" y="95" fill="#94a3b8" font-size="10" text-anchor="middle">Transactional Revision History</text>
      <text x="120" y="110" fill="#64748b" font-size="10" text-anchor="middle">Full Audit Trails &amp; Snapshots</text>
    </g>

    <!-- Datastore 3: Canonical Docs -->
    <g transform="translate(700, 410)">
      <rect x="0" y="5" width="240" height="125" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="1.5" filter="url(#shadow)" />
      <text x="120" y="38" fill="#f8fafc" font-size="14" font-weight="700" text-anchor="middle">Canonical Deliverables</text>
      <text x="120" y="58" fill="#34d399" font-size="11" text-anchor="middle">docs/*.md Specifications</text>
      <text x="120" y="80" fill="#94a3b8" font-size="10" text-anchor="middle">SHA-256 Signed Artifacts</text>
      <text x="120" y="98" fill="#6ee7b7" font-size="10" text-anchor="middle">Evo Handoff Package</text>
      <text x="120" y="114" fill="#64748b" font-size="9" text-anchor="middle">100% Offline Markdown Single-Source</text>
    </g>
  </g>

  <!-- ================= CONNECTING ARROWS & LABELS ================= -->
  <!-- User to Bridge -->
  <line x1="170" y1="181" x2="170" y2="213" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-cyan)" />

  <!-- Bridge to Dispatcher -->
  <path d="M 290 249 L 325 249 L 325 159 L 363 159" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-cyan)" />
  <rect x="300" y="195" width="55" height="18" rx="4" fill="#0c4a6e" />
  <text x="327" y="208" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">Turn In</text>

  <!-- Dispatcher to Governance -->
  <line x1="500" y1="193" x2="500" y2="213" stroke="#818cf8" stroke-width="2" marker-end="url(#arrow-indigo)" />

  <!-- Dispatcher to Agent Pool -->
  <line x1="635" y1="159" x2="708" y2="159" stroke="#818cf8" stroke-width="2" marker-end="url(#arrow-indigo)" />
  <rect x="645" y="148" width="50" height="18" rx="4" fill="#312e81" />
  <text x="670" y="161" fill="#c7d2fe" font-size="9" font-weight="700" text-anchor="middle">Dispatch</text>

  <!-- Agent Pool to Elicitation Engine -->
  <line x1="830" y1="193" x2="830" y2="213" stroke="#34d399" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Governance down to StateStore -->
  <path d="M 435 289 L 435 330 L 180 330 L 180 408" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#arrow-cyan)" />

  <!-- Governance down to SQLite -->
  <line x1="500" y1="289" x2="500" y2="408" stroke="#818cf8" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#arrow-indigo)" />

  <!-- Agent Pool down to Docs -->
  <path d="M 900 283 L 900 335 L 820 335 L 820 413" fill="none" stroke="#34d399" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#arrow)" />
</svg>`;
}
