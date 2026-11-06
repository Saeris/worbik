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

/** Whether a solve of the puzzle with the given ID can still earn a place on its leaderboard */
export const isOpenForScores = (
  puzzleID: string,
  now: Date = new Date()
): boolean => {
  const [month, day, year] = (dateKeyRegex.exec(puzzleID)?.groups?.date ?? ``)
    .split(`-`)
    .map(Number);
  const began = Date.UTC(year, month - 1, day, ROLLOVER_HOUR_UTC);

  // An ID that isn't a puzzle's has no day to have begun on, and is never open
  return now.getTime() - began < SCORING_WINDOW;
};
