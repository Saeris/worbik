import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

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

  const { searchParams } = new URL(req.url);
  const key = searchParams.get(`key`);

  if (typeof key !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "key" parameter`
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  const solution = await redis.get<string>(key);

  if (typeof solution !== `string`) {
    return NextResponse.json(null, {
      status: 500,
      statusText: `Could not retrieve value for ${key}.`
    });
  }

  return NextResponse.json(solution, {
    status: 200,
    headers: {
      "content-type": `application/json`,
      "Cache-Control": `max-age=0, s-maxage=86400`
    }
  });
};

export default handler;
