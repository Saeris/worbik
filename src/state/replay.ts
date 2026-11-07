import type { Size } from "../utils/sizes.ts";
import { Grid } from "./Grid.ts";

/**
 * The most moves that a game is allowed to take and still be replayed.
 *
 * Puzzles are scrambled with no more than 250 moves, so this is far beyond
 * what solving one should need, while still putting a bound on how much work
 * replaying a game can be made to cost.
 */
export const MAX_MOVES = 2000;

/**
 * The most guesses that can be checked at once. They travel in the address
 * of the request, which has a limit of its own, and this is well within it
 * for the largest of boards.
 */
export const MAX_GUESSES = 100;

/** Every state that can be reached from the given one in a single move */
const next = (state: string, width: Size): Set<string> => {
  const { height } = new Grid(state, width);
  const moves = new Set<string>();

  for (let row = 0; row < height; row++) {
    moves.add(new Grid(state, width).rotateRowLeft(row).toString());
    moves.add(new Grid(state, width).rotateRowRight(row).toString());
  }

  for (let column = 0; column < width; column++) {
    moves.add(new Grid(state, width).rotateColUp(column).toString());
    moves.add(new Grid(state, width).rotateColDown(column).toString());
  }

  return moves;
};

/** Whether one board follows from another by a single move */
export const isMove = (width: Size, from: string, to: string): boolean =>
  next(from, width).has(to);

/**
 * Replays a game from the states its board went through, and returns how
 * many moves it took to solve the puzzle, or `null` if it isn't a game that
 * could have been played.
 *
 * A score counts for nothing if it's only the player's word for it, so
 * this is how a score is earned: the game has to begin where the puzzle
 * does, every state has to follow from the one before it by a single move,
 * and it has to arrive at the puzzle's solution.
 *
 * Moves made after the puzzle was first solved are ignored, as the game is
 * over at that point.
 */
export const replay = (
  width: Size,
  challenge: string,
  solution: string,
  history: readonly string[]
): number | null => {
  const [start, ...states] = history.map((state) => state.toLowerCase());
  const goal = solution.toLowerCase();

  if (start !== challenge.toLowerCase() || states.length > MAX_MOVES) {
    return null;
  }

  let current = start;

  for (const [index, state] of states.entries()) {
    if (current === goal) return index;
    if (!next(current, width).has(state)) return null;
    current = state;
  }

  return current === goal ? states.length : null;
};
