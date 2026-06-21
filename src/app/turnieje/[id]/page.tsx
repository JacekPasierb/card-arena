import {BracketView} from "@/features/competitions/BracketView";

type TournamentPageProps = {
  params: Promise<{id: string}>;
};

export default async function TournamentPage({params}: TournamentPageProps) {
  const {id} = await params;

  return <BracketView id={id} />;
}
