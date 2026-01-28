import { EntityManager } from 'typeorm';
import { UserPointsLedgerRepository } from '../repositories/user-points-ledger.repository.js';

type MatchType = 'tournament' | 'pvp' | 'ai';

export class PointsService {
  private ledger = new UserPointsLedgerRepository();

  private season = 'default';

  async awardPvPResult(userId: number, matchId: number, isWin: boolean, manager?: EntityManager) {
    const reason = isWin ? 'pvp_win' : 'pvp_loss';
    const already = await this.ledger.hasAwardForMatch(userId, matchId, reason);
    if (already) return;

    let points = isWin ? 6 : -2;

    if (!isWin) {
      const currentTotal = await this.ledger.getUserTotal(userId, manager);
      
      if (currentTotal + points < 0) {
        points = -currentTotal;
      }
    }

    await this.ledger.add({ userId, points, reason, sourceMatchId: matchId, season: this.season }, manager);
  }

  async awardTournamentPlacement(userId: number, tournamentId: number, place: 1 | 2, manager?: EntityManager) {
    const reason = place === 1 ? 'tournament_first' : 'tournament_second';
    const already = await this.ledger.hasAwardForTournament(userId, tournamentId, reason);
    if (already) return;

    const points = place === 1 ? 10 : 5;
    await this.ledger.add({ userId, points, reason, tournamentId, season: this.season }, manager);
  }
}
