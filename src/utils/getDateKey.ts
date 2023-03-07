import { dateKeyRegex } from "./dateKeyRegex";
import { getDateFromToday } from "./getDateFromToday";
import { isExpired } from "./isExpired";
import type { PuzzleSchema } from "./puzzleSchema";
import type { Dimensions, Size } from "./sizes";
import type { DateString } from "./toDateString";

export type DateKey = `${DateString}_${Dimensions}`;

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
): DateKey =>
  `${getDateFromToday(dayOffset)}_${width as Size}x${height as Size}`;

/**
 * Tests whether the given key is both a valid `DateKey`
 * and is expired.
 */
export const filterExpiredDates = (key: string): boolean =>
  dateKeyRegex.test(key) && isExpired(key as DateKey);

/*
const sample = {
  "03-01-2023_5x5": null,
  "03-01-2023_5x6": null,
  "03-01-2023_5x7": null,
  "03-01-2023_5x8": null,
  "03-01-2023_6x5": null,
  "03-01-2023_6x6": null,
  "03-01-2023_6x7": null,
  "03-01-2023_6x8": null,
  "03-01-2023_7x5": null,
  "03-01-2023_7x6": null,
  "03-01-2023_7x7": null,
  "03-01-2023_7x8": null,
  "03-01-2023_8x5": null,
  "03-01-2023_8x6": null,
  "03-01-2023_8x7": null,
  "03-01-2023_8x8": null,
  "03-02-2023_5x5": null,
  "03-02-2023_5x6": null,
  "03-02-2023_5x7": null,
  "03-02-2023_5x8": null,
  "03-02-2023_6x5": null,
  "03-02-2023_6x6": null,
  "03-02-2023_6x7": null,
  "03-02-2023_6x8": null,
  "03-02-2023_7x5": null,
  "03-02-2023_7x6": null,
  "03-02-2023_7x7": null,
  "03-02-2023_7x8": null,
  "03-02-2023_8x5": null,
  "03-02-2023_8x6": null,
  "03-02-2023_8x7": null,
  "03-02-2023_8x8": null,
  "03-03-2023_5x5": null,
  "03-03-2023_5x6": null,
  "03-03-2023_5x7": null,
  "03-03-2023_5x8": null,
  "03-03-2023_6x5": null,
  "03-03-2023_6x6": null,
  "03-03-2023_6x7": null,
  "03-03-2023_6x8": null,
  "03-03-2023_7x5": null,
  "03-03-2023_7x6": null,
  "03-03-2023_7x7": null,
  "03-03-2023_7x8": null,
  "03-03-2023_8x5": null,
  "03-03-2023_8x6": null,
  "03-03-2023_8x7": null,
  "03-03-2023_8x8": null
};

const actual = Object.keys(sample).filter(filterExpiredDates); //?
*/
