import { NextResponse, type NextMiddleware } from "next/server";

export const middleware: NextMiddleware = (req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(`/api/`)) {
    const referer = req.headers.get(`referer`);
    const host = process.env.VERCEL_URL || `localhost`;
    if (!referer?.includes(host)) {
      // eslint-disable-next-line no-console
      console.log({ referer, host });
      return NextResponse.json({ message: `Unauthorized` }, { status: 401 });
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: [`/((?!_next|fonts|examples|svg|[\\w-]+\\.\\w+).*)`]
};
