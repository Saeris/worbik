import type { NextMiddleware } from "next/server";
import { Redis } from "@upstash/redis";

const handler: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get(`key`);

  if (typeof key !== `string`) {
    return new Response(null, {
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
    return new Response(null, {
      status: 500,
      statusText: `Could not retrieve value for ${key}.`
    });
  }

  return new Response(JSON.stringify(solution), {
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
