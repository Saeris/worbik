import { getPuzzleSize, parsePuzzleID } from "../parsePuzzleID";

describe(`parsePuzzleID`, () => {
  it(`finds the parts of a puzzle's ID`, () => {
    expect(parsePuzzleID(`11-07-2026_6x8`)).toStrictEqual({
      day: `11-07-2026`,
      dimensions: `6x8`,
      label: `6×8`
    });
  });
});

describe(`getPuzzleSize`, () => {
  it(`tells a board's width from its height`, () => {
    // Replaying a game goes by its width, so a mix-up would turn away every game on a board that isn't square
    expect(getPuzzleSize(`11-07-2026_6x8`)).toStrictEqual({
      width: 6,
      height: 8
    });
  });

  it(`turns away a size that there are no puzzles of`, () => {
    expect(() => getPuzzleSize(`11-07-2026_3x2`)).toThrow(
      `Received invalid size value`
    );
  });
});
