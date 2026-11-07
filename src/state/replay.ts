import type { Size } from "../utils/sizes.ts";

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

/** Every row and column of a board, each as the places of its tiles */
const getLines = (width: number, height: number): number[][] => [
  ...Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (__, column) => row * width + column)
  ),
  ...Array.from({ length: width }, (_, column) =>
    Array.from({ length: height }, (__, row) => row * width + column)
  )
];

/** Whether a line of tiles on one board is that same line rotated by one place, either way, on the other */
const isRotated = (line: number[], from: string, to: string): boolean =>
  [1, line.length - 1].some((by) =>
    line.every(
      (tile, index) => to[tile] === from[line[(index + by) % line.length]]
    )
  );

/**
 * Whether one board follows from another by a single move.
 *
 * Every move a player makes is checked, and every move of a game is checked
 * again when it's submitted, so this has to be cheap: a Worker has only a few
 * milliseconds to spend on a request. A move only ever touches one line, so
 * only a line holding every tile that changed needs looking at. A line of
 * identical letters is still a move, which changes nothing at all.
 */
export const isMove = (width: Size, from: string, to: string): boolean => {
  if (from.length !== to.length) return false;

  const changed = from
    .split(``)
    .flatMap((letter, tile) => (letter === to[tile] ? [] : [tile]));

  return getLines(width, from.length / width).some(
    (line) =>
      changed.every((tile) => line.includes(tile)) && isRotated(line, from, to)
  );
};

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
    if (!isMove(width, current, state)) return null;
    current = state;
  }

  return current === goal ? states.length : null;
};
