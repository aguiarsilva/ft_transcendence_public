import fp from 'fastify-plugin';
import { FastifyPluginAsync } from "fastify";
import { GameMetricsService } from "../services/game-metrics.service.js";

const gameMetricsPlugin: FastifyPluginAsync = async (fastify) => {
        if (!fastify.metrics) {
            fastify.log.error("Metrics Plugin ot initialized before game-metrics");
            return;
        }
        fastify.decorate("gameMetrics", new GameMetricsService(fastify));
        fastify.log.info("🎮 Game Metrics Plugin initialized");
};

export default fp(gameMetricsPlugin, { name: 'gameMetricsPlugin', dependencies: ['metricsPlugin'] });