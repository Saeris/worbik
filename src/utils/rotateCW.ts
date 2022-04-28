import type { TransformArr } from "./types";

export const rotateCW: TransformArr = (arr) => {
  if (arr.length) arr.unshift(arr.pop()!);
  return arr;
};
