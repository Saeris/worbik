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
  const guess = searchParams.get(`guess`);

  if (typeof puzzleID !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "puzzle" parameter`
    });
  }

  if (typeof guess !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "guess" parameter`
    });
  }

  // Our incoming request will need to retrieve a solution from the
  // cache from the same origin
  const url = new URL(`/api/cacheGet`, origin);
  url.searchParams.set(`key`, puzzleID);

  return NextResponse.json(
    PuzzleState.compare(guess, await (await fetch(url.href)).json()),
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;
