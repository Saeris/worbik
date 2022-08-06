import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { PuzzleState } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "experimental-edge"
};

const handler: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const { searchParams, origin } = new URL(req.url);
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

  // Our incoming request will need to retrieve a solution from the
  // cache from the same origin
  const url = new URL(`/api/cacheGet`, origin);
  url.searchParams.set(`key`, puzzleID);
  const pair = await (await fetch(url.href)).json();
  const solution = pair.split(`|`)[1];

  return NextResponse.json(
    guesses.split(`,`).map((guess) => PuzzleState.compare(guess, solution)),
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;
