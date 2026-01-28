export interface IUserStats {
  userId: number;
  wins: number;
  losses: number;
  lastPlayed: string | null;
  updatedAt: string;
}

export interface IUserStatsPublic {
  wins: number;
  losses: number;
  totalMatches: number;
  lastPlayed: string | null;
}

export interface IUserProfileWithStats {
  user: {
    id: number;
    username: string;
    email: string;
  };
  stats: IUserStatsPublic;
}

export interface IMatchResultBody {
  winnerId: number;
  loserId: number;
}

export interface IMatchResultReply {
  message: string;
  winnerId: number;
  loserId: number;
  playedAt: string;
}

export interface ILeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  lastPlayed: string | null;
}

export interface UserMatchHistoryItem {
  matchId: number;
  tournament: { id: number; name: string };
  orderIndex: number;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  result: 'WIN' | 'LOSS' | 'PENDING';
  userParticipantId: number;
  userScore: number | null;
  opponentScore: number | null;
  opponent: {
    participantId: number;
    alias: string;
    userId: number | null;
  };
}

export interface IUserStatsMatchSummary {
  date: string | null;
  opponentUsername: string;
  score: string | null;
  result: 'WIN' | 'LOSS' | 'PENDING';
}

export interface IUserStatsDetailed {
  wins: number;
  losses: number;
  games: number;
  winRate: number;
  matches: IUserStatsMatchSummary[];
}