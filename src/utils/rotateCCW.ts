import { TransformArr } from "./shuffle";

export const rotateCCW: TransformArr = (arr) => {
  if (arr.length) arr.push(arr.shift()!);
  return arr;
};
