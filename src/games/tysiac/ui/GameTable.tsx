import type {DealtCards} from "../engine/dealCards";
import {PlayerHand} from "./PlayerHand";

type GameTableProps = {
  dealtCards: DealtCards;
};

const handLabels: Record<keyof DealtCards, string> = {
  playerOne: "Gracz 1",
  playerTwo: "Gracz 2",
  playerThree: "Gracz 3",
  kitty: "Musik",
};

export function GameTable({dealtCards}: GameTableProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      {Object.entries(dealtCards).map(([name, cards]) => (
        <PlayerHand
          key={name}
          title={handLabels[name as keyof DealtCards]}
          cards={cards}
        />
      ))}
    </section>
  );
}
