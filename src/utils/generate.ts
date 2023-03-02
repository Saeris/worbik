import { default as wordlist } from "../words.json";
import { drawNRandom } from "./draw";
import type { PuzzleSchema } from "./puzzleSchema";
import { PuzzleState } from "./PuzzleState";

export const generate = ({
  width = 5,
  height = 5
}: PuzzleSchema = {}): PuzzleState =>
  new PuzzleState(
    `${width}_${drawNRandom(
      Object.assign(new Array<string>(wordlist[width].length), wordlist[width]),
      height
    ).join(``)}`
  ).randomize();
