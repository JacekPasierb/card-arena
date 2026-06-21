import {createDeck} from "../src/games/tysiac/engine/createDeck";
import {dealCards} from "../src/games/tysiac/engine/dealCards";
import {getTrickWinner} from "../src/games/tysiac/engine/getTrickWinner";
import {isCardAllowed} from "../src/games/tysiac/engine/isCardAllowed";
import {shuffleDeck} from "../src/games/tysiac/engine/shuffleDeck";
import type {Card} from "../src/games/tysiac/types/card";
import type {
  GameView,
  PlayedCard,
  Seat,
} from "../src/games/tysiac/types/game";
import type {Room} from "../src/features/rooms/types";

type InternalPlayer = {
  id: string;
  name: string;
  seat: Seat;
  isBot: boolean;
  hand: Card[];
  trickPoints: number;
};

type Game = {
  code: string;
  players: InternalPlayer[];
  table: PlayedCard[];
  currentTurnSeat: Seat;
  leadSeat: Seat;
  trickCount: number;
  status: "playing" | "trickComplete" | "roundOver";
  lastTrick: {winnerSeat: Seat; points: number} | null;
};

const games = new Map<string, Game>();
const SEATS: Seat[] = [1, 2, 3];
const TOTAL_TRICKS = 7;

function nextSeat(seat: Seat): Seat {
  return ((seat % 3) + 1) as Seat;
}

function handForSeat(
  seat: Seat,
  dealt: ReturnType<typeof dealCards>
): Card[] {
  if (seat === 1) return dealt.playerOne;
  if (seat === 2) return dealt.playerTwo;
  return dealt.playerThree;
}

function dealHands(): Record<Seat, Card[]> {
  const dealt = dealCards(shuffleDeck(createDeck()));
  return {
    1: handForSeat(1, dealt),
    2: handForSeat(2, dealt),
    3: handForSeat(3, dealt),
  };
}

export function startGame(room: Room): Game {
  const hands = dealHands();

  const players: InternalPlayer[] = SEATS.map((seat) => {
    const roomPlayer = room.players.find((player) => player.seat === seat);

    return {
      id: roomPlayer?.id ?? `bot-${seat}`,
      name: roomPlayer?.name ?? `Bot ${seat}`,
      seat,
      isBot: !roomPlayer,
      hand: hands[seat],
      trickPoints: 0,
    };
  });

  const leadSeat = SEATS[Math.floor(Math.random() * SEATS.length)];

  const game: Game = {
    code: room.code,
    players,
    table: [],
    currentTurnSeat: leadSeat,
    leadSeat,
    trickCount: 0,
    status: "playing",
    lastTrick: null,
  };

  games.set(room.code, game);
  return game;
}

export function getGame(code: string): Game | undefined {
  return games.get(code);
}

export function removeGame(code: string) {
  games.delete(code);
}

function playerBySeat(game: Game, seat: Seat): InternalPlayer {
  return game.players.find((player) => player.seat === seat)!;
}

function allowedCardIds(game: Game, seat: Seat): string[] {
  if (game.status !== "playing" || game.currentTurnSeat !== seat) return [];

  const player = playerBySeat(game, seat);
  const leadCard = game.table[0]?.card;

  return player.hand
    .filter((card) => isCardAllowed(card, player.hand, leadCard))
    .map((card) => card.id);
}

export function isBotTurn(game: Game): boolean {
  return (
    game.status === "playing" &&
    playerBySeat(game, game.currentTurnSeat).isBot
  );
}

/** Wykonuje zagranie karty przez gracza na danym miejscu. Zwraca true je\u015bli ruch by\u0142 prawid\u0142owy. */
export function playCard(code: string, seat: Seat, cardId: string): boolean {
  const game = getGame(code);

  if (!game || game.status !== "playing") return false;
  if (game.currentTurnSeat !== seat) return false;

  const player = playerBySeat(game, seat);
  const card = player.hand.find((current) => current.id === cardId);

  if (!card) return false;

  const leadCard = game.table[0]?.card;
  if (!isCardAllowed(card, player.hand, leadCard)) return false;

  player.hand = player.hand.filter((current) => current.id !== cardId);
  game.table.push({seat, card});

  if (game.table.length < 3) {
    game.currentTurnSeat = nextSeat(seat);
    return true;
  }

  // Lewa kompletna \u2014 wyznaczamy zwyci\u0119zc\u0119, ale zostawiamy karty na stole.
  const winnerCard = getTrickWinner(game.table.map((entry) => entry.card));
  const winnerEntry = game.table.find(
    (entry) => entry.card.id === winnerCard?.id
  );
  const points = game.table.reduce(
    (total, entry) => total + entry.card.points,
    0
  );

  if (winnerEntry) {
    game.lastTrick = {winnerSeat: winnerEntry.seat, points};
  }

  game.status = "trickComplete";
  return true;
}

/** Finalizuje lew\u0119: przyznaje punkty, czy\u015bci st\u00f3\u0142 i ustawia kolejn\u0105 tur\u0119. */
export function finalizeTrick(code: string): boolean {
  const game = getGame(code);
  if (!game || game.status !== "trickComplete" || !game.lastTrick) return false;

  const winnerSeat = game.lastTrick.winnerSeat;
  const winner = playerBySeat(game, winnerSeat);
  winner.trickPoints += game.lastTrick.points;

  game.table = [];
  game.trickCount += 1;
  game.leadSeat = winnerSeat;
  game.currentTurnSeat = winnerSeat;

  game.status = game.trickCount >= TOTAL_TRICKS ? "roundOver" : "playing";
  return true;
}

/** Ruch bota na aktualnym miejscu. Zwraca true je\u015bli zagra\u0142. */
export function botPlay(code: string): boolean {
  const game = getGame(code);
  if (!game || !isBotTurn(game)) return false;

  const seat = game.currentTurnSeat;
  const player = playerBySeat(game, seat);
  const leadCard = game.table[0]?.card;

  const allowed = player.hand.filter((card) =>
    isCardAllowed(card, player.hand, leadCard)
  );
  const choice = allowed[0] ?? player.hand[0];

  if (!choice) return false;

  return playCard(code, seat, choice.id);
}

export function startNewRound(code: string): boolean {
  const game = getGame(code);
  if (!game) return false;

  const hands = dealHands();

  for (const player of game.players) {
    player.hand = hands[player.seat];
    player.trickPoints = 0;
  }

  game.table = [];
  game.trickCount = 0;
  game.lastTrick = null;
  game.status = "playing";
  game.leadSeat = nextSeat(game.leadSeat);
  game.currentTurnSeat = game.leadSeat;

  return true;
}

/** Zamienia roz\u0142\u0105czonego gracza w bota, aby gra mog\u0142a si\u0119 toczy\u0107 dalej. */
export function convertPlayerToBot(playerId: string): string[] {
  const affected: string[] = [];

  for (const game of games.values()) {
    const player = game.players.find((current) => current.id === playerId);
    if (player && !player.isBot) {
      player.isBot = true;
      affected.push(game.code);
    }
  }

  return affected;
}

export function buildView(code: string, viewerId?: string): GameView | null {
  const game = getGame(code);
  if (!game) return null;

  const viewer = viewerId
    ? game.players.find((player) => player.id === viewerId)
    : undefined;

  return {
    status: game.status,
    currentTurnSeat: game.currentTurnSeat,
    leadSeat: game.leadSeat,
    table: game.table,
    trickCount: game.trickCount,
    totalTricks: TOTAL_TRICKS,
    lastTrick: game.lastTrick,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      seat: player.seat,
      isBot: player.isBot,
      handCount: player.hand.length,
      trickPoints: player.trickPoints,
    })),
    you:
      viewer && !viewer.isBot
        ? {
            seat: viewer.seat,
            hand: viewer.hand,
            allowedCardIds: allowedCardIds(game, viewer.seat),
          }
        : null,
  };
}
