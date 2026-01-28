import { FastifySchema } from 'fastify';

export const userStatsOnlySchema: FastifySchema = {
  tags: ['user-stats'],
  summary: 'Get aggregate stats for a user',
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        wins: { type: 'number' },
        losses: { type: 'number' },
        totalMatches: { type: 'number' },
        lastPlayed: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
      },
      required: ['wins', 'losses', 'totalMatches'],
    },
  },
};

export const userMatchHistorySchema: FastifySchema = {
  tags: ['user-stats'],
  summary: 'List 1v1 match history for a user',
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          matchId: { type: 'number' },
          tournament: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
          orderIndex: { type: 'number' },
          status: { type: 'string' },
          startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          finishedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          result: { type: 'string', enum: ['WIN', 'LOSS', 'PENDING'] },
          userParticipantId: { type: 'number' },
          userScore: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          opponentScore: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          opponent: {
            type: 'object',
            additionalProperties: false,
            properties: {
              participantId: { type: 'number' },
              alias: { type: 'string' },
              userId: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            },
            required: ['participantId', 'alias', 'userId'],
          },
        },
        required: [
          'matchId',
          'tournament',
          'orderIndex',
          'status',
          'result',
          'userParticipantId',
          'opponent',
        ],
      },
    },
  },
};

export const userStatsDetailedSchema: FastifySchema = {
  tags: ['user-stats'],
  summary: 'Get user stats with per-match details',
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        wins: { type: 'integer' },
        losses: { type: 'integer' },
        games: { type: 'integer' },
        winRate: { type: 'integer' },
        matches: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              date: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
              opponentUsername: { type: 'string' },
              score: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              result: { type: 'string', enum: ['WIN', 'LOSS', 'PENDING'] },
            },
            required: ['opponentUsername', 'result'],
          },
        },
      },
      required: ['wins', 'losses', 'games', 'winRate', 'matches'],
    },
  },
};

export const userProfileWithStatsSchema: FastifySchema = {
  tags: ['user-stats'],
  summary: 'Get user profile with stats',
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        user: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
            avatar: { type: 'string', nullable: true },
          },
          required: ['id', 'username', 'email'],
        },
        stats: {
          type: 'object',
          additionalProperties: false,
          properties: {
            wins: { type: 'number' },
            losses: { type: 'number' },
            totalMatches: { type: 'number' },
            lastPlayed: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
          },
          required: ['wins', 'losses', 'totalMatches'],
        },
      },
      required: ['user', 'stats'],
    },
  },
};

export const internalMatchResultSchema: FastifySchema = {
  tags: ['internal'],
  summary: 'Record a match result internally (API key protected)',
  body: {
    type: 'object',
    required: ['winnerUserId', 'loserUserId'],
    additionalProperties: false,
    properties: {
      winnerUserId: { type: 'number' },
      loserUserId: { type: 'number' },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: { type: 'string' },
        winnerId: { type: 'number' },
        loserId: { type: 'number' },
        playedAt: { type: 'string' },
      },
      required: ['message', 'winnerId', 'loserId', 'playedAt'],
    },
  },
};

export const leaderboardSchema = {
  tags: ['leaderboard'],
  summary: 'Leaderboard sorted by total points',
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rank: { type: 'integer' },
          userId: { type: 'integer' },
          username: { type: 'string' },
          pointsTotal: { type: 'integer' },
        },
        required: ['rank', 'userId', 'username', 'pointsTotal'],
      },
    },
  },
};
