import * as v from "valibot";
import { dateKeyRegex } from "./dateKeyRegex";
import { filterExpiredDates } from "./getDateKey";

/**
 * What a device remembers of each player's games.
 *
 * Everyone who uses a device is a player of their own, and that includes
 * whoever is using it without signing in. So what one of them has done
 * doesn't count for another, whether that's a game under way or a score
 * having been posted. Each is identified by their DID, or by nothing at all
 * if they aren't signed in.
 */

/** What a player's device remembers of having solved a puzzle */
export interface Solve {
  /** When the puzzle was solved, in milliseconds since the epoch */
  readonly at: number;
  /** Whether the solve has been posted to the puzzle's leaderboard */
  readonly posted?: boolean;
}

const schema = v.record(
  v.string(),
  v.object({ at: v.number(), posted: v.optional(v.boolean()) })
);

/** Where a player's saved game of a puzzle is kept */
export const getGameKey = (puzzleID: string, did?: string): string =>
  did ? `${did}/${puzzleID}` : puzzleID;

/** The ID of the puzzle that a saved game is of, from where it's kept */
export const getPuzzleOfKey = (key: string): string =>
  key.split(`/`).at(-1) ?? key;

/** Where a player's solves are kept */
const getSolvesKey = (did?: string): string =>
  did ? `worbik:solves:${did}` : `worbik:solves`;

const read = (did?: string): Record<string, Solve> => {
  try {
    return v.parse(
      schema,
      JSON.parse(localStorage.getItem(getSolvesKey(did)) ?? `{}`)
    );
  } catch {
    // Nothing is remembered when storage is unavailable, or holds something else
    return {};
  }
};

const write = (solves: Record<string, Solve>, did?: string): void => {
  try {
    localStorage.setItem(
      getSolvesKey(did),
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
  did?: string,
  at: number = Date.now()
): Solve => {
  const solves = read(did);
  const solve = solves[puzzleID] ?? { at };

  if (!(puzzleID in solves)) write({ ...solves, [puzzleID]: solve }, did);

  return solve;
};

/** Notes that the solve of a puzzle has been posted to its leaderboard, so that it isn't posted again */
export const markPosted = (puzzleID: string, did?: string): void => {
  const solves = read(did);
  const solve = solves[puzzleID] ?? { at: Date.now() };

  write({ ...solves, [puzzleID]: { ...solve, posted: true } }, did);
};

/**
 * Hands the games on this device that nobody has signed in for over to the
 * player who just signed in.
 *
 * That's how a score gets posted: a player solves a puzzle first and signs
 * in afterwards, so the game has to come with them. They take anything that
 * they don't have a game of their own for, and the rest stays where it is.
 */
export const adoptGames = (did: string): void => {
  try {
    for (const key of Object.keys(localStorage)) {
      const target = getGameKey(key, did);

      if (dateKeyRegex.test(key) && localStorage.getItem(target) === null) {
        localStorage.setItem(target, localStorage.getItem(key) ?? ``);
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Without storage there are no games to hand over
    return;
  }

  const unclaimed = read();
  const mine = read(did);
  const adopted = Object.keys(unclaimed).filter((id) => !(id in mine));

  write(
    {
      ...mine,
      ...Object.fromEntries(adopted.map((id) => [id, unclaimed[id]]))
    },
    did
  );
  write(
    Object.fromEntries(
      Object.entries(unclaimed).filter(([id]) => !adopted.includes(id))
    )
  );
};

/** Forgets everything that a player has done on this device */
export const forgetGames = (did: string): void => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`${did}/`)) localStorage.removeItem(key);
    }

    localStorage.removeItem(getSolvesKey(did));
  } catch {
    // Without storage there is nothing to forget
  }
};
