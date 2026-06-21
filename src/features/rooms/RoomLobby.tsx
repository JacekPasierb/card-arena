"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";
import {createRoom, joinRoom, useRooms} from "./roomStore";

export function RoomLobby() {
  const router = useRouter();
  const rooms = useRooms();

  const [tableName, setTableName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  function handleCreateRoom() {
    const room = createRoom({
      name: tableName,
      visibility,
      hostName: "Ty",
    });

    router.push(`/tysiac/stol/${room.code}`);
  }

  function handleJoinByCode() {
    const code = roomCode.trim().toUpperCase();

    if (!code) return;

    const room = joinRoom(code, {playerName: "Ty"});

    if (!room) {
      setError("Nie znaleziono stołu o tym kodzie.");
      return;
    }

    setError("");
    router.push(`/tysiac/stol/${room.code}`);
  }

  function handleJoinSeat(code: string, seat: 1 | 2 | 3) {
    const room = joinRoom(code, {playerName: "Ty", seat});

    if (room) {
      router.push(`/tysiac/stol/${room.code}`);
    }
  }

  const publicRooms = rooms.filter(
    (room) => room.visibility === "public" && room.status === "waiting"
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
          Tysiąc
        </p>
        <h1 className="mt-1 text-4xl font-black">Stoły online</h1>
        <p className="mt-2 text-gray-300">
          Stwórz własny stół i zaproś znajomych kodem albo dołącz do gry, która
          czeka na graczy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-yellow-700/40 bg-black/30 p-6">
          <h2 className="mb-4 text-2xl font-bold">Stwórz stół</h2>

          <label className="mb-2 block text-sm text-gray-400">Nazwa stołu</label>
          <input
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="np. Wieczorny Tysiąc"
            maxLength={30}
            className="mb-4 w-full rounded-lg border border-yellow-700/40 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400"
          />

          <div className="mb-6 flex gap-2">
            {(["public", "private"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  visibility === value
                    ? "border-yellow-400 bg-yellow-500/15 text-yellow-300"
                    : "border-white/10 bg-black/30 text-gray-300 hover:bg-black/50"
                }`}
              >
                {value === "public" ? "Publiczny" : "Prywatny"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCreateRoom}
            className="w-full rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
          >
            Stwórz i wejdź
          </button>
        </div>

        <div className="rounded-2xl border border-yellow-700/40 bg-black/30 p-6">
          <h2 className="mb-4 text-2xl font-bold">Dołącz kodem</h2>

          <p className="mb-4 text-gray-300">
            Masz kod prywatnego stołu od znajomego? Wpisz go poniżej.
          </p>

          <div className="flex gap-3">
            <input
              value={roomCode}
              onChange={(event) => {
                setRoomCode(event.target.value);
                setError("");
              }}
              placeholder="KOD"
              maxLength={6}
              className="min-w-0 flex-1 rounded-lg border border-yellow-700/40 bg-black/40 px-4 py-3 uppercase tracking-[0.3em] text-white outline-none placeholder:tracking-normal placeholder:text-gray-500 focus:border-yellow-400"
            />

            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={!roomCode.trim()}
              className="rounded-lg bg-emerald-700 px-6 py-3 font-bold transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Dołącz
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-yellow-400">Publiczne stoły</h2>
          <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-gray-300">
            {publicRooms.length} stołów
          </span>
        </div>

        {publicRooms.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-gray-400">
            Brak otwartych stołów. Stwórz pierwszy!
          </div>
        ) : (
          <div className="space-y-3">
            {publicRooms.map((room) => {
              const isFull = room.players.length >= 3;
              const host = room.players.find((player) => player.isHost);

              return (
                <div
                  key={room.id}
                  className="flex flex-col gap-4 rounded-2xl border border-yellow-700/40 bg-black/30 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-lg font-bold">{room.name}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Gospodarz: {host?.name ?? "Nieznany"} • kod {room.code}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-emerald-900/50 px-4 py-2 text-sm text-emerald-300">
                      {room.players.length}/3 graczy
                    </span>

                    <div className="flex gap-2">
                      {[1, 2, 3].map((seat) => {
                        const isTaken = room.players.some(
                          (player) => player.seat === seat
                        );

                        return (
                          <button
                            key={seat}
                            type="button"
                            onClick={() =>
                              handleJoinSeat(room.code, seat as 1 | 2 | 3)
                            }
                            disabled={isTaken || isFull}
                            className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isTaken ? `M${seat}` : `M${seat}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
