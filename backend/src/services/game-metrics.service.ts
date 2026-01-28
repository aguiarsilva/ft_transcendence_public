import { FastifyInstance } from 'fastify';
import client from 'prom-client';

export class GameMetricsService {
    private fastify: FastifyInstance;

    //Metrics for the matches
    private matchesTotal: client.Counter;
    private activeMatches: client.Gauge;
    private matchDuration: client.Histogram;
    private playerResults: client.Counter;

    //Metrics for the Users
    private activeUsers: client.Gauge;
    private userRegistrations: client.Counter;
    private userLogins: client.Counter;

    //metrics for Websockets
    private websocketMessages: client.Counter;
    private websocketLatency: client.Histogram;

    //Metrics for Tournaments
    private activeTournament: client.Gauge;
    private tournamentParticipants: client.Histogram;

    //Metrics for Friends
    private friendRequests: client.Counter;

    constructor(fastify: FastifyInstance) {
        this.fastify = fastify;
        const register = fastify.metrics.register;

        //Init match metrics
        this.matchesTotal = new client.Counter({
            name: 'matches_total',
            help: 'Total number of matches played',
            labelNames: ['match_type'],
            registers: [register],
        });

        this.activeMatches = new client.Gauge({
            name: 'active_matches',
            help: 'Number of active matches',
            registers: [register],
        });

        this.matchDuration = new client.Histogram({
            name: 'match_duration_seconds',
            help: 'Duration of completed matches in seconds',
            labelNames: ['match_type'],
            buckets: [30, 60, 120, 300, 600],
            registers: [register],
        });

        this.playerResults = new client.Counter({
            name: 'player_results_total',
            help: 'Total player match results',
            labelNames: ['result'],
            registers: [register],
        });

        //Init metrics for Users
        this.activeUsers = new client.Gauge({
            name: 'active_users',
            help: 'Number of currently logged in users',
            registers: [register],
        }); 

        this.userRegistrations = new client.Counter({
            name: 'user_registrations_total',
            help: 'Total number of user registrations',
            registers: [register],
        });

        this.userLogins = new client.Counter({
            name: 'user_logins_total',
            help: 'Total number of user logins',
            labelNames: ['method'],
            registers: [register],
        });

        //Init metrics for websocket
        this.websocketMessages = new client.Counter({
            name: 'websocket_messages_total',
            help: 'Total WebSocket messages sent/received',
            labelNames: ['direction', 'type'],
            registers: [register],
        });

        this.websocketLatency = new client.Histogram({
            name: 'websocket_latency_seconds',
            help: 'Websocket message round-trip latency',
            buckets: [0.01, 0.05, 0.1, 0.5, 1],
            registers: [register],
        });

        //Init metrics for tournaments
        this.activeTournament = new client.Gauge({
            name: 'active_tournaments',
            help: 'Number of active tournaments',
            registers: [register],
        });

        this.tournamentParticipants = new client.Histogram({
            name: 'tournament_participants',
            help: 'Number of participants per tournament',
            buckets: [4, 8, 16, 32, 64],
            registers: [register],
        });

        //Init metrics for friends
        this.friendRequests = new client.Counter({
            name: 'friend_requests_total',
            help: 'Total friend requests',
            labelNames: ['status'],
            registers: [register],
        });
    }

        //Methods for the match tracking
        recordMatchStart(matchType: 'casual' | 'tournament' | 'ranked' = 'casual') {
            this.matchesTotal.inc({ match_type: matchType });
            this.activeMatches.inc();
        }

        recordMatchEnd(matchType: 'casual' | 'tournament' | 'ranked', durationSeconds: number) {
            this.activeMatches.dec();
            this.matchDuration.observe({ match_type: matchType}, durationSeconds);
        }

        recordPlayerResult(result: 'win' | 'loss' | 'disconnect') {
            this.playerResults.inc({ result });
        }

        //Methods for tracking users
        recordUserLogin(method: '2fa' | 'oauth' | 'regular' = 'regular') {
            this.userLogins.inc({ method });
            this.activeUsers.inc();
        }

        recordUserLogout() {
            this.activeUsers.dec();
        }

        recordUserRegistration() {
            this.userRegistrations.inc();
        }

        //Methods for tracking websocket
        recordWebSocketMessage(direction: 'in' | 'out', type: string) {
            this.websocketMessages.inc({ direction, type });
        }

        recordWebSocketLatency(latencySeconds: number) {
            this.websocketLatency.observe(latencySeconds);
        }

        //Methods for tracking tournaments
        recordTournamentStart(participantCount: number) {
            this.activeTournament.inc();
            this.tournamentParticipants.observe(participantCount);
        }

        recordTournamentEnd() {
            this.activeTournament.dec();
        }

        //Methods for tracking friends
        recordFriendRequest(status: 'sent' | 'accepted' | 'rejected') {
            this.friendRequests.inc({ status });
        }

        //Util to set active users and matches from DB count
        setActiveUsersFromDB(count: number) {
            this.activeUsers.set(count);
        }

        setActiveMatchesFromDB(count: number) {
            this.activeMatches.set(count);
        }
    }

//Extend fastify types
declare module 'fastify' {
    interface FastifyInstance {
        gameMetrics: GameMetricsService;
    }
}