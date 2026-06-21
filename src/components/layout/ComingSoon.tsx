import Link from "next/link";

type ComingSoonProps = {
  title: string;
  description: string;
  icon?: string;
};

export function ComingSoon({title, description, icon = "✦"}: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mb-6 text-6xl text-yellow-500/30">{icon}</div>
      <h1 className="text-4xl font-black">{title}</h1>
      <p className="mt-3 text-gray-300">{description}</p>

      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
      >
        Wróć na stronę główną
      </Link>
    </div>
  );
}
