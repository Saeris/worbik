import { getDateKey } from "../getDateKey";
import { isExpired } from "../isExpired";
import { getDateFromToday } from "../getDateFromToday";

describe(`isExpired`, () => {
  it(`correctly validates date strings`, () => {
    const invalid = isExpired(getDateKey());
    const valid = isExpired(`${getDateFromToday(-5)}_5x5`); //?

    expect(invalid).toBe(false);
    expect(valid).toBe(true);
    // @ts-expect-error
    expect(() => isExpired(`foo_5x5`)).toThrow(`Could not parse puzzleID: `);
  });
});

describe(`isExpired, in time`, () => {
  const puzzle = `03-02-2026_5x5`;

  it(`keeps a puzzle through its own day and the one after`, () => {
    // Its leaderboard stays open for an hour after its day, and a game has to last that long
    expect(isExpired(puzzle, new Date(`2026-03-03T10:30:00Z`))).toBe(false);
    expect(isExpired(puzzle, new Date(`2026-03-04T09:59:00Z`))).toBe(false);
  });

  it(`lets it go after that, at the same moment everywhere`, () => {
    expect(isExpired(puzzle, new Date(`2026-03-04T10:01:00Z`))).toBe(true);
  });
});
