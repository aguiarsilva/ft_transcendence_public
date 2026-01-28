import fp from 'fastify-plugin';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import config from '../config.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: number;
      email: string;
    };
  }
}

const authPlugin: FastifyPluginCallback = (server, _, done) => {
  server.register(fastifyJwt, { secret: config.jwt.secret });

  server.decorate(
    'authenticate',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();

      } catch (err) {
        req.log.error({ err }, 'Authentication failed');
        reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          error: 'UNAUTHORIZED',
          message: 'Authentication failed: invalid or expired token'
        });
      }
    }
  );

  done();
};

export default fp(authPlugin);
