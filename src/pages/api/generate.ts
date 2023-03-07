import { getAll } from "@vercel/edge-config";
import type { NextApiHandler } from "next/types";
import {
  generate,
  getDateKey,
  sizes,
  updateEdgeConfig,
  filterExpiredDates,
  wait
} from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "nodejs"
};

/**
 * Generates new puzzles once daily at 10 PM,
 * deleting puzzles that are 3 days old
 *
 * 10 PM in PDX is UTC 06:00 AM
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.statusMessage = `Only GET requests are accepted!`;
    res.status(400).send(null);
    return;
  }

  const existing = await getAll<Record<string, unknown>>();

  try {
    const edgeConfigId = new URL(process.env.EDGE_CONFIG).pathname.replace(
      `/`,
      ``
    );
    const token = process.env.VERCEL_ACCESS_TOKEN;

    const toBeRemoved = Object.keys(existing ?? {})
      .filter(filterExpiredDates)
      .map((key) => ({ operation: `delete` as const, key }));

    const removeOldPuzzles = await (
      await updateEdgeConfig(edgeConfigId, token, toBeRemoved)
    ).json();

    await wait(5000);

    const toBeAdded = sizes.map(
      ([width, height]) =>
        ({
          operation: `create`,
          key: getDateKey({
            width,
            height
          }),
          value: generate({ width, height }).toChallenge()
        } as const)
    );

    const addPuzzles = await (
      await updateEdgeConfig(edgeConfigId, token, toBeAdded)
    ).json();

    // eslint-disable-next-line no-console
    console.log({
      existing,
      toBeRemoved,
      removeOldPuzzles,
      toBeAdded,
      addPuzzles
    });

    if (removeOldPuzzles.error || addPuzzles.error) {
      const cause = removeOldPuzzles.error || addPuzzles.error;
      throw new Error(
        `Attempt to update Edge Config failed! Reason: ${cause.message}`,
        {
          cause
        }
      );
    }

    res.status(200).json({
      status: addPuzzles.status,
      statusText: addPuzzles.statusText
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(err.message);
    }
    res.status(500).json(null);
  }
};

export default handler;
