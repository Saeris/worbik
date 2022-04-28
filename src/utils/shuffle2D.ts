import { group } from "./group";
import { shuffle } from "./shuffle";
import type { Transform2DArr } from "./types";

export const shuffle2D: Transform2DArr = (arr) =>
  group(shuffle(arr.flat()), arr[0].length);
