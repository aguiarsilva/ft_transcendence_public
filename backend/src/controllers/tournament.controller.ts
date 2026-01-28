import { FastifyPluginCallback } from 'fastify';
import { TournamentService } from '../services/tournament.service.js';
import {
  createTournamentSchema,
  registerParticipantSchema,
  listParticipantsSchema,
  seedTournamentSchema,
  cancelTournamentSchema,
  getTournamentSchema,
  nextOrWinnersSchema,
} from '../schemas/tournament.schemas.js';
import {
  CreateTournamentBody,
  RegisterParticipantBody,
  TournamentIdParam,
} from '../types/tournament.types.js';
import { auth, optionalAuth } from '../helpers/auth.helpers.js';

export const tournamentsController: FastifyPluginCallback = (server, _opts, done) => {
  //init tournament service
  const svc = new TournamentService(server.gameMetrics);

  function toNextPlayer(p: any) {
    return p
      ? { id: p.id, alias: p.alias, userId: p.user?.id ?? null }
      : null;
  }

  function toNextMatch(m: any) {
    if (!m) return null;
    return {
      id: m.id,
      orderIndex: m.orderIndex,
      status: m.status,
      player1: toNextPlayer(m.player1),
      player2: toNextPlayer(m.player2),
    };
  }

  // Create tournament (auth required)
  server.post(
    '/',
    { ...auth(server), schema: createTournamentSchema },
    async (req, reply) => {
      const body = req.body as CreateTournamentBody;
      const t = await svc.createTournament(body.name, req.user.id, body.maxPlayers);
      reply.send(t);
    }
  );

  // List tournaments
  server.get(
    '/',
    { ...auth(server) },
    async (_req, reply) => {
      const list = await svc.listTournaments();
      reply.send(list);
    }
  );

  // Register participant
  // Authenticated: alias ignored & replaced with username
  // Guest: alias required
  server.post(
    '/:id/participants',
    { ...auth(server), schema: registerParticipantSchema },
    async (req: any, reply) => {
      const { id } = req.params as TournamentIdParam;
      const { alias } = (req.body as RegisterParticipantBody) || {};
      const participant = await svc.addParticipant(Number(id), alias, req.user?.id ?? null);
      reply.send(participant);
    }
  );

  // List participants (minimal)
  server.get(
    '/:id/participants',
    { ...auth(server), schema: listParticipantsSchema },
    async (req, reply) => {
      const { id } = req.params as TournamentIdParam;
      const rows = await svc.listParticipants(Number(id));
      reply.send(rows);
    }
  );

  // Seed matches (auth)
  server.post(
    '/:id/seed',
    { ...auth(server), schema: seedTournamentSchema },
    async (req, reply) => {
      const { id } = req.params as TournamentIdParam;
      const participantsList = await svc.listParticipants(Number(id));
      const res = await svc.seedRoundRobin(Number(id), req.user.id);

      server.gameMetrics.recordTournamentStart(participantsList.length);
      reply.send(res);
    }
  );

  // Get tournament
  server.get(
    '/:id',
    { ...auth(server), schema: getTournamentSchema },
    async (req, reply) => {
      const { id } = req.params as TournamentIdParam;
      const t = await svc.getTournament(Number(id));
      reply.send(t);
    }
  );

  // Cancel tournament (auth, creator-only)
  server.post(
    '/:id/cancel',
    { ...auth(server), schema: cancelTournamentSchema },
    async (req, reply) => {
      const { id } = req.params as TournamentIdParam;
      const t = await svc.cancelTournament(Number(id), req.user.id);
      reply.send({ id: t.id, status: t.status, finishedAt: t.finishedAt ?? null });
    }
  );

  server.get(
    '/:id/participants/summary',
    { ...auth(server) },
    async (req, reply) => {
      const { id } = req.params as TournamentIdParam;
      const summary = await svc.getParticipationSummary(Number(id));
      reply.send(summary);
    }
  );

  // Next match
  server.get(
    '/:id/next',
    {...auth(server), schema: nextOrWinnersSchema },
    async (req, reply) => {
      const { id } = req.params as TournamentIdParam;
      const result = await svc.getNextOrWinners(Number(id));
      reply.send(result);
    }
  );

  done();
};
