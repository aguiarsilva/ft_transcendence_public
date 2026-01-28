import type {
  LoginBody,
  Login2FABody,
  RegisterBody,
  ChangePasswordBody,
  AuthResponse,
  Login2FAResponse,
  TwoFASetupResponse,
  SendFriendRequestBody,
  ListFriendsResponse,
  User,
  LeaderboardEntry,
  UserProfileWithStatsResponse,
  UserRankByPoints,
  Tournament,
  TournamentParticipantDTO,
  TournamentParticipantsSummary,
  TournamentNextMatch,
  TournamentNextOrWinners,
  UserStats,
  UserStatsDetailed,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://localhost:3001/api/v1';

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const cleanPath = path.replace(/^\/+/, "");
  const url = `${API_BASE.replace(/\/$/, "")}/${cleanPath}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
    ...authHeader(),
  };
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch { }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// Resolve relative avatar paths to absolute
export function resolveAvatarUrl(avatarPath?: string | null): string {
  const apiOrigin = API_BASE.replace(/\/api\/v1$/, '/');
  if (!avatarPath) return new URL('/avatars/avatar.jpg', apiOrigin).href;
  try {
    const u = new URL(avatarPath);
    return u.href; // already absolute
  } catch {
    return new URL(avatarPath, apiOrigin).href;
  }
}

export const api = {
  // Auth
  async login(body: LoginBody) {
    return http<AuthResponse | Login2FAResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },

  // Leaderboard
  async getLeaderboard(limit = 25, offset = 0): Promise<LeaderboardEntry[]> {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return http<LeaderboardEntry[]>(`/leaderboard?${qs.toString()}`, { method: 'GET' });
  },

  async getUserProfile(userId: number) {
    return http<any>(`/users/${userId}/profile`, { method: 'GET' });
  },

  async getUserRank(userId: number) {
    return http<any>(`/leaderboard/rank/${userId}`, { method: 'GET' });
  },

  async getUserMatchHistory(userId: number) {
    return http<any>(`/stats/users/${userId}/matches`, { method: 'GET' });
  },

  async getUserStats(userId: number): Promise<UserStats> {
    return http<UserStats>(`/stats/users/${userId}/`, { method: 'GET' });
  },

  async getUserStatsDetailed(userId: number): Promise<UserStatsDetailed> {
    return http<UserStatsDetailed>(`/stats/users/${userId}/detailed`, { method: 'GET' });
  },
  
  async login2fa(body: Login2FABody) {
    return http<AuthResponse>('/auth/login/2fa', { method: 'POST', body: JSON.stringify(body) });
  },
  async oauthGoogle(googleIdToken: string) {
    return http<AuthResponse>('/auth/oauth/google', { method: 'POST', body: JSON.stringify({ token: googleIdToken }) });
  },

  // Users
  async register(body: RegisterBody) {
    return http<{ user: User }>('/users', { method: 'POST', body: JSON.stringify(body) });
  },
  async changePassword(body: ChangePasswordBody) {
    return http<{ message: string }>('/users/change-password', { method: 'POST', body: JSON.stringify(body) });
  },
  async me() {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error('No token');
    let userId: string | undefined;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch {
      // fallback to session if token parsing fails
      const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      userId = String(sessionUser.id);
    }
    if (!userId) throw new Error('Unable to determine user ID');
    return http<{ user: User }>(`/users/${userId}/profile`, { method: 'GET' });
  },
  async updateProfile(data: { firstName?: string; lastName?: string; username?: string; email?: string }) {
    return http<{ user: User }>('/users', { method: 'PATCH', body: JSON.stringify(data) });
  },

  // 2FA
  async twofaSetup() {
    return http<TwoFASetupResponse>('/2fa/setup', { method: 'POST', body: JSON.stringify({}) });
  },
  async twofaVerify(token: string) {
    return http<{ message: string }>('/2fa/verify', { method: 'POST', body: JSON.stringify({ token }) });
  },
  async twofaDisable(token: string) {
    return http<{ message: string }>('/2fa/disable', { method: 'POST', body: JSON.stringify({ token }) });
  },

  // Avatar upload
  async uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);

    const res = await fetch(`${API_BASE}/users/avatar`, {
      method: 'POST',
      body: fd,
      headers: authHeader() as HeadersInit,
      credentials: 'include',
    });

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data?.message) msg = data.message;
      } catch { }
      throw new Error(msg);
    }

    return res.json() as Promise<{ message: string; user: User }>;
  },

  // Friends
  async sendFriendRequest(body: SendFriendRequestBody) {
    console.log("DEBUG: body ", body);
    return http<unknown>('friends/friends', { method: 'POST', body: JSON.stringify(body) });
  },

  async listFriends() {
    return http<ListFriendsResponse>('friends/friends', { method: 'GET' });
  },

  async acceptFriendRequest(id: number) {
    return http(`friends/friends/${id}/accept`, { method: 'POST', body: "{}" });
  },

  async declineFriendRequest(id: number) {
    return http(`friends/friends/${id}/decline`, { method: 'POST', body: "{}" });
  },

  async deleteFriend(id: number) {
    return http(`friends/friends/${id}`, { method: 'DELETE' });
  },

  // Tournaments
  async getTournaments(): Promise<Tournament[]> {
    return http<Tournament[]>('/tournaments', { method: 'GET' });
  },

  async createTournament(data: { name: string; maxPlayers: number }): Promise<Tournament> {
    return http<Tournament>('/tournaments', { method: 'POST', body: JSON.stringify(data) });
  },

  async getTournament(id: number): Promise<Tournament> {
    return http<Tournament>(`/tournaments/${id}`, { method: 'GET' });
  },

  async registerTournamentParticipant(id: number, alias?: string): Promise<TournamentParticipantDTO> {
    return http<TournamentParticipantDTO>(
      `/tournaments/${id}/participants`,
      { method: 'POST', body: JSON.stringify(alias ? { alias } : {}) }
    );
  },

  async listTournamentParticipants(id: number): Promise<TournamentParticipantDTO[]> {
    return http<TournamentParticipantDTO[]>(`/tournaments/${id}/participants`, { method: 'GET' });
  },

  async getTournamentParticipantsSummary(id: number): Promise<TournamentParticipantsSummary> {
    return http<TournamentParticipantsSummary>(`/tournaments/${id}/participants/summary`, { method: 'GET' });
  },

  async seedTournament(id: number): Promise<{ created: number }> {
    return http<{ created: number }>(`/tournaments/${id}/seed`, { method: 'POST', body: JSON.stringify({}) });
  },

  async cancelTournament(id: number): Promise<{ id: number; status: string; finishedAt: string | null }> {
    return http<{ id: number; status: string; finishedAt: string | null }>(
      `/tournaments/${id}/cancel`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  },

  async getTournamentNextMatch(id: number): Promise<TournamentNextOrWinners> {
    return http<TournamentNextOrWinners>(`/tournaments/${id}/next`, { method: 'GET' });
  },

  // Presence
  async getUserPresencePublic(userId: number) {
    return http<any>(`/presence/user/${userId}`, { method: 'GET' });
  },

  // PvP matches

  async createPvPMatch(data: {
    opponentAlias?: string;
    opponentUsername?: string;
    opponentUserId?: number;
  }): Promise<any> {
    return http('/matches/pvp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitMatchResult(matchId: number, scoreP1: number, scoreP2: number) {
    return http(`/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify({ scoreP1, scoreP2 }),
    });
  },

  async getTournamentBracket(id: number): Promise<any> {
    return http<any>(`/tournaments/${id}/next`, { method: 'GET' });
}

};

