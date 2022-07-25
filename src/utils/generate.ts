import { default as wordlist } from "../words.json";
import { randomize } from "./randomize";
import { drawNRandom } from "./draw";
import { parseChallenge } from "./parseChallenge";
import { checkSolution } from "./checkSolution";
import type { PuzzleSchema } from "./puzzleSchema";

export const generate = ({ size = 5, words = 5 }: PuzzleSchema = {}): {
  challenge: string;
  solution: string;
} => {
  const solution = `${size}${drawNRandom(
    Object.assign(new Array<string>(wordlist[size].length), wordlist[size]),
    words
  ).join(``)}`;
  const challenge = randomize(solution);
  const { moves } = parseChallenge(challenge);
  return {
    // Send the client a challenge that has been pre-checked
    // so as to show hints for correctly positioned initial
    // characters
    challenge: checkSolution(challenge, `${solution}${moves}`),
    solution
  };
};
