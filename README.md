# Zeta

> Turn your idea into working software, step by step.

[![Tests](https://img.shields.io/badge/tests-146%20passing-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Zeta is an AI assistant that takes you from a rough idea to a finished, working application. Instead of jumping straight into messy code, Zeta guides you through clear steps so nothing breaks, nothing gets missed, and you always stay in control.

---

## How It Works

1. **Clarify Your Idea**: Share your idea or problem in plain English. Zeta asks a few targeted questions to make sure the goals and boundaries are crystal clear.
2. **Pick the Right Tools**: Zeta suggests the top 3 best ways to build it with honest pros and cons. You decide what fits best.
3. **Build Step by Step**: Zeta plans, writes, and tests the code stage by stage.
4. **You're in Control**: Nothing advances or locks in until you review it and say **"Approve"**.
5. **Resume Anytime**: Everything is saved directly on your computer. You can close your editor and pick up right where you left off.

---

## What Makes Zeta Different

* **Zero Buzzwords, Zero Confusion**: Plain English guidance without overwhelming technical jargon.
* **No Decision Paralysis**: When a technical choice is needed, Zeta provides curated Top 3 options with clear trade-offs.
* **Never Loses Progress**: Automatically saves your project state on disk after every turn.
* **100% Local & Private**: No cloud servers or remote accounts required. Everything stays on your machine.
* **Doesn't Hijack Normal Coding**: Zeta only runs when you ask it to build or manage a project. For everyday questions and debugging, your editor acts normally.

---

## The 15 Building Steps

Zeta takes you through 15 organized steps from start to finish:

| Step | Stage | What Happens |
|:---:|---|---|
| **0** | **Idea & Goals** | Define what you are building and why. |
| **1** | **Features & Scope** | List must-have features vs what to leave out. |
| **2** | **Risks & Feasibility** | Spot potential traps early before writing code. |
| **3** | **Tech Stack** | Choose the best languages, databases, and libraries. |
| **4** | **System Architecture** | Map out how the parts connect together. |
| **5** | **Detailed Design** | Design exact data structures and component models. |
| **6** | **Project Plan** | Break the project down into bite-sized tasks. |
| **7** | **Coding & Building** | Write clean, executable code step by step. |
| **8** | **Testing & QA** | Test every feature to make sure it actually works. |
| **9** | **Launch Readiness** | Prepare the app so it's ready to run and ship. |
| **10** | **Maintenance & Reliability** | Plan how to handle crashes and keep it running smoothly. |
| **11** | **Security & Privacy** | Protect data and lock down common vulnerabilities. |
| **12** | **Project Rules & Lifecycle** | Set clear rules for updates and future changes. |
| **13** | **Documentation & Setup Guide** | Create easy guides so anyone can understand and run it. |
| **14** | **Wrap-Up & Review** | Review lessons learned and prepare for future evolution. |

---

## Quick Start

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Aditya-Chavan-dev/Zeta.git
cd Zeta
npm install
npm run build
```

### Run Tests

Verify all 146 unit tests pass:

```bash
npm test
```

### Install Global IDE Rules

To enable Zeta inside Antigravity IDE, Gemini, or Claude Code:

```bash
npm run setup:global
```

In your editor chat, simply type:
> `/zeta` or `"Start project"`

---

## License

MIT
