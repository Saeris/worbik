import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { defineHandler } from "void";
import { renderCard } from "#server/card/card";
import { getShare } from "#server/share";
import { parseSize } from "#utils";

/**
 * The picture that is shown wherever a link to a puzzle, or to a player's
 * result on one, is pasted.
 *
 * It names a score only if the player really did post it. A puzzle's card
 * never changes, and nor does a player's once they have a score, as their
 * first is the one that's kept. So either can be held on to by whoever
 * fetches it, which is what keeps this from being drawn over and over.
 */
export const GET = defineHandler.withValidator({
  query: v.object({
    /** The ID of the puzzle that the card is for */
    puzzle: v.string(),
    /** The handle or identity of the player whose result it shows, if any */
    player: v.optional(v.pipe(v.string(), v.maxLength(253)))
  })
})(async (c, { query }) => {
  const share = await getShare(query.puzzle, query.player);

  if (!share) {
    throw new HTTPException(404, {
      message: `Could not retrieve a puzzle for id: ${query.puzzle}`
    });
  }

  const { width, height } = parseSize(query.puzzle.split(`_`)[1]);
  const card = renderCard({
    challenge: share.challenge,
    width,
    height,
    day: share.day,
    host: new URL(c.req.url).host,
    score: share.score ?? undefined
  });

  return c.body(card, 200, {
    "content-type": `image/png`,
    // A card for a player who hasn't posted a score yet may soon be one that shows it
    "cache-control":
      share.score || !query.player
        ? `public, max-age=31536000, immutable`
        : `public, max-age=300`
  });
});
