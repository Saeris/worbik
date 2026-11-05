import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { env } from "void/env";
import { kv } from "void/kv";
import type { GameProps } from "#components/Game";
import type { Challenge } from "#state";
import { getPuzzleID, parseSize, puzzleSchema, seededRandom } from "#utils";
import { dateKeyRegex } from "#utils/dateKeyRegex";
import { generate } from "#utils/generate";

/**
 * How long a puzzle is kept after it was created, in seconds.
 *
 * This outlives the day a puzzle is playable for, so that a game left
 * open in a browser tab overnight can still be checked and finished.
 */
const PUZZLE_TTL = 60 * 60 * 24 * 3;

const puzzles = kv.map<Challenge>(`puzzles`);

/**
 * Retrieves the puzzle with the given ID, creating it if it's the first
 * time that the currently playable puzzle has been asked for.
 *
 * Puzzles are created on demand like this rather than ahead of time by a
 * scheduled job so that there is no job whose failure can leave the game
 * without a puzzle to serve. Each puzzle is derived deterministically from
 * its ID, which means that simultaneous first requests all arrive at the
 * very same puzzle, no matter which of them ends up being stored.
 *
 * Once created, a puzzle is pinned in KV so that it can't change part way
 * through its day when a deployment alters the word list or the generator.
 */
export const getPuzzle = async (id: string): Promise<Challenge | null> => {
  const { width, height } = dateKeyRegex.exec(id)?.groups ?? {};
  const config = v.safeParse(puzzleSchema, { width, height });

  if (!width || !height || !config.success) return null;

  const existing = await puzzles.get(id);

  if (existing) return existing;
  // Past puzzles have expired, and future ones would let players solve a puzzle before its day
  if (id !== getPuzzleID(config.output)) return null;

  const puzzle = generate(
    config.output,
    await seededRandom(`${env.PUZZLE_SECRET}:${id}`)
  ).toChallenge();

  try {
    await puzzles.put(id, puzzle, { ttl: PUZZLE_TTL });
  } catch (err: unknown) {
    // The same puzzle will be derived again on the next request, so the game remains playable
    console.error(`Failed to store puzzle ${id}`, err);
  }

  return puzzle;
};

/**
 * Loads the props needed to render a game of the given
 * size (e.g. `6x7`) with the currently playable puzzle.
 */
export const getGameProps = async (size?: string): Promise<GameProps> => {
  let config: ReturnType<typeof parseSize>;

  try {
    config = parseSize(size);
  } catch {
    throw new HTTPException(404, {
      message: `There are no puzzles of size "${size}"`
    });
  }

  const puzzleID = getPuzzleID(config);
  const puzzle = await getPuzzle(puzzleID);

  if (!puzzle) {
    throw new HTTPException(500, {
      message: `Unable to retrieve puzzle ${puzzleID}`
    });
  }

  const [target, challenge] = puzzle;

  return { puzzleID, init: [config.width, challenge, target] };
};
