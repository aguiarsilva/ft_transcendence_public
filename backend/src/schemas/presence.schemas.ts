export const presenceFriendsSchema = {
  tags: ['presence'],
  summary: 'Get presence status for all friends',
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          userId: { type: 'number' },
          status: { type: 'string', enum: ['online', 'offline'] },
          lastSeen: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        },
        required: ['userId', 'status'],
      },
    },
  },
};

export const presenceWsSchema = {
  tags: ['presence'],
  summary: 'WebSocket for live presence (send ping every 30s)',
  querystring: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', description: 'JWT bearer token' },
    },
  },
};

export const presenceSingleFriendSchema = {
  tags: ['presence'],
  summary: 'Get presence for a single friend',
  params: {
    type: 'object',
    required: ['friendId'],
    properties: { friendId: { type: 'number' } },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: { type: 'number' },
        status: { type: 'string', enum: ['online', 'offline'] },
        lastSeen: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      },
      required: ['userId', 'status'],
    },
  },
};
