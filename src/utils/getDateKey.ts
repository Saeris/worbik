import type { PuzzleSchema } from "./puzzleSchema";

export const dateKeyRegex = /^(?<date>(?:\d+?-?)+)_(?<width>\d)x(?<height>\d)$/;

export const getDateKey = ({
  width = 5,
  height = 5
}: PuzzleSchema = {}): `${string}_${number}x${number}` =>
  `${new Date()
    .toLocaleDateString(`en-US`, {
      month: `2-digit`,
      day: `2-digit`,
      year: `numeric`
    })
    .replaceAll(`/`, `-`)}_${width}x${height}`;
