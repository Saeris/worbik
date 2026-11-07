import { default as wordlist } from "../../words.json";
import { generate } from "../generate";
import { range } from "../range";
import { seededRandom } from "../seededRandom";

describe(`words`, () => {
  it(`only lists words under the length that they actually are`, () => {
    // A word of the wrong length can't be laid out in a grid, which fails the generation of any puzzle that draws it
    for (const [length, words] of Object.entries(wordlist)) {
      expect(
        words.filter((word) => !new RegExp(`^[a-z]{${length}}$`).test(word))
      ).toStrictEqual([]);
    }
  });
});

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
        // @ts-expect-error
        generate({ width, height }),
        mockExpected(width, height)
      ])
    );
    for (const [actual, expected] of cases) {
      expect(actual).toStrictEqual(expected);
    }
  });

  it(`generates the same puzzle when given the same source of randomness`, async () => {
    // Daily puzzles are derived from a seed, so that every server instance arrives at the same one
    const [first, second, other] = await Promise.all([
      seededRandom(`seed`),
      seededRandom(`seed`),
      seededRandom(`other seed`)
    ]);
    const size = { width: 6, height: 7 } as const;
    const expected = generate(size, first).toChallenge();

    expect(generate(size, second).toChallenge()).toStrictEqual(expected);
    expect(generate(size, other).toChallenge()).not.toStrictEqual(expected);
  });
});
