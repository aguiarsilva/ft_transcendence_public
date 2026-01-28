import { AppDataSource } from '../db.js';
import { TournamentMatch } from '../models/tournament-match.js';
import { Tournament } from '../models/tournament.js';
import { TournamentPlayer } from '../models/tournament-player.js';

const repo = AppDataSource.getRepository(TournamentMatch);

export type UserMatchHistoryRow = {
  matchId: number;
  orderIndex: number;
  status: string;
  scoreP1: number | null;
  scoreP2: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  winnerParticipantId: number | null;
  tournamentId: number | null;
  tournamentName: string | null;
  p1Id: number;
  p1Alias: string;
  p2Id: number;
  p2Alias: string;
  u1Id: number | null;
  u1Username?: string | null;
  u2Id: number | null;
  u2Username?: string | null;
};

export class TournamentMatchRepository {
  async createMatch(tournamentId: number, p1Id: number, p2Id: number, orderIndex: number) {
    const m = repo.create({
      tournament: ({ id: tournamentId } as Tournament),
      player1: ({ id: p1Id } as TournamentPlayer),
      player2: ({ id: p2Id } as TournamentPlayer),
      orderIndex,
      status: 'PENDING',
      scoreP1: 0,
      scoreP2: 0,
      winnerParticipant: null,
      startedAt: null,
      finishedAt: null,
    });
    return repo.save(m);
  }

  // PvP match: no tournament
  async createStandaloneMatch(p1Id: number, p2Id: number, orderIndex: number) {
    const m = repo.create({
      tournament: null,
      player1: ({ id: p1Id } as TournamentPlayer),
      player2: ({ id: p2Id } as TournamentPlayer),
      orderIndex,
      status: 'PENDING',
      scoreP1: 0,
      scoreP2: 0,
      winnerParticipant: null,
      startedAt: null,
      finishedAt: null,
    });
    return repo.save(m);
  }

  async bulkCreateMatches(items: Array<{ tournamentId: number; p1Id: number; p2Id: number; orderIndex: number }>) {
    const records = items.map((it) =>
      repo.create({
        tournament: ({ id: it.tournamentId } as Tournament),
        player1: ({ id: it.p1Id } as TournamentPlayer),
        player2: ({ id: it.p2Id } as TournamentPlayer),
        orderIndex: it.orderIndex,
        status: 'PENDING',
        scoreP1: 0,
        scoreP2: 0,
      })
    );
    return repo.save(records);
  }

  async listByTournament(tournamentId: number) {
    return repo.find({
      where: { tournament: { id: tournamentId } },
      relations: {
        player1: { user: true },
        player2: { user: true },
        winnerParticipant: true,
        tournament: true,
      },
      order: { orderIndex: 'ASC', id: 'ASC' },
    });
  }

  async findFirstPendingByTournament(tournamentId: number) {
    return repo.findOne({
      where: { tournament: { id: tournamentId }, status: 'PENDING' },
      relations: { player1: { user: true }, player2: { user: true } }, // load user
      order: { orderIndex: 'ASC', id: 'ASC' },
    });
  }

  async findById(id: number) {
    return repo.findOne({
      where: { id },
      relations: {
        tournament: true,
        player1: { user: true },
        player2: { user: true },
        winnerParticipant: true,
      },
    });
  }

  async hasFinishedMatches(tournamentId: number): Promise<boolean> {
    return repo
      .createQueryBuilder('m')
      .innerJoin('m.tournament', 't')
      .where('t.id = :tid', { tid: tournamentId })
      .andWhere('m.status = :status', { status: 'FINISHED' })
      .getExists();
  }

  async countPendingByTournament(tournamentId: number): Promise<number> {
    return repo.count({ where: { tournament: { id: tournamentId }, status: 'PENDING' } });
  }

  async deletePendingByTournament(tournamentId: number): Promise<void> {
    await repo
      .createQueryBuilder()
      .delete()
      .from(repo.metadata.tableName)
      .where('tournament_id = :tid', { tid: tournamentId })
      .andWhere('status != :finished', { finished: 'FINISHED' })
      .execute();
  }

  async save(entity: TournamentMatch) {
    return repo.save(entity);
  }

  async findUserHistoryRaw(userId: number): Promise<UserMatchHistoryRow[]> {
    console.log('findUserHistoryRaw called for userId:', userId);
    try {
      const query = repo
        .createQueryBuilder('m')
        .leftJoin('m.tournament', 't')
        .innerJoin('m.player1', 'p1')
        .leftJoin('p1.user', 'u1')
        .innerJoin('m.player2', 'p2')
        .leftJoin('p2.user', 'u2')
        .leftJoin('m.winnerParticipant', 'wp')
        .where('(u1.id = :uid OR u2.id = :uid)', { uid: userId })
        .andWhere('(u1.id IS NOT NULL OR u2.id IS NOT NULL)') // Ensure at least one player has a user
        .orderBy('m.finishedAt', 'DESC', 'NULLS LAST')
        .addOrderBy('m.id', 'DESC')
        .select('m.id', 'matchId')
        .addSelect('m.orderIndex', 'orderIndex')
        .addSelect('m.status', 'status')
        .addSelect('m.scoreP1', 'scoreP1')
        .addSelect('m.scoreP2', 'scoreP2')
        .addSelect('m.startedAt', 'startedAt')
        .addSelect('m.finishedAt', 'finishedAt')
        .addSelect('m.winner_participant_id', 'winnerParticipantId')
        .addSelect('t.id', 'tournamentId')
        .addSelect('t.name', 'tournamentName')
        .addSelect('p1.id', 'p1Id')
        .addSelect('p1.alias', 'p1Alias')
        .addSelect('u1.id', 'u1Id')
        .addSelect('u1.username', 'u1Username')
        .addSelect('p2.id', 'p2Id')
        .addSelect('p2.alias', 'p2Alias')
        .addSelect('u2.id', 'u2Id')
        .addSelect('u2.username', 'u2Username');
      
      console.log('SQL Query:', query.getQuery());
      const result = await query.getRawMany<UserMatchHistoryRow>();
      console.log('findUserHistoryRaw success, returned', result.length, 'rows');
      return result;
    } catch (error) {
      console.error('findUserHistoryRaw error:', error);
      throw error;
    }
  }
}
