import { db, desc, eq, sql } from "void/db";
import { scores } from "#db/schema";
import { place } from "./scores";

/** How many of a player's latest results a profile lists */
const RECENT = 5;

/**
 * What a player has done, as far as leaderboards know: the scores that
 * they have posted. All of it is already public, one leaderboard at a time,
 * so a profile is only a different way of looking at it.
 */
export interface Profile {
  /** The handle that the player's latest score was posted under */
  readonly handle: string | null;
  /** Every day that the player solved a puzzle on, as `MM-DD-YYYY`, and how many of that day's puzzles they solved */
  readonly days: Array<{ day: string; solved: number }>;
  /** Their latest results, newest first, and where each placed on its leaderboard */
  readonly recent: Array<{
    puzzle: string;
    moves: number;
    place: number;
  }>;
}

/** The day that a puzzle belongs to, which is everything in its ID before the size of its board */
const day = sql<string>`substr(${scores.puzzle}, 1, instr(${scores.puzzle}, '_') - 1)`;

/** Looks up what the player with the given identity has done. A player who has posted nothing has an empty profile. */
export const getProfile = async (did: string): Promise<Profile> => {
  const [days, recent] = await Promise.all([
    db
      .select({ day, solved: sql<number>`count(*)` })
      .from(scores)
      .where(eq(scores.did, did))
      .groupBy(day),
    db
      .select({
        puzzle: scores.puzzle,
        handle: scores.handle,
        moves: scores.moves,
        place
      })
      .from(scores)
      .where(eq(scores.did, did))
      .orderBy(desc(scores.createdAt))
      .limit(RECENT)
  ]);

  return {
    handle: recent.at(0)?.handle ?? null,
    days,
    recent: recent.map(({ handle: _handle, ...result }) => result)
  };
};
