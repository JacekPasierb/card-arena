import type {Card, Suit} from "../types/card";

export function isCardAllowed(
  card: Card,
  hand: Card[],
  leadCard?: Card,
  trump?: Suit | null
) {
  if (!leadCard) {
    return true;
  }

  const hasLeadSuit = hand.some((handCard) => handCard.suit === leadCard.suit);

  if (hasLeadSuit) {
    return card.suit === leadCard.suit;
  }

  // Brak koloru wyj\u015bcia \u2014 je\u015bli jest atut i mamy go w r\u0119ku, trzeba zagra\u0107 atut.
  if (trump) {
    const hasTrump = hand.some((handCard) => handCard.suit === trump);
    if (hasTrump) {
      return card.suit === trump;
    }
  }

  return true;
}
