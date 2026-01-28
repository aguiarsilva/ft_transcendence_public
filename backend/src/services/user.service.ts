import { validateEmail, validatePassword } from '../helpers/user.helpers.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { UserRepository } from '../repositories/user.repository.js';
import { sanitizeInput } from '../helpers/sanitize.js';
import { UserStatsService } from './user-stats.service.js';

const userRepo = new UserRepository();
const statsService = new UserStatsService();

export async function getUserById(id: string) {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  return user;
}

export async function createUser(data: Partial<any>) {
  try {
    validateEmail(data.email!);
    validatePassword(data.password!, data.email);

    if (!data.avatar) data.avatar = '/avatars/avatar.jpg';

    const clean = sanitizeInput(data);
    const user = await userRepo.create(clean);

    await statsService.get(user.id);

    return user;
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT' || err?.code === '23505') {
      throw new AppError('Email or username already in use', HTTP_STATUS.CONFLICT);
    }
    if (err.message?.includes('invalid') || err.message?.includes('Password')) {
      throw new AppError(err.message, HTTP_STATUS.BAD_REQUEST);
    }
    throw new AppError('Could not create user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export async function updateUser(id: string, data: Partial<any>) {
  try {
    const user = await getUserById(id);

    // allow only selected fields
    const allowed = ['email', 'username', 'firstName', 'lastName'] as const;
    const filtered: Record<string, any> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) filtered[key] = data[key];
    }
    if (Object.keys(filtered).length === 0) {
      throw new AppError('No valid fields to update', HTTP_STATUS.BAD_REQUEST);
    }

    const clean = sanitizeInput(filtered);

    // validate email if changing
    if (clean.email && clean.email !== user.email) {
      validateEmail(clean.email);
      const existingByEmail = await userRepo.findByEmail(clean.email);
      if (existingByEmail && existingByEmail.id !== user.id) {
        throw new AppError('Email or username already in use', HTTP_STATUS.CONFLICT);
      }
    }

    // validate username uniqueness if changing
    if (clean.username && clean.username !== user.username) {
      const existingByUsername = await userRepo.findByUsername(clean.username);
      if (existingByUsername && existingByUsername.id !== user.id) {
        throw new AppError('Email or username already in use', HTTP_STATUS.CONFLICT);
      }
    }

    Object.assign(user, clean);
    return await userRepo.update(user);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err?.code === 'SQLITE_CONSTRAINT' || err?.code === '23505') {
      throw new AppError('Email or username already in use', HTTP_STATUS.CONFLICT);
    }
    throw new AppError('Could not update user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await getUserById(userId);
  validatePassword(newPassword, user.email);

  const isValid = await user.isPasswordValid(currentPassword);
  if (!isValid) throw new AppError('Current password is invalid', HTTP_STATUS.BAD_REQUEST);

  user.password = newPassword;
  return await userRepo.update(user);
}

export async function setUserAvatar(userId: string, newPath: string) {
  const user = await getUserById(userId);
  user.avatar = newPath;
  return await userRepo.update(user);
}
