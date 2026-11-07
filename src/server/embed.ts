import { getStamp, getStampColors } from "#utils/stamp";

/**
 * How a link to a shared puzzle looks in Discord, which gives a page more say
 * over its preview than Open Graph does: a layout, and a button.
 *
 * See: https://docs.discord.com/developers/link-previews/component-embeds
 *
 * Discord is strict about these. A payload that it doesn't like can show no
 * preview at all, rather than falling back to the Open Graph tags, so only
 * what's documented is used here. It has to be under 3,000 bytes, with one
 * Container at the top.
 */

const CONTAINER = 17;
const ACTION_ROW = 1;
const BUTTON = 2;
const TEXT_DISPLAY = 10;
const MEDIA_GALLERY = 12;
const LINK_STYLE = 5;

/** Which of a stamp's colors stands for it: a middling shade, that shows up on any background */
const ACCENT_SHADE = 2;

export interface EmbedInput {
  /** The scrambled letters of the puzzle that was shared, which decide the color of its stamp */
  readonly challenge: string;
  /** The width of the puzzle's board */
  readonly width: number;
  /** The first line of the preview */
  readonly title: string;
  /** The second line of the preview */
  readonly description: string;
  /** The address of the card */
  readonly image: string;
  /** What the card shows, for those who can't see it */
  readonly alt: string;
  /** What the button says */
  readonly label: string;
  /** Where the button goes */
  readonly url: string;
}

/** Keeps a name from being read as Discord's formatting, as handles can have underscores in them */
const escapeMarkdown = (text: string): string =>
  text.replaceAll(/[\\*_~`|>]/gu, `\\$&`);

/** Writes the payload of a preview */
export const getDiscordEmbed = ({
  challenge,
  width,
  title,
  description,
  image,
  alt,
  label,
  url
}: EmbedInput): { component: Record<string, unknown> } => {
  const [red, green, blue] = getStampColors(getStamp(challenge, width).hue)[
    ACCENT_SHADE
  ];

  return {
    component: {
      type: CONTAINER,
      // oxlint-disable-next-line no-bitwise -- a color is given to Discord as one number
      accent_color: (red << 16) | (green << 8) | blue,
      components: [
        {
          type: MEDIA_GALLERY,
          items: [{ media: { url: image }, description: alt }]
        },
        {
          type: TEXT_DISPLAY,
          content: `**${escapeMarkdown(title)}**\n${escapeMarkdown(description)}`
        },
        {
          type: ACTION_ROW,
          components: [{ type: BUTTON, style: LINK_STYLE, url, label }]
        }
      ]
    }
  };
};
