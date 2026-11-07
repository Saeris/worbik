import { defineEnv, number, string } from "void/env";

export default defineEnv({
  /**
   * Mixed into the seed of every generated puzzle so that solutions
   * can't be derived from the (public) source code and a date alone.
   */
  PUZZLE_SECRET: string(),
  /**
   * How many moves to scramble a new puzzle with, instead of a number left
   * to chance. Only for development, where a puzzle that takes one move to
   * solve is quicker to test with than a fair one.
   */
  PUZZLE_SCRAMBLE: number().optional()
});
