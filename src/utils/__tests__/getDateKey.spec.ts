import {
  getDateKey,
  dateKeyRegex,
  getExpiredDateKey,
  DateKey,
  filterExpiredDates
} from "../getDateKey";
import { isExpired } from "../isExpired";

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

describe(`filterExpiredDates`, () => {
  it(`can be used to filter edge config keys`, () => {
    const actual = (
      Object.keys({
        foo: null,
        bar: null,
        [getDateKey()]: null,
        [getDateKey({ width: 6, height: 6 })]: null,
        [getDateKey({ width: 7, height: 7 })]: null,
        [`${getExpiredDateKey()}_5x5`]: null,
        [`${getExpiredDateKey()}_6x6`]: null,
        [`${getExpiredDateKey()}_7x7`]: null
      }) as DateKey[]
    ).filter(filterExpiredDates);
    const expected = [
      `${getExpiredDateKey()}_5x5`,
      `${getExpiredDateKey()}_6x6`,
      `${getExpiredDateKey()}_7x7`
    ];

    expect(actual.length).toStrictEqual(3);
    expect(actual).toStrictEqual(expected);
  });
});
