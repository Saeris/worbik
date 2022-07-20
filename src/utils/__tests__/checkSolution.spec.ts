import { checkSolution } from "../checkSolution";

describe(`checkSolution`, () => {
  it(`uppercases letters for partial matches`, () => {
    const actual = checkSolution(`racet`, `react`);
    const expected = `RaceT`;
    expect(actual).toStrictEqual(expected);
  });
});
