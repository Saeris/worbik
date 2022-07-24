import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { puzzleSchema } from "./utils/puzzleSchema";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  matcher: "/"
};

const toHash = (params: URLSearchParams): Record<string, string> => {
  let hash: Record<string, string> = {};
  params.forEach((val, key) => {
    hash[key] = val;
  });
  return hash;
};

export const middleware: NextMiddleware = (req) => {
  const { words, size } = puzzleSchema.parse(toHash(req.nextUrl.searchParams));
  const url = // First check if words is defined
    words
      ? // yes, then append size if it exists
        `/${words}${size ? `/${size}` : ``}`
      : // no, then default to 5, append size if it exists
      size
      ? `/5/${size}`
      : // neither exist, don't modify URL
        null;
  // Redirect only if we have a URL to redirect to
  if (url) {
    return NextResponse.redirect(new URL(url, req.url));
  }
  return NextResponse.next();
};
