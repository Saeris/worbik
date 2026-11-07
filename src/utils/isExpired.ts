import { dateKeyRegex } from "./dateKeyRegex";
import { getPuzzleStart, PUZZLE_DAY } from "./isOpenForScores";

const DAYS_UNTIL_EXPIRED = 2;

/** Whether a puzzle's day and the one after it have both passed, at which point a device has no more use for it */
export const isExpired = (
  puzzleID: string,
  now: Date = new Date()
): boolean => {
  if (!dateKeyRegex.test(puzzleID)) {
    throw new Error(`Could not parse puzzleID: ${puzzleID}`);
  }

  return (
    now.getTime() - getPuzzleStart(puzzleID) > DAYS_UNTIL_EXPIRED * PUZZLE_DAY
  );
};

/** Whether the given key is that of a puzzle, and has expired. Anything else that's kept on a device is left alone. */
export const filterExpiredDates = (key: string): boolean =>
  dateKeyRegex.test(key) && isExpired(key);
