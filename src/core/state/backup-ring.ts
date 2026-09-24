import fs from 'node:fs';
import path from 'node:path';
import { IStateStore } from './state-store.interface.js';

export class BackupRing {
  public static readonly BACKUP_DIR = '.zeta/backups';
  public static readonly MAX_BACKUPS = 10;
  public static readonly BACKUP_PREFIX = 'zeta_backup_';
  public static readonly BACKUP_EXTENSION = '.db';

  /**
   * Returns the full path to the backup directory.
   */
  public static getBackupDir(workspaceRoot: string): string {
    return path.join(workspaceRoot, this.BACKUP_DIR);
  }

  /**
   * Creates a timestamped backup of the SQLite database.
   * Prunes old backups beyond MAX_BACKUPS after creation.
   * Returns the path of the created backup file.
   */
  public static async createTurnBackup(store: IStateStore): Promise<string> {
    const backupDir = this.getBackupDir(store.workspaceRoot);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.BACKUP_PREFIX}${timestamp}${this.BACKUP_EXTENSION}`;
    const destPath = path.join(backupDir, filename);

    await store.createBackup(destPath);

    // Prune old backups after creating a new one
    this.pruneOldBackups(store.workspaceRoot);

    return destPath;
  }

  /**
   * Lists existing backup files sorted newest-first.
   */
  public static listBackups(workspaceRoot: string): string[] {
    const backupDir = this.getBackupDir(workspaceRoot);
    if (!fs.existsSync(backupDir)) return [];

    return fs.readdirSync(backupDir)
      .filter(f => f.startsWith(this.BACKUP_PREFIX) && f.endsWith(this.BACKUP_EXTENSION))
      .sort()
      .reverse();
  }

  /**
   * Prunes backups beyond MAX_BACKUPS. Returns the number of files deleted.
   */
  public static pruneOldBackups(workspaceRoot: string): number {
    const backups = this.listBackups(workspaceRoot);
    if (backups.length <= this.MAX_BACKUPS) return 0;

    const backupDir = this.getBackupDir(workspaceRoot);
    const toDelete = backups.slice(this.MAX_BACKUPS);
    let deleted = 0;

    for (const file of toDelete) {
      try {
        fs.unlinkSync(path.join(backupDir, file));
        deleted++;
      } catch {
        // Non-fatal: if we can't delete an old backup, skip it
      }
    }

    return deleted;
  }
}
