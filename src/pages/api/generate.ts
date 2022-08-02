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
  const width = toInt(searchParams.get(`width`));
  const height = toInt(searchParams.get(`height`));
  const missing = !width && !height;
  const invalid = !valid(width) && !valid(height);

  if (missing || invalid) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Must provide a valid "length" or "count" parameter!`
    });
  }

  const puzzle = generate({ width, height });

  await fetch(`${origin}/api/cacheSet`, {
    method: `POST`,
    body: JSON.stringify(puzzle)
  });

  return NextResponse.json(puzzle, {
    status: 200,
    headers: {
      "Cache-Control": `max-age=0, s-maxage=86400`
    }
  });
};

export default handler;
