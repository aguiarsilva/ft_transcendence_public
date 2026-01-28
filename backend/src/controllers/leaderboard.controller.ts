import { FastifyPluginCallback } from 'fastify';
import { leaderboardSchema } from '../schemas/user-stats.schemas.js';
import { UserStatsService } from '../services/user-stats.service.js';
import { auth } from '../helpers/auth.helpers.js';

const statsService = new UserStatsService();

export const leaderboardController: FastifyPluginCallback = (server, _opts, done) => {
  server.get(
    '/',
    { ...auth(server), schema: leaderboardSchema },
    async (req: any, reply) => {
      const limit = Number(req.query.limit ?? 25);
      const offset = Number(req.query.offset ?? 0);
      const sortBy = req.query.sortBy;
      const sortDir = req.query.sortDir;
      const data = await statsService.getLeaderboard(limit, offset, sortBy, sortDir);
      reply.send(data);
    }
  );

  server.get('/rank/:userId',
    { ...auth(server) },
    async (req: any, reply) => {
      const userId = Number(req.params.userId);
      const data = await statsService.getUserRankByPoints(userId);
      reply.send(data);
    });

  server.get('/rank', { ...auth(server) }, async (req, reply) => {
    const userId = Number((req.query as any)?.userId ?? req.user?.id);
    if (!userId) return reply.status(400).send({ message: 'userId required' });

    const data = await statsService.getUserRankByPoints(userId);
    reply.send(data);
  });

  done();
};
