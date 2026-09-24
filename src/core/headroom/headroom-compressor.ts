import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CompressedPayload {
  token: string;
  hash: string;
  summary: string;
  originalBytes: number;
  compressedBytes: number;
  compressedLength: number;
  compressionRatio: number;
  reductionPercentage: number;
  cachedAt: string;
}

export class HeadroomCompressor {
  public static readonly CACHE_DIR = path.join('.zeta', 'cache', 'headroom');
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Ensures the local Headroom cache directory exists.
   */
  public static ensureCacheDir(workspaceRoot: string): string {
    const fullPath = path.join(workspaceRoot, this.CACHE_DIR);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
  }

  /**
   * Reversibly compresses a raw payload by extracting key semantic outlines,
   * caching the raw full payload to disk, and returning the compact digest.
   */
  public static compress(workspaceRoot: string, rawText: string, label: string = 'payload'): CompressedPayload {
    const cacheDir = this.ensureCacheDir(workspaceRoot);
    const hash = crypto.createHash('sha256').update(rawText).digest('hex');
    const cachePath = path.join(cacheDir, `${hash}.json`);

    // Write raw text to local cache file
    fs.writeFileSync(cachePath, JSON.stringify({ hash, label, rawText, timestamp: new Date().toISOString() }), 'utf8');

    // Generate compact digest (keeps headers, first 3 lines, outline)
    const lines = rawText.split('\n');
    const headerLines = lines.filter(l => l.startsWith('#') || l.startsWith('•') || l.startsWith('-')).slice(0, 8);
    const summary = `[Headroom Digest: ${label} | SHA-256: ${hash.slice(0, 12)}]\n` +
      headerLines.join('\n') + `\n[... Full ${lines.length} lines cached in Headroom. Retrieve via token '${hash}']`;

    const originalBytes = Buffer.byteLength(rawText, 'utf8');
    const compressedBytes = Buffer.byteLength(summary, 'utf8');
    const compressedLength = summary.length;
    const compressionRatio = originalBytes > 0
      ? Math.max(0, (originalBytes - compressedBytes) / originalBytes)
      : 0;
    const reductionPercentage = Math.round(compressionRatio * 100);
    const token = `HEADROOM:${label}:${hash}`;

    return {
      token,
      hash,
      summary,
      originalBytes,
      compressedBytes,
      compressedLength,
      compressionRatio,
      reductionPercentage,
      cachedAt: new Date().toISOString()
    };
  }

  /**
   * Losslessly retrieves the original full payload from local Headroom cache.
   */
  public static retrieve(workspaceRoot: string, tokenOrHash: string): string | null {
    let hash = tokenOrHash;
    if (tokenOrHash.startsWith('HEADROOM:')) {
      const lastColonIndex = tokenOrHash.lastIndexOf(':');
      if (lastColonIndex !== -1) {
        hash = tokenOrHash.slice(lastColonIndex + 1);
      }
    }

    const cachePath = path.join(workspaceRoot, this.CACHE_DIR, `${hash}.json`);
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return data.rawText || null;
    } catch {
      return null;
    }
  }

  /**
   * Instance-level compress helper.
   */
  public compress(rawText: string, label: string = 'payload'): CompressedPayload {
    return HeadroomCompressor.compress(this.workspaceRoot, rawText, label);
  }

  /**
   * Instance-level retrieve helper.
   */
  public retrieve(tokenOrHash: string): string | null {
    return HeadroomCompressor.retrieve(this.workspaceRoot, tokenOrHash);
  }
}
