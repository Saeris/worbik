import { getAll } from "@vercel/edge-config";
import type { NextApiHandler } from "next/types";
import { generate, getDateKey, PuzzleState, sizes } from "../../utils";
import { filterExpiredDates } from "../../utils/getDateKey";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "nodejs"
};

/**
 * Generates new puzzles once daily at 10 PM,
 * deleting puzzles that are 3 days old
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.statusMessage = `Only GET requests are accepted!`;
    res.status(400).send(null);
    return;
  }

  const existing = await getAll<Record<string, unknown>>();

  const items = [
    // We want to delete all keys older than 2 days
    ...Object.keys(existing ?? {})
      .filter(filterExpiredDates)
      .map((key) => ({ operation: `delete`, key })),
    // Generate tomorrow's puzzles
    ...sizes.map(([width, height]) => {
      const puzzle = generate({ width, height });
      const solution = puzzle.initial.toString();
      const challenge = PuzzleState.compare(puzzle.toString(), solution);
      return {
        operation: `create`,
        key: getDateKey({
          width,
          height
        }),
        value: {
          challenge,
          solution
        }
      } as const;
    })
  ];

  try {
    const updatePuzzles = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: `PATCH`,
        headers: new Headers({
          Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
          "Content-Type": `application/json`
        }),
        body: JSON.stringify({
          items
        })
      }
    );

    res.status(200).json({
      status: updatePuzzles.status,
      statusText: updatePuzzles.statusText
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(500).json(null);
  }
};

export default handler;
