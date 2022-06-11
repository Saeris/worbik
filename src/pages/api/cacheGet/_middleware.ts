import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(`Only GET requests are accepted!`, {
      status: 400
    });
  }

  const key = new URL(req.url).searchParams.get(`key`);

  if (typeof key !== `string`) {
    return new Response(`Received invalid value for "key" parameter`, {
      status: 400
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  const res = NextResponse.json(await redis.get(key));
  res.headers.set(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return res;
};
