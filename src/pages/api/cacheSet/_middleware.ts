import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { generate } from "../../../utils";

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `POST`) {
    return new Response(`Only POST requests are accepted!`, {
      status: 400
    });
  }

  const { challenge, solution } = (await req.json()) as ReturnType<
    typeof generate
  >;

  if (typeof challenge !== `string` || typeof solution !== `string`) {
    return new Response(`Received invalid request body!`, {
      status: 400
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  const res = NextResponse.json(
    await redis.set(challenge, solution, { ex: 86400 * 2, nx: true })
  );
  res.headers.set(`Cache-Control`, `max-age=0, s-maxage=86400`);
  return res;
};
