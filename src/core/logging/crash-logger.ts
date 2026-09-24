import fs from 'node:fs';
import path from 'node:path';

export interface CrashLogEntry {
  timestamp: string;
  errorType: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  pid: number;
}

export class CrashLogger {
  public static readonly LOG_DIR = '.zeta';
  public static readonly LOG_FILE = 'crashes.log';
  public static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  /**
   * Regex patterns for sensitive tokens that must be scrubbed before writing.
   */
  private static readonly TOKEN_PATTERNS: RegExp[] = [
    /sk-[a-zA-Z0-9]{20,}/g,           // OpenAI-style keys
    /ghp_[a-zA-Z0-9]{36,}/g,          // GitHub PATs
    /gho_[a-zA-Z0-9]{36,}/g,          // GitHub OAuth tokens
    /xoxb-[a-zA-Z0-9\-]+/g,           // Slack bot tokens
    /xoxp-[a-zA-Z0-9\-]+/g,           // Slack user tokens
    /AKIA[A-Z0-9]{16}/g,              // AWS access key IDs
    /eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+/g, // JWT tokens
    /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g
  ];

  /**
   * Returns the full path to the crash log file.
   */
  public static getLogPath(workspaceRoot: string): string {
    return path.join(workspaceRoot, this.LOG_DIR, this.LOG_FILE);
  }

  /**
   * Scrubs sensitive token patterns from a string.
   */
  public static scrubTokens(text: string): string {
    let scrubbed = text;
    for (const pattern of this.TOKEN_PATTERNS) {
      scrubbed = scrubbed.replace(pattern, '[REDACTED]');
    }
    return scrubbed;
  }

  /**
   * Appends a structured crash entry to .zeta/crashes.log as a single JSON line.
   * Automatically prunes if file exceeds MAX_SIZE_BYTES.
   */
  public static log(
    workspaceRoot: string,
    error: Error | string,
    context?: Record<string, unknown>
  ): void {
    const logDir = path.join(workspaceRoot, this.LOG_DIR);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logPath = this.getLogPath(workspaceRoot);
    const isError = error instanceof Error;

    const entry: CrashLogEntry = {
      timestamp: new Date().toISOString(),
      errorType: isError ? error.constructor.name : 'StringError',
      message: this.scrubTokens(isError ? error.message : String(error)),
      stack: isError && error.stack ? this.scrubTokens(error.stack) : undefined,
      context: context ? JSON.parse(this.scrubTokens(JSON.stringify(context))) : undefined,
      pid: process.pid
    };

    const line = JSON.stringify(entry) + '\n';

    try {
      fs.appendFileSync(logPath, line, 'utf8');
    } catch {
      // If we can't write the crash log, silently fail — never crash the crash logger
      return;
    }

    // Prune if over size limit
    try {
      this.prune(workspaceRoot);
    } catch {
      // Pruning failure is non-fatal
    }
  }

  /**
   * Prunes the crash log file if it exceeds MAX_SIZE_BYTES.
   * Keeps the newest 50% of lines.
   */
  public static prune(workspaceRoot: string): void {
    const logPath = this.getLogPath(workspaceRoot);

    if (!fs.existsSync(logPath)) return;

    const stats = fs.statSync(logPath);
    if (stats.size <= this.MAX_SIZE_BYTES) return;

    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    // Keep the newest 50%
    const keepCount = Math.max(1, Math.ceil(lines.length / 2));
    const keptLines = lines.slice(lines.length - keepCount);

    fs.writeFileSync(logPath, keptLines.join('\n') + '\n', 'utf8');
  }

  /**
   * Returns the number of entries in the crash log, or 0 if none exist.
   */
  public static entryCount(workspaceRoot: string): number {
    const logPath = this.getLogPath(workspaceRoot);
    if (!fs.existsSync(logPath)) return 0;

    const content = fs.readFileSync(logPath, 'utf8');
    return content.split('\n').filter(l => l.trim().length > 0).length;
  }
}
