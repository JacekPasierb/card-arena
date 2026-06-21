export type Participant = {
  id: string;
  name: string;
};

export type TournamentStatus = "setup" | "active" | "finished";

export type Match = {
  id: string;
  round: number;
  position: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
};

export type Tournament = {
  id: string;
  name: string;
  gameType: "tysiac";
  status: TournamentStatus;
  createdAt: string;
  participants: Participant[];
  matches: Match[];
  championId: string | null;
};
