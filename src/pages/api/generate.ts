import { Redis } from "@upstash/redis";
import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { generate, getDateKey, PuzzleState, toInt } from "../../utils";

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

  const puzzleID = getDateKey({ width, height });
  const url = new URL(`/api/cacheGet`, origin);
  url.searchParams.set(`key`, puzzleID);
  const cachedPair = await (await fetch(url.href)).json();

  if (cachedPair) {
    const [puzzle, solution] = cachedPair.split(`|`);
    const challenge = PuzzleState.compare(puzzle, solution);

    return NextResponse.json(
      {
        puzzleID,
        challenge
      },
      {
        status: 200,
        headers: {
          "Cache-Control": `max-age=0, s-maxage=86400`
        }
      }
    );
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  const puzzle = generate({ width, height });
  const solution = puzzle.initial.toString();
  const challenge = PuzzleState.compare(puzzle.toString(), solution);

  await redis.set(puzzleID, `${challenge}|${solution}`, {
    ex: 86400,
    nx: true
  });

  return NextResponse.json(
    {
      puzzleID,
      challenge
    },
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;
