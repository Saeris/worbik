import { parseSize } from "./parseSize";

/** How far a player has got with a puzzle */
export interface Progress {
  /** How many moves they have made */
  readonly moves: number;
  /** Whether those moves solved it */
  readonly solved: boolean;
}

/**
 * Reads how far a player has got with a puzzle from the game that their
 * device saved for it, or `null` if they haven't made a move.
 *
 * A saved game is the width of its board, every state that the board has
 * been through, and the letters that are known to be in place, in that
 * order and separated by `|`. The puzzle is solved once every letter is
 * known to be in place, in the state that the board was left in.
 *
 * A game that was played on another device has only its first and last
 * states, and ends with how many moves it took.
 */
export const getProgress = (saved: string | null): Progress | null => {
  const [, history = ``, hints = ``, reported = ``] = saved?.split(`|`) ?? [];
  const states = history.split(`,`);
  const moves = reported ? Number(reported) : states.length - 1;

  if (moves < 1) return null;

  return { moves, solved: hints.toLowerCase() === states.at(-1) };
};

/** What a saved game holds, once it's been found to be one */
export interface SavedGame {
  /** Every state that the board has been through, separated by commas */
  readonly history: string;
  /** The letters that are known to be in place */
  readonly hints: string;
  /** How many moves it took, if it was played on another device */
  readonly reported: string;
  /** The server's note of where the game is, which a game saved before they were kept doesn't have */
  readonly from?: string;
}

/**
 * Reads a saved game of the puzzle that begins with the given board, or
 * `null` if that isn't what's saved.
 *
 * Storage belongs to the browser, and can hold anything by the time it's read
 * back: nothing that wouldn't fit on the board is let anywhere near it.
 */
export const readSavedGame = (
  saved: string | null,
  start: string
): SavedGame | null => {
  const [, history = ``, hints = ``, reported = ``, from] =
    saved?.split(`|`) ?? [];
  const states = history.split(`,`);

  return states[0] === start.toLowerCase() &&
    states.every((state) => state.length === start.length) &&
    hints.length === start.length
    ? { history, hints, reported, ...(from && { from }) }
    : null;
};

/** What is known of a game that was played on another device */
export interface PostedGame {
  /** The ID of the puzzle that was solved */
  readonly puzzle: string;
  /** How many moves it was solved in */
  readonly moves: number;
  /** The scrambled letters that it's played from */
  readonly challenge: string;
  /** The letters that it was solved to */
  readonly solution: string;
}

/**
 * Writes a game that was played on another device the way that a game
 * played on this one is saved, so that it opens as solved. Its moves aren't
 * known, so it goes straight from how the puzzle began to how it ended.
 */
export const toSavedGame = ({
  puzzle,
  moves,
  challenge,
  solution
}: PostedGame): string => {
  const { width } = parseSize(puzzle.split(`_`)[1]);

  return [
    width,
    `${challenge.toLowerCase()},${solution.toLowerCase()}`,
    solution.toUpperCase(),
    moves
  ].join(`|`);
};

/** Spells out a length of time that is under a day, to the minute: "6 h 12 min" */
export const formatCountdown = (milliseconds: number): string => {
  const minutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);

  return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
};
