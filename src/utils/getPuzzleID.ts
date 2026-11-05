import type { DateKey } from "./getDateKey";
import type { PuzzleSchema } from "./puzzleSchema";
import { toDateString } from "./toDateString";

/**
 * The hour of the day (UTC) at which a new day's puzzles become available.
 *
 * 10:00 AM UTC is 2 AM in PDX, so puzzles change over while North America sleeps.
 */
export const ROLLOVER_HOUR_UTC = 10;

/**
 * Gets the ID of the puzzle of the given size that is playable at the given
 * moment. This is purely a function of the clock, so a puzzle "day" begins and
 * ends at the same instant everywhere, regardless of any timezones.
 */
export const getPuzzleID = (
  { width = 5, height = 5 }: PuzzleSchema = {},
  now: Date = new Date()
): DateKey =>
  `${toDateString(new Date(now.getTime() - ROLLOVER_HOUR_UTC * 60 * 60 * 1000), `UTC`)}_${width}x${height}`;
