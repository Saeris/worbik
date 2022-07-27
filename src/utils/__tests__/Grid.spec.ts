import { Grid } from "../Grid";

describe(`Grid`, () => {
  it(`can be instantiated from an array of strings`, () => {
    const actual = new Grid([`a`, `b`, `c`, `d`], 2);
    const expected = [
      [`a`, `b`],
      [`c`, `d`]
    ];
    expect(actual.width).toStrictEqual(2);
    expect(actual.height).toStrictEqual(2);
    expect(actual.size).toStrictEqual(4);
    expect(actual.matrix).toStrictEqual(expected);
  });

  it(`can be instantiated from a string`, () => {
    const actual = Grid.fromString(`2abcd`);
    const expected = [
      [`a`, `b`],
      [`c`, `d`]
    ];
    expect(actual.width).toStrictEqual(2);
    expect(actual.height).toStrictEqual(2);
    expect(actual.size).toStrictEqual(4);
    expect(actual.matrix).toStrictEqual(expected);
  });

  it(`throws if given invalid input`, () => {
    const msg = `Array cannot be evenly divided into groups of `;
    expect(() => new Grid([`a`, `b`, `c`], 4)).toThrow(msg);
    expect(() => Grid.fromString(`4abc`)).toThrow(msg);
    expect(() => Grid.fromString(`foo`)).toThrow(
      `Could not parse string into a Grid!`
    );
  });

  it(`allows rows/columns to be rotated`, () => {
    const grid = Grid.fromString(`2abcd`);
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
    const grid = Grid.fromString(`2abcd`);
    const expected = `2dcba`;
    grid.rotateColUp(0).rotateColDown(1).rotateRowLeft(0).rotateRowRight(1);
    expect(grid.toString()).toStrictEqual(expected);
  });

  it(`serializes`, () => {
    const string = `2abcd`;
    const grid = Grid.fromString(string);
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
