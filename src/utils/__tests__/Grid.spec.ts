import { Grid } from "../Grid";

describe(`grid`, () => {
  it(`can be instantiated from an array of strings`, () => {
    // @ts-expect-error
    const actual = new Grid(`abcd`, 2);
    const expected = [
      [`a`, `b`],
      [`c`, `d`]
    ];
    expect(actual.width).toBe(2);
    expect(actual.height).toBe(2);
    expect(actual.size).toBe(4);
    expect(actual.matrix).toStrictEqual(expected);
  });

  it(`can be instantiated from a string`, () => {
    // @ts-expect-error
    const actual = new Grid(`abcd`, 2);
    const expected = [
      [`a`, `b`],
      [`c`, `d`]
    ];
    expect(actual.width).toBe(2);
    expect(actual.height).toBe(2);
    expect(actual.size).toBe(4);
    expect(actual.matrix).toStrictEqual(expected);
  });

  it(`throws if given invalid input`, () => {
    const msg = `Array cannot be evenly divided into groups of `;
    // @ts-expect-error
    expect(() => new Grid(`abc`, 4)).toThrow(msg);
  });

  it(`allows rows/columns to be rotated`, () => {
    // @ts-expect-error
    const grid = new Grid(`abcd`, 2);
    const up = [
      [`c`, `b`],
      [`a`, `d`]
    ];
    expect(grid.rotateColUp(0).matrix).toStrictEqual(up);
    const down = [
      [`c`, `d`],
      [`a`, `b`]
    ];
    expect(grid.rotateColDown(1).matrix).toStrictEqual(down);
    const left = [
      [`d`, `c`],
      [`a`, `b`]
    ];
    expect(grid.rotateRowLeft(0).matrix).toStrictEqual(left);
    const right = [
      [`d`, `c`],
      [`b`, `a`]
    ];
    expect(grid.rotateRowRight(1).matrix).toStrictEqual(right);
  });

  it(`can chain commands`, () => {
    // @ts-expect-error
    const grid = new Grid(`abcd`, 2);
    const expected = `dcba`;
    grid.rotateColUp(0).rotateColDown(1).rotateRowLeft(0).rotateRowRight(1);
    expect(grid.toString()).toStrictEqual(expected);
  });

  it(`serializes`, () => {
    const string = `abcd`;
    // @ts-expect-error
    const grid = new Grid(string, 2);
    const flat = [`a`, `b`, `c`, `d`];
    const obj = {
      matrix: [
        [`a`, `b`],
        [`c`, `d`]
      ],
      width: 2,
      height: 2,
      size: 4
    };
    expect(grid.flat()).toStrictEqual(flat);
    expect(grid.toString()).toStrictEqual(string);
    expect(grid.toJSON()).toStrictEqual(obj);
  });
});
