import type { Transform2DArr } from "./types";

export const rotate2DCCW: Transform2DArr = (arr) =>
  arr[0].map((_, index) => arr.map((row) => row[row.length - 1 - index]));
