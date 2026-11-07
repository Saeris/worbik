/**
 * A puzzle's stamp: a small mosaic that is the same for everyone who plays
 * that puzzle, and different for every puzzle.
 *
 * It's what a puzzle looks like from the outside, on a card that is shared
 * or anywhere else that a puzzle is referred to without being shown. It
 * takes the shape of the puzzle's board, and its color and pattern come from
 * the scrambled letters that every player is given. Nothing about it comes
 * from the solution, so it can be shown to someone who hasn't played yet.
 */
export interface Stamp {
  /** The hue that every tile of the stamp is a shade of, in degrees */
  readonly hue: number;
  /** Which shade each tile is, row by row, from 0 (the lightest) to `SHADES - 1` */
  readonly tiles: ReadonlyArray<readonly number[]>;
}

export type RGB = readonly [red: number, green: number, blue: number];

/**
 * The shades that a stamp's tiles come in, as the lightness and chroma of
 * an OKLCH color. They step evenly in lightness, as the tiles of the game
 * do, so that the pattern holds up for those who can't tell its hue apart.
 * The last isn't used for a tile: it's the edge beneath the darkest of them.
 */
const SHADES_OKLCH = [
  [0.93, 0.04],
  [0.84, 0.09],
  [0.72, 0.14],
  [0.58, 0.15],
  [0.44, 0.12],
  [0.3, 0.08]
] as const;

/** How many shades a stamp's tiles come in */
export const SHADES = SHADES_OKLCH.length - 1;

/* eslint-disable no-bitwise */

/** Reduces text to a number, such that any change to the text gives an unrelated one (FNV-1a) */
const hash = (text: string): number => {
  let result = 0x811c9dc5;

  for (let index = 0; index < text.length; index++) {
    result = Math.imul(result ^ text.charCodeAt(index), 0x01000193);
  }

  return result >>> 0;
};

/** A sequence of numbers that is always the same for the same seed (mulberry32) */
const sequence = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return (next ^ (next >>> 14)) >>> 0;
  };
};

/* eslint-enable no-bitwise */

/**
 * Makes the stamp of a puzzle from the scrambled letters that it's played
 * from, and the width of its board.
 *
 * Each row is mirrored about its middle, as a pattern with some symmetry
 * to it reads as a design, where one without reads as noise.
 */
export const getStamp = (challenge: string, width: number): Stamp => {
  // Letters that begin in place are given in uppercase, which is the solution showing through
  const next = sequence(hash(challenge.toLowerCase()));
  const hue = next() % 360;
  const height = Math.ceil(challenge.length / width);
  const half = Math.ceil(width / 2);

  return {
    hue,
    tiles: Array.from({ length: height }, () => {
      const left = Array.from({ length: half }, () => next() % SHADES);

      return Array.from(
        { length: width },
        (_, column) => left[Math.min(column, width - 1 - column)]
      );
    })
  };
};

/** Converts an OKLCH color to sRGB, with each channel from 0 to 255 */
const toRGB = (lightness: number, chroma: number, hue: number): RGB => {
  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channel = (linear: number): number => {
    const encoded =
      linear <= 0.0031308
        ? 12.92 * linear
        : 1.055 * linear ** (1 / 2.4) - 0.055;

    // A color that sRGB can't show is brought to the nearest one that it can
    return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
  };

  return [
    channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  ];
};

/**
 * The colors of a stamp of the given hue, lightest first. A tile of shade
 * `n` is colored with the `n`th of these, and its edge with the one after.
 */
export const getStampColors = (hue: number): readonly RGB[] =>
  SHADES_OKLCH.map(([lightness, chroma]) => toRGB(lightness, chroma, hue));
