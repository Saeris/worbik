import { group } from "./group";
import type { Matrix2D } from "./types";

export const parseSolution = (
  str: string
): { solution: Matrix2D<string>; length: number } => {
  const parsed = /^(?<length>\d+)(?<init>[a-z]+)$/i.exec(str);
  if (!parsed?.groups || !parsed.groups.init || !parsed.groups.length) {
    throw new Error(`Could not parse solution string!`);
  }

  const length = parseInt(parsed.groups.length, 10);

  return {
    solution: group(parsed.groups.init.split(``), length),
    length
  };
};
