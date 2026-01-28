import { AppDataSource } from '../db.js';
import { TournamentPlayer } from '../models/tournament-player.js';
import { Tournament } from '../models/tournament.js';
import { User } from '../models/user.js';
import { DeepPartial } from 'typeorm';

const repo = AppDataSource.getRepository(TournamentPlayer);

export class TournamentPlayerRepository {
  async listByTournament(tournamentId: number) {
    return repo.find({
      where: { tournament: { id: tournamentId } },
      relations: { user: true },
      order: { id: 'ASC' },
    });
  }

  async findById(id: number) {
    return repo.findOne({ where: { id }, relations: { tournament: true, user: true } });
  }

  async findByTournamentAndAlias(tournamentId: number, alias: string) {
    return repo.findOne({
      where: { tournament: { id: tournamentId }, alias },
      relations: { user: true, tournament: true },
    });
  }

  async countByTournament(tournamentId: number): Promise<number> {
    return repo.count({ where: { tournament: { id: tournamentId } } });
  }

  async existsUserInTournament(tournamentId: number, userId: number) {
    const count = await repo.count({
      where: { tournament: { id: tournamentId }, user: { id: userId } },
    });
    return count > 0;
  }

  async createParticipant(tournamentId: number, alias: string, userId?: number | null, seed?: number | null) {
    const p = repo.create({
      alias,
      seed: seed ?? null,
      tournament: { id: tournamentId } as Tournament,
      user: userId ? ({ id: userId } as User) : null,
    });
    const saved = await repo.save(p);
    return this.findById(saved.id);
  }

  // PvP participant
  async createStandaloneParticipant(alias: string, userId?: number | null) {
    const p: DeepPartial<TournamentPlayer> = {
      alias,
      seed: null,
      tournament: null,
      user: userId ? ({ id: userId } as User) : null,
    };

    const saved = await repo.save(p);
    const full = await this.findById(saved.id as number);
    return full ?? (saved as TournamentPlayer);
  }
}
