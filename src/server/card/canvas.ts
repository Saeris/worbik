import atlas from "./glyphs.json";

/**
 * A picture that is drawn into one pixel at a time, with the few things
 * that a share card is made of: filled rectangles, and text in the styles
 * that `glyphs.json` has letters for.
 */

/** The styles of text that there are letters for */
export type Font = keyof typeof atlas;

/**
 * The letters of each style, by character. Each is how far to move on after
 * it, where its picture sits relative to where the letter is placed, the
 * size of that picture, and the picture itself. They are drawn by a browser,
 * on the `/glyphs` page that exists during development.
 */
const fonts: Record<
  string,
  Record<string, ReadonlyArray<number | string> | undefined>
> = atlas;

interface Glyph {
  readonly advance: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  /** How covered each pixel is, from 0 to 2, packed four to a byte */
  readonly levels: Uint8Array;
}

/** Letters that have been unpacked, so that each is only unpacked the first time it's drawn */
const unpacked = new Map<string, Glyph | null>();

const getGlyph = (font: Font, char: string): Glyph | null => {
  const key = `${font}:${char}`;
  const known = unpacked.get(key);

  if (known !== undefined) return known;

  const entry = fonts[font][char];
  let glyph: Glyph | null = null;

  if (entry) {
    const [advance, left, top, width, height, data] = entry;

    glyph = {
      advance: Number(advance),
      left: Number(left),
      top: Number(top),
      width: Number(width),
      height: Number(height),
      levels: Uint8Array.from(atob(String(data)), (byte) => byte.charCodeAt(0))
    };
  }

  unpacked.set(key, glyph);

  return glyph;
};

/** How wide the given text is when set in the given style, in pixels */
export const measure = (font: Font, text: string): number => {
  let width = 0;

  // A character that there is no letter for takes up no room, as it isn't drawn
  for (const char of text) width += getGlyph(font, char)?.advance ?? 0;

  return width;
};

/* eslint-disable no-bitwise */

export class Canvas {
  readonly width: number;
  readonly height: number;
  /** How many bytes a row of pixels takes up */
  readonly stride: number;
  /**
   * The color of each pixel, row by row, as its place in a palette of up to
   * sixteen colors. Two pixels share a byte, the first of them in its upper
   * half, which is how a PNG stores them. Drawing straight into that saves
   * converting the whole picture afterwards.
   */
  readonly rows: Uint8Array;

  constructor(width: number, height: number, background = 0) {
    this.width = width;
    this.height = height;
    this.stride = Math.ceil(width / 2);
    this.rows = new Uint8Array(this.stride * height).fill(background * 0x11);
  }

  #set(x: number, y: number, color: number): void {
    const index = y * this.stride + (x >> 1);

    this.rows[index] =
      x & 1
        ? (this.rows[index] & 0xf0) | color
        : (this.rows[index] & 0x0f) | (color << 4);
  }

  /** Fills a rectangle with a color, leaving out whatever part of it is outside of the picture */
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ): void {
    let left = Math.max(0, x);
    let right = Math.min(this.width, x + width);
    const top = Math.max(0, y);
    const bottom = Math.min(this.height, y + height);

    if (left >= right) return;

    // A rectangle that begins or ends partway through a byte has that pixel set by itself, and the rest are filled whole bytes at a time
    const first = left & 1 ? left++ : -1;
    const last = right & 1 ? --right : -1;

    for (let row = top; row < bottom; row++) {
      if (first >= 0) this.#set(first, row, color);
      if (last >= 0) this.#set(last, row, color);
      this.rows.fill(
        color * 0x11,
        row * this.stride + (left >> 1),
        row * this.stride + (right >> 1)
      );
    }
  }

  /**
   * Draws a line of text that starts at `x` and sits on `baseline`, and
   * returns where it ends.
   *
   * Text takes two colors: its own, and one that is halfway to whatever is
   * behind it, which softens its edges.
   */
  text(
    font: Font,
    text: string,
    x: number,
    baseline: number,
    [soft, solid]: readonly [soft: number, solid: number]
  ): number {
    let cursor = x;

    for (const char of text) {
      const glyph = getGlyph(font, char);

      if (glyph) {
        this.#draw(
          glyph,
          cursor + glyph.left,
          baseline - glyph.top,
          soft,
          solid
        );
        cursor += glyph.advance;
      }
    }

    return cursor;
  }

  #draw(glyph: Glyph, x: number, y: number, soft: number, solid: number): void {
    const { width, height, levels } = glyph;

    for (let row = 0; row < height; row++) {
      if (y + row >= 0 && y + row < this.height) {
        for (let column = 0; column < width; column++) {
          const pixel = row * width + column;
          // How covered this pixel is, which is kept in two bits
          const level = (levels[pixel >> 2] >> ((pixel & 3) * 2)) & 3;

          if (level && x + column >= 0 && x + column < this.width) {
            this.#set(x + column, y + row, level === 2 ? solid : soft);
          }
        }
      }
    }
  }
}

/* eslint-enable no-bitwise */
