import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { checkSolution } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "experimental-edge"
};

const handler: NextMiddleware = async (req, event) => {
  if (req.method !== `GET`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const { searchParams, origin } = new URL(req.url);
  const guess = searchParams.get(`guess`);
  const challenge = searchParams.get(`challenge`);

  if (typeof guess !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "guess" parameter`
    });
  }

  if (typeof challenge !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "challenge" parameter`
    });
  }

  // Our incoming request will need to retrieve a solution from the
  // cache from the same origin
  const url = new URL(`/api/cacheGet`, origin);
  url.searchParams.set(`key`, challenge);

  return NextResponse.json(
    checkSolution(guess, await (await fetch(url.href)).text()),
    {
      status: 200,
      headers: {
        "content-type": `application/json`,
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;
