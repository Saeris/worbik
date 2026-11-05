import { dateKeyRegex } from "./dateKeyRegex";
import { ROLLOVER_HOUR_UTC } from "./getPuzzleID";

/**
 * How long after a puzzle becomes playable a solve of it can still earn a
 * place on its leaderboard, in milliseconds.
 *
 * A leaderboard ranks the players who solved a puzzle while it was the
 * day's puzzle. Puzzles are kept for good and can be played at any time,
 * but by then their answers have had time to get around. This is longer
 * than the day itself so that a game which was left open in a browser tab
 * overnight can still be finished and posted.
 */
export const SCORING_WINDOW = 3 * 24 * 60 * 60 * 1000;

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
