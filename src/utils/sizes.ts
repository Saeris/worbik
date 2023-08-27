import type { Immutable } from "./types.ts";

export type Size = 5 | 6 | 7 | 8;

export type Dimensions = `${Size}x${Size}`;

export const sizes: Immutable<Array<[Size, Size]>> = [
  [5, 5],
  [5, 6],
  [5, 7],
  [5, 8],
  [6, 5],
  [6, 6],
  [6, 7],
  [6, 8],
  [7, 5],
  [7, 6],
  [7, 7],
  [7, 8],
  [8, 5],
  [8, 6],
  [8, 7],
  [8, 8]
] as const;
