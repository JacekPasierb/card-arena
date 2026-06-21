import type {Card, Suit} from "./card";

export type Seat = 1 | 2 | 3;

export type PlayedCard = {
  seat: Seat;
  card: Card;
};

export type GamePhase =
  | "bidding"
  | "musik"
  | "playing"
  | "trickComplete"
  | "roundOver"
  | "matchOver";

export type GamePublicPlayer = {
  id: string;
  name: string;
  seat: Seat;
  isBot: boolean;
  handCount: number;
  trickPoints: number;
  matchScore: number;
  onBarrel: boolean;
  hasPassed: boolean;
};

export type RoundResultRow = {
  seat: Seat;
  roundPoints: number;
  delta: number;
  total: number;
  isDeclarer: boolean;
  made: boolean | null;
};

export type RoundResult = {
  rows: RoundResultRow[];
};

export type GameViewer = {
  seat: Seat;
  hand: Card[];
  allowedCardIds: string[];
};

export type BiddingView = {
  currentBid: number;
  highestSeat: Seat;
  turnSeat: Seat;
  maxBid: number;
};

export type MusikOpponent = {
  seat: Seat;
  name: string;
  received: boolean;
};

export type MusikView = {
  declarerSeat: Seat;
  contract: number;
  cards: Card[];
  needGive: number;
  opponents: MusikOpponent[];
};

export type GameView = {
  phase: GamePhase;
  currentTurnSeat: Seat;
  leadSeat: Seat;
  table: PlayedCard[];
  trickCount: number;
  totalTricks: number;
  lastTrick: {winnerSeat: Seat; points: number} | null;
  trump: Suit | null;
  lastMeld: {seat: Seat; suit: Suit; points: number} | null;
  contract: {declarerSeat: Seat; value: number} | null;
  bidding: BiddingView | null;
  musik: MusikView | null;
  roundResult: RoundResult | null;
  winnerSeat: Seat | null;
  target: number;
  players: GamePublicPlayer[];
  you: GameViewer | null;
};
