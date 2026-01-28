import { EntityManager } from 'typeorm';
import { AppDataSource } from '../db.js';
import { UserStats } from '../models/user-stats.js';
import { UserStatsRepository } from '../repositories/user-stats.repository.js';
import { TournamentMatchRepository, UserMatchHistoryRow } from '../repositories/tournament-match.repository.js';
import { UserMatchHistoryItem, ILeaderboardEntry } from '../types/user-stats.types.js';
import { UserMatchHistoryRepository } from '../repositories/user-match-history.repository.js';
import { UserPointsLedgerRepository } from '../repositories/user-points-ledger.repository.js';

export class UserStatsService {
  private statsRepo = new UserStatsRepository();
  private matchRepo = new TournamentMatchRepository();
  private userHistoryRepo = new UserMatchHistoryRepository();
  private pointsRepo = new UserPointsLedgerRepository();

  async get(userId: number) {
    let stats = await this.statsRepo.findByUserId(userId);
    if (!stats) stats = await this.statsRepo.createForUser(userId);
    return stats;
  }

  // Added methods required by other services/controllers
  async ensure(userId: number, manager?: EntityManager) {
    const repo = (manager ?? AppDataSource.manager).getRepository(UserStats);
    let row = await repo.findOne({ where: { userId } });
    if (!row) {
      row = repo.create({ userId, wins: 0, losses: 0, lastPlayed: null });
      await repo.save(row);
    }
    return row;
  }

  async recordResult(winnerId: number, loserId: number, playedAt: Date, manager?: EntityManager) {
    await this.ensure(winnerId, manager);
    await this.ensure(loserId, manager);
    await this.recordWin(winnerId, playedAt, manager);
    await this.recordLoss(loserId, playedAt, manager);
  }

  async recordWin(userId: number, playedAt: Date, manager?: EntityManager) {
    const repo = (manager ?? AppDataSource.manager).getRepository(UserStats);
    await repo.increment({ userId }, 'wins', 1);
    await repo.update({ userId }, { lastPlayed: playedAt });
  }

  async recordLoss(userId: number, playedAt: Date, manager?: EntityManager) {
    const repo = (manager ?? AppDataSource.manager).getRepository(UserStats);
    await repo.increment({ userId }, 'losses', 1);
    await repo.update({ userId }, { lastPlayed: playedAt });
  }

  async incrementWin(userId: number) {
    await this.statsRepo.incrementWin(userId, new Date());
  }

  async incrementLoss(userId: number) {
    await this.statsRepo.incrementLoss(userId, new Date());
  }

  async getMatchHistory(userId: number): Promise<UserMatchHistoryItem[]> {
    console.log('getMatchHistory called for userId:', userId);
    try {
      const rows = await this.matchRepo.findUserHistoryRaw(userId);
      console.log('findUserHistoryRaw returned', rows.length, 'rows');
      const result = rows.map(r => this.mapRow(r, userId));
      console.log('getMatchHistory mapped', result.length, 'items');
      return result;
    } catch (error) {
      console.error('getMatchHistory error:', error);
      throw error;
    }
  }

  async getFullHistory(userId: number) {
    return this.userHistoryRepo.listByUser(userId);
  }

  async getStatsDetailed(userId: number) {
    const stats = (await this.statsRepo.findByUserId(userId)) ?? { wins: 0, losses: 0, lastPlayed: null };

    const rows = await this.matchRepo.findUserHistoryRaw(userId);

    const matches = rows.map((r) => {
      const isP1 = r.u1Id === userId;
      const userScore = isP1 ? r.scoreP1 : r.scoreP2;
      const opponentScore = isP1 ? r.scoreP2 : r.scoreP1;
      const opponentUsername =
        (isP1 ? r.u2Username : r.u1Username) ?? (isP1 ? r.p2Alias : r.p1Alias) ?? 'Unknown';
      const date =
        r.finishedAt ? new Date(r.finishedAt).toISOString()
        : r.startedAt ? new Date(r.startedAt).toISOString()
        : null;
      const result =
        r.status === 'FINISHED' && userScore != null && opponentScore != null
          ? userScore > opponentScore ? 'WIN' : 'LOSS'
          : 'PENDING';
      const score =
        userScore != null && opponentScore != null ? `${userScore}:${opponentScore}` : null;

      return { date, opponentUsername, score, result };
    });

    const totalPlayed = (stats.wins ?? 0) + (stats.losses ?? 0);
    const winRate = totalPlayed > 0 ? Math.round(((stats.wins ?? 0) / totalPlayed) * 100) : 0;

    return {
      wins: Number(stats.wins ?? 0),
      losses: Number(stats.losses ?? 0),
      games: rows.length,
      winRate,
      matches,
    };
  }

  async getLeaderboard(
    limit: number,
    offset: number,
    _sortBy?: unknown,
    _sortDir?: unknown
  ): Promise<Array<{ rank: number; userId: number; username: string; pointsTotal: number }>> {
    const rows = await this.pointsRepo.getLeaderboardByPoints(limit, offset);
    return rows.map((r, i) => ({
      rank: offset + i + 1,
      userId: r.userId,
      username: r.username,
      pointsTotal: r.pointsTotal,
    }));
  }

  async getUserRankByPoints(userId: number): Promise<{ userId: number; rank: number; pointsTotal: number }> {
    const [rank, pointsTotal] = await Promise.all([
      this.pointsRepo.getUserRankByPoints(userId),
      this.pointsRepo.getUserTotal(userId),
    ]);
    return { userId, rank, pointsTotal };
  }

  private mapRow(r: UserMatchHistoryRow, userId: number): UserMatchHistoryItem {
    const userIsP1 = r.u1Id === userId;
    const userParticipantId = userIsP1 ? r.p1Id : r.p2Id;
    const opponentParticipantId = userIsP1 ? r.p2Id : r.p1Id;
    const opponentAlias = userIsP1 ? r.p2Alias : r.p1Alias;
    const opponentUserId = userIsP1 ? r.u2Id : r.u1Id;
    const userScore = (userIsP1 ? r.scoreP1 : r.scoreP2) as number | null;
    const opponentScore = (userIsP1 ? r.scoreP2 : r.scoreP1) as number | null;

    let result: 'WIN' | 'LOSS' | 'PENDING';
    if (r.status !== 'FINISHED') result = 'PENDING';
    else result = r.winnerParticipantId === userParticipantId ? 'WIN' : 'LOSS';

    // Handle date fields that come as strings from getRawMany()
    const startedAt = (r.startedAt ? (typeof r.startedAt === 'string' ? new Date(r.startedAt) : r.startedAt).toISOString() : null) as string | null;
    const finishedAt = (r.finishedAt ? (typeof r.finishedAt === 'string' ? new Date(r.finishedAt) : r.finishedAt).toISOString() : null) as string | null;

    return {
      matchId: r.matchId,
      tournament: { id: r.tournamentId ?? 0, name: r.tournamentName ?? '' },
      orderIndex: r.orderIndex,
      status: r.status,
      startedAt,
      finishedAt,
      result,
      userParticipantId,
      userScore,
      opponentScore,
      opponent: {
        participantId: opponentParticipantId,
        alias: opponentAlias,
        userId: opponentUserId ?? null,
      },
    };
  }
}
