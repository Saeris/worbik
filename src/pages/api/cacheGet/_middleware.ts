import type { NextMiddleware } from "next/server";
import { redis } from "../../../clients/redis";

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const key = new URL(req.url).searchParams.get(`key`);

  if (typeof key !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid value for "key" parameter`
    });
  }

  const solution = await redis.get(key);

  return new Response(JSON.stringify(solution), {
    status: 200,
    headers: new Headers({
      "content-type": `application/json;charset=UTF-8`,
      "Cache-Control": `max-age=0, s-maxage=${60 * 60 * 24}`
    })
  });
};
