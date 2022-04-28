export const range = (
  length: number,
  startAt: number = 0,
  skip: number = 1
): number[] => Array.from({ length }, (_, i) => i * skip + startAt);
