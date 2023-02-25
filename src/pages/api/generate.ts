import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { generate, getDateKey, PuzzleState } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "edge"
};

const handler: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const items = [5, 6, 7, 8].reduce(
    (arr, width, _, sizes) => [
      ...arr,
      ...sizes.flatMap((height) => {
        const puzzle = generate({ width, height });
        const solution = puzzle.initial.toString();
        const challenge = PuzzleState.compare(puzzle.toString(), solution);
        return [
          {
            operation: `create`,
            key: getDateKey({ width, height }),
            value: {
              challenge,
              solution
            }
          }
        ];
      })
    ],
    []
  );
  const VERCEL_ACCESS_TOKEN = `h7xVJdZDSuq80z9eMWO5vCvj`;

  const updateEdgeConfig = await fetch(
    `https://api.vercel.com/edge-config/worbik/items`,
    {
      method: `PATCH`,
      headers: new Headers({
        Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`,
        "Content-Type": `application/json`
      }),
      body: JSON.stringify({ items })
    }
  );

  return NextResponse.json(null, {
    status: updateEdgeConfig.status,
    statusText: updateEdgeConfig.statusText
  });
};

export default handler;
