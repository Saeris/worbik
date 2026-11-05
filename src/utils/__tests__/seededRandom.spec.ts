import { between } from "../between";
import { repeat } from "../repeat";
import { seededRandom } from "../seededRandom";

describe(`seededRandom`, () => {
  it(`yields the same sequence of numbers for the same seed`, async () => {
    const [first, second] = await Promise.all([
      seededRandom(`secret:03-02-2026_5x5`),
      seededRandom(`secret:03-02-2026_5x5`)
    ]);

    expect(repeat(100)(first)).toStrictEqual(repeat(100)(second));
  });

  it(`yields unrelated sequences for similar seeds`, async () => {
    const [today, tomorrow] = await Promise.all([
      seededRandom(`secret:03-02-2026_5x5`),
      seededRandom(`secret:03-03-2026_5x5`)
    ]);

    expect(repeat(100)(today)).not.toStrictEqual(repeat(100)(tomorrow));
  });

  it(`can stand in for Math.random`, async () => {
    const random = await seededRandom(`seed`);

    for (const value of repeat<number>(1000)(random)) {
      // 1 is excluded, as it would index past the end of whatever is being drawn from
      expect(between(value, 0, 1) && value !== 1).toBe(true);
    }
  });
});
