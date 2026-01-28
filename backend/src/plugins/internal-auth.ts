import { FastifyRequest, FastifyReply } from 'fastify';

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || '';

export async function internalAuth(req: FastifyRequest, reply: FastifyReply) {
  const key = req.headers['x-internal-key'];
  if (!INTERNAL_KEY || key !== INTERNAL_KEY) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }
}