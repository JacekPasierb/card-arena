import {createDeck} from "@/games/tysiac/engine/createDeck";

export default function Home() {
  const deck = createDeck();

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-3xl font-bold">Card Arena</h1>

      <h2 className="mb-4 text-xl font-semibold">Talia do Tysiąca</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {deck.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border p-4 text-center shadow-sm"
          >
            <div className="text-2xl font-bold">{card.rank}</div>
            <div className="text-sm">{card.suit}</div>
            <div className="mt-2 text-xs text-gray-500">{card.points} pkt</div>
          </div>
        ))}
      </div>
    </main>
  );
}
