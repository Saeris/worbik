import * as v from "valibot";
import { puzzleSchema } from "../puzzleSchema";

describe(`puzzleSchema`, () => {
  it(`accepts supported sizes as either numbers or numeric strings`, () => {
    // Sizes arrive as strings when they've been parsed out of a URL or puzzle ID
    expect(v.parse(puzzleSchema, { width: `6`, height: 8 })).toStrictEqual({
      width: 6,
      height: 8
    });
    expect(v.parse(puzzleSchema, { width: ` 5 ` })).toStrictEqual({ width: 5 });
    expect(v.parse(puzzleSchema, {})).toStrictEqual({});
  });

  it(`rejects sizes for which no word lists exist`, () => {
    for (const size of [4, 9, `4`, `9`, 5.5, ``, `five`, null]) {
      expect(v.safeParse(puzzleSchema, { width: size }).success).toBe(false);
      expect(v.safeParse(puzzleSchema, { height: size }).success).toBe(false);
    }
  });
});
