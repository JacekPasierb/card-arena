import {createDeck} from "../src/games/tysiac/engine/createDeck";
import {dealCards} from "../src/games/tysiac/engine/dealCards";
import {getTrickWinner} from "../src/games/tysiac/engine/getTrickWinner";
import {isCardAllowed} from "../src/games/tysiac/engine/isCardAllowed";
import {shuffleDeck} from "../src/games/tysiac/engine/shuffleDeck";
import type {Card, Suit} from "../src/games/tysiac/types/card";
import type {
  GamePhase,
  GameView,
  PlayedCard,
  RoundResult,
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
  phase: GamePhase;
  // licytacja
  currentBid: number;
  highestSeat: Seat;
  bidTurnSeat: Seat;
  passed: Seat[];
  // musik
  musikCards: Card[];
  declarerSeat: Seat | null;
  contractValue: number | null;
  given: Seat[];
  // rozgrywka
  table: PlayedCard[];
  currentTurnSeat: Seat;
  leadSeat: Seat;
  trickCount: number;
  lastTrick: {winnerSeat: Seat; points: number} | null;
  trump: Suit | null;
  lastMeld: {seat: Seat; suit: Suit; points: number} | null;
  // mecz
  matchScores: Record<Seat, number>;
  roundResult: RoundResult | null;
  winnerSeat: Seat | null;
};

const games = new Map<string, Game>();
const SEATS: Seat[] = [1, 2, 3];
const TOTAL_TRICKS = 8;
const MIN_BID = 100;
const BID_STEP = 10;
const MAX_BID = 300;
const TARGET = 1000;
const BARREL = 880;

const MARRIAGE: Record<Suit, number> = {
  hearts: 100,
  diamonds: 80,
  clubs: 60,
  spades: 40,
};

function nextSeat(seat: Seat): Seat {
  return ((seat % 3) + 1) as Seat;
}

function opponentsOf(seat: Seat): Seat[] {
  return SEATS.filter((current) => current !== seat);
}

function dealHands() {
  const dealt = dealCards(shuffleDeck(createDeck()));
  return {
    1: dealt.playerOne,
    2: dealt.playerTwo,
    3: dealt.playerThree,
    musik: dealt.kitty,
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

  const opener = SEATS[Math.floor(Math.random() * SEATS.length)];

  const game: Game = {
    code: room.code,
    players,
    phase: "bidding",
    currentBid: MIN_BID,
    highestSeat: opener,
    bidTurnSeat: nextSeat(opener),
    passed: [],
    musikCards: hands.musik,
    declarerSeat: null,
    contractValue: null,
    given: [],
    table: [],
    currentTurnSeat: opener,
    leadSeat: opener,
    trickCount: 0,
    lastTrick: null,
    trump: null,
    lastMeld: null,
    matchScores: {1: 0, 2: 0, 3: 0},
    roundResult: null,
    winnerSeat: null,
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

function activeSeats(game: Game): Seat[] {
  return SEATS.filter((seat) => !game.passed.includes(seat));
}

function nextActiveSeat(game: Game, from: Seat): Seat {
  let seat = nextSeat(from);
  while (game.passed.includes(seat)) {
    seat = nextSeat(seat);
  }
  return seat;
}

function handStrength(hand: Card[]): number {
  const points = hand.reduce((total, card) => total + card.points, 0);

  let marriages = 0;
  for (const suit of Object.keys(MARRIAGE) as Suit[]) {
    const hasKing = hand.some((card) => card.suit === suit && card.rank === "K");
    const hasQueen = hand.some(
      (card) => card.suit === suit && card.rank === "Q"
    );
    if (hasKing && hasQueen) marriages += MARRIAGE[suit];
  }

  return points + marriages;
}

// ---- Licytacja ----

function finalizeBidding(game: Game) {
  const declarer = playerBySeat(game, game.highestSeat);

  game.declarerSeat = declarer.seat;
  game.contractValue = game.currentBid;
  game.phase = "musik";
  game.given = [];

  declarer.hand = [...declarer.hand, ...game.musikCards];
}

export function placeBid(
  code: string,
  seat: Seat,
  action: "raise" | "pass"
): boolean {
  const game = getGame(code);
  if (!game || game.phase !== "bidding") return false;
  if (game.bidTurnSeat !== seat || game.passed.includes(seat)) return false;

  if (action === "pass") {
    game.passed.push(seat);

    if (activeSeats(game).length === 1) {
      finalizeBidding(game);
    } else {
      game.bidTurnSeat = nextActiveSeat(game, seat);
    }

    return true;
  }

  if (game.currentBid + BID_STEP > MAX_BID) return false;

  game.currentBid += BID_STEP;
  game.highestSeat = seat;
  game.bidTurnSeat = nextActiveSeat(game, seat);
  return true;
}

export function isBotBidTurn(game: Game): boolean {
  return game.phase === "bidding" && playerBySeat(game, game.bidTurnSeat).isBot;
}

export function botBid(code: string): boolean {
  const game = getGame(code);
  if (!game || !isBotBidTurn(game)) return false;

  const seat = game.bidTurnSeat;
  const strength = handStrength(playerBySeat(game, seat).hand);
  const target = Math.min(strength, 120);

  const action: "raise" | "pass" =
    game.currentBid + BID_STEP <= target ? "raise" : "pass";

  return placeBid(code, seat, action);
}

// ---- Musik ----

export function giveCard(
  code: string,
  seat: Seat,
  cardId: string,
  targetSeat: Seat
): boolean {
  const game = getGame(code);
  if (!game || game.phase !== "musik") return false;
  if (game.declarerSeat !== seat) return false;
  if (targetSeat === seat || game.given.includes(targetSeat)) return false;

  const declarer = playerBySeat(game, seat);
  const card = declarer.hand.find((current) => current.id === cardId);
  if (!card) return false;

  declarer.hand = declarer.hand.filter((current) => current.id !== cardId);
  playerBySeat(game, targetSeat).hand.push(card);
  game.given.push(targetSeat);

  if (game.given.length === 2) {
    game.phase = "playing";
    game.leadSeat = seat;
    game.currentTurnSeat = seat;
  }

  return true;
}

export function isBotMusikTurn(game: Game): boolean {
  return (
    game.phase === "musik" &&
    game.declarerSeat !== null &&
    playerBySeat(game, game.declarerSeat).isBot &&
    game.given.length < 2
  );
}

export function botGive(code: string): boolean {
  const game = getGame(code);
  if (!game || !isBotMusikTurn(game) || game.declarerSeat === null) {
    return false;
  }

  const declarer = playerBySeat(game, game.declarerSeat);
  const target = opponentsOf(game.declarerSeat).find(
    (seat) => !game.given.includes(seat)
  );
  if (target === undefined) return false;

  const cheapest = [...declarer.hand].sort((a, b) => a.points - b.points)[0];
  if (!cheapest) return false;

  return giveCard(game.code, game.declarerSeat, cheapest.id, target);
}

// ---- Rozgrywka ----

function allowedCardIds(game: Game, seat: Seat): string[] {
  if (game.phase !== "playing" || game.currentTurnSeat !== seat) return [];

  const player = playerBySeat(game, seat);
  const leadCard = game.table[0]?.card;

  return player.hand
    .filter((card) => isCardAllowed(card, player.hand, leadCard, game.trump))
    .map((card) => card.id);
}

export function isBotPlayTurn(game: Game): boolean {
  return (
    game.phase === "playing" &&
    playerBySeat(game, game.currentTurnSeat).isBot
  );
}

export function playCard(code: string, seat: Seat, cardId: string): boolean {
  const game = getGame(code);
  if (!game || game.phase !== "playing") return false;
  if (game.currentTurnSeat !== seat) return false;

  const player = playerBySeat(game, seat);
  const card = player.hand.find((current) => current.id === cardId);
  if (!card) return false;

  const leadCard = game.table[0]?.card;
  if (!isCardAllowed(card, player.hand, leadCard, game.trump)) return false;

  const isLeading = game.table.length === 0;

  player.hand = player.hand.filter((current) => current.id !== cardId);
  game.table.push({seat, card});

  // Meldunek: wyj\u015bcie kr\u00f3lem lub dam\u0105, gdy w r\u0119ku zostaje partner z pary.
  if (isLeading && (card.rank === "K" || card.rank === "Q")) {
    const partnerRank = card.rank === "K" ? "Q" : "K";
    const hasPartner = player.hand.some(
      (current) => current.suit === card.suit && current.rank === partnerRank
    );

    if (hasPartner) {
      game.trump = card.suit;
      const points = MARRIAGE[card.suit];
      player.trickPoints += points;
      game.lastMeld = {seat, suit: card.suit, points};
    }
  }

  if (game.table.length < 3) {
    game.currentTurnSeat = nextSeat(seat);
    return true;
  }

  const winnerCard = getTrickWinner(
    game.table.map((entry) => entry.card),
    game.trump
  );
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

  game.phase = "trickComplete";
  return true;
}

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Czysta funkcja rozliczenia rozdania (\u0142atwa do testowania):
 * - graj\u0105cy: +kontrakt je\u015bli zdoby\u0142 \u2265 kontrakt, w przeciwnym razie -kontrakt,
 * - obro\u0144cy: punkty z rozdania zaokr\u0105glone do 10,
 * - beczka 880: obro\u0144ca nie przekracza 880 z obrony,
 * - wygrana: graj\u0105cy osi\u0105ga \u2265 1000.
 */
export function computeRoundScoring(params: {
  matchScores: Record<Seat, number>;
  declarerSeat: Seat;
  contract: number;
  roundPoints: Record<Seat, number>;
}): {
  rows: RoundResult["rows"];
  matchScores: Record<Seat, number>;
  winnerSeat: Seat | null;
} {
  const nextScores: Record<Seat, number> = {...params.matchScores};

  const rows: RoundResult["rows"] = SEATS.map((seat) => {
    const roundPoints = params.roundPoints[seat];
    const isDeclarer = seat === params.declarerSeat;

    let delta: number;
    let made: boolean | null = null;

    if (isDeclarer) {
      made = roundPoints >= params.contract;
      delta = made ? params.contract : -params.contract;
    } else {
      delta = roundToTen(roundPoints);
    }

    const current = params.matchScores[seat];
    let total: number;

    if (isDeclarer) {
      total = current + delta;
    } else if (current >= BARREL) {
      total = current;
    } else {
      total = Math.min(current + delta, BARREL);
    }

    nextScores[seat] = total;
    return {seat, roundPoints, delta, total, isDeclarer, made};
  });

  const winnerSeat =
    nextScores[params.declarerSeat] >= TARGET ? params.declarerSeat : null;

  return {rows, matchScores: nextScores, winnerSeat};
}

function scoreRound(game: Game) {
  if (game.declarerSeat === null) {
    game.phase = "roundOver";
    return;
  }

  const roundPoints: Record<Seat, number> = {
    1: playerBySeat(game, 1).trickPoints,
    2: playerBySeat(game, 2).trickPoints,
    3: playerBySeat(game, 3).trickPoints,
  };

  const result = computeRoundScoring({
    matchScores: game.matchScores,
    declarerSeat: game.declarerSeat,
    contract: game.contractValue ?? 0,
    roundPoints,
  });

  game.matchScores = result.matchScores;
  game.roundResult = {rows: result.rows};

  if (result.winnerSeat !== null) {
    game.winnerSeat = result.winnerSeat;
    game.phase = "matchOver";
  } else {
    game.phase = "roundOver";
  }
}

export function finalizeTrick(code: string): boolean {
  const game = getGame(code);
  if (!game || game.phase !== "trickComplete" || !game.lastTrick) return false;

  const winner = playerBySeat(game, game.lastTrick.winnerSeat);
  winner.trickPoints += game.lastTrick.points;

  game.table = [];
  game.trickCount += 1;
  game.leadSeat = game.lastTrick.winnerSeat;
  game.currentTurnSeat = game.lastTrick.winnerSeat;
  game.lastMeld = null;

  if (game.trickCount >= TOTAL_TRICKS) {
    scoreRound(game);
  } else {
    game.phase = "playing";
  }

  return true;
}

export function botPlay(code: string): boolean {
  const game = getGame(code);
  if (!game || !isBotPlayTurn(game)) return false;

  const seat = game.currentTurnSeat;
  const player = playerBySeat(game, seat);
  const leadCard = game.table[0]?.card;

  const allowed = player.hand.filter((card) =>
    isCardAllowed(card, player.hand, leadCard, game.trump)
  );

  // Przy wyj\u015bciu bot ch\u0119tnie melduje: zagrywa kr\u00f3la z najcenniejszej pary K+Q.
  if (game.table.length === 0) {
    const meldSuit = (Object.keys(MARRIAGE) as Suit[])
      .filter(
        (suit) =>
          player.hand.some((c) => c.suit === suit && c.rank === "K") &&
          player.hand.some((c) => c.suit === suit && c.rank === "Q")
      )
      .sort((a, b) => MARRIAGE[b] - MARRIAGE[a])[0];

    if (meldSuit) {
      const king = player.hand.find(
        (c) => c.suit === meldSuit && c.rank === "K"
      );
      if (king) return playCard(code, seat, king.id);
    }
  }

  const choice = allowed[0] ?? player.hand[0];
  if (!choice) return false;

  return playCard(code, seat, choice.id);
}

function setupRound(game: Game) {
  const hands = dealHands();

  for (const player of game.players) {
    player.hand = hands[player.seat];
    player.trickPoints = 0;
  }

  const opener = nextSeat(game.leadSeat);

  game.phase = "bidding";
  game.currentBid = MIN_BID;
  game.highestSeat = opener;
  game.bidTurnSeat = nextSeat(opener);
  game.passed = [];
  game.musikCards = hands.musik;
  game.declarerSeat = null;
  game.contractValue = null;
  game.given = [];
  game.table = [];
  game.currentTurnSeat = opener;
  game.leadSeat = opener;
  game.trickCount = 0;
  game.lastTrick = null;
  game.trump = null;
  game.lastMeld = null;
  game.roundResult = null;
}

export function startNewRound(code: string): boolean {
  const game = getGame(code);
  if (!game || game.phase !== "roundOver") return false;

  setupRound(game);
  return true;
}

export function startNewMatch(code: string): boolean {
  const game = getGame(code);
  if (!game || game.phase !== "matchOver") return false;

  game.matchScores = {1: 0, 2: 0, 3: 0};
  game.winnerSeat = null;
  setupRound(game);
  return true;
}

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
    phase: game.phase,
    currentTurnSeat: game.currentTurnSeat,
    leadSeat: game.leadSeat,
    table: game.table,
    trickCount: game.trickCount,
    totalTricks: TOTAL_TRICKS,
    lastTrick: game.lastTrick,
    trump: game.trump,
    lastMeld: game.lastMeld,
    contract:
      game.declarerSeat !== null && game.contractValue !== null
        ? {declarerSeat: game.declarerSeat, value: game.contractValue}
        : null,
    bidding:
      game.phase === "bidding"
        ? {
            currentBid: game.currentBid,
            highestSeat: game.highestSeat,
            turnSeat: game.bidTurnSeat,
            maxBid: MAX_BID,
          }
        : null,
    musik:
      game.phase === "musik" && game.declarerSeat !== null
        ? {
            declarerSeat: game.declarerSeat,
            contract: game.contractValue ?? game.currentBid,
            cards: game.musikCards,
            needGive: 2 - game.given.length,
            opponents: opponentsOf(game.declarerSeat).map((seat) => ({
              seat,
              name: playerBySeat(game, seat).name,
              received: game.given.includes(seat),
            })),
          }
        : null,
    roundResult: game.roundResult,
    winnerSeat: game.winnerSeat,
    target: TARGET,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      seat: player.seat,
      isBot: player.isBot,
      handCount: player.hand.length,
      trickPoints: player.trickPoints,
      matchScore: game.matchScores[player.seat],
      onBarrel: game.matchScores[player.seat] >= BARREL,
      hasPassed: game.passed.includes(player.seat),
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
