import { defineHandler, defineHead, type InferProps } from "void";
import { getGameProps } from "#server/puzzles";
import { getShare, getShareHead } from "#server/share";

export type Props = InferProps<typeof loader>;

/**
 * A link to a puzzle that someone shared. It opens the puzzle of the same
 * size that is being played today, rather than the one that was shared,
 * which may be from a day that has passed. What was shared is only used to
 * describe the link to the apps that it's pasted into.
 */
export const loader = defineHandler(async (c) => {
  const size = c.req.param(`size`);

  return {
    ...(await getGameProps(size)),
    share: await getShare(`${c.req.param(`date`)}_${size}`)
  };
});

export const head = defineHead<Props>((c, { share }) =>
  getShareHead(c.req.url, share)
);
