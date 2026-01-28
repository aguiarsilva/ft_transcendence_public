export const idParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' }
  },
  required: ['id']
};

export const successfulResponseSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
};
