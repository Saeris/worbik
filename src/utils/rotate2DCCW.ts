import type { Transform2DArr } from "./types";

export const rotate2DCCW: Transform2DArr = (matrix) =>
  matrix[0].map((_, col) => matrix.map((row) => row[row.length - 1 - col]));
