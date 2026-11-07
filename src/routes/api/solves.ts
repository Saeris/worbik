import { isDid } from "@atcute/lexicons/syntax";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { defineHandler } from "void";
import { GET_SOLVES, verifyPlayer } from "#server/identity";
import { getDayScores, getPostedGames } from "#server/scores";
import { dayRegex } from "#utils/dateKeyRegex";

/** A day's puzzles, by the date that begins their IDs */
const day = v.pipe(v.string(), v.regex(dayRegex));

/**
 * The scores that a player has posted on a day's puzzles, which is how a
 * device finds out that it's missing a solve that was made on another.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The identity of the player */
    player: v.pipe(
      v.string(),
      v.maxLength(2048),
      v.check((value) => isDid(value))
    ),
    day
  })
})(async (_c, { query }) => getDayScores(query.player, query.day));

/**
 * The games that a player has posted on a day's puzzles, for showing them as
 * solved on a device that doesn't have them.
 *
 * These include the solutions to the day's puzzles, so unlike everything
 * else about a player's scores, this needs proof that they are the one
 * asking.
 */
export const POST = defineHandler.withValidator({
  body: v.object({ day })
})(async (c, { body }) => {
  const did = await verifyPlayer(c.req.raw, GET_SOLVES).catch(() => {
    throw new HTTPException(401, {
      message: `This request does not prove who is making it`
    });
  });

  return getPostedGames(did, body.day);
});
