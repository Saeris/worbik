import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { generate, toInt } from "../../utils";

const valid = (n: number): boolean => n > 4 && n < 9;

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
  const length = toInt(searchParams.get(`length`));
  const count = toInt(searchParams.get(`count`));
  const missing = !length && !count;
  const invalid = !valid(length) && !valid(count);

  if (missing || invalid) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Must provide a valid "length" or "count" parameter!`
    });
  }

  const puzzle = generate(length, count);

  await fetch(`${origin}/api/cacheSet`, {
    method: `POST`,
    body: JSON.stringify(puzzle)
  });

  return NextResponse.json(puzzle, {
    status: 200,
    headers: {
      "content-type": `application/json`,
      "Cache-Control": `max-age=0, s-maxage=86400`
    }
  });
};

export default handler;
