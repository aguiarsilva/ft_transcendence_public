import { FastifyPluginCallback } from 'fastify';
import { UserStatsService } from '../services/user-stats.service.js';
import { userStatsOnlySchema, userMatchHistorySchema } from '../schemas/user-stats.schemas.js';
import { auth } from '../helpers/auth.helpers.js';
import { userFullHistorySchema } from '../schemas/user-history.schemas.js';
import { userStatsDetailedSchema } from '../schemas/user-stats.schemas.js';

const statsService = new UserStatsService();

export const userStatsController: FastifyPluginCallback = (server, _opts, done) => {
  server.get(
    '/users/:id/',
    {
      schema: {
        ...userStatsOnlySchema,
        summary: 'Get user aggregate stats',
      },
      ...auth(server),
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      if (req.user.id !== id) return reply.status(403).send({ message: 'Forbidden' });
      const stats = await statsService.get(id);
      reply.send({
        wins: stats.wins,
        losses: stats.losses,
        totalMatches: stats.wins + stats.losses,
        lastPlayed: stats.lastPlayed,
      });
    }
  );

  server.get(
    '/users/:id/history',
    {
      schema: {
        ...userFullHistorySchema,
        summary: 'Get full match history for a user',
      },
      ...auth(server),
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      // Allow viewing other users' match history (public profile data)
      const items = await statsService.getFullHistory(id);
      reply.send(items);
    }
  );

  server.get(
    '/users/:id/matches',
    {
      schema: {
        ...userMatchHistorySchema,
        summary: 'Get user 1v1 match history',
      },
      ...auth(server),
    },
    async (req, reply) => {
      try {
        const id = Number((req.params as any).id);
        console.log('getUserMatchHistory called for userId:', id);
        
        // Allow viewing other users' match history (public profile data)
        const history = await statsService.getMatchHistory(id);
        console.log('getUserMatchHistory success, found', history.length, 'matches');
        reply.send(history);
      } catch (error) {
        console.error('getUserMatchHistory error:', error);
        reply.status(500).send({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  );

  server.get(
    '/users/:id/detailed',
    {
      schema: {
        ...userStatsDetailedSchema,
        summary: 'Get user stats with per-match details',
      },
      ...auth(server),
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      //if (req.user.id !== id) return reply.status(403).send({ message: 'Forbidden' });
      const data = await statsService.getStatsDetailed(id);
      reply.send(data);
    }
  );

  done();
};
