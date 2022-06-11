import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { generate } from "../../../utils";

const valid = (n: number): boolean => n > 4 && n < 9;

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(`Only GET requests are accepted!`, {
      status: 400
    });
  }

  const params = new URL(req.url).searchParams;
  const length = parseInt(params.get(`length`) ?? `0`, 10);
  const count = parseInt(params.get(`count`) ?? `0`, 10);
  const missing = !length && !count;
  const invalid = !valid(length) && !valid(count);

  if (missing || invalid) {
    return new Response(`Must provide a valid "length" or "count" parameter!`, {
      status: 400
    });
  }

  const puzzle = generate(length, count);

  await fetch(`${req.nextUrl.origin}/api/cacheSet`, {
    method: `POST`,
    body: JSON.stringify(puzzle)
  });

  const res = NextResponse.json(puzzle);
  res.headers.set(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return res;
};
