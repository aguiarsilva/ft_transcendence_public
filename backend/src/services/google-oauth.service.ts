import { OAuth2Client } from 'google-auth-library';
import config from '../config.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { UserRepository } from '../repositories/user.repository.js';
import { UserOAuthRepository } from '../repositories/user-oauth.repository.js';
import { sanitizeInput } from '../helpers/sanitize.js';
import { createUser } from './user.service.js';

const googleClient = new OAuth2Client(config.google.clientId);
const userRepo = new UserRepository();
const oauthRepo = new UserOAuthRepository();

export async function findOrCreateGoogleUser(token: string) {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid Google token', HTTP_STATUS.UNAUTHORIZED);
  }

  const { sub: oauthId, email, given_name, family_name, picture } = payload!;
  if (!email || !oauthId) {
    throw new AppError('Google account is missing email or ID', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if an OAuth account already exists
  let oauthAccount = await oauthRepo.findByProviderAndId('google', oauthId);
  if (oauthAccount) {
    if (!oauthAccount.user) {
      await oauthRepo.deleteById(oauthAccount.id);
    } else {
      return oauthAccount.user;
    }
  }

  // Check if a user already exists by email
  let user = await userRepo.findByEmail(email);
  if (!user) {
    // Generate a unique username
    let baseUsername = email.split('@')[0];
    let username = baseUsername;
    let i = 1;
    while (await userRepo.findByUsername(username)) {
      username = `${baseUsername}${i}`;
      i++;
    }

    const clean = sanitizeInput({
      email,
      firstName: given_name || 'Google',
      lastName: family_name || 'User',
      username,
      password: Math.random().toString(36).slice(-12),
    });

    user = await createUser(clean);
  }
  await oauthRepo.create('google', oauthId, user);
  return user;
}
