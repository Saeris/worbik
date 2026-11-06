import { db, inArray } from "void/db";
import { defineHandler } from "void";
import { scores } from "#db/schema";
import { forgetPuzzle } from "#server/puzzles";
import { getPuzzleID, sizes } from "#utils";

/**
 * Forgets today's puzzles, along with any scores on them, so that they are
 * made afresh the next time they're asked for.
 *
 * For development, after changing how puzzles are made: for instance, to
 * have them take one move to solve by setting `PUZZLE_SCRAMBLE`. A browser
 * that has a game of the old puzzle saved will restore it over the new one,
 * so its storage for the site has to be cleared as well. It only exists on
 * the dev server: the `.dev` in its name leaves it out of builds.
 */
export const POST = defineHandler(async () => {
  const ids = sizes.map(([width, height]) => getPuzzleID({ width, height }));

  await Promise.all(ids.map(forgetPuzzle));
  await db.delete(scores).where(inArray(scores.puzzle, ids));

  return { forgotten: ids };
});
