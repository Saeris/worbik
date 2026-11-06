import * as v from "valibot";
import { filterExpiredDates } from "./getDateKey";

/** What a player's device remembers of having solved a puzzle */
export interface Solve {
  /** When the puzzle was solved, in milliseconds since the epoch */
  readonly at: number;
  /** Whether the solve has been posted to the puzzle's leaderboard */
  readonly posted?: boolean;
}

const KEY = `worbik:solves`;

const schema = v.record(
  v.string(),
  v.object({ at: v.number(), posted: v.optional(v.boolean()) })
);

const read = (): Record<string, Solve> => {
  try {
    return v.parse(schema, JSON.parse(localStorage.getItem(KEY) ?? `{}`));
  } catch {
    // Nothing is remembered when storage is unavailable, or holds something else
    return {};
  }
};

const write = (solves: Record<string, Solve>): void => {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        Object.fromEntries(
          // Puzzles are forgotten along with their saved games, once they're a couple of days old
          Object.entries(solves).filter(([id]) => !filterExpiredDates(id))
        )
      )
    );
  } catch {
    // A solve that can't be remembered is still one that was made
  }
};

/**
 * Notes that a puzzle has been solved, and returns what is remembered of it.
 *
 * Only the first time counts. A solved puzzle is found solved again every
 * time it's opened, and none of those later moments are when it was solved.
 */
export const recordSolve = (
  puzzleID: string,
  at: number = Date.now()
): Solve => {
  const solves = read();
  const solve = solves[puzzleID] ?? { at };

  if (!(puzzleID in solves)) write({ ...solves, [puzzleID]: solve });

  return solve;
};

/** Notes that the solve of a puzzle has been posted to its leaderboard, so that it isn't posted again */
export const markPosted = (puzzleID: string): void => {
  const solves = read();
  const solve = solves[puzzleID] ?? { at: Date.now() };

  write({ ...solves, [puzzleID]: { ...solve, posted: true } });
};
