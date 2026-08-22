import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

export interface StorageService {
  save(file: Buffer, filename: string): Promise<string>;
  get(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
}

export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor(baseDir: string = env.UPLOAD_DIR) {
    this.baseDir = baseDir;
  }

  private resolvePath(filePath: string): string {
    const resolved = path.resolve(this.baseDir, filePath);
    if (!resolved.startsWith(path.resolve(this.baseDir))) {
      throw new Error('Invalid file path');
    }
    return resolved;
  }

  async ensureDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async save(file: Buffer, filename: string): Promise<string> {
    await this.ensureDir();
    const safeName = path.basename(filename);
    const relativePath = path.join(Date.now().toString(), safeName);
    const fullPath = this.resolvePath(relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file);
    return relativePath;
  }

  async get(filePath: string): Promise<Buffer> {
    return fs.readFile(this.resolvePath(filePath));
  }

  async delete(filePath: string): Promise<void> {
    const resolved = this.resolvePath(filePath);
    try {
      await fs.unlink(resolved);
    } catch {
      // ignore missing files
    }
    // `save` puts every file in its own `Date.now()` directory, so unlinking alone
    // leaves an empty directory behind forever. Drop it once it is empty — rmdir
    // fails harmlessly with ENOTEMPTY when siblings remain (same-millisecond saves).
    const parent = path.dirname(resolved);
    if (parent !== path.resolve(this.baseDir)) {
      await fs.rmdir(parent).catch(() => undefined);
    }
  }
}

export const storageService: StorageService = new LocalStorageService();
