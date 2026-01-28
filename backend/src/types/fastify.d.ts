import 'fastify';
import { FriendService } from '../services/friend.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    config?: {
      cors?: { origins: string[] }
    };
  }
}