import { FastifyPluginCallback } from 'fastify';
import { auth } from '../helpers/auth.helpers.js';
import { presenceStore } from '../services/presence.service.js';
import { presenceFriendsSchema, presenceWsSchema, presenceSingleFriendSchema } from '../schemas/presence.schemas.js';
import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';

export const presenceController: FastifyPluginCallback = (server, _opts, done) => {
  server.get(
    '/ws',
    { websocket: true, schema: presenceWsSchema as any },
    (conn, req) => {
      try {
        const token = new URL(req.url, 'http://localhost').searchParams.get('token');
        if (!token) return conn.socket.close(4001, 'Missing token');

        let payload: any;
        try {
          payload = server.jwt.verify(token);
        } catch {
          return conn.socket.close(4003, 'Auth error');
        }

        const userId = Number(payload.sub ?? payload.id);
        if (!userId) return conn.socket.close(4002, 'Invalid token');

        server.gameMetrics.recordUserLogin('regular');

        presenceStore.touch(userId, conn.socket as any);

        conn.socket.on('message', (msg: any) => {
          if (msg.toString() === 'ping') {
            presenceStore.heartbeat(userId);
            try { conn.socket.send('pong'); } catch {}
          }
        });

        conn.socket.on('close', () => {
          presenceStore.removeConnection(userId, conn.socket as any);
          server.gameMetrics.recordUserLogout();
        });
      } catch {
        try { conn.socket.close(4003, 'Auth error'); } catch {}
      }
    }
  );

  server.get(
    '/friends',
    { ...auth(server), schema: presenceFriendsSchema },
    async (req: any, reply) => {
      const ids: number[] = await req.server.friendService.listFriendIds(req.user.id);
      reply.send(presenceStore.getStatuses(ids));
    }
  );

  server.get(
    '/friends/:friendId',
    { ...auth(server), schema: presenceSingleFriendSchema },
    async (req: any, reply) => {
      const friendId = Number(req.params.friendId);
      if (!Number.isInteger(friendId)) {
        throw new AppError('friendId must be integer', HTTP_STATUS.BAD_REQUEST);
      }
      if (friendId === req.user.id) {
        const { status, lastSeen } = presenceStore.getStatus(friendId);
        return reply.send({ userId: friendId, status, lastSeen });
      }
      const friendIds: number[] = await req.server.friendService.listFriendIds(req.user.id);
      if (!friendIds.includes(friendId)) {
        throw new AppError('Not a friend', HTTP_STATUS.FORBIDDEN);
      }
      const { status, lastSeen } = presenceStore.getStatus(friendId);
      reply.send({ userId: friendId, status, lastSeen });
    }
  );

  server.get(
    '/user/:userId',
    { ...auth(server) },
    async (req: any, reply) => {
      const userId = Number(req.params.userId);
      if (!Number.isInteger(userId)) {
        throw new AppError('userId must be integer', HTTP_STATUS.BAD_REQUEST);
      }
      const { status, lastSeen } = presenceStore.getStatus(userId);
      reply.send({ userId, status, lastSeen });
    }
  );

  done();
};
