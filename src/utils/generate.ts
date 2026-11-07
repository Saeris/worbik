import { default as wordlist } from "../words.json";
import { drawNRandom } from "./draw";
import type { PuzzleSchema } from "./puzzleSchema";
import type { Random } from "./randomInt";
import { PuzzleState } from "../state/PuzzleState";

/**
 * Makes a puzzle: words drawn for its board, scrambled by a number of moves.
 *
 * How many moves is left to chance unless `scramble` says, which is only
 * for development, where a puzzle that takes one move to solve is worth
 * more than a fair one.
 */
export const generate = (
  { width = 5, height = 5 }: PuzzleSchema = {},
  random?: Random,
  scramble?: number
): PuzzleState =>
  new PuzzleState([
    width,
    drawNRandom([...wordlist[width]], height, random).join(``)
  ]).randomize(scramble, scramble, random);
