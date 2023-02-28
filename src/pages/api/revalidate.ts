import type { NextApiHandler } from "next/types";
import { sizes } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "edge"
};

/**
 * Revalidates all puzzles roughly at 1 AM every day
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.statusMessage = `Only GET requests are accepted!`;
    res.status(400).send(null);
    return;
  }

  await Promise.all(
    sizes.map(
      async ([width, height]) => await res.revalidate(`/${width}x${height}`)
    )
  );

  res.status(200).send(null);
};

export default handler;
