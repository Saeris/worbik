import type { NextMiddleware } from "next/server";
import { generate } from "../../../utils";

const valid = (n: number): boolean => n > 4 && n < 9;

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const params = new URL(req.url).searchParams;
  const length = parseInt(params.get(`length`) ?? `0`, 10);
  const count = parseInt(params.get(`count`) ?? `0`, 10);
  const missing = !length && !count;
  const invalid = !valid(length) && !valid(count);

  if (missing || invalid) {
    return new Response(null, {
      status: 400,
      statusText: `Must provide a valid "length" or "count" parameter!`
    });
  }

  const puzzle = generate(length, count);

  await fetch(`${req.nextUrl.origin}/api/cacheSet`, {
    method: `POST`,
    body: JSON.stringify(puzzle)
  });

  return new Response(JSON.stringify(puzzle), {
    status: 200,
    headers: new Headers({
      "content-type": `application/json;charset=UTF-8`,
      "Cache-Control": `max-age=0, s-maxage=${60 * 60 * 24}`
    })
  });
};
