import type {Card} from "../types/card";

const rankPower: Record<Card["rank"], number> = {
  "9": 1,
  J: 2,
  Q: 3,
  K: 4,
  "10": 5,
  A: 6,
};

export function getTrickWinner(cards: Card[]) {
  if (cards.length !== 3) return null;

  const leadSuit = cards[0].suit;

  const sameSuitCards = cards.filter((card) => card.suit === leadSuit);

  return sameSuitCards.reduce((highestCard, currentCard) => {
    return rankPower[currentCard.rank] > rankPower[highestCard.rank]
      ? currentCard
      : highestCard;
  });
}
