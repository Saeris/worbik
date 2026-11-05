/** A source of random numbers in the range `[0, 1)`, e.g. `Math.random` */
export type Random = () => number;

export const randomInt = (
  min: number,
  max: number,
  random: Random = Math.random
): number =>
  // eslint-disable-next-line no-bitwise
  ((random() * (max - min + 1)) | 0) + min;
