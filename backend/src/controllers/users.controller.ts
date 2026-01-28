import { FastifyPluginCallback } from 'fastify';
import { createUser, changePassword, getUserById, setUserAvatar, updateUser } from '../services/user.service.js';
import { auth } from '../helpers/auth.helpers.js';
import { userBodySchema, userResponseSchema, changePasswordSchema, avatarUploadResponseSchema, updateUserSchema } from '../schemas/users.schemas.js';
import { UserStatsService } from '../services/user-stats.service.js';
import { userProfileWithStatsSchema } from '../schemas/user-stats.schemas.js';
import { storeAvatarFile } from '../helpers/avatar.helpers.js';

const statsService = new UserStatsService();

interface CreateUserBody {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}
interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const usersController: FastifyPluginCallback = (server, _, done) => {
  server.post<{ Body: CreateUserBody }>(
    '/users',
    {
      schema: {
        tags: ['users'],
        body: userBodySchema.body,
        response: userResponseSchema.response,
        summary: 'Create user',
      },
    },
    async (req, reply) => {
      const user = await createUser(req.body);

      //Track registration of user
      server.gameMetrics.recordUserRegistration();
      
      return reply.send({ user });
    }
  );

  server.post<{ Body: ChangePasswordBody }>(
    '/users/change-password',
    {
      ...auth(server),
      schema: {
        ...changePasswordSchema,
        tags: ['users'],
        summary: 'Change current user password',
      },
    },
    async (req, reply) => {
      await changePassword(String(req.user.id), req.body.currentPassword, req.body.newPassword);
      return reply.send({ message: 'Password updated successfully' });
    }
  );

  server.post(
    '/users/avatar',
    {
      ...auth(server),
      schema: {
        tags: ['users'],
        summary: 'Upload/replace current user avatar',
        consumes: ['multipart/form-data'],
        response: avatarUploadResponseSchema.response,
      },
    },
    async (req, reply) => {
      const parts = req.parts();
      let avatarFile: any;
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'avatar') {
          avatarFile = part;
          break;
        }
      }
      if (!avatarFile) {
        return reply.code(400).send({ message: 'Avatar file is required' });
      }

      const user = await getUserById(String(req.user.id));
      const newPath = await storeAvatarFile(user, avatarFile);
      const updated = await setUserAvatar(String(user.id), newPath);
      return reply.send({ message: 'Avatar updated', user: updated });
    }
  );

  server.get(
    '/users/:id/profile',
    { 
      ...auth(server),
      schema: {
        ...userProfileWithStatsSchema,
        tags: ['users'],
        summary: 'Get user profile with stats',
      },
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      const user = await getUserById(String(id));
      const stats = await statsService.get(id);
      return reply.send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
        stats: {
          wins: stats.wins,
          losses: stats.losses,
          totalMatches: stats.wins + stats.losses,
          lastPlayed: stats.lastPlayed,
        },
      });
    }
  );

  server.patch<{ Body: { email?: string; username?: string; firstName?: string; lastName?: string } }>(
    '/users',
    {
      ...auth(server),
      schema: {
        tags: ['users'],
        summary: 'Partially update current user',
        body: updateUserSchema.body,
        response: userResponseSchema.response,
      },
    },
    async (req, reply) => {
      const updated = await updateUser(String(req.user.id), req.body);
      return reply.send({ user: updated });
    }
  );

  done();
};
