import { NextResponse, type NextMiddleware } from "next/server";
import { getDomains } from "./utils";

export const middleware: NextMiddleware = async (req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(`/api/`)) {
    // This is the URL of the page sending the request to the API
    const referer = req.headers.get(`referer`);
    const hosts = {
      production: async () => [process.env.VERCEL_URL, ...(await getDomains())],
      preview: () => [
        `${
          process.env.VERCEL_GIT_REPO_SLUG
        }-git-${process.env.VERCEL_GIT_COMMIT_REF.replace(
          /(?<punctuation>\W)+/g,
          `-`
        )}-${process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN.toLowerCase()}.vercel.app`
      ],
      development: () => [`localhost`]
    } as const;
    // The referer must match a valid host or the request is bounced
    if (
      !(await hosts[process.env.VERCEL_ENV]()).some((host) =>
        referer?.includes(host)
      )
    ) {
      // eslint-disable-next-line no-console
      console.log({ referer, hosts });
      return NextResponse.json({ message: `Unauthorized` }, { status: 401 });
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: [`/((?!_next|fonts|examples|svg|[\\w-]+\\.\\w+).*)`]
};
