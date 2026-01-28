// plugins/cors.ts
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

export default fp(async (fastify) => {
  const allowedOrigins = fastify.config?.cors?.origins || [];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      fastify.log.info({ origin }, 'CORS check');

      if (!origin) return cb(null, true);

      const cleanOrigin = origin.trim();
      if (allowedOrigins.includes(cleanOrigin)) {
        return cb(null, true);
      }
      return cb(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-internal-key',
      'x-request-id',
    ],
    exposedHeaders: ['x-request-id'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  fastify.log.info({ origins: allowedOrigins }, 'CORS plugin initialized');
});
