import { getStamp, getStampColors, type RGB } from "#utils/stamp";
import { Canvas, measure, type Font } from "./canvas";
import { encodePNG } from "./png";

/**
 * The picture that stands for a shared puzzle, wherever a link to it is
 * pasted. It has to say everything by itself, as many of the places that
 * show it show little else: which puzzle it was, how the player did, and
 * that whoever is looking is invited to try.
 */

export interface CardInput {
  /** The scrambled letters that the puzzle is played from, which its stamp is made from */
  readonly challenge: string;
  /** The width of the puzzle's board */
  readonly width: number;
  /** The height of the puzzle's board */
  readonly height: number;
  /** The day that the puzzle was the day's puzzle, e.g. "Thu, Nov 19" */
  readonly day: string;
  /** Where the game is found, for a card that has no score to show */
  readonly host: string;
  /** The score that the card is for, which is only ever one that the server has verified */
  readonly score?: {
    readonly moves: number;
    /** Who solved it, as they are shown on a leaderboard */
    readonly player: string;
  };
}

/** The size that link previews are shown at */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const BACKGROUND: RGB = [39, 39, 49];
const TEXT: RGB = [250, 251, 255];
const MUTED: RGB = [201, 203, 211];
const ACCENT: RGB = [242, 210, 75];

/** The color halfway between a color and the background, which is what softens the edges of text */
const soften = (color: RGB): RGB => [
  Math.round((color[0] + BACKGROUND[0]) / 2),
  Math.round((color[1] + BACKGROUND[1]) / 2),
  Math.round((color[2] + BACKGROUND[2]) / 2)
];

/** Where each color is in a card's palette. The stamp's own colors come first, after the background. */
const STAMP = 1;
const INK = {
  text: [8, 7],
  muted: [10, 9],
  accent: [12, 11]
} as const;

const getPalette = (hue: number): RGB[] => [
  BACKGROUND,
  ...getStampColors(hue),
  TEXT,
  soften(TEXT),
  MUTED,
  soften(MUTED),
  ACCENT,
  soften(ACCENT)
];

/** The square that the stamp is centered in, whatever its shape */
const STAMP_BOX = { x: 88, y: 99, size: 432 };
const STAMP_GAP = 8;
/** How thick the edge beneath each tile of the stamp is */
const STAMP_EDGE = 4;

/** Where the text begins, and the furthest that it may reach */
const COLUMN = 600;
const LIMIT = CARD_WIDTH - 40;

/** Cuts text short if it would run past the edge of the card */
const fit = (font: Font, text: string): string => {
  if (COLUMN + measure(font, text) <= LIMIT) return text;

  let kept = text;

  while (kept.length > 1 && COLUMN + measure(font, `${kept}...`) > LIMIT) {
    kept = kept.slice(0, -1);
  }

  return `${kept}...`;
};

/** Draws a card, and returns its rows of pixels along with the colors that they are in */
export const drawCard = ({
  challenge,
  width,
  height,
  day,
  host,
  score
}: CardInput): { rows: Uint8Array; palette: RGB[] } => {
  const canvas = new Canvas(CARD_WIDTH, CARD_HEIGHT);
  const { hue, tiles } = getStamp(challenge, width);
  const size = `${width}×${height}`;

  // The stamp, with tiles as large as will fit its longest side into the square
  const tile =
    Math.floor((STAMP_BOX.size + STAMP_GAP) / Math.max(width, height)) -
    STAMP_GAP;
  const left =
    STAMP_BOX.x +
    Math.floor((STAMP_BOX.size - width * (tile + STAMP_GAP) + STAMP_GAP) / 2);
  const top =
    STAMP_BOX.y +
    Math.floor((STAMP_BOX.size - height * (tile + STAMP_GAP) + STAMP_GAP) / 2);

  tiles.forEach((row, y) => {
    row.forEach((shade, x) => {
      const tileX = left + x * (tile + STAMP_GAP);
      const tileY = top + y * (tile + STAMP_GAP);

      canvas.rect(tileX, tileY, tile, tile - STAMP_EDGE, STAMP + shade);
      // Each tile stands on an edge that is a shade darker, as the tiles of the game do
      canvas.rect(
        tileX,
        tileY + tile - STAMP_EDGE,
        tile,
        STAMP_EDGE,
        STAMP + shade + 1
      );
    });
  });

  canvas.text(`brand`, `Worbik`, COLUMN, 112, INK.text);

  if (score) {
    const moves = String(score.moves);
    const unit = score.moves === 1 ? `move` : `moves`;
    const end = canvas.text(`count`, moves, COLUMN, 318, INK.text);

    // A count that is long enough to crowd its unit off of the card goes without
    if (end + 16 + measure(`unit`, unit) <= LIMIT) {
      canvas.text(`unit`, unit, end + 16, 318, INK.text);
    }

    // The target isn't among these: it's kept from anyone who has yet to solve the puzzle, which is who a card is for
    canvas.text(`text`, `${size} · ${day}`, COLUMN, 374, INK.muted);
    canvas.text(`call`, `Can you beat it?`, COLUMN, 510, INK.accent);
    canvas.text(
      `text`,
      fit(`text`, `Solved by ${score.player}`),
      COLUMN,
      556,
      INK.muted
    );
  } else {
    canvas.text(`count`, size, COLUMN, 318, INK.text);
    canvas.text(`text`, day, COLUMN, 374, INK.muted);
    canvas.text(`call`, `Can you solve it?`, COLUMN, 510, INK.accent);
    canvas.text(`text`, fit(`text`, host), COLUMN, 556, INK.muted);
  }

  return { rows: canvas.rows, palette: getPalette(hue) };
};

/** Draws a card, as a PNG file */
export const renderCard = (input: CardInput): Uint8Array<ArrayBuffer> => {
  const { rows, palette } = drawCard(input);

  return encodePNG(CARD_WIDTH, CARD_HEIGHT, rows, palette);
};
