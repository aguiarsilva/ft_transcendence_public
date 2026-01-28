import { FastifyInstance } from 'fastify';
import { FriendService } from '../services/friend.service.js';
import {
  sendFriendRequestSchema,
  acceptFriendRequestSchema,
  declineFriendRequestSchema,
  listFriendsSchema,
  deleteFriendSchema,
  listPendingInvitesSchema
} from '../schemas/friend.schemas.js';
import { ISendFriendRequestBody } from '../types/friend.types.js';
import { auth } from '../helpers/auth.helpers.js';

export default async function friendController(server: FastifyInstance) {
  const friendService = new FriendService();

    server.post<{ Body: ISendFriendRequestBody }>(
    '/friends',
    {
      ...auth(server),
      schema: {
        ...sendFriendRequestSchema,
        tags: ['friends'],
        summary: 'Send friend request',
      },
    },
    async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const result = await friendService.sendFriendRequest(request.user.id, request.body);
      server.gameMetrics.recordFriendRequest('sent');
      return reply.code(201).send(result);
    }
  );

  server.get(
    '/friends/pending',
    {
      ...auth(server),
      schema: {
        ...listPendingInvitesSchema,
        tags: ['friends'],
        summary: 'List pending invitations',
      },
    },
    async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const pending = await friendService.listPendingInvites(request.user.id);
      return reply.send(pending);
    }
  );

  server.post(
    '/friends/:id/accept',
    {
      ...auth(server),
      schema: {
        ...acceptFriendRequestSchema,
        tags: ['friends'],
        summary: 'Accept friend request',
      },
    },
    async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const id = Number((request.params as any).id);
      const result = await friendService.acceptFriendRequest(request.user.id, id);
      //Track for friend accepted
      server.gameMetrics.recordFriendRequest('accepted');
      return reply.send(result);
    }
  );

  server.post(
    '/friends/:id/decline',
    {
      ...auth(server),
      schema: {
        ...declineFriendRequestSchema,
        tags: ['friends'],
        summary: 'Decline friend request',
      },
    },
    async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const id = Number((request.params as any).id);
      const result = await friendService.declineFriendRequest(request.user.id, id);
      //Track for friend rejected
      server.gameMetrics.recordFriendRequest('rejected');
      return reply.send(result);
    }
  );

  server.get(
    '/friends',
    {
      ...auth(server),
      schema: {
        ...listFriendsSchema,
        tags: ['friends'],
        summary: 'List friends',
      },
    },
    async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const friends = await friendService.listFriends(request.user.id);
      return reply.send({ friends });
    }
  );

  server.delete(
    '/friends/:id',
    {
      ...auth(server),
      schema: {
        ...deleteFriendSchema,
        tags: ['friends'],
        summary: 'Delete friend relationship',
      },
    },
    async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
      const id = Number((request.params as any).id);
      await friendService.deleteFriend(request.user.id, id);
      return reply.code(200).send({ message: 'Friend removed', id });
    }
  );
}
