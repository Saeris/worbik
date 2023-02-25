import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

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

  const { searchParams } = new URL(req.url);
  const key = searchParams.get(`key`);

  if (typeof key !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "key" parameter`
    });
  }

  const pair = await get<{
    challenge: string;
    solution: string;
  }>(key);

  if (
    typeof pair?.challenge !== `string` ||
    typeof pair.solution !== `string`
  ) {
    return NextResponse.json(null, {
      status: 500,
      statusText: `Could not retrieve value for ${key}.`
    });
  }

  return NextResponse.json(pair, {
    status: 200,
    headers: {
      "Cache-Control": `max-age=0, s-maxage=86400`
    }
  });
};

export default handler;
