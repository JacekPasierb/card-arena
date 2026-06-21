import type {Card} from "../types/card";
import {CardView} from "./CardView";

type PlayerHandProps = {
  title: string;
  cards: Card[];
};

export function PlayerHand({title, cards}: PlayerHandProps) {
  return (
    <div className="rounded-xl border p-4">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <CardView key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
