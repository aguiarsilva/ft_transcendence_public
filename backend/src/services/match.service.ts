import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { TournamentMatchRepository } from '../repositories/tournament-match.repository.js';
import { TournamentPlayerRepository } from '../repositories/tournament-player.repository.js';
import { UserStatsService } from './user-stats.service.js';
import { AppDataSource } from '../db.js';
import { GameMetricsService } from './game-metrics.service.js';
import { UserMatchHistoryRepository } from '../repositories/user-match-history.repository.js';
import { PointsService } from './points.service.js';
import { TournamentService } from './tournament.service.js';
import { User } from '../models/user.js';

export class MatchService {
  private matches = new TournamentMatchRepository();
  private players = new TournamentPlayerRepository();
  private stats = new UserStatsService();
  private gameMetrics: GameMetricsService;
  private history = new UserMatchHistoryRepository();
  private points = new PointsService();
  private tournamentSvc: TournamentService;

  constructor(gameMetrics: GameMetricsService) {
    this.gameMetrics = gameMetrics;
    this.tournamentSvc = new TournamentService(gameMetrics);
  }

  async listByTournament(tournamentId: number) {
    return this.matches.listByTournament(tournamentId);
  }

  async findById(matchId: number) {
    return this.matches.findById(matchId);
  }

  async get(matchId: number) {
    const m = await this.matches.findById(matchId);
    if (!m) throw new AppError('Match not found', HTTP_STATUS.NOT_FOUND);
    return m;
  }

  async createPvPMatch(
    player1UserId?: number | null,
    opponent?: { opponentAlias?: string | null; opponentUsername?: string | null; opponentUserId?: number | null }
  ) {
    const userRepo = AppDataSource.getRepository(User);

    // Player1 alias/user
    let aliasP1: string;
    if (player1UserId) {
      const u1 = await userRepo.findOne({ where: { id: player1UserId } });
      aliasP1 = u1?.username ?? `user-${player1UserId}`;
    } else {
      aliasP1 = `guest-${Date.now()}`;
    }

    // Resolve Player2
    let p2UserId: number | null = null;
    let aliasP2: string | null = null;

    if (opponent?.opponentUserId != null) {
      const u2 = await userRepo.findOne({ where: { id: opponent.opponentUserId } });
      if (!u2) throw new AppError('Opponent user not found', HTTP_STATUS.BAD_REQUEST);
      p2UserId = u2.id;
      aliasP2 = u2.username;
    } else if (opponent?.opponentUsername) {
      const u2 = await userRepo
        .createQueryBuilder('u')
        .where('LOWER(u.username) = LOWER(:uname)', { uname: opponent.opponentUsername })
        .getOne();
      if (!u2) throw new AppError('Opponent user not found', HTTP_STATUS.BAD_REQUEST);
      p2UserId = u2.id;
      aliasP2 = u2.username;
    } else if (opponent?.opponentAlias) {
      aliasP2 = opponent.opponentAlias.trim();
    }

    if (p2UserId && player1UserId && p2UserId === player1UserId) {
      throw new AppError('Opponent cannot be the same as creator', HTTP_STATUS.BAD_REQUEST);
    }

    const finalAliasP2 = aliasP2 && aliasP2.length > 0 ? aliasP2 : `guest-${Date.now() + 1}`;

    // Create standalone participants (no tournament)
    const p1 = await this.players.createStandaloneParticipant(aliasP1, player1UserId ?? null);
    const p2 = await this.players.createStandaloneParticipant(finalAliasP2, p2UserId);

    // Create match (no tournament)
    const m = await this.matches.createStandaloneMatch(p1.id, p2.id, 1);

    this.gameMetrics.recordMatchStart('casual');

    // Return with relations populated
    return this.get(m.id);
  }

  async submitResult(matchId: number, scoreP1: number, scoreP2: number) {
    if (!Number.isInteger(scoreP1) || !Number.isInteger(scoreP2) || scoreP1 < 0 || scoreP2 < 0) {
      throw new AppError('Invalid scores', HTTP_STATUS.BAD_REQUEST);
    }
    if (scoreP1 === scoreP2) {
      throw new AppError('Draw not allowed', HTTP_STATUS.BAD_REQUEST);
    }

    const { payload, tournamentId } = await AppDataSource.transaction(async (trx) => {
      const match = await this.matches.findById(matchId);
      if (!match) throw new AppError('Match not found', HTTP_STATUS.NOT_FOUND);
      if (match.status === 'FINISHED') throw new AppError('Match already finished', HTTP_STATUS.BAD_REQUEST);
      if (!match.player1 || !match.player2) {
        throw new AppError('Match participants not fully assigned', HTTP_STATUS.BAD_REQUEST);
      }

      const p1UserId = match.player1.user?.id ?? null;
      const p2UserId = match.player2.user?.id ?? null;

      // finalize
      match.status = 'FINISHED';
      match.scoreP1 = scoreP1;
      match.scoreP2 = scoreP2;
      match.finishedAt = new Date();
      match.startedAt = match.startedAt ?? new Date();
      const p1Wins = scoreP1 > scoreP2;
      match.winnerParticipant = p1Wins ? match.player1 : match.player2;

      await this.matches.save(match);

      // metrics
      if (match.startedAt && match.finishedAt) {
        const started = new Date(match.startedAt);
        const finished = new Date(match.finishedAt);
        const durationSeconds = (finished.getTime() - started.getTime()) / 1000;
        const matchType: 'casual' | 'tournament' | 'ranked' = match.tournament ? 'tournament' : 'casual';
        this.gameMetrics.recordMatchEnd(matchType, durationSeconds);
      }
      if (p1UserId) this.gameMetrics.recordPlayerResult(p1Wins ? 'win' : 'loss');
      if (p2UserId) this.gameMetrics.recordPlayerResult(p1Wins ? 'loss' : 'win');

      // aggregate stats
      const winnerUserId = p1Wins ? p1UserId : p2UserId;
      const loserUserId = p1Wins ? p2UserId : p1UserId;

      if (winnerUserId && loserUserId) {
        await this.stats.ensure(winnerUserId, trx);
        await this.stats.ensure(loserUserId, trx);
        await this.stats.recordResult(winnerUserId, loserUserId, match.finishedAt!, trx);
      } else if (winnerUserId) {
        await this.stats.ensure(winnerUserId, trx);
        await this.stats.recordWin(winnerUserId, match.finishedAt!, trx);
      } else if (loserUserId) {
        await this.stats.ensure(loserUserId, trx);
        await this.stats.recordLoss(loserUserId, match.finishedAt!, trx);
      }

      // history
      const playedAt = match.finishedAt!;
      const p1Alias = match.player1.alias;
      const p2Alias = match.player2.alias;
      const matchTypeHistory: 'tournament' | 'pvp' | 'ai' = match.tournament ? 'tournament' : 'pvp';

      if (p1UserId) {
        await this.history.add(
          {
            userId: p1UserId,
            playedAt,
            opponentAlias: p2Alias ?? 'Unknown',
            opponentUserId: p2UserId ?? null,
            matchType: matchTypeHistory,
            result: p1Wins ? 'WIN' : 'LOSS',
            userScore: scoreP1,
            opponentScore: scoreP2,
            sourceMatchId: match.id,
            tournamentId: match.tournament?.id ?? null,
          },
          trx
        );
      }
      if (p2UserId) {
        await this.history.add(
          {
            userId: p2UserId,
            playedAt,
            opponentAlias: p1Alias ?? 'Unknown',
            opponentUserId: p1UserId ?? null,
            matchType: matchTypeHistory,
            result: p1Wins ? 'LOSS' : 'WIN',
            userScore: scoreP2,
            opponentScore: scoreP1,
            sourceMatchId: match.id,
            tournamentId: match.tournament?.id ?? null,
          },
          trx
        );
      }

      // points: PvP only (AI=none, tournament awarded at completion)
      const isTournament = !!match.tournament;
      const isAI = false;
      if (!isTournament && !isAI) {
        if (p1UserId) await this.points.awardPvPResult(p1UserId, match.id, p1Wins, trx);
        if (p2UserId) await this.points.awardPvPResult(p2UserId, match.id, !p1Wins, trx);
      }

      return {
        payload: {
          id: match.id,
          status: match.status,
          scoreP1: match.scoreP1,
          scoreP2: match.scoreP2,
          winnerParticipantId: match.winnerParticipant?.id ?? null,
          finishedAt: match.finishedAt?.toISOString() ?? null,
        },
        tournamentId: match.tournament?.id ?? null,
      };
    });

    // Finalize tournament after commit
    if (tournamentId) {
      await this.tournamentSvc.finalizeIfCompleted(tournamentId);
    }

    return payload;
  }
}
