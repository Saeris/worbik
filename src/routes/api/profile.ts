import { isDid } from "@atcute/lexicons/syntax";
import * as v from "valibot";
import { defineHandler } from "void";
import { getProfile } from "#server/profile";

/**
 * What a player has done: the days that they played on, and their latest
 * results. It's made of the scores that they posted, which are public, so
 * anyone can ask for anyone's.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The identity of the player */
    player: v.pipe(
      v.string(),
      v.maxLength(2048),
      v.check((value) => isDid(value))
    )
  })
})(async (_c, { query }) => getProfile(query.player));
