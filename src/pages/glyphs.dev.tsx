import { useEffect, useState } from "react";
import styles from "./glyphs.module.css";

/**
 * Builds the letters that the server draws share cards with.
 *
 * A Worker has no way to draw text: it has no fonts, and nothing to render
 * them with. So the letters that a card needs are drawn here, by a browser,
 * and saved as small pictures that the server pieces text together from.
 * This page only exists in development. When the wording of a card or the
 * font changes, open it and save what it shows as
 * `src/server/card/glyphs.json`.
 */

const FAMILY = `"Montserrat Variable"`;

/** Every character that can appear in a handle, a date, or a size of board */
const TEXT = `${Array.from({ length: 94 }, (_, index) => String.fromCodePoint(33 + index)).join(``)}×·`;

/** Each style of text that a card is set in, and the characters that it's needed for */
const FONTS = {
  /** The number of moves, or the size of the board */
  count: { size: 208, weight: 300, chars: `0123456789×` },
  /** What the count is a count of */
  unit: { size: 60, weight: 400, chars: `moves` },
  /** The name of the game */
  brand: { size: 44, weight: 700, chars: `Worbik` },
  /** The invitation to play */
  call: { size: 40, weight: 500, chars: `Canyoubeatit?solve` },
  /** Everything else */
  text: { size: 30, weight: 300, chars: TEXT }
} as const;

/**
 * A letter as the server draws it: how far to move on after it, where its
 * picture sits relative to where the letter is placed, the size of that
 * picture, and the picture itself.
 */
type Glyph = [
  advance: number,
  left: number,
  top: number,
  width: number,
  height: number,
  data: string
];

/**
 * Draws one character, and reduces it to three levels: empty, half covered,
 * and covered. Those are packed four pixels to a byte. The half level is
 * what softens the edges of a letter, in a picture that only has a few
 * colors to spare.
 */
const draw = (
  context: CanvasRenderingContext2D,
  char: string,
  size: number
): Glyph => {
  const metrics = context.measureText(char);
  const left = -Math.ceil(metrics.actualBoundingBoxLeft) - 1;
  const top = Math.ceil(metrics.actualBoundingBoxAscent) + 1;
  const width = Math.ceil(metrics.actualBoundingBoxRight) - left + 1;
  const height = top + Math.ceil(metrics.actualBoundingBoxDescent) + 1;
  const advance = Math.round(metrics.width);

  context.clearRect(0, 0, size * 2, size * 2);
  context.fillText(char, -left, top);

  const { data } = context.getImageData(0, 0, width, height);
  const packed = new Uint8Array(Math.ceil((width * height) / 4));

  for (let pixel = 0; pixel < width * height; pixel++) {
    const alpha = data[pixel * 4 + 3];
    const level = alpha < 64 ? 0 : alpha < 192 ? 1 : 2;
    // oxlint-disable-next-line no-bitwise -- packs each two-bit level into its place in a byte
    packed[pixel >> 2] |= level << ((pixel & 3) * 2);
  }

  return [
    advance,
    left,
    top,
    width,
    height,
    btoa(String.fromCodePoint(...packed))
  ];
};

const build = async (): Promise<string> => {
  const canvas = document.createElement(`canvas`);
  const context = canvas.getContext(`2d`, { willReadFrequently: true });

  if (!context) throw new Error(`This browser can't draw to a canvas`);

  const atlas: Record<string, Record<string, Glyph>> = {};

  for (const [name, { size, weight, chars }] of Object.entries(FONTS)) {
    const font = `${weight} ${size}px ${FAMILY}`;
    // Fonts are only fetched once something is set in them, which nothing on this page is
    // oxlint-disable-next-line no-await-in-loop -- each font has to have loaded before it's drawn with
    await document.fonts.load(font, chars);
    canvas.width = size * 2;
    canvas.height = size * 2;
    context.font = font;
    context.fillStyle = `#000`;
    context.textBaseline = `alphabetic`;
    atlas[name] = Object.fromEntries(
      [...new Set([...chars.split(``), ` `])].map((char) => [
        char,
        draw(context, char, size)
      ])
    );
  }

  return JSON.stringify(atlas);
};

const Page: React.FC = () => {
  const [atlas, setAtlas] = useState(``);

  useEffect(() => {
    const show = async (): Promise<void> => {
      setAtlas(await build());
    };

    void show();
  }, []);

  return (
    <main className={styles.main}>
      <h1>Card letters</h1>
      <p>
        Save this as <code>src/server/card/glyphs.json</code> whenever the
        wording of a share card or its font changes.
      </p>
      <textarea
        readOnly
        value={atlas}
        aria-label="The letters, as JSON"
        placeholder="Drawing…"
      />
    </main>
  );
};

export default Page;
