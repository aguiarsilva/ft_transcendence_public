import { AppDataSource } from '../db.js';
import { Tournament } from '../models/tournament.js';
import { User } from '../models/user.js';

const repo = AppDataSource.getRepository(Tournament);

export class TournamentRepository {
  async create(name: string, createdByUserId: number | null, maxPlayers?: number | null) {
    const t = repo.create({
      name,
      maxPlayers: maxPlayers ?? null,
      status: 'REGISTERING',
      createdByUser: createdByUserId ? ({ id: createdByUserId } as User) : null,
    });
    return repo.save(t);
  }

  async listAll(withCreator = false) {
    return repo.find({
      relations: withCreator ? ({ createdByUser: true } as any) : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number, withRelations = false) {
    return repo.findOne({
      where: { id },
      relations: withRelations ? { participants: true, matches: true, createdByUser: true } : undefined,
      order: withRelations ? ({ matches: { orderIndex: 'ASC' } } as any) : undefined,
    });
  }

  async hasAnyMatches(id: number) {
    const t = await repo.findOne({ where: { id }, relations: { matches: true } });
    return !!t && t.matches.length > 0;
  }

  async setStatus(id: number, status: 'REGISTERING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED') {
    await repo.update({ id }, { status });
  }

  async setFinishedAt(id: number, finishedAt: Date | null) {
    await repo.update({ id }, { finishedAt });
  }
}
