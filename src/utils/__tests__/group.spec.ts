import { group } from "../group";

const raw = `correctchartercabaretcertifywroughtgriddleenlarge`;

describe(`group`, () => {
  it(`correctly groups a source array into equal segments`, () => {
    const actual = group(raw.split(``), 7);
    const expected = [
      [`c`, `o`, `r`, `r`, `e`, `c`, `t`],
      [`c`, `h`, `a`, `r`, `t`, `e`, `r`],
      [`c`, `a`, `b`, `a`, `r`, `e`, `t`],
      [`c`, `e`, `r`, `t`, `i`, `f`, `y`],
      [`w`, `r`, `o`, `u`, `g`, `h`, `t`],
      [`g`, `r`, `i`, `d`, `d`, `l`, `e`],
      [`e`, `n`, `l`, `a`, `r`, `g`, `e`]
    ];
    expect(actual).toStrictEqual(expected);
  });

  it(`throws when the array can't be grouped by the given width`, () => {
    expect(() => group(raw.split(``), 6)).toThrow(
      `Array cannot be evenly divided into groups of `
    );
  });
});
