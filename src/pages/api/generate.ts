import { getAll } from "@vercel/edge-config";
import { NextApiHandler } from "next";
import { NextResponse } from "next/server";
import { generate, getDateKey, PuzzleState, sizes, wait } from "../../utils";
import { filterExpiredDates } from "../../utils/getDateKey";

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== `GET`) {
    res.statusMessage = `Only GET requests are accepted!`;
    return res.status(400).send(null);
  }

  const updatePuzzles = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: `PATCH`,
      headers: new Headers({
        Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
        "Content-Type": `application/json`
      }),
      body: JSON.stringify({
        items: [
          ...sizes.map(([width, height]) => {
            const puzzle = generate({ width, height });
            const solution = puzzle.initial.toString();
            const challenge = PuzzleState.compare(puzzle.toString(), solution);
            return [
              {
                operation: `create`,
                key: getDateKey({
                  width,
                  height
                }),
                value: {
                  challenge,
                  solution
                }
              } as const
            ];
          }),
          // We also want to delete all keys older than 2 days
          ...Object.keys((await getAll<Record<string, unknown>>()) ?? {})
            .filter(filterExpiredDates)
            .map((key) => ({ operation: `delete`, key }))
        ]
      })
    }
  );

  await wait(10000); // Wait 10s for the changes to propagate

  // Revalidate all of the puzzle pages
  await Promise.all(
    sizes.map(([width, height]) => res.revalidate(`/${width}x${height}`))
  );

  return NextResponse.json(null, {
    status: updatePuzzles.status,
    statusText: updatePuzzles.statusText
  });
};

export default handler;
