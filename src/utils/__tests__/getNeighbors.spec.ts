import { getNeighbors } from "../getNeighbors";

const ranking = [`a`, `b`, `c`, `d`, `e`, `f`];
const is =
  (name: string) =>
  (entry: string): boolean =>
    entry === name;

describe(`getNeighbors`, () => {
  it(`shows the top of the ranking to someone who isn't in it`, () => {
    // Before a player has posted a score, the scores to beat are what's worth seeing
    expect(getNeighbors(ranking, is(`z`))).toStrictEqual({
      rows: [`a`, `b`, `c`],
      from: 1
    });
  });

  it(`shows a player the rows on either side of their own`, () => {
    // Where they stand is told by who is just ahead of them and who is just behind
    expect(getNeighbors(ranking, is(`d`))).toStrictEqual({
      rows: [`c`, `d`, `e`],
      from: 3
    });
  });

  it(`still shows a full set of rows to the players at either end`, () => {
    expect(getNeighbors(ranking, is(`a`))).toStrictEqual({
      rows: [`a`, `b`, `c`],
      from: 1
    });
    expect(getNeighbors(ranking, is(`f`))).toStrictEqual({
      rows: [`d`, `e`, `f`],
      from: 4
    });
  });

  it(`shows what there is of a ranking that is shorter than asked for`, () => {
    expect(getNeighbors([`a`, `b`], is(`b`))).toStrictEqual({
      rows: [`a`, `b`],
      from: 1
    });
    expect(getNeighbors([], is(`a`))).toStrictEqual({ rows: [], from: 1 });
  });
});
