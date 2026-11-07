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
 * How long a Worker goes on using a puzzle that it has already looked up
 * before it looks again, in milliseconds.
 *
 * Nearly every request the game makes needs a puzzle: each move a player
 * makes is checked against one. Remembering puzzles here answers those
 * from memory, which is quicker than any store and doesn't count against
 * how many reads of one are allowed.
 *
 * It is kept this short because of the one moment a puzzle can be in
 * doubt. Two Workers that create the same puzzle at once can disagree on
 * it when a deployment has just altered the word list or the generator,
 * and only one of theirs is kept. Looking again is how the other comes to
 * serve the puzzle that was. A minute is how long KV itself may take to
 * show a Worker what another has written, so this adds no doubt of its own.
 */
const REMEMBER_FOR = 60 * 1000;

const puzzles = kv.map<Challenge>(`puzzles`);

const remembered = new Map<string, { puzzle: Challenge; until: number }>();

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
 * Once created, a puzzle is kept in KV for good. That pins it, so that it
 * can't change part way through its day when a deployment alters the word
 * list or the generator, and it is what lets a puzzle be played, and the
 * scores on it mean something, long after its day.
 */
export const getPuzzle = async (id: string): Promise<Challenge | null> => {
  const { width, height } = dateKeyRegex.exec(id)?.groups ?? {};
  const config = v.safeParse(puzzleSchema, { width, height });

  if (!width || !height || !config.success) return null;

  const known = remembered.get(id);

  if (known && known.until > Date.now()) return known.puzzle;

  const puzzle = (await puzzles.get(id)) ?? (await create(id, config.output));

  if (puzzle) {
    remembered.set(id, { puzzle, until: Date.now() + REMEMBER_FOR });
  }

  return puzzle;
};

const create = async (
  id: string,
  config: v.InferOutput<typeof puzzleSchema>
): Promise<Challenge | null> => {
  // A past puzzle that was never stored is gone, and a future one would let players solve a puzzle before its day
  if (id !== getPuzzleID(config)) return null;

  const puzzle = generate(
    config,
    await seededRandom(`${env.PUZZLE_SECRET}:${id}`),
    // A puzzle is kept for good, so this can't be left to whatever happens to be set
    import.meta.env.DEV ? env.PUZZLE_SCRAMBLE : undefined
  ).toChallenge();

  try {
    await puzzles.put(id, puzzle);
  } catch (err: unknown) {
    // The same puzzle will be derived again on the next request, so the game remains playable
    console.error(`Failed to store puzzle ${id}`, err);
  }

  return puzzle;
};

/**
 * Forgets a puzzle, so that it's made afresh the next time it's asked for.
 *
 * Only for development. A puzzle that is kept is what makes its scores mean
 * something, so nothing in the game itself ever does this.
 */
export const forgetPuzzle = async (id: string): Promise<void> => {
  remembered.delete(id);
  await puzzles.delete(id);
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
