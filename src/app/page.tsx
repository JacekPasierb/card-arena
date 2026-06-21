import Link from "next/link";

type GameTile = {
  id: string;
  name: string;
  players: string;
  href?: string;
  available: boolean;
  icon: string;
};

const games: GameTile[] = [
  {
    id: "tysiac",
    name: "Tysiąc",
    players: "2-3 graczy",
    href: "/tysiac",
    available: true,
    icon: "♠",
  },
  {id: "remik", name: "Remik", players: "2-4 graczy", available: false, icon: "♥"},
  {id: "makao", name: "Makao", players: "2-6 graczy", available: false, icon: "♦"},
  {id: "pan", name: "Pan", players: "3-6 graczy", available: false, icon: "♣"},
];

const stats = [
  {label: "Graczy online", value: "1 248"},
  {label: "Aktywnych stołów", value: "87"},
  {label: "Turniejów dziś", value: "12"},
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-yellow-700/40 bg-gradient-to-br from-emerald-950 via-[#0a1a16] to-[#06110f] p-8 sm:p-12">
        <div className="absolute -right-10 -top-10 text-[180px] leading-none text-yellow-500/5 select-none">
          ♠
        </div>

        <div className="relative max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            Karciana arena online
          </p>

          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Graj w <span className="text-yellow-400">Tysiąca</span> ze
            znajomymi
          </h1>

          <p className="mt-4 text-lg text-gray-300">
            Twórz stoły, dołączaj do pokoi kodem i rywalizuj w turniejach
            pucharowych. Wszystko w przeglądarce, bez instalacji.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tysiac"
              className="rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
            >
              ⚔ Szybka gra
            </Link>

            <Link
              href="/turnieje"
              className="rounded-xl border border-yellow-600/50 bg-black/30 px-6 py-3 font-bold text-white transition hover:bg-black/50"
            >
              🏆 Turnieje pucharowe
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-yellow-400">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Wybierz grę</h2>
          <span className="text-sm text-gray-400">Więcej gier wkrótce</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => {
            const content = (
              <div
                className={`group relative h-44 overflow-hidden rounded-2xl border p-5 transition ${
                  game.available
                    ? "border-yellow-700/40 bg-black/30 hover:border-yellow-500 hover:bg-black/50"
                    : "border-white/5 bg-black/20 opacity-60"
                }`}
              >
                <span className="absolute -bottom-4 -right-2 text-7xl text-yellow-500/10 transition group-hover:text-yellow-500/20">
                  {game.icon}
                </span>

                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{game.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">{game.players}</p>
                  </div>

                  {game.available ? (
                    <span className="w-fit rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-bold text-emerald-300">
                      Graj teraz
                    </span>
                  ) : (
                    <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-gray-400">
                      Wkrótce
                    </span>
                  )}
                </div>
              </div>
            );

            if (game.available && game.href) {
              return (
                <Link key={game.id} href={game.href}>
                  {content}
                </Link>
              );
            }

            return <div key={game.id}>{content}</div>;
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Link
          href="/tysiac"
          className="rounded-2xl border border-yellow-700/40 bg-black/30 p-6 transition hover:border-yellow-500 hover:bg-black/50"
        >
          <h3 className="text-xl font-bold text-yellow-400">▦ Stoły online</h3>
          <p className="mt-2 text-gray-300">
            Przeglądaj publiczne stoły lub stwórz własny i zaproś znajomych
            kodem.
          </p>
        </Link>

        <Link
          href="/turnieje"
          className="rounded-2xl border border-yellow-700/40 bg-black/30 p-6 transition hover:border-yellow-500 hover:bg-black/50"
        >
          <h3 className="text-xl font-bold text-yellow-400">
            🏆 Turnieje pucharowe
          </h3>
          <p className="mt-2 text-gray-300">
            Zorganizuj drabinkę pucharową ze znajomymi i wyłoń mistrza Areny.
          </p>
        </Link>
      </section>
    </div>
  );
}
