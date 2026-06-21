import type {Card} from "../types/card";

export function isCardAllowed(card: Card, hand: Card[], leadCard?: Card) {
  if (!leadCard) {
    return true;
  }

  const hasLeadSuit = hand.some((handCard) => handCard.suit === leadCard.suit);

  if (!hasLeadSuit) {
    return true;
  }

  return card.suit === leadCard.suit;
}
