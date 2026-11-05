import { HTTPException } from "hono/http-exception";
import { and, asc, db, eq } from "void/db";
import { scores } from "#db/schema";
import { replay } from "#state";
import { isOpenForScores, parseSize } from "#utils";
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
 * Only a recent puzzle can be scored. Older ones can still be played, but
 * their leaderboards have closed.
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
  const { width } = parseSize(puzzleID.split(`_`)[1]);
  const moves = replay(width, challenge, solution, history);

  if (moves === null) {
    throw new HTTPException(422, {
      message: `That is not a game which solves this puzzle`
    });
  }

  return recordScore(puzzleID, { ...player, moves });
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
