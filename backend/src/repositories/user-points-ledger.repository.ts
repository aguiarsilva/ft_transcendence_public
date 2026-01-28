import { AppDataSource } from '../db.js';
import { EntityManager } from 'typeorm';
import { UserPointsLedger } from '../models/user-points-ledger.js';
import { User } from '../models/user.js';

export class UserPointsLedgerRepository {
  private repo = AppDataSource.getRepository(UserPointsLedger);

  async add(entry: Partial<UserPointsLedger>, manager?: EntityManager) {
    const r = (manager ?? this.repo.manager).getRepository(UserPointsLedger);
    const row = r.create(entry);
    return r.save(row);
  }

  async hasAwardForMatch(userId: number, sourceMatchId: number, reason: string) {
    return this.repo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .andWhere('l.sourceMatchId = :mid', { mid: sourceMatchId })
      .andWhere('l.reason = :reason', { reason })
      .getExists();
  }

  async hasAwardForTournament(userId: number, tournamentId: number, reason: string) {
    return this.repo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .andWhere('l.tournamentId = :tid', { tid: tournamentId })
      .andWhere('l.reason = :reason', { reason })
      .getExists();
  }

 async getUserTotal(userId: number, manager?: EntityManager): Promise<number> {
    const r = (manager ?? this.repo.manager).getRepository(UserPointsLedger);
    const row = await r
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .select('COALESCE(SUM(l.points), 0)', 'sum')
      .getRawOne<{ sum?: string | number }>();

    return Number(row?.sum ?? 0);
  }

  async getLeaderboardByPoints(limit: number, offset: number) {
    const rows = await this.repo
      .createQueryBuilder('l')
      .innerJoin(User, 'u', 'u.id = l.userId')
      .select('l.userId', 'userId')
      .addSelect('u.username', 'username')
      .addSelect('COALESCE(SUM(l.points), 0)', 'pointsTotal')
      .groupBy('l.userId')
      .addGroupBy('u.username')
      .orderBy('pointsTotal', 'DESC')
      .addOrderBy('u.username', 'ASC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ userId: string | number; username: string; pointsTotal: string | number }>();

    return rows.map(r => ({
      userId: Number(r.userId),
      username: r.username,
      pointsTotal: Number(r.pointsTotal ?? 0),
    }));
  }

  async getUserRankByPoints(userId: number): Promise<number> {
    const userPoints = await this.getUserTotal(userId);

    const totalsQb = this.repo
      .createQueryBuilder('l2')
      .select('COALESCE(SUM(l2.points), 0)', 'pointsTotal')
      .groupBy('l2.userId')
      .having('COALESCE(SUM(l2.points), 0) > :userPoints', { userPoints });

    const result = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'cnt')
      .from('(' + totalsQb.getQuery() + ')', 't')
      .setParameters(totalsQb.getParameters())
      .getRawOne<{ cnt?: string | number }>();

    const { cnt } = result || { cnt: 0 };

    return Number(cnt ?? 0) + 1;
  }
}
