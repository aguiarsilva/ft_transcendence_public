import { FastifySchema } from 'fastify';
import { userBaseProps } from './users.schemas.js';

/**
 * Normal login request and response
 */
export const loginSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        errorMessage: {
          type: 'Email must be a string',
          format: 'Email must be a valid email address',
        },
      },
      password: {
        type: 'string',
        minLength: 8,
        errorMessage: {
          type: 'Password must be a string',
          minLength: 'Password must be at least 8 characters long',
        },
      },
    },
    errorMessage: {
      required: {
        email: 'Email is required',
        password: 'Password is required',
      },
      type: 'Invalid request body format',
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            ...userBaseProps,
            is2FAEnabled: { type: 'boolean' },
          },
          required: ['id', 'email', 'username', 'firstName', 'lastName'],
        },
      },
    },
  },
};

/**
 * Login with 2FA
 */
export const login2FAVerifySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'token'],
    properties: {
      email: { type: 'string', format: 'email' },
      token: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            ...userBaseProps,
            is2FAEnabled: { type: 'boolean' },
          },
          required: ['id', 'email', 'username', 'firstName', 'lastName', 'is2FAEnabled'],
        },
      },
    },
  },
};

/**
 * Google OAuth login
 */
export const googleOAuthSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            ...userBaseProps,
            is2FAEnabled: { type: 'boolean' },
          },
          required: ['id', 'email', 'username', 'firstName', 'lastName'],
        },
      },
    },
  },
};
