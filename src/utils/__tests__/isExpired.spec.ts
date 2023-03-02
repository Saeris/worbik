import { getDateKey } from "../getDateKey";
import { isExpired } from "../isExpired";
import { getDateFromToday } from "../getDateFromToday";

describe(`isExpired`, () => {
  it(`correctly validates date strings`, () => {
    const invalid = isExpired(getDateKey());
    const valid = isExpired(`${getDateFromToday(-5)}_5x5`); //?

    expect(invalid).toStrictEqual(false);
    expect(valid).toStrictEqual(true);
    expect(() => isExpired(`foo_5x5`)).toThrow(`Could not parse puzzleID: `);
  });
});
