import type { NextApiHandler } from "next/types";
import { sendDiscordWebhook, sizes } from "../../utils";
import { locales } from "../../../next.config.mjs";

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
        async ([width, height]) =>
          await Promise.all(
            locales.map(
              async (locale) =>
                await res.revalidate(`/${locale}/${width}x${height}`)
            )
          )
      )
    );

    await sendDiscordWebhook(
      `Revalidation initiated at ${new Date().toLocaleString()}`
    );

    res.json({ revalidated: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to revalidate puzzles!`, err.message);
    }
    res.status(500).send(`Error revalidating`);
  }
};

export default handler;
