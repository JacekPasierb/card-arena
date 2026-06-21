"use client";

import {useRouter} from "next/navigation";
import {useEffect, useMemo, useRef} from "react";
import {createDeck} from "@/games/tysiac/engine/createDeck";
import {dealCards} from "@/games/tysiac/engine/dealCards";
import {shuffleDeck} from "@/games/tysiac/engine/shuffleDeck";
import {GameLayout} from "@/games/tysiac/ui/GameLayout";
import {getLocalPlayer} from "./player";
import {joinRoom, leaveRoom, startRoom, useRoom} from "./roomStore";

type RoomViewProps = {
  code: string;
};

export function RoomView({code}: RoomViewProps) {
  const router = useRouter();
  const {status, room} = useRoom(code);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    // Pr\u00f3ba do\u0142\u0105czenia na wypadek wej\u015bcia z linku/od\u015bwie\u017cenia.
    joinRoom(code).catch(() => {
      // Stó\u0142 mo\u017ce by\u0107 pe\u0142ny lub w grze \u2014 i tak subskrybujemy podgl\u0105d.
    });
  }, [code]);

  const isPlaying = room?.status === "playing";

  const dealtCards = useMemo(
    () => (isPlaying ? dealCards(shuffleDeck(createDeck())) : null),
    [isPlaying]
  );

  function handleLeave() {
    leaveRoom(code);
    router.push("/tysiac");
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">
        Łączenie ze stołem…
      </div>
    );
  }

  if (status === "missing" || !room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black">Nie znaleziono stołu</h1>
        <p className="mt-3 text-gray-300">
          Stół <span className="text-yellow-400">{code}</span> nie istnieje lub
          został zamknięty.
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

  if (isPlaying && dealtCards) {
    return <GameLayout dealtCards={dealtCards} />;
  }

  const me = room.players.find(
    (player) => player.id === getLocalPlayer().id
  );
  const isHost = me?.isHost ?? false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={handleLeave}
        className="mb-6 text-sm text-gray-400 transition hover:text-white"
      >
        ← Opuść stół
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
                {player && me && player.id === me.id && (
                  <span className="ml-1 text-sm text-emerald-300">(Ty)</span>
                )}
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
            Wyślij ten kod znajomym — dołączą do stołu na żywo.
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-yellow-700/40 bg-black/30 p-6">
          {isHost ? (
            <>
              <p className="mb-4 text-gray-300">
                Jesteś gospodarzem. Rozpocznij grę, gdy stół będzie gotowy.
              </p>
              <button
                type="button"
                onClick={() => startRoom(code)}
                className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
              >
                ▶ Rozpocznij grę
              </button>
            </>
          ) : (
            <p className="text-gray-300">
              Czekaj, aż gospodarz rozpocznie grę. Stół aktualizuje się na żywo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
