# Autonomous Engineering Governance Plugin

> Zero-configuration autonomous engineering governance plugin for greenfield software projects across a 15-stage sequential lifecycle.

[![Tests](https://img.shields.io/badge/tests-88%20passing-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What It Does

The Autonomous Governance Plugin enforces a strict, disciplined 15-stage lifecycle from problem definition (Step 0) to retrospective (Step 14). It guarantees:
1. **Zero State Loss**: Atomic per-turn persistence to `.zeta/state.json` with multi-iteration Windows lock retry.
2. **Strict Sequential Gating**: Step $N$ cannot start until Steps $0$ through $N-1$ are cryptographically locked.
3. **Explicit Human Handshake**: Agents never self-approve. They present options and require an explicit `"Approve"` handshake.
4. **Top 3 Industry Options**: Eliminates open-ended decision paralysis by offering curated industry options with trade-offs.
5. **Zero Cloud Egress**: 100% local persistence on developer machine; no remote daemons or servers required.

---

## 15-Stage Lifecycle

| Step | Stage | Target Document |
|:---:|---|---|
| **0** | Problem Definition & Intent | `docs/PROJECT_INTENT.md` |
| **1** | Requirements Gathering & Elicitation | `docs/REQUIREMENTS_SPECIFICATION.md` |
| **2** | Feasibility, Constraints & Risk | `docs/FEASIBILITY_AND_RISK_REPORT.md` |
| **3** | Technology Strategy & Tech-Stack Selection | `docs/TECH_STACK_AND_STRATEGY.md` |
| **4** | System Architecture & Solution Design | `docs/SYSTEM_ARCHITECTURE_BLUEPRINT.md` |
| **5** | Detailed Technical Design & Engineering Design | `docs/DETAILED_TECHNICAL_DESIGN.md` |
| **6** | Implementation Planning & Work Breakdown | `docs/IMPLEMENTATION_PLAN_AND_WBS.md` |
| **7** | Implementation & Software Construction | `docs/IMPLEMENTED_RELEASE_CANDIDATE.md` |
| **8** | Verification, Validation & QA | `docs/VERIFICATION_AND_QA_PACKAGE.md` |
| **9** | Production Readiness & Release | `docs/PRODUCTION_READINESS_AND_DEPLOYMENT.md` |
| **10** | Operations, Maintenance & SRE | `docs/OPERATIONS_MAINTENANCE_AND_SRE.md` |
| **11** | Security, Privacy & Compliance | `docs/SECURITY_PRIVACY_AND_COMPLIANCE.md` |
| **12** | Governance, Lifecycle & Deprecation Policy | `docs/GOVERNANCE_LIFECYCLE_AND_DEPRECATION.md` |
| **13** | Knowledge Transfer & Documentation | `docs/KNOWLEDGE_TRANSFER_AND_DOCUMENTATION.md` |
| **14** | Project Retrospective & Continuous Improvement | `docs/PROJECT_RETROSPECTIVE_AND_IMPROVEMENT.md` |

---

## Installation & Usage

### Option 1: Run via npx (Zero Install)
Run directly in any project folder:
```bash
npx https://github.com/your-username/zeta-architect
# or once published to npm:
npx zeta
```

### Option 2: Clone & Run
```bash
git clone https://github.com/your-username/zeta-architect.git
cd zeta-architect
npm install
npm run build
npm test
```

### Option 3: Antigravity / Gemini IDE In-Chat Skill
Copy the `.agents/` folder into your repository root:
```bash
cp -r .agents/ /path/to/your-repo/.agents/
```
In chat, activate it by typing:
> `/zeta` or `start project`

---

## Testing

Run the full test suite (88 tests across 31 suites):
```bash
npm test
```

## License
MIT
