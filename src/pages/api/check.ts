import type { NextMiddleware } from "next/server";
import { checkSolution } from "../../utils";

const handler: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const { searchParams } = new URL(req.url);
  const guess = searchParams.get(`guess`);
  const challenge = searchParams.get(`challenge`);

  if (typeof guess !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid value for "guess" parameter`
    });
  }

  if (typeof challenge !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid value for "challenge" parameter`
    });
  }

  const origin = process.env.VERCEL_URL?.length
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:3000`;
  const url = new URL(`${origin}/api/cacheGet`);
  url.searchParams.set(`key`, challenge);
  const cacheRes = await fetch(url.href);
  const solution: string = await cacheRes.text();
  // eslint-disable-next-line no-console
  console.log({ cache: cacheRes.headers.get(`x-vercel-cache`), solution });

  return new Response(JSON.stringify(checkSolution(guess, solution)), {
    status: 200,
    headers: {
      "content-type": `application/json`,
      "Cache-Control": `max-age=0, s-maxage=86400`
    }
  });
};

export const config = {
  runtime: `experimental-edge`
};

export default handler;
