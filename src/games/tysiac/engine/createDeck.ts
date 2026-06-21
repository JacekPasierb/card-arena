import type { Card, Rank, Suit } from "../types/card";

const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const ranks: Rank[] = ["9", "10", "J", "Q", "K", "A"];

const pointsByRank: Record<Rank, number> = {
  "9": 0,
  J: 2,
  Q: 3,
  K: 4,
  "10": 10,
  A: 11,
};

export function createDeck(): Card[] {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${rank}-${suit}`,
      suit,
      rank,
      points: pointsByRank[rank],
    }))
  );
}
