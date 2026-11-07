import * as v from "valibot";
import { defineHandler } from "void";
import { submitGame } from "#server/scores";
import { game } from "../scores";

/**
 * Submits a game as any player, without proof of who they are.
 *
 * Proving who a player is takes signing in to a real account, which can't
 * be done offline or in a test. This stands in for that during development,
 * so that everything else about submitting a score can be worked on. It only
 * exists on the dev server: the `.dev` in its name leaves it out of builds.
 */
export const POST = defineHandler.withValidator({
  body: v.object({
    ...game.entries,
    did: v.string(),
    handle: v.nullable(v.string())
  })
})(async (_c, { body: { puzzle, history, ...player } }) =>
  submitGame(puzzle, history, player)
);
