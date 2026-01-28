import { FastifyPluginCallback } from 'fastify';
import { MatchService } from '../services/match.service.js';
import { UserStatsService } from '../services/user-stats.service.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';

export const internalUserStatsController: FastifyPluginCallback = (server, _opts, done) => {
  const matchService = new MatchService(server.gameMetrics);
  const statsService = new UserStatsService();

  // Example internal endpoint using existing methods
  server.post('/internal/matches/:id/result', async (req, reply) => {
    const matchId = Number((req.params as any).id);
    const { scoreP1, scoreP2 } = (req.body as any) || {};
    if (Number.isNaN(matchId)) throw new AppError('Invalid match id', HTTP_STATUS.BAD_REQUEST);
    await matchService.submitResult(matchId, Number(scoreP1), Number(scoreP2));
    return reply.send({ message: 'Result recorded' });
  });

  // Direct stats manipulation (example legacy)
  server.post('/internal/stats/manual', async (req, reply) => {
    const { winnerUserId, loserUserId, playedAt } = (req.body as any) || {};
    if (!winnerUserId || !loserUserId) {
      throw new AppError('winnerUserId and loserUserId required', HTTP_STATUS.BAD_REQUEST);
    }
    await statsService.ensure(Number(winnerUserId));
    await statsService.ensure(Number(loserUserId));
    await statsService.recordResult(Number(winnerUserId), Number(loserUserId), new Date(playedAt || Date.now()));
    return reply.send({ message: 'Stats updated' });
  });

  server.post('/internal/stats/manual/simple', async (req, reply) => {
    const { winnerId, loserId, playedAt } = (req.body as any) || {};
    if (!winnerId || !loserId) {
      throw new AppError('winnerId and loserId required', HTTP_STATUS.BAD_REQUEST);
    }
    await statsService.ensure(Number(winnerId));
    await statsService.ensure(Number(loserId));
    await statsService.recordResult(Number(winnerId), Number(loserId), new Date(playedAt || Date.now()));
    return reply.send({ message: 'Stats updated' });
  });

  done();
};
