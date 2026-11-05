import { getPuzzleID } from "../getPuzzleID";
import { isOpenForScores, SCORING_WINDOW } from "../isOpenForScores";

const puzzle = `03-02-2026_5x5`;
/** The moment that the puzzle above became the day's puzzle */
const began = new Date(`2026-03-02T10:00:00Z`);
const after = (ms: number): Date => new Date(began.getTime() + ms);

describe(`isOpenForScores`, () => {
  it(`is open for the puzzle that is being played today`, () => {
    // Whatever else changes, a player has to be able to post the solve they just made
    const now = new Date(`2026-07-19T23:30:00Z`);

    expect(isOpenForScores(getPuzzleID({}, now), now)).toBe(true);
    expect(
      isOpenForScores(getPuzzleID({ width: 8, height: 6 }, now), now)
    ).toBe(true);
  });

  it(`stays open past the end of the puzzle's day`, () => {
    // A game left open in a tab overnight is finished on the next day, and should still count
    expect(isOpenForScores(puzzle, after(36 * 60 * 60 * 1000))).toBe(true);
    expect(isOpenForScores(puzzle, after(SCORING_WINDOW - 1))).toBe(true);
  });

  it(`closes once a puzzle's answer has had time to get around`, () => {
    // Puzzles are kept for good, so without this an old leaderboard could be topped at any time
    expect(isOpenForScores(puzzle, after(SCORING_WINDOW))).toBe(false);
    expect(isOpenForScores(puzzle, new Date(`2027-03-02T10:00:00Z`))).toBe(
      false
    );
  });

  it(`is never open for an ID that isn't a puzzle's`, () => {
    expect(isOpenForScores(`not-a-puzzle`, began)).toBe(false);
    expect(isOpenForScores(``, began)).toBe(false);
  });
});
