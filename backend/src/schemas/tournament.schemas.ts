import { FastifySchema } from 'fastify';

const tournamentStatusEnum = ['REGISTERING', 'IN_PROGRESS', 'FINISHED'] as const;

const participantProperties = {
  id: { type: 'number' },
  tournamentId: { type: 'number' },
  alias: { type: 'string' },
  userId: { anyOf: [{ type: 'number' }, { type: 'null' }] },
  registered: { type: 'boolean' },
  seed: { anyOf: [{ type: 'number' }, { type: 'null' }] },
  createdAt: { type: 'string', format: 'date-time' },
};

const participantSchema = {
  type: 'object',
  additionalProperties: false,
  properties: participantProperties,
  required: ['id', 'tournamentId', 'alias', 'userId', 'registered'],
};

const tournamentBaseProperties = {
  id: { type: 'number' },
  name: { type: 'string' },
  status: { type: 'string', enum: [...tournamentStatusEnum] },
  maxPlayers: { anyOf: [{ type: 'number' }, { type: 'null' }] },
  createdAt: { type: 'string', format: 'date-time' },
  startedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  finishedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
};

export const createTournamentSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'Create tournament',
  body: {
    type: 'object',
    required: ['name', 'maxPlayers'],
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1 },
      maxPlayers: { type: 'integer', minimum: 3, maximum: 8 },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: tournamentBaseProperties,
      required: ['id', 'name', 'status', 'createdAt'],
    },
  },
};

export const registerParticipantSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'Register participant (auth user -> username; guest -> alias)',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    properties: { alias: { type: 'string', minLength: 1 } },
  },
  response: {
    200: participantSchema,
  },
};

export const listParticipantsSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'List participants (minimal)',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'array',
      items: participantSchema,
    },
  },
};

export const nextOrWinnersSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        completed: { type: 'boolean' },
        nextMatch: {
          anyOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                orderIndex: { type: 'integer' },
                status: { type: 'string' },
                player1: {
                  anyOf: [
                    { type: 'null' },
                    {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        alias: { type: 'string' },
                        userId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
                      },
                      required: ['id', 'alias', 'userId'],
                    },
                  ],
                },
                player2: {
                  anyOf: [
                    { type: 'null' },
                    {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        alias: { type: 'string' },
                        userId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
                      },
                      required: ['id', 'alias', 'userId'],
                    },
                  ],
                },
              },
              required: ['id', 'orderIndex', 'status', 'player1', 'player2'],
            },
            { type: 'null' },
          ],
        },
        tournament: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            status: { type: 'string' },
            finishedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
          },
          required: ['id'],
        },
        winners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              place: { type: 'integer', enum: [1, 2] },
              userId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
              alias: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            },
            required: ['place', 'userId', 'alias'],
          },
          default: [],
        },
      },
      required: ['completed', 'nextMatch', 'tournament'],
    },
  },
};

export const seedTournamentSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'Seed matches (round-robin)',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        created: { type: 'number' },
      },
      required: ['created'],
    },
  },
};

export const getTournamentSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'Get tournament',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: tournamentBaseProperties,
      required: ['id', 'name', 'status', 'createdAt'],
    },
  },
};

const nextMatchPlayerRef = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'number' },
    alias: { type: 'string' },
    userId: { anyOf: [{ type: 'number' }, { type: 'null' }] },
  },
  required: ['id', 'alias', 'userId'],
};

const nextMatchObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'number' },
    orderIndex: { type: 'number' },
    status: { type: 'string' },
    player1: nextMatchPlayerRef,
    player2: nextMatchPlayerRef,
  },
  required: ['id', 'orderIndex', 'status', 'player1', 'player2'],
};

export const nextMatchSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'Get next pending match (or null)',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      anyOf: [
        nextMatchObject,
        { type: 'null' },
      ],
    },
  },
};

export const cancelTournamentSchema: FastifySchema = {
  tags: ['tournaments'],
  summary: 'Cancel tournament',
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: { id: { type: 'integer' } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'number' },
        status: { type: 'string' },
        finishedAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
      },
      required: ['id', 'status'],
    },
  },
};

