import { NextResponse } from "next/server";
// eslint-disable-next-line import/no-unresolved
import { get } from "@vercel/edge-config";
import { PuzzleState, type Challenge } from "#utils";

// eslint-disable-next-line @typescript-eslint/quotes
export const runtime = "edge";

export const GET = async (
  req: Request
): Promise<NextResponse<string[] | null>> => {
  const { searchParams } = new URL(req.url);
  const puzzleID = searchParams.get(`puzzle`);
  const guesses = searchParams.get(`guesses`);

  if (typeof puzzleID !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "puzzle" parameter`
    });
  }

  if (typeof guesses !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "guesses" parameter`
    });
  }

  const cachedPuzzle = await get<Challenge>(puzzleID);

  if (typeof cachedPuzzle === `undefined`) {
    return NextResponse.json(null, {
      status: 500,
      statusText: `Could not retrieve a puzzle for id: ${puzzleID}`
    });
  }

  return NextResponse.json(
    guesses
      .split(`,`)
      .map((guess) => PuzzleState.compare(guess, cachedPuzzle[2])),
    {
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};
