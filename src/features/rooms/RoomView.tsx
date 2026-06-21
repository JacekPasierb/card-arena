"use client";

import {useRouter} from "next/navigation";
import {useMemo, useState} from "react";
import {createDeck} from "@/games/tysiac/engine/createDeck";
import {dealCards} from "@/games/tysiac/engine/dealCards";
import {shuffleDeck} from "@/games/tysiac/engine/shuffleDeck";
import {GameLayout} from "@/games/tysiac/ui/GameLayout";
import {useRoom} from "./roomStore";

type RoomViewProps = {
  code: string;
};

export function RoomView({code}: RoomViewProps) {
  const router = useRouter();
  const room = useRoom(code);
  const [started, setStarted] = useState(false);

  const dealtCards = useMemo(() => {
    if (!started) return null;
    return dealCards(shuffleDeck(createDeck()));
  }, [started]);

  if (!room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black">Nie znaleziono stołu</h1>
        <p className="mt-3 text-gray-300">
          Stół o kodzie <span className="text-yellow-400">{code}</span> nie
          istnieje lub został zamknięty.
        </p>

        <button
          type="button"
          onClick={() => router.push("/tysiac")}
          className="mt-6 rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
        >
          Wróć do listy stołów
        </button>
      </div>
    );
  }

  if (started && dealtCards) {
    return <GameLayout dealtCards={dealtCards} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => router.push("/tysiac")}
        className="mb-6 text-sm text-gray-400 transition hover:text-white"
      >
        ← Wróć do listy stołów
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
            Poczekalnia
          </p>
          <h1 className="mt-1 text-4xl font-black">{room.name}</h1>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${
            room.visibility === "public"
              ? "bg-emerald-900/50 text-emerald-300"
              : "bg-yellow-500/15 text-yellow-300"
          }`}
        >
          {room.visibility === "public" ? "Publiczny" : "Prywatny"}
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((seat) => {
          const player = room.players.find((current) => current.seat === seat);

          return (
            <div
              key={seat}
              className={`rounded-2xl border p-6 text-center ${
                player
                  ? "border-yellow-600/50 bg-black/40"
                  : "border-dashed border-white/15 bg-black/20"
              }`}
            >
              <p className="text-sm text-gray-400">Miejsce {seat}</p>
              <p className="mt-3 text-xl font-bold">
                {player ? player.name : "Wolne"}
              </p>
              {player?.isHost && (
                <p className="mt-2 text-sm text-yellow-400">Gospodarz</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-yellow-700/40 bg-black/30 p-6">
          <p className="text-sm text-gray-400">Kod dołączenia</p>
          <p className="mt-2 text-3xl font-black tracking-[0.3em] text-yellow-400">
            {room.code}
          </p>
          <p className="mt-3 text-sm text-gray-400">
            Wyślij ten kod znajomym, aby dołączyli do stołu.
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-yellow-700/40 bg-black/30 p-6">
          <p className="mb-4 text-gray-300">
            Brakujące miejsca uzupełnią boty. Pełne zasady online dołączymy w
            kolejnym kroku.
          </p>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
          >
            ▶ Rozpocznij grę
          </button>
        </div>
      </div>
    </div>
  );
}
