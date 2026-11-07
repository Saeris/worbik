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

/** A row or column of a board: the place of its first tile, how far apart its tiles are, and how many there are */
type Line = readonly [start: number, step: number, length: number];

/** Whether a line of tiles on one board is that same line rotated by one place, either way, on the other */
const isRotated = (
  [start, step, length]: Line,
  from: string,
  to: string
): boolean => {
  const at = (index: number): number => start + (index % length) * step;
  let left = true;
  let right = true;

  for (let index = 0; index < length && (left || right); index += 1) {
    const letter = to[at(index)];

    left &&= letter === from[at(index + 1)];
    right &&= letter === from[at(index + length - 1)];
  }

  return left || right;
};

/**
 * Whether one board follows from another by a single move.
 *
 * Every move a player makes is checked, and every move of a game is checked
 * again when it's submitted, so this has to be cheap: a Worker has only a few
 * milliseconds to spend on a request. A move only ever touches one line, which
 * has to hold every tile that changed, so only the row and the column of the
 * first of those can be it. A line of identical letters is still a move, which
 * changes nothing at all, so a board that's unchanged has to look at them all.
 */
export const isMove = (width: Size, from: string, to: string): boolean => {
  if (from.length !== to.length) return false;

  const height = from.length / width;
  const getRow = (row: number): Line => [row * width, 1, width];
  const getColumn = (column: number): Line => [column, width, height];
  let first = -1;
  let inRow = true;
  let inColumn = true;

  for (let tile = 0; tile < from.length; tile += 1) {
    if (from[tile] !== to[tile]) {
      if (first < 0) first = tile;
      inRow &&= Math.floor(tile / width) === Math.floor(first / width);
      inColumn &&= tile % width === first % width;
    }
  }

  if (first < 0) {
    return [
      ...Array.from({ length: height }, (_, row) => getRow(row)),
      ...Array.from({ length: width }, (_, column) => getColumn(column))
    ].some((line) => isRotated(line, from, to));
  }

  return (
    (inRow && isRotated(getRow(Math.floor(first / width)), from, to)) ||
    (inColumn && isRotated(getColumn(first % width), from, to))
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
