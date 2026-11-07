import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { DELETE_DATA, verifyPlayer } from "#server/identity";
import { deleteScores } from "#server/scores";

/**
 * Deletes everything that Worbik has for a player, which is their scores.
 *
 * There's no undoing this, so it can only be asked for by the player
 * themselves, with a proof that's good for this and nothing else.
 */
export const DELETE = defineHandler(async (c) => {
  const did = await verifyPlayer(c.req.raw, DELETE_DATA).catch(() => {
    throw new HTTPException(401, {
      message: `This request does not prove who is making it`
    });
  });

  await deleteScores(did);

  return { deleted: true };
});
