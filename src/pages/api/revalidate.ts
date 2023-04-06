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

  try {
    await Promise.all(
      sizes.map(
        async ([width, height]) => await res.revalidate(`/${width}x${height}`)
      )
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to revalidate puzzles!`, err.message);
    }
    res.status(500).send(null);
  }

  res.status(200).send(null);
};

export default handler;
