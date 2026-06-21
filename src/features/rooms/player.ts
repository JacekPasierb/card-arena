"use client";

import type {PlayerIdentity} from "@/lib/realtime/events";

const STORAGE_KEY = "card-arena:player";

function randomName() {
  return `Gość-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function getLocalPlayer(): PlayerIdentity {
  if (typeof window === "undefined") {
    return {id: "ssr", name: "Gość"};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      return JSON.parse(raw) as PlayerIdentity;
    }
  } catch {
    // brak/uszkodzony localStorage \u2014 tworzymy nowego gracza
  }

  const player: PlayerIdentity = {id: crypto.randomUUID(), name: randomName()};

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  } catch {
    // ignorujemy
  }

  return player;
}

export function setLocalPlayerName(name: string): PlayerIdentity {
  const player = getLocalPlayer();
  const updated: PlayerIdentity = {...player, name: name.trim() || player.name};

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignorujemy
  }

  return updated;
}
