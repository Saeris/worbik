import type { HeadDescriptor } from "void";
import { getPuzzleStart, parseSize } from "#utils";
import { getDiscordEmbed } from "./embed";
import { getPuzzle } from "./puzzles";
import { getScore } from "./scores";
import { toInlineJSON } from "./seo";

/**
 * What a shared link is about: a puzzle, and the score that someone
 * earned on it if the link is to their result.
 *
 * A link only ever carries a score that the server has verified. Anyone can
 * write a link that names any player, so the score is looked up rather than
 * taken from the link, and a link to a score that was never posted is a
 * link to the puzzle alone.
 */
export interface Share {
  /** The ID of the puzzle that was shared */
  readonly puzzle: string;
  /** The size of its board, e.g. "5×5" */
  readonly size: string;
  /** The day that it was the day's puzzle, e.g. "Thu, Nov 19" */
  readonly day: string;
  /** The scrambled letters that it's played from */
  readonly challenge: string;
  readonly score: {
    readonly moves: number;
    /** Who solved it, as they are shown on a leaderboard */
    readonly player: string;
  } | null;
}

const dayFormat = new Intl.DateTimeFormat(`en-US`, {
  weekday: `short`,
  month: `short`,
  day: `numeric`,
  // A puzzle's day is named for the date that it begins on, wherever it's being read
  timeZone: `UTC`
});

/**
 * Looks up what a shared link is about, or `null` if it isn't a link to a
 * puzzle that there has been.
 *
 * The player is named by their handle, or by their identity if they have no
 * handle that could be confirmed.
 */
export const getShare = async (
  puzzleID: string,
  player?: string
): Promise<Share | null> => {
  const puzzle = await getPuzzle(puzzleID);

  if (!puzzle) return null;

  const [, challenge] = puzzle;
  const score = player ? await getScore(puzzleID, player) : null;

  return {
    puzzle: puzzleID,
    size: puzzleID.split(`_`)[1].replace(`x`, `×`),
    day: dayFormat.format(new Date(getPuzzleStart(puzzleID))),
    challenge,
    score: score && {
      moves: score.moves,
      player: score.handle ? `@${score.handle}` : score.did
    }
  };
};

/** Where the picture for a shared link is served from */
export const getCardURL = (
  origin: string,
  puzzleID: string,
  player?: string
): string =>
  `${origin}/api/card?${new URLSearchParams({ puzzle: puzzleID, ...(player && { player }) }).toString()}`;

/**
 * What a shared link says about itself to the apps that it's pasted into.
 *
 * The picture carries the message, and the words repeat it for the apps
 * that don't show pictures, and for anyone who can't see one.
 */
export const getShareHead = (
  url: string,
  share: Share | null,
  player?: string
): HeadDescriptor => {
  if (!share) return {};

  const { origin } = new URL(url);
  const { size, day, score } = share;
  const title = score
    ? `${score.player} solved Worbik ${size} in ${score.moves} ${score.moves === 1 ? `move` : `moves`}`
    : `Worbik ${size} · ${day}`;
  const description = `${score ? `Can you beat it?` : `Can you solve it?`} Play today’s ${size}.`;
  const image = getCardURL(origin, share.puzzle, score ? player : undefined);
  const alt = `${title}. ${description}`;
  const [, dimensions] = share.puzzle.split(`_`);
  const embed = getDiscordEmbed({
    challenge: share.challenge,
    width: parseSize(dimensions).width,
    title,
    description,
    image,
    alt,
    label: `Play today’s ${size}`,
    url: `${origin}/${dimensions}`
  });

  return {
    title,
    meta: [
      // A link to someone's result is for sharing, and is a copy of the game as far as a search engine is concerned
      { name: `robots`, content: `noindex` },
      { name: `description`, content: description },
      { property: `og:title`, content: title },
      { property: `og:description`, content: description },
      { property: `og:url`, content: url },
      { property: `og:image`, content: image },
      { property: `og:image:width`, content: `1200` },
      { property: `og:image:height`, content: `630` },
      { property: `og:image:alt`, content: alt },
      { name: `twitter:title`, content: title },
      { name: `twitter:description`, content: description },
      { name: `twitter:image`, content: image }
    ],
    script: [
      {
        id: `discord:component-embed`,
        type: `application/json`,
        innerHTML: toInlineJSON(embed)
      }
    ]
  };
};
