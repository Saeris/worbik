import { defineHandler, defineHead, type InferProps } from "void";
import { getGameProps } from "#server/puzzles";
import { getShare, getShareHead } from "#server/share";

export type Props = InferProps<typeof loader>;

/**
 * A link to the result that a player earned on a puzzle. Like a link to the
 * puzzle alone, it opens the puzzle of the same size that is being played
 * today. The player's score is looked up, never taken from the link, so a
 * link can't claim a score that wasn't posted.
 */
export const loader = defineHandler(async (c) => {
  const size = c.req.param(`size`);

  return {
    ...(await getGameProps(size)),
    share: await getShare(
      `${c.req.param(`date`)}_${size}`,
      c.req.param(`player`)
    )
  };
});

export const head = defineHead<Props>((c, { share }) =>
  getShareHead(c.req.url, share, c.req.param(`player`))
);
