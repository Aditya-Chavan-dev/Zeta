import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CrashLogger } from '../../../src/core/logging/crash-logger.js';

describe('CrashLogger', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeta-crash-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create crash log file with valid JSON line on first log', () => {
    CrashLogger.log(tmpDir, new Error('Test crash'), { source: 'unit-test' });

    const logPath = CrashLogger.getLogPath(tmpDir);
    assert.ok(fs.existsSync(logPath), 'crash log file should exist');

    const content = fs.readFileSync(logPath, 'utf8').trim();
    const entry = JSON.parse(content);
    assert.equal(entry.errorType, 'Error');
    assert.equal(entry.message, 'Test crash');
    assert.ok(entry.timestamp);
    assert.ok(entry.pid);
    assert.deepEqual(entry.context, { source: 'unit-test' });
  });

  it('should accept string errors', () => {
    CrashLogger.log(tmpDir, 'plain string error');

    const logPath = CrashLogger.getLogPath(tmpDir);
    const content = fs.readFileSync(logPath, 'utf8').trim();
    const entry = JSON.parse(content);
    assert.equal(entry.errorType, 'StringError');
    assert.equal(entry.message, 'plain string error');
  });

  it('should scrub sensitive tokens from error messages', () => {
    const sensitiveMsg = 'Failed with key sk-abc1234567890123456789 and token ghp_abcdefghijklmnopqrstuvwxyz1234567890';
    CrashLogger.log(tmpDir, new Error(sensitiveMsg));

    const logPath = CrashLogger.getLogPath(tmpDir);
    const content = fs.readFileSync(logPath, 'utf8').trim();
    assert.ok(!content.includes('sk-abc'), 'OpenAI key should be scrubbed');
    assert.ok(!content.includes('ghp_abc'), 'GitHub PAT should be scrubbed');
    assert.ok(content.includes('[REDACTED]'), 'Should contain redaction marker');
  });

  it('should append multiple entries', () => {
    CrashLogger.log(tmpDir, 'error 1');
    CrashLogger.log(tmpDir, 'error 2');
    CrashLogger.log(tmpDir, 'error 3');

    assert.equal(CrashLogger.entryCount(tmpDir), 3);
  });

  it('should prune file when over 5MB', () => {
    const logPath = CrashLogger.getLogPath(tmpDir);
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    // Create a 6MB file with many lines
    const bigLine = JSON.stringify({ timestamp: new Date().toISOString(), message: 'x'.repeat(500) }) + '\n';
    const lineCount = Math.ceil((6 * 1024 * 1024) / bigLine.length);
    const bigContent = bigLine.repeat(lineCount);
    fs.writeFileSync(logPath, bigContent, 'utf8');

    const sizeBefore = fs.statSync(logPath).size;
    assert.ok(sizeBefore > 5 * 1024 * 1024, 'File should be over 5MB before pruning');

    CrashLogger.prune(tmpDir);

    const sizeAfter = fs.statSync(logPath).size;
    assert.ok(sizeAfter < sizeBefore, 'File should be smaller after pruning');
    assert.ok(sizeAfter > 0, 'File should not be empty');
  });

  it('should return 0 entry count for non-existent log', () => {
    assert.equal(CrashLogger.entryCount(tmpDir), 0);
  });
});
