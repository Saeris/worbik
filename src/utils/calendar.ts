/** Names a day the way that puzzles are named for theirs: `MM-DD-YYYY`. Months are counted from zero, as `Date` counts them. */
export const toDayKey = (year: number, month: number, date: number): string =>
  `${String(month + 1).padStart(2, `0`)}-${String(date).padStart(2, `0`)}-${year}`;

/** How many days there are in a month */
export const getMonthLength = (year: number, month: number): number =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * Lays a month out as a calendar shows it: in weeks that begin on Sunday,
 * each of seven days. The days of a first or last week that belong to
 * another month are `null`.
 */
export const getWeeks = (
  year: number,
  month: number
): Array<Array<number | null>> => {
  const blanks = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const length = getMonthLength(year, month);
  const cells = Array.from(
    { length: Math.ceil((blanks + length) / 7) * 7 },
    (_, index) => {
      const date = index - blanks + 1;

      return date >= 1 && date <= length ? date : null;
    }
  );

  return Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7)
  );
};
