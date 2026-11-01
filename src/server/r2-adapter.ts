/**
 * Cloudflare R2 Storage Emulator for Local Development
 * Stores objects in-memory with base64/ArrayBuffer support
 */

export interface R2ObjectMetadata {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
  uploaded: Date;
}

export interface R2ObjectBody extends R2ObjectMetadata {
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = any>(): Promise<T>;
  blob(): Promise<Blob>;
}

export class R2BucketEmulator {
  private store = new Map<string, { buffer: Buffer; meta: R2ObjectMetadata }>();

  async put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Buffer | Uint8Array,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }
  ): Promise<R2ObjectMetadata> {
    let buf: Buffer;
    if (typeof value === 'string') {
      buf = Buffer.from(value, 'utf-8');
    } else if (Buffer.isBuffer(value)) {
      buf = value;
    } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      buf = Buffer.from(value as any);
    } else if (ArrayBuffer.isView(value)) {
      buf = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    } else {
      buf = Buffer.from(String(value));
    }

    const meta: R2ObjectMetadata = {
      key,
      size: buf.byteLength,
      etag: Math.random().toString(36).substring(2),
      httpMetadata: {
        contentType: options?.httpMetadata?.contentType || 'application/octet-stream',
      },
      customMetadata: options?.customMetadata,
      uploaded: new Date(),
    };

    this.store.set(key, { buffer: buf, meta });
    return meta;
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const item = this.store.get(key);
    if (!item) return null;

    return {
      ...item.meta,
      async arrayBuffer(): Promise<ArrayBuffer> {
        const ab = new ArrayBuffer(item.buffer.byteLength);
        const view = new Uint8Array(ab);
        view.set(new Uint8Array(item.buffer));
        return ab;
      },
      async text() {
        return item.buffer.toString('utf-8');
      },
      async json<T = any>() {
        return JSON.parse(item.buffer.toString('utf-8')) as T;
      },
      async blob() {
        const u8 = new Uint8Array(item.buffer);
        return new Blob([u8], { type: item.meta.httpMetadata?.contentType });
      },
    };
  }

  async delete(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      this.store.delete(k);
    }
  }

  async list(options?: { prefix?: string; limit?: number }) {
    let objects: R2ObjectMetadata[] = [];
    const prefix = options?.prefix || '';
    for (const [key, item] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        objects.push(item.meta);
      }
    }
    if (options?.limit) {
      objects = objects.slice(0, options.limit);
    }
    return {
      objects,
      truncated: false,
    };
  }
}

export function createR2Emulator(): any {
  return new R2BucketEmulator();
}
