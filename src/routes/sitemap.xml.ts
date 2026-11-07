import { defineHandler } from "void";
import { getSitemap } from "#server/seo";

/** Lists the game's pages for search engines */
export const GET = defineHandler((c) =>
  c.body(getSitemap(new URL(c.req.url).origin), 200, {
    "content-type": `application/xml; charset=utf-8`
  })
);
