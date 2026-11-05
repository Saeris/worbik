import { getPuzzleID } from "../getPuzzleID";

describe(`getPuzzleID`, () => {
  it(`changes over to the next day's puzzle at 10 AM UTC`, () => {
    // Players around the world must all be served the same puzzle at any given moment
    expect(getPuzzleID({}, new Date(`2026-03-02T09:59:59.999Z`))).toBe(
      `03-01-2026_5x5`
    );
    expect(getPuzzleID({}, new Date(`2026-03-02T10:00:00.000Z`))).toBe(
      `03-02-2026_5x5`
    );
  });

  it(`is unaffected by the timezone a moment is expressed in`, () => {
    // 6 PM on Dec 31st in Los Angeles is 2 AM on Jan 1st UTC, which is still before the changeover
    expect(getPuzzleID({}, new Date(`2026-12-31T18:00:00-08:00`))).toBe(
      `12-31-2026_5x5`
    );
  });

  it(`identifies puzzles by their size`, () => {
    const now = new Date(`2026-03-02T12:00:00Z`);

    expect(getPuzzleID({ width: 6, height: 8 }, now)).toBe(`03-02-2026_6x8`);
    expect(getPuzzleID({ width: 7 }, now)).toBe(`03-02-2026_7x5`);
  });
});
