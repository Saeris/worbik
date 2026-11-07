import { randomInt, type Random } from "./randomInt";
import { repeat } from "./repeat";

export const drawFrom = <T extends unknown[], I extends number>(
  arr: T,
  idx: I
): T[I] => arr.splice(idx, 1)[0];

export const drawRandom = <T extends unknown[]>(
  arr: T,
  random?: Random
): T[keyof T] => drawFrom(arr, randomInt(0, arr.length - 1, random));

export const drawNRandom = <T extends unknown[]>(
  arr: T,
  count: number,
  random?: Random
): Array<T[number]> => repeat<T[number]>(count)(() => drawRandom(arr, random));
