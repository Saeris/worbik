import { drawFrom, drawNRandom, drawRandom } from "../draw";
import { repeat } from "../repeat";

describe(`drawFrom`, () => {
  it(`draws from the given index`, () => {
    const arr = [1, 2, 3, 4];
    const expected = [1, 2, 4];
    expect(drawFrom(arr, 2)).toBe(3);
    expect(arr).toHaveLength(3);
    expect(arr).toStrictEqual(expected);
  });
});

describe(`drawRandom`, () => {
  it(`draws a random value from an array`, () => {
    repeat(100)(() => {
      const arr = [1, 2, 3, 4, 5];
      const actual = drawRandom(arr);
      expect(arr).not.toContain(actual);
      expect(arr).toHaveLength(4);
    });
  });
});

describe(`drawNRandom`, () => {
  it(`draws a random value from an array`, () => {
    repeat(100)(() => {
      const arr = [1, 2, 3, 4, 5];
      const actual = drawNRandom(arr, 3);
      expect(actual).toHaveLength(3);
      expect(arr).not.toContain(actual);
      expect(arr).toHaveLength(2);
    });
  });
});
