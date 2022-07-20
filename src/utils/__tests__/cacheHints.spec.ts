import { cacheHints } from "../cacheHints";

describe(`cacheHints`, () => {
  it(`generates a new hints cache`, () => {
    const actual = cacheHints(`erACT`, `Racte`);
    const expected = [`R`, ` `, `A`, `C`, `T`];
    expect(actual).toStrictEqual(expected);
  });
});
