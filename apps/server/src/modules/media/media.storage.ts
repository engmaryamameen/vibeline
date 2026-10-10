import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), process.env.MEDIA_STORAGE_DIR || '.data/media');
const KEY_PATTERN = /^[0-9a-f-]{36}$/i;

const pathFor = (key: string) => {
  if (!KEY_PATTERN.test(key)) throw new Error('Invalid media storage key');
  return resolve(root, key);
};

export const mediaStorage = {
  async put(key: string, data: Buffer) {
    await mkdir(root, { recursive: true });
    await writeFile(pathFor(key), data, { flag: 'wx' });
  },
  read(key: string) {
    return createReadStream(pathFor(key));
  },
  async delete(key: string) {
    await unlink(pathFor(key)).catch(() => undefined);
  }
};
