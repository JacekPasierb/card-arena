import {randomUUID} from "node:crypto";
import type {Room, RoomVisibility} from "../src/features/rooms/types";
import type {PlayerIdentity} from "../src/lib/realtime/events";

const rooms = new Map<string, Room>();

function generateCode(): string {
  let code = "";
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (rooms.has(code));
  return code;
}

export function listPublicRooms(): Room[] {
  return [...rooms.values()].filter(
    (room) => room.visibility === "public" && room.status === "waiting"
  );
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function createRoom(options: {
  name: string;
  visibility: RoomVisibility;
  player: PlayerIdentity;
}): Room {
  const code = generateCode();

  const room: Room = {
    id: randomUUID(),
    code,
    name: options.name.trim() || "Nowy stół",
    gameType: "tysiac",
    status: "waiting",
    visibility: options.visibility,
    createdAt: new Date().toISOString(),
    players: [
      {
        id: options.player.id,
        name: options.player.name.trim() || "Gracz",
        seat: 1,
        isHost: true,
        isConnected: true,
      },
    ],
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(options: {
  code: string;
  player: PlayerIdentity;
  seat?: 1 | 2 | 3;
}): Room {
  const room = getRoom(options.code);

  if (!room) throw new Error("Nie znaleziono stołu o tym kodzie.");
  if (room.status !== "waiting") throw new Error("Gra już się rozpoczęła.");

  const existing = room.players.find(
    (player) => player.id === options.player.id
  );

  if (existing) {
    existing.isConnected = true;
    return room;
  }

  if (room.players.length >= 3) throw new Error("Stół jest pełny.");

  const takenSeats = room.players.map((player) => player.seat);
  const seat =
    options.seat ??
    ([1, 2, 3].find(
      (value) => !takenSeats.includes(value as 1 | 2 | 3)
    ) as 1 | 2 | 3 | undefined);

  if (!seat) throw new Error("Brak wolnych miejsc.");
  if (takenSeats.includes(seat)) throw new Error("To miejsce jest zajęte.");

  room.players.push({
    id: options.player.id,
    name: options.player.name.trim() || "Gracz",
    seat,
    isHost: false,
    isConnected: true,
  });

  return room;
}

export function startRoom(code: string): Room {
  const room = getRoom(code);

  if (!room) throw new Error("Nie znaleziono stołu.");

  room.status = "playing";
  return room;
}

/**
 * Usuwa gracza ze sto\u0142u. Zwraca zaktualizowany pok\u00f3j lub null,
 * je\u015bli sta\u0142 si\u0119 pusty i zosta\u0142 zamkni\u0119ty.
 */
export function leaveRoom(code: string, playerId: string): Room | null {
  const room = getRoom(code);

  if (!room) return null;

  room.players = room.players.filter((player) => player.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(room.code);
    return null;
  }

  if (!room.players.some((player) => player.isHost)) {
    room.players[0].isHost = true;
  }

  return room;
}

/** Obs\u0142uga roz\u0142\u0105czenia: usuwa gracza ze wszystkich sto\u0142\u00f3w. */
export function removePlayerEverywhere(playerId: string): string[] {
  const affected: string[] = [];

  for (const room of [...rooms.values()]) {
    if (!room.players.some((player) => player.id === playerId)) continue;

    affected.push(room.code);
    leaveRoom(room.code, playerId);
  }

  return affected;
}
