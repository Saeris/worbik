import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { defineHandler } from "void";
import { resolveDid } from "#server/identity";

/**
 * Looks up whose handle this is, for a player who is signing in with it.
 *
 * Signing in begins at the server that hosts the player's account, which is
 * found from their identity, which is found from their handle. A browser has
 * no way to query DNS, which is where most handles are found, so it asks here.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    handle: v.pipe(v.string(), v.maxLength(253))
  })
})(async (_c, { query }) => {
  const did = await resolveDid(query.handle.toLowerCase());

  if (!did) {
    throw new HTTPException(404, {
      message: `There is no account with the handle ${query.handle}`
    });
  }

  return { did };
});
