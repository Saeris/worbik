import { NextResponse, type NextMiddleware } from "next/server";

export const middleware: NextMiddleware = (req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(`/api/`)) {
    if (
      !req.headers
        .get(`referer`)
        ?.includes(process.env.VERCEL_URL || `localhost`)
    ) {
      return NextResponse.json({ message: `Unauthorized` }, { status: 401 });
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: [`/((?!_next|fonts|examples|svg|[\\w-]+\\.\\w+).*)`]
};
