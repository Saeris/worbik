import { getDateKey, getExpiredDateKey } from "../getDateKey";
import { isExpired } from "../isExpired";

describe(`isExpired`, () => {
  it(`correctly validates date strings`, () => {
    const invalid = isExpired(getDateKey());
    const valid = isExpired(`${getExpiredDateKey()}_5x5`);

    expect(invalid).toStrictEqual(false);
    expect(valid).toStrictEqual(true);
    expect(() => isExpired(`foo_5x5`)).toThrow();
  });
});
