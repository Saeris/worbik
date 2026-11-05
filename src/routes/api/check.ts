import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import * as v from "valibot";
import { getPuzzle } from "#server/puzzles";
import { PuzzleState } from "#state";

/**
 * Compares a player's guesses against a puzzle's solution, which is never
 * sent to the browser. Each guess is returned with the letters that are in
 * their correct position uppercased.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The ID of the puzzle being played */
    puzzle: v.string(),
    /** A comma separated list of grid states to check */
    guesses: v.string()
  })
})(async (_c, { query }) => {
  const puzzle = await getPuzzle(query.puzzle);

  if (!puzzle) {
    throw new HTTPException(404, {
      message: `Could not retrieve a puzzle for id: ${query.puzzle}`
    });
  }

  const [, , solution] = puzzle;

  return query.guesses
    .split(`,`)
    .map((guess) => PuzzleState.compare(guess, solution));
});
