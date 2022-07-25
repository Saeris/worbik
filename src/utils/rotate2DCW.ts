import type { Transform2DArr } from "./types";

export const rotate2DCW: Transform2DArr = (matrix) =>
  matrix[0].map((_, col) => matrix.map((row) => row[col]).reverse());
