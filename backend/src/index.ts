import 'dotenv/config';
import 'reflect-metadata';
import fastify, { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import ajvErrors from 'ajv-errors';
import ajvFormats from 'ajv-formats';
import config from './config.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import { authController } from './controllers/auth.controller.js';
import { usersController } from './controllers/users.controller.js';
import { twoFAController } from './controllers/twofa.controller.js';
import { initDatabase } from './db.js';
import { AppError } from './helpers/app-error.js';
import { HTTP_STATUS } from './common/constants/http-status.js';
import friendController from './controllers/friend.controller.js';
import { userStatsController } from './controllers/user-stats.controller.js';
import { internalUserStatsController } from './controllers/internal-endpoint.controller.js';
import { tournamentsController } from './controllers/tournament.controller.js';
import { matchesController } from './controllers/matches.controller.js';
import { presenceController } from './controllers/presence.controller.js';
import websocketPlugin from './plugins/websocket.js';
import { FriendService } from './services/friend.service.js';
import { leaderboardController } from './controllers/leaderboard.controller.js';
import metricsPlugin from './plugins/metrics.js';
import gameMetricsPlugin from './plugins/game-metrics.plugin.js';
// Swagger imports
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';

class Application {
  server: FastifyInstance;

  constructor() {
    const certDir = path.join(process.cwd(), '../certs');
    const keyPath = path.join(certDir, 'server.key');
    const certPath = path.join(certDir, 'server.crt');

    // Ensure logs directory exists for file-based logging (used by ELK)
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Fastify Ajv config with plugins
    // Dual logging: pino-pretty to stdout (for local visibility) + JSON file (for ELK)
    const loggerConfig = process.env.NODE_ENV === 'production'
      ? {
          level: 'info',
          file: path.join(logsDir, 'backend.log'),
        }
      : {
          transport: {
            targets: [
              // Pretty-print to stdout for local visibility
              {
                target: 'pino-pretty',
                options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' },
              },
              // JSON to file for ELK ingestion (Filebeat will tail this)
              {
                target: 'pino/file',
                options: { destination: path.join(logsDir, 'backend.log') },
              },
            ],
          },
        };

    const options: Record<string, unknown> = {
      logger: loggerConfig,
      ajv: {
        customOptions: {
          allErrors: true,
          $data: true,
        },
        plugins: [ajvFormats, ajvErrors],
      },
    };

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      options.https = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }

    this.server = fastify(options);

    const corsOrigins = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    this.server.decorate('config', {
      cors: { origins: corsOrigins }
    });

    this.server.setErrorHandler((err, req, reply) => {
      this.server.log.error(
        { err, url: req.url, method: req.method },
        'Unhandled error'
      );

      // Fastify / Ajv validation errors
      if (err?.code === 'FST_ERR_VALIDATION' && Array.isArray(err.validation)) {
        const errors = err.validation.map((v: any) => {
          const field =
            v.keyword === 'required'
              ? v.params?.missingProperty
              : (v.instancePath || '').replace(/^\//, '') || '';

          // Custom friendly overrides
          if (field === 'email' && v.keyword === 'format') {
            return { field, code: 'invalid_email', message: 'Email is invalid' };
          }
          if (field === 'password' && v.keyword === 'minLength') {
            return {
              field,
              code: 'password_too_short',
              message: 'Password must be at least 8 characters'
            };
          }

          return {
            field,
            code: v.keyword,
            message: v.message || 'Invalid input'
          };
        });

        const topMessage = errors[0]?.message || 'Invalid request data';
        return reply.status(400).send({ message: topMessage, errors });
      }

      // Custom application errors
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ message: err.message });
      }

      // Fallback
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
    });
  }

  async startHttpServer() {
    try {
      await initDatabase();

      //metrics for prometheus/grafana
      await this.server.register(metricsPlugin);
      await this.server.register(gameMetricsPlugin);

      // Register CORS first
      await this.server.register(corsPlugin);

      // Enable multipart for avatar uploads
      await this.server.register(multipart, {
        limits: { fileSize: 1_000_000, files: 1 }
      });

      // Static serving for avatars
      this.server.get('/avatars/:file', async (req, reply) => {
        const fileParam = String((req.params as any).file || '');
        const safeName = path.basename(fileParam);
        const abs = path.join(process.cwd(), 'public', 'avatars', safeName);

        try {
          await fs.promises.access(abs, fs.constants.R_OK);
        } catch {
          return reply.code(404).send({ message: 'Not found' });
        }

        const ext = path.extname(abs).toLowerCase();
        const ct =
          ext === '.png' ? 'image/png' :
          ext === '.webp' ? 'image/webp' :
          'image/jpeg';

        reply.header('Content-Type', ct);
        return reply.send(fs.createReadStream(abs));
      });

      await this.server.register(swagger, {
        swagger: {
          info: { title: 'MyApp API', description: 'API documentation for MyApp backend', version: '1.0.0' },
          schemes: ['http', 'https'],
          consumes: ['application/json', 'multipart/form-data'],
          produces: ['application/json'],
          securityDefinitions: {
            internalApiKey: {
              type: 'apiKey',
              name: 'x-internal-key',
              in: 'header',
              description: 'INTERNAL service key. Do not use from client apps.',
            },
          },
          tags: [
            { name: 'auth', description: 'Authentication & sessions' },
            { name: 'users', description: 'User management' },
            { name: 'friends', description: 'Friend system' },
            { name: 'presence', description: 'Online presence' },
            { name: 'internal', description: 'INTERNAL ONLY endpoints' },
            { name: 'user-stats', description: 'User statistics' },
          ],
        },
      });

      await this.server.register(swaggerUi, { routePrefix: '/docs', uiConfig: { docExpansion: 'list', deepLinking: false } });

      await this.server.register(websocketPlugin);
      this.server.decorate('friendService', new FriendService());

      this.server.register(authPlugin);
      this.server.register(authController, { prefix: config.apiPrefix + '/auth' });
      this.server.register(usersController, { prefix: config.apiPrefix });
      this.server.register(twoFAController, { prefix: config.apiPrefix + '/2fa' });
      this.server.register(friendController, { prefix: config.apiPrefix + '/friends' });
      this.server.register(tournamentsController, { prefix: config.apiPrefix + '/tournaments' });
      this.server.register(matchesController, { prefix: config.apiPrefix + '/matches' });
      this.server.register(presenceController, { prefix: config.apiPrefix + '/presence' });
      this.server.register(leaderboardController, { prefix: config.apiPrefix + '/leaderboard' });
      this.server.register(userStatsController, { prefix: config.apiPrefix + '/stats' });
      this.server.register(internalUserStatsController, { prefix: '/internal' });

      await this.server.listen({ port: config.port, host: config.host });

      const protocol = (this.server as any).https ? 'https' : 'http';
      this.server.log.info(`Server running at ${protocol}://${config.host}:${config.port}`);
      this.server.log.info(`Swagger docs: ${protocol}://${config.host}:${config.port}/docs`);
    } catch (error) {
      this.server.log.error({ err: error }, 'Failed to start HTTP server');
      process.exit(1);
    }
  }

  async main() {
    await this.startHttpServer();
  }
}

new Application().main();