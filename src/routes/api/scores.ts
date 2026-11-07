import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { defineHandler } from "void";
import { resolveHandle, SUBMIT_SCORE, verifyPlayer } from "#server/identity";
import { getRanking, submitGame } from "#server/scores";
import { MAX_MOVES } from "#state";
import { MAX_TILES } from "#utils/sizes";

/** A game that is being submitted for a score */
export const game = v.object({
  /** The ID of the puzzle that was solved */
  puzzle: v.string(),
  /** Every state that the board went through, from how the puzzle began to its solution */
  history: v.pipe(
    v.array(v.pipe(v.string(), v.maxLength(MAX_TILES))),
    v.minLength(2),
    v.maxLength(MAX_MOVES + 1)
  )
});

/** The best scores on a puzzle */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The ID of the puzzle to rank the scores of */
    puzzle: v.string(),
    /** The identity of a player to find on it, however far down they are. Scores are public, so this needs no proof. */
    player: v.optional(v.pipe(v.string(), v.maxLength(2048)))
  })
})(async (_c, { query }) => getRanking(query.puzzle, query.player));

/**
 * Submits a game that solved a puzzle, to earn a place on its leaderboard.
 *
 * The request has to carry proof of who the player is, as a token from the
 * server that hosts their account.
 */
export const POST = defineHandler.withValidator({ body: game })(async (
  c,
  { body }
) => {
  const did = await verifyPlayer(c.req.raw, SUBMIT_SCORE).catch(() => {
    throw new HTTPException(401, {
      message: `This request does not prove who is making it`
    });
  });

  return submitGame(body.puzzle, body.history, {
    did,
    handle: await resolveHandle(did)
  });
});
