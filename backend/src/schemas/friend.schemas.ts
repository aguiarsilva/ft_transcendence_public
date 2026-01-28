import { FastifySchema } from 'fastify';

export const friendBaseProps = {
  id: { type: 'number' },
  userId: { type: 'number' },
  friendId: { type: 'number' },
  accepted: { type: 'boolean' },
  createdAt: { type: 'string', format: 'date-time' },
};

export const sendFriendRequestSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['username'],
    additionalProperties: false,
    properties: {
      username: { type: 'string', minLength: 3 },
    },
  },
  response: {
    201: {
      type: 'object',
      required: ['message', 'id'],
      properties: {
        message: { type: 'string', example: 'Friend request sent' },
        id: { type: 'number', example: 5 },
      },
    },
  },
};

export const acceptFriendRequestSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'Friend request accepted' },
      },
    },
  },
};

export const declineFriendRequestSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'Friend request declined' },
      },
    },
  },
};

export const listFriendsSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      required: ['friends'],
      properties: {
        friends: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'userId', 'friendId', 'accepted', 'createdAt'],
            properties: friendBaseProps,
          },
        },
      },
    },
  },
};

export const deleteFriendSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      required: ['message', 'id'],
      properties: {
        message: { type: 'string', example: 'Friend removed' },
        id: { type: 'number', example: 5 },
      },
    },
  },
};

export const listPendingInvitesSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      required: ['incoming', 'outgoing'],
      properties: {
        incoming: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'userId', 'friendId', 'accepted', 'createdAt'],
            properties: friendBaseProps,
          },
        },
        outgoing: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'userId', 'friendId', 'accepted', 'createdAt'],
            properties: friendBaseProps,
          },
        },
      },
    },
  },
};
