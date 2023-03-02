import { parseSize } from "../parseSize";

describe(`parseSize`, () => {
  it(`can correctly parse size strings`, () => {
    expect(parseSize()).toStrictEqual({ width: 5, height: 5 });
    expect(parseSize(`5x7`)).toStrictEqual({ width: 5, height: 7 });
    expect(parseSize(`9x7`)).toBeUndefined();
    expect(parseSize(`_vercel`)).toBeUndefined();
  });
});
