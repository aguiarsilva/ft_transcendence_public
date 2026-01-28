import * as otplib from 'otplib';
import { encrypt, decrypt } from '../helpers/encryption.js';
import { getUserById } from './user.service.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { UserRepository } from '../repositories/user.repository.js';

const userRepo = new UserRepository();

// How long to keep a temporary secret (ms).
const TEMP_SECRET_TTL_MS = 1000 * 60 * 10; // 10 minutes

export async function setup2FA(userId: string) {
  const user = await getUserById(userId);
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);

  if (user.is2FAEnabled) {
    throw new AppError('2FA is already enabled', HTTP_STATUS.CONFLICT);
  }

  const tempSecret = otplib.authenticator.generateSecret();

  const otpauthUrl = otplib.authenticator.keyuri(user.email, 'MyApp', tempSecret);

  user.twoFATempSecret = encrypt(tempSecret);
  await userRepo.update(user);

  return { otpauthUrl };
}

export async function verify2FA(userId: string, token: string) {
  const user = await getUserById(userId);
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);

  if (!user.twoFATempSecret) {
    throw new AppError('2FA setup not initiated', HTTP_STATUS.BAD_REQUEST);
  }

  let tempSecret: string;
  try {
    tempSecret = decrypt(user.twoFATempSecret);
  } catch (err) {
    throw new AppError('2FA setup invalid or corrupted', HTTP_STATUS.BAD_REQUEST);
  }

  const isValid = otplib.authenticator.check(token, tempSecret);
  if (!isValid) throw new AppError('Invalid 2FA token', HTTP_STATUS.BAD_REQUEST);

  user.is2FAEnabled = true;
  user.twoFASecret = encrypt(tempSecret);

  user.twoFATempSecret = null;

  await userRepo.update(user);

  return { message: '2FA enabled successfully' };
}

export async function disable2FA(userId: string, token: string) {
  const user = await getUserById(userId);
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);

  // Require 2FA to be enabled
  if (!user.is2FAEnabled || !user.twoFASecret) {
    throw new AppError('2FA not enabled', HTTP_STATUS.BAD_REQUEST);
  }

  // Verify provided token against the stored 2FA secret
  let secret: string;
  try {
    secret = decrypt(user.twoFASecret);
  } catch {
    throw new AppError('2FA secret invalid or corrupted', HTTP_STATUS.BAD_REQUEST);
  }

  const isValid = otplib.authenticator.check(token, secret);
  if (!isValid) {
    throw new AppError('Invalid 2FA token', HTTP_STATUS.BAD_REQUEST);
  }

  user.is2FAEnabled = false;
  user.twoFASecret = null;
  user.twoFATempSecret = null;
  await userRepo.update(user);

  return { message: '2FA disabled successfully' };
}
