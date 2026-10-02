/**
 * ZETA Governance Engine: Principles Dictionary
 * Authoritative taxonomy of the 6-layer city-building architecture:
 * Layer 1 (Principles), Layer 2 (Zoning), Layer 3 (Conventions), Layer 4 (Inspectors).
 */

export interface EngineeringPrinciple {
  id: string;
  name: string;
  oneLineMeaning: string;
  messPrevented: string;
  category: 'core' | 'zoning' | 'convention' | 'inspector';
}

export interface ComplexityBudgetConfig {
  maxFunctionLines: number;
  maxFileLines: number;
  maxCyclomaticComplexity: number;
  maxParameters: number;
  disallowMagicLiterals: boolean;
  enforceWhyComments: boolean;
}

export interface InspectorRequirement {
  id: string;
  name: string;
  checkType: 'compiler' | 'architecture_tests' | 'strict_types' | 'linter' | 'formatter' | 'hooks' | 'ci_gate';
  toolingTypeScript: string;
  toolingDotNet: string;
  isBlocking: boolean;
}

export class PrinciplesDictionary {
  /**
   * Layer 1: Principles — What You Need to Judge AI Output
   */
  public static readonly CORE_PRINCIPLES: Record<string, EngineeringPrinciple> = {
    separationOfConcerns: {
      id: 'separationOfConcerns',
      name: 'Separation of Concerns',
      oneLineMeaning: 'Each piece does one kind of job.',
      messPrevented: 'Controllers doing SQL, business rules, and formatting all at once.',
      category: 'core',
    },
    solid: {
      id: 'solid',
      name: 'SOLID Principles',
      oneLineMeaning: 'One reason to change · extend without editing · subtypes keep contract · small interfaces · depend on abstractions.',
      messPrevented: 'God classes, switch statements growing with every feature, business logic tied directly to frameworks or HTTP.',
      category: 'core',
    },
    highCohesionLowCoupling: {
      id: 'highCohesionLowCoupling',
      name: 'High Cohesion, Low Coupling',
      oneLineMeaning: 'Related things stay together, unrelated things stay apart.',
      messPrevented: 'Changing one feature inadvertently breaks another unrelated feature.',
      category: 'core',
    },
    encapsulation: {
      id: 'encapsulation',
      name: 'Encapsulation',
      oneLineMeaning: 'Hide internals; expose only what callers strictly need.',
      messPrevented: 'Other modules reaching into private state and creating tight invisible dependencies.',
      category: 'core',
    },
    dryRuleOfThree: {
      id: 'dryRuleOfThree',
      name: 'DRY plus the Rule of Three',
      oneLineMeaning: 'Duplicate once; abstract only on the third copy.',
      messPrevented: 'Rampant copy-paste code and premature, wrong abstractions.',
      category: 'core',
    },
    kissYagni: {
      id: 'kissYagni',
      name: 'KISS & YAGNI',
      oneLineMeaning: 'Build only what is needed right now; keep it as simple as possible.',
      messPrevented: 'AI speculative generality: factories, options, and layers nobody asked for.',
      category: 'core',
    },
    compositionOverInheritance: {
      id: 'compositionOverInheritance',
      name: 'Composition over Inheritance',
      oneLineMeaning: 'Combine small, focused parts instead of building deep class trees.',
      messPrevented: 'Fragile base classes that cascade bugs when modified.',
      category: 'core',
    },
    singleSourceOfTruth: {
      id: 'singleSourceOfTruth',
      name: 'Single Source of Truth (SSOT)',
      oneLineMeaning: 'Each fact, behavior, or domain decision lives in exactly one place.',
      messPrevented: 'Multiple copies of business logic that drift apart over time.',
      category: 'core',
    },
    consistency: {
      id: 'consistency',
      name: 'Consistency (Principle of Least Surprise)',
      oneLineMeaning: 'The same recurring problem is solved the exact same way everywhere.',
      messPrevented: 'Vibe-coded chaos where every file invents its own patterns.',
      category: 'core',
    },
    failFast: {
      id: 'failFast',
      name: 'Fail Fast & Loudly',
      oneLineMeaning: 'Validate inputs at entry points and fail loudly immediately.',
      messPrevented: 'Silent data corruption, unhandled nulls, and delayed mysterious crashes.',
      category: 'core',
    },
    commandQuerySeparation: {
      id: 'commandQuerySeparation',
      name: 'Command-Query Separation (CQS)',
      oneLineMeaning: 'A method either changes state or returns data, never both.',
      messPrevented: 'Hidden side effects during read operations.',
      category: 'core',
    },
  };

  /**
   * Layer 2: Architecture Decisions — The Zoning
   */
  public static readonly ZONING_RULES: Record<string, EngineeringPrinciple> = {
    dependencyRule: {
      id: 'dependencyRule',
      name: 'The Dependency Rule (Hexagonal / Clean Architecture)',
      oneLineMeaning: 'The domain sits in the centre; frameworks, DBs, and HTTP stay at the edges.',
      messPrevented: 'Business logic leaking into framework-specific adapters.',
      category: 'zoning',
    },
    oneOrganizingScheme: {
      id: 'oneOrganizingScheme',
      name: 'Vertical Slices (Feature Folders)',
      oneLineMeaning: 'Code is organized by vertical feature slices; pick one scheme and stick to it.',
      messPrevented: 'Fragmented codebase split into arbitrary horizontal layer directories.',
      category: 'zoning',
    },
    moduleBoundaries: {
      id: 'moduleBoundaries',
      name: 'Module Boundaries with Public API',
      oneLineMeaning: 'Expose only what other modules may use via barrel index.ts files.',
      messPrevented: 'External features reaching into deep private subdirectories.',
      category: 'zoning',
    },
    domainModelVsDto: {
      id: 'domainModelVsDto',
      name: 'Domain Models vs DTOs',
      oneLineMeaning: 'Entities and value objects are kept separate from API transmission shapes.',
      messPrevented: 'Leaking internal database schemas directly over external network APIs.',
      category: 'zoning',
    },
    crossCuttingPipeline: {
      id: 'crossCuttingPipeline',
      name: 'Cross-Cutting Concerns in Pipelines / Interceptors',
      oneLineMeaning: 'Auth, logging, and metrics handled via middleware/interceptors, never copy-pasted.',
      messPrevented: 'Boilerplate code cluttering core business functions.',
      category: 'zoning',
    },
    rulesForSharedCode: {
      id: 'rulesForSharedCode',
      name: 'Rules for Shared Code',
      oneLineMeaning: 'Strict qualification for src/shared/; only universal behaviors belong here.',
      messPrevented: 'The "junk drawer utils" trap where single-use code is dumped into shared.',
      category: 'zoning',
    },
    goldenPaths: {
      id: 'goldenPaths',
      name: 'Golden Paths (One Documented Way)',
      oneLineMeaning: 'One documented solution for data access, validation, errors, logging, config, and state.',
      messPrevented: 'Multiple conflicting libraries used side-by-side for the same task.',
      category: 'zoning',
    },
    adrs: {
      id: 'adrs',
      name: 'Architectural Decision Records (ADRs)',
      oneLineMeaning: 'Record the context, options, and rationale for every major architectural choice.',
      messPrevented: 'Teams forgetting why choices were made and repeating historical mistakes.',
      category: 'zoning',
    },
  };

  /**
   * Layer 3: Conventions and Format — The Building Code
   */
  public static readonly COMPLEXITY_BUDGETS: ComplexityBudgetConfig = {
    maxFunctionLines: 30,
    maxFileLines: 300,
    maxCyclomaticComplexity: 10,
    maxParameters: 4,
    disallowMagicLiterals: true,
    enforceWhyComments: true,
  };

  /**
   * Layer 4: Enforcement — The Inspectors ("A rule that no machine checks is only a suggestion")
   */
  public static readonly INSPECTORS: Record<string, InspectorRequirement> = {
    compilerBoundaries: {
      id: 'compilerBoundaries',
      name: 'Compiler Boundaries',
      checkType: 'compiler',
      toolingTypeScript: 'tsconfig.json project references / Nx module boundaries',
      toolingDotNet: 'Separate projects + ProjectReference',
      isBlocking: true,
    },
    architectureTests: {
      id: 'architectureTests',
      name: 'Architecture & Boundary Tests',
      checkType: 'architecture_tests',
      toolingTypeScript: 'eslint-plugin-boundaries / dependency-cruiser',
      toolingDotNet: 'NetArchTest / ArchUnitNET',
      isBlocking: true,
    },
    strictTypes: {
      id: 'strictTypes',
      name: 'Strict Types (Warnings as Errors)',
      checkType: 'strict_types',
      toolingTypeScript: '"strict": true, "noImplicitAny": true in tsconfig.json',
      toolingDotNet: '<Nullable>enable, <TreatWarningsAsErrors>true</TreatWarningsAsErrors>',
      isBlocking: true,
    },
    analyzersAndLinters: {
      id: 'analyzersAndLinters',
      name: 'Analyzers and Linters',
      checkType: 'linter',
      toolingTypeScript: 'ESLint + @typescript-eslint + complexity/max-lines rules',
      toolingDotNet: 'Roslyn Analyzers + SonarAnalyzer + StyleCop',
      isBlocking: true,
    },
    formatCheck: {
      id: 'formatCheck',
      name: 'Automatic Format Verification',
      checkType: 'formatter',
      toolingTypeScript: 'prettier --check + .editorconfig',
      toolingDotNet: 'dotnet format --verify-no-changes + .editorconfig',
      isBlocking: true,
    },
    preCommitHooks: {
      id: 'preCommitHooks',
      name: 'Pre-Commit Boundary Hooks',
      checkType: 'hooks',
      toolingTypeScript: 'husky + lint-staged',
      toolingDotNet: 'Husky.NET',
      isBlocking: false,
    },
    ciQualityGate: {
      id: 'ciQualityGate',
      name: 'CI Quality Gate & Copy-Paste Detection',
      checkType: 'ci_gate',
      toolingTypeScript: 'build + test + jscpd (copy-paste detector) + SonarQube',
      toolingDotNet: 'dotnet test + jscpd + SonarQube',
      isBlocking: true,
    },
  };

  /**
   * Maps a project's domain and scale to the mandatory subset of principles and inspectors.
   */
  public static mapGoalToPrinciples(options: {
    isPrototype: boolean;
    hasUi: boolean;
    hasApi: boolean;
    isCli: boolean;
  }): {
    activePrinciples: EngineeringPrinciple[];
    activeZoning: EngineeringPrinciple[];
    complexityBudgets: ComplexityBudgetConfig;
    requiredInspectors: InspectorRequirement[];
  } {
    const activePrinciples = Object.values(this.CORE_PRINCIPLES);
    const activeZoning = Object.values(this.ZONING_RULES);
    const requiredInspectors = Object.values(this.INSPECTORS).filter(
      (insp) => insp.isBlocking || !options.isPrototype
    );

    return {
      activePrinciples,
      activeZoning,
      complexityBudgets: this.COMPLEXITY_BUDGETS,
      requiredInspectors,
    };
  }
}
