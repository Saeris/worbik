import type { Transform2DArr } from "./types";

export const rotate2DCW: Transform2DArr = (arr) =>
  arr[0].map((_, index) => arr.map((row) => row[index]).reverse());
