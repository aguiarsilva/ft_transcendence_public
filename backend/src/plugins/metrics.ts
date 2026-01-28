import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import client from 'prom-client';
import { GameMetricsService } from '../services/game-metrics.service.js';
import { DbMetricsService } from '../services/db-metrics.service.js';

const metricsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
	const register = new client.Registry();

	client.collectDefaultMetrics({ register });

	const httpRequestDuration = new client.Histogram({
		name: 'http_request_duration_seconds',
		help: 'Duration of HTTP requests in seconds',
		labelNames: ['method', 'route', 'status_code'],
		buckets: [0.1, 0.5, 1, 2, 5],
		registers: [register],
	});

	const httpRequestTotal = new client.Counter({
		name: 'http_requests_total',
		help: 'Total number of HTTP requests',
		labelNames: ['method', 'route', 'status_code'],
		registers: [register],
	});

	const activeConnections = new client.Gauge({
		name: 'http_active_connections',
		help: 'Number of active HTTP connections',
		registers: [register],
	});

	const websocketConnections = new client.Gauge({
		name: 'websocket_connections_total',
		help: 'Number of active Websocket connections',
		registers: [register],
	});

	const dbTotalUsers = new client.Gauge({
		name: 'db_total_users',
		help: 'Total number of registered users in database',
		registers: [register],
	});

	const dbActiveUsers = new client.Gauge({
		name: 'db_active_users_24h',
		help: 'Number of active users in last 24 hours',
		registers: [register],
	});

	const dbTotalMatches = new client.Gauge({
		name: 'db_total_matches',
		help: 'Total number of completed matches in database',
		registers: [register],
	});

	const dbOngoingMatches = new client.Gauge({
		name: 'db_ongoing_matches',
		help: 'Number of ongoing matches in database',
		registers: [register],
	});

	const dbTotalTournaments = new client.Gauge({
		name: 'db_total_tournaments',
		help: 'Total number of tournaments in database',
		registers: [register],
	});

	const dbActiveTournaments = new client.Gauge({
		name: 'db_active_tournaments',
		help: 'Number of active tournaments in database',
		registers: [register],
	});

	const dbTotalFriendships = new client.Gauge({
		name: 'db_total_friendships',
		help: 'Total number of accepted friendships',
		registers: [register],
	});

	const dbPendingFriendRequests = new client.Gauge({
		name: 'db_pending_friend_requests',
		help: 'Total number of pending friend requests',
		registers: [register],
	});

	const dbAvgMatchesPerUser = new client.Gauge({
		name: 'db_avg_matches_per_user',
		help: 'Average number of matches per user',
		registers: [register],
	});

	const dbMetricsService = new DbMetricsService();

	const updateDbMetrics = async () => {
		try {
			const metrics = await dbMetricsService.getAllMetrics();
			dbTotalUsers.set(metrics.totalUsers);
			dbActiveUsers.set(metrics.activeUsers);
			dbTotalMatches.set(metrics.totalMatches);
			dbOngoingMatches.set(metrics.ongoingMatches);
			dbTotalTournaments.set(metrics.totalTournaments);
			dbActiveTournaments.set(metrics.activeTournaments);
			dbTotalFriendships.set(metrics.totalFriendships);
			dbPendingFriendRequests.set(metrics.pendingFriendRequests);
			dbAvgMatchesPerUser.set(metrics.avgMatchesPerUser);
		} catch (error) {
			fastify.log.error({ err: error }, 'Failed to update DB metrics');
		}
	};

	await updateDbMetrics();

	const dbMetricsInterval = setInterval(updateDbMetrics, 30000);

	register.registerMetric(httpRequestDuration);
	register.registerMetric(httpRequestTotal);
	register.registerMetric(activeConnections);
	register.registerMetric(websocketConnections);

	fastify.addHook('onClose', async () => {
		clearInterval(dbMetricsInterval);
	});

	fastify.decorate('metrics', {
		register,
		httpRequestDuration,
		httpRequestTotal,
		activeConnections,
		websocketConnections,
		dbMetrics: {
			dbTotalUsers,
			dbActiveUsers,
			dbTotalMatches,
			dbOngoingMatches,
			dbTotalTournaments,
			dbActiveTournaments,
			dbTotalFriendships,
			dbPendingFriendRequests,
			dbAvgMatchesPerUser,
		},
	});

	// --- Count all requests including errors ---
	// Add error hook to catch schema/other Fastify errors
	fastify.addHook('onError', async (request, reply, error) => {
  	const { activeConnections, httpRequestTotal } = fastify.metrics;

  	if (request.url === '/metrics') return;

  	activeConnections.dec();
  	const route = request.routeOptions?.url || request.routerPath || request.url;
	const method = request.method;
	const status_code = reply.statusCode || 500;

  	httpRequestTotal.inc({
  		method,
  		route,
  		status_code
  	});
  });
	
	//Track requests metrics by Hook
	fastify.addHook('onRequest', async (request, reply) => {
		if (request.url === '/metrics') return;
		activeConnections.inc();
		request.startTime = Date.now();
	});
	
	fastify.addHook('onResponse', async (request, reply) => {
		if (request.url ===  '/metrics') return;

		activeConnections.dec();

		const duration = (Date.now() - (request.startTime || Date.now())) / 1000;
		const route = request.routeOptions?.url || request.routerPath|| request.url;
		const method = request.method;
		const statusCode = reply.statusCode;

		httpRequestDuration.observe(
			{ method, route, status_code: statusCode },
			duration
		);

		httpRequestTotal.inc({
			method,
			route,
			status_code: statusCode,
		});
	});

	fastify.get('/metrics', async (request, reply) => {
		try {
			const metrics = await register.metrics();
			reply.type(register.contentType);
			return metrics;
		} catch (error){
			fastify.log.error({ err: error }, 'Error generating metrics');
			reply.status(500).send({ error: 'Failed to generate metrics'});
		}
	});
};

declare module 'fastify' {
	interface FastifyRequest {
		startTime?: number;
	}

	interface FastifyInstance {
		metrics: {
			register: client.Registry;
			httpRequestDuration: client.Histogram;
			httpRequestTotal: client.Counter;
			activeConnections: client.Gauge;
			websocketConnections: client.Gauge;
			activeUsers?: client.Gauge<string>;
			dbMetrics: {
				dbTotalUsers: client.Gauge;
				dbActiveUsers: client.Gauge;
				dbTotalMatches: client.Gauge;
				dbOngoingMatches: client.Gauge;
				dbTotalTournaments: client.Gauge;
				dbActiveTournaments: client.Gauge;
				dbTotalFriendships: client.Gauge;
				dbPendingFriendRequests: client.Gauge;
				dbAvgMatchesPerUser: client.Gauge;
			};
		};
		gameMetrics: GameMetricsService;
	}
}

console.log('Metrics Plugin Loaded');

export default fp(metricsPlugin, { name: 'metricsPlugin' });
