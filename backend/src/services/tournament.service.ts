import { AppError } from '../helpers/app-error.js';
import { HTTP_STATUS } from '../common/constants/http-status.js';
import { TournamentRepository } from '../repositories/tournament.repository.js';
import { TournamentPlayerRepository } from '../repositories/tournament-player.repository.js';
import { TournamentMatchRepository } from '../repositories/tournament-match.repository.js';
import { AppDataSource } from '../db.js';
import { User } from '../models/user.js';
import { GameMetricsService } from './game-metrics.service.js';
import { PointsService } from './points.service.js';

interface ParticipantDTO {
  id: number;
  alias: string;
  userId: number | null;
  registered: boolean;
  seed: number | null;
  createdAt: Date;
  tournamentId: number;
}

function toDTO(p: any): ParticipantDTO {
  return {
    id: p.id,
    alias: p.alias,
    userId: p.user?.id ?? null,
    registered: !!p.user,
    seed: p.seed ?? null,
    createdAt: p.createdAt,
    tournamentId: p.tournament?.id ?? p.tournamentId ?? 0,
  };
}

export class TournamentService {
  private tournaments = new TournamentRepository();
  private players = new TournamentPlayerRepository();
  private matches = new TournamentMatchRepository();
  private gameMetrics: GameMetricsService;
  private points = new PointsService();

  constructor(gameMetrics: GameMetricsService) {
    this.tournaments = new TournamentRepository();
    this.players = new TournamentPlayerRepository();
    this.matches = new TournamentMatchRepository();
    this.gameMetrics = gameMetrics;
  }

  async listTournaments() {
    return this.tournaments.listAll(true);
  }

  async createTournament(name: string, createdByUserId: number | null, maxPlayers?: number | null) {
    if (!name?.trim()) throw new AppError('Tournament name is required', HTTP_STATUS.BAD_REQUEST);

    // Enforce 3–8 players, integer
    if (maxPlayers == null) {
      throw new AppError('maxPlayers is required', HTTP_STATUS.BAD_REQUEST);
    }
    if (!Number.isInteger(maxPlayers) || maxPlayers < 3 || maxPlayers > 8) {
      throw new AppError('maxPlayers must be an integer between 3 and 8', HTTP_STATUS.BAD_REQUEST);
    }

    const t = await this.tournaments.create(name.trim(), createdByUserId, maxPlayers);

    // Auto-join creator as first participant
    if (createdByUserId) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: createdByUserId } });
      const alias = user?.username ?? `user-${createdByUserId}`;

      const already = await this.players.existsUserInTournament(t.id, createdByUserId);
      if (!already) {
        await this.players.createParticipant(t.id, alias, createdByUserId, 1);
      }
    }

    return t;
  }

  async cancelTournament(tournamentId: number, requesterUserId: number) {
    const t = await this.tournaments.findById(tournamentId, true);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);

    // Only the creator can cancel
    if (!t.createdByUser || t.createdByUser.id !== requesterUserId) {
      throw new AppError('Only the creator can cancel this tournament', HTTP_STATUS.FORBIDDEN);
    }

    // Allow cancel if REGISTERING or IN_PROGRESS (regardless of finished matches)
    if (t.status === 'FINISHED') {
      throw new AppError('Tournament cannot be canceled after it is finished', HTTP_STATUS.BAD_REQUEST);
    }

    // Optional: remove pending matches
    await this.matches.deletePendingByTournament(tournamentId);

    // Mark finished as canceled
    await this.tournaments.setStatus(tournamentId, 'FINISHED');
    await this.tournaments.setFinishedAt(tournamentId, new Date());

    const updated = await this.tournaments.findById(tournamentId);
    return updated!;
  }
  
  /**
   * Strict alias rules:
   * - Registered user: alias forced to their username (ignore provided alias).
   * - Guest: alias required; must not match any registered username (case-insensitive) and must be unique in tournament.
   */
  async addParticipant(tournamentId: number, rawAlias: string | undefined, userId?: number | null) {
    const t = await this.tournaments.findById(tournamentId);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
    if (t.status !== 'REGISTERING') {
      throw new AppError('Tournament is not open for registration', HTTP_STATUS.BAD_REQUEST);
    }

    // Enforce maxPlayers capacity
    if (t.maxPlayers != null) {
      const current = await this.players.listByTournament(tournamentId);
      if (current.length >= t.maxPlayers) {
        throw new AppError('Tournament is full', HTTP_STATUS.CONFLICT);
      }
    }

    const userRepo = AppDataSource.getRepository(User);

    let finalAlias: string;
    if (userId) {
      // Registered user path
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);

      finalAlias = user.username;

      // Duplicate same user?
      const existsUser = await this.players.existsUserInTournament(tournamentId, userId);
      if (existsUser) {
        throw new AppError('User already registered in this tournament', HTTP_STATUS.CONFLICT);
      }

      // Collision with existing participant alias (guest may have taken it)
      const dupAlias = await this.players.findByTournamentAndAlias(tournamentId, finalAlias);
      if (dupAlias) {
        throw new AppError('Alias already registered in this tournament', HTTP_STATUS.CONFLICT);
      }
    } else {
      // Guest path
      const a = rawAlias?.trim();
      if (!a) throw new AppError('Alias is required', HTTP_STATUS.BAD_REQUEST);

      // Check collision with registered usernames (case-insensitive)
      const collidesUser = await userRepo
        .createQueryBuilder('u')
        .where('LOWER(u.username) = LOWER(:alias)', { alias: a })
        .getExists();

      if (collidesUser) {
        throw new AppError('Alias reserved by a registered user, choose another', HTTP_STATUS.CONFLICT);
      }

      // Check duplicate alias inside tournament
      const dupAlias = await this.players.findByTournamentAndAlias(tournamentId, a);
      if (dupAlias) throw new AppError('Alias already registered in this tournament', HTTP_STATUS.CONFLICT);

      finalAlias = a;
    }

    const created = await this.players.createParticipant(tournamentId, finalAlias, userId ?? null, null);
    return toDTO(created);
  }

  async listParticipants(tournamentId: number): Promise<ParticipantDTO[]> {
    const t = await this.tournaments.findById(tournamentId);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
    const rows = await this.players.listByTournament(tournamentId);
    return rows.map(toDTO);
  }

  async getParticipationSummary(tournamentId: number) {
    const t = await this.tournaments.findById(tournamentId);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
    const joinedCount = await this.players.countByTournament(tournamentId);
    return {
      tournamentId,
      name: t.name,
      status: t.status,
      joinedCount,
      maxPlayers: t.maxPlayers ?? null,
    };
  }

  async seedRoundRobin(tournamentId: number, requesterUserId: number) {
    const t = await this.tournaments.findById(tournamentId, true);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);

    if (!t.createdByUser || t.createdByUser.id !== requesterUserId) {
      throw new AppError('Only the host can start the tournament', HTTP_STATUS.FORBIDDEN);
    }

    if (t.status !== 'REGISTERING') {
      throw new AppError('Tournament already started or finished', HTTP_STATUS.BAD_REQUEST);
    }

    if (await this.tournaments.hasAnyMatches(tournamentId)) {
      throw new AppError('Tournament already has matches', HTTP_STATUS.BAD_REQUEST);
    }

    const participants = await this.players.listByTournament(tournamentId);
    if (participants.length < 3) {
      throw new AppError('Need at least 3 participants to start', HTTP_STATUS.BAD_REQUEST);
    }

    const items: Array<{ tournamentId: number; p1Id: number; p2Id: number; orderIndex: number }> = [];
    let orderIndex = 1;
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        items.push({ tournamentId, p1Id: participants[i].id, p2Id: participants[j].id, orderIndex: orderIndex++ });
      }
    }

    await this.matches.bulkCreateMatches(items);
    await this.tournaments.setStatus(tournamentId, 'IN_PROGRESS');

    for (let i = 0; i < items.length; i++) this.gameMetrics.recordMatchStart('tournament');

    return { created: items.length };
  }

  // Helper: detect completion and award points (1st=10, 2nd=5)
  async finalizeIfCompleted(tournamentId: number) {
    const pending = await this.matches.countPendingByTournament(tournamentId);
    if (pending > 0) return false;

    // Build standings by wins from tournament matches
    const list = await this.matches.listByTournament(tournamentId);
    const winsByParticipant = new Map<number, number>();
    for (const m of list) {
      if (m.status !== 'FINISHED' || !m.winnerParticipant) continue;
      const winnerId = m.winnerParticipant.id;
      winsByParticipant.set(winnerId, (winsByParticipant.get(winnerId) ?? 0) + 1);
    }

    // Map participant -> userId
    const playerToUserId = new Map<number, number>();
    for (const m of list) {
      if (m.player1?.user?.id) playerToUserId.set(m.player1.id, m.player1.user.id);
      if (m.player2?.user?.id) playerToUserId.set(m.player2.id, m.player2.user.id);
    }

    // Sort by wins desc
    const ranked = Array.from(winsByParticipant.entries()).sort((a, b) => b[1] - a[1]);

    const firstParticipantId = ranked[0]?.[0] ?? null;
    const secondParticipantId = ranked[1]?.[0] ?? null;

    const t = await this.tournaments.findById(tournamentId);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);

    // Award points to userIds (if present)
    if (firstParticipantId) {
      const u1 = playerToUserId.get(firstParticipantId);
      if (u1) await this.points.awardTournamentPlacement(u1, tournamentId, 1);
    }
    if (secondParticipantId) {
      const u2 = playerToUserId.get(secondParticipantId);
      if (u2) await this.points.awardTournamentPlacement(u2, tournamentId, 2);
    }

    await this.tournaments.setStatus(tournamentId, 'FINISHED');
    await this.tournaments.setFinishedAt(tournamentId, new Date());
    return true;
  }

  async getTournament(tournamentId: number) {
    const t = await this.tournaments.findById(tournamentId);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
    return t;
  }

  async getNextMatch(tournamentId: number) {
    const t = await this.tournaments.findById(tournamentId);
    if (!t) throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
    return this.matches.findFirstPendingByTournament(tournamentId);
  }

  async getNextOrWinners(tournamentId: number) {
    const next = await this.getNextMatch(tournamentId);
    if (next) {
      return {
        completed: false,
        nextMatch: {
          id: next.id,
          orderIndex: next.orderIndex,
          status: next.status,
          player1: next.player1
            ? { id: next.player1.id, alias: next.player1.alias, userId: next.player1.user?.id ?? null }
            : null,
          player2: next.player2
            ? { id: next.player2.id, alias: next.player2.alias, userId: next.player2.user?.id ?? null }
            : null,
        },
        tournament: { id: tournamentId },
      };
    }
    return this.computeFinalWinners(tournamentId);
  }

  async computeFinalWinners(tournamentId: number) {
    const t = await this.getTournament(tournamentId);
    const matches = await this.matches.listByTournament(tournamentId);

    const winsByParticipant = new Map<number, number>();
    const playerInfo = new Map<number, { userId: number | null; alias: string | null }>();

    for (const mm of matches) {
      if (mm.player1)
        playerInfo.set(mm.player1.id, {
          userId: mm.player1.user?.id ?? null,
          alias: mm.player1.alias ?? null,
        });
      if (mm.player2)
        playerInfo.set(mm.player2.id, {
          userId: mm.player2.user?.id ?? null,
          alias: mm.player2.alias ?? null,
        });
      if (mm.status === 'FINISHED' && mm.winnerParticipant) {
        const w = mm.winnerParticipant.id;
        winsByParticipant.set(w, (winsByParticipant.get(w) ?? 0) + 1);
      }
    }

    const ranked = Array.from(winsByParticipant.entries()).sort((a, b) => b[1] - a[1]);
    const winners: Array<{ place: number; userId: number | null; alias: string | null }> = [];

    const first = ranked[0]?.[0];
    const second = ranked[1]?.[0];

    if (first !== undefined) {
      const info = playerInfo.get(first)!;
      winners.push({ place: 1, userId: info.userId, alias: info.alias });
    }
    if (second !== undefined) {
      const info = playerInfo.get(second)!;
      winners.push({ place: 2, userId: info.userId, alias: info.alias });
    }

    return {
      completed: true,
      nextMatch: null,
      tournament: {
        id: t.id,
        name: t.name,
        status: t.status,
        finishedAt: t.finishedAt ?? null,
      },
      winners,
    };
  }
}
