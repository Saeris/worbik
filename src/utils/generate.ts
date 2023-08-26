import { default as wordlist } from "../words.json";
import { drawNRandom } from "./draw.ts";
import type { PuzzleSchema } from "./puzzleSchema.ts";
import { PuzzleState } from "./PuzzleState.ts";

export const generate = ({
  width = 5,
  height = 5
}: PuzzleSchema = {}): PuzzleState =>
  new PuzzleState([
    width,
    drawNRandom(
      Object.assign(new Array<string>(wordlist[width].length), wordlist[width]),
      height
    ).join(``)
  ]).randomize();
