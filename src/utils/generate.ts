import { default as wordlist } from "../words.json";
import { randomize } from "./randomize";
import { drawNRandom } from "./draw";
import { parseChallenge } from "./parseChallenge";
import { checkSolution } from "./checkSolution";

export const generate = (
  length: number = 5,
  count: number = 5
): {
  challenge: string;
  solution: string;
} => {
  const solution = `${length}${drawNRandom(
    Object.assign(new Array<string>(), wordlist[length]),
    count
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
