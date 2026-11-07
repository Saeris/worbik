import { getPuzzleID } from "../getPuzzleID";
import { filterExpiredDates, isExpired } from "../isExpired";
import type { PuzzleSchema } from "../puzzleSchema";

/** The ID of the puzzle of a given size from a number of days ago */
const daysAgo = (days: number, size?: PuzzleSchema): string =>
  getPuzzleID(size, new Date(Date.now() - days * 24 * 60 * 60 * 1000));

describe(`isExpired`, () => {
  it(`correctly validates date strings`, () => {
    expect(isExpired(daysAgo(0))).toBe(false);
    expect(isExpired(daysAgo(5))).toBe(true);
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

describe(`filterExpiredDates`, () => {
  it(`picks out old puzzles from everything else that's kept on a device`, () => {
    // Whatever it picks is deleted, so nothing but an expired puzzle can ever be among them
    const old = [daysAgo(5), daysAgo(5, { width: 6, height: 6 })];
    const kept = [`theme`, `worbik:solves`, daysAgo(0), daysAgo(1)];

    expect([...kept, ...old].filter(filterExpiredDates)).toStrictEqual(old);
  });
});
