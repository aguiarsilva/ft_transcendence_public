import { FastifyPluginCallback } from 'fastify';
import { loginUser, verifyLogin2FA } from '../services/auth.service.js';
import { findOrCreateGoogleUser } from '../services/google-oauth.service.js';
import { generateToken } from '../helpers/auth.helpers.js';
import { getSafeUser } from '../helpers/user.helpers.js';
import { loginSchema, login2FAVerifySchema, googleOAuthSchema } from '../schemas/auth.schemas.js';
import { AppError } from '../helpers/app-error.js';
import { auth } from '../helpers/auth.helpers.js';

export const authController: FastifyPluginCallback = (server, _, done) => {
  server.post(
    '/login',
    { schema: { ...loginSchema, tags: ['auth'], summary: 'Login (initiates 2FA if enabled)' } },
    async (req, reply) => {
      try {
        const { email, password } = req.body as any;
        const result = await loginUser(email, password, server);
      
      //Track if login was successful no fa required
      if (result.token) {
        server.gameMetrics.recordUserLogin('regular');
      }

        return reply.send(result);
      } catch (err: any) {
        if (err instanceof AppError) {
          return reply.status(err.statusCode || 400).send({ message: err.message });
        }
        console.error(err);
        return reply.status(500).send({ message: 'Internal Server Error' });
      }
    }
  );

  server.post(
    '/login/2fa',
    { schema: { ...login2FAVerifySchema, tags: ['auth'], summary: 'Verify 2FA login token' } },
    async (req, reply) => {
      const { email, token } = req.body as any;
      const result = await verifyLogin2FA(email, token, server);

      //Track if login was successful with 2FA
      if (result.token) {
        server.gameMetrics.recordUserLogin('2fa');
      }

      return reply.send(result);
    }
  );

  server.post(
    '/oauth/google',
    async (req, reply) => {
      try {
        const { token } = req.body as any;
        if (!token) {
          return reply.status(400).send({ message: 'Missing Google token' });
        }
        const user = await findOrCreateGoogleUser(token);
        const jwt = generateToken(user, server);

      //Track if login was sucessful with oauth
      server.gameMetrics.recordUserLogin('oauth');

        return reply.send({ token: jwt, user: getSafeUser(user) });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ message: err.message });
      }
    }
  );
  
  server.post(
    '/logout',
    { ...auth(server), schema: { tags: ['auth'], summary: 'Logout current session (stateless)' } },
    async (_req, reply) => {
      return reply.status(204).send();
    }
  );

  done();
}
