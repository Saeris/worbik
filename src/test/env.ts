/** Stands in for `void/env` in tests. A secret of their own is all that they need of it. */
export const env: { PUZZLE_SECRET: string; PUZZLE_SCRAMBLE?: number } = {
  PUZZLE_SECRET: `secret`
};
