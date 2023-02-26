import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { PuzzleState } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "edge"
};

const handler: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

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

  const cachedPuzzle = await get<{
    challenge: string;
    solution: string;
  }>(puzzleID);

  if (typeof cachedPuzzle === `undefined`) {
    return NextResponse.json(null, {
      status: 500,
      statusText: `Could not retrieve a puzzle for id: ${puzzleID}`
    });
  }

  return NextResponse.json(
    guesses
      .split(`,`)
      .map((guess) => PuzzleState.compare(guess, cachedPuzzle.solution)),
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;
