import * as v from "valibot";
import { defineHandler } from "void";
import { getRanking } from "#server/scores";

/**
 * A puzzle's leaderboard, along with how many scores there are in all and
 * where one player stands, however far down that is. Scores are public, so
 * anyone can be looked up without proof.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The ID of the puzzle to rank the scores of */
    puzzle: v.string(),
    /** The identity of a player to find on it */
    player: v.optional(v.pipe(v.string(), v.maxLength(2048)))
  })
})(async (_c, { query }) => getRanking(query.puzzle, query.player));
