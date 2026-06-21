"use client";

import {useRouter} from "next/navigation";
import {reportWinner, useTournament} from "./competitionStore";
import {getRoundName} from "./engine/bracket";
import type {Match} from "./types";

type BracketViewProps = {
  id: string;
};

export function BracketView({id}: BracketViewProps) {
  const router = useRouter();
  const tournament = useTournament(id);

  if (!tournament) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black">Nie znaleziono turnieju</h1>
        <button
          type="button"
          onClick={() => router.push("/turnieje")}
          className="mt-6 rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
        >
          Wróć do turniejów
        </button>
      </div>
    );
  }

  const nameById = new Map(
    tournament.participants.map((participant) => [
      participant.id,
      participant.name,
    ])
  );

  const totalRounds = Math.max(
    ...tournament.matches.map((match) => match.round),
    1
  );

  const rounds = Array.from({length: totalRounds}, (_, index) =>
    tournament.matches
      .filter((match) => match.round === index + 1)
      .sort((a, b) => a.position - b.position)
  );

  function renderSlot(match: Match, slot: "A" | "B") {
    const playerId = slot === "A" ? match.playerAId : match.playerBId;
    const name = playerId ? nameById.get(playerId) : null;
    const isWinner = playerId !== null && match.winnerId === playerId;
    const canPick =
      Boolean(match.playerAId) &&
      Boolean(match.playerBId) &&
      !match.winnerId &&
      tournament!.status !== "finished";

    return (
      <button
        type="button"
        disabled={!canPick || !playerId}
        onClick={() =>
          playerId && reportWinner(tournament!.id, match.id, playerId)
        }
        className={`flex w-44 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
          isWinner
            ? "border-yellow-400 bg-yellow-500/15 font-bold text-yellow-300"
            : "border-white/10 bg-black/40 text-gray-200"
        } ${
          canPick && playerId
            ? "cursor-pointer hover:border-emerald-500 hover:bg-emerald-900/30"
            : "cursor-default"
        } ${!playerId ? "opacity-50" : ""}`}
      >
        <span className="truncate">{name ?? "—"}</span>
        {isWinner && <span className="text-yellow-400">✓</span>}
      </button>
    );
  }

  const champion = tournament.championId
    ? nameById.get(tournament.championId)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => router.push("/turnieje")}
        className="mb-6 text-sm text-gray-400 transition hover:text-white"
      >
        ← Wróć do turniejów
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
            Drabinka pucharowa
          </p>
          <h1 className="mt-1 text-4xl font-black">{tournament.name}</h1>
        </div>

        <span className="w-fit rounded-full bg-white/5 px-4 py-2 text-sm text-gray-300">
          {tournament.participants.length} uczestników
        </span>
      </div>

      {champion && (
        <div className="mt-6 rounded-2xl border border-yellow-500 bg-yellow-500/10 p-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">
            Mistrz turnieju
          </p>
          <p className="mt-1 text-3xl font-black text-yellow-400">
            🏆 {champion}
          </p>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-400">
        Kliknij gracza w meczu, aby oznaczyć go jako zwycięzcę — awansuje do
        kolejnej rundy.
      </p>

      <div className="mt-6 overflow-x-auto pb-4">
        <div className="flex min-w-fit gap-6">
          {rounds.map((roundMatches, roundIndex) => (
            <div key={roundIndex} className="flex flex-col">
              <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-yellow-400">
                {getRoundName(roundIndex + 1, totalRounds)}
              </h3>

              <div className="flex flex-1 flex-col justify-around gap-4">
                {roundMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col gap-1 rounded-xl border border-yellow-700/30 bg-black/20 p-2"
                  >
                    {renderSlot(match, "A")}
                    {renderSlot(match, "B")}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
