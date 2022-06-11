import { default as wordlist } from "../../words.json";
import { randomize } from "./randomize";
import { drawNRandom } from "./draw";

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
  ).join(``)}`; //?
  return {
    challenge: randomize(solution),
    solution
  };
};

generate(); //?
