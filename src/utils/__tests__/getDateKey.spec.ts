import { getDateKey, dateKeyRegex } from "../getDateKey";

describe(`getDateKey`, () => {
  it(`generates a cache key based on the current date`, () => {
    const cases = new Map<string, [RegExp, number, number]>([
      [getDateKey(), [dateKeyRegex, 5, 5]],
      [getDateKey({ width: 7 }), [dateKeyRegex, 7, 5]],
      [getDateKey({ height: 8 }), [dateKeyRegex, 5, 8]],
      [getDateKey({ width: 6, height: 7 }), [dateKeyRegex, 6, 7]]
    ]);

    for (const [actual, [regex, width, height]] of cases) {
      expect(actual).toStrictEqual(expect.stringMatching(regex));
      expect(parseInt(regex.exec(actual)!.groups!.width, 10)).toStrictEqual(
        width
      );
      expect(parseInt(regex.exec(actual)!.groups!.height, 10)).toStrictEqual(
        height
      );
    }
  });
});
