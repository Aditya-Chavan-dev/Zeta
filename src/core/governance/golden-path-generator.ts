/**
 * ZETA Governance Engine: Golden Paths & Day 1 Inspector Generator
 * Auto-generates docs/GOLDEN_PATHS.md and Day 1 inspector configurations (tsconfig, eslint, prettier).
 * Enforces the core invariant: "A rule that no machine checks is only a suggestion."
 */

export interface GoldenPathConfig {
  projectName: string;
  primaryLanguage: 'typescript' | 'dotnet' | 'python';
  framework: string;
  dataPath: string;
  validationPath: string;
  errorPath: string;
}

export class GoldenPathGenerator {
  /**
   * Compiles the authoritative docs/GOLDEN_PATHS.md document.
   */
  public static generateGoldenPaths(config: GoldenPathConfig): string {
    return `# GOLDEN PATHS: THE ONE APPROVED WAY

**Project**: ${config.projectName}  
**Status**: ACTIVE & ENFORCED BY MACHINE INSPECTORS  
**Authority**: Any deviation or duplicate pattern is treated as an architectural violation.

---

## 1. Golden Path Directory

| Concern | The One Documented Pattern | Central Location | Failure Mode Prevented |
| :--- | :--- | :--- | :--- |
| **Data Access** | Single Repository / Client pattern | \`src/shared/data/\` | Conflicting DB drivers & scattered inline queries |
| **Input Validation** | Pure schema parsers (Zod / TypeBox) | \`src/shared/validation/\` | Ad-hoc regex & conflicting validation libraries |
| **Error Handling** | Typed domain error hierarchy & Fail Fast | \`src/shared/errors/\` | Silent swallowed errors & inconsistent responses |
| **Logging & Metrics** | Structured logger invoked via Interceptor | \`src/shared/logging/\` | Scattered \`console.log\` statements |
| **Configuration** | Validated environment schema | \`src/shared/config/\` | Untyped \`process.env\` calls & magic strings |
| **Cross-Cutting Pipeline** | Interceptor / Middleware wrapper | \`src/shared/pipeline/\` | Copy-pasted auth, timing, and error catchers |

---

## 2. Shared Code Rules (\`src/shared/\`)

* **The Rule of Three**: Logic is duplicated once; abstracted into \`src/shared/\` only upon the third occurrence.
* **Universal Behaviors Only**: Only domain-agnostic rules (numbers, dates, errors, validation) qualify for \`src/shared/\`.
* **Zero Feature Code**: Feature screens, routes, and specialized UI components are strictly forbidden from living in \`src/shared/\`.

---

## 3. Complexity Budgets (Enforced by ESLint)

* **Functions**: $\\le$ 30 lines.
* **Files**: $\\le$ 300 lines.
* **Parameters**: $\\le$ 4 arguments.
* **Cyclomatic Complexity**: $\\le$ 10 branches.
* **Magic Literals**: Strictly prohibited; all literals must be named constants.

---

## 4. Driving the AI (The Exemplar Rule)

* **Exemplar Feature 1**: Feature 1 is constructed as the living reference implementation.
* **Pattern Mirroring**: All downstream features must mirror Feature 1 (Component -> Service -> Shared -> Tests).
* **Review for Architecture**: Code is reviewed for boundary compliance and golden path alignment, never just "does it run".
`;
  }

  /**
   * Generates Day 1 Machine Inspector configurations for TypeScript projects.
   */
  public static generateTypeScriptInspectors(): {
    tsconfigContent: string;
    eslintContent: string;
    prettierContent: string;
    editorConfigContent: string;
  } {
    const tsconfigContent = JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noImplicitAny: true,
          strictNullChecks: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          noUncheckedIndexedAccess: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', '**/*.test.ts'],
      },
      null,
      2
    );

    const eslintContent = JSON.stringify(
      {
        root: true,
        parser: '@typescript-eslint/parser',
        plugins: ['@typescript-eslint', 'boundaries'],
        extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
        rules: {
          'max-lines-per-function': ['error', { max: 30, skipComments: true }],
          'max-lines': ['error', { max: 300, skipComments: true }],
          'max-params': ['error', 4],
          complexity: ['error', 10],
          'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
      },
      null,
      2
    );

    const prettierContent = JSON.stringify(
      {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
      },
      null,
      2
    );

    const editorConfigContent = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
`;

    return {
      tsconfigContent,
      eslintContent,
      prettierContent,
      editorConfigContent,
    };
  }
}
