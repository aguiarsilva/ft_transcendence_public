import fs from 'fs';
import path from 'path';
import { AppError } from './app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { User } from '../models/user.js';

const DEFAULT_AVATAR = '/avatars/avatar.jpg';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 1_000_000; // 1MB

export async function storeAvatarFile(user: User, file: { filename: string; mimetype: string; file: NodeJS.ReadableStream; fields?: any; encoding?: string; _buf?: Buffer; bytes?: number }) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    throw new AppError('Unsupported image type', HTTP_STATUS.BAD_REQUEST);
  }

  // Collect into buffer (small size limit)
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of file.file) {
    const buf = Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_SIZE) throw new AppError('Avatar too large', HTTP_STATUS.BAD_REQUEST);
    chunks.push(buf);
  }
  const data = Buffer.concat(chunks);

  // Basic signature check
  const isJPEG = data.slice(0, 2).toString('hex') === 'ffd8';
  const isPNG = data.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
  const isWEBP = data.slice(0, 4).toString('ascii') === 'RIFF' && data.slice(8, 12).toString('ascii') === 'WEBP';
  if (!isJPEG && !isPNG && !isWEBP) {
    throw new AppError('Invalid or corrupted image', HTTP_STATUS.BAD_REQUEST);
  }

  const ext = isPNG ? '.png' : isWEBP ? '.webp' : '.jpg';
  const newName = `user-${user.id}-${Date.now()}${ext}`;
  const absDir = path.join(process.cwd(), 'public', 'avatars');
  await fs.promises.mkdir(absDir, { recursive: true });
  const absPath = path.join(absDir, newName);
  await fs.promises.writeFile(absPath, data, { flag: 'wx' });

  // Delete previous (if not default)
  if (user.avatar && user.avatar !== DEFAULT_AVATAR) {
    const oldAbs = path.join(process.cwd(), 'public', user.avatar.replace(/^\//, ''));
    if (oldAbs.startsWith(absDir)) {
      fs.promises.unlink(oldAbs).catch(() => {});
    }
  }

  return `/avatars/${newName}`;
}