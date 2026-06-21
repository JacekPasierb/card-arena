import type {Card, Suit} from "../types/card";

const rankPower: Record<Card["rank"], number> = {
  "9": 1,
  J: 2,
  Q: 3,
  K: 4,
  "10": 5,
  A: 6,
};

export function getTrickWinner(cards: Card[], trump?: Suit | null) {
  if (cards.length !== 3) return null;

  const leadSuit = cards[0].suit;

  const trumpCards = trump
    ? cards.filter((card) => card.suit === trump)
    : [];

  const pool =
    trumpCards.length > 0
      ? trumpCards
      : cards.filter((card) => card.suit === leadSuit);

  return pool.reduce((highestCard, currentCard) => {
    return rankPower[currentCard.rank] > rankPower[highestCard.rank]
      ? currentCard
      : highestCard;
  });
}
