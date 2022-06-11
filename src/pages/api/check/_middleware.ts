import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(`Only GET requests are accepted!`, {
      status: 400
    });
  }

  const guess = new URL(req.url).searchParams.get(`guess`);
  const challenge = new URL(req.url).searchParams.get(`challenge`);

  if (typeof guess !== `string`) {
    return new Response(`Received invalid value for "guess" parameter`, {
      status: 400
    });
  }

  if (typeof challenge !== `string`) {
    return new Response(`Received invalid value for "challenge" parameter`, {
      status: 400
    });
  }
  const url = new URL(`${req.nextUrl.origin}/api/cacheGet`);
  url.searchParams.set(`key`, challenge);
  const cacheRes = await fetch(url.href);
  // eslint-disable-next-line no-console
  console.log(cacheRes.headers.get(`x-vercel-cache`));
  const solution: string = await cacheRes.json();

  const res = NextResponse.json(
    guess
      .toLowerCase()
      .split(``)
      .map((c, i) => (solution.charAt(i) === c ? c.toUpperCase() : c))
      .join(``)
  );
  res.headers.set(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return res;
};
