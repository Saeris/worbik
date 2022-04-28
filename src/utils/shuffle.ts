import type { TransformArr } from "./types";

export const shuffle: TransformArr = (arr) => {
  let len = arr.length;
  if (len === 0) throw Error(`Input Array cannot be empty!`);
  while (--len) {
    const i = Math.floor(Math.random() * (len + 1));
    [arr[len], arr[i]] = [arr[i], arr[len]];
  }

  return arr;
};
