import type { NextMiddleware } from "next/server";
import { Redis } from "@upstash/redis";
import type { generate } from "../../utils";

const handler: NextMiddleware = async (req) => {
  if (req.method !== `POST`) {
    return new Response(null, {
      status: 400,
      statusText: `Only POST requests are accepted!`
    });
  }

  const { challenge, solution } = (await req.json()) as ReturnType<
    typeof generate
  >;

  if (typeof challenge !== `string` || typeof solution !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid request body!`
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  return new Response(
    JSON.stringify(
      await redis.set(challenge, solution, { ex: 86400 * 2, nx: true })
    ),
    {
      status: 200,
      headers: {
        "content-type": `application/json`,
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export const config = {
  runtime: `experimental-edge`
};

export default handler;
