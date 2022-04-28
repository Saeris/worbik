import type { TransformArr } from "./types";

export const rotateCCW: TransformArr = (arr) => {
  if (arr.length) arr.push(arr.shift()!);
  return arr;
};
