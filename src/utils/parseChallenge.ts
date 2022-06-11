import { group } from "./group";
import type { Matrix2D } from "./types";

export const parseChallenge = (
  str: string
): {
  challenge: Matrix2D<string>;
  length: number;
  words: number;
  moves: number;
} => {
  const parsed = /^(?<length>\d+)(?<challenge>[a-z]+)(?<moves>\d+)$/i.exec(str);
  if (
    !parsed?.groups ||
    !parsed.groups.challenge ||
    !parsed.groups.length ||
    !parsed.groups.moves
  ) {
    throw new Error(`Could not parse challenge string!`);
  }

  const length = parseInt(parsed.groups.length, 10);
  const challenge = group(parsed.groups.challenge.split(``), length);

  return {
    challenge,
    length,
    words: challenge.length,
    moves: parseInt(parsed.groups.moves, 10)
  };
};
