import { FastifySchema } from 'fastify';

export const twoFASetupResponseSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        otpauthUrl: { type: 'string' },
      },
      required: ['otpauthUrl'],
    },
  },
};

export const twoFAVerifySchema: FastifySchema = {
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
        message: { type: 'string', example: '2FA enabled successfully' },
      },
      required: ['message'],
    },
  },
};

export const twoFADisableSchema: FastifySchema = {
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
        message: { type: 'string', example: '2FA disabled successfully' },
      },
      required: ['message'],
    },
  },
};