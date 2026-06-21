import type {Player} from "../types/player";

export const players: Player[] = [
  {id: "player-one", name: "Gracz 1"},
  {id: "player-two", name: "Gracz 2"},
  {id: "player-three", name: "Gracz 3"},
];

export function getRandomPlayer(players: Player[]): Player {
  const randomIndex = Math.floor(Math.random() * players.length);

  return players[randomIndex];
}
