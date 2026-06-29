/**
 * 存储提供商配置
 *
 * 支持多种存储方式：
 * - local: 本地磁盘存储
 * - oss: 阿里云OSS
 * - cos: 腾讯云COS
 */

export interface StorageProvider {
  /** 存储类型标识 */
  type: 'local' | 'oss' | 'cos';
  /** 上传文件 */
  upload(file: UploadFile): Promise<UploadResult>;
  /** 获取文件URL（支持预览） */
  getUrl(fileName: string): string;
  /** 删除文件 */
  delete(fileName: string): Promise<void>;
}

export interface UploadFile {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  fileName: string;
  url: string;
  path: string;
}

// ── 本地存储实现 ──────────────────────────────────────────

class LocalStorageProvider implements StorageProvider {
  type = 'local' as const;
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }

  async upload(file: UploadFile): Promise<UploadResult> {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { join, extname } = await import('node:path');
    const { randomUUID } = await import('node:crypto');

    const ext = extname(file.name);
    const fileName = `${randomUUID()}${ext}`;
    const absolutePath = join(this.uploadDir, fileName);

    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      fileName,
      url: `/files/${fileName}`,
      path: `uploads/${fileName}`,
    };
  }

  getUrl(fileName: string): string {
    return `/files/${fileName}`;
  }

  async delete(fileName: string): Promise<void> {
    const { unlink } = await import('node:fs/promises');
    const { join } = await import('node:path');
    try {
      await unlink(join(this.uploadDir, fileName));
    } catch {
      // 文件可能不存在，忽略错误
    }
  }
}

// ── 阿里云 OSS 实现（占位，实际使用时需要安装 ali-oss）────────────────

class OssStorageProvider implements StorageProvider {
  type = 'oss' as const;

  constructor() {
    throw new Error('OSS provider not implemented yet');
  }

  async upload(_file: UploadFile): Promise<UploadResult> {
    throw new Error('Not implemented');
  }

  getUrl(_fileName: string): string {
    throw new Error('Not implemented');
  }

  async delete(_fileName: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

// ── 工厂方法 ──────────────────────────────────────────────

const providers = new Map<string, StorageProvider>();

/**
 * 获取或创建存储提供商实例
 * @param type 存储类型
 * @returns 存储提供商实例
 */
export function getStorageProvider(type: string = 'local'): StorageProvider {
  const key = type.toLowerCase();

  if (!providers.has(key)) {
    switch (key) {
      case 'local':
        providers.set(key, new LocalStorageProvider());
        break;
      case 'oss':
        providers.set(key, new OssStorageProvider());
        break;
      default:
        throw new Error(`Unknown storage provider: ${type}`);
    }
  }

  return providers.get(key)!;
}

/**
 * 获取当前配置的存储类型（从环境变量读取）
 */
export function getCurrentStorageType(): string {
  return process.env.STORAGE_TYPE || 'local';
}
