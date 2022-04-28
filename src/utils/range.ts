type Range = (size: number, startAt?: number, skip?: number) => number[];

export const range: Range = (length, startAt = 0, skip = 1) =>
  Array.from({ length }, (_, i) => i * skip + startAt);
