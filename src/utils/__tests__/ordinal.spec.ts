import { ordinal } from "../ordinal";

describe(`ordinal`, () => {
  it(`names a place the way it's said aloud`, () => {
    expect([1, 2, 3, 4].map(ordinal)).toStrictEqual([
      `1st`,
      `2nd`,
      `3rd`,
      `4th`
    ]);
  });

  it(`gets the teens right, which don't follow their last digit`, () => {
    expect([11, 12, 13].map(ordinal)).toStrictEqual([`11th`, `12th`, `13th`]);
    expect([21, 22, 23, 101, 111].map(ordinal)).toStrictEqual([
      `21st`,
      `22nd`,
      `23rd`,
      `101st`,
      `111th`
    ]);
  });
});
