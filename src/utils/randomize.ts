import { getNextState } from "./getNextState";
import { parseSolution } from "./parseSolution";
import { range } from "./range";
import type { Matrix2D } from "./types";

const randomInt = (min: number, max: number): number =>
  // eslint-disable-next-line no-bitwise
  (Math.random() * max + min) | 0;
const randomBool = (): boolean => Boolean(Math.random() < 0.5);

export const randomize = (init: string): string => {
  // Generate a random number of moves between our bounds
  const moves = randomInt(25, 250);
  const { solution, length } = parseSolution(init);
  const size = solution[0].length - 1;
  const words = solution.length - 1;
  // Then simulate user inputs to take our initial solved
  // state to randomize it into an unsolved state
  return `${length}${range(moves)
    .reduce<Matrix2D<string>>((state) => {
      // true = horizontal / word size, false = vertical / num of words
      const axis = randomBool();
      const dir = randomBool();
      const pos = randomInt(0, axis ? size : words);
      return getNextState(state, pos, dir, axis);
    }, solution)
    .flat()
    .join(``)}${moves}`;
};
