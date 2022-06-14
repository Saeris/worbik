import type { NextApiHandler } from "next";
import { Redis } from "@upstash/redis";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.status(400).send(`Only GET requests are accepted!`);
    return;
  }

  if (typeof req.query.key !== `string`) {
    res.status(400).send(`Received invalid value for "key" parameter`);
    return;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? ``,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ``
  });

  const solution = await redis.get<string>(req.query.key);

  if (typeof solution !== `string`) {
    res.status(500).send(`Could not retrieve value for ${req.query.key}.`);
    return;
  }

  res
    .status(200)
    .setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`)
    .json(solution);
};

export default handler;
