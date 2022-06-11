import { range } from "./range";

export type Repeat = <U>(
  count: number
) => (fn: (value: number, index: number, array: number[]) => U) => U[];

export const repeat: Repeat = (count) => (fn) => range(count).map(fn);
