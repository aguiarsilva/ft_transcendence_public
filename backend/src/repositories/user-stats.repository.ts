import { AppDataSource } from '../db.js';
import { UserStats } from '../models/user-stats.js';
import { User } from '../models/user.js';

const repo = AppDataSource.getRepository(UserStats);

type SortKey = 'wins' | 'losses' | 'winRate' | 'lastPlayed';
const allowedSortColumns: Record<SortKey, string> = {
  wins: 's.wins',
  losses: 's.losses',
  winRate: 'winRate',
  lastPlayed: 's.lastPlayed',
};

export class UserStatsRepository {
  private repo = AppDataSource.getRepository(UserStats);
  async findByUserId(userId: number) {
    return repo.findOne({ where: { userId } });
  }

  async createForUser(userId: number) {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    const stats = repo.create({ userId, wins: 0, losses: 0, lastPlayed: null });
    return repo.save(stats);
  }

  async incrementWin(userId: number, playedAt: Date) {
    await repo
      .createQueryBuilder()
      .update(UserStats)
      .set({
        wins: () => 'wins + 1',
        lastPlayed: playedAt,
      })
      .where('user_id = :userId', { userId })
      .execute();
  }

  async incrementLoss(userId: number, playedAt: Date) {
    await repo
      .createQueryBuilder()
      .update(UserStats)
      .set({
        losses: () => 'losses + 1',
        lastPlayed: playedAt,
      })
      .where('user_id = :userId', { userId })
      .execute();
  }

   async findLeaderboard(
    limit: number,
    offset: number,
    sortBy: SortKey = 'wins',
    sortDir: 'ASC' | 'DESC' = 'DESC'
  ) {
    const sortColumn = allowedSortColumns[sortBy] ?? allowedSortColumns.wins;
    const dir = sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.repo
      .createQueryBuilder('s')
      .innerJoin(User, 'u', 'u.id = s.userId')
      .select([
        's.userId AS userId',
        'u.username AS username',
        's.wins AS wins',
        's.losses AS losses',
        '(s.wins + s.losses) AS totalMatches',
        `CASE WHEN (s.wins + s.losses)=0 THEN 0 ELSE (CAST(s.wins AS FLOAT)/(s.wins + s.losses)) END AS winRate`,
        's.lastPlayed AS lastPlayed',
      ])
      .orderBy(sortColumn, dir);

    if (sortColumn !== 's.wins') qb.addOrderBy('s.wins', 'DESC');
    if (sortColumn !== 'winRate') qb.addOrderBy('winRate', 'DESC');
    qb.addOrderBy('s.lastPlayed', 'DESC').addOrderBy('u.username', 'ASC');

    return qb.limit(limit).offset(offset).getRawMany();
  }
}
