import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { defineHandler } from "void";
import { resolveHandle, verifyPlayer } from "#server/identity";
import { getLeaderboard, submitGame } from "#server/scores";
import { MAX_MOVES } from "#state";

/** A game that is being submitted for a score */
export const game = v.object({
  /** The ID of the puzzle that was solved */
  puzzle: v.string(),
  /** Every state that the board went through, from how the puzzle began to its solution */
  history: v.pipe(
    v.array(v.pipe(v.string(), v.maxLength(64))),
    v.minLength(2),
    v.maxLength(MAX_MOVES + 1)
  )
});

/** The best scores on a puzzle */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The ID of the puzzle to rank the scores of */
    puzzle: v.string()
  })
})(async (_c, { query }) => getLeaderboard(query.puzzle));

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
  const did = await verifyPlayer(c.req.raw).catch(() => {
    throw new HTTPException(401, {
      message: `This request does not prove who is making it`
    });
  });

  return submitGame(body.puzzle, body.history, {
    did,
    handle: await resolveHandle(did)
  });
});
