import { getAll } from "@vercel/edge-config";
import type { NextApiHandler } from "next/types";
import { generate, getDateKey, PuzzleState, sizes } from "../../utils";
import { filterExpiredDates } from "../../utils/getDateKey";
import { updateEdgeConfig } from "../../utils/updateEdgeConfig";

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

  try {
    const reomveOldPuzzles = await (
      await updateEdgeConfig(
        Object.keys(existing ?? {})
          .filter(filterExpiredDates)
          .map((key) => ({ operation: `delete` as const, key }))
      )
    ).json();

    const addPuzzles = await (
      await updateEdgeConfig(
        sizes.map(([width, height]) => {
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
      )
    ).json();
    // eslint-disable-next-line no-console
    console.log({ reomveOldPuzzles, addPuzzles });

    if (reomveOldPuzzles.error || addPuzzles.error) {
      const cause = reomveOldPuzzles.error || addPuzzles.error;
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
