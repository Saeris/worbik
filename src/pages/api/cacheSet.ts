import type { NextApiHandler } from "next";
import { Redis } from "@upstash/redis";
import type { generate } from "../../utils";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.status(400).send(`Only GET requests are accepted!`);
    return;
  }

  const { challenge, solution } = req.body as ReturnType<typeof generate>;

  if (typeof challenge !== `string` || typeof solution !== `string`) {
    res.status(400).send(`Received invalid request body!`);
    return;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  res
    .status(200)
    .setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`)
    .json(await redis.set(challenge, solution, { ex: 86400 * 2, nx: true }));
};

export default handler;
