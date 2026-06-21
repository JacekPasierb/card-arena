import {RoomView} from "@/features/rooms/RoomView";

type TablePageProps = {
  params: Promise<{code: string}>;
};

export default async function TablePage({params}: TablePageProps) {
  const {code} = await params;

  return <RoomView code={code.toUpperCase()} />;
}
