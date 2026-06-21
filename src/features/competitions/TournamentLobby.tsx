"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {createTournament, useTournaments} from "./competitionStore";

const statusLabels: Record<string, {label: string; className: string}> = {
  active: {label: "W trakcie", className: "bg-emerald-900/50 text-emerald-300"},
  finished: {label: "Zakończony", className: "bg-yellow-500/15 text-yellow-300"},
  setup: {label: "Konfiguracja", className: "bg-white/10 text-gray-300"},
};

export function TournamentLobby() {
  const router = useRouter();
  const tournaments = useTournaments();

  const [name, setName] = useState("");
  const [participants, setParticipants] = useState<string[]>([
    "Ty",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState("");

  function updateParticipant(index: number, value: string) {
    setParticipants((prev) =>
      prev.map((current, currentIndex) =>
        currentIndex === index ? value : current
      )
    );
  }

  function addParticipant() {
    setParticipants((prev) => [...prev, ""]);
  }

  function removeParticipant(index: number) {
    setParticipants((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleCreate() {
    const cleaned = participants.map((value) => value.trim()).filter(Boolean);

    if (cleaned.length < 2) {
      setError("Dodaj co najmniej 2 uczestników.");
      return;
    }

    const tournament = createTournament({name, participantNames: cleaned});
    router.push(`/turnieje/${tournament.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
          Rywalizacja
        </p>
        <h1 className="mt-1 text-4xl font-black">Turnieje pucharowe</h1>
        <p className="mt-2 text-gray-300">
          Zbierz znajomych, zbuduj drabinkę i wyłoń mistrza Areny w systemie
          pucharowym (single elimination).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-yellow-700/40 bg-black/30 p-6">
          <h2 className="mb-4 text-2xl font-bold">Nowy turniej</h2>

          <label className="mb-2 block text-sm text-gray-400">
            Nazwa turnieju
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="np. Mistrzostwa osiedla"
            maxLength={40}
            className="mb-5 w-full rounded-lg border border-yellow-700/40 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400"
          />

          <label className="mb-2 block text-sm text-gray-400">Uczestnicy</label>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="flex gap-2">
                <span className="grid w-8 place-items-center text-sm text-gray-500">
                  {index + 1}
                </span>
                <input
                  value={participant}
                  onChange={(event) =>
                    updateParticipant(index, event.target.value)
                  }
                  placeholder={`Gracz ${index + 1}`}
                  maxLength={20}
                  className="min-w-0 flex-1 rounded-lg border border-yellow-700/40 bg-black/40 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400"
                />
                {participants.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    className="rounded-lg bg-white/5 px-3 text-gray-400 transition hover:bg-red-500/20 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addParticipant}
            className="mt-3 text-sm font-semibold text-yellow-400 hover:text-yellow-300"
          >
            + Dodaj uczestnika
          </button>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleCreate}
            className="mt-6 w-full rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
          >
            Utwórz drabinkę
          </button>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-yellow-400">
            Twoje turnieje
          </h2>

          {tournaments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-gray-400">
              Nie masz jeszcze żadnych turniejów.
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tournament) => {
                const status =
                  statusLabels[tournament.status] ?? statusLabels.setup;

                return (
                  <Link
                    key={tournament.id}
                    href={`/turnieje/${tournament.id}`}
                    className="flex items-center justify-between rounded-2xl border border-yellow-700/40 bg-black/30 p-5 transition hover:border-yellow-500 hover:bg-black/50"
                  >
                    <div>
                      <p className="text-lg font-bold">{tournament.name}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {tournament.participants.length} uczestników
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
