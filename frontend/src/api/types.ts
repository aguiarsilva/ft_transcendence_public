export type LoginBody = { email: string; password: string };
export type Login2FABody = { email: string; token: string };
export type RegisterBody = { email: string; username: string; password: string; firstName: string; lastName: string };
export type ChangePasswordBody = { currentPassword: string; newPassword: string };

export type User = {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  is2FAEnabled?: boolean;
};

export type AuthResponse = { token: string; user: User };
export type Login2FAResponse = { twoFARequired: true; user: User };

export type TwoFASetupResponse = { otpauthUrl: string; qrDataURL: string };

export type SendFriendRequestBody = {
  friendId?: number;
  username?: string;
};
export type Friend = {
  id: number;
  userId: number;
  friendId: number;
  status: 'pending' | 'accepted' | 'declined';
};

export type ListFriendsResponse = { friends: Friend[] };

export type LeaderboardEntry = {
  rank: number;
  userId: number;
  username: string;
  pointsTotal: number;
};

export type UserProfileWithStatsResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string | null;
  };
  stats: {
    wins: number;
    losses: number;
    totalMatches: number;
    lastPlayed: string | null;
  };
};

export type UserRankByPoints = {
  userId: number;
  rank: number;
  pointsTotal: number;
};

export type TournamentStatus = 'REGISTERING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';

export type Tournament = {
  id: number;
  name: string;
  status: TournamentStatus;
  maxPlayers: number | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdByUser?: {
    id: number;
    username: string;
  } | null;
};

export type TournamentParticipantDTO = {
  id: number;
  tournamentId: number;
  alias: string;
  userId: number | null;
  registered: boolean;
  seed?: number | null;
  createdAt?: string;
};

export type TournamentParticipantsSummary = {
  tournamentId: number;
  name: string;
  status: TournamentStatus;
  joinedCount: number;
  maxPlayers: number | null;
};

export type TournamentNextPlayer = {
  id: number;
  alias: string;
  userId: number | null;
} | null;

export type TournamentNextMatch = {
  id: number;
  orderIndex: number;
  status: string;
  player1: TournamentNextPlayer;
  player2: TournamentNextPlayer;
} | null;

export type TournamentWinner = {
  place: number;
  userId: number | null;
  alias: string | null;
};

export type TournamentNextOrWinners = {
  completed: boolean;
  nextMatch: TournamentNextMatch;
  tournament: {
    id: number;
    name: string;
    status: string;
    finishedAt: string | null;
  };
  winners: TournamentWinner[];
};

export type UserStats = {
  wins: number;
  losses: number;
  totalMatches: number;
  lastPlayed: string | null;
};

export type MatchHistoryItem = {
  date: string | null;
  opponentAlias: string;
  opponentUsername: string;
  userScore: number | null;
  opponentScore: number | null;
  result: 'WIN' | 'LOSS' | 'PENDING';
};

export type UserStatsDetailed = {
  wins: number;
  losses: number;
  games: number;
  winRate: number;
  matches: MatchHistoryItem[];
};
