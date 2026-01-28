export interface CreateTournamentBody {
  name: string;
  maxPlayers: number;
}

export interface RegisterParticipantBody {
  alias?: string;
}

export interface TournamentIdParam {
  id: number;
}