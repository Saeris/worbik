// eslint-disable-next-line import/no-unresolved
import { getAll } from "@vercel/edge-config";
import { NextResponse } from "next/server";
import {
  generate,
  getDateKey,
  sizes,
  updateEdgeConfig,
  type UpdateItemsResponse,
  filterExpiredDates
} from "#utils";

// eslint-disable-next-line @typescript-eslint/quotes
export const runtime = "edge";

/**
 * Generates new puzzles once daily at 10 PM,
 * deleting puzzles that are 3 days old
 *
 * 10 PM in PDX is UTC 06:00 AM
 */
export const GET = async (): Promise<
  NextResponse<{ status: string; statusText: string } | null>
> => {
  const existing = await getAll<Record<string, unknown>>();

  try {
    const edgeConfigId = new URL(process.env.EDGE_CONFIG).pathname.replace(
      `/`,
      ``
    );

    const updatePuzzles: UpdateItemsResponse = await (
      await updateEdgeConfig(edgeConfigId, process.env.VERCEL_ACCESS_TOKEN, [
        ...Object.keys(existing)
          .filter(filterExpiredDates)
          .map((key) => ({ operation: `delete` as const, key })),
        ...sizes.map(
          ([width, height]) =>
            ({
              operation: `create`,
              key: getDateKey({
                width,
                height
              }),
              value: generate({ width, height }).toChallenge()
            }) as const
        )
      ])
    ).json();

    if (`error` in updatePuzzles) {
      const cause = updatePuzzles.error;
      throw new Error(
        `Attempt to update Edge Config failed! Reason: ${cause.message}`,
        {
          cause
        }
      );
    }

    return NextResponse.json({
      status: updatePuzzles.status,
      statusText: updatePuzzles.statusText
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(err.message);
    }
    return NextResponse.json(null, {
      status: 500,
      statusText: `Failed to generate puzzles`
    });
  }
};
