import z from "zod";
import { between } from "./between";

const numeric = z
  .preprocess(
    // eslint-disable-next-line no-eq-null
    (value) => (value == null ? value : String(value).trim()),
    z
      .string()
      .min(1, `Expected number or numeric string, received empty string`)
      .refine(
        (s) => {
          const n = Number(s);
          return Number.isFinite(n) && !Number.isNaN(n);
        },
        (v) => ({
          message: `Expected number or numeric string, received '${v}'`
        })
      )
      .transform(Number)
      .refine(
        (v) => between(v, 5, 8),
        (v) => ({
          message: `Value must be between 5 and 8 (inclusive), received ${v}`
        })
      )
  )
  .optional();

export const puzzleSchema = z.object({
  words: numeric,
  size: numeric
});

export type RawPuzzleSchema = z.input<typeof puzzleSchema>;

export type PuzzleSchema = z.infer<typeof puzzleSchema>;
