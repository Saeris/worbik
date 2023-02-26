import type { PuzzleSchema } from "./puzzleSchema";

export const DAYS_UNTIL_EXPIRED = 2 as const;

export const dateKeyRegex = /^(?<date>(?:\d+?-?)+)_(?<width>\d)x(?<height>\d)$/;

const toDateString = (date: Date): string =>
  date
    .toLocaleDateString(`en-US`, {
      month: `2-digit`,
      day: `2-digit`,
      year: `numeric`
    })
    .replaceAll(`/`, `-`);

export const getExpiredDateKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - DAYS_UNTIL_EXPIRED);
  return toDateString(date);
};

export const getDateKey = ({
  width = 5,
  height = 5
}: PuzzleSchema = {}): `${string}_${number}x${number}` =>
  `${toDateString(new Date())}_${width}x${height}`;

export type DateKey = ReturnType<typeof getDateKey>;

export const isExpiredKey = (key: DateKey): boolean => {
  const date = dateKeyRegex.exec(key);

  if (typeof date?.groups?.date !== `string`) {
    throw new Error(`Could not parse date key: ${key}`);
  }

  return (
    toDateString(new Date(date.groups.date.replace(`-`, `/`))) ===
    getExpiredDateKey()
  );
};

/**
 * Tests whether the given key is both a valid `DateKey`
 * and is expired.
 */
export const filterExpiredDates = (key: string): boolean =>
  dateKeyRegex.test(key) && isExpiredKey(key as DateKey);
