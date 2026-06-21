import type {Card} from "./card";

export type Seat = 1 | 2 | 3;

export type PlayedCard = {
  seat: Seat;
  card: Card;
};

export type GameStatus = "playing" | "trickComplete" | "roundOver";

export type GamePublicPlayer = {
  id: string;
  name: string;
  seat: Seat;
  isBot: boolean;
  handCount: number;
  trickPoints: number;
};

export type GameViewer = {
  seat: Seat;
  hand: Card[];
  allowedCardIds: string[];
};

export type GameView = {
  status: GameStatus;
  currentTurnSeat: Seat;
  leadSeat: Seat;
  table: PlayedCard[];
  trickCount: number;
  totalTricks: number;
  lastTrick: {winnerSeat: Seat; points: number} | null;
  players: GamePublicPlayer[];
  you: GameViewer | null;
};
