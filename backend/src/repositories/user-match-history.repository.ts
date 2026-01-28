import { AppDataSource } from '../db.js';
import { UserMatchHistory } from '../models/user-match-history.js';
import { EntityManager } from 'typeorm';

export class UserMatchHistoryRepository {
  private repo = AppDataSource.getRepository(UserMatchHistory);

  async add(entry: Partial<UserMatchHistory>, manager?: EntityManager) {
    const r = (manager ?? this.repo.manager).getRepository(UserMatchHistory);
    const row = r.create(entry);
    return r.save(row);
  }

  async listByUser(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { playedAt: 'DESC', id: 'DESC' },
    });
  }
}
