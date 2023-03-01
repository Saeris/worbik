import { dateKeyRegex } from "./dateKeyRegex";
import { getDateFromToday } from "./getDateFromToday";
import { isExpired } from "./isExpired";
import type { PuzzleSchema } from "./puzzleSchema";

/**
 * Generates a Edge Config Date Key for tomorrow's
 * new puzzles in the format:
 *
 * `${month}-${day}-${year}_${width}x${height}`
 */
export const getDateKey = (
  { width = 5, height = 5 }: PuzzleSchema = {},
  /** By default, date keys will be for the next calendar day */
  dayOffset: number = 1
): `${string}_${number}x${number}` =>
  `${getDateFromToday(dayOffset)}_${width}x${height}`;

export type DateKey = ReturnType<typeof getDateKey>;

/**
 * Tests whether the given key is both a valid `DateKey`
 * and is expired.
 */
export const filterExpiredDates = (key: string): boolean =>
  dateKeyRegex.test(key) && isExpired(key as DateKey);
