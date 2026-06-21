import type {Room, RoomVisibility} from "../../features/rooms/types";
import type {GameView} from "../../games/tysiac/types/game";

export type PlayerIdentity = {
  id: string;
  name: string;
};

export type Ack<T> = {ok: true; data: T} | {ok: false; error: string};

export type CreateRoomPayload = {
  name: string;
  visibility: RoomVisibility;
  player: PlayerIdentity;
};

export type JoinRoomPayload = {
  code: string;
  player: PlayerIdentity;
  seat?: 1 | 2 | 3;
};

export type LeaveRoomPayload = {
  code: string;
  playerId: string;
};

export type StartRoomPayload = {
  code: string;
};

export type PlayCardPayload = {
  code: string;
  cardId: string;
};

export type GameCodePayload = {
  code: string;
};

export type BidPayload = {
  code: string;
  action: "raise" | "pass";
};

export type GiveCardPayload = {
  code: string;
  cardId: string;
  targetSeat: 1 | 2 | 3;
};

export interface ServerToClientEvents {
  "rooms:update": (rooms: Room[]) => void;
  "room:update": (room: Room) => void;
  "room:closed": () => void;
  "game:state": (view: GameView) => void;
}

export interface ClientToServerEvents {
  "lobby:subscribe": () => void;
  "lobby:unsubscribe": () => void;
  "room:create": (
    payload: CreateRoomPayload,
    ack: (response: Ack<Room>) => void
  ) => void;
  "room:join": (
    payload: JoinRoomPayload,
    ack: (response: Ack<Room>) => void
  ) => void;
  "room:subscribe": (
    code: string,
    ack: (response: Ack<Room>) => void
  ) => void;
  "room:leave": (payload: LeaveRoomPayload) => void;
  "room:start": (
    payload: StartRoomPayload,
    ack: (response: Ack<Room>) => void
  ) => void;
  "game:subscribe": (
    payload: GameCodePayload,
    ack: (response: Ack<GameView>) => void
  ) => void;
  "game:play": (
    payload: PlayCardPayload,
    ack: (response: Ack<true>) => void
  ) => void;
  "game:bid": (
    payload: BidPayload,
    ack: (response: Ack<true>) => void
  ) => void;
  "game:give": (
    payload: GiveCardPayload,
    ack: (response: Ack<true>) => void
  ) => void;
  "game:newRound": (
    payload: GameCodePayload,
    ack: (response: Ack<true>) => void
  ) => void;
}
