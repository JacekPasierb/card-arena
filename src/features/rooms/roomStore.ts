"use client";

import {useSyncExternalStore} from "react";
import type {Room} from "./types";

/**
 * Tymczasowy magazyn sto\u0142\u00f3w po stronie klienta.
 *
 * Trzyma stan w pami\u0119ci + localStorage, dzi\u0119ki czemu dane przetrwaj\u0105
 * nawigacj\u0119 mi\u0119dzy stronami w obr\u0119bie jednej przegl\u0105darki. To celowo cienka
 * warstwa: w kolejnym kroku podmienimy j\u0105 na realny backend (Socket.IO),
 * zachowuj\u0105c to samo API (getRooms / createRoom / joinRoom / subscribe).
 */

const STORAGE_KEY = "card-arena:rooms";

const seedRooms: Room[] = [
  {
    id: "seed-room-1",
    code: "ABC123",
    name: "Stół Janka",
    gameType: "tysiac",
    status: "waiting",
    visibility: "public",
    createdAt: new Date().toISOString(),
    players: [
      {id: "seed-1", name: "Janek", seat: 1, isHost: true, isConnected: true},
    ],
  },
  {
    id: "seed-room-2",
    code: "KARTY7",
    name: "Wieczorny Tysiąc",
    gameType: "tysiac",
    status: "waiting",
    visibility: "public",
    createdAt: new Date().toISOString(),
    players: [
      {id: "seed-2", name: "Marek", seat: 1, isHost: true, isConnected: true},
      {id: "seed-3", name: "Ola", seat: 2, isHost: false, isConnected: true},
    ],
  },
];

let rooms: Room[] = seedRooms;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function persist() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // localStorage mo\u017ce by\u0107 niedost\u0119pny (tryb prywatny) \u2014 ignorujemy.
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      rooms = JSON.parse(raw) as Room[];
    } else {
      persist();
    }
  } catch {
    // Uszkodzone dane \u2014 zostajemy przy seedzie.
  }
}

function setRooms(next: Room[]) {
  rooms = next;
  persist();
  emit();
}

export function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function getRooms(): Room[] {
  return rooms;
}

export function getRoom(code: string): Room | undefined {
  return rooms.find((room) => room.code === code.toUpperCase());
}

export function createRoom(options: {
  name: string;
  visibility: Room["visibility"];
  hostName: string;
}): Room {
  const room: Room = {
    id: crypto.randomUUID(),
    code: generateRoomCode(),
    name: options.name.trim() || "Nowy stół",
    gameType: "tysiac",
    status: "waiting",
    visibility: options.visibility,
    createdAt: new Date().toISOString(),
    players: [
      {
        id: crypto.randomUUID(),
        name: options.hostName.trim() || "Ty",
        seat: 1,
        isHost: true,
        isConnected: true,
      },
    ],
  };

  setRooms([room, ...rooms]);

  return room;
}

export function joinRoom(
  code: string,
  options: {playerName: string; seat?: 1 | 2 | 3}
): Room | undefined {
  const room = getRoom(code);

  if (!room) return undefined;
  if (room.status !== "waiting") return room;
  if (room.players.length >= 3) return room;

  const takenSeats = room.players.map((player) => player.seat);
  const seat =
    options.seat ??
    ([1, 2, 3].find((value) => !takenSeats.includes(value as 1 | 2 | 3)) as
      | 1
      | 2
      | 3
      | undefined);

  if (!seat || takenSeats.includes(seat)) return room;

  const updatedRoom: Room = {
    ...room,
    players: [
      ...room.players,
      {
        id: crypto.randomUUID(),
        name: options.playerName.trim() || "Ty",
        seat,
        isHost: false,
        isConnected: true,
      },
    ],
  };

  setRooms(rooms.map((current) => (current.id === room.id ? updatedRoom : current)));

  return updatedRoom;
}

export function leaveRoom(code: string, playerId: string) {
  const room = getRoom(code);

  if (!room) return;

  const remainingPlayers = room.players.filter(
    (player) => player.id !== playerId
  );

  if (remainingPlayers.length === 0) {
    setRooms(rooms.filter((current) => current.id !== room.id));
    return;
  }

  const updatedRoom: Room = {
    ...room,
    players: remainingPlayers.map((player, index) => ({
      ...player,
      isHost: index === 0 ? true : player.isHost,
    })),
  };

  setRooms(rooms.map((current) => (current.id === room.id ? updatedRoom : current)));
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);

  if (hydrated) {
    listener();
  }

  return () => {
    listeners.delete(listener);
  };
}

export function useRooms(): Room[] {
  return useSyncExternalStore(subscribe, getRooms, () => seedRooms);
}

export function useRoom(code: string): Room | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getRoom(code),
    () => undefined
  );
}
