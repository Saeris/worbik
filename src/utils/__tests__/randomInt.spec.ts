import { randomInt } from "../randomInt";
import { repeat } from "../repeat";
import { between } from "../between";

describe(`randomInt`, () => {
  it(`generates random integers within given bounds`, () => {
    const cases = new Map([
      [0, 1],
      [1, 1],
      [1, 5],
      [25, 250],
      ...[5, 6, 7, 8].flatMap((min, _, arr) =>
        arr.map((max) => [min, max].sort((a, b) => a - b) as [number, number])
      )
    ]);

    repeat(100)(() => {
      for (const [min, max] of cases) {
        expect(between(randomInt(min, max), min, max)).toBe(true);
        expect(Number.isInteger(randomInt(min, max))).toBe(true);
      }
    });
  });
});
