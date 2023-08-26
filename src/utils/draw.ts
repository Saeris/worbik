import { randomInt } from "./randomInt.ts";
import { repeat } from "./repeat.ts";

export const drawFrom = <T extends unknown[], I extends number>(
  arr: T,
  idx: I
): T[I] => arr.splice(idx, 1)[0];

export const drawRandom = <T extends unknown[]>(arr: T): T[keyof T] =>
  // eslint-disable-next-line no-bitwise
  drawFrom(arr, randomInt(0, arr.length - 1));

export const drawN = <T extends unknown[]>(
  arr: T,
  count: number
): Array<T[number]> => repeat<T[number]>(count)(() => arr.shift() as T[number]);

export const drawNFromBottom = <T extends unknown[]>(
  arr: T,
  count: number
): Array<T[number]> => repeat<T[number]>(count)(() => arr.pop() as T[number]);

export const drawNRandom = <T extends unknown[]>(
  arr: T,
  count: number
): Array<T[number]> => repeat<T[number]>(count)(() => drawRandom(arr));
