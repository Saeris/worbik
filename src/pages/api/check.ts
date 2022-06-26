import type { NextApiHandler } from "next";
import { checkSolution } from "../../utils";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.status(400).send(`Only GET requests are accepted!`);
    return;
  }

  const guess = req.query.guess;
  const challenge = req.query.challenge;

  if (typeof guess !== `string`) {
    res.status(400).send(`Received invalid value for "guess" parameter`);
    return;
  }

  if (typeof challenge !== `string`) {
    res.status(400).send(`Received invalid value for "challenge" parameter`);
    return;
  }

  const origin = process.env.VERCEL_URL?.length
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:3000`;
  const url = new URL(`${origin}/api/cacheGet`);
  url.searchParams.set(`key`, challenge);
  const cacheRes = await fetch(url.href);
  const solution: string = await cacheRes.text();
  // eslint-disable-next-line no-console
  console.log({ cache: cacheRes.headers.get(`x-vercel-cache`), solution });

  res
    .status(200)
    .setHeader(`Cache-Control`, `max-age=0, s-maxage=86400`)
    .json(checkSolution(guess, solution));
};

export default handler;
