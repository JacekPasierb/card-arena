import {createDeck} from "@/games/tysiac/engine/createDeck";
import {dealCards} from "@/games/tysiac/engine/dealCards";
import {shuffleDeck} from "@/games/tysiac/engine/shuffleDeck";
import {GameLayout} from "@/games/tysiac/ui/GameLayout";

export default function Home() {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const dealtCards = dealCards(shuffledDeck);

  return <GameLayout dealtCards={dealtCards} />;
}
