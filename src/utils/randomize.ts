import { getNextState } from "./getNextState";
import { range } from "./range";
import type { Matrix2D } from "./types";

const randomInt = (min: number, max: number): number =>
  // eslint-disable-next-line no-bitwise
  (Math.random() * max + min) | 0;
const randomBool = (): boolean => Boolean(Math.random() < 0.5);

export const randomize = (
  init: Matrix2D<string>
): { state: Matrix2D<string>; moves: number } => {
  const size = init[0].length - 1;
  const words = init.length - 1;
  // Generate a random number of moves between our bounds
  const moves = randomInt(25, 250);
  // Then simulate user inputs to take our initial solved
  // state to randomize it into an unsolved state
  return {
    state: range(moves).reduce((state) => {
      // true = horizontal / word size, false = vertical / num of words
      const axis = randomBool();
      const dir = randomBool();
      const pos = randomInt(0, axis ? size : words);
      return getNextState(state, pos, dir, axis);
    }, init),
    moves
  };
};
