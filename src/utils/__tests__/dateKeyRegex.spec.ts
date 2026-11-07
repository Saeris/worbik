import { dateKeyRegex } from "../dateKeyRegex";

describe(`dateKeyRegex`, () => {
  it(`gives up on a long ID straight away`, () => {
    // These come from anyone, and the pattern this replaced took a second over thirty digits, doubling with every two more
    expect(dateKeyRegex.test(`${`1`.repeat(100_000)}!`)).toBe(false);
  });

  it(`only takes the IDs that puzzles really have`, () => {
    expect(dateKeyRegex.test(`11-07-2026_5x5`)).toBe(true);
    expect(dateKeyRegex.test(`1-7-2026_5x5`)).toBe(false);
    expect(dateKeyRegex.test(`11-07-2026-99_5x5`)).toBe(false);
  });
});
