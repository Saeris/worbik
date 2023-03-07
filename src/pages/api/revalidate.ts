import type { NextApiHandler } from "next/types";
import { sizes } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "nodejs"
};

/**
 * Revalidates all puzzles roughly at 2 AM every day
 *
 * 2 AM in PDX is UTC 10:00 AM
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
