import { dateKeyRegex } from "./dateKeyRegex";
import { ROLLOVER_HOUR_UTC } from "./getPuzzleID";

/**
 * How long after a puzzle becomes playable a solve of it can still earn a
 * place on its leaderboard, in milliseconds.
 *
 * A leaderboard ranks the players who solved a puzzle while it was the
 * day's puzzle. Puzzles are kept for good and can be played at any time,
 * but a solve made on a later day doesn't count. This is the day itself
 * plus an hour's grace, so that a game which was under way when the day
 * ended, or a score that was held up by a lost connection, can still be
 * posted. A browser's clock can't be trusted to say when a puzzle was
 * solved, so the time that a score arrives is what gets checked.
 */
export const SCORING_WINDOW = (24 + 1) * 60 * 60 * 1000;

/** How long a puzzle is the day's puzzle for, in milliseconds */
export const PUZZLE_DAY = 24 * 60 * 60 * 1000;

/** The moment that the puzzle with the given ID became the day's puzzle, which isn't a number for an ID that isn't a puzzle's */
export const getPuzzleStart = (puzzleID: string): number => {
  const [month, day, year] = (dateKeyRegex.exec(puzzleID)?.groups?.date ?? ``)
    .split(`-`)
    .map(Number);

  return Date.UTC(year, month - 1, day, ROLLOVER_HOUR_UTC);
};

/** Whether a solve of the puzzle with the given ID can still earn a place on its leaderboard */
export const isOpenForScores = (
  puzzleID: string,
  now: Date = new Date()
): boolean =>
  // An ID that isn't a puzzle's has no day to have begun on, and is never open
  now.getTime() - getPuzzleStart(puzzleID) < SCORING_WINDOW;

/**
 * Whether the puzzle with the given ID was the day's puzzle at the given
 * moment.
 *
 * This is the rule that a player's device goes by: it only reports a solve
 * that was made during the puzzle's own day. The hour's grace beyond that
 * is for the report to arrive in, and isn't more time to solve the puzzle.
 */
export const isPuzzleDay = (
  puzzleID: string,
  at: Date = new Date()
): boolean => {
  const elapsed = at.getTime() - getPuzzleStart(puzzleID);

  return elapsed >= 0 && elapsed < PUZZLE_DAY;
};
