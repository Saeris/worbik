import type { NextMiddleware } from "next/server";
import { redis } from "../../../clients/redis";
import type { generate } from "../../../utils";

export const middleware: NextMiddleware = async (req) => {
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

  await redis.set(challenge, solution);

  return new Response(null, {
    status: 200
  });
};
