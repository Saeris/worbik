import type { HeadDescriptor } from "void";
import { sizes } from "#utils";

/**
 * What the game's pages say about themselves to search engines, and to
 * whatever else reads them without playing them.
 */

const TAGLINE = `a daily word puzzle`;

/** What the game is, in the fewest words that say it */
const SUMMARY = `Rotate the rows and columns of a grid of letters until every row is a word, in as few moves as you can. Free to play, with new puzzles every day.`;

/** Where Worbik is on Bluesky */
export const BLUESKY_PROFILE = `https://bsky.app/profile/worbik.com`;

/** The puzzle that a visit to the home page plays, which makes its own page a copy of that one */
const DEFAULT_SIZE = `5x5`;

/** Writes data for a page's head, where it's read as a script, so that nothing in it can end that script */
export const toInlineJSON = (data: unknown): string =>
  JSON.stringify(data).replaceAll(`<`, `\\u003c`);

/** Describes the game to search engines in terms that they can show in their results */
const getStructuredData = (origin: string): string =>
  toInlineJSON({
    "@context": `https://schema.org`,
    "@type": `WebApplication`,
    name: `Worbik`,
    url: origin,
    description: SUMMARY,
    image: `${origin}/share-card.png`,
    applicationCategory: `GameApplication`,
    operatingSystem: `Any`,
    browserRequirements: `Requires JavaScript`,
    isAccessibleForFree: true,
    offers: { "@type": `Offer`, price: `0`, priceCurrency: `USD` },
    author: {
      "@type": `Person`,
      name: `Drake Costa`,
      url: `https://saeris.gg`
    },
    sameAs: [BLUESKY_PROFILE]
  });

/**
 * What a page of the game says about itself.
 *
 * Each size of board has a page of its own, with a title and a description
 * of its own. The default size is what the home page plays, so it says that
 * the home page is the one to list.
 */
export const getGameHead = (url: string, size?: string): HeadDescriptor => {
  const { origin } = new URL(url);
  const label = size?.replace(`x`, `×`);
  const title = `Worbik${label ? ` ${label}` : ``}: ${TAGLINE}`;
  const description = label ? `Today’s ${label} puzzle. ${SUMMARY}` : SUMMARY;
  const canonical =
    size && size !== DEFAULT_SIZE ? `${origin}/${size}` : `${origin}/`;

  return {
    title,
    meta: [
      { name: `description`, content: description },
      { property: `og:title`, content: title },
      { property: `og:description`, content: description },
      { property: `og:url`, content: canonical },
      { name: `twitter:title`, content: title },
      { name: `twitter:description`, content: description }
    ],
    link: [{ rel: `canonical`, href: canonical }],
    script: size
      ? []
      : [{ type: `application/ld+json`, innerHTML: getStructuredData(origin) }]
  };
};

/** Lists the pages that are worth a search engine's attention */
export const getSitemap = (origin: string): string => {
  const pages = [
    `/`,
    ...sizes
      .map(([width, height]) => `/${width}x${height}`)
      .filter((page) => page !== `/${DEFAULT_SIZE}`),
    `/terms`,
    `/privacy`
  ];

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...pages.map((page) => `  <url><loc>${origin}${page}</loc></url>`),
    `</urlset>`,
    ``
  ].join(`\n`);
};
