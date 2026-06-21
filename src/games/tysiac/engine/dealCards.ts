import type {Card} from "../types/card";

export type DealtCards = {
  playerOne: Card[];
  playerTwo: Card[];
  playerThree: Card[];
  kitty: Card[];
};

export function dealCards(deck: Card[]): DealtCards {
  return {
    playerOne: deck.slice(0, 7),
    playerTwo: deck.slice(7, 14),
    playerThree: deck.slice(14, 21),
    kitty: deck.slice(21, 24),
  };
}
