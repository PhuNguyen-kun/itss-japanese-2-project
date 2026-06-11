import { getCloudflareContext } from "@opennextjs/cloudflare";
import { promises as fs } from "fs";
import path from "path";

const APP_DATA_PREFIX = "appdata/";

type AppR2Bucket = {
  get(key: string): Promise<{ text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> } | null>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView): Promise<unknown>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<{
    objects: { key: string }[];
    truncated: boolean;
    cursor?: string;
  }>;
};

async function getR2Bucket(): Promise<AppR2Bucket | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.NEXT_INC_CACHE_R2_BUCKET;
  } catch {
    return undefined;
  }
}

function localPath(key: string): string {
  return path.join(process.cwd(), key);
}

function r2Key(key: string): string {
  return `${APP_DATA_PREFIX}${key.replace(/\\/g, "/")}`;
}

export async function readText(key: string): Promise<string | null> {
  const bucket = await getR2Bucket();
  if (bucket) {
    const object = await bucket.get(r2Key(key));
    return object ? await object.text() : null;
  }

  try {
    return await fs.readFile(localPath(key), "utf-8");
  } catch {
    return null;
  }
}

export async function writeText(key: string, content: string): Promise<void> {
  const bucket = await getR2Bucket();
  if (bucket) {
    await bucket.put(r2Key(key), content);
    return;
  }

  const filepath = localPath(key);
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, content, "utf-8");
}

export async function readBytes(key: string): Promise<Buffer | null> {
  const bucket = await getR2Bucket();
  if (bucket) {
    const object = await bucket.get(r2Key(key));
    return object ? Buffer.from(await object.arrayBuffer()) : null;
  }

  try {
    return await fs.readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function writeBytes(
  key: string,
  data: Buffer | Uint8Array | ArrayBuffer
): Promise<void> {
  const bucket = await getR2Bucket();
  if (bucket) {
    await bucket.put(r2Key(key), data);
    return;
  }

  const filepath = localPath(key);
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  const bytes = data instanceof ArrayBuffer ? Buffer.from(new Uint8Array(data)) : Buffer.from(data);
  await fs.writeFile(filepath, bytes);
}

export async function deleteObject(key: string): Promise<void> {
  const bucket = await getR2Bucket();
  if (bucket) {
    await bucket.delete(r2Key(key));
    return;
  }

  await fs.unlink(localPath(key)).catch(() => {});
}

export async function deleteByPrefix(prefix: string): Promise<void> {
  const normalized = prefix.replace(/\\/g, "/");
  const bucket = await getR2Bucket();

  if (bucket) {
    let cursor: string | undefined;
    do {
      const listed = await bucket.list({
        prefix: r2Key(normalized),
        cursor,
      });
      await Promise.all(
        listed.objects.map((obj: { key: string }) => bucket.delete(obj.key))
      );
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
    return;
  }

  const local = localPath(normalized);
  const dir = path.dirname(local);
  const filePrefix = path.basename(local);
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files
        .filter((file) => file.startsWith(filePrefix))
        .map((file) => fs.unlink(path.join(dir, file)).catch(() => {}))
    );
  } catch {
    // directory may not exist
  }
}

export async function readJson<T>(key: string, defaultValue: T): Promise<T> {
  const raw = await readText(key);
  if (raw === null) return defaultValue;
  return JSON.parse(raw) as T;
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await writeText(key, JSON.stringify(value, null, 2));
}
