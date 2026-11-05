import { default as wordlist } from "../words.json";
import { drawNRandom } from "./draw";
import type { PuzzleSchema } from "./puzzleSchema";
import type { Random } from "./randomInt";
import { PuzzleState } from "../state/PuzzleState";

export const generate = (
  { width = 5, height = 5 }: PuzzleSchema = {},
  random?: Random
): PuzzleState =>
  new PuzzleState([
    width,
    drawNRandom(
      Object.assign(new Array<string>(wordlist[width].length), wordlist[width]),
      height,
      random
    ).join(``)
  ]).randomize(undefined, undefined, random);
