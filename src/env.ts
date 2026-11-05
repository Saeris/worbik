import { defineEnv, string } from "void/env";

export default defineEnv({
  /**
   * Mixed into the seed of every generated puzzle so that solutions
   * can't be derived from the (public) source code and a date alone.
   */
  PUZZLE_SECRET: string()
});
