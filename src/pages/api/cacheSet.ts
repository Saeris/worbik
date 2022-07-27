import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "experimental-edge"
};

const handler: NextMiddleware = async (req) => {
  if (req.method !== `POST`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Only POST requests are accepted!`
    });
  }

  const { challenge, solution } = (await req.json()) as {
    challenge: string;
    solution: string;
  };

  if (typeof challenge !== `string` || typeof solution !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid request body!`
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  return NextResponse.json(
    await redis.set(challenge, solution, { ex: 86400 * 2, nx: true }),
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;
