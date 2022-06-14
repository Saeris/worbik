import type { NextApiHandler } from "next";
import { generate, toInt } from "../../utils";

const valid = (n: number): boolean => n > 4 && n < 9;

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.status(400).send(`Only GET requests are accepted!`);
    return;
  }

  const length = toInt(req.query.length);
  const count = toInt(req.query.count);
  const missing = !length && !count;
  const invalid = !valid(length) && !valid(count);

  if (missing || invalid) {
    res.status(400).send(`Must provide a valid "length" or "count" parameter!`);
    return;
  }

  const puzzle = generate(length, count);

  const origin = process.env.VERCEL_URL?.length
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:3000`;

  await fetch(`${origin}/api/cacheSet`, {
    method: `POST`,
    body: JSON.stringify(puzzle)
  });

  res
    .status(200)
    .setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`)
    .send(puzzle);
};

export default handler;
