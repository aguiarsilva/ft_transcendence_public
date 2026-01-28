import { User } from '../models/user.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';

export function getSafeUser(user: User) {
  const { password, twoFASecret, ...safeUser } = user;
  return safeUser;
}

export const getIsInvalidMessage = (fieldLabel: string) => `${fieldLabel} is invalid`;

/**
 * Validates a password according to project rules:
 * - Minimum 8 characters
 * - At least 1 letter
 * - At least 1 digit
 * - Is email same as password
 * Throws an Error with a descriptive message if invalid.
 */
export function validatePassword(password: string, email?: string) {
  if (email && password.toLowerCase() === email.toLowerCase()) {
    throw new Error('Password cannot be the same as email');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Password must include at least 1 letter and 1 digit');
  }
}

/**
 * Validates email format using regex
 * Throws an Error if invalid
 */
export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Email is invalid', HTTP_STATUS.BAD_REQUEST);
  }
}
