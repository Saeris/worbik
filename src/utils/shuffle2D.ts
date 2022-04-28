import { group } from "./group";
import { shuffle } from "./shuffle";

export type Transform2DArr = <T>(arr: T[][]) => T[][];

export const shuffle2D: Transform2DArr = (arr) =>
  group(shuffle(arr.flat()), arr[0].length);
