import type { Matrix2D } from "./types";

export const group = <T>(arr: T[], len: number): Matrix2D<T> => {
  const acc: T[][] = [];
  while (arr.length) {
    acc.push(arr.splice(0, len));
  }
  return acc;
};
