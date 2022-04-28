import { Transform2DArr } from "./shuffle2D";

export const rotate2DCCW: Transform2DArr = (arr) =>
  arr[0].map((_, index) => arr.map((row) => row[row.length - 1 - index]));
