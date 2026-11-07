import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import * as v from "valibot";
import { checkGuesses } from "#server/moves";
import { getPuzzle } from "#server/puzzles";

/**
 * Compares a player's guesses against a puzzle's solution, which is never
 * sent to the browser. Each guess is returned with the letters that are in
 * their correct position uppercased, along with a note to hand back with the
 * next guess, as every guess has to be a real move from the one before.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The ID of the puzzle being played */
    puzzle: v.string(),
    /** A comma separated list of grid states to check */
    guesses: v.string(),
    /** The note from the answer to the last guess, if there has been one */
    from: v.optional(v.string())
  })
})(async (c, { query }) => {
  // This only turns away other websites, as anything that isn't a browser can claim to be whatever it likes. What keeps guesses honest is `checkGuesses`.
  const site = c.req.header(`sec-fetch-site`);

  if (site && site !== `same-origin`) {
    throw new HTTPException(403, {
      message: `This can only be used by the game itself`
    });
  }

  const puzzle = await getPuzzle(query.puzzle);

  if (!puzzle) {
    throw new HTTPException(404, {
      message: `Could not retrieve a puzzle for id: ${query.puzzle}`
    });
  }

  return checkGuesses(
    query.puzzle,
    puzzle,
    query.guesses.split(`,`),
    query.from
  );
});
