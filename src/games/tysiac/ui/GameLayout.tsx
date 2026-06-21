"use client";

import {useCallback, useEffect, useState} from "react";
import {createDeck} from "../engine/createDeck";
import {dealCards} from "../engine/dealCards";
import {getTrickWinner} from "../engine/getTrickWinner";
import {isCardAllowed} from "../engine/isCardAllowed";
import {shuffleDeck} from "../engine/shuffleDeck";
import type {Card} from "../types/card";
import {CardView} from "./CardView";

type GameLayoutProps = {
  dealtCards: ReturnType<typeof dealCards>;
};

type PlayerName = "Gracz 1" | "Gracz 2" | "Gracz 3";

type PlayedCard = {
  playerName: PlayerName;
  card: Card;
};

type Scores = Record<PlayerName, number>;

const playerOrder: PlayerName[] = ["Gracz 1", "Gracz 2", "Gracz 3"];

function getNextPlayer(playerName: PlayerName): PlayerName {
  const currentIndex = playerOrder.indexOf(playerName);
  const nextIndex = (currentIndex + 1) % playerOrder.length;

  return playerOrder[nextIndex];
}

export function GameLayout({dealtCards}: GameLayoutProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [playerOneCards, setPlayerOneCards] = useState(dealtCards.playerOne);
  const [playerTwoCards, setPlayerTwoCards] = useState(dealtCards.playerTwo);
  const [playerThreeCards, setPlayerThreeCards] = useState(
    dealtCards.playerThree
  );

  const [isTrickInProgress, setIsTrickInProgress] = useState(false);
  const [trickWinnerName, setTrickWinnerName] = useState<PlayerName | null>(
    null
  );
  const [startingPlayer, setStartingPlayer] = useState<PlayerName>("Gracz 2");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerName>("Gracz 2");
  const [lastTrickPoints, setLastTrickPoints] = useState(0);
  const [trickCount, setTrickCount] = useState(0);
  const [isRoundFinished, setIsRoundFinished] = useState(false);

  const [scores, setScores] = useState<Scores>({
    "Gracz 1": 0,
    "Gracz 2": 0,
    "Gracz 3": 0,
  });

  function getTrickPoints(cards: Card[]) {
    return cards.reduce((total, card) => total + card.points, 0);
  }

  function isPlayerCardAllowed(card: Card) {
    const leadCard = playedCards[0]?.card;

    return isCardAllowed(card, playerTwoCards, leadCard);
  }



const playOpponentCard = useCallback(
  (playerName: PlayerName) => {
    if (playerName === "Gracz 2") return;

    const opponentHand =
      playerName === "Gracz 1" ? playerOneCards : playerThreeCards;

    const leadCard = playedCards[0]?.card;

    const allowedCards = opponentHand.filter((card) =>
      isCardAllowed(card, opponentHand, leadCard)
    );

    const opponentCard = allowedCards[0] ?? opponentHand[0];

    if (!opponentCard) return;

    setPlayedCards((prevCards) => [
      ...prevCards,
      {
        playerName,
        card: opponentCard,
      },
    ]);

    if (playerName === "Gracz 1") {
      setPlayerOneCards((prevCards) =>
        prevCards.filter((card) => card.id !== opponentCard.id)
      );
    }

    if (playerName === "Gracz 3") {
      setPlayerThreeCards((prevCards) =>
        prevCards.filter((card) => card.id !== opponentCard.id)
      );
    }

    setCurrentPlayer(getNextPlayer(playerName));
  },
  [playerOneCards, playerThreeCards, playedCards]
);

  function handlePlayCard() {
    if (!selectedCard || isTrickInProgress || isRoundFinished) return;
    if (currentPlayer !== "Gracz 2") return;
    if (!isPlayerCardAllowed(selectedCard)) return;

    setPlayedCards((prevCards) => [
      ...prevCards,
      {
        playerName: "Gracz 2",
        card: selectedCard,
      },
    ]);

    setPlayerTwoCards((prevCards) =>
      prevCards.filter((card) => card.id !== selectedCard.id)
    );

    setSelectedCard(null);
    setCurrentPlayer(getNextPlayer("Gracz 2"));
  }

  const finishTrick = useCallback((cards: PlayedCard[]) => {
    const winnerCard = getTrickWinner(
      cards.map((playedCard) => playedCard.card)
    );

    const winner = cards.find(
      (playedCard) => playedCard.card.id === winnerCard?.id
    );

    const trickPoints = getTrickPoints(
      cards.map((playedCard) => playedCard.card)
    );

    setIsTrickInProgress(true);
    setLastTrickPoints(trickPoints);

    if (winner?.playerName) {
      setTrickWinnerName(winner.playerName);
      setStartingPlayer(winner.playerName);
      setCurrentPlayer(winner.playerName);

      setScores((prevScores) => ({
        ...prevScores,
        [winner.playerName]: prevScores[winner.playerName] + trickPoints,
      }));
    }

    setTimeout(() => {
      setPlayedCards([]);
      setTrickWinnerName(null);
      setLastTrickPoints(0);
      setIsTrickInProgress(false);

      setTrickCount((prevCount) => {
        const nextCount = prevCount + 1;

        if (nextCount >= 7) {
          setIsRoundFinished(true);
        }

        return nextCount;
      });
    }, 2000);
  }, []);

  function handleNewRound() {
    const newDeck = shuffleDeck(createDeck());
    const newDeal = dealCards(newDeck);

    setSelectedCard(null);
    setPlayedCards([]);
    setPlayerOneCards(newDeal.playerOne);
    setPlayerTwoCards(newDeal.playerTwo);
    setPlayerThreeCards(newDeal.playerThree);
    setIsTrickInProgress(false);
    setTrickWinnerName(null);
    setStartingPlayer("Gracz 2");
    setCurrentPlayer("Gracz 2");
    setLastTrickPoints(0);
    setTrickCount(0);
    setIsRoundFinished(false);

    setScores({
      "Gracz 1": 0,
      "Gracz 2": 0,
      "Gracz 3": 0,
    });
  }

  useEffect(() => {
    if (isRoundFinished || isTrickInProgress) return;
    if (currentPlayer === "Gracz 2") return;
    if (playedCards.length >= 3) return;

    const timeoutId = setTimeout(() => {
      playOpponentCard(currentPlayer);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [
    currentPlayer,
    isRoundFinished,
    isTrickInProgress,
    playedCards.length,
    playOpponentCard,
  ]);

  useEffect(() => {
    if (playedCards.length !== 3) return;
    if (isTrickInProgress) return;

    const timeoutId = setTimeout(() => {
      finishTrick(playedCards);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [playedCards, isTrickInProgress, finishTrick]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-white">
      <main>
        <section className="relative min-h-[900px] overflow-hidden rounded-[40px] border-4 border-yellow-700/60 bg-emerald-950 p-8 shadow-2xl">
            <div className="absolute left-8 top-8 rounded-xl border border-yellow-600/40 bg-black/30 p-4">
              <h2 className="font-bold text-yellow-400">STÓŁ #12345</h2>
              <p className="text-sm text-gray-300">Tysiąc • 3 graczy</p>
              <p className="mt-2 text-sm text-yellow-300">
                Prowadzi: {startingPlayer}
              </p>
              <p className="text-sm text-gray-300">Lewa: {trickCount}/7</p>
              <p className="text-sm text-emerald-300">
                Teraz gra: {currentPlayer}
              </p>
            </div>

            <div className="absolute right-8 top-8 rounded-xl border border-yellow-600/40 bg-black/30 p-4">
              <h2 className="mb-3 font-bold text-yellow-400">Wyniki</h2>
              <p>Gracz 1: {scores["Gracz 1"]}</p>
              <p>Gracz 2: {scores["Gracz 2"]}</p>
              <p>Gracz 3: {scores["Gracz 3"]}</p>
            </div>

            <PlayerArea
              className="absolute left-[8%] top-[32%]"
              name="Gracz 3"
              cards={playerThreeCards}
              isOpponent
            />

            <PlayerArea
              className="absolute right-[8%] top-[32%]"
              name="Gracz 1"
              cards={playerOneCards}
              isOpponent
            />

            <div className="absolute left-1/2 top-[24%] -translate-x-1/2 rounded-2xl border border-yellow-600/40 bg-black/30 p-5 text-center">
              <h3 className="mb-3 font-bold">MUSIK</h3>

              <div className="flex gap-2">
                {dealtCards.kitty.map((card) => (
                  <div
                    key={card.id}
                    className="h-28 w-20 rounded-lg border border-yellow-500 bg-emerald-900"
                  />
                ))}
              </div>
            </div>

            <div className="absolute left-1/2 top-[45%] flex -translate-x-1/2 gap-3">
              {playedCards.map((playedCard) => (
                <div key={playedCard.card.id} className="w-20 text-center">
                  <CardView card={playedCard.card} />
                  <p className="mt-2 text-xs text-gray-300">
                    {playedCard.playerName}
                  </p>
                </div>
              ))}
            </div>

            {trickWinnerName && (
              <div className="absolute left-1/2 top-[58%] -translate-x-1/2 rounded-xl border border-yellow-600/40 bg-black/40 px-5 py-3 text-center">
                <p className="text-sm text-gray-300">Lewę bierze</p>
                <p className="font-bold text-yellow-400">{trickWinnerName}</p>
                <p className="mt-1 text-sm text-gray-300">
                  +{lastTrickPoints} pkt
                </p>
              </div>
            )}

            {isRoundFinished && (
              <div className="absolute left-1/2 top-[45%] -translate-x-1/2 rounded-2xl border border-yellow-500 bg-black/70 px-8 py-6 text-center shadow-xl">
                <h2 className="text-2xl font-bold text-yellow-400">
                  Koniec rozdania
                </h2>

                <p className="mt-2 text-gray-300">
                  Wynik końcowy został podliczony.
                </p>

                <button
                  type="button"
                  onClick={handleNewRound}
                  className="mt-4 rounded-lg bg-yellow-600 px-6 py-3 font-bold text-white"
                >
                  Nowe rozdanie
                </button>
              </div>
            )}

            <PlayerArea
              className="absolute bottom-32 left-1/2 -translate-x-1/2"
              name="Gracz 2 (Ty)"
              cards={playerTwoCards}
              active
              selectedCardId={selectedCard?.id}
              onCardSelect={setSelectedCard}
              disabled={
                currentPlayer !== "Gracz 2" ||
                isTrickInProgress ||
                isRoundFinished
              }
              isCardAllowed={isPlayerCardAllowed}
            />

            <div className="absolute bottom-6 left-1/2 flex w-[60%] -translate-x-1/2 items-center justify-between rounded-2xl border border-yellow-600/40 bg-black/40 px-8 py-5">
              <div>
                <h2 className="text-2xl font-bold text-yellow-400">
                  {currentPlayer === "Gracz 2"
                    ? "Twoja tura"
                    : `Tura: ${currentPlayer}`}
                </h2>

                <p className="text-gray-300">
                  Zagraj kartę lub dobierz z musiku
                </p>
              </div>

              <button
                type="button"
                disabled={
                  !selectedCard ||
                  currentPlayer !== "Gracz 2" ||
                  isTrickInProgress ||
                  isRoundFinished
                }
                onClick={handlePlayCard}
                className="rounded-lg bg-yellow-600 px-8 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRoundFinished
                  ? "Koniec rozdania"
                  : isTrickInProgress
                  ? "Trwa lewa..."
                  : selectedCard
                  ? `Zagraj: ${selectedCard.rank}`
                  : "Wybierz kartę"}
              </button>
            </div>
        </section>
      </main>
    </div>
  );
}

type PlayerAreaProps = {
  name: string;
  cards: Card[];
  className?: string;
  active?: boolean;
  selectedCardId?: string;
  onCardSelect?: (card: Card) => void;
  isOpponent?: boolean;
  disabled?: boolean;
  isCardAllowed?: (card: Card) => boolean;
};

function PlayerArea({
  name,
  cards,
  className = "",
  active,
  selectedCardId,
  onCardSelect,
  isOpponent = false,
  disabled = false,
  isCardAllowed = () => true,
}: PlayerAreaProps) {
  return (
    <div className={className}>
      <div
        className={`mb-4 w-fit rounded-xl border bg-black/40 px-6 py-3 ${
          active ? "border-yellow-400" : "border-yellow-600/40"
        }`}
      >
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="text-gray-300">0 pkt</p>
      </div>

      <div className="flex max-w-[560px] gap-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className={isOpponent ? "-mr-5 w-16 last:mr-0" : "w-16"}
          >
            {isOpponent ? (
              <div className="relative h-28 overflow-hidden rounded-lg border border-yellow-500 bg-emerald-900 shadow-md">
                <div className="absolute inset-2 rounded border border-yellow-500/60" />
                <div className="absolute inset-4 rounded border border-yellow-500/30" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-yellow-400">
                  ♠
                </span>
              </div>
            ) : (
              <CardView
                card={card}
                isSelected={selectedCardId === card.id}
                isDisabled={disabled || !isCardAllowed(card)}
                onSelect={
                  disabled || !isCardAllowed(card) ? undefined : onCardSelect
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
