import { FastifySchema } from 'fastify';

export const userBaseProps = {
  id: { type: 'number' },
  email: { type: 'string' },
  username: { type: 'string' },
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  avatar: { type: 'string', nullable: true },
};

export const userResponseSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            ...userBaseProps,
            is2FAEnabled: { type: 'boolean' },
          },
          required: ['id', 'email', 'username', 'firstName', 'lastName'],
        },
      },
      required: ['user'],
    },
  },
};

export const userBodySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'username', 'password', 'firstName', 'lastName'],
    properties: {
      email: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      avatar: { type: 'string', nullable: true },
    },
  },
};

export const updateUserSchema = {
  body: {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 30 },
      firstName: { type: 'string', minLength: 1, maxLength: 50 },
      lastName: { type: 'string', minLength: 1, maxLength: 50 },
    },
  },
};

export const changePasswordSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string' },
      newPassword: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password updated successfully' },
      },
      required: ['message'],
    },
  },
};

export const avatarUploadResponseSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            ...userBaseProps,
          },
          required: ['id', 'email', 'username', 'firstName', 'lastName'],
        },
      },
      required: ['message', 'user'],
    },
  },
};
