import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './config.js';
import { User } from './models/user.js';
import { UserOAuth } from './models/user-oauth.js';
import { Friend } from './models/friend.js';
import { UserStats } from './models/user-stats.js';
import { Tournament } from './models/tournament.js';
import { TournamentPlayer } from './models/tournament-player.js';
import { TournamentMatch } from './models/tournament-match.js';
import { UserMatchHistory } from './models/user-match-history.js';
import { UserPointsLedger } from './models/user-points-ledger.js';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: config.db.database,
  entities: [
    User,
    UserOAuth,
    Friend,
    UserStats,
    Tournament,
    TournamentPlayer,
    TournamentMatch,
    UserMatchHistory,
    UserPointsLedger,
  ],
  synchronize: config.db.synchronize,
  logging: config.db.logging,
});

export async function initDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('📦 SQLite database connected');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
}
