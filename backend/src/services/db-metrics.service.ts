import { AppDataSource } from '../db.js';
import { User } from '../models/user.js';
import { Tournament } from '../models/tournament.js';
import { TournamentMatch } from '../models/tournament-match.js';
import { UserStats } from '../models/user-stats.js';
import { Friend } from '../models/friend.js';

export class DbMetricsService {

	async getTotalUsers(): Promise<number> {
		return await AppDataSource.getRepository(User).count();
	}

	async getActiveUsers(): Promise<number> {
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		return await AppDataSource.getRepository(UserStats)
			.createQueryBuilder('stats')
			.where('stats.last_played >= :oneDayAgo', { oneDayAgo })
			.getCount();
	}

	async getTotalMatches(): Promise<number> {
		const result = await AppDataSource.getRepository(UserStats)
			.createQueryBuilder('stats')
			.select('SUM(stats.wins + stats.losses)', 'total')
			.getRawOne();
		return Math.floor(parseFloat(result?.total || '0') / 2);
		
	}

	async getOngoingMatches(): Promise<number> {
		return await AppDataSource.getRepository(TournamentMatch)
			.createQueryBuilder('match')
			.where('match.winner_participant_id IS NULL')
			.andWhere('match.startedAt IS NOT NULL')
			.getCount();
	}

	async getTotalTournaments(): Promise<number> {
		return await AppDataSource.getRepository(Tournament).count();
	}

	async getActiveTournaments(): Promise<number> {
		return await AppDataSource.getRepository(Tournament)
			.createQueryBuilder('tournament')
			.where('tournament.status = :status', { status: 'active' })
			.getCount();
	}

	async getTotalFriendships(): Promise<number> {
		return await AppDataSource.getRepository(Friend)
			.createQueryBuilder('friend')
			.where('friend.accepted = :accepted', { accepted: true })
			.getCount();
	}

	async getPendingFriendRequests(): Promise<number> {
		return await AppDataSource.getRepository(Friend)
			.createQueryBuilder('friend')
			.where('friend.accepted = :accepted', { accepted: false })
			.getCount();
	}

	async getAverageMatchesPerUser(): Promise<number> {
		const stats = await AppDataSource.getRepository(UserStats)
			.createQueryBuilder('stats')
			.select('AVG(stats.wins + stats.losses)', 'avg')
			.getRawOne();

		return parseFloat(stats?.avg || '0');
	}

	async getAllMetrics() {
		const [
			totalUsers,
			activeUsers,
			totalMatches,
			ongoingMatches,
			totalTournaments,
			activeTournaments,
			totalFriendships,
			pendingFriendRequests,
			avgMatchesPerUser,
		] = await Promise.all([
			this.getTotalUsers(),
			this.getActiveUsers(),
			this.getTotalMatches(),
			this.getOngoingMatches(),
			this.getTotalTournaments(),
			this.getActiveTournaments(),
			this.getTotalFriendships(),
			this.getPendingFriendRequests(),
			this.getAverageMatchesPerUser(),
		]);

		return {
			totalUsers,
			activeUsers,
			totalMatches,
			ongoingMatches,
			totalTournaments,
			activeTournaments,
			totalFriendships,
			pendingFriendRequests,
			avgMatchesPerUser,
		};
	}

}
