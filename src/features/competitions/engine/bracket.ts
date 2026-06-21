import type {Match, Participant} from "../types";

function nextPowerOfTwo(value: number): number {
  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return Math.max(size, 2);
}

export function getRoundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;

  if (fromEnd === 0) return "Finał";
  if (fromEnd === 1) return "Półfinał";
  if (fromEnd === 2) return "Ćwierćfinał";

  const matchesInRound = 2 ** fromEnd;
  return `1/${matchesInRound}`;
}

export function getTotalRounds(participantCount: number): number {
  return Math.log2(nextPowerOfTwo(participantCount));
}

/**
 * Buduje pe\u0142n\u0105 drabink\u0119 pucharow\u0105 (single elimination).
 * Brakuj\u0105ce miejsca to "wolne losy" (bye) \u2014 gracz przechodzi dalej automatycznie.
 */
export function generateBracket(participants: Participant[]): Match[] {
  const bracketSize = nextPowerOfTwo(participants.length);
  const totalRounds = Math.log2(bracketSize);
  const matches: Match[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round;

    for (let position = 0; position < matchesInRound; position++) {
      matches.push({
        id: `r${round}-m${position}`,
        round,
        position,
        playerAId: null,
        playerBId: null,
        winnerId: null,
      });
    }
  }

  const firstRound = matches.filter((match) => match.round === 1);

  firstRound.forEach((match, index) => {
    match.playerAId = participants[index * 2]?.id ?? null;
    match.playerBId = participants[index * 2 + 1]?.id ?? null;
  });

  return resolveByes(matches, totalRounds);
}

/** Automatycznie awansuje graczy, kt\u00f3rzy nie maj\u0105 przeciwnika (bye). */
function resolveByes(matches: Match[], totalRounds: number): Match[] {
  const next = matches.map((match) => ({...match}));

  for (let round = 1; round < totalRounds; round++) {
    const roundMatches = next.filter((match) => match.round === round);

    for (const match of roundMatches) {
      if (match.winnerId) continue;

      const hasA = Boolean(match.playerAId);
      const hasB = Boolean(match.playerBId);

      if (hasA !== hasB) {
        const winnerId = (match.playerAId ?? match.playerBId) as string;
        applyWinnerInPlace(next, match, winnerId);
      }
    }
  }

  return next;
}

function applyWinnerInPlace(matches: Match[], match: Match, winnerId: string) {
  match.winnerId = winnerId;

  const nextMatch = matches.find(
    (candidate) =>
      candidate.round === match.round + 1 &&
      candidate.position === Math.floor(match.position / 2)
  );

  if (!nextMatch) return;

  if (match.position % 2 === 0) {
    nextMatch.playerAId = winnerId;
  } else {
    nextMatch.playerBId = winnerId;
  }
}

/** Ustawia zwyci\u0119zc\u0119 meczu i propaguje go do kolejnej rundy. Zwraca now\u0105 tablic\u0119. */
export function setMatchWinner(
  matches: Match[],
  matchId: string,
  winnerId: string
): Match[] {
  const next = matches.map((match) => ({...match}));
  const target = next.find((match) => match.id === matchId);

  if (!target) return matches;
  if (target.playerAId !== winnerId && target.playerBId !== winnerId) {
    return matches;
  }

  applyWinnerInPlace(next, target, winnerId);

  return next;
}

export function getChampionId(matches: Match[]): string | null {
  if (matches.length === 0) return null;

  const finalRound = Math.max(...matches.map((match) => match.round));
  const finalMatch = matches.find((match) => match.round === finalRound);

  return finalMatch?.winnerId ?? null;
}
