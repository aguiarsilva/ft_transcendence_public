import { FastifySchema } from 'fastify';

// Minimal participant: only id + alias
const participantEntitySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'number' },
    alias: { type: 'string' },
  },
  required: ['id', 'alias'],
};

const nullableTournamentSchema = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
      },
      required: ['id', 'name'],
    },
    { type: 'null' },
  ],
};

const matchEntitySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'number' },
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
    player1: participantEntitySchema,
    player2: participantEntitySchema,
    scoreP1: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    scoreP2: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    winnerParticipant: {
      anyOf: [participantEntitySchema, { type: 'null' }],
    },
    startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    finishedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: [
    'id',
    'tournament',
    'orderIndex',
    'status',
    'player1',
    'player2',
  ],
};

export const listMatchesSchema: FastifySchema = {
  tags: ['matches'],
  summary: 'List matches for a tournament',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'array',
      items: matchEntitySchema,
    },
  },
};

export const getMatchSchema: FastifySchema = {
  tags: ['matches'],
  summary: 'Get a single match',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: matchEntitySchema,
  },
};

export const submitMatchResultSchema: FastifySchema = {
  tags: ['matches'],
  summary: 'Submit result for a match',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  body: {
    type: 'object',
    required: ['scoreP1', 'scoreP2'],
    additionalProperties: false,
    properties: {
      scoreP1: { type: 'integer', minimum: 0 },
      scoreP2: { type: 'integer', minimum: 0 },
    },
  },
  response: {
    200: matchEntitySchema,
  },
};

export const createPvPSchema = {
  body: {
    type: 'object',
    properties: {
      opponentAlias: { type: 'string', nullable: true },
      opponentUsername: { type: 'string', nullable: true },
      opponentUserId: { type: 'number', nullable: true },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'number' },
        tournament: nullableTournamentSchema, // declare tournament properly
        orderIndex: { type: 'number' },
        status: { type: 'string' },
        player1: participantEntitySchema,    // declare players with id+alias
        player2: participantEntitySchema,
        scoreP1: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        scoreP2: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        winnerParticipant: { anyOf: [participantEntitySchema, { type: 'null' }] },
        startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        finishedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      },
      required: ['id', 'tournament', 'orderIndex', 'status', 'player1', 'player2'],
    },
  },
};
