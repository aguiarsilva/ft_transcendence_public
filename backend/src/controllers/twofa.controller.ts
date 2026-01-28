import { FastifyPluginCallback } from 'fastify';
import { setup2FA, verify2FA, disable2FA } from '../services/twofa.service.js';
import { auth } from '../helpers/auth.helpers.js';
import { twoFASetupResponseSchema, twoFAVerifySchema, twoFADisableSchema } from '../schemas/twofa.schemas.js';

export const twoFAController: FastifyPluginCallback = (server, _, done) => {
  server.post(
    '/setup',
    {
      ...auth(server),
      schema: {
        ...twoFASetupResponseSchema,
        tags: ['auth'],
        summary: 'Generate 2FA secret & QR (enables pending 2FA)',
      },
    },
    async (req, reply) => {
      const data = await setup2FA(String(req.user.id));
      return reply.send(data);
    }
  );

  server.post(
    '/verify',
    {
      ...auth(server),
      schema: {
        ...twoFAVerifySchema,
        tags: ['auth'],
        summary: 'Confirm 2FA by providing TOTP code',
      },
    },
    async (req, reply) => {
      await verify2FA(String(req.user.id), (req.body as any).token);
      return reply.send({ message: '2FA enabled successfully' });
    }
  );

  server.post(
    '/disable',
    {
      ...auth(server),
      schema: {
        ...twoFADisableSchema,
        tags: ['auth'],
        summary: 'Disable existing 2FA',
      },
    },
    async (req, reply) => {
      const { token } = (req.body as any) || {};
      await disable2FA(String(req.user.id), token);
      return reply.send({ message: '2FA disabled successfully' });
    }
  );

  done();
};
