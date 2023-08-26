import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { sendDiscordWebhook, sizes } from "#utils";

// eslint-disable-next-line @typescript-eslint/quotes
export const runtime = "edge";

/**
 * Revalidates all puzzles roughly at 2 AM every day
 *
 * 2 AM in PDX is UTC 10:00 AM
 */
export const GET = async (): Promise<
  NextResponse<{ revalidated: true; now: number } | null>
> => {
  try {
    sizes.map(([width, height]) => revalidatePath(`/${width}x${height}`));

    await sendDiscordWebhook(
      `Revalidation initiated at ${new Date().toLocaleString()}`
    );

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to revalidate puzzles!`, err.message);
    }
    return NextResponse.json(null, {
      status: 500,
      statusText: `Error revalidating`
    });
  }
};
