import type { NextMiddleware } from "next/server";

export const middleware: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return new Response(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const guess = new URL(req.url).searchParams.get(`guess`);
  const challenge = new URL(req.url).searchParams.get(`challenge`);

  if (typeof guess !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid value for "guess" parameter`
    });
  }

  if (typeof challenge !== `string`) {
    return new Response(null, {
      status: 400,
      statusText: `Received invalid value for "challenge" parameter`
    });
  }

  const url = new URL(`http://localhost:3001/api/cacheGet`);
  url.searchParams.set(`key`, challenge);
  const solution: string = await (await fetch(url.href)).json();

  return new Response(
    guess
      .toLowerCase()
      .split(``)
      .map((c, i) => (solution.charAt(i) === c ? c.toUpperCase() : c))
      .join(``),
    {
      status: 200,
      headers: new Headers({
        "content-type": `application/json;charset=UTF-8`
      })
    }
  );
};
