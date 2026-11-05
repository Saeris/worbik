import * as v from "valibot";
import type { Size } from "./sizes";

/** Accepts one of the supported sizes, given as either a number or a numeric string */
const size = v.optional(
  v.pipe(
    v.unknown(),
    v.transform((value) =>
      typeof value === `string` && value.trim() ? Number(value) : value
    ),
    v.picklist(
      [5, 6, 7, 8] satisfies Size[],
      `Expected a number or numeric string between 5 and 8 (inclusive)`
    )
  )
);

export const puzzleSchema = v.object({
  width: size,
  height: size
});

export type RawPuzzleSchema = v.InferInput<typeof puzzleSchema>;

export type PuzzleSchema = v.InferOutput<typeof puzzleSchema>;
