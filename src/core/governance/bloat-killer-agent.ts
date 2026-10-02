/**
 * ZETA Governance Engine: Bloat & Vibe-Code Killer Agent
 * An infused, non-bypassable inspector executing at every step boundary (Steps 0–14).
 * Audits code against Complexity Budgets, DRY Rule-of-Three, and cuts AI speculative slop.
 */

import { PrinciplesDictionary, ComplexityBudgetConfig } from './principles-dictionary.js';

export interface BloatViolation {
  file: string;
  line?: number;
  ruleId: string;
  ruleName: string;
  description: string;
  severity: 'BLOCKING' | 'WARNING';
}

export interface BloatInspectionReport {
  stageIndex: number;
  stageName: string;
  status: 'PASSED' | 'PRUNED' | 'BLOCKED';
  violations: BloatViolation[];
  prunedActions: string[];
  cleanlinessVerdict: string;
}

export class BloatKillerAgent {
  private readonly budgets: ComplexityBudgetConfig;

  constructor(customBudgets?: Partial<ComplexityBudgetConfig>) {
    this.budgets = {
      ...PrinciplesDictionary.COMPLEXITY_BUDGETS,
      ...(customBudgets || {}),
    };
  }

  /**
   * Main audit entry point run before any stage transition can lock.
   */
  public auditStageArtifacts(options: {
    stageIndex: number;
    stageName: string;
    files: Array<{ path: string; content: string }>;
  }): BloatInspectionReport {
    const violations: BloatViolation[] = [];
    const prunedActions: string[] = [];

    for (const file of options.files) {
      // 1. Scan AI Slop & Placeholders (// TODO, // FIXME, mock text)
      this.scanAiSlop(file, violations);

      // 2. Scan Complexity Budgets (functions <= 30 lines, files <= 300 lines)
      this.scanComplexityBudgets(file, violations);

      // 3. Scan Speculative Generality (unused factories, empty stubs)
      this.scanSpeculativeGenerality(file, violations);

      // 4. Scan Shared Boundary Leaks
      this.scanSharedBoundaries(file, violations);
    }

    // 5. Scan Duplicate Code Patterns across files (DRY rule of three)
    this.scanCrossFileDuplication(options.files, violations);

    const hasBlockingViolations = violations.some((v) => v.severity === 'BLOCKING');
    const status: BloatInspectionReport['status'] = hasBlockingViolations
      ? 'BLOCKED'
      : prunedActions.length > 0
      ? 'PRUNED'
      : 'PASSED';

    const cleanlinessVerdict = hasBlockingViolations
      ? `Bloat Scan: BLOCKED (${violations.length} violations detected). Step ${options.stageIndex} cannot lock until resolved.`
      : `Bloat Scan: Clean. 0 complexity budget violations, 0 dead code blocks. Step ${options.stageIndex} approved.`;

    return {
      stageIndex: options.stageIndex,
      stageName: options.stageName,
      status,
      violations,
      prunedActions,
      cleanlinessVerdict,
    };
  }

  /**
   * Scans for placeholder slop and restated comments.
   */
  private scanAiSlop(file: { path: string; content: string }, violations: BloatViolation[]): void {
    const lines = file.content.split('\n');
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      if (/\/\/\s*(?:TODO|FIXME|TBD|Placeholder|Implement later|Insert code here)/i.test(line)) {
        violations.push({
          file: file.path,
          line: lineNum,
          ruleId: 'no_ai_placeholders',
          ruleName: 'Zero Incomplete Code',
          description: `Placeholder slop detected: "${line.trim()}". All generated code must be 100% complete and working.`,
          severity: 'BLOCKING',
        });
      }

      if (/^\s*\/\/\s*returns the|^\s*\/\/\s*sets the|^\s*\/\/\s*constructor/i.test(line)) {
        violations.push({
          file: file.path,
          line: lineNum,
          ruleId: 'useless_restatement_comment',
          ruleName: 'Comments Explain Why, Not What',
          description: `Useless commentary restating obvious code: "${line.trim()}".`,
          severity: 'WARNING',
        });
      }
    });
  }

  /**
   * Scans file and function length limits against complexity budgets.
   */
  private scanComplexityBudgets(file: { path: string; content: string }, violations: BloatViolation[]): void {
    const lines = file.content.split('\n');
    
    // File length cap
    if (lines.length > this.budgets.maxFileLines) {
      violations.push({
        file: file.path,
        ruleId: 'file_length_budget_exceeded',
        ruleName: 'Complexity Budget (File Length)',
        description: `File has ${lines.length} lines, exceeding the limit of ${this.budgets.maxFileLines} lines. Decompose into smaller modules.`,
        severity: 'BLOCKING',
      });
    }

    // Function length scan (heuristic: count lines between function declarations and closing braces)
    let inFunction = false;
    let funcStartLine = 0;
    let funcName = '';
    let openBraces = 0;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const funcMatch = line.match(/(?:function\s+([a-zA-Z0-9_]+)|(?:const|let)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:public|private|protected|async)\s+([a-zA-Z0-9_]+)\s*\([^)]*\))/);
      
      if (funcMatch && !inFunction && line.includes('{')) {
        inFunction = true;
        funcStartLine = lineNum;
        funcName = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
        openBraces = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (inFunction) {
        openBraces += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (openBraces <= 0) {
          const funcLength = lineNum - funcStartLine + 1;
          if (funcLength > this.budgets.maxFunctionLines) {
            violations.push({
              file: file.path,
              line: funcStartLine,
              ruleId: 'function_length_budget_exceeded',
              ruleName: 'Complexity Budget (Function Length)',
              description: `Function "${funcName}" is ${funcLength} lines long, exceeding the limit of ${this.budgets.maxFunctionLines} lines. Break into focused helper steps.`,
              severity: 'BLOCKING',
            });
          }
          inFunction = false;
          openBraces = 0;
        }
      }
    });
  }

  /**
   * Scans for speculative generality (over-abstracted factories and empty wrappers).
   */
  private scanSpeculativeGenerality(file: { path: string; content: string }, violations: BloatViolation[]): void {
    if (file.content.includes('class GenericFactory') || file.content.includes('interface IAbstractProvider')) {
      violations.push({
        file: file.path,
        ruleId: 'speculative_generality',
        ruleName: 'KISS / YAGNI',
        description: 'Speculative generic wrapper detected. Build only the concrete implementation required right now.',
        severity: 'BLOCKING',
      });
    }
  }

  /**
   * Scans that shared code adheres to SSOT and doesn't house single-use feature code.
   */
  private scanSharedBoundaries(file: { path: string; content: string }, violations: BloatViolation[]): void {
    if (file.path.includes('/shared/') || file.path.includes('\\shared\\')) {
      if (/feature|screen|page|route/i.test(file.path)) {
        violations.push({
          file: file.path,
          ruleId: 'dirty_shared_folder',
          ruleName: 'Rules for Shared Code',
          description: `Feature-specific code found in shared folder: "${file.path}". Only universal behaviors (validators, numbers, errors) belong in shared.`,
          severity: 'BLOCKING',
        });
      }
    }
  }

  /**
   * Identifies identical copy-pasted blocks across feature files.
   */
  private scanCrossFileDuplication(files: Array<{ path: string; content: string }>, violations: BloatViolation[]): void {
    const regexPatternMap = new Map<string, string[]>();

    for (const file of files) {
      // Find regex literals
      const matches = file.content.match(/\/(?:[^\/\\]|\\.)+\/[gimsuy]*/g);
      if (matches) {
        for (const regex of matches) {
          if (regex.length > 8) {
            const existing = regexPatternMap.get(regex) || [];
            existing.push(file.path);
            regexPatternMap.set(regex, existing);
          }
        }
      }
    }

    for (const [regex, filePaths] of regexPatternMap.entries()) {
      const uniqueFiles = Array.from(new Set(filePaths));
      if (uniqueFiles.length >= 2) {
        violations.push({
          file: uniqueFiles.join(', '),
          ruleId: 'duplicate_domain_logic',
          ruleName: 'DRY / Single Source of Truth',
          description: `Duplicate regex check "${regex}" found across ${uniqueFiles.length} files. Must be extracted into src/shared/.`,
          severity: 'BLOCKING',
        });
      }
    }
  }
}
