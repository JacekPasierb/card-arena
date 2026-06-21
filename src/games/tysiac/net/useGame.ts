"use client";

import {useEffect, useState} from "react";
import {getSocket} from "@/lib/realtime/socket";
import type {GameView} from "../types/game";

export function useGame(code: string): GameView | null {
  const [view, setView] = useState<GameView | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const normalized = code.toUpperCase();

    const handleState = (next: GameView) => setView(next);

    socket.on("game:state", handleState);
    socket.emit("game:subscribe", {code: normalized}, (response) => {
      if (response.ok) setView(response.data);
    });

    return () => {
      socket.off("game:state", handleState);
    };
  }, [code]);

  return view;
}

export function playCard(code: string, cardId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getSocket().emit(
      "game:play",
      {code: code.toUpperCase(), cardId},
      (response) =>
        response.ok ? resolve() : reject(new Error(response.error))
    );
  });
}

export function newRound(code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getSocket().emit("game:newRound", {code: code.toUpperCase()}, (response) =>
      response.ok ? resolve() : reject(new Error(response.error))
    );
  });
}
