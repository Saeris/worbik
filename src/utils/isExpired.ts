import { dateKeyRegex } from "./dateKeyRegex";
import type { DateKey } from "./getDateKey";
import { getPuzzleStart, PUZZLE_DAY } from "./isOpenForScores";

export const DAYS_UNTIL_EXPIRED = 2;

/** Whether a puzzle's day and the one after it have both passed, at which point a device has no more use for it */
export const isExpired = (
  puzzleID: DateKey,
  now: Date = new Date()
): boolean => {
  if (!dateKeyRegex.test(puzzleID)) {
    throw new Error(`Could not parse puzzleID: ${puzzleID}`);
  }

  return (
    now.getTime() - getPuzzleStart(puzzleID) > DAYS_UNTIL_EXPIRED * PUZZLE_DAY
  );
};
