import { HTTPException } from "hono/http-exception";
import { and, asc, db, desc, eq, inArray, sql } from "void/db";
import { scores } from "#db/schema";
import { replay } from "#state";
import { isNonNullable, isOpenForScores, sizes } from "#utils";
import { getPuzzleSize } from "#utils/parsePuzzleID";
import type { PostedGame } from "#utils/progress";
import { getPuzzle } from "./puzzles";

export interface Score {
  readonly did: string;
  readonly handle: string | null;
  readonly moves: number;
  readonly createdAt: Date;
}

const columns = {
  did: scores.did,
  handle: scores.handle,
  moves: scores.moves,
  createdAt: scores.createdAt
};

/**
 * Where a score placed: one more than the number of scores on the same
 * puzzle that took fewer moves, or as many and were posted earlier.
 *
 * The score being placed is named by its table in full. Left to itself,
 * the query builder names columns without their table, and each would then
 * be taken for a column of the scores that it's being compared against.
 */
export const place = sql<number>`(
  select count(*) + 1 from scores as ahead
  where ahead.puzzle = scores.puzzle
    and (
      ahead.moves < scores.moves
      or (ahead.moves = scores.moves and ahead.created_at < scores.created_at)
    )
)`;

/**
 * Records the score that a player earned on a puzzle, and returns the score
 * that they now have for it.
 *
 * That is their first one. A puzzle can be played any number of times, but
 * a leaderboard that took a player's best attempt would only measure how
 * many attempts they were willing to make.
 */
export const recordScore = async (
  puzzle: string,
  score: Omit<Score, "createdAt">
): Promise<Score> => {
  await db
    .insert(scores)
    .values({ puzzle, ...score, createdAt: new Date() })
    .onConflictDoNothing();

  const [recorded] = await db
    .select(columns)
    .from(scores)
    .where(and(eq(scores.puzzle, puzzle), eq(scores.did, score.did)));

  return recorded;
};

/**
 * Scores a game that a player says solved a puzzle, and records it.
 *
 * The game is replayed to check that it really does solve the puzzle, and
 * its score is the number of moves that the replay counted, rather than one
 * that the player claims.
 *
 * Only the day's puzzle can be scored, along with the hour's grace after it.
 * The leaderboards of older ones have closed.
 */
export const submitGame = async (
  puzzleID: string,
  history: readonly string[],
  player: Pick<Score, "did" | "handle">
): Promise<Score> => {
  const puzzle = await getPuzzle(puzzleID);

  if (!puzzle) {
    throw new HTTPException(404, {
      message: `Could not retrieve a puzzle for id: ${puzzleID}`
    });
  }

  if (!isOpenForScores(puzzleID)) {
    throw new HTTPException(403, {
      message: `The leaderboard for this puzzle has closed`
    });
  }

  const [, challenge, solution] = puzzle;
  const { width } = getPuzzleSize(puzzleID);
  const moves = replay(width, challenge, solution, history);

  if (moves === null) {
    throw new HTTPException(422, {
      message: `That is not a game which solves this puzzle`
    });
  }

  return recordScore(puzzleID, { ...player, moves });
};

/**
 * The score that a player posted for a puzzle, or `null` if they haven't.
 *
 * The player is found by their identity, or by the handle that they had
 * when they posted the score. A handle can pass from one player to another,
 * in which case it's whoever posted under it last.
 */
export const getScore = async (
  puzzle: string,
  player: string
): Promise<Score | null> => {
  const found = await db
    .select(columns)
    .from(scores)
    .where(
      and(
        eq(scores.puzzle, puzzle),
        player.startsWith(`did:`)
          ? eq(scores.did, player)
          : eq(scores.handle, player.toLowerCase())
      )
    )
    .orderBy(desc(scores.createdAt))
    .limit(1);

  return found.at(0) ?? null;
};

/**
 * The scores that a player has posted on a day's puzzles.
 *
 * It's how a device finds out that it's missing a solve that was made on
 * another. It says nothing that the day's leaderboards don't, so it's asked
 * for without proof of who is asking, which saves a trip to the server that
 * hosts their account every time the game is opened.
 */
export const getDayScores = async (
  did: string,
  day: string
): Promise<Array<Pick<PostedGame, "moves" | "puzzle">>> =>
  db
    .select({ puzzle: scores.puzzle, moves: scores.moves })
    .from(scores)
    .where(
      and(
        eq(scores.did, did),
        inArray(
          scores.puzzle,
          sizes.map(([width, height]) => `${day}_${width}x${height}`)
        )
      )
    );

/**
 * The games that a player has posted on a day's puzzles, along with what it
 * takes to show them as solved.
 *
 * That includes their solutions, which others may still be working out, so
 * this must only ever be given to the player themselves. Leaderboards name
 * everyone who has solved a puzzle, so naming a player proves nothing: the
 * `did` has to come from a proof of identity.
 */
export const getPostedGames = async (
  did: string,
  day: string
): Promise<PostedGame[]> => {
  const posted = await getDayScores(did, day);
  const games = await Promise.all(
    posted.map(async ({ puzzle, moves }) => {
      const found = await getPuzzle(puzzle);

      return (
        found && { puzzle, moves, challenge: found[1], solution: found[2] }
      );
    })
  );

  return games.filter(isNonNullable);
};

/**
 * Deletes every score that a player has posted, which is all that Worbik
 * keeps about them. Their places on leaderboards go with them, for good.
 */
export const deleteScores = async (did: string): Promise<void> => {
  await db.delete(scores).where(eq(scores.did, did));
};

/** The best scores on a puzzle: those with the fewest moves, and the earliest of any that tie */
export const getLeaderboard = async (
  puzzle: string,
  limit = 100
): Promise<Score[]> =>
  db
    .select(columns)
    .from(scores)
    .where(eq(scores.puzzle, puzzle))
    .orderBy(asc(scores.moves), asc(scores.createdAt))
    .limit(limit);

/** A puzzle's leaderboard, as far as it's listed, and where one player stands on the whole of it */
export interface Ranking {
  /** The best scores, which aren't all of them on a puzzle that many have solved */
  readonly scores: Score[];
  /** How many scores there are in all */
  readonly total: number;
  /** The score of the player who asked, and its place, wherever that is */
  readonly you: (Score & { readonly place: number }) | null;
}

/** Ranks a puzzle's scores, for the player with the given identity if there is one */
export const getRanking = async (
  puzzle: string,
  player?: string
): Promise<Ranking> => {
  const [top, [{ total }], standing] = await Promise.all([
    getLeaderboard(puzzle),
    db
      .select({ total: sql<number>`count(*)` })
      .from(scores)
      .where(eq(scores.puzzle, puzzle)),
    player
      ? db
          .select({ ...columns, place })
          .from(scores)
          .where(and(eq(scores.puzzle, puzzle), eq(scores.did, player)))
      : []
  ]);

  return { scores: top, total, you: standing.at(0) ?? null };
};
