import type { NextMiddleware } from "next/server";
import { solution } from "../../../solution";

export const middleware: NextMiddleware = (req) => {
  if (req.method !== `GET`) {
    return new Response(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const query = new URL(req.url).searchParams.get(`solution`);

  if (typeof query !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid value for "url" parameter`
    });
  }

  const answer = solution.flat().join(``);

  return new Response(
    JSON.stringify(
      {
        s: query
          .toLowerCase()
          .split(``)
          .map((c, i) => (answer.charAt(i) === c ? c.toUpperCase() : c))
          .join(``),
        c: solution[0].length
      },
      null,
      2
    ),
    {
      status: 200,
      headers: new Headers({
        "content-type": `application/json;charset=UTF-8`
      })
    }
  );
};
