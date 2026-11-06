import { getPuzzleID } from "../getPuzzleID";
import {
  isOpenForScores,
  isPuzzleDay,
  SCORING_WINDOW
} from "../isOpenForScores";

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

  it(`stays open for a short while after the puzzle's day ends`, () => {
    // A game that was under way when the day ended shouldn't be thrown away for finishing minutes late
    const day = 24 * 60 * 60 * 1000;

    expect(isOpenForScores(puzzle, after(day + 30 * 60 * 1000))).toBe(true);
    expect(isOpenForScores(puzzle, after(SCORING_WINDOW - 1))).toBe(true);
  });

  it(`closes to solves that are made on a later day`, () => {
    // A leaderboard ranks the players of that day, and a streak is only kept by playing each day's puzzle on its day
    expect(isOpenForScores(puzzle, after(SCORING_WINDOW))).toBe(false);
    expect(isOpenForScores(puzzle, after(36 * 60 * 60 * 1000))).toBe(false);
    expect(isOpenForScores(puzzle, new Date(`2027-03-02T10:00:00Z`))).toBe(
      false
    );
  });

  it(`is never open for an ID that isn't a puzzle's`, () => {
    expect(isOpenForScores(`not-a-puzzle`, began)).toBe(false);
    expect(isOpenForScores(``, began)).toBe(false);
  });
});

describe(`isPuzzleDay`, () => {
  const day = 24 * 60 * 60 * 1000;

  it(`is the puzzle's day from the moment it becomes the day's puzzle`, () => {
    expect(isPuzzleDay(puzzle, began)).toBe(true);
    expect(isPuzzleDay(puzzle, after(day - 1))).toBe(true);
  });

  it(`isn't the puzzle's day once the next day's puzzle takes over`, () => {
    // The grace that the server allows is for a score to arrive in, and isn't more time to solve the puzzle
    expect(isPuzzleDay(puzzle, after(day))).toBe(false);
    expect(isPuzzleDay(puzzle, after(day + 30 * 60 * 1000))).toBe(false);
  });

  it(`isn't the puzzle's day before it begins`, () => {
    // A device whose clock is behind hasn't solved tomorrow's puzzle early
    expect(isPuzzleDay(puzzle, after(-1))).toBe(false);
  });

  it(`is never the day of something that isn't a puzzle`, () => {
    expect(isPuzzleDay(`not a puzzle`, began)).toBe(false);
  });

  it(`agrees with which puzzle is being served`, () => {
    // The puzzle a player is given has to be one that their device will report a solve of
    const now = new Date(`2026-07-19T23:30:00Z`);

    expect(isPuzzleDay(getPuzzleID({}, now), now)).toBe(true);
  });
});
