import { FastifyPluginCallback } from 'fastify';
import { MatchService } from '../services/match.service.js';
import {
  listMatchesSchema,
  submitMatchResultSchema,
  getMatchSchema,
  createPvPSchema,
} from '../schemas/match.schemas.js';
import { auth, optionalAuth } from '../helpers/auth.helpers.js';
import { MatchIdParam, SubmitMatchResultBody } from '../types/match.types.js';

function toParticipant(p: any) {
  if (!p) return null;
  const id = p.id ?? null;
  const alias = p.alias ?? p.user?.username ?? null;
  if (id == null && alias == null) return null;
  return { id, alias };
}

function toMatch(m: any) {
  if (!m) return null;

  const tournament = m.tournament
    ? { id: m.tournament.id, name: m.tournament.name }
    : null;

  return {
    id: m.id,
    tournament,
    orderIndex: m.orderIndex,
    status: m.status,
    player1: toParticipant(m.player1),
    player2: toParticipant(m.player2),
    scoreP1: m.scoreP1 ?? null,
    scoreP2: m.scoreP2 ?? null,
    winnerParticipant: toParticipant(m.winnerParticipant),
    startedAt: m.startedAt ? new Date(m.startedAt).toISOString() : null,
    finishedAt: m.finishedAt ? new Date(m.finishedAt).toISOString() : null,
  };
}

export const matchesController: FastifyPluginCallback = (server, _opts, done) => {
  //instantiate metrics here
  const svc = new MatchService(server.gameMetrics);

  // List matches by tournament
  server.get(
    '/tournament/:id',
    { ...auth(server), schema: listMatchesSchema },
    async (req, reply) => {
      const { id } = req.params as any;
      const rows = await svc.listByTournament(Number(id));
      reply.send(rows.map(toMatch));
    }
  );

  // Get single match
  server.get(
    '/:id',
    { ...auth(server),schema: getMatchSchema },
    async (req, reply) => {
      const { id } = req.params as MatchIdParam;
      const m = await svc.get(Number(id));
      reply.send(toMatch(m));
    }
  );

  // Submit match result
  server.post(
    '/:id/result',
    { ...auth(server), schema: submitMatchResultSchema },
    async (req, reply) => {
      const { id } = req.params as MatchIdParam;
      const body = req.body as SubmitMatchResultBody;

      await svc.submitResult(Number(id), body.scoreP1, body.scoreP2);
      const updated = await svc.get(Number(id));
      reply.send(toMatch(updated));
    }
  );

  server.post(
    '/pvp',
    { ...auth(server), schema: createPvPSchema }, 
    async (req: any, reply) => {
      const body = (req.body as { opponentAlias?: string; opponentUsername?: string; opponentUserId?: number }) || {};
      const player1UserId = req.user?.id ?? null;

      if (!player1UserId && !body.opponentAlias && !body.opponentUsername && !body.opponentUserId) {
        return reply.status(400).send({ message: 'Provide opponent alias/username or be authenticated' });
      }

      const created = await svc.createPvPMatch(player1UserId, {
        opponentAlias: body.opponentAlias ?? null,
        opponentUsername: body.opponentUsername ?? null,
        opponentUserId: body.opponentUserId ?? null,
      });

      // Re-fetch to ensure relations are loaded
      const match = await svc.get(created.id);
      reply.send(toMatch(match));
    }
  );

  done();
};
