import { default as wordlist } from "../words.json";
import { drawNRandom } from "./draw";
import type { PuzzleSchema } from "./puzzleSchema";
import { PuzzleState } from "./PuzzleState";

export const generate = ({
  size = 5,
  words = 5
}: PuzzleSchema = {}): PuzzleState =>
  new PuzzleState(
    `${size}${drawNRandom(
      Object.assign(new Array<string>(wordlist[size].length), wordlist[size]),
      words
    ).join(``)}`
  ).randomize();
