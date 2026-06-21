export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank = "9" | "10" | "J" | "Q" | "K" | "A";

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  points: number;
};
