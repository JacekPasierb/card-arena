"use client";

import type {Card} from "../types/card";

type CardViewProps = {
  card: Card;
  isSelected?: boolean;
  onSelect?: (card: Card) => void;
  isDisabled?: boolean;
};

export function CardView({
  card,
  isSelected = false,
  onSelect,
  isDisabled = false,
}: CardViewProps) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(card)}
      disabled={isDisabled}
      className={`w-full rounded-lg border bg-stone-100 p-3 text-center shadow-sm transition ${
        isSelected
          ? "-translate-y-6 border-yellow-500 ring-2 ring-yellow-400"
          : "border-stone-300 hover:-translate-y-2"
      } ${isRed ? "text-red-700" : "text-stone-950"} ${
        isDisabled ? "cursor-not-allowed opacity-40 hover:translate-y-0" : ""
      }`}
    >
      <div className="text-xl font-bold">{card.rank}</div>

      <div className="text-sm">
        {card.suit === "hearts" && "♥"}
        {card.suit === "diamonds" && "♦"}
        {card.suit === "clubs" && "♣"}
        {card.suit === "spades" && "♠"}
      </div>

      <div className="mt-1 text-xs text-stone-500">{card.points} pkt</div>
    </button>
  );
}
