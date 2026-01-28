import { FastifySchema } from 'fastify';

export const userFullHistorySchema: FastifySchema = {
  tags: ['user-history'],
  summary: 'Full user match history (tournament, PvP, AI)',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'number' },
          userId: { type: 'number' },
          playedAt: { type: 'string', format: 'date-time' },
          opponentAlias: { type: 'string' },
          opponentUserId: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          matchType: { type: 'string', enum: ['tournament', 'pvp', 'ai'] },
          result: { type: 'string', enum: ['WIN', 'LOSS'] },
          userScore: { type: 'number' },
          opponentScore: { type: 'number' },
          sourceMatchId: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          tournamentId: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        },
        required: [
          'id',
          'userId',
          'playedAt',
          'opponentAlias',
          'matchType',
          'result',
          'userScore',
          'opponentScore',
        ],
      },
    },
  },
};
