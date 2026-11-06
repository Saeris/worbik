import { getMonthLength, getWeeks, toDayKey } from "../calendar";

describe(`toDayKey`, () => {
  it(`names a day the way that a puzzle's ID does`, () => {
    // The days that a player played on are matched to a calendar by these names, so the two have to agree
    expect(toDayKey(2026, 10, 6)).toBe(`11-06-2026`);
    expect(toDayKey(2026, 0, 31)).toBe(`01-31-2026`);
  });
});

describe(`getMonthLength`, () => {
  it(`knows how long each month is`, () => {
    expect(getMonthLength(2026, 10)).toBe(30);
    expect(getMonthLength(2026, 11)).toBe(31);
  });

  it(`knows a leap year from one that isn't`, () => {
    expect(getMonthLength(2026, 1)).toBe(28);
    expect(getMonthLength(2028, 1)).toBe(29);
  });
});

describe(`getWeeks`, () => {
  it(`puts each day under the day of the week that it falls on`, () => {
    // November 2026 begins on a Sunday, and December on a Tuesday
    expect(getWeeks(2026, 10)[0]).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getWeeks(2026, 11)[0]).toStrictEqual([null, null, 1, 2, 3, 4, 5]);
  });

  it(`has every day of the month, once, and whole weeks`, () => {
    for (let month = 0; month < 12; month++) {
      const weeks = getWeeks(2026, month);
      const days = weeks.flat().filter((day) => day !== null);

      expect(weeks.every((week) => week.length === 7)).toBe(true);
      expect(days).toStrictEqual(
        Array.from({ length: getMonthLength(2026, month) }, (_, i) => i + 1)
      );
    }
  });

  it(`leaves the rest of the last week empty`, () => {
    // November 2026 ends on a Monday
    expect(getWeeks(2026, 10).at(-1)).toStrictEqual([
      29,
      30,
      null,
      null,
      null,
      null,
      null
    ]);
  });
});
