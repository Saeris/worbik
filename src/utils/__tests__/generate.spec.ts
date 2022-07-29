import { generate } from "../generate";
import { range } from "../range";

describe(`generate`, () => {
  it(`generates puzzles of various sizes`, () => {
    const mockExpected = (width: number, height: number) =>
      expect.objectContaining({
        current: expect.objectContaining({
          height,
          matrix: expect.arrayContaining<string[]>([]),
          size: width * height,
          width
        }),
        hints: expect.arrayContaining<string[]>([]),
        history: expect.arrayContaining<string>([]),
        initial: expect.objectContaining({
          height,
          matrix: expect.arrayContaining<string[]>([]),
          size: width * height,
          width
        })
      });
    const cases = range(4, 5).flatMap((width, _, vals) =>
      vals.map((height) => [
        generate({ size: width, words: height }),
        mockExpected(width, height)
      ])
    );
    for (const [actual, expected] of cases) {
      expect(actual).toStrictEqual(expected);
    }
  });
});
