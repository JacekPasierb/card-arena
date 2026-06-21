export type PlayerId = string;

export type RoomPlayer = {
  id: PlayerId;
  name: string;
  seat: 1 | 2 | 3;
  isHost: boolean;
  isConnected: boolean;
};

export type RoomStatus = "waiting" | "playing" | "finished";
export type RoomVisibility = "public" | "private";

export type Room = {
  id: string;
  code: string;
  name: string;
  gameType: "tysiac";
  status: RoomStatus;
  visibility: RoomVisibility;
  players: RoomPlayer[];
  createdAt: string;
};
