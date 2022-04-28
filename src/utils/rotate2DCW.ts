import { Transform2DArr } from "./shuffle2D";

export const rotate2DCW: Transform2DArr = (arr) =>
  arr[0].map((_, index) => arr.map((row) => row[index]).reverse());
