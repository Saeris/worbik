import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { defineHandler } from "void";
import { resolveDid } from "#server/identity";

/**
 * Looks up whose handle this is, for a player who is signing in with it.
 *
 * Signing in begins at the server that hosts the player's account, which is
 * found from their identity, which is found from their handle. The browser
 * asks here rather than a third party, so that who signs in to Worbik is
 * known to nobody else.
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
