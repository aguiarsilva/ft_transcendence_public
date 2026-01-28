import { FastifyInstance } from 'fastify';
import { validateEmail } from '../helpers/user.helpers.js';
import { getSafeUser } from '../helpers/user.helpers.js';
import { generateToken } from '../helpers/auth.helpers.js';
import * as otplib from 'otplib';
import { decrypt } from '../helpers/encryption.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { UserRepository } from '../repositories/user.repository.js';

const userRepo = new UserRepository();

export async function loginUser(email: string, password: string, server: FastifyInstance) {
  const user = await userRepo.findByEmail(email);
  if (!user || !(await user.isPasswordValid(password))) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.is2FAEnabled) {
    return { twoFARequired: true, user: getSafeUser(user) };
  }

  const token = generateToken(user, server);
  return { token, user: getSafeUser(user) };
}

export async function verifyLogin2FA(email: string, token: string, server: FastifyInstance) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.is2FAEnabled || !user.twoFASecret) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  const secret = decrypt(user.twoFASecret);
  const isValid = otplib.authenticator.check(token, secret);
  if (!isValid) throw new AppError('Invalid 2FA token', HTTP_STATUS.UNAUTHORIZED);

  const jwtToken = generateToken(user, server);
  return { token: jwtToken, user: getSafeUser(user) };
}
