"use client";

import {useState} from "react";
import type {GamePublicPlayer, Seat} from "../types/game";
import {giveCard, newRound, placeBid, playCard, useGame} from "../net/useGame";
import {CardView} from "./CardView";

type GameBoardProps = {
  code: string;
  roomName: string;
};

function OpponentArea({
  player,
  active,
  className,
}: {
  player: GamePublicPlayer | undefined;
  active: boolean;
  className: string;
}) {
  if (!player) return null;

  return (
    <div className={className}>
      <div
        className={`mb-3 w-fit rounded-xl border px-5 py-2 ${
          active
            ? "border-yellow-400 bg-yellow-500/10"
            : "border-yellow-600/40 bg-black/40"
        }`}
      >
        <h3 className="text-lg font-bold">
          {player.name}
          {player.isBot && (
            <span className="ml-1 text-xs text-gray-400">(bot)</span>
          )}
          {player.hasPassed && (
            <span className="ml-1 text-xs text-red-300">pas</span>
          )}
        </h3>
        <p className="text-sm text-gray-300">{player.trickPoints} pkt</p>
      </div>

      <div className="flex">
        {Array.from({length: player.handCount}).map((_, index) => (
          <div
            key={index}
            className="-mr-6 h-24 w-16 rounded-lg border border-yellow-500 bg-emerald-900 shadow-md last:mr-0"
          >
            <div className="m-2 grid h-[calc(100%-16px)] place-items-center rounded border border-yellow-500/40 text-yellow-400">
              ♠
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameBoard({code, roomName}: GameBoardProps) {
  const view = useGame(code);
  const [selectedGive, setSelectedGive] = useState<string | null>(null);

  if (!view) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">
        Wczytywanie gry…
      </div>
    );
  }

  const playerBySeat = (seat: Seat) =>
    view.players.find((player) => player.seat === seat);

  const youSeat = view.you?.seat;
  const opponents = view.players
    .filter((player) => player.seat !== youSeat)
    .sort((a, b) => a.seat - b.seat);

  const currentName = playerBySeat(view.currentTurnSeat)?.name ?? "—";
  const leadName = playerBySeat(view.leadSeat)?.name ?? "—";

  const isMyTurn =
    view.you != null &&
    view.phase === "playing" &&
    view.currentTurnSeat === view.you.seat;

  const isMyBidTurn =
    view.you != null &&
    view.phase === "bidding" &&
    view.bidding != null &&
    view.bidding.turnSeat === view.you.seat;

  const isDeclarer =
    view.you != null &&
    view.phase === "musik" &&
    view.musik != null &&
    view.musik.declarerSeat === view.you.seat;

  const allowed = new Set(view.you?.allowedCardIds ?? []);

  async function handlePlay(cardId: string) {
    try {
      await playCard(code, cardId);
    } catch {
      // serwer odrzuci\u0142 \u2014 stan przyjdzie przez game:state
    }
  }

  async function handleGive(targetSeat: Seat) {
    if (!selectedGive) return;
    try {
      await giveCard(code, selectedGive, targetSeat);
      setSelectedGive(null);
    } catch {
      setSelectedGive(null);
    }
  }

  function handCardMode(cardId: string): {
    selectable: boolean;
    selected: boolean;
    onSelect?: () => void;
  } {
    if (isMyTurn && allowed.has(cardId)) {
      return {selectable: true, selected: false, onSelect: () => handlePlay(cardId)};
    }

    if (isDeclarer) {
      return {
        selectable: true,
        selected: selectedGive === cardId,
        onSelect: () => setSelectedGive(cardId),
      };
    }

    return {selectable: false, selected: false};
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-white">
      <section className="relative min-h-[820px] overflow-hidden rounded-[40px] border-4 border-yellow-700/60 bg-emerald-950 p-8 shadow-2xl">
        <div className="absolute left-8 top-8 rounded-xl border border-yellow-600/40 bg-black/30 p-4">
          <h2 className="font-bold text-yellow-400">{roomName}</h2>
          <p className="text-sm text-gray-300">Tysiąc • stół {code}</p>
          <p className="mt-2 text-sm text-yellow-300">Prowadzi: {leadName}</p>
          <p className="text-sm text-gray-300">
            Lewa: {view.trickCount}/{view.totalTricks}
          </p>
          {view.contract && (
            <p className="text-sm text-emerald-300">
              Gra: {playerBySeat(view.contract.declarerSeat)?.name} za{" "}
              {view.contract.value}
            </p>
          )}
        </div>

        <div className="absolute right-8 top-8 rounded-xl border border-yellow-600/40 bg-black/30 p-4">
          <h2 className="mb-2 font-bold text-yellow-400">Wyniki</h2>
          {view.players.map((player) => (
            <p key={player.seat} className="text-sm">
              {player.name}: {player.trickPoints}
            </p>
          ))}
        </div>

        <OpponentArea
          player={opponents[0]}
          active={
            view.currentTurnSeat === opponents[0]?.seat ||
            view.bidding?.turnSeat === opponents[0]?.seat
          }
          className="absolute left-[8%] top-[28%]"
        />
        <OpponentArea
          player={opponents[1]}
          active={
            view.currentTurnSeat === opponents[1]?.seat ||
            view.bidding?.turnSeat === opponents[1]?.seat
          }
          className="absolute right-[8%] top-[28%]"
        />

        {/* Licytacja */}
        {view.phase === "bidding" && view.bidding && (
          <div className="absolute left-1/2 top-[38%] w-[340px] -translate-x-1/2 rounded-2xl border border-yellow-500/60 bg-black/60 p-6 text-center">
            <h3 className="text-lg font-bold text-yellow-400">Licytacja</h3>
            <p className="mt-2 text-3xl font-black">{view.bidding.currentBid}</p>
            <p className="mt-1 text-sm text-gray-300">
              Najwyżej:{" "}
              {playerBySeat(view.bidding.highestSeat)?.name ?? "—"}
            </p>

            {isMyBidTurn ? (
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => placeBid(code, "pass")}
                  className="rounded-lg bg-white/10 px-5 py-2 font-bold transition hover:bg-white/20"
                >
                  Pas
                </button>
                <button
                  type="button"
                  onClick={() => placeBid(code, "raise")}
                  disabled={view.bidding.currentBid + 10 > view.bidding.maxBid}
                  className="rounded-lg bg-yellow-500 px-5 py-2 font-bold text-black transition hover:bg-yellow-400 disabled:opacity-40"
                >
                  Podbij do {view.bidding.currentBid + 10}
                </button>
              </div>
            ) : (
              <p className="mt-5 text-sm text-emerald-300">
                Licytuje: {playerBySeat(view.bidding.turnSeat)?.name}
              </p>
            )}
          </div>
        )}

        {/* Musik */}
        {view.phase === "musik" && view.musik && (
          <div className="absolute left-1/2 top-[30%] w-[360px] -translate-x-1/2 rounded-2xl border border-yellow-500/60 bg-black/60 p-6 text-center">
            <h3 className="text-lg font-bold text-yellow-400">
              Musik (kontrakt {view.musik.contract})
            </h3>

            <div className="mt-4 flex justify-center gap-2">
              {view.musik.cards.map((card) => (
                <div key={card.id} className="w-16">
                  <CardView card={card} isDisabled />
                </div>
              ))}
            </div>

            {isDeclarer ? (
              <div className="mt-5">
                <p className="text-sm text-gray-300">
                  {selectedGive
                    ? "Wybierz gracza, któremu oddasz kartę:"
                    : `Wybierz kartę z ręki do oddania (pozostało: ${view.musik.needGive}).`}
                </p>

                {selectedGive && (
                  <div className="mt-3 flex justify-center gap-3">
                    {view.musik.opponents.map((opponent) => (
                      <button
                        key={opponent.seat}
                        type="button"
                        disabled={opponent.received}
                        onClick={() => handleGive(opponent.seat)}
                        className="rounded-lg bg-emerald-700 px-4 py-2 font-bold transition hover:bg-emerald-600 disabled:opacity-40"
                      >
                        {opponent.name}
                        {opponent.received ? " ✓" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm text-emerald-300">
                {playerBySeat(view.musik.declarerSeat)?.name} wymienia karty…
              </p>
            )}
          </div>
        )}

        {/* St\u00f3\u0142 z zagranymi kartami */}
        <div className="absolute left-1/2 top-[44%] flex -translate-x-1/2 gap-3">
          {view.table.map((entry) => (
            <div key={entry.card.id} className="w-20 text-center">
              <CardView card={entry.card} />
              <p className="mt-2 text-xs text-gray-300">
                {playerBySeat(entry.seat)?.name}
              </p>
            </div>
          ))}
        </div>

        {view.lastTrick && view.phase === "trickComplete" && (
          <div className="absolute left-1/2 top-[64%] -translate-x-1/2 rounded-xl border border-yellow-600/40 bg-black/40 px-5 py-3 text-center">
            <p className="text-sm text-gray-300">Lewę bierze</p>
            <p className="font-bold text-yellow-400">
              {playerBySeat(view.lastTrick.winnerSeat)?.name}
            </p>
            <p className="mt-1 text-sm text-gray-300">
              +{view.lastTrick.points} pkt
            </p>
          </div>
        )}

        {view.phase === "roundOver" && (
          <div className="absolute left-1/2 top-[40%] -translate-x-1/2 rounded-2xl border border-yellow-500 bg-black/80 px-8 py-6 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-yellow-400">
              Koniec rozdania
            </h2>
            <div className="mt-3 space-y-1">
              {[...view.players]
                .sort((a, b) => b.trickPoints - a.trickPoints)
                .map((player) => (
                  <p key={player.seat} className="text-gray-200">
                    {player.name}: {player.trickPoints} pkt
                  </p>
                ))}
            </div>
            <button
              type="button"
              onClick={() => newRound(code)}
              className="mt-5 rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
            >
              Nowe rozdanie
            </button>
          </div>
        )}

        {/* R\u0119ka gracza */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
          <div
            className={`mb-4 w-fit rounded-xl border px-6 py-2 ${
              isMyTurn || isMyBidTurn || isDeclarer
                ? "border-yellow-400 bg-yellow-500/10"
                : "border-yellow-600/40 bg-black/40"
            }`}
          >
            <h3 className="text-xl font-bold">
              {view.you ? `Ty (miejsce ${view.you.seat})` : "Obserwator"}
            </h3>
          </div>

          <div className="flex max-w-[680px] flex-wrap justify-center gap-2">
            {view.you?.hand.map((card) => {
              const mode = handCardMode(card.id);

              return (
                <div key={card.id} className="w-16">
                  <CardView
                    card={card}
                    isSelected={mode.selected}
                    isDisabled={!mode.selectable}
                    onSelect={mode.onSelect ? () => mode.onSelect?.() : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-yellow-600/40 bg-black/40 px-8 py-4 text-center">
          <h2 className="text-xl font-bold text-yellow-400">
            {view.phase === "bidding"
              ? isMyBidTurn
                ? "Twoja licytacja"
                : "Trwa licytacja…"
              : view.phase === "musik"
              ? isDeclarer
                ? "Wymień karty z musika"
                : "Wymiana musika…"
              : view.phase === "roundOver"
              ? "Rozdanie zakończone"
              : isMyTurn
              ? "Twoja tura — zagraj kartę"
              : `Tura: ${currentName}`}
          </h2>
        </div>
      </section>
    </div>
  );
}
