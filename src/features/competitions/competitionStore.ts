"use client";

import {useSyncExternalStore} from "react";
import {generateBracket, getChampionId, setMatchWinner} from "./engine/bracket";
import type {Participant, Tournament} from "./types";

const STORAGE_KEY = "card-arena:tournaments";

function buildSeed(): Tournament {
  const participants: Participant[] = [
    {id: "seed-p1", name: "Janek"},
    {id: "seed-p2", name: "Marek"},
    {id: "seed-p3", name: "Ola"},
    {id: "seed-p4", name: "Kasia"},
  ];

  return {
    id: "seed-tournament",
    name: "Puchar Areny",
    gameType: "tysiac",
    status: "active",
    createdAt: new Date().toISOString(),
    participants,
    matches: generateBracket(participants),
    championId: null,
  };
}

const seedTournaments: Tournament[] = [buildSeed()];

let tournaments: Tournament[] = seedTournaments;
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  } catch {
    // ignorujemy brak localStorage
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      tournaments = JSON.parse(raw) as Tournament[];
    } else {
      persist();
    }
  } catch {
    // zostajemy przy seedzie
  }
}

function setTournaments(next: Tournament[]) {
  tournaments = next;
  persist();
  emit();
}

export function getTournaments(): Tournament[] {
  return tournaments;
}

export function getTournament(id: string): Tournament | undefined {
  return tournaments.find((tournament) => tournament.id === id);
}

export function createTournament(options: {
  name: string;
  participantNames: string[];
}): Tournament {
  const participants: Participant[] = options.participantNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .map((name) => ({id: crypto.randomUUID(), name}));

  const tournament: Tournament = {
    id: crypto.randomUUID(),
    name: options.name.trim() || "Nowy turniej",
    gameType: "tysiac",
    status: "active",
    createdAt: new Date().toISOString(),
    participants,
    matches: generateBracket(participants),
    championId: null,
  };

  setTournaments([tournament, ...tournaments]);

  return tournament;
}

export function reportWinner(
  tournamentId: string,
  matchId: string,
  winnerId: string
) {
  const tournament = getTournament(tournamentId);

  if (!tournament) return;

  const matches = setMatchWinner(tournament.matches, matchId, winnerId);
  const championId = getChampionId(matches);

  const updated: Tournament = {
    ...tournament,
    matches,
    championId,
    status: championId ? "finished" : "active",
  };

  setTournaments(
    tournaments.map((current) =>
      current.id === tournamentId ? updated : current
    )
  );
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

export function useTournaments(): Tournament[] {
  return useSyncExternalStore(
    subscribe,
    getTournaments,
    () => seedTournaments
  );
}

export function useTournament(id: string): Tournament | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getTournament(id),
    () => undefined
  );
}
