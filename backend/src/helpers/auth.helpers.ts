import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { User } from '../models/user.js';
import config from '../config.js';
import { AppError } from './app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';

export function generateToken(user: User, server: FastifyInstance) {
  try {
    return server.jwt.sign(
      { id: user.id, email: user.email },
      { expiresIn: config.jwt.expiresIn }
    );
  } catch {
    throw new AppError('Could not generate JWT token', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Strict auth (401 if invalid)
export const auth = (server: FastifyInstance) => ({
  onRequest: (req: FastifyRequest, reply: FastifyReply) => server.authenticate(req, reply),
});

// Optional auth: attach req.user if valid token, else remain anonymous
export const optionalAuth = (server: FastifyInstance) => ({
  onRequest: async (req: FastifyRequest) => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return;
    const token = h.slice(7).trim();
    if (!token) return;
    try {
      const payload = await server.jwt.verify<{ id: number; email: string }>(token);
      (req as any).user = { id: payload.id, email: payload.email };
    } catch {
      // ignore invalid token
    }
  },
});