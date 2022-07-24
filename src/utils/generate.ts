import { default as wordlist } from "../words.json";
import { randomize } from "./randomize";
import { drawNRandom } from "./draw";
import { parseChallenge } from "./parseChallenge";
import { checkSolution } from "./checkSolution";

export const generate = (
  size: number = 5,
  words: number = 5
): {
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
