export const randomInt = (min: number, max: number): number =>
  // eslint-disable-next-line no-bitwise
  (Math.random() * max + min) | 0;
